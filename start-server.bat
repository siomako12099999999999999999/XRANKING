@echo off
chcp 65001 > nul
setlocal

title XRANKING Auto Server Launcher

echo ===== XRANKING Auto Server Launcher =====
echo.

:: Environment check
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js/npm not installed.
    echo Please install Node.js and try again.
    echo https://nodejs.org/
    goto :exit
)

:: Check package.json
if not exist "package.json" (
    echo Error: package.json not found.
    echo Make sure you're running this from the project root directory.
    goto :exit
)

:: Check dependencies
if not exist "node_modules" (
    echo node_modules not found. Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Failed to install dependencies.
        goto :exit
    )
)

:: Check .env file
if not exist ".env" (
    echo Warning: .env file not found.
    echo Copying sample .env file...
    if exist ".env.example" (
        copy .env.example .env
        echo .env file created.
    ) else (
        echo .env.example file not found.
        echo Creating empty .env file.
        echo # XRANKING Environment Configuration > .env
    )
)

:: Auto-start development server
echo.
echo Starting development server...
start "XRANKING Dev Server" /min cmd /c "color 0A && npm run dev"
timeout /t 5 >nul

:: Open browser
echo Opening application in browser...
start http://localhost:3000

echo.
echo Server started in a separate window.
echo To stop the server, close the command window.
echo.

:exit
timeout /t 3 >nul
exit /b