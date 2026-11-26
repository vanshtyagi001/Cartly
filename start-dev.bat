@echo off
echo Starting Cartly (Backend + Frontend)...
echo.
cd /d "%~dp0"
start "Cartly Backend" cmd /k "cd /d django_backend && call .venv\Scripts\activate.bat && python manage.py runserver 5000"
start "Cartly Frontend" cmd /k "cd /d frontend && npm run dev"
echo Both servers have been launched in separate windows.
