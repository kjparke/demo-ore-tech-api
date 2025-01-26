const { 
	consolidateDeltas, 
	splitDeltas
} = require("../ShiftSummaryModalController");
const moment = require('moment');

describe("consolidateDeltas", () => {
  test("should return an empty array when input is an empty array", () => {
    const deltas = [];
    const result = consolidateDeltas(deltas);
    expect(result).toEqual([]);
  });

  test("should consolidate consecutive deltas with the same status and secondaryStatus", () => {
    const deltas = [
      {
        status: "down_waiting",
        secondaryStatus: "maintenance",
        startTime: moment("2024-06-06T00:00:00.000Z"),
        endTime: moment("2024-06-06T01:00:00.000Z"),
      },
      {
        status: "down_waiting",
        secondaryStatus: "maintenance",
        startTime: moment("2024-06-06T01:00:00.000Z"),
        endTime: moment("2024-06-06T02:00:00.000Z"),
      },
      {
        status: "down",
        secondaryStatus: "repair",
        startTime: moment("2024-06-06T02:00:00.000Z"),
        endTime: moment("2024-06-06T03:00:00.000Z"),
      },
    ];

    const expected = [
      {
        status: "down_waiting",
        secondaryStatus: "maintenance",
        startTime: moment("2024-06-06T00:00:00.000Z"),
        endTime: moment("2024-06-06T02:00:00.000Z"),
      },
      {
        status: "down",
        secondaryStatus: "repair",
        startTime: moment("2024-06-06T02:00:00.000Z"),
        endTime: moment("2024-06-06T03:00:00.000Z"),
      },
    ];

    const result = consolidateDeltas(deltas);
    expect(result).toEqual(expected);
  });

  test("should not consolidate non-consecutive deltas with the same status and secondaryStatus", () => {
    const deltas = [
      {
        status: "down",
        secondaryStatus: "maintenance",
        startTime: moment("2024-06-06T00:00:00.000Z"),
        endTime: moment("2024-06-06T01:00:00.000Z"),
      },
      {
        status: "down",
        secondaryStatus: "maintenance",
        startTime: moment("2024-06-06T02:00:00.000Z"),
        endTime: moment("2024-06-06T03:00:00.000Z"),
      },
    ];

    const expected = [
      {
        status: "down",
        secondaryStatus: "maintenance",
        startTime: moment("2024-06-06T00:00:00.000Z"),
        endTime: moment("2024-06-06T01:00:00.000Z"),
      },
      {
        status: "down",
        secondaryStatus: "maintenance",
        startTime: moment("2024-06-06T02:00:00.000Z"),
        endTime: moment("2024-06-06T03:00:00.000Z"),
      },
    ];

    const result = consolidateDeltas(deltas);
    expect(result).toEqual(expected);
  });

  test("should consolidate multiple consecutive deltas with the same status and secondaryStatus", () => {
    const deltas = [
      {
        status: "down",
        secondaryStatus: "maintenance",
        startTime: moment("2024-06-06T00:00:00.000Z"),
        endTime: moment("2024-06-06T01:00:00.000Z"),
      },
      {
        status: "down",
        secondaryStatus: "maintenance",
        startTime: moment("2024-06-06T01:00:00.000Z"),
        endTime: moment("2024-06-06T02:00:00.000Z"),
      },
      {
        status: "down",
        secondaryStatus: "maintenance",
        startTime: moment("2024-06-06T02:00:00.000Z"),
        endTime: moment("2024-06-06T03:00:00.000Z"),
      },
    ];

    const expected = [
      {
        status: "down",
        secondaryStatus: "maintenance",
        startTime: moment("2024-06-06T00:00:00.000Z"),
        endTime: moment("2024-06-06T03:00:00.000Z"),
      },
    ];

    const result = consolidateDeltas(deltas);
    expect(result).toEqual(expected);
  });
});

describe('splitDeltas', () => {
  test('should split a delta correctly when modified delta is within original delta', () => {
    const originalDeltas = [
      { status: 'down', secondaryStatus: 'maintenance', startTime: moment('2024-06-06T00:00:00.000Z').toISOString(), endTime: moment('2024-06-06T09:00:00.000Z').toISOString() },
    ];

    const modifiedDelta = {
      status: 'down', secondaryStatus: 'repair', startTime: moment('2024-06-06T05:00:00.000Z').toISOString(), endTime: moment('2024-06-06T06:00:00.000Z').toISOString()
    };

    const expected = [
      { status: 'down', secondaryStatus: 'maintenance', startTime: moment('2024-06-06T00:00:00.000Z').toISOString(), endTime: moment('2024-06-06T05:00:00.000Z').toISOString() },
      { status: 'down', secondaryStatus: 'repair', startTime: moment('2024-06-06T05:00:00.000Z').toISOString(), endTime: moment('2024-06-06T06:00:00.000Z').toISOString() },
      { status: 'down', secondaryStatus: 'maintenance', startTime: moment('2024-06-06T06:00:00.000Z').toISOString(), endTime: moment('2024-06-06T09:00:00.000Z').toISOString() }
    ];

    const result = splitDeltas(originalDeltas, modifiedDelta);
    expect(result).toEqual(expected);
  });

  test('should not split when modified delta does not overlap', () => {
    const originalDeltas = [
      { status: 'down', secondaryStatus: 'maintenance', startTime: moment('2024-06-06T00:00:00.000Z').toISOString(), endTime: moment('2024-06-06T05:00:00.000Z').toISOString() },
      { status: 'down', secondaryStatus: 'maintenance', startTime: moment('2024-06-06T06:00:00.000Z').toISOString(), endTime: moment('2024-06-06T09:00:00.000Z').toISOString() },
    ];

    const modifiedDelta = {
      status: 'down', secondaryStatus: 'repair', startTime: moment('2024-06-06T10:00:00.000Z').toISOString(), endTime: moment('2024-06-06T11:00:00.000Z').toISOString()
    };

    const expected = [
      ...originalDeltas,
    ];

    const result = splitDeltas(originalDeltas, modifiedDelta);
    expect(result).toEqual(expected);
  });

  test('should split correctly when modified delta starts before original delta', () => {
    const originalDeltas = [
      { status: 'down', secondaryStatus: 'maintenance', startTime: moment('2024-06-06T05:00:00.000Z').toISOString(), endTime: moment('2024-06-06T09:00:00.000Z').toISOString() },
    ];

    const modifiedDelta = {
      status: 'down', secondaryStatus: 'repair', startTime: moment('2024-06-06T04:00:00.000Z').toISOString(), endTime: moment('2024-06-06T06:00:00.000Z').toISOString()
    };

    const expected = [
      { status: 'down', secondaryStatus: 'repair', startTime: moment('2024-06-06T04:00:00.000Z').toISOString(), endTime: moment('2024-06-06T06:00:00.000Z').toISOString() },
      { status: 'down', secondaryStatus: 'maintenance', startTime: moment('2024-06-06T06:00:00.000Z').toISOString(), endTime: moment('2024-06-06T09:00:00.000Z').toISOString() }
    ];

    const result = splitDeltas(originalDeltas, modifiedDelta);
    expect(result).toEqual(expected);
  });

  test('should handle deltas without an endTime', () => {
    const originalDeltas = [
      { status: 'down', secondaryStatus: 'maintenance', startTime: moment('2024-06-06T00:00:00.000Z').toISOString(), endTime: undefined },
    ];

    const modifiedDelta = {
      status: 'down', secondaryStatus: 'repair', startTime: moment('2024-06-06T04:00:00.000Z').toISOString(), endTime: moment('2024-06-06T06:00:00.000Z').toISOString()
    };

    const expected = [
      { status: 'down', secondaryStatus: 'maintenance', startTime: moment('2024-06-06T00:00:00.000Z').toISOString(), endTime: moment('2024-06-06T04:00:00.000Z').toISOString() },
      { status: 'down', secondaryStatus: 'repair', startTime: moment('2024-06-06T04:00:00.000Z').toISOString(), endTime: moment('2024-06-06T06:00:00.000Z').toISOString() },
      { status: 'down', secondaryStatus: 'maintenance', startTime: moment('2024-06-06T06:00:00.000Z').toISOString(), endTime: undefined },
    ];

    const result = splitDeltas(originalDeltas, modifiedDelta);
    expect(result).toEqual(expected);
  });
});