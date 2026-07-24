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
echo   Open in your browser:  http://127.0.0.1:3011
echo   (Port 3011 — do NOT use localhost:3010; another app may be on that port)
echo ============================================================
echo.

call npm run dev
