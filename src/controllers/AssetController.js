const qs = require("qs");
const Asset = require("../models/Asset");
const Event = require("../models/Event");
const Log = require("../models/Log");
const Note = require("../models/Note");
const eventController = require("./EventController");
const {
  OPERATIONAL_MANUAL_RELEASE,
  OPERATIONAL_STATUSES,
  DOWN_STATUSES,
} = require("../constants/constants");
const { createNewEventDelta } = require("./EventDeltaController");
const { createLocationDelta } = require("./LocationDeltaController");
const { determineCurrentShift } = require("./utils/DetermineCurrentShift");
const { readTechnicianNamesForEventShift } = require("./ShiftRosterController");

/* CREATE */
exports.createAsset = async (req, res) => {
  const user = req.body.metaData;
  const manualAssetEvent = req.body.data;

  try {
    const existingAsset = await this.readOneAsset({
      unitId: manualAssetEvent.unitId.trim(),
    });

    if (existingAsset) {
      res.status(400).json({
        message: `Asset already exists. ${manualAssetEvent.unitId} currently has a status of ${manualAssetEvent.status} - ${manualAssetEvent.secondaryStatus}`,
      });
      return;
    }
    const newEvent = new Event({
      ...manualAssetEvent,
      isManualImport: true,
      isStatusChangeManual: true,
      lastUpdatedBy: user.id,
    });
    const savedEvent = await newEvent.save();
    const savedEventObj = savedEvent.toObject();

    await createNewEventDelta({ ...savedEventObj, eventId: savedEventObj._id });
    await createLocationDelta(
      manualAssetEvent.location,
      manualAssetEvent.bay,
      savedEventObj._id
    );

    const savedAsset = new Asset({
      ...manualAssetEvent,
      activeEvent: savedEventObj._id,
    });
    await savedAsset.save();

    res.status(200).json(savedAsset);
  } catch (error) {
    res.status(500).json(error);
    console.error(error);
  }
};

exports._createAsset = async (asset) => {
  try {
    const newAsset = new Asset(asset);
    return newAsset;
  } catch (error) {
    console.error(error);
    throw new Error("An error occured while creating an asset");
  }
};

/* READ */

exports.readAssets = async (withActiveEvent = false) => {
  try {
    if (withActiveEvent) {
      return await Asset.find({}).populate("activeEvent");
    } else {
      return await Asset.find({});
    }
  } catch (error) {
    console.error(error);
    throw new Error("An error was encountered while reading all assets.");
  }
};

exports.readAssetWithEventFilter = async (assetFilter, eventFilter, sortOptions, hasTechnicianFilter) => {
  const currentShift = determineCurrentShift();
  try {
    const assets = await Asset.find(assetFilter)
      .sort(sortOptions)
      .populate({
        path: "activeEvent", 
        match: eventFilter,
      })
      .lean();
      
    const assetsWithActiveEvents = assets.filter(assets => assets.activeEvent)

    const modifiedAssets = await Promise.all(assetsWithActiveEvents.map(async (asset) => {
      if (asset.activeEvent) {
        const technicianNames = await readTechnicianNamesForEventShift(
          asset.activeEvent,
          currentShift.shiftType,
          currentShift.date
        );
        asset.activeEvent.assignedTechnicians = technicianNames;
      }

      return asset;
    }));
  
    if (hasTechnicianFilter) {
      return modifiedAssets.filter(asset => asset.activeEvent.assignedTechnicians.length > 0);
    }

    return modifiedAssets;
  } catch (error) {
    console.error("Error while reading assets with event filter:", error);
    throw new Error("Error while reading assets, please try again.");
  }
};

exports.readOneAsset = async (filter) => {
  try {
    const asset = await Asset.findOne(filter);
    return asset;
  } catch (error) {
    throw error;
  }
};

exports.readAssetStatusCount = async (filter) => {
  try {
    const count = await Asset.find(filter).countDocuments();
    return count;
  } catch (error) {
    throw new Error("Error reading asset status count from Ore-Tech.");
  }
};

exports._updateAsset = async (filter, update) => {
  try {
    const updatedAsset = await Asset.findOneAndUpdate(
      filter,
      update,
      { new: true }
    );
    return updatedAsset;
  } catch (error) {
    console.error(error);
    throw new Error("An error occured while updating this asset");
  }
};

exports.updateAssetFromEvent = async (filter, update) => {
  try {
    const asset = await Asset.findOneAndUpdate(filter, update);
    console.log({ "Updated asset": asset });
    res.status(201).json(asset.toObject);
  } catch (error) {
    res.status(500).json({ error });
  }
};

exports.manuallyCreateDownAsset = async (req, res) => {
  const {
    unitId,
    status,
    location,
    bay,
    secondaryStatus,
    workOrderNumber,
    purchaseOrderNumber,
    downDate,
    scheduleOutDate,
    revisedOutDate,
    user,
  } = req.body.data;

  try {
    if (!user)
      return res.status(400).json({ error: "User informaiton is missing." });

    const newEvent = {
      unitId,
      status,
      secondaryStatus,
      location,
      bay,
      workOrderNumber,
      purchaseOrderNumber,
      downDate,
      scheduleOutDate,
      revisedOutDate,
      hoursInStatus: 0,
      isManuallyAdded: true,
      isStatusChangeManual: true,
      lastUpdatedBy: user.id,
    };
    const savedEvent = new Event(newEvent);
    await savedEvent.save();

    await createNewEventDelta({
      eventId: savedEvent._id,
      status: savedEvent.status,
      secondaryStatus: savedEvent.secondaryStatus,
    });

    await createLocationDelta(location, bay, savedEvent._id);

    const assetUpdate = {
      status,
      secondaryStatus,
      location,
      activeEvent: savedEvent._id,
    };

    const updatedAsset = await Asset.findOneAndUpdate(
      { unitId: unitId },
      assetUpdate
    );

    if (!updatedAsset)
      return res.status(400).json({
        Message:
          "The asset does not exist in the database. Contact administrator.",
      });

    await logEventChange(
      savedEvent._id,
      status,
      "MANUAL IMPORT: Asset manually imported",
      user.id
    );
    return res.status(200).json(savedEvent);
  } catch (error) {
    console.error({ "Manual Import Error": error });
  }
};

exports.readOperationalAssets = async (req, res) => {
  try {
    const allAssets = await Asset.find({}).select("unitId status");

    if (!allAssets) return res.status(203).json([]);
    const operationalAssets = allAssets
      .filter((asset) =>
        OPERATIONAL_STATUSES.includes(asset.status.toUpperCase())
      )
      .map((asset) => ({
        id: asset._id,
        unitId: asset.unitId,
        status: asset.status,
      }))
      .sort((a, b) => {
        if (a.unitId < b.unitId) return -1;
        if (a.unitId > b.unitId) return 1;
        return 0;
      });

    res.status(200).json(operationalAssets);
  } catch (error) {
    console.error({ "readOperationalAssets Error": error });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.readDownAssetPages = async ({
  page = 1,
  pageSize = 10,
  assetQueryString,
  eventQueryString,
  sortParams = [],
}) => {
  const skip = (page - 1) * pageSize;

  if (Object.keys(eventQueryString).length > 0) {
    pageSize = 50;
  }

  await Asset.createIndexes({
    unitId: 1,
    location: 1,
  });

  // Ensure sortParams is an array
  const sortOptions = Array.isArray(sortParams)
    ? sortParams.reduce((acc, sortParam) => {
        acc[sortParam.column] = sortParam.direction === "asc" ? 1 : -1;
        return acc;
      }, {})
    : {};

  try {
    const totalRecords = await Asset.countDocuments(assetQueryString);
    const totalPages = Math.ceil(totalRecords / pageSize);

    let downAssets = await Asset.find(assetQueryString)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    let assetsWithNotes = [];

    for (let asset of downAssets) {
      const populatedAsset = await Asset.populate(asset, {
        path: "activeEvent",
        populate: { path: "assignedTechnicians" },
      });

      if (populatedAsset.activeEvent) {
        const event = await Event.findOne({
          _id: populatedAsset.activeEvent._id,
          ...eventQueryString,
        });
        if (event) {
          populatedAsset.activeEvent.hoursInStatus = calculateTimeInStatus(
            populatedAsset.activeEvent.downDate
          );

          let latestNote = await Note.findOne({
            eventId: populatedAsset.activeEvent._id,
          }).sort({ createdAt: -1 });

          assetsWithNotes.push({ asset: populatedAsset, latestNote });
        }
      }
    }

    return {
      assets: assetsWithNotes,
      currentPage: page,
      totalPages,
      pageSize,
      totalRecords,
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

// Function replaced
exports.readDownAssets = async (req, res) => {
  try {
    const statusQuery = {
      $or: [{ status: { $in: Object.values(DOWN_STATUSES) } }],
    };

    let downAssets = await Asset.find(statusQuery).populate({
      path: "activeEvent",
    });

    // Only filter assets with an active event
    downAssets = downAssets.filter((asset) => asset.activeEvent);

    if (downAssets.length === 0) {
      console.log("No down assets found.");
      return res.status(206).json({ message: "No down assets found" });
    }

    const modifiedAssets = downAssets.map((asset) => {
      let modifiedAsset = asset.toObject();

      if (!modifiedAsset.location || modifiedAsset.location.trim() === "") {
        modifiedAsset.location = "Recent Downs";
      }

      if (
        modifiedAsset.activeEvent &&
        (!modifiedAsset.activeEvent.location ||
          modifiedAsset.activeEvent.location.trim() === "")
      ) {
        modifiedAsset.activeEvent.location = "Recent Downs";
      }

      if (modifiedAsset.activeEvent) {
        modifiedAsset.activeEvent.hoursInStatus = calculateTimeInStatus(
          modifiedAsset.activeEvent.downDate
        );
      }

      return modifiedAsset;
    });

    res.status(200).json(modifiedAssets);
  } catch (error) {
    console.error("Error fetching down assets:", error);
    res.status(500).json(error.message);
  }
};

exports.readAsset = async (req, res) => {
  try {
    const assetId = req.params.id;
    const asset = await Asset.findById(assetId);

    if (!asset) return res.status(404).json({ msg: "Asset not found" });

    res.status(200).json(asset.toObject());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* UPDATE */
exports.updateAsset = async (req, res) => {
  const id = req.params.id;
  const update = req.body;
  const filter = { _id: id };
  try {
    const asset = await Asset.findOneAndUpdate(filter, update);
    res.status(201).json(asset.toObject);
  } catch (error) {
    res.status(500).json({ error });
  }
};

exports.releaseAsset = async (req, res) => {
  try {
    console.log({ "Event received": req.body.data });
    const asset = req.body.data;
    const { _id, ...activeEventWithoutId } = asset.activeEvent;

    // Find and update the event
    const event = {
      ...activeEventWithoutId,
      status: OPERATIONAL_MANUAL_RELEASE,
      location: "",
      bay: "",
      releasedToOps: true,
      createdAt: new Date(),
    };

    const updatedEventWithOutDate = await eventController.updateActualOutDate(
      _id
    );
    if (!updatedEventWithOutDate) {
      console.warn(
        "No updated event was received after attempting to save the actual out date."
      );
    }

    const newEvent = await eventController.createOperationalEvent(event);

    await createNewEventDelta({
      eventId: asset.activeEvent._id,
      status: OPERATIONAL_MANUAL_RELEASE,
      secondaryStatus: asset.activeEvent.secondaryStatus,
    });

    /* TODO: Log all events */
    const updatedAsset = {
      status: OPERATIONAL_MANUAL_RELEASE,
      activeEvent: null,
    };

    console.log({ "Asset update": updatedAsset });
    // Update asset
    const savedAsset = await Asset.findOneAndUpdate(
      { _id: asset._id },
      updatedAsset,
      { new: true }
    );

    console.log({ "Saved Asset": savedAsset });
    res.status(201).json(savedAsset);
  } catch (error) {
    res.status(500).json({ error });
  }
};

/* DELETE */
exports.deleteAsset = async (req, res) => {
  const id = req.params.id;
  const filter = { _id: id };
  try {
    const deletedAsset = await Asset.findOneAndDelete(filter);
    res.status(200).json(deletedAsset.toObject);
  } catch (error) {
    res.status(500).json({ Error: error.message });
  }
};

const logEventChange = async (eventId, status, logText, userId) => {
  const newLog = new Log({
    eventId: eventId,
    status: status,
    eventChangeText: logText,
    userId: userId,
  });
  const savedLog = await newLog.save();
};

const calculateTimeInStatus = (date) => {
  const createdAtDate = new Date(date);
  const currentDate = new Date();

  // Convert both dates to UTC
  const createdAtDateUTC = Date.UTC(
    createdAtDate.getFullYear(),
    createdAtDate.getMonth(),
    createdAtDate.getDate(),
    createdAtDate.getHours(),
    createdAtDate.getMinutes(),
    createdAtDate.getSeconds()
  );
  const currentDateUTC = Date.UTC(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
    currentDate.getHours(),
    currentDate.getMinutes(),
    currentDate.getSeconds()
  );

  // Calculate the difference in milliseconds
  const differenceInTime = currentDateUTC - createdAtDateUTC;

  // Convert the difference to hours and round down
  const differenceInHours = Math.floor(differenceInTime / (1000 * 3600));

  return `${differenceInHours} hours`;
};

exports.createQueryString = (query) => {
  const location =
    query.location && query.location.length > 0
      ? query.location.split(",")
      : undefined;
  const modelCode =
    query.modelCode && query.modelCode.length > 0
      ? query.modelCode.split(",")
      : undefined;
  const secondaryStatus =
    query.secondaryStatus && query.secondaryStatus.length > 0
      ? query.secondaryStatus.split(",")
      : undefined;
  const planning =
    query.planning && query.planning.length > 0
      ? query.planning.split(",")
      : undefined;
  const hasWorkOrderNumber = query.hasWorkOrderNumber;
  const hasAssignedTechnicians = query.hasAssignedTechnicians;

  const assetQueryString = createAssetQueryString(
    location,
    modelCode,
    secondaryStatus
  );
  const eventQueryString = createEventQueryString(
    planning,
    hasWorkOrderNumber
  );

  const hasTechnicianFilter = hasAssignedTechnicians === "true"

  return { assetQueryString, eventQueryString, hasTechnicianFilter };
};

const createAssetQueryString = (location, modelCode, secondaryStatus) => {
  const assetQuery = {
    $or: [
      { status: Object.values(DOWN_STATUSES)},
    ],
  };

  if (location) {
    assetQuery["location"] = { $in: location };
  }
  if (modelCode) {
    assetQuery["modelCode"] = { $in: modelCode };
  }
  if (secondaryStatus) {
    assetQuery["secondaryStatus"] = { $in: secondaryStatus };
  }

  return assetQuery;
};

const createEventQueryString = (
  planning,
  hasWorkOrderNumber,
  hasAssignedTechnicians
) => {
  const eventQueryString = {};

  // Combine planning filters using $or
  if (planning) {
    const planningConditions = planning
      .map((planningFilter) => {
        switch (planningFilter) {
          case "To be towed":
            return { toBeTowed: true };
          case "To be planned":
            return { toBePlanned: true };
          case "To be washed":
            return { washed: true };
          case "To be scheduled":
            return { toBeScheduled: true };
          case "Ready to break-in":
            return { readyToBreakIn: true };
          default:
            return null;
        }
      })
      .filter((condition) => condition !== null);

    if (planningConditions.length > 0) {
      eventQueryString["$or"] = planningConditions;
    }
  }

  // Handle workOrderNumber condition
  if (hasWorkOrderNumber === "true") {
    eventQueryString["workOrderNumber"] = { $ne: null, $ne: "", $exists: true };
  }

  return eventQueryString;
};
