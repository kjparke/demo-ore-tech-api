const {
  OPERATIONAL_OOS,
  OPERATIONAL,
  DOWN_WAITING,
  DOWN_UNSCHEDULED,
  DOWN_SCHEDULED,
} = require("../../../constants/constants");
const FileEventProcessor = require("../FileEventProcessor");

const fileEventProcessor = new FileEventProcessor();

describe("FileEventProcessor Test Suite", () => {
  it("Initialize a Fileprocessor", () => {
    const fileEventProcessor = new FileEventProcessor();
    expect(true).toEqual(true);
  });
});

describe("hasTwentyMinutesPassed", () => {
  it("Returns true when 20 minutes have passed", () => {
    const currentTime = new Date("2024-03-20T04:39:43.169+00:00");
    const createdAtTime = "2024-03-20T04:00:43.169+00:00";

    const result = fileEventProcessor.hasTwentyMinutesPassed(
      createdAtTime,
      currentTime
    );

    expect(result).toBe(true);
  });

  it("Returns false when 20 minutes have not passed", () => {
    const currentTime = new Date("2024-03-20T04:39:43.169+00:00");
    const createdAtTime = "2024-03-20T04:20:43.169+00:00";

    const result = fileEventProcessor.hasTwentyMinutesPassed(
      createdAtTime,
      currentTime
    );

    expect(result).toBe(false);
  });
});

describe("mapVehicleStatus", () => {
  it("OPERATIONAL-OOS Check - Commissioning/Decommissioning", () => {
    const vehicle = {
      status: "EXC",
      secondaryStatus: "Out of Service - Commissioning/Decommissioning",
    };

    const mappedVehicle = fileEventProcessor.mapVehicleStatus(vehicle);
    const result =
      mappedVehicle.status == OPERATIONAL &&
      mappedVehicle.secondaryStatus == "OoS - Comm/Decomm";

    expect(result).toBe(true);
  });

  it("AHT test", () => {
    const vehicle = {
      unitId: "6127",
      status: "DOWN",
      secondaryStatus: "Scheduled",
      equipmentType: "",
    };

    const mappedVehicle = fileEventProcessor.mapVehicleStatus(vehicle);
    const result = mappedVehicle.equipmentType === "AHT";
    expect(result).toBe(true);
  });

  it("OPERATIONAL Test", () => {
    const vehicle = {
      unitId: "6127",
      status: "DOWN",
      secondaryStatus: "Health Event",
    };

    const mappedVehicle = fileEventProcessor.mapVehicleStatus(vehicle);
    const result = mappedVehicle.status === OPERATIONAL;
    expect(result).toBe(true);
  });

  it("DOWN WAITING Test", () => {
    const vehicle = {
      status: "DOWN",
      secondaryStatus: "Z-Weld",
    };

    const mappedVehicle = fileEventProcessor.mapVehicleStatus(vehicle);
    const result = mappedVehicle.status === DOWN_WAITING;
    expect(result).toBe(true);
  });

  it("DOWN SCHEDULED Test", () => {
    const vehicle = {
      status: "DOWN",
      secondaryStatus: "Scheduled",
    };

    const mappedVehicle = fileEventProcessor.mapVehicleStatus(vehicle);
    const result = mappedVehicle.status === DOWN_SCHEDULED;
    expect(result).toBe(true);
  });

  it("DOWN UNSCHEDULED Test", () => {
    const vehicle = {
      status: "DOWN",
      secondaryStatus: "Unscheduled",
    };

    const mappedVehicle = fileEventProcessor.mapVehicleStatus(vehicle);
    const result = mappedVehicle.status === DOWN_UNSCHEDULED;
    expect(result).toBe(true);
  });
});
