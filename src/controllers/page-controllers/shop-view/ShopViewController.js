const { readAssetWithEventFilter } = require("../../AssetController");
const { calculateTimeInStatus } = require("../../utils/CalculateTimeInStatus");
const { getSortingParams } = require("../asset-view/AssetViewController");

exports.readShopAssets = async ({
  assetQueryString,
  eventQueryString,
  sortParams = [],
  hasTechnicianFilter
}) => {
  const sortParamsArray = Object.values(sortParams);
  const sortOptions = getSortingParams(sortParamsArray); 

  try {
    // Fetch assets matching the query
    const assetQueryWithActiveEvent = {
      ...assetQueryString,
      activeEvent: { $exists: true, $ne: null }
    };

		// Modify asset query to only retrieve assets with an activeEvent
    let downAssets = await readAssetWithEventFilter(assetQueryWithActiveEvent, eventQueryString, sortOptions, hasTechnicianFilter);
		
		const modifiedAssets = downAssets.map((asset) => {
      if (!asset.location || asset.location.trim() === "") {
        asset.location = "Recent Downs";
      }

      if (
        asset.activeEvent &&
        (!asset.activeEvent.location ||
          asset.activeEvent.location.trim() === "")
      ) {
        asset.activeEvent.location = "Recent Downs";
      }

      if (asset.activeEvent) {
        asset.activeEvent.hoursInStatus = calculateTimeInStatus(
          asset.activeEvent.downDate
        );
      }

      return asset;
		});

    return modifiedAssets; 
  } catch (error) {
    throw new Error(`Error reading shop assets: ${error.message}`);
  }
};
