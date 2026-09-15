$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notmatch '^127\.' -and $_.IPAddress -notmatch '^169\.254\.'} | Select-Object -First 1).IPAddress

if (-not $ip) {
    $ip = "127.0.0.1"
}

Write-Host "Use this address from your phone: http://$ip:3000"
Write-Host "Use this address in the browser: http://localhost:3000"
