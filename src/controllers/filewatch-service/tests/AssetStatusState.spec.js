const {
  DOWN_SCHEDULED,
  OPERATIONAL_OOS,
  OPERATIONAL,
  DOWN_WAITING,
  DOWN_UNSCHEDULED,
} = require("../../../constants/constants");
const {
  AssetContext,
  ExcludedOperationalState,
  SpecialEquipmentState,
  OperationalState,
  NoStatusState,
  DownWaitingState,
  DownScheduledState,
  DownUnscheduledState,
} = require("../states/statusStates/AssetStatusState");
const {
  operationalAsset,
  operationalEXCAsset,
  noStatusAsset,
  downWaitingAsset,
  downScheduledAsset,
  downUnscheduledAsset,
} = require("./data/AssetTestData");

describe("ExcludedOperationalState Tests", () => {
  it("Mapping operational excluded assets", () => {
    const asset = {
      unitId: "6127",
      status: "EXC",
      secondaryStatus: "Out of Service - Commissioning/Decommissioning",
      equipmentType: "",
    };
    const excludedOperationalState = new ExcludedOperationalState(asset);
    excludedOperationalState.mapStatus();

    const result =
      asset.status === OPERATIONAL &&
      asset.secondaryStatus === "OoS - Comm/Decomm";
    expect(result).toBe(true);
  });
});

describe("SpecialEquipmentState Tests", () => {
  it("Mapping special asset equipment type", () => {
    const asset = {
      unitId: "6127",
      status: "DOWN",
      secondaryStatus: "Scheduled",
      equipmentType: "",
    };

    const specialEquipmentState = new SpecialEquipmentState(asset);
    specialEquipmentState.mapStatus();

    const result = asset.equipmentType === "AHT";
    expect(result).toBe(true);
  });
});

describe("OperationalState Tests", () => {
  it("Mapping special asset equipment type", () => {
    const asset = {
      unitId: "6127",
      status: "DOWN",
      secondaryStatus: "Health Event",
    };

    const operationalState = new OperationalState(asset);
    operationalState.mapStatus();

    const result = asset.status === OPERATIONAL;
    expect(result).toBe(true);
  });
});

describe("NoStatusState Tests", () => {
  it("Mapping assets with no status", () => {
    const asset = {
      unitId: "6127",
      secondaryStatus: "Health Event",
    };

    const noStatusState = new NoStatusState(asset);
    noStatusState.mapStatus();

    const result = asset.status === "no status";
    expect(result).toBe(true);
  });
});

describe("DownWaiting Tests", () => {
  it("Mapping assets that are down waiting", () => {
    const asset = {
      status: "DOWN",
      secondaryStatus: "Z-Weld",
    };

    const downWaitingState = new DownWaitingState(asset);
    downWaitingState.mapStatus();

    const result = asset.status === DOWN_WAITING;
    expect(result).toBe(true);
  });
});

describe("DownScheduled Tests", () => {
  it("Mapping assets that are down scheduled", () => {
    const asset = {
      status: "DOWN",
      secondaryStatus: "Scheduled",
    };

    const downScheduledState = new DownScheduledState(asset);
    downScheduledState.mapStatus();

    const result = asset.status === DOWN_SCHEDULED;
    expect(result).toBe(true);
  });
});

describe("DownUnscheduled Tests", () => {
  it("Mapping assets that are down unscheduled", () => {
    const asset = {
      status: "DOWN",
      secondaryStatus: "Unscheduled",
    };

    const downUnscheduledState = new DownUnscheduledState(asset);
    downUnscheduledState.mapStatus();

    const result = asset.status === DOWN_UNSCHEDULED;
    expect(result).toBe(true);
  });
});

describe("AssetContext Test", () => {
  it("Testing operational asset", () => {
    const context = new AssetContext(operationalAsset);
    context.run();

    expect(operationalAsset.status).toBe(OPERATIONAL);
  });

  it("Testing operational out of service asset", () => {
    const context = new AssetContext(operationalEXCAsset);
    context.run();

    const result =
      operationalEXCAsset.status === OPERATIONAL &&
      operationalEXCAsset.secondaryStatus === "OoS - Comm/Decomm";
    expect(result).toBe(true);
  });

  it("Testing assets with no status", () => {
    const context = new AssetContext(noStatusAsset);
    context.run();

    expect(noStatusAsset.status).toBe("no status");
  });

  it("Testing assets that are down waiting", () => {
    const context = new AssetContext(downWaitingAsset);
    context.run();

    expect(downWaitingAsset.status).toBe(DOWN_WAITING);
  });

  it("Testing assets that are down scheduled", () => {
    const context = new AssetContext(downScheduledAsset);
    context.run();

    expect(downScheduledAsset.status).toBe(DOWN_SCHEDULED);
  });

  it("Testing assets that are down unscheduled", () => {
    const context = new AssetContext(downUnscheduledAsset);
    context.run();

    expect(downUnscheduledAsset.status).toBe(DOWN_UNSCHEDULED);
  });
});
