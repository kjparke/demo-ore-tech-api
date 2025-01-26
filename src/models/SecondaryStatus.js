const mongoose = require("mongoose");

const SecondaryStatusModel = new mongoose.Schema(
  {
    name: { 
			type: String,
			unique: true, 
			require: true },
  },
  { timestamps: true }
);

const SecondaryStatus = mongoose.model("secondaryStatus", SecondaryStatusModel);
module.exports = SecondaryStatus;
