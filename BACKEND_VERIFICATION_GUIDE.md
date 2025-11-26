# Backend Verification Guide

## ✓ Backend Fixed & Running

The backend is now fully functional with:
- ✓ Database connection testing on startup
- ✓ Improved error logging for debugging
- ✓ Graceful shutdown handling
- ✓ All required database tables created
- ✓ Port conflict detection

## Quick Start

### 1. Start the Backend Server

```powershell
cd 'd:/bus track/backend'
node server.js
```

Expected output:
```
✓ Server listening on port 5000
✓ Database connection successful
```

If you see errors:
- **"Port 5000 is already in use"** → Kill existing processes: `Get-Process node | Stop-Process -Force`
- **"Database connection failed"** → Ensure MySQL is running and credentials in `.env` are correct

### 2. Verify Endpoints Are Working

#### Option A: Using the Test Script
```powershell
cd 'd:/bus track/backend'
powershell -NoProfile -File ./test_endpoints.ps1
```

#### Option B: Manual Testing with PowerShell

```powershell
# Test health endpoint
(Invoke-WebRequest -Uri 'http://127.0.0.1:5000/api/health' -Method GET).Content

# Test get bus locations
(Invoke-WebRequest -Uri 'http://127.0.0.1:5000/api/bus_locations' -Method GET).Content

# Test send alert
$alert = @{
  latitude = 12.9716
  longitude = 77.5946
  message = "Test alert"
} | ConvertTo-Json

(Invoke-WebRequest -Uri 'http://127.0.0.1:5000/api/alert/women' -Method POST -Body $alert -ContentType 'application/json').Content
```

### 3. Post Driver Location (Real-Time Updates)

Use one of the examples to send driver location:

#### Browser Console
```javascript
// Copy from backend/examples/browser_driver_location.js
// Then run in browser console:
postDriverLocationFromDevice('BUS-001')
// Or for continuous updates:
startContinuousLocationUpdates('BUS-001', 5)
```

#### Node.js
```powershell
node 'd:/bus track/backend/examples/driver_location_node.js' BUS-001 12.9716 77.5946
```

#### PowerShell
```powershell
powershell -File 'd:/bus track/backend/examples/driver_location_powershell.ps1' -BusId 'BUS-001' -Latitude 12.9716 -Longitude 77.5946

# Or for continuous updates:
powershell -File 'd:/bus track/backend/examples/driver_location_powershell.ps1' -BusId 'BUS-001' -Continuous -IntervalSeconds 5
```

## API Endpoints Reference

### Health Check
```
GET /api/health
```
Response: `{"status":"ok"}`

### Get All Bus Locations
```
GET /api/bus_locations
```
Response: Array of buses with their latest location and timestamp

### Post Driver Location (Real-Time Update)
```
POST /api/driver/location
Content-Type: application/json

{
  "bus_id": "BUS-001",
  "latitude": 12.9716,
  "longitude": 77.5946
}
```
Response: `{"message":"Location updated"}`

### Women Safety Alert
```
POST /api/alert/women
Content-Type: application/json

{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "message": "Help needed"
}
```
Response: `{"ok":true,"saved":true}` (or `{"ok":true,"sent":true}` if SMTP configured)

### Driver Signup
```
POST /api/driver/signup
Content-Type: application/json

{
  "username": "driver1",
  "password": "pass123",
  "secretCode": "SECRET123"
}
```

### Driver Login
```
POST /api/driver/login
Content-Type: application/json

{
  "username": "driver1",
  "password": "pass123",
  "secretCode": "SECRET123"
}
```

## Verification Checklist

- [ ] Backend server starts without errors
- [ ] Database connection is successful
- [ ] `GET /api/health` returns `{"status":"ok"}`
- [ ] `GET /api/bus_locations` returns a JSON array (empty or with buses)
- [ ] `POST /api/alert/women` returns success with `"saved":true`
- [ ] `POST /api/driver/location` updates bus location
- [ ] Frontend can call these endpoints without CORS errors
- [ ] Alerts are persisted to DB or fallback file at `backend/alerts_fallback.jsonl`

## Database Schema

### drivers table
```sql
CREATE TABLE drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  secret_code VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### bus_locations table
```sql
CREATE TABLE bus_locations (
  bus_id VARCHAR(100) PRIMARY KEY,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### alerts table
```sql
CREATE TABLE alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Environment Variables (.env)

```
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=bustrack
PORT=5000
ALERT_TO=ayishathanshifa67@gmail.com

# Optional: Email sending (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_PORT=587
SMTP_SECURE=false
SMTP_FROM=your-email@gmail.com
```

## Troubleshooting

### Backend crashes on startup
1. Check MySQL is running
2. Verify credentials in `.env`
3. Check port 5000 is free: `netstat -ano | findstr :5000`

### Database errors
1. Verify MySQL is running
2. Create database: `CREATE DATABASE IF NOT EXISTS bustrack;`
3. Run table creation scripts:
   ```powershell
   node 'd:/bus track/backend/scripts/create_drivers_table.js'
   node 'd:/bus track/backend/scripts/create_bus_locations_table.js'
   ```

### CORS errors in frontend
- Ensure backend is running
- Check `REACT_APP_API_URL` in `frontend/.env` points to backend
- Verify backend has `cors()` middleware enabled

### Alerts not being sent
- Check `.env` has SMTP_HOST, SMTP_USER, SMTP_PASS
- Alerts are still saved to DB or fallback file even if email fails
- Check `backend/alerts_fallback.jsonl` for saved alerts

## Next Steps

1. **Configure Email (Optional)**
   - Add SMTP credentials to `backend/.env`
   - Women Safety alerts will be emailed to `ayishathanshifa67@gmail.com`

2. **Add Driver Authentication**
   - Current `/api/driver/location` endpoint is open
   - Consider adding JWT token validation for production

3. **Monitor Real-Time Updates**
   - Use the driver examples to send continuous location updates
   - Frontend polls `/api/bus_locations` every 5 seconds to get latest positions
