const moment = require("moment");
const { readEventDelta } = require("./EventDeltaController");
const EventDelta = require("../models/EventDelta");

// Format original deltas with correct start and endtime data from MongoDB.
const formatOriginalDeltas = async (originalDeltas) => {
  return Promise.all(
    originalDeltas.map(async (delta) => {
      if (delta.id) {
        const existingDelta = await readEventDelta(delta.id);
        if (existingDelta) {
          return {
            ...delta,
            startTime: moment(existingDelta.startTime).toISOString(),
            endTime: existingDelta.endTime
              ? moment(existingDelta.endTime).toISOString()
              : undefined,
          };
        }
      }
      return {
        ...delta,
        startTime: moment(delta.startTime).toISOString(),
        endTime: delta.endTime
          ? moment(delta.endTime).toISOString()
          : undefined,
      };
    })
  );
};

// Format modified deltas with the provided date
const formatModifiedDeltas = async (modifiedDeltas, date) => {
  return Promise.all(
    modifiedDeltas.map(async (delta) => {
      const formattedStartTime = moment(
        date + " " + delta.startTime,
        "YYYY-MM-DD HH:mm"
      ).toISOString();
      const formattedEndTime = moment(
        date + " " + delta.endTime,
        "YYYY-MM-DD HH:mm"
      ).toISOString();
      return {
        ...delta,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
      };
    })
  );
};

const sortDeltas = (deltas) => {
  return deltas.sort(
    (a, b) => moment(a.startTime).valueOf() - moment(b.startTime).valueOf()
  );
}

const consolidateDeltas = (deltas) => {
  if (deltas.length === 0) return deltas;

  const sortedDeltas = sortDeltas(deltas);

  const consolidated = [];
  let currentDelta = sortedDeltas[0];

  for (let i = 1; i < sortedDeltas.length; i++) {
    const delta = sortedDeltas[i];
    if (
      delta.status === currentDelta.status &&
      delta.secondaryStatus === currentDelta.secondaryStatus
    ) {
      if (
        moment(delta.startTime).isSame(currentDelta.endTime) ||
        moment(delta.startTime).isBefore(currentDelta.endTime)
      ) {
        currentDelta.endTime = moment
          .max(moment(currentDelta.endTime), moment(delta.endTime))
          .toISOString();
      } else {
        consolidated.push(currentDelta);
        currentDelta = delta;
      }
    } else {
      consolidated.push(currentDelta);
      currentDelta = delta;
    }
  }

  consolidated.push(currentDelta);
  return consolidated;
};

const splitDeltas = (originalDeltas, modifiedDelta) => {
  const splitResult = [];
  const deltasToDelete = [];

  for (const delta of originalDeltas) {
    const deltaStart = moment(delta.startTime);
    const deltaEnd = delta.endTime
      ? moment(delta.endTime)
      : moment().add(1, "day"); // Ongoing delta w/o endtime
    const modifiedStart = moment(modifiedDelta.startTime);
    const modifiedEnd = moment(modifiedDelta.endTime);

    if (
      modifiedStart.isBetween(deltaStart, deltaEnd, null, "[)") ||
      modifiedEnd.isBetween(deltaStart, deltaEnd, null, "(]") ||
      (modifiedStart.isSameOrBefore(deltaStart) &&
        modifiedEnd.isSameOrAfter(deltaEnd))
    ) {
      // Check if the modified delta fully contains the original delta
      if (
        modifiedStart.isSameOrBefore(deltaStart) &&
        modifiedEnd.isSameOrAfter(deltaEnd)
      ) {
        // Update the delta with the modified delta's status and secondary status
        console.log({"modifiedStart.isSameOrBefore(deltaStart) && modifiedEnd.isSameOrAfter(deltaEnd)": {
          ...delta,
          status: modifiedDelta.status,
          secondaryStatus: modifiedDelta.secondaryStatus,
        }})
        splitResult.push({
          ...delta,
          status: modifiedDelta.status,
          secondaryStatus: modifiedDelta.secondaryStatus,
        });

        // Check if preceding delta has the same status and secondary status
        const precedingDelta = splitResult[splitResult.length - 2];
        if (
          precedingDelta &&
          precedingDelta.status === modifiedDelta.status &&
          precedingDelta.secondaryStatus === modifiedDelta.secondaryStatus
        ) {
          precedingDelta.endTime = modifiedEnd.toISOString();
          splitResult.pop();
          deltasToDelete.push(delta.id);
        }

        // Check if following delta has the same status and secondary status
        const followingDelta = originalDeltas.find((d) =>
          moment(d.startTime).isSame(modifiedEnd)
        );
        if (
          followingDelta &&
          followingDelta.status === modifiedDelta.status &&
          followingDelta.secondaryStatus === modifiedDelta.secondaryStatus
        ) {
          precedingDelta.endTime = followingDelta.endTime;
          deltasToDelete.push(followingDelta.id);
        }
      } else {
        // Split the original delta
        if (
          modifiedStart.isAfter(deltaStart) ||
          (modifiedStart.isAfter(deltaStart) && modifiedEnd.isAfter(deltaEnd))
        ) {
          console.log({"modifiedStart.isAfter(deltaStart) || (modifiedStart.isAfter(deltaStart) && modifiedEnd.isAfter(deltaEnd))": {
            ...delta,
            endTime: modifiedStart.toISOString(),
          }})

          splitResult.push({
            ...delta,
            endTime: modifiedStart.toISOString(),
          }); 

          const followingDelta = originalDeltas.find((d) =>
            moment(d.startTime).isSame(modifiedEnd)
          );
          if (
            followingDelta &&
            followingDelta.status === modifiedDelta.status &&
            followingDelta.secondaryStatus === modifiedDelta.secondaryStatus
          ) {
            delta.id = followingDelta.id;
            deltasToDelete.push(followingDelta.id);
          }
        } else if (modifiedEnd.isAfter(deltaStart)) {
          console.log({"modifiedEnd.isAfter(deltaStart)": {
            ...delta,
            startTime: modifiedEnd.toISOString(),
          }})
          splitResult.push({
            ...delta,
            startTime: modifiedEnd.toISOString(),
          });
        }
        splitResult.push(modifiedDelta);
        if (!delta.endTime || modifiedEnd.isBefore(deltaEnd)) {
          console.log({"!delta.endTime || modifiedEnd.isBefore(deltaEnd)": {
            ...delta,
            id: undefined,
            startTime: modifiedEnd.toISOString(),
          }})
          splitResult.push({
            ...delta,
            id: undefined,
            startTime: modifiedEnd.toISOString(),
          });
        }
      }
    } else {
      splitResult.push(delta);
    }
  }
  return { splitResult, deltasToDelete };
};

// Main function to process the deltas
const processDeltas = async (date, originalDeltas, modifiedDeltas) => {
  const formattedOriginalDeltas = await formatOriginalDeltas(originalDeltas);
  const formattedModifiedDeltas = await formatModifiedDeltas(
    modifiedDeltas,
    date
  );
  console.log({"Processing deltas": {
    formattedOriginalDeltas: formattedOriginalDeltas, 
    formattedModifiedDeltas: formattedModifiedDeltas,
  }})

  // Split and consolidate deltas
  let allDeltas = [...formattedOriginalDeltas];
  let deltasToDelete = [];

  // Consolidate Modified Deltas before splitting
  const consolidatedModifiedDeltas = consolidateDeltas([
    ...formattedModifiedDeltas,
  ]);

  console.log({"Consolidated Modified Deltas": consolidatedModifiedDeltas})

  for (const modifiedDelta of consolidatedModifiedDeltas) {
    const { splitResult, deltasToDelete: newDeltasToDelete } = splitDeltas(
      allDeltas,
      modifiedDelta
    );
    allDeltas = splitResult;
    deltasToDelete = [...deltasToDelete, ...newDeltasToDelete];
  }

  console.log({"Final deltas before consolidation": allDeltas});
  const finalDeltas = consolidateDeltas(allDeltas);
  console.log({"Final deltas after consolidation": finalDeltas});

  return { finalDeltas, deltasToDelete };
};

const updateDeltas = async (date, originalDeltas, modifiedDeltas) => {
  // Process the deltas
  console.log({"Updating deltas": {
    date: date, 
    originalDeltas: originalDeltas, 
    modifiedDeltas: modifiedDeltas}
  })

  const { finalDeltas, deltasToDelete } = await processDeltas(
    date,
    originalDeltas,
    modifiedDeltas
  );

  await applyDeltaChanges(finalDeltas, deltasToDelete);
  return finalDeltas;
};

const applyDeltaChanges = async (deltas, deltasToDelete) => {
  try {
    for (const delta of deltas) {
      if (delta.id) {
        const { id, ...deltaWithoutId } = delta;
        console.log({"Delta to update": delta});
        await EventDelta.findByIdAndUpdate(id, deltaWithoutId, { new: true });
      } else {
        console.log({"Add new delta (No id)": delta});
        const { id, ...additionWithoutId } = delta;
        const newDelta = new EventDelta(additionWithoutId);
        await newDelta.save();
      }
    }

    console.log({"Deltas to delete": deltasToDelete})

    for (const id of deltasToDelete) {
      await EventDelta.findByIdAndDelete(id);
    }
  } catch (error) {
    console.error("Error applying delta changes:", error);
    throw error;
  }
};

module.exports = {
  processDeltas,
  formatOriginalDeltas,
  formatModifiedDeltas,
  splitDeltas,
  consolidateDeltas,
  updateDeltas,
  applyDeltaChanges,
};
