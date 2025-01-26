const Technician = require('../models/Technician');

/* CREATE */
exports.addTechnician = async(req, res) => {
    try {
        const data = req.body;
        const newTechnician = new Technician(data);
        if (!newTechnician) return res.status(400).json({msg: "There was an error adding a new technician"});

        await newTechnician.save();
        res.status(200).json(newTechnician);  
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

/* READ */
exports.getAllTechnicans = async (req, res) => {
    try {
        const allTechnicians = await Technician.find({});
        res.status(200).json(allTechnicians);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

exports.getTechnician = async (req, res) => {
    try {
        const id = req.params.id
        const technician = await Technician.findOne({_id: id});
        if (!technician) return await res.status(400).json({error: "There was an issue fetching this technician."});
        res.status(200).json({technician});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

exports.getAssignedTechnicians = async(req, res) => {
    try {
        const ids = req.body.technicianIds; // Array of technician IDs
        if (!Array.isArray(ids)) {
            return res.status(400).json({ error: 'Invalid input' });
        }
        const technicians = await Technician.find({ '_id': { $in: ids } });
        res.status(200).json(technicians);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

/* UPDATE */
exports.updateTechnician = async (req, res) => {
    try {
        const id = req.params.id;
        const update = req.body
        const updatedTechnician = await Technician.findOneAndUpdate({_id: id}, update, { new: true });
        if (!updatedTechnician) return await res.status(400).json({msg: "An error occured while updating this technician record."});
        res.status(200).json({updatedTechnician});
    } catch(error) {
        res.status(500).json({error: error.message});
    }
}