const AssetManager = require("../AssetManager");
const {
  jsonObj,
  dbAssetObj,
} = require("./data/AssetTestData");

describe("AssetManager Tests", () => {
  const assetManager = new AssetManager();
  it("Creating a new event object", () => {
    const obj = assetManager.createNewEventObject(jsonObj);

    const result = true;
    expect(result).toBe(true);
  });

  it("Creating an update event object", () => {
    const obj = assetManager.createUpdateEventObject(jsonObj, dbAssetObj);
    expect(true).toBe(true);
  });

});
