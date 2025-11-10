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

  const sql = `CREATE TABLE IF NOT EXISTS bus_locations (
    bus_id INT PRIMARY KEY,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );`;

  try {
    await pool.query(sql);
    console.log('bus_locations table created (or already exists)');
  } catch (err) {
    console.error('Failed to create bus_locations table:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
