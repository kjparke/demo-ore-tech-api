const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EventSchema = new Schema(
    {
        unitId: {
            type: String, 
            required: true,
        }, 

        status: {
            type: String, 
            required: true, 
        },

        toBePlanned: {
            type: Boolean,
            default: false,
        }, 

        toBeTowed: {
            type: Boolean,
            default: false
        },

        toBeScheduled: {
            type: Boolean, 
            default: false, 
        },

        readyToBreakIn: {
            type: Boolean, 
            default: false, 
        },

        washed: {
            type: Boolean,
            default: false
        },

        releasedToOps: {
            type: Boolean, 
            default: false, 
        },

        lastUpdatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        isManuallyAdded: {
            type: Boolean, 
            default: false,
        },
        isStatusChangeManual: {
            type: Boolean, 
            default: false 
        },
        location: { 
            type: String, 
            default: "Recent Downs"
        },
        bay: { 
            type: String, 
            default: "",
        },
        temp_assignedTechnicians: [{ type: String }],
        conflict: Boolean,
        hoursInStatus: String,
        workOrderNumber: String, 
        purchaseOrderNumber: String, 
        purchaseOrderExpectedDate: Date, 
        secondaryStatus: String,
        downDate: Date,
        scheduleOutDate: Date,
        scheduledInDate: Date, 
        revisedOutDate: Date,
        actualOutDate: Date,
    }, 
    { timestamps: true }
);

const Event = mongoose.model("Event", EventSchema);
module.exports = Event;