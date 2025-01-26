const AHSAsset = require("../models/AHSAsset");

exports.createAHSAsset = async (asset) => {
  const newAHSAsset = {
    unitId: asset.unitId,
    swingable: "", 
    minestarVersion: ""
  }
  const savedAsset = new AHSAsset(newAHSAsset);
  const result = await savedAsset.save();
  return result;
};


exports.readAHSAssets = async () => {
  const ahsAssets = await AHSAsset.find({});
  return ahsAssets;
};

exports.updateAHSAsset = async (filter, update) => {
  const updatedAHSAsset = await AHSAsset.findOneAndUpdate(filter, update, {new: true});
  return updatedAHSAsset;
};

exports.deleteAHSAsset = async (asset) => {
  const deletedAsset = await AHSAsset.findOneAndDelete({unitId: asset.unitId});
		return deletedAsset;
};
