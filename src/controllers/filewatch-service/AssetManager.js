const { OPERATIONAL_STATUSES, DOWN_STATUSES,} = require("../../constants/constants");
const { _createEvent, _updateEvent, readOneEvent } = require("../EventController");
const { _createAsset, _updateAsset } = require("../AssetController");
const moment = require("moment");

class AssetManager {
  constructor() {}

  // Create new asset event.
  async createNewAssetAndEvent(jsonAsset) {
    try {
      const newEvent = await _createEvent({
        ...jsonAsset,
        location: "Recent Downs",
        bay: "",
        downDate: moment(),
      });

      const newAsset = await _createAsset({
        ...jsonAsset,
        fms: jsonAsset.FMS,
        activeEvent:
          newEvent && this.isAssetDown(jsonAsset.status) ? newEvent._id : null,
      });

      Promise.all([newEvent.save(), newAsset.save()]);
    } catch (error) {
      console.error("Create asset and event error", error);
    }
  }

  // Updates a downed asset, aka, an active event.
  async updateActiveEvent(jsonAsset, dbAsset) {
    try {
      if (dbAsset.activeEvent.isStatusChangeManual) return;
      // Convert the activeEvent to a JSON-like object
      const activeEvent = dbAsset.activeEvent.toObject
        ? dbAsset.activeEvent.toObject()
        : dbAsset.activeEvent;

      // Merge activeEvent with the jsonAsset
      const eventUpdate = Object.assign({}, activeEvent, jsonAsset);
      delete eventUpdate._id;

      // Update event and asset separately
      await _updateEvent({ _id: activeEvent._id }, eventUpdate);
      await _updateAsset({ unitId: jsonAsset.unitId }, jsonAsset);
    } catch (error) {
      console.error("Update active event error", error);
    }
  }

  // Creates a new operational event and removes the active event object from the asset
  async updateToOperational(jsonAsset, dbAsset) {
    try {
      // Update last active event 
      if (dbAsset.activeEvent) {
        const activeEvent = dbAsset.activeEvent.toObject
          ? dbAsset.activeEvent.toObject()
          : dbAsset.activeEvent;

        // Combine changes of the jsonAsset with the existing dbAsset. 
        const eventUpdate = Object.assign({}, activeEvent, jsonAsset);
        delete eventUpdate._id;
        
        // Keep previous statuses - update other attributes.
        eventUpdate.status = dbAsset.status
        eventUpdate.secondaryStatus = dbAsset.secondaryStatus

        // End last down event
        const filter = { _id: activeEvent._id };
        const update = { ...eventUpdate, actualOutDate: new Date() }
        await _updateEvent(filter, update);
      }

      // Create new operational event
      await _createEvent({
        ...jsonAsset,
        location: "",
        bay: "",
      });

      // Update asset
      const filter = { unitId: jsonAsset.unitId }
      const update = {
        ...jsonAsset,
        fms: jsonAsset.FMS, 
        location: "",
        bay: "",
        activeEvent: null,
      }

      await _updateAsset(filter, update);
    } catch (error) {
      console.error("Update to operational error", error);
    }
  }

  // Creates a new down event. 
  // No need to get the dbAsset because actualOutDates are not set for assets that are not down. 
  async updateToDown(jsonAsset) {
    try {
      // Create new down event
      const newEvent = await _createEvent({
        ...jsonAsset,
        location: "Recent Downs",
        bay: "",
        downDate: moment(),
      });

      // Update asset
      await _updateAsset(
        {
          unitId: jsonAsset.unitId,
        },
        {
          ...jsonAsset,
          location: "Recent Downs",
          bay: "",
          activeEvent: newEvent._id,
        }
      );
    } catch (error) {
      console.error("Update to down error", error);
    }
  }

  // Creates a new operational event
  async updateOperational(jsonAsset, dbAsset) {
    try {

      // Get last operational event.
      const lastOperationalEvent = await readOneEvent(
        {
          unitId: jsonAsset.unitId, 
          status: { $in: OPERATIONAL_STATUSES }
        }
      )

      const eventUpdate = Object.assign({}, lastOperationalEvent._doc, jsonAsset);
      delete eventUpdate._id;

      await _updateEvent(
        { _id: lastOperationalEvent._id },
        { ...eventUpdate }
      );

      // Update asset
      await _updateAsset(
        {
          unitId: jsonAsset.unitId,
        },
        {
          ...jsonAsset,
        }
      );
    } catch (error) {
      console.error("Update operational error", error);
    }
  }

  // Creates new EXC Event
  async updateToEXC(jsonAsset, dbAsset) {
    /* Update last active event */
    if (dbAsset.activeEvent) {
      const activeEvent = dbAsset.activeEvent.toObject();

      await _updateEvent(
        { _id: activeEvent._id },
        { 
          actualOutDate: moment(),
        }
      );
    }

    try {
      await _createEvent({
        ...jsonAsset,
        location: "",
        bay: "",
      });

      // Update asset
      await _updateAsset(
        {
          unitId: jsonAsset.unitId,
        },
        {
          ...jsonAsset,
          activeEvent: null,
        }
      );
    } catch (error) {
      console.error("Update to EXC error", error);
    }
  }

  // Updates EXC events
  async updateEXC(jsonAsset, dbAsset) {
    try {
      //There are no active events for EXC events so you need to find the latest EXC event. 
      const latestEXCEvent = await readOneEvent(
        {
          unitId: dbAsset.unitId,
          status: "EXC",
        }
      )
      const eventObject = latestEXCEvent.toObject();
      const eventUpdate = Object.assign({}, eventObject, jsonAsset);
      delete eventUpdate._id;

      await _updateEvent(
        { _id: latestEXCEvent._id },
        { ...eventUpdate }
      );

      // Update asset
      await _updateAsset(
        {
          unitId: jsonAsset.unitId,
        },
        {
          ...jsonAsset,
        }
      );
    } catch (error) {
      console.error("Update EXC error", error);
    }
  }

  isAssetDown(status) {
    return DOWN_STATUSES.includes(status)
  }

  isAssetOperational(status) {
    return OPERATIONAL_STATUSES.includes(status)
  }
}

module.exports = AssetManager;
