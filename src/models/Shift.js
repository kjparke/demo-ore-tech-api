const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema(
    {
        shiftSupervisor: {
            type: String, 
            min: 2, 
            max: 25
        },

        shiftChangeMessage: {
            type: String, 
            min: 2
        },

        startDateTime: {
            type: Date,
        },

        endDateTime: {
            type: Date,
        }, 

        techicians: {
            type: Array, 
            default: [],
        }
    }
);

const Shift = mongoose.model("Shift", ShiftSchema);
module.exports = Shift;