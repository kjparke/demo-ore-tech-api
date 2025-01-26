const mongoose = require("mongoose");

const AHSAssetSchema = new mongoose.Schema(
	{
		unitId: { 
            type: String, 
            unique: true, 
            required: true 
        },
		swingable: {
            type: String, 
            default: ""
        }, 
        minestarVersion: {
            type: String, 
            default: ""
        },
        lastUpdatedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		}
	}, 
    {timestamps: true}
);

const AHSAsset = mongoose.model("AHSASset", AHSAssetSchema);
module.exports = AHSAsset;