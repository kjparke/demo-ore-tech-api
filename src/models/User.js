const mongoose = require('mongoose');

const UserScheme = new mongoose.Schema(
    {
        firstName: {
            type: String, 
            required: true,
        }, 

        lastName: {
            type: String, 
            required: true, 
        },

        password: {
            type: String, 
            required: true, 
            min: 8, 
        }, 

        email: {
            type: String, 
            required: true, 
            unique: true, 
        },

        accessLevel: {
            type: Number, 
            required: true, 
        }, 

        lastLoggedIn: {
            type: Date, 
            default: Date.now, 
        }, 
        hasTemporaryPassword: {
            type: Boolean, 
            default: true,
        }, 
        isActive: {
            type: Boolean, 
            default: true, 
        }
    }, 
    { timestamps: true }
);

const User = mongoose.model("User", UserScheme);
module.exports = User;