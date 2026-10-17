@echo off
if exist "%~dp0Launch.exe" (
  start "" "%~dp0Launch.exe" %*
  exit /b
)
start "" /d "%~dp0" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0." %*
