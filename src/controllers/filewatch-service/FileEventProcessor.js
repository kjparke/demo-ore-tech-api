const fs = require("fs");
const constants = require("../../constants/constants");
const EventEmitter = require("events");
const eventController = require("./EventController");
const {
  readAHSAssets,
  createAHSAsset,
  deleteAHSAsset,
} = require("../AHSAssetController");
const { readAssets } = require("../AssetController");
const {
  createSecondaryStatus,
  readOneSecondaryStatus,
} = require("../SecondaryStatusController");
const { readOneEvent } = require("../EventController");
const { createPhysicalAvailabilityRecord } = require("../PhysicalAvailability");

/* 
DESCRIPTION: This file processor watches the folder containing the output of the python script and manipulates data in the Ore-Tech db accordingly.
WORK PLANNED: Separate this service from the API; Run as a separate and independent web service. 
FEATURES: 
1. Watches for changes in the file. If there are any changes to an assets' status, refreshed time, secondary status or hours in status then it will update the mongodb database and send a message to the frontend triggering a refresh of the dashboard. 
2. If an asset is down in the file but operational in the mongodb database
3. If an asset is operational in the file but down in the mongodb database the follwowing checks are done:
    a. Check that has releaseToOps field is false.
    b. Checks the isManualImport is false.
    c. If the above conditions are both true, the file watcher will change the status of the asset to operational.
*/

class FileEventProcessor extends EventEmitter {
  constructor(fleetStatusDir, assetManager) {
    super();
    this.fleetStatusDir = fleetStatusDir;
    this.assetManager = assetManager;
  }
  
  async processFileEvent(eventType, filename) {
    if (!this.isValidEvent(eventType)) {
      return this.logFileMissing();
    }

    try {
      if (!fs.existsSync(this.fleetStatusDir)) return;
      if (filename) this.logFilename(filename);

      const data = fs.readFileSync(this.fleetStatusDir, "utf-8");
      var json = JSON.parse(data);
      await this.processJsonData(json);
    } catch (error) {
      console.error({ Error: error.message });
    }
  }

  isValidEvent(eventType) {
    return [constants.FS_CHANGE, constants.FS_RENAME].includes(eventType);
  }

  logFileMissing() {
    console.log("Fleet status file has been moved or deleted.");
  }

  logFilename(filename) {
    console.log("Filename provided: " + filename);
  }

  async processJsonData(json) {
    if (!Array.isArray(json)) {
      console.error({ Error: "Fleet status data file is not an array" });
      return;
    }

    // Filter out vehicles with null or undefined unitId and those in EXCLUDED_ASSETS
    json = json
        .filter((vehicle) => vehicle.unitId && !constants.EXCLUDED_ASSETS.includes(vehicle.unitId))
        .map(this.mapVehicleStatus);

    // Remove null values returned by mapVehicleStatus
    json = json.filter((vehicle) => vehicle !== null);


    const jsonMap = this.mapFleetData(json);
    const assetMap = this.mapFleetData(await readAssets(true));

    await this.processAssetState(jsonMap, assetMap);
    // May no longer need with all Autonomous vehicles loaded into Ore-Tech. 
    // await this.processAHSAssets(assetMap);
    await this.processSecondaryStatus(assetMap);
    await createPhysicalAvailabilityRecord(jsonMap);
  }

  async processAssetState(jsonMap, assetMap) {
    for (const [unitId, jsonAsset] of jsonMap.entries()) {
      const dbAsset = assetMap.get(unitId);
      let logText = "FLEET STATUS FILE CHANGE DETECTED: ";

      if (!dbAsset) {
        await this.assetManager.createNewAssetAndEvent(jsonAsset);
        this.emit("assetCreated", { Message: "asset-event-created" });
        continue;
      }

      /* CONDITIONS FOR UPDATING AN EVENT */
      const currentActiveEventId = dbAsset.activeEvent
        ? dbAsset.activeEvent._id
        : null;
      const statusChanged = dbAsset.status !== jsonAsset.status;
      const secondaryStatusChanged =
        dbAsset.activeEvent &&
        dbAsset.activeEvent.secondaryStatus !== jsonAsset.secondaryStatus;

      const isExternalDBChangesObserved =
        dbAsset.activeEvent &&
        dbAsset.activeEvent.isStatusChangeManual === false;

      /* UPDATE EVENT STATE */
      try {
        if (
          isExternalDBChangesObserved &&
          (statusChanged || secondaryStatusChanged)
        ) {
          if (
            this.assetManager.isAssetOperational(jsonAsset.status) &&
            this.assetManager.isAssetDown(dbAsset.status)
          ) {
            if (
              dbAsset.activeEvent.isStatusChangeManual &&
              this.assetManager.isAssetDown(jsonAsset.status)
            ) {
              /* Ignore changes in file for manually added assets. */
              continue;
            } else {
              /* Remove active event from asset and creates new operational event record. */
              await this.assetManager.updateToOperational(jsonAsset, dbAsset);
            }
          } else if (
            this.assetManager.isAssetDown(jsonAsset.status) &&
            this.assetManager.isAssetDown(dbAsset.status)
          ) {
            await this.assetManager.updateActiveEvent(jsonAsset, dbAsset);
          } else if (
            jsonAsset.status.toLowerCase() === "exc" &&
            this.assetManager.isAssetDown(dbAsset.status)
          ) {
            /* Update to a new EXC event */
            await this.assetManager.updateToEXC(jsonAsset, dbAsset);
            continue;
          }
        } else if (dbAsset.activeEvent === null) {
          const operationalEvent = await eventController.findLatestOperational(
            jsonAsset.unitId
          );
          const opStatusChanged =
            operationalEvent && operationalEvent.status !== jsonAsset.status;
          const opSecondaryStatusChanged =
            operationalEvent &&
            operationalEvent.secondaryStatus !== jsonAsset.secondaryStatus;
          const isManualRelease =
            operationalEvent &&
            operationalEvent.status === constants.OPERATIONAL_MANUAL_RELEASE;

          /* OPERATIONAL MANUAL RELEASE */
          if (
            isManualRelease &&
            this.assetManager.isAssetDown(jsonAsset.status)
          ) {
            if (
              isManualRelease &&
              this.hasTwentyMinutesPassed(operationalEvent.createdAt)
            ) {
              await this.assetManager.updateToDown(jsonAsset);
            }
            continue;
          } else if (
            jsonAsset.status.toLowerCase() === "exc" &&
            this.assetManager.isAssetOperational(dbAsset.status)
          ) {
            await this.assetManager.updateToEXC(jsonAsset, dbAsset);
          } else if (
            /* NORMAL OPERATIONAL EVENTS */
            operationalEvent &&
            (opStatusChanged || opSecondaryStatusChanged)
          ) {
            if (
              this.assetManager.isAssetDown(jsonAsset.status) &&
              this.assetManager.isAssetOperational(dbAsset.status)
            ) {
              await this.assetManager.updateToDown(jsonAsset);
            } else if (
              this.assetManager.isAssetOperational(jsonAsset.status) &&
              this.assetManager.isAssetOperational(operationalEvent.status)
            ) {
              await this.assetManager.updateOperational(jsonAsset, dbAsset);
            }
          }
          
          const latestEXCEvent = await readOneEvent({unitId: dbAsset.unitId, status: "EXC"});
          const excStatusChanged = latestEXCEvent && latestEXCEvent.status !== jsonAsset.status
          const excSecondaryStatusChanged = latestEXCEvent && latestEXCEvent.secondaryStatus !== jsonAsset.secondaryStatus;
          const statusChanged = excStatusChanged || excSecondaryStatusChanged;
          if (
          /* EXCLUDED EVENTS */
            /* Updating an EXC event */
            statusChanged &&
            jsonAsset.status.toLowerCase() === "exc" &&
            dbAsset.status.toLowerCase() === "exc"
          ) {
            await this.assetManager.updateEXC(jsonAsset, dbAsset);
          } else if (
            statusChanged &&
            this.assetManager.isAssetDown(jsonAsset.status) &&
            dbAsset.status.toLowerCase() == "exc"
          ) {
            await this.assetManager.updateToDown(jsonAsset);
          } else if (
            statusChanged &&
            this.assetManager.isAssetOperational(jsonAsset.status) &&
            dbAsset.status.toLowerCase() === "exc"
          ) {
            await this.assetManager.updateToOperational(jsonAsset, dbAsset);
          }
        }
      } catch (error) {
        console.error({ "Error processing asset state": error });
      }
    }
    this.emit("refreshTrigger", { Message: "fleet-status-data updated" });
  }

  async processAHSAssets(assetMap) {
    const ahsAssetMap = this.mapFleetData(await readAHSAssets());

    for (const [unitId, asset] of assetMap.entries()) {
      if (asset.truckType === "AHS" && !ahsAssetMap.has(unitId)) {
        await createAHSAsset(asset);
      }
    }

    for (const [unitId, ahsAsset] of ahsAssetMap.entries()) {
      if (!assetMap.has(unitId)) {
        await deleteAHSAsset(unitId);
      }
    }
  }

  async processSecondaryStatus(assetMap) {
    try {
      for (const [unitId, asset] of assetMap.entries()) {
        const assetSecondaryStatus = asset.secondaryStatus.trim();
        
        const existingStatus = await readOneSecondaryStatus(asset.secondaryStatus);
        
        if (!existingStatus) {
          await createSecondaryStatus(assetSecondaryStatus); 
        }
      }
    } catch (error) {
      console.error("Error processing secondary statuses:", error);
    }
  }

  mapVehicleStatus(vehicle) {
    const excludedUnitIds = ["6228", "6229", "6230", "6232", "6233", "6234"];

    if (vehicle.unitId && excludedUnitIds.includes(vehicle.unitId)) {
      return null; 
    }

    if (!vehicle.secondaryStatus) vehicle.secondaryStatus = "";

    const modifiedSecondaryStatus = vehicle.secondaryStatus
      .replace(/\s+/g, "")
      .toLowerCase();

    if (vehicle.unitId === "6127") {
      vehicle.equipmentType = "AHT";
    }
    if (!vehicle.status) {
      vehicle.status = "no status";
    }

    if (
      vehicle.status.toLowerCase() === "exc" &&
      modifiedSecondaryStatus.includes("commissioning/decommissioning")
    ) {
      vehicle.status = constants.OPERATIONAL;
      vehicle.secondaryStatus = "OoS - Comm/Decomm";
    } else if (
      vehicle.status.toLowerCase() === "down" &&
      vehicle.secondaryStatus.includes("Health Event")
    ) {
      vehicle.status = constants.OPERATIONAL;
    } else if (vehicle.status.toLowerCase() === "conv") {
      vehicle.status = constants.OPERATIONAL;
    } else if (
      vehicle.status.toLowerCase() === "down" &&
      vehicle.secondaryStatus.includes("Z-")
    ) {
      vehicle.status = constants.DOWN_WAITING;
    } else if (
      vehicle.status.toLowerCase() === "down" &&
      vehicle.secondaryStatus.includes("Unscheduled")
    ) {
      vehicle.status = constants.DOWN_UNSCHEDULED;
    } else if (
      vehicle.status.toLowerCase() === "down" &&
      !vehicle.secondaryStatus.includes("Unscheduled")
    ) {
      vehicle.status = constants.DOWN_SCHEDULED;
    }

    return vehicle;
  }

  // Get new secondary status if there is one - for later.
  mapFleetData(obj) {
    const objMap = new Map();
    obj.forEach((unit) => {
      objMap.set(unit.unitId, unit);
    });
    return objMap;
  }

  hasTwentyMinutesPassed(createdAtTime, currentTime = new Date()) {
    const createdAtDate = new Date(createdAtTime);

    if (isNaN(createdAtDate.getTime()) || isNaN(currentTime.getTime())) {
      throw new Error("Invalid date provided");
    }

    const timeDifference = currentTime.getTime() - createdAtDate.getTime();
    const minutesDifference = timeDifference / (1000 * 60);

    return minutesDifference >= 20;
  }
}

module.exports = FileEventProcessor;
