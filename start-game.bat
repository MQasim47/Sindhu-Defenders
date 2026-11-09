@echo off
rem ============================================================================
rem  Sindhu Defenders - one-click offline launch (Windows)
rem  1. starts Ollama (the Mithu chat model) if it is installed and not running
rem  2. builds the game ONLY if the "dist" folder is missing or older than the code
rem  3. starts the game server ("vite preview", it also passes the chat to Ollama)
rem  4. opens Chrome full screen (kiosk) on the game. Close the window (Alt+F4) to stop.
rem  Nothing is loaded from the internet.
rem ============================================================================
setlocal
cd /d "%~dp0"
set PORT=4173
set URL=http://127.0.0.1:%PORT%/

rem ---- 0. the tools we need ----
where node >nul 2>nul || (echo Node.js is not installed. Install it from https://nodejs.org and run this file again. & pause & exit /b 1)
if not exist node_modules (
  echo First start: installing the game files, please wait...
  call npm.cmd install
)

rem ---- 1. Ollama (optional: without it Mithu answers from his offline notes) ----
where ollama >nul 2>nul
if %errorlevel%==0 (
  curl.exe -s -o nul --max-time 2 http://localhost:11434/api/tags
  if errorlevel 1 (
    echo Starting Ollama...
    start "Ollama" /min ollama serve
    timeout /t 4 /nobreak >nul
  )
) else (
  echo Ollama is not installed: Mithu will use his offline mode. ^(See README.md^)
)

rem ---- 2. build only if dist is missing or older than the code ----
powershell -NoProfile -Command "$d = Get-Item 'dist\index.html' -ErrorAction SilentlyContinue; if (-not $d) { exit 1 }; $n = Get-ChildItem 'src','public','index.html','package.json','vite.config.js' -Recurse -File | Where-Object { $_.LastWriteTime -gt $d.LastWriteTime } | Select-Object -First 1; if ($n) { exit 1 } else { exit 0 }"
if errorlevel 1 (
  echo Building the game...
  call npm.cmd run build
  if errorlevel 1 (echo The build failed. & pause & exit /b 1)
)

rem ---- 3. the game server ----
start "Sindhu Defenders server" /min cmd /c "npm.cmd run preview -- --host 127.0.0.1 --port %PORT% --strictPort"
set /a tries=0
:wait
curl.exe -s -o nul --max-time 1 %URL%
if not errorlevel 1 goto ready
set /a tries+=1
if %tries% GEQ 40 (echo The game server did not start. & pause & exit /b 1)
timeout /t 1 /nobreak >nul
goto wait
:ready

rem ---- 4. Chrome in kiosk (full screen) mode with its own profile, so we can wait for it to close ----
set CHROME=
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe
if defined CHROME (
  start "" /wait "%CHROME%" --kiosk --autoplay-policy=no-user-gesture-required --no-first-run --disable-features=Translate --user-data-dir="%~dp0.kiosk-profile" %URL%
) else (
  echo Chrome was not found: opening your normal browser. Press F11 for full screen.
  start "" %URL%
  pause
)

rem ---- 5. Chrome was closed: stop the game server ----
taskkill /fi "WINDOWTITLE eq Sindhu Defenders server*" /t /f >nul 2>nul
endlocal
