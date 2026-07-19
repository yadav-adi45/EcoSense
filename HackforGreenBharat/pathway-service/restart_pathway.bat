@echo off
echo Stopping any existing python processes (Warning: might stop other python scripts)
taskkill /IM python.exe /F 2>nul
echo Starting Pathway Service...
cd /d "%~dp0"
pip install flask-cors
python mock_pathway.py
pause
