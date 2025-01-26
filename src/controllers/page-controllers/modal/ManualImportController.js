const { readOneAsset, _createAsset, _updateAsset } = require("../../AssetController.js");
const { _createEvent } = require("../../EventController.js");

exports.createNewAssetAndEvent = async (data, metaData) => {
  const user = metaData;
  const asset = data;

  try {
    // Check if the asset is unique
    const uniqueCheck = await isUniqueAsset(asset);
    if (uniqueCheck.error) {
      return uniqueCheck; 
    }

    const newEvent = await _createEvent({
      ...asset,
      isManuallyAdded: true,
      isStatusChangeManual: true,
      lastUpdatedBy: user.id,
    });

    const newAsset = await _createAsset({
      ...asset,
      activeEvent: newEvent._id,
    });

    await Promise.all([newEvent.save(), newAsset.save()]);

    return { message: "Asset and event created successfully", newAsset };
  } catch (error) {
    throw new Error(`Error creating new Asset and Event: ${error.message}`);
  }
};

exports.createNewEvent = async (data, metaData) => {
  try {
    const newEvent = await _createEvent({ 
      ...data, 
      isManuallyAdded: true,
      isStatusChangeManual: true, 
    });
    await newEvent.save();

    await _updateAsset(
      { unitId: data.unitId },
      { ...data, activeEvent: newEvent._id }
    );

    return newEvent;
  } catch (error) {
    throw new Error(`Error creating event: ${error.message}`);
  }
};

/* Helpers */
const isUniqueAsset = async (asset) => {
  try {
    const existingAsset = await readOneAsset({
      unitId: asset.unitId.trim(),
    });

    if (existingAsset) {
      return {
        error: true,
        message: `Asset already exists. ${existingAsset.unitId} currently has a status of ${existingAsset.status} - ${existingAsset.secondaryStatus}`
      };
    }
    return { error: false };
  } catch (error) {
    throw new Error(`Error checking asset uniqueness: ${error.message}`);
  }
};