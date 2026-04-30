@echo off
echo ============================================
echo   Solar Energy Prediction Platform
echo ============================================
echo.

echo [SETUP] Installing backend dependencies...
cd /d "%~dp0solar_backend"
pip install -r requirements.txt
echo.

echo [START] Launching Django Backend on port 8000...
start /b cmd /c "python manage.py runserver 0.0.0.0:8000 2>&1"

echo [START] Launching React Frontend on port 5173...
cd /d "%~dp0solar_frontend"
start /b cmd /c "npm run dev 2>&1"

echo.
echo ============================================
echo   Both servers running in this terminal
echo   Frontend : http://localhost:5173
echo   Backend  : http://localhost:8000
echo   Press Ctrl+C to stop all servers
echo ============================================
echo.

:: Keep the terminal alive and wait for Ctrl+C
cmd /k
