const { readAssetStatusCount, readAssets } = require("./AssetController");
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
    const assets = jsonMap ?? await getAssets();
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
  const assets = await getAssets();
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

const getAssets = async () => {
  const vehicleStatuses = await readAssets();
  return vehicleStatuses;
};

exports.getLastUpdated = async (req, res) => {
  try {
    res.status(200).json({ lastUpdated: new Date() });
  } catch (error) {
    console.error(error);
  }
};
