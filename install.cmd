@echo off
rem IELTS v3 skills installer (Windows)
setlocal enabledelayedexpansion
set "SKILLS_DIR=%USERPROFILE%\.claude\skills"
set "SRC=%~dp0"

echo Installing IELTS v3 skills to "%SKILLS_DIR%" ...
if not exist "%SKILLS_DIR%" mkdir "%SKILLS_DIR%"

set FAILED=0
for %%S in (ielts ielts-writing ielts-reading ielts-listening ielts-speaking ielts-vocab ielts-plan ielts-dashboard) do (
  echo   - %%S
  robocopy "%SRC%%%S" "%SKILLS_DIR%\%%S" /E /XD node_modules dist /NFL /NDL /NJH /NJS >nul
  if errorlevel 8 set FAILED=1
)

if "%FAILED%"=="1" (
  echo.
  echo ERROR: some skills failed to copy. Check permissions and retry.
  exit /b 1
)

echo.
echo Done. Restart Claude Code, then type /ielts to start.
endlocal
