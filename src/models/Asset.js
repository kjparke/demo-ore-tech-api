const mongoose = require("mongoose");

const AssetSchema = new mongoose.Schema(
    {
        unitId: {
            type: String, 
            required: true,
            unique: true,
        },
        
        modelCode: {
            type: String, 
            required: true,
        },
        
        status: {
            type: String, 
            required: true, 
        },

        location: {
            type: String,
            default: "Recent Downs",
        }, 

        isManualImport: {
            type: Boolean,
            default: false,
        },

        activeEvent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
        },

        secondaryStatus: { type: String },
        fms: { type: String },
        equipmentType: { type: String },
        truckType: { type: String },
        wencoStatus: { type: String },
        minestarStatus: { type: String },
        refreshedTime: { type: Date }, 
        operatingType: { type: String },
    }
);
AssetSchema.index({ unitId: 1, modelCode: 1, location: 1, secondaryStatus: 1 });
const Asset = mongoose.model("Asset", AssetSchema);
module.exports = Asset;