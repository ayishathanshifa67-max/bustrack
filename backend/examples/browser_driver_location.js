/**
 * Browser Example: POST driver location to /api/driver/location
 * Run this in the browser console on any page where your app is hosted.
 */

// Example 1: Send a single location update
async function postDriverLocation(busId, latitude, longitude) {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const response = await fetch(`${apiUrl}/api/driver/location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bus_id: busId,
      latitude: latitude,
      longitude: longitude,
    }),
  });
  const data = await response.json();
  console.log('Location update response:', data);
  return data;
}

// Example 2: Get device location and send it to backend
async function postDriverLocationFromDevice(busId) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      reject(new Error('Geolocation not available'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`Got location: ${latitude}, ${longitude}`);
        const result = await postDriverLocation(busId, latitude, longitude);
        resolve(result);
      },
      (error) => {
        console.error('Geolocation error:', error);
        reject(error);
      }
    );
  });
}

// Example 3: Continuous location updates every 5 seconds
let locationUpdateInterval = null;

function startContinuousLocationUpdates(busId, intervalSeconds = 5) {
  if (locationUpdateInterval) {
    console.warn('Already running location updates');
    return;
  }

  console.log(`Starting continuous location updates for bus ${busId} every ${intervalSeconds}s`);
  locationUpdateInterval = setInterval(async () => {
    try {
      await postDriverLocationFromDevice(busId);
      console.log(`Location update sent for bus ${busId}`);
    } catch (error) {
      console.error('Failed to send location update:', error);
    }
  }, intervalSeconds * 1000);
}

function stopContinuousLocationUpdates() {
  if (locationUpdateInterval) {
    clearInterval(locationUpdateInterval);
    locationUpdateInterval = null;
    console.log('Location updates stopped');
  }
}

// Usage in browser console:
// 1. Send a single location:
//    postDriverLocation('BUS-001', 12.9716, 77.5946)
//
// 2. Get device location and send:
//    postDriverLocationFromDevice('BUS-001')
//
// 3. Start continuous updates:
//    startContinuousLocationUpdates('BUS-001', 5)  // Updates every 5 seconds
//
// 4. Stop continuous updates:
//    stopContinuousLocationUpdates()
