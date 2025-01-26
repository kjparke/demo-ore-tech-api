const { OPERATIONAL_OOS, validHaulTrucks } = require("../constants/constants");
const fs = require("fs");
const { readAssetStatusCount } = require("./AssetController");
const PhysicalAvailability = require("../models/PhysicalAvailability");

exports.createPhysicalAvailabilityRecord = async (jsonMap) => {
  try {
    const paRecord = await this.getPhysicalAvailability(jsonMap);
    const newPhysicalAvailability = new PhysicalAvailability(paRecord);
    return await newPhysicalAvailability.save();
  } catch (error) {
    console.error(error);
  }
}

exports.getPhysicalAvailability = async (jsonMap) => {
  try {
    const assets = jsonMap ?? getJSONData();
    const operationalStatuses = [
      "noh",
      "operational",
      "standby",
      "delay",
      "operational-oos",
    ];

    const assetTypes = ["H", "D", "G", "L", "S", "DRL"];
    let availabilityPerType = assetTypes.reduce((acc, type) => {
      acc[type] = { operational: 0, total: 0 };
      return acc;
    }, { overall: { operational: 0, total: assets.length } });

    assets.forEach((asset) => {
      const { equipmentType: type, status, modelCode } = asset;

      if (!type || !availabilityPerType[type]) return;

      const isOperational = operationalStatuses.includes(status.toLowerCase());
      const isLetourneau = modelCode?.includes("LET") && isOperational;

      if (isOperational || isLetourneau) {
        availabilityPerType[type].operational++;
        availabilityPerType.overall.operational++;
      }

      availabilityPerType[type].total++;
    });

    const calculatePercentage = (operational, total) => 
      total > 0 ? (operational / total) * 100 : 0;

    const result = assetTypes.reduce((acc, type) => {
      acc[type.toLowerCase()] = {
        operational: availabilityPerType[type].operational,
        total: availabilityPerType[type].total,
        percentage: calculatePercentage(
          availabilityPerType[type].operational,
          availabilityPerType[type].total
        ),
      };
      return acc;
    }, {});

    result.overall = {
      operational: availabilityPerType.overall.operational,
      total: availabilityPerType.overall.total,
      percentage: calculatePercentage(
        availabilityPerType.overall.operational,
        availabilityPerType.overall.total
      ),
    };

    const transformResult = (data) => ({
			haulTruck: data.h,
			dozer: data.d,
			graders: data.g,
			letourneau: data.l,
			shovels: data.s,
			drills: data.drl,
			overall: data.overall,
		});

    return transformResult(result);
  } catch (error) {
    console.error(error);
  }
};

exports.getAssetCountByCategory = async (req, res) => {
  const assets = getJSONData();
  let countPerStatusCategory = {
    operational: 0,
    down_unscheduled: 0,
    down_scheduled: 0,
    down_waiting: 0,
    pending: await readAssetStatusCount({status: "pending"}),
    noh: 0,
    delay: 0,
  };

  assets.forEach((asset) => {
    let statusKey = asset.status.toLowerCase();

    if (countPerStatusCategory.hasOwnProperty(statusKey)) {
      countPerStatusCategory[statusKey]++;
    }
  });

  return res.status(200).json(countPerStatusCategory);
};

const getJSONData = () => {
  const assetsData = fs.readFileSync(
    process.env.FLEET_STATUS_DATA_DIR,
    "utf-8"
  );
  let vehicleStatuses = JSON.parse(assetsData);
  vehicleStatuses = formatFleetStatusData(vehicleStatuses);
  return vehicleStatuses;
};

exports.getLastUpdated = (req, res) => {
  try {
    const assets = getJSONData();
    lastUpdated = assets[0].refreshedTime;

    res.status(200).json({ lastUpdated: lastUpdated });
  } catch (error) {
    console.error(error);
  }
};

const formatFleetStatusData = (vehicleStatuses) => {
  const excludedUnitIds = ["6228", "6229", "6230", "6232", "6233", "6234"];
  
  vehicleStatuses.forEach((vehicleStatus) => {
    const status = vehicleStatus.status ? vehicleStatus.status.toLowerCase() : null;
    const secondaryStatus = vehicleStatus.secondaryStatus || "";

    const modifiedSecondaryStatus = secondaryStatus.replace(/\s+/g, "").toLowerCase();

    if (status === "exc" && modifiedSecondaryStatus.includes("commissioning/decommissioning")) {
      vehicleStatus.status = OPERATIONAL_OOS;
      vehicleStatus.secondaryStatus = "OoS - Comm/Decomm";
    }

    if (vehicleStatus.unitId === "6127") {
      vehicleStatus.equipmentType = "AHT";
    }

    if (!vehicleStatus.status) {
      vehicleStatus.status = "no status";
    }

    if (status === "down" && secondaryStatus.includes("Health Event")) {
      vehicleStatus.status = "operational";
    }

    if (status === "down" && secondaryStatus.includes("Z-")) {
      vehicleStatus.status = "down_waiting";
    }

    if (status === "down" && (secondaryStatus.includes("Unscheduled") || secondaryStatus.includes("Unsheduled"))) {
      vehicleStatus.status = "down_unscheduled";
    } else if (status === "down" && !secondaryStatus.includes("Unscheduled") && !secondaryStatus.includes("Unsheduled")) {
      vehicleStatus.status = "down_scheduled";
    }
     // Remove invalid haul trucks
     if (
      vehicleStatus.equipmentType === "H" &&
      (!vehicleStatus.modelCode || !validHaulTrucks.includes(vehicleStatus.modelCode.toLowerCase()))
    ) {
      vehicleStatus.equipmentType = null;
    }
  });

  const filteredVehicleStatuses = vehicleStatuses.filter(
    (vehicleStatus) =>
      vehicleStatus.status?.toLowerCase() !== "exc" &&
      !excludedUnitIds.includes(vehicleStatus.unitId)
  );

  return filteredVehicleStatuses;
};
