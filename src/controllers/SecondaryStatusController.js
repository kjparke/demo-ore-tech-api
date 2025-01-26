const SecondaryStatus = require("../models/SecondaryStatus");

exports.createSecondaryStatus = async (secondaryStatus) => {
  try {
    const formattedSecondaryStatus = secondaryStatus.trim();
    const newSecondaryStatus = new SecondaryStatus({ name: formattedSecondaryStatus });
    return await newSecondaryStatus.save();
  } catch (error) {
    console.error(error);
    throw new Error("There was an error while creating new secondary status");
  }
};

exports.readAllSecondaryStatus = async () => {
  try {
    const secondaryStatuses = await SecondaryStatus.find({}).select('name');
    const names = secondaryStatuses.map(status => status.name);

    const sortedNames = names.sort((a, b) => a.localeCompare(b));

    return sortedNames;
  } catch (error) {
    console.error(error);
    throw new Error("Error encountered while reading secondary status");
  }
};

exports.readOneSecondaryStatus = async (name) => {
	try {
		return await SecondaryStatus.findOne({ name: name });
	} catch (error) {
		console.error(error);
		throw new Error("Error encountered while reading secondary status.");
	}
}