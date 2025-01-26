const { _updateAsset } = require("../../AssetController.js");
const { _updateEvent, readEventById } = require("../../EventController.js");

exports.updateEventDetail = async (eventDetail) => {
	// Delete attributes that may cause conflicts.
	if (eventDetail.activeEvent) {
		delete eventDetail.activeEvent.assignedTechnicians;
		delete eventDetail.activeEvent.createdAt;
	}

	const activeEvent = eventDetail.activeEvent

	const lastEvent = await readEventById(activeEvent._id)

	if (this.statusChanged(lastEvent, activeEvent)) activeEvent.isStatusChangeManual = true;

	await _updateEvent({ _id: activeEvent._id }, activeEvent);
	
	delete activeEvent._id;
	await _updateAsset({ unitId: activeEvent.unitId }, activeEvent);
};

exports.statusChanged = (oldEvent, newEvent) => {
	return oldEvent.status !== newEvent.status 
	|| oldEvent.secondaryStatus !== newEvent.secondaryStatus
}
