param([ValidateRange(1024,65534)][int]$Port = 1900)
$ErrorActionPreference = 'Stop'
$env:DEEPCLAW_UI_PORT = [string]$Port
$env:DEEPCLAW_NEXT_PORT = [string]($Port + 1)
$serverDir = Join-Path $PSScriptRoot 'server'
$nodePath = (Get-Command node -ErrorAction Stop).Source
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$process = Start-Process -FilePath $nodePath -ArgumentList 'index.js' -WorkingDirectory $serverDir -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $PSScriptRoot "server-$stamp.log") -RedirectStandardError (Join-Path $PSScriptRoot "server-$stamp.err.log")
Write-Output "DeepClaw starting at http://127.0.0.1:$Port (PID $($process.Id))"
