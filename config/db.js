const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'E{Md"ht09*x2',
    database: 'f1_db'
});

connection.connect((err) => {
    if(err){
        console.log('Error de conexión:', err);
    } else {
        console.log('MySQL conectado');
    }
});

module.exports = connection;