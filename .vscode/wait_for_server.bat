@echo off
powershell -NoProfile -Command "$ok=$false; for ($i=0; $i -lt 30; $i++) { try { (Invoke-WebRequest -Uri http://localhost:4321 -UseBasicParsing -TimeoutSec 1) | Out-Null; $ok=$true; break } catch { Start-Sleep 1 } }; if ($ok) { exit 0 } else { exit 1 }"
exit /b %ERRORLEVEL%
