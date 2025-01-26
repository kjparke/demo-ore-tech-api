const User = require("../models/User");

exports.addUser = async (newUser) => {
  const user = new User(newUser);
  return user.save();
};

exports.findUser = async (email) => {
  try {
    return await User.findOne({ email: email });
  } catch (error) {
    console.error(error);
  }
};

exports.updateUserById = async (id, updatedUser) => {
  try {
    const filter = { _id: id };
    const user = await User.findOneAndUpdate(filter, updatedUser);
    return user;
  } catch (error) {
    console.error(error);
  }
};

exports.updateUserByEmail = async (email, update) => {
  try {
    const user = await User.findOneAndUpdate({ email }, update, {new: true});
    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};
