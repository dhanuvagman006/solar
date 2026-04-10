# Solar Energy Prediction App

This is a full-stack ML application consisting of a React UI and a Django/TensorFlow backend.

## Automated Startup
Simply double-click the `run.bat` file in the root `d:\solar` directory. This will automatically open the backend server on port 8000 and the React development server on port 5173.

## Manual Startup

### 1. Start the Backend
Open a terminal, navigate to the backend folder, and start Django:
```bash
cd d:\solar\solar_backend
python manage.py runserver 0.0.0.0:8000
```
*Note: Make sure your Python virtual environment is activated if you are using one.*

### 2. Start the Frontend
Open a **new** terminal, navigate to the frontend folder, and start Vite:
```bash
cd d:\solar\solar_frontend
npm run dev
```

### 3. Open the Application
Navigate to `http://localhost:5173` in your web browser. 

**Login Credentials:**
- **Username:** admin
- **Password:** admin123
