#!/usr/bin/env powershell
<#
.SYNOPSIS
  PowerShell Example: POST driver location to /api/driver/location

.DESCRIPTION
  Send driver location updates to the backend API.

.PARAMETER BusId
  The bus ID (e.g., 'BUS-001')

.PARAMETER Latitude
  Latitude coordinate (optional, random if not provided)

.PARAMETER Longitude
  Longitude coordinate (optional, random if not provided)

.PARAMETER ApiHost
  API server hostname (default: localhost)

.PARAMETER ApiPort
  API server port (default: 5000)

.PARAMETER Continuous
  If specified, sends updates every N seconds. Ctrl+C to stop.

.PARAMETER IntervalSeconds
  Interval between continuous updates (default: 5)

.EXAMPLE
  .\driver_location_powershell.ps1 -BusId 'BUS-001' -Latitude 12.9716 -Longitude 77.5946

.EXAMPLE
  .\driver_location_powershell.ps1 -BusId 'BUS-001' -Continuous -IntervalSeconds 5

#>

param(
  [Parameter(Mandatory = $true)]
  [string]$BusId,

  [Parameter(Mandatory = $false)]
  [double]$Latitude,

  [Parameter(Mandatory = $false)]
  [double]$Longitude,

  [Parameter(Mandatory = $false)]
  [string]$ApiHost = 'localhost',

  [Parameter(Mandatory = $false)]
  [int]$ApiPort = 5000,

  [Parameter(Mandatory = $false)]
  [switch]$Continuous,

  [Parameter(Mandatory = $false)]
  [int]$IntervalSeconds = 5
)

function Send-DriverLocation {
  param(
    [string]$BusId,
    [double]$Latitude,
    [double]$Longitude,
    [string]$ApiHost,
    [int]$ApiPort
  )

  $uri = "http://$($ApiHost):$($ApiPort)/api/driver/location"
  
  $body = @{
    bus_id   = $BusId
    latitude = $Latitude
    longitude = $Longitude
  } | ConvertTo-Json

  try {
    $response = Invoke-WebRequest -Uri $uri -Method POST `
      -Body $body `
      -ContentType 'application/json' `
      -SkipCertificateCheck `
      -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    return $result
  }
  catch {
    throw $_
  }
}

# Main logic
Write-Host "`n📍 Driver Location Uploader`n" -ForegroundColor Cyan

if ([string]::IsNullOrEmpty($Latitude)) {
  $Latitude = Get-Random -Minimum -90 -Maximum 90
}

if ([string]::IsNullOrEmpty($Longitude)) {
  $Longitude = Get-Random -Minimum -180 -Maximum 180
}

Write-Host "Configuration:"
Write-Host "  Bus ID: $BusId"
Write-Host "  Latitude: $([math]::Round($Latitude, 5))"
Write-Host "  Longitude: $([math]::Round($Longitude, 5))"
Write-Host "  Server: http://$($ApiHost):$($ApiPort)"
Write-Host "  Continuous: $Continuous"
if ($Continuous) {
  Write-Host "  Interval: ${IntervalSeconds}s"
}
Write-Host ""

if ($Continuous) {
  Write-Host "Starting continuous location updates..." -ForegroundColor Green
  Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Yellow

  while ($true) {
    try {
      $newLat = Get-Random -Minimum -90 -Maximum 90
      $newLng = Get-Random -Minimum -180 -Maximum 180

      $result = Send-DriverLocation -BusId $BusId -Latitude $newLat -Longitude $newLng -ApiHost $ApiHost -ApiPort $ApiPort
      
      Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ✓ Location sent - Lat: $([math]::Round($newLat, 5)), Lng: $([math]::Round($newLng, 5))" -ForegroundColor Green
      
      Start-Sleep -Seconds $IntervalSeconds
    }
    catch {
      Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
      Start-Sleep -Seconds $IntervalSeconds
    }
  }
}
else {
  try {
    Write-Host "Sending location update..." -ForegroundColor Cyan
    $result = Send-DriverLocation -BusId $BusId -Latitude $Latitude -Longitude $Longitude -ApiHost $ApiHost -ApiPort $ApiPort
    Write-Host "`n✓ Success!" -ForegroundColor Green
    Write-Host "Response: " -NoNewline
    Write-Host ($result | ConvertTo-Json) -ForegroundColor Cyan
  }
  catch {
    Write-Host "`n✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
  }
}
