const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'bustrack',
  waitForConnections: true,
  connectionLimit: 10,
});

// Health endpoint
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Signup route (returns JSON)
app.post('/api/driver/signup', async (req, res) => {
  const { username, password, secretCode } = req.body;
  if (!username || !password || !secretCode) return res.status(400).json({ error: 'Missing fields' });
  try {
    const [exists] = await pool.query('SELECT * FROM drivers WHERE username = ?', [username]);
    if (exists.length > 0) return res.status(409).json({ error: 'User exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO drivers (username, password, secret_code) VALUES (?, ?, ?)', [username, hashedPassword, secretCode]);
    res.status(201).json({ message: 'Signup successful' });
  } catch (err) {
    console.error('Signup error', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Login route (returns JSON)
app.post('/api/driver/login', async (req, res) => {
  const { username, password, secretCode } = req.body;
  if (!username || !password || !secretCode) return res.status(400).json({ error: 'Missing fields' });
  try {
    const [rows] = await pool.query('SELECT * FROM drivers WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch || user.secret_code !== secretCode) return res.status(400).json({ error: 'Invalid credentials' });
    // Return a minimal user object for now (in future add JWT)
    res.json({ message: 'Login successful', user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Driver posts current bus location
app.post('/api/driver/location', async (req, res) => {
  const { bus_id, latitude, longitude } = req.body;
  if (bus_id == null || latitude == null || longitude == null) return res.status(400).json({ error: 'Missing location data' });
  // Basic validation
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return res.status(400).json({ error: 'Invalid latitude/longitude' });
  try {
    // Use REPLACE INTO so we either insert or update the existing bus location row
    await pool.query(
      'REPLACE INTO bus_locations (bus_id, latitude, longitude, updated_at) VALUES (?, ?, ?, NOW())',
      [bus_id, lat, lng]
    );
    res.json({ message: 'Location updated' });
  } catch (err) {
    console.error('Update location error', err);
    res.status(500).json({ error: 'Failed to update location', details: err.message });
  }
});

// Return all bus locations
app.get('/api/bus_locations', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM bus_locations');
    res.json(rows);
  } catch (err) {
    console.error('Fetch bus locations error', err);
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
