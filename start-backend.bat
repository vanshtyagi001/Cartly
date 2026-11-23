@echo off
echo Starting Cartly Django Backend...
cd /d "%~dp0django_backend"
call .venv\Scripts\activate.bat
python manage.py runserver 5000
pause
