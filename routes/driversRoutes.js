const express = require('express');
const router = express.Router();

const driversController = require('../controllers/driversController');

router.get('/drivers', driversController.getDrivers);

module.exports = router;