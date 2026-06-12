const driversModel = require('../models/driversModel');

const getDrivers = (req, res) => {
    driversModel.getDrivers((err, results) => {
        if(err){
            res.status(500).json(err);
        } else {
            res.json(results);
        }
    });
};

module.exports = {
    getDrivers
};