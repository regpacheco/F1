const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'E{Md"ht09*x2',
    database: 'f1_db'
});

db.connect((err) => {
    if(err){
        console.log('Error MySQL:', err);
    }else{
        console.log('✅ MySQL conectado');
    }
});

/* LISTAR TABLAS */

app.get('/api/tablas', (req, res) => {
    const sql = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'f1_db'
    `;

    db.query(sql, (err, results) => {
        if(err){
            res.status(500).json(err);
        }else{
            res.json(results);
        }
    });
});

/* VER TABLA */

app.get('/api/tabla/:tabla', (req, res) => {
    const tabla = req.params.tabla;
    const sql = `SELECT * FROM ${tabla} LIMIT 100`;

    db.query(sql, (err, results) => {
        if(err){
            console.log(err);
            res.status(500).json(err);
        }else{
            res.json(results);
        }
    });
});

/* LISTA DE PILOTOS */

app.get('/api/drivers', (req, res) => {
    const sql = `
        SELECT
            driverId,
            CONCAT(forename, ' ', surname) AS driverName
        FROM drivers
        ORDER BY surname
    `;

    db.query(sql, (err, results) => {
        if(err){
            console.log(err);
            res.status(500).json(err);
        }else{
            res.json(results);
        }
    });
});

/* ESTADÍSTICAS POR PILOTO */

app.get('/api/drivers/:driverId/stats', (req, res) => {
    const driverId = req.params.driverId;

    const sql = `
        SELECT
            races.year AS season,

            COUNT(results.raceId) AS races,

            SUM(
                CASE
                    WHEN results.positionOrder = 1
                    THEN 1
                    ELSE 0
                END
            ) AS wins,

            SUM(
                CASE
                    WHEN results.positionOrder <= 3
                    THEN 1
                    ELSE 0
                END
            ) AS podiums,

            SUM(results.points) AS points,

            SUM(
                CASE
                    WHEN results.statusId <> 1
                    THEN 1
                    ELSE 0
                END
            ) AS dnfs

        FROM results

        INNER JOIN races
            ON results.raceId = races.raceId

        WHERE results.driverId = ?

        GROUP BY races.year

        ORDER BY races.year
    `;

    db.query(sql, [driverId], (err, results) => {
        if(err){
            console.log(err);
            res.status(500).json(err);
        }else{
            res.json(results);
        }
    });
});

/* TOP 10 PILOTOS */

app.get('/api/top-drivers', (req, res) => {
    const sql = `
        SELECT
            drivers.driverId,
            CONCAT(drivers.forename, ' ', drivers.surname) AS driverName,

            SUM(
                CASE
                    WHEN results.positionOrder = 1
                    THEN 1
                    ELSE 0
                END
            ) AS wins,

            SUM(
                CASE
                    WHEN results.positionOrder <= 3
                    THEN 1
                    ELSE 0
                END
            ) AS podiums,

            SUM(results.points) AS points,

            COUNT(results.raceId) AS races

        FROM drivers

        INNER JOIN results
            ON drivers.driverId = results.driverId

        GROUP BY drivers.driverId, driverName

        ORDER BY wins DESC, podiums DESC, points DESC

        LIMIT 10
    `;

    db.query(sql, (err, results) => {
        if(err){
            console.log(err);
            res.status(500).json(err);
        }else{
            res.json(results);
        }
    });
});

/* TOP 10 CONSTRUCTORES */

app.get('/api/top-constructors', (req, res) => {
    const sql = `
        SELECT
            constructors.constructorId,
            constructors.name AS constructorName,

            SUM(
                CASE
                    WHEN results.positionOrder = 1
                    THEN 1
                    ELSE 0
                END
            ) AS wins,

            SUM(
                CASE
                    WHEN results.positionOrder <= 3
                    THEN 1
                    ELSE 0
                END
            ) AS podiums,

            SUM(results.points) AS points,

            COUNT(results.raceId) AS races

        FROM constructors

        INNER JOIN results
            ON constructors.constructorId = results.constructorId

        GROUP BY constructors.constructorId, constructors.name

        ORDER BY wins DESC, podiums DESC, points DESC

        LIMIT 10
    `;

    db.query(sql, (err, results) => {
        if(err){
            console.log(err);
            res.status(500).json(err);
        }else{
            res.json(results);
        }
    });
});
/* CONSTRUCTORES */

app.get('/api/constructors', (req, res) => {
    const sql = `
        SELECT constructorId, name
        FROM constructors
        ORDER BY name
    `;

    db.query(sql, (err, results) => {
        if(err){
            console.log(err);
            res.status(500).json(err);
        }else{
            res.json(results);
        }
    });
});

app.get('/api/constructor-profile/:id', (req, res) => {
    const constructorId = req.params.id;

    const sql = `
        SELECT
            c.name,
            COUNT(r.resultId) AS races,
            SUM(CASE WHEN r.positionOrder = 1 THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN r.positionOrder <= 3 THEN 1 ELSE 0 END) AS podiums,
            SUM(r.points) AS points,
            SUM(CASE WHEN r.statusId = 1 THEN 1 ELSE 0 END) AS finished
        FROM constructors c
        LEFT JOIN results r
            ON c.constructorId = r.constructorId
        WHERE c.constructorId = ?
        GROUP BY c.constructorId, c.name
    `;

    db.query(sql, [constructorId], (err, results) => {
        if(err){
            console.log(err);
            res.status(500).json(err);
        }else{
            res.json(results[0]);
        }
    });
});
/* CIRCUIT INTELLIGENCE */

app.get('/api/circuit-intelligence', (req, res) => {
    const sql = `
        SELECT
            circuits.name AS circuitName,
            circuits.country,
            COUNT(races.raceId) AS totalRaces,
            MIN(races.year) AS firstYear,
            MAX(races.year) AS lastYear

        FROM circuits

        INNER JOIN races
            ON circuits.circuitId = races.circuitId

        GROUP BY circuits.circuitId, circuits.name, circuits.country

        ORDER BY totalRaces DESC

        LIMIT 10
    `;

    db.query(sql, (err, results) => {
        if(err){
            console.log(err);
            res.status(500).json(err);
        }else{
            res.json(results);
        }
    });
});

/* COMPARADOR DE PILOTOS */

app.get('/api/compare-drivers/:driver1/:driver2', (req, res) => {
    const driver1 = req.params.driver1;
    const driver2 = req.params.driver2;

    const sql = `
        SELECT
            drivers.driverId,
            CONCAT(drivers.forename, ' ', drivers.surname) AS driverName,

            SUM(
                CASE
                    WHEN results.positionOrder = 1
                    THEN 1
                    ELSE 0
                END
            ) AS wins,

            SUM(
                CASE
                    WHEN results.positionOrder <= 3
                    THEN 1
                    ELSE 0
                END
            ) AS podiums,

            SUM(results.points) AS points,

            COUNT(results.raceId) AS races,

            SUM(
                CASE
                    WHEN results.statusId <> 1
                    THEN 1
                    ELSE 0
                END
            ) AS dnfs

        FROM drivers

        INNER JOIN results
            ON drivers.driverId = results.driverId

        WHERE drivers.driverId IN (?, ?)

        GROUP BY drivers.driverId, driverName
    `;

    db.query(sql, [driver1, driver2], (err, results) => {
        if(err){
            console.log(err);
            res.status(500).json(err);
        }else{
            res.json(results);
        }
    });
});

/* ACCESO DIRECTO A CUALQUIER TABLA */

app.get('/api/:tabla', (req, res) => {
    const tabla = req.params.tabla;
    const sql = `SELECT * FROM ${tabla} LIMIT 100`;

    db.query(sql, (err, results) => {
        if(err){
            console.log(err);
            res.status(500).json(err);
        }else{
            res.json(results);
        }
    });
});

/* FRONTEND */

app.get('/', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'index.html')
    );
});

/* SERVIDOR */

app.listen(3000, () => {
    console.log('🚀 Servidor ejecutándose en:');
    console.log('http://localhost:3000');
});
app.get('/api/constructors', (req, res) => {

    const sql = `
        SELECT constructorId, name
        FROM constructors
        ORDER BY name
    `;

    db.query(sql, (err, results) => {
        if(err){
            res.status(500).json(err);
        }else{
            res.json(results);
        }
    });

});

app.get('/api/constructor-profile/:id', (req, res) => {

    const constructorId = req.params.id;

    const sql = `
        SELECT
            c.name,

            COUNT(r.resultId) AS races,

            SUM(CASE WHEN r.positionOrder = 1 THEN 1 ELSE 0 END) AS wins,

            SUM(CASE WHEN r.positionOrder <= 3 THEN 1 ELSE 0 END) AS podiums,

            SUM(r.points) AS points,

            SUM(CASE WHEN s.status = 'Finished' OR s.status LIKE '+%' THEN 1 ELSE 0 END) AS finished

        FROM constructors c

        LEFT JOIN results r
            ON c.constructorId = r.constructorId

        LEFT JOIN status s
            ON r.statusId = s.statusId

        WHERE c.constructorId = ?

        GROUP BY c.constructorId, c.name
    `;

    db.query(sql, [constructorId], (err, results) => {

        if(err){
            res.status(500).json(err);
        }else{
            res.json(results[0]);
        }

    });

});