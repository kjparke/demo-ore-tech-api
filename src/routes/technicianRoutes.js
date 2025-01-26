const express = require('express');
const technicianController = require('../controllers/TechnicianController');

const router = express.Router();

router.post('/', technicianController.addTechnician);
router.get('/', technicianController.getAllTechnicans);
router.get('/:id', technicianController.getTechnician);
router.post('/:id/update', technicianController.updateTechnician);

module.exports = router;