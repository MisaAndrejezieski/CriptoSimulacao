# 🚀 CryptoBot Pro - Simulador Avançado de Criptomoedas

**Dashboard profissional inspirado na Willtrading** com bot automatizado, WebSocket em tempo real e interface React moderna.

## ✨ Funcionalidades Principais

- 🎯 **Dashboard Profissional**: Interface React moderna com design inspirado na Willtrading
- 🔴 **WebSocket Tempo Real**: Atualizações instantâneas de preços e portfolio
- 🤖 **Bot de Trading**: Estratégia automatizada com médias móveis e RSI
- 📊 **Gráficos Interativos**: Chart.js com visualizações em tempo real
- 💰 **Simulação Realista**: R$ 1000 iniciais + integração com API Binance
- 📱 **Multi-Plataforma**: Desktop, mobile e tablets

## 🚀 Nova Estrutura do Projeto

```
CriptoSimulacao/
├── 📁 backend/          # API Flask - Preços e simulação
├── 📁 api/             # API WebSocket - Dashboard em tempo real
├── 📁 bot/             # Bot de trading automatizado
├── 📁 dashboard/       # Dashboard HTML básico
├── 📁 frontend/        # Dashboard HTML avançado
├── 📁 dashboard-react/ # 🚀 NOVO: Dashboard React Profissional
├── 📄 iniciar-tudo.bat # Script de inicialização automática
└── 📄 README.md        # Esta documentação
```

## 📦 Instalação Rápida

### 1. Clonar e Instalar Dependências

```bash
# Instalar dependências Python
pip install -r requirements.txt
pip install -r backend/requirements.txt
pip install -r api/requirements.txt
pip install -r bot/requirements.txt
```

### 2. Inicialização Automática (Recomendado)

```bash
# Executar tudo automaticamente (Windows)
iniciar-tudo.bat
```

### 3. Inicialização Manual

```bash
# Terminal 1: Backend (porta 5000)
cd backend
python app.py

# Terminal 2: API WebSocket (porta 5001)
cd api
python app.py

# Terminal 3: Bot de Trading
cd bot
python trading_bot.py

# Terminal 4: Dashboard React (porta 3000)
cd dashboard-react
python server.py
```

## 🎯 Dashboards Disponíveis

### 🚀 Dashboard React Profissional (Recomendado)
- **URL**: http://localhost:3000
- **Tecnologias**: React, Socket.IO, Chart.js
- **Funcionalidades**: Interface moderna, tempo real, gráficos avançados

### 📊 Dashboard HTML Avançado
- **URL**: http://localhost:5001/frontend
- **Tecnologias**: HTML5, JavaScript, Chart.js
- **Funcionalidades**: Interface responsiva, gráficos interativos

### 📈 Dashboard Básico
- **URL**: http://localhost:5001/dashboard
- **Tecnologias**: HTML5, JavaScript
- **Funcionalidades**: Interface simples, informações essenciais

## Começando

1. Crie um ambiente virtual e instale dependências:

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate   # windows: .venv\\Scripts\\activate
pip install -r requirements.txt
```

2. Execute a API Flask:

```bash
python app.py
```

3. Abra `frontend/index.html` em um navegador ou sirva com um servidor estático.

O front-end se comunica com `http://localhost:5000/api` por padrão.

## Como executar o sistema completo

1. **Instalar dependências**

   ```bash
   cd E:\CriptoSimulacao
   .venv\Scripts\activate   # windows
   pip install -r requirements.txt
   ```

2. **Iniciar o bot automático** (terminal 1):

   ```bash
   cd bot
   python trading_bot.py
   ```

3. **Rodar a API do dashboard** (terminal 2):

   ```bash
   cd api
   python app.py
   ```

4. **Servir o frontend** (terminal 3):

   ```bash
   cd dashboard
   live-server   # ou use extensão de servidor estático do VSCode
   ```

Após isso, abra o dashboard no navegador (geralmente em `http://127.0.0.1:8080`) para acompanhar o bot.

## 🔗 APIs e Endpoints

### Backend API (porta 5000)
- `GET /precos` - Preços atuais das criptos
- `POST /comprar` - Comprar criptomoeda
- `POST /vender` - Vender criptomoeda
- `GET /carteira` - Status da carteira
- `GET /historico` - Histórico de transações

### API WebSocket (porta 5001)
- `GET /precos` - Preços via REST
- `GET /carteira` - Carteira via REST
- `GET /dashboard` - Dashboard básico
- `GET /frontend` - Dashboard avançado
- **WebSocket Events**:
  - `connect` - Conexão estabelecida
  - `subscribe_prices` - Inscrever em atualizações de preços
  - `subscribe_portfolio` - Inscrever em atualizações de portfolio

## 🤖 Estratégia do Bot

O bot utiliza análise técnica avançada:

- **RSI (Relative Strength Index)**: Identifica condições de sobrecompra/sobrevenda
- **Médias Móveis**: SMA 20 e EMA 50 para tendência
- **Regras de Trading**:
  - Compra: RSI < 30 + preço acima da SMA 20
  - Venda: RSI > 70 + lucro > 2%
- **Gestão de Risco**: Stop-loss automático, limite de exposição

## 📊 Funcionalidades Técnicas

- ✅ **WebSocket Tempo Real**: Atualizações instantâneas sem polling
- ✅ **Simulação Realista**: Baseado em dados reais da Binance
- ✅ **Persistência**: Carteira salva em JSON (atualizável para MongoDB)
- ✅ **Logging**: Logs detalhados de todas as operações
- ✅ **Error Handling**: Tratamento robusto de erros
- ✅ **Threading**: Operações assíncronas para performance

## 🛠️ Troubleshooting

### Problemas Comuns

**Erro de porta ocupada:**
```bash
# Verificar processos usando a porta
netstat -ano | findstr :5000
# Matar processo (substitua PID)
taskkill /PID <PID> /F
```

**WebSocket não conecta:**
- Verificar se API está rodando na porta 5001
- Verificar console do navegador (F12) para erros
- Confirmar que não há firewall bloqueando

**Bot não executa trades:**
- Verificar logs em `bot/logs/`
- Confirmar saldo suficiente na carteira
- Verificar condições de mercado (RSI, médias)

## 🚀 Roadmap

### Próximas Funcionalidades
- [ ] **TradingView Charts**: Gráficos profissionais integrados
- [ ] **Autenticação JWT**: Sistema de login seguro
- [ ] **Multi-Exchange**: Suporte Binance, Bybit, Coinbase
- [ ] **Ordens Avançadas**: Limit, Stop-Loss, Take-Profit
- [ ] **Analytics**: Relatórios de performance e risco
- [ ] **Mobile App**: Aplicativo React Native
- [ ] **Database**: Migração para MongoDB/PostgreSQL
- [ ] **Backtesting**: Teste de estratégias históricas

### Melhorias Planejadas
- [ ] **Machine Learning**: Predições com IA
- [ ] **Arbitragem**: Trading entre exchanges
- [ ] **Copy Trading**: Seguir outros traders
- [ ] **API Pública**: Para integração externa

## ✅ Status Atual

### ✅ Implementado
- **Dashboard React Profissional**: Interface moderna com WebSocket
- **WebSocket Tempo Real**: Atualizações instantâneas de preços/portfolio
- **Bot de Trading Automatizado**: RSI + médias móveis
- **APIs REST completas**: Backend e API WebSocket
- **Script de Inicialização**: `iniciar-tudo.bat` para Windows
- **Documentação Completa**: README detalhado

### 🔄 Funcionando
- Backend Flask (porta 5000) ✅
- API WebSocket (porta 5001) ✅
- Dashboards HTML acessíveis ✅
- Simulação com dados reais ✅

### 🎯 Pronto para Uso
O sistema está **100% funcional** e pronto para uso em produção!



