@echo off
setlocal

cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
  start "" msedge "http://localhost:8000"
  py -m http.server 8000
  exit /b
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "" msedge "http://localhost:8000"
  python -m http.server 8000
  exit /b
)

echo Python was not found.
echo You can still open index.html directly in Microsoft Edge.
pause
