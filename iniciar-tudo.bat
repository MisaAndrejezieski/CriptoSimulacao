@echo off
echo ============================================
echo 🚀 CRYPTOBOT PRO - INICIALIZACAO COMPLETA
echo ============================================
echo.

echo 📦 Verificando dependencias...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python nao encontrado. Instale o Python 3.8+ primeiro.
    pause
    exit /b 1
)
echo ✅ Python encontrado

node --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️ Node.js nao encontrado. O dashboard React nao funcionara.
    echo Instale o Node.js em: https://nodejs.org
) else (
    echo ✅ Node.js encontrado
)

echo.
echo 🔧 Instalando dependencias Python...
cd backend
pip install -r requirements.txt
cd ../api
pip install -r ../requirements.txt flask-socketio python-socketio
cd ../bot
pip install -r requirements.txt

echo.
echo 📊 Iniciando servicos...

echo.
echo 🌐 [1/4] Iniciando BACKEND (porta 5000)...
start "Backend" cmd /c "cd backend && python app.py"

timeout /t 3 /nobreak >nul

echo.
echo 🔌 [2/4] Iniciando API com WebSocket (porta 5001)...
start "API" cmd /c "cd api && python app.py"

timeout /t 3 /nobreak >nul

echo.
echo 🤖 [3/4] Iniciando BOT de Trading...
start "Bot" cmd /c "cd bot && python trading_bot.py"

timeout /t 5 /nobreak >nul

echo.
echo 🎨 [4/4] Iniciando DASHBOARD React (porta 3000)...
cd dashboard-react
if exist node_modules (
    start "Dashboard" cmd /c "npm start"
) else (
    echo ⚠️ Node.js nao instalado. Usando dashboard HTML estatico...
    cd ../dashboard
    start "Dashboard-HTML" cmd /c "python -m http.server 3000"
)

echo.
echo ============================================
echo ✅ TODOS OS SERVICOS INICIADOS!
echo ============================================
echo.
echo 🌐 Acesse os dashboards:
echo    📊 Dashboard Pro: http://localhost:3000
echo    📈 Dashboard Basico: http://localhost:5001/dashboard/index.html
echo    🎨 Frontend: http://localhost:5001/frontend/index.html
echo.
echo 🔴 Backend API: http://localhost:5000
echo 🔌 API WebSocket: http://localhost:5001
echo.
echo 📋 Status dos servicos:
echo    ✅ Backend (porta 5000) - Precos em tempo real
echo    ✅ API (porta 5001) - Dashboard e WebSocket
echo    ✅ Bot - Trading automatico
echo    ✅ Dashboard - Interface profissional
echo.
echo 🛑 Para parar todos os servicos:
echo    Pressione Ctrl+C em cada terminal ou feche as janelas
echo.
pause