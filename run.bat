@echo off
echo Starting Solar Energy Prediction Platform...

echo Starting Django Backend Server...
cd solar_backend
pip install -r requirements.txt
start cmd /k "python manage.py runserver 0.0.0.0:8000"

echo Starting React Vite Frontend...
cd ../solar_frontend
npm i
start cmd /k "npm run dev"

echo Both servers are starting up! Check the new terminal windows.
echo Frontend should be available at: http://localhost:5173
echo Backend API should be available at: http://localhost:8000
pause
