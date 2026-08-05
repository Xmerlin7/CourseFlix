@echo off
setlocal enabledelayedexpansion

:: CourseFlix local development launcher for Windows
:: Usage:
::   dev.bat            bring the whole stack up (infra + migrations + seed + API + web)
::   dev.bat stop       stop the API/web processes and the Docker services
::   dev.bat reset      drop the database volume and rebuild it from scratch
::   dev.bat status     show what is currently running
::   dev.bat logs       follow the API and web logs
::
:: Flags:
::   --no-seed           run migrations but skip seeding
::   --no-infra          assume Postgres/Redis/Chroma are already running

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
cd /d "%ROOT%"

set "LOG_DIR=%ROOT%\.dev-logs"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
set "API_LOG=%LOG_DIR%\api.log"
set "WEB_LOG=%LOG_DIR%\web.log"

set "API_PORT=3000"
set "WEB_PORT=5173"
set "POSTGRES_PORT=5432"

set "COMMAND=up"
set "SKIP_SEED=false"
set "SKIP_INFRA=false"

:parse_args
if "%~1"=="" goto main
if /i "%~1"=="up" set "COMMAND=up" & shift & goto parse_args
if /i "%~1"=="stop" set "COMMAND=stop" & shift & goto parse_args
if /i "%~1"=="reset" set "COMMAND=reset" & shift & goto parse_args
if /i "%~1"=="status" set "COMMAND=status" & shift & goto parse_args
if /i "%~1"=="logs" set "COMMAND=logs" & shift & goto parse_args
if /i "%~1"=="--no-seed" set "SKIP_SEED=true" & shift & goto parse_args
if /i "%~1"=="--no-infra" set "SKIP_INFRA=true" & shift & goto parse_args
if /i "%~1"=="-h" goto usage
if /i "%~1"=="--help" goto usage
echo Unknown argument: %~1
exit /b 1

:usage
echo CourseFlix local development launcher.
echo.
echo Usage:
echo   dev.bat [command] [flags]
echo.
echo Commands:
echo   up (default)  bring the whole stack up (infra + migrations + seed + API + web)
echo   stop          stop the API/web processes and the Docker services
echo   reset         drop the database volume and rebuild it from scratch
echo   status        show what is currently running
echo   logs          follow the API and web logs
echo.
echo Flags:
echo   --no-seed     run migrations but skip seeding
echo   --no-infra    assume Postgres/Redis/Chroma are already running
exit /b 0

:main
if /i "%COMMAND%"=="up" goto cmd_up
if /i "%COMMAND%"=="stop" goto cmd_stop
if /i "%COMMAND%"=="reset" goto cmd_reset
if /i "%COMMAND%"=="status" goto cmd_status
if /i "%COMMAND%"=="logs" goto cmd_logs
goto usage

:cmd_up
echo ==^> Checking prerequisites
where node >nul 2>&1 || (echo ERROR: node is not installed & exit /b 1)
for /f "tokens=*" %%v in ('node -v') do set "NODE_VER=%%v"
echo   [OK] node %NODE_VER%

where npm >nul 2>&1 || (echo ERROR: npm is not installed & exit /b 1)
for /f "tokens=*" %%v in ('npm -v') do set "NPM_VER=%%v"
echo   [OK] npm %NPM_VER%

where docker >nul 2>&1 || (echo ERROR: docker is not installed & exit /b 1)
docker info >nul 2>&1 || (echo ERROR: Docker daemon is not running & exit /b 1)
echo   [OK] docker running

if not exist "%ROOT%\.env" (
  echo   [!] .env was missing -- created it from .env.example
  copy "%ROOT%\.env.example" "%ROOT%\.env" >nul
)
echo   [OK] .env present

echo ==^> Installing dependencies
if not exist "%ROOT%\apps\api\node_modules" (
  echo   installing apps/api ...
  call npm install --prefix apps/api --silent
)
echo   [OK] apps/api

if not exist "%ROOT%\apps\web\node_modules" (
  echo   installing apps/web ...
  call npm install --prefix apps/web --silent
)
echo   [OK] apps/web

if "%SKIP_INFRA%"=="true" (
  echo   [!] skipping infrastructure (--no-infra)
) else (
  echo ==^> Starting infrastructure (Postgres, Redis, Chroma)
  docker compose up -d >nul 2>&1
  echo   [OK] containers up
  <nul set /p "=  waiting for Postgres to accept connections"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$w=0; while ($w -lt 60) { $st = (docker inspect --format '{{.State.Health.Status}}' courseflix-postgres 2>$null); if ($st -eq 'healthy') { Write-Host ''; exit 0 }; Write-Host -NoNewline '.'; Start-Sleep 1; $w++ }; Write-Host ''; exit 1"
  if errorlevel 1 (
    echo ERROR: Postgres did not become healthy within 60s.
    exit /b 1
  )
  echo   [OK] Postgres healthy on port %POSTGRES_PORT%
)

echo ==^> Preparing the database
echo   running migrations ...
call npm run migration:run --prefix apps/api --silent > "%LOG_DIR%\migrations.log" 2>&1
if errorlevel 1 (
  echo ERROR: migrations failed -- see %LOG_DIR%\migrations.log
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content '%LOG_DIR%\migrations.log' -Tail 20"
  exit /b 1
)
echo   [OK] migrations applied

if "%SKIP_SEED%"=="true" (
  echo   [!] seeding skipped (--no-seed)
) else (
  echo   seeding demo data ...
  call npm run seed --prefix apps/api --silent > "%LOG_DIR%\seed.log" 2>&1
  if errorlevel 1 (
    echo ERROR: seed failed -- see %LOG_DIR%\seed.log
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content '%LOG_DIR%\seed.log' -Tail 20"
    exit /b 1
  )
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$sel=$false; Get-Content '%LOG_DIR%\seed.log' | ForEach-Object { if ($_ -match '^Seed complete:') { $sel=$true }; if ($sel) { Write-Host ('  ' + $_) } }"
)

echo ==^> Starting the API and web app
call :free_port %API_PORT%
call :free_port %WEB_PORT%

start /B cmd /c "npm run start:dev --prefix apps/api > "%API_LOG%" 2>&1"
<nul set /p "=  waiting for API"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$w=0; while ($w -lt 90) { try { $r = Invoke-WebRequest -Uri 'http://localhost:%API_PORT%/api/v1/health' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { Write-Host ''; exit 0 } } catch {}; Write-Host -NoNewline '.'; Start-Sleep 1; $w++ }; Write-Host ''; exit 1"
if errorlevel 1 (
  echo ERROR: API did not start within 90s. Check %API_LOG%
  exit /b 1
)
echo   [OK] API listening on http://localhost:%API_PORT%

start /B cmd /c "npm run dev --prefix apps/web > "%WEB_LOG%" 2>&1"
<nul set /p "=  waiting for web app"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$w=0; while ($w -lt 90) { try { $r = Invoke-WebRequest -Uri 'http://localhost:%WEB_PORT%' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { Write-Host ''; exit 0 } } catch {}; Write-Host -NoNewline '.'; Start-Sleep 1; $w++ }; Write-Host ''; exit 1"
if errorlevel 1 (
  echo ERROR: web app did not start within 90s. Check %WEB_LOG%
  exit /b 1
)
echo   [OK] web app listening on http://localhost:%WEB_PORT%

call :print_summary
exit /b 0

:cmd_stop
echo ==^> Stopping the API and web app
call :free_port %API_PORT%
call :free_port %WEB_PORT%

echo ==^> Stopping infrastructure
docker compose down >nul 2>&1
echo   [OK] containers stopped (data volumes kept -- use 'dev.bat reset' to wipe)
exit /b 0

:cmd_reset
set /p REPLY="This deletes the database volume and all local data. Continue? [y/N] "
if /i not "%REPLY%"=="y" (
  echo Cancelled.
  exit /b 0
)
echo ==^> Removing containers and volumes
docker compose down -v >nul 2>&1
echo   [OK] volumes removed
set "SKIP_INFRA=false"
goto cmd_up

:cmd_status
echo ==^> Containers
docker compose ps
echo ==^> App processes
call :check_port_status "API" %API_PORT%
call :check_port_status "web" %WEB_PORT%
exit /b 0

:cmd_logs
if not exist "%API_LOG%" (
  echo ERROR: no logs yet -- run dev.bat first.
  exit /b 1
)
echo ==^> Following API and web logs (Ctrl+C to stop)
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Content -Path '%API_LOG%','%WEB_LOG%' -Wait -Tail 20"
exit /b 0

:free_port
set "PORT_TO_FREE=%~1"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = Get-NetTCPConnection -LocalPort %PORT_TO_FREE% -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($p) { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue; Write-Host '  ! freed port %PORT_TO_FREE%' }"
exit /b 0

:check_port_status
set "APP_NAME=%~1"
set "APP_PORT=%~2"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$conn = Get-NetTCPConnection -LocalPort %APP_PORT% -State Listen -ErrorAction SilentlyContinue; if ($conn) { Write-Host ('  [OK] ' + '%APP_NAME%' + ' listening on ' + '%APP_PORT%') } else { Write-Host ('  ! ' + '%APP_NAME%' + ' not running on ' + '%APP_PORT%') }"
exit /b 0

:print_summary
powershell -NoProfile -ExecutionPolicy Bypass -Command "$t_email = (Get-Content .env | Select-String '^SEED_TEACHER_EMAIL=').Line.Split('=',2)[1]; $t_pass = (Get-Content .env | Select-String '^SEED_TEACHER_PASSWORD=').Line.Split('=',2)[1]; $s_email = (Get-Content .env | Select-String '^SEED_STUDENT_EMAIL=').Line.Split('=',2)[1]; $s_pass = (Get-Content .env | Select-String '^SEED_STUDENT_PASSWORD=').Line.Split('=',2)[1]; $h = (Invoke-RestMethod -Uri 'http://localhost:%API_PORT%/api/v1/health' -ErrorAction SilentlyContinue | ConvertTo-Json -Compress); Write-Host ''; Write-Host 'CourseFlix is running.' -ForegroundColor Green; Write-Host ''; Write-Host '  Open this       http://localhost:%WEB_PORT%'; Write-Host ''; Write-Host '  Sign in as'; Write-Host ('    teacher        ' + $t_email + '  /  ' + $t_pass); Write-Host ('    student        ' + $s_email + '  /  ' + $s_pass); Write-Host '    other students student2@courseflix.local ... student10@courseflix.local'; Write-Host '                   (same password as the student above)'; Write-Host ''; Write-Host '  Services'; Write-Host '    web            http://localhost:%WEB_PORT%'; Write-Host '    API            http://localhost:%API_PORT%/api/v1'; Write-Host ('    health         http://localhost:%API_PORT%/api/v1/health (' + $h + ')'); Write-Host '    Postgres       localhost:%POSTGRES_PORT%'; Write-Host '    Redis          localhost:6379'; Write-Host '    Chroma         http://localhost:8000'; Write-Host ''; Write-Host '  Logs'; Write-Host '    dev.bat logs'; Write-Host ''; Write-Host '  Stop'; Write-Host '    dev.bat stop'; Write-Host ''"
exit /b 0
