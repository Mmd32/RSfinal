@echo off
rem Retail Solutions - run the site + admin panel locally (no install needed)
cd /d "%~dp0"
start "" "http://localhost:8787/admin/"
powershell -NoProfile -ExecutionPolicy Bypass -File "tools\dev-server.ps1"
