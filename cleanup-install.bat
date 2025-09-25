@echo off
REM Silent cleanup script for Lecture Logger installer
REM Automatically runs before installer to prevent "cannot be closed" errors

REM Kill all Lecture Logger processes silently
taskkill /F /IM "Lecture Logger.exe" /T >nul 2>&1
taskkill /F /IM "LectureLogger.exe" /T >nul 2>&1
taskkill /F /IM "LectureLogger-*.exe" /T >nul 2>&1

REM Wait for processes to terminate
timeout /t 2 /nobreak >nul

REM Remove existing installation directory silently
if exist "%LOCALAPPDATA%\Programs\Lecture Logger\" (
    rmdir /s /q "%LOCALAPPDATA%\Programs\Lecture Logger\" >nul 2>&1
)

REM Exit silently
exit /b 0