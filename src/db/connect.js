const mysql = require('mysql2');

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  supportBigNumbers: true
});

// 👉 Garantir UTF-8 em toda nova conexão
pool.on('connection', function (connection) {
  connection.query("SET NAMES utf8mb4;");
  connection.query("SET CHARACTER SET utf8mb4;");
  connection.query("SET SESSION collation_connection = 'utf8mb4_unicode_ci';");
});

module.exports = pool;
