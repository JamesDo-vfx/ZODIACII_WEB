@echo off
setlocal

set "PORT=%~1"
if "%PORT%"=="" set "PORT=4173"

cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 (
  echo Serving ZodiacII_WEB at http://localhost:%PORT%/
  echo Press Ctrl+C to stop.
  python -m http.server %PORT%
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  echo Serving ZodiacII_WEB at http://localhost:%PORT%/
  echo Press Ctrl+C to stop.
  py -m http.server %PORT%
  goto :eof
)

echo Python was not found. Install Python, then run this file again.
pause
