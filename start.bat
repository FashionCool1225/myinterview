@echo off
cd /d %~dp0
echo Starting local server on http://localhost:8000 ...
ping -n 2 127.0.0.1 >nul
start "" http://localhost:8000
python -m http.server 8000
pause
