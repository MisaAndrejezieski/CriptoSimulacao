# 🚀 CryptoBot Pro - Dashboard Profissional

Dashboard moderno e profissional para trading de criptomoedas, inspirado na Willtrading.

## ✨ Funcionalidades

- 🎯 **Interface Moderna**: Design profissional com React
- 🔴 **Tempo Real**: WebSocket para atualizações instantâneas
- 📊 **Gráficos Avançados**: Chart.js com visualizações interativas
- 💰 **Portfolio em Tempo Real**: Posições, saldos e P&L
- 📱 **Responsivo**: Funciona em desktop e mobile
- 🌙 **Dark Theme**: Interface otimizada para trading

## 🏗️ Arquitetura

```
dashboard-react/
├── index.html          # HTML principal
├── App.jsx            # Componente React principal
├── styles.css         # Estilos CSS modernos
├── server.js          # Servidor Express
└── package.json       # Dependências
```

## 🚀 Como Executar

### 1. Instalar Dependências
```bash
cd dashboard-react
npm install
```

### 2. Iniciar Serviços (em terminais separados)

**Terminal 1 - Backend:**
```bash
cd backend
python app.py
```

**Terminal 2 - API com WebSocket:**
```bash
cd api
python app.py
```

**Terminal 3 - Bot de Trading:**
```bash
cd bot
python trading_bot.py
```

**Terminal 4 - Dashboard React:**
```bash
cd dashboard-react
npm start
```

### 3. Acessar Dashboard
Abra: `http://localhost:3000`

## 🔧 Funcionalidades Técnicas

### WebSocket em Tempo Real
- Conexão automática com o servidor
- Atualização de preços a cada 5 segundos
- Sincronização do portfolio em tempo real
- Indicador de status de conexão

### Componentes React
- **App**: Componente principal
- **Sidebar**: Navegação lateral
- **Stats Cards**: Métricas principais
- **Charts**: Gráficos interativos
- **Positions Table**: Tabela de posições

### API Integration
```javascript
// Conexão WebSocket
const socket = io('http://localhost:5001');

// Eventos em tempo real
socket.on('prices_update', (data) => {
    // Atualizar preços
});

socket.on('portfolio_update', (data) => {
    // Atualizar portfolio
});
```

## 🎨 Design System

### Cores
- **Primary**: `#ffd700` (Gold)
- **Background**: `linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)`
- **Cards**: `rgba(15, 23, 42, 0.8)` com blur
- **Text**: `#e2e8f0`

### Tipografia
- **Font**: Segoe UI, sans-serif
- **Weights**: 300, 400, 500, 600, 700
- **Sizes**: Responsivo com clamp()

## 📊 Próximas Melhorias

### Fase 2: Trading Avançado
- [ ] Formulário de ordens (Market/Limit/Stop)
- [ ] Order Book em tempo real
- [ ] Gráficos TradingView
- [ ] Alertas de preço

### Fase 3: Autenticação
- [ ] Sistema de login/cadastro
- [ ] JWT tokens
- [ ] Perfis de usuário
- [ ] API Keys para exchanges

### Fase 4: Multi-Exchange
- [ ] Integração Binance
- [ ] Integração Bybit
- [ ] Arbitragem automática
- [ ] Sincronização de saldos

### Fase 5: Analytics
- [ ] Relatórios detalhados
- [ ] Backtesting
- [ ] Análise de risco
- [ ] Machine Learning

## 🛠️ Tecnologias

- **Frontend**: React 18 + Babel (standalone)
- **Backend**: Flask + SocketIO
- **Database**: JSON (posteriormente MongoDB)
- **Charts**: Chart.js
- **Styling**: CSS moderno com variáveis
- **Real-time**: WebSocket

## 📈 Comparação com Willtrading

| Recurso | CryptoBot Pro | Willtrading |
|---------|---------------|------------|
| Interface | ✅ React Moderna | ✅ React/Next.js |
| Tempo Real | ✅ WebSocket | ✅ WebSocket |
| Gráficos | ✅ Chart.js | ✅ TradingView Pro |
| Trading | ✅ Simulação | ✅ Real |
| Mobile | ✅ Responsivo | ✅ App Nativo |
| Exchanges | 🚧 1 (Binance) | ✅ 10+ Exchanges |

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.

---

**🎯 Status**: Em desenvolvimento ativo
**📊 Versão**: 1.0.0-beta
**👥 Equipe**: CryptoBot Team