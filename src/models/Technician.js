const mongoose = require('mongoose');

const TechnicianSchema = new mongoose.Schema(
    {
        firstName: {
            type: String, 
            required: true,
        }, 

        lastName: {
            type: String, 
            required: true, 
        },

        title: { type: String },
    }
);

const Technician = mongoose.model("Technician", TechnicianSchema);
module.exports = Technician;