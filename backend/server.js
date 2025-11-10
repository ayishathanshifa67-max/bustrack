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

// Email alert setup (optional - requires SMTP config in .env)
let transporter = null;
try {
  const nodemailer = require('nodemailer');
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    // verify transporter (best-effort)
    transporter.verify().then(() => console.log('SMTP transporter ready')).catch((e) => console.warn('SMTP verify failed', e.message));
  }
} catch (e) {
  console.warn('nodemailer not available - email alerts disabled');
}

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

// Women safety alert - send email to configured address
app.post('/api/alert/women', async (req, res) => {
  const { latitude, longitude, message } = req.body || {};
  // Alert recipient; can be overridden with ALERT_TO in backend .env
  const to = process.env.ALERT_TO || 'ayishathanshifa67@gmail.com';
  // Always attempt to store the alert in the database for audit. Create table if missing.
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      latitude DECIMAL(10,7) NULL,
      longitude DECIMAL(10,7) NULL,
      message TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
  } catch (err) {
    console.warn('Could not ensure alerts table exists:', err && err.message ? err.message : String(err));
    // fallback: write to a local file so alerts are not lost
    try {
      const fs = require('fs');
      const fallback = { latitude: latitude || null, longitude: longitude || null, message: message || null, created_at: new Date().toISOString(), reason: 'table-create-failed' };
      fs.appendFileSync('./alerts_fallback.jsonl', JSON.stringify(fallback) + '\n');
    } catch (wf) {
      console.warn('Failed writing fallback alert file:', wf && wf.message ? wf.message : String(wf));
    }
  }

  try {
    await pool.query('INSERT INTO alerts (latitude, longitude, message) VALUES (?, ?, ?)', [latitude || null, longitude || null, message || null]);
  } catch (err) {
    console.warn('Failed to insert alert into DB:', err && err.message ? err.message : String(err));
    // fallback: persist to file so alert isn't lost
    try {
      const fs = require('fs');
      const fallback = { latitude: latitude || null, longitude: longitude || null, message: message || null, created_at: new Date().toISOString(), reason: 'insert-failed' };
      fs.appendFileSync('./alerts_fallback.jsonl', JSON.stringify(fallback) + '\n');
    } catch (wf) {
      console.warn('Failed writing fallback alert file:', wf && wf.message ? wf.message : String(wf));
    }
    // proceed — we still want to attempt to send email if configured
  }

  // If transporter is configured, send an email. Otherwise return success and note that it was saved.
  if (transporter) {
    try {
      const now = new Date().toISOString();
      const locationLine = (latitude && longitude) ? `Location: https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}` : 'Location: not provided';
      const html = `<p>Women safety alert received at ${now}</p><p>${message ? message : 'No message provided'}</p><p>${locationLine}</p>`;
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: 'Women Safety Alert',
        text: `${message || 'No message provided'}\n\n${locationLine}\n\nTime: ${now}`,
        html,
      });
      return res.json({ ok: true, sent: true });
    } catch (err) {
      console.error('Failed to send alert email', err);
      return res.status(500).json({ error: 'Failed to send email', details: err.message });
    }
  }

  // No transporter configured — return success because alert was stored (or attempted)
  return res.json({ ok: true, saved: true, note: 'Email not configured on server; alert persisted to DB (if possible).' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
