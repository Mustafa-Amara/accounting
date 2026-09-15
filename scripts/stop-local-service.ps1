Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "Stopped local app processes."
