@echo off
title GLASSWALL SECURITY CENTER LAUNCHER
color 0A

echo ====================================================
echo      INITIALIZING GLASS WALL SECURITY PROTOCOLS
echo ====================================================
echo.

:: 1. Start the Python Backend in a new window
echo [+] Booting Recognition Engine (Backend)...
start "GlassWall Backend" cmd /k "cd backend && python -m uvicorn main:app --reload"
:: 2. Wait 3 seconds for backend to warm up
timeout /t 3 /nobreak >nul

:: 3. Start the React Frontend in a new window
echo [+] Loading Holographic Interface (Frontend)...
start "GlassWall Frontend" cmd /k "cd frontend && npm run dev"

:: 4. Wait 4 seconds for Vite to start
timeout /t 4 /nobreak >nul

:: 5. Launch Chrome/Edge to the localhost
echo [+] Establishing Secure Connection...
start http://localhost:5173

echo.
echo [SUCCESS] SYSTEM ONLINE.
echo You can minimize this window, but do not close it.
pause