const constants = require("../../../../constants/constants");

class State {
  constructor(asset) {
    this.asset = asset;
  }
}

class ExcludedOperationalState extends State {
  constructor(asset) {
    super(asset);
  }

  mapStatus() {
    if (
      this.asset.status.toLowerCase() == "exc" &&
      this.asset.secondaryStatus
        .toLowerCase()
        .includes("commissioning/decommissioning")
    ) {
      this.asset.status = constants.OPERATIONAL;
      this.asset.secondaryStatus = "OoS - Comm/Decomm";
    } else {
      return;
    }
  }
}

class SpecialEquipmentState extends State {
  constructor(asset) {
    super(asset);
  }

  mapStatus() {
    if (this.asset.unitId === "6127") {
      this.asset.equipmentType = "AHT";
    } else {
      return;
    }
  }
}

class NoStatusState extends State {
  constructor(asset) {
    super(asset);
  }

  mapStatus() {
    if (!this.asset.status) {
      this.asset.status = "no status";
    } else {
      return;
    }
  }
}

class OperationalState extends State {
  constructor(asset) {
    super(asset);
  }

  mapStatus() {
    if (
      this.asset.status.toLowerCase() === "down" &&
      this.asset.secondaryStatus.includes("Health Event")
    ) {
      this.asset.status = constants.OPERATIONAL;
    } else {
      return;
    }
  }
}

class DownWaitingState extends State {
  constructor(asset) {
    super(asset);
  }

  mapStatus() {
    if (
      this.asset.status.toLowerCase() === "down" &&
      this.asset.secondaryStatus.includes("Z-")
    ) {
      this.asset.status = constants.DOWN_WAITING;
    } else {
      return;
    }
  }
}

class DownUnscheduledState extends State {
  constructor(asset) {
    super(asset);
  }

  mapStatus() {
    if (
      this.asset.status.toLowerCase() === "down" &&
      this.asset.secondaryStatus.includes("Unscheduled")
    ) {
      this.asset.status = constants.DOWN_UNSCHEDULED;
    } else {
      return;
    }
  }
}

class DownScheduledState extends State {
  constructor(asset) {
    super(asset);
  }

  mapStatus() {
    if (
      this.asset.status.toLowerCase() === "down" &&
      !this.asset.secondaryStatus.includes("Unscheduled")
    ) {
      this.asset.status = constants.DOWN_SCHEDULED;
    } else {
      return;
    }
  }
}

class AssetContext {
  constructor(asset) {
    this.asset = asset;
    this.states = [
      new ExcludedOperationalState(this.asset),
      new OperationalState(this.asset),
      new SpecialEquipmentState(this.asset),
      new NoStatusState(this.asset),
      new DownWaitingState(this.asset),
      new DownUnscheduledState(this.asset),
      new DownScheduledState(this.asset),
    ];

    this.current = this.states[0];
  }

  run() {
    for (let state of this.states) {
      state.mapStatus();
    }
  }
}

module.exports = {
  ExcludedOperationalState,
  SpecialEquipmentState,
  OperationalState,
  NoStatusState,
  DownWaitingState,
  DownUnscheduledState,
  DownScheduledState,
  AssetContext,
};
