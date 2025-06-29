@echo off
echo Starting CS Explorer Backend Server...
echo.
cd /d "c:\Users\sukhb\OneDrive\Desktop\cdquiznew\QuizifyCS\backend"
echo Current directory: %CD%
echo.
echo Installing dependencies if needed...
call npm install
echo.
echo Starting server on port 5000...
echo.
node index.js
pause
