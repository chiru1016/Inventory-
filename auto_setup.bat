@echo off
TITLE Auto-Setup Python Server
echo ==========================================
echo        AUTO-INSTALLING PYTHON
echo ==========================================
echo.
echo I am installing Python 3.12 for you now...
echo Please wait for the download and installation to finish.
echo You may see a popup asking for permission -> Click YES.
echo.
winget install -e --id Python.Python.3.12 --scope user --accept-package-agreements --accept-source-agreements

echo.
echo ==========================================
echo      INSTALLATION ATTEMPT FINISHED
echo ==========================================
echo.
echo Attempting to start the server now...
echo.

REM Refresh env vars is tricky in batch without restart, checking typical path
set "PATH=%PATH%;%LocalAppData%\Programs\Python\Python312;%LocalAppData%\Programs\Python\Python312\Scripts"

python server.py
if %errorlevel% neq 0 (
    echo.
    echo Python command still not found.
    echo PLEASE RESTART YOUR COMPUTER to finish the installation.
    echo.
    echo After restart, double-click "start_server.bat" on your desktop.
)
pause
