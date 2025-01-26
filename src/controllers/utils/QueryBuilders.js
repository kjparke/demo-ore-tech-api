const { DOWN_STATUSES } = require("../../constants/constants");

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
    hasWorkOrderNumber,
    hasAssignedTechnicians
  );

  return { assetQueryString, eventQueryString };
};

const createAssetQueryString = (location, modelCode, secondaryStatus) => {
  const assetQuery = {
    $or: [
      { status: {$in: Object.values(DOWN_STATUSES)}},
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
  const eventQueryString = {
    $or: [
      { status: {$in: Object.values(DOWN_STATUSES)}},
    ],
  };

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

  // Handle assignedTechnicians condition and exclude null or undefined values
  if (hasAssignedTechnicians === "true") {
    eventQueryString["temp_assignedTechnicians"] = { $ne: [], $exists: true };
  }

  return eventQueryString;
};