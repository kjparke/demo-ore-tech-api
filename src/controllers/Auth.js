const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const UserModel = require('../models/User');
const user      = require('./UserController');
const formvalidation = require('./FormValidation');

exports.register = async(req, res) => {
    try {
        const {
            firstName,
            lastName, 
            email,
            password, 
            accessLevel
        } = req.body;
        
        if (formvalidation.isEmailInvalid(email)) return res.status(401).json({message: "Invalid email"});
        if (formvalidation.isPasswordInvalid(password)) return res.status(401).json({message: "Invalid password"});

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(password, salt);
        const newUser = new UserModel({
            firstName, 
            lastName, 
            email, 
            password: passwordHash, 
            accessLevel
        });
        const savedUser = await user.addUser(newUser);
        delete savedUser.password;
        res.status(201).json(savedUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.signin = async(req, res) => {
    try {
        const email = req.body.email.toLowerCase();
        const password = req.body.password;

        const signedInUser = await user.findUser(email);
        if (!signedInUser) return res.status(400).json({msg: "Incorrect credentials. Please try again."});

        const isMatch = await bcrypt.compare(password, signedInUser.password); 
        if (!isMatch) return res.status(400).json({msg: "Incorrect credentials. Please try again."});

        const token = jwt.sign({id: signedInUser._id}, process.env.JWT_SECRET);
        delete signedInUser.password;

        /* Last logged in updated */
        signedInUser.lastLoggedIn = new Date;
        await signedInUser.save();

        res.status(200).json({
            id: signedInUser._id, 
            firstName: signedInUser.firstName, 
            lastName: signedInUser.lastName,
            email: signedInUser.email, 
            accessLevel: signedInUser.accessLevel,
            accessToken: token,
            lastLoggedIn: signedInUser.lastLoggedIn,
        });
    } catch (error) {
        res.status(500).json({ "Server Error During Sign in": error.message });
    }
}

exports.adminResetPassword = async (req, res) => {
    try {
        const { email, temporaryPassword } = req.body;

        const salt = await bcrypt.genSalt();
        const temporaryPasswordHash = await bcrypt.hash(temporaryPassword, salt);
        const updatedUser = await user.updateUserByEmail(email, { password: temporaryPasswordHash });

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.changePassword = async(req, res) => {
    try {
        const { email, oldPassword, newPassword } = req.body;
        
        const foundUser = await user.findUser(email);
        
        if (!foundUser) return res.status(400).json({ msg: "Could not find user." });
        
        const isOldPasswordCorrect = await bcrypt.compare(oldPassword, foundUser.password);
        if (!isOldPasswordCorrect) return res.status(400).json({ msg: "Old password is incorrect. Please try again." });
        
        if (oldPassword === newPassword) return res.status(400).json({ msg: "New password cannot be the same as the old password." });

        const salt = await bcrypt.genSalt();
        const newPasswordHash = await bcrypt.hash(newPassword, salt);
        
        const updatedUser = await user.updateUserById(foundUser._id, { password: newPasswordHash });
        delete updatedUser.password;
        
        return res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.changeEmail = async(req, res) => {
    try {
        const {email, newEmail, password} = req.body;
        const foundUser = await user.findUser(email);
        if (!foundUser) return res.status(400).json({ msg: "Could not find user." });
        const isPasswordCorrect = await bcrypt.compare(password, foundUser.password);
        if (!isPasswordCorrect) return res.status(200).json({msg: "Please enter the correct password before your email is changed."});
        const updatedUser = await user.updateUserById(foundUser._id, {email: newEmail});
        delete updatedUser.password;
        res.status(200).json({updatedUser});
    } catch(error) {
        res.status(500).json({error: error.message});
    }
}

exports.updateName = async(req, res) => {
    try {
        const {email, firstName, lastName} = req.body
        const foundUser = await user.findUser(email);
        if (!foundUser) return res.status(400).json({ msg: "Could not find user." });
        const updatedUser = await user.updateUserById(foundUser._id, {firstName: firstName, lastName: lastName});
        res.status(201).json(updatedUser);
    } catch(error) {
        res.status(500).json({error: error.message});
    }
}

exports.changeAccessLevel = async(req, res) => {
    try {
        const {email, accessLevel} = req.body
        const foundUser = await user.findUser(email);
        if (!foundUser) return res.status(400).json({ msg: "Could not find user." });
        const updatedUser = await user.updateUserById(foundUser._id, {accessLevel: accessLevel});
        res.status(200).json({updatedUser});
    } catch(error) {
        res.status(500).json({error: error.message});
    }
}