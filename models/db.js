const mysql = require('mysql2');

// Create a connection pool (this is better for performance)
const db = mysql.createPool({
host: 'mysql-hackpoop-hackpoop.g.aivencloud.com',
user: 'avnadmin',
password: 'AVNS_L3BEnyCfrY-vVq5sPXM',
database: 'defaultdb'
});

module.exports = db;