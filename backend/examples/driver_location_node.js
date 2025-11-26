#!/usr/bin/env node
/**
 * Node.js Example: POST driver location to /api/driver/location
 * Usage: node driver_location_node.js <busId> [latitude] [longitude]
 * 
 * Examples:
 *   node driver_location_node.js BUS-001 12.9716 77.5946
 *   node driver_location_node.js BUS-001  (uses random coordinates)
 *
 * For continuous updates, uncomment the setInterval at the bottom.
 */

const http = require('http');

const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 5000;

/**
 * Send driver location to backend
 */
function postDriverLocation(busId, latitude, longitude) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      bus_id: busId,
      latitude: latitude,
      longitude: longitude,
    });

    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: '/api/driver/location',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node driver_location_node.js <busId> [latitude] [longitude]');
    console.log('Example: node driver_location_node.js BUS-001 12.9716 77.5946');
    console.log('Example: node driver_location_node.js BUS-001  (uses random coordinates)');
    process.exit(1);
  }

  const busId = args[0];
  let latitude = parseFloat(args[1]) || Math.random() * 180 - 90;
  let longitude = parseFloat(args[2]) || Math.random() * 360 - 180;

  console.log(`\n📍 Posting driver location...`);
  console.log(`   Bus ID: ${busId}`);
  console.log(`   Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`);
  console.log(`   Server: http://${API_HOST}:${API_PORT}\n`);

  try {
    const response = await postDriverLocation(busId, latitude, longitude);
    console.log('✓ Response:', response);
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

// Uncomment below for continuous updates every 5 seconds:
/*
async function continuousUpdates(busId, intervalSeconds = 5) {
  console.log(`\n🔄 Starting continuous location updates for bus ${busId} every ${intervalSeconds}s`);
  console.log('   Press Ctrl+C to stop\n');

  setInterval(async () => {
    const latitude = Math.random() * 180 - 90;
    const longitude = Math.random() * 360 - 180;
    try {
      const response = await postDriverLocation(busId, latitude, longitude);
      console.log(`[${new Date().toISOString()}] ✓ Location sent - Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] ✗ Error:`, err.message);
    }
  }, intervalSeconds * 1000);
}

// Uncomment this line to enable continuous updates:
// const busId = process.argv[2] || 'BUS-001';
// continuousUpdates(busId, 5);
*/

main();
