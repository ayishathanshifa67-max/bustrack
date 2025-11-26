#!/usr/bin/env powershell
# Simple test to verify backend is reachable and login works

param(
  [string]$BackendUrl = 'http://localhost:5000',
  [string]$Username = 'driver1',
  [string]$Password = 'test123',
  [string]$SecretCode = 'SECRET123'
)

Write-Host "`n=== BusTrack Backend Connectivity Test ===" -ForegroundColor Cyan

# Test 1: Health check
Write-Host "`n1. Testing health endpoint..."
try {
  $response = Invoke-WebRequest -Uri "$BackendUrl/api/health" -Method GET -SkipCertificateCheck -ErrorAction Stop
  $data = $response.Content | ConvertFrom-Json
  Write-Host "   ✓ Backend is responding" -ForegroundColor Green
  Write-Host "   Status: $($data.status)"
} catch {
  Write-Host "   ✗ Backend not responding: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

# Test 2: Driver login
Write-Host "`n2. Testing driver login endpoint..."
try {
  $loginBody = @{
    username = $Username
    password = $Password
    secretCode = $SecretCode
  } | ConvertTo-Json

  $response = Invoke-WebRequest -Uri "$BackendUrl/api/driver/login" -Method POST `
    -Body $loginBody `
    -ContentType 'application/json' `
    -SkipCertificateCheck `
    -ErrorAction Stop
  
  $data = $response.Content | ConvertFrom-Json
  Write-Host "   ✓ Login endpoint is working" -ForegroundColor Green
  Write-Host "   Response: $(ConvertTo-Json $data)"
} catch {
  $statusCode = $_.Exception.Response.StatusCode
  Write-Host "   ! Login returned: $statusCode" -ForegroundColor Yellow
  Write-Host "   Note: 400 (invalid credentials) is expected if user doesn't exist yet" -ForegroundColor Gray
  Write-Host "   To create driver, first call: POST /api/driver/signup"
}

# Test 3: Get bus locations
Write-Host "`n3. Testing bus locations endpoint..."
try {
  $response = Invoke-WebRequest -Uri "$BackendUrl/api/bus_locations" -Method GET -SkipCertificateCheck -ErrorAction Stop
  $data = $response.Content | ConvertFrom-Json
  Write-Host "   ✓ Bus locations endpoint is working" -ForegroundColor Green
  if ($data.Count -gt 0) {
    Write-Host "   Found $($data.Count) buses"
  } else {
    Write-Host "   No buses found yet (expected on first run)"
  }
} catch {
  Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "`nFrontend should now be able to connect to backend at: $BackendUrl" -ForegroundColor Green
