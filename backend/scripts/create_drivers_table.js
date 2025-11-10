const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'bustrack',
    waitForConnections: true,
    connectionLimit: 1,
  });

  const sql = `CREATE TABLE IF NOT EXISTS drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    secret_code VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

  try {
    await pool.query(sql);
    console.log('drivers table created (or already exists)');
  } catch (err) {
    console.error('Failed to create drivers table:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
