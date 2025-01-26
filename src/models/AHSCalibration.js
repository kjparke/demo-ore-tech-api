const mongoose = require("mongoose");

const AHSCalibrationSchema = new mongoose.Schema(
	{
		unitId: { type: String, required: true },
		location: { type: String },
		swingable: { type: String },
		notes: { type: String },
		radarLidarCheck: { type: Boolean, default: false },
		steeringSolenoid: { type: Boolean, default: false },
		brakeSolenoid: { type: Boolean, default: false },
		gams: { type: Boolean, default: false },
		positioningSurvey: { type: Boolean, default: false },
		perceptionCal: { type: Boolean, default: false },
		planningCheckoutStraightAhead: { type: Boolean, default: false },
		planningCheckoutSteering: { type: Boolean, default: false },
		planningCheckoutBraking: { type: Boolean, default: false },
		planningCheckoutInCycle: { type: Boolean, default: false },
		minestarVersion: { type: String },
		shopReleaseDate: { type: String }, 
		dateOfCals: { type: String },
		isArchived: { type: Boolean, default: false},
		completedAt: {type: String},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		lastUpdatedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		completedBy: {
			type: mongoose.Schema.Types.ObjectId, 
			ref: "User"
		}
	}, 
	{ timestamps: true },
);

const AHSCalibration = mongoose.model("AHSCalibration", AHSCalibrationSchema);
module.exports = AHSCalibration;