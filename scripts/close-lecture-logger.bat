@echo off
echo Closing Lecture Logger and related processes...
echo.

REM Kill Lecture Logger main process
taskkill /F /IM "Lecture Logger.exe" /T >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Closed Lecture Logger main process
) else (
    echo ℹ Lecture Logger main process was not running
)

REM Kill any electron processes (could be from our app)
taskkill /F /IM "electron.exe" /T >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Closed electron processes
) else (
    echo ℹ No electron processes found
)

REM Kill any node processes that might be lingering
for /f "tokens=2 delims=," %%a in ('wmic process where "name='node.exe'" get processid /format:csv ^| find /v "ProcessId" ^| find /v ""') do (
    echo Checking node.exe process with PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

REM Kill any python processes that might be from our app
for /f "tokens=2 delims=," %%a in ('wmic process where "name='python.exe'" get processid /format:csv ^| find /v "ProcessId" ^| find /v ""') do (
    echo Checking python.exe process with PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo All Lecture Logger processes have been terminated.
echo You can now safely run the installer.
echo.
pause