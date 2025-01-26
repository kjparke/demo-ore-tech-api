exports._isNewDelta = (currentEventUpdate, prevEvent) => {
  const isStatusChanged = currentEventUpdate.status !== prevEvent.status;
  const isSecondaryStatusChanged =
    currentEventUpdate.secondaryStatus !== prevEvent.secondaryStatus;

  return isStatusChanged || isSecondaryStatusChanged;
};

exports._isNewLocation = (currentEventUpdate, prevEvent) => {
  const isLocationChanged = currentEventUpdate.location !== prevEvent.location;
  const isBayChanged = currentEventUpdate.bay !== prevEvent.bay;

  return isLocationChanged || isBayChanged;
};
