@echo off
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel%==0 (
  start "" "http://127.0.0.1:4180/"
  node local-server.mjs
  exit /b
)
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://127.0.0.1:4180/"
  py -m http.server 4180 --bind 127.0.0.1 --directory site
  exit /b
)
echo 需要安装 Node.js 或 Python 才能启动电脑离线版。
pause
