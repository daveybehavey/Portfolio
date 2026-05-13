@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules\next\" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)

echo.
echo ============================================================
echo   Portfolio dev server
echo   Open in your browser:  http://127.0.0.1:3010
echo   (Port 3010, host 127.0.0.1 — avoids common 3000 conflicts)
echo ============================================================
echo.

call npm run dev
