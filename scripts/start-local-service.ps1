$projectDir = "C:\Users\DELL\Desktop\invoice-app"
$port = 3000
$logDir = Join-Path $projectDir "logs"
$logPath = Join-Path $logDir "invoice-app.log"

New-Item -ItemType Directory -Path $logDir -Force | Out-Null

if (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue) {
    Write-Host "The app is already running on port $port."
    exit 0
}

$command = @(
    "cd /d `"$projectDir`"",
    "npm run start"
) -join " && "

Start-Process powershell.exe -ArgumentList @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-WindowStyle', 'Hidden',
    '-Command', $command
) -WorkingDirectory $projectDir -RedirectStandardOutput $logPath -RedirectStandardError $logPath

Write-Host "Started local app from $projectDir"
