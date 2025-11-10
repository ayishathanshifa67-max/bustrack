const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'bustrack',
  });

  try {
    const [tables] = await pool.query('SHOW TABLES');
    console.log('tables:', tables);
    const [drivers] = await pool.query("SHOW TABLES LIKE 'drivers'");
    if (drivers.length === 0) {
      console.log('drivers table does not exist');
    } else {
      const [cols] = await pool.query('SHOW COLUMNS FROM drivers');
      console.log('drivers columns:', cols);
    }
  } catch (err) {
    console.error('DB error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
