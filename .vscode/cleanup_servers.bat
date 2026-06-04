@echo off
echo === Cleanup Servers (port 4321) ===
powershell -NoProfile -Command "$conns = Get-NetTCPConnection -LocalPort 4321 -State Listen -ErrorAction SilentlyContinue; if (-not $conns) { Write-Host 'Port 4321 is already free.' } else { foreach ($c in $conns) { Write-Host ('Killing PID ' + $c.OwningProcess + ' on port 4321...'); Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue } }"
echo Done.
exit /b 0
