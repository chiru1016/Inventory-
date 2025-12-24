@echo off
TITLE Python Web Server
echo Checking for Python...

REM Explicitly checking Local Programs path which seems to be populated now
set "PY_PATH=%LocalAppData%\Programs\Python\Python312\python.exe"

if exist "%PY_PATH%" (
    echo Python found at: %PY_PATH%
    "%PY_PATH%" server.py
    pause
    exit /b
)

echo.
echo Trying system python...
python server.py
if %errorlevel% neq 0 (
    echo. 
    echo Still cannot find python. Please ensure you installed it.
    pause
)
pause
