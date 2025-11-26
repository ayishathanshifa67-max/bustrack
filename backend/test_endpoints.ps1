#!/usr/bin/env powershell
# Test backend endpoints

# Test health endpoint
Write-Host "Testing GET /api/health..." -ForegroundColor Cyan
try {
  $response = Invoke-WebRequest -Uri 'http://127.0.0.1:5000/api/health' -Method GET -SkipCertificateCheck -ErrorAction Stop
  Write-Host "✓ Health check passed" -ForegroundColor Green
  Write-Host $response.Content
} catch {
  Write-Host "✗ Health check failed: $_" -ForegroundColor Red
}

# Test get bus locations
Write-Host "`nTesting GET /api/bus_locations..." -ForegroundColor Cyan
try {
  $response = Invoke-WebRequest -Uri 'http://127.0.0.1:5000/api/bus_locations' -Method GET -SkipCertificateCheck -ErrorAction Stop
  Write-Host "✓ Bus locations retrieved" -ForegroundColor Green
  Write-Host $response.Content | ConvertFrom-Json | ConvertTo-Json
} catch {
  Write-Host "✗ Bus locations failed: $_" -ForegroundColor Red
}

# Test women safety alert
Write-Host "`nTesting POST /api/alert/women..." -ForegroundColor Cyan
$alertBody = @{
  latitude = 12.9716
  longitude = 77.5946
  message = "Test alert from PowerShell"
} | ConvertTo-Json

try {
  $response = Invoke-WebRequest -Uri 'http://127.0.0.1:5000/api/alert/women' -Method POST -Body $alertBody -ContentType 'application/json' -SkipCertificateCheck -ErrorAction Stop
  Write-Host "✓ Alert sent successfully" -ForegroundColor Green
  Write-Host $response.Content | ConvertFrom-Json | ConvertTo-Json
} catch {
  Write-Host "✗ Alert failed: $_" -ForegroundColor Red
}

Write-Host "`n✓ All tests completed" -ForegroundColor Green
