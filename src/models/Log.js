const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema(
    {
        eventId: {
            type: String, 
            required: true,
        },

        eventChangeText: {
            type: String, 
            required: true, 
        },

        userId: {
            type: String, 
            required: true, 
        },

        eventStatus: { type: String },
        eventSecondaryStatus: { type: String },
    }, 
    { timestamps: true}, 
    { strict: true },
    { strictQuery: true },
    { strictPopulate: false },
);

const Log = mongoose.model("Log", LogSchema);
module.exports = Log;