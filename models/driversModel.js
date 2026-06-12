const db = require('../config/db');

const getDrivers = (callback) => {
    db.query('SELECT * FROM drivers LIMIT 20', callback);
};

module.exports = {
    getDrivers
};