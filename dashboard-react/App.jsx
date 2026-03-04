const { useState, useEffect } = React;

// Componente Principal do Dashboard
function App() {
    const [portfolio, setPortfolio] = useState({
        saldo_brl: 1000,
        patrimonio_total: 1234.56,
        variacao_total: 23.45,
        total_cripto: 666.67,
        posicoes: {},
        ultimas_operacoes: [],
        historico_patrimonio: []
    });

    const [precos, setPrecos] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    const [charts, setCharts] = useState({});
    const [currentView, setCurrentView] = useState('dashboard');
    
    // Estado do trading automático
    const [tradingConfig, setTradingConfig] = useState({
        ativo: false,
        simbolo: 'BTC',
        percentual_compra: -0.02,
        percentual_venda: 0.03,
        valor_investimento: 100
    });
    
    const [selectedCoin, setSelectedCoin] = useState('BTC');
    const [coinHistory, setCoinHistory] = useState([]);

    // Conexão WebSocket
    useEffect(() => {
        // Para produção, usar o mesmo host na porta 5001
        const apiUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:5001' 
            : `http://${window.location.hostname}:5001`;
        
        const socket = io(apiUrl);

        socket.on('connect', () => {
            console.log('🔗 Conectado ao servidor WebSocket');
            setIsConnected(true);
            socket.emit('subscribe_prices');
            socket.emit('subscribe_portfolio');
        });

        socket.on('disconnect', () => {
            console.log('❌ Desconectado do servidor');
            setIsConnected(false);
        });

        socket.on('prices_update', (data) => {
            console.log('💰 Preços atualizados:', data);
            setPrecos(data);
            updateCoinHistory(data);
        });

        socket.on('portfolio_update', (data) => {
            console.log('📊 Portfolio atualizado:', data);
            setPortfolio(data);
        });

        socket.on('trading_status', (data) => {
            setTradingConfig(prev => ({ ...prev, ativo: data.ativo, simbolo: data.simbolo || prev.simbolo }));
        });

        // Atualização periódica como fallback
        const interval = setInterval(() => {
            if (socket.connected) {
                socket.emit('subscribe_portfolio');
            }
        }, 5000);

        return () => {
            socket.disconnect();
            clearInterval(interval);
        };
    }, []);

    // Inicializar gráficos
    useEffect(() => {
        if (portfolio.historico_patrimonio && portfolio.historico_patrimonio.length > 0) {
            inicializarGraficos();
        }
    }, [portfolio]);

    const updateCoinHistory = (newPrices) => {
        if (newPrices[selectedCoin]) {
            setCoinHistory(prev => {
                const newEntry = {
                    timestamp: new Date(),
                    price: newPrices[selectedCoin].preco
                };
                const updated = [...prev, newEntry];
                // Mantém apenas últimas 50 entradas
                return updated.slice(-50);
            });
        }
    };

    const inicializarGraficos = () => {
        // Gráfico de Distribuição
        const ctxDistribuicao = document.getElementById('chart-distribuicao');
        if (ctxDistribuicao && !charts.distribuicao) {
            const distribuicao = calcularDistribuicao();
            const chart = new Chart(ctxDistribuicao, {
                type: 'doughnut',
                data: {
                    labels: distribuicao.map(d => d.simbolo),
                    datasets: [{
                        data: distribuicao.map(d => d.percentual),
                        backgroundColor: ['#ffd700', '#38bdf8', '#10b981', '#f59e0b', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    },
                    cutout: '70%'
                }
            });
            setCharts(prev => ({ ...prev, distribuicao: chart }));
        }

        // Gráfico da Moeda Selecionada
        const ctxCoin = document.getElementById('chart-coin');
        if (ctxCoin && !charts.coin) {
            const chart = new Chart(ctxCoin, {
                type: 'line',
                data: {
                    labels: coinHistory.map(h => h.timestamp.toLocaleTimeString()),
                    datasets: [{
                        label: `${selectedCoin} (R$)`,
                        data: coinHistory.map(h => h.price),
                        borderColor: '#ffd700',
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        x: {
                            grid: { display: false }
                        }
                    }
                }
            });
            setCharts(prev => ({ ...prev, coin: chart }));
        }
    };

    const calcularDistribuicao = () => {
        const total = portfolio.patrimonio_total;
        const distribuicao = [];

        // BRL
        if (portfolio.saldo_brl > 0) {
            distribuicao.push({
                simbolo: 'BRL',
                percentual: (portfolio.saldo_brl / total) * 100
            });
        }

        // Criptos
        Object.entries(portfolio.posicoes).forEach(([simbolo, quantidade]) => {
            if (precos[simbolo]) {
                const valor = quantidade * precos[simbolo].preco;
                distribuicao.push({
                    simbolo,
                    percentual: (valor / total) * 100
                });
            }
        });

        return distribuicao;
    };

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };

    const formatarPercentual = (valor) => {
        return (valor >= 0 ? '+' : '') + valor.toFixed(2) + '%';
    };

    const iniciarTrading = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/trading/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tradingConfig)
            });
            const result = await response.json();
            if (result.sucesso) {
                setTradingConfig(prev => ({ ...prev, ativo: true }));
                alert('Trading automático iniciado!');
            } else {
                alert('Erro ao iniciar trading: ' + result.mensagem);
            }
        } catch (error) {
            alert('Erro de conexão: ' + error.message);
        }
    };

    const pararTrading = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/trading/stop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();
            if (result.sucesso) {
                setTradingConfig(prev => ({ ...prev, ativo: false }));
                alert('Trading automático parado!');
            }
        } catch (error) {
            alert('Erro de conexão: ' + error.message);
        }
    };

    const valorInvestido = () => {
        let total = 0;
        Object.entries(portfolio.posicoes).forEach(([simbolo, quantidade]) => {
            if (precos[simbolo]) {
                total += quantidade * precos[simbolo].preco;
            }
        });
        return total;
    };

    const renderMainContent = () => {
        switch (currentView) {
            case 'dashboard':
                return (
                    <>
                        {/* Welcome Section */}
                        <div className="welcome-section">
                            <h1>Olá, <span className="gold">Investidor</span></h1>
                            <p>Acompanhe o desempenho do seu bot em tempo real</p>
                        </div>

                        {/* Trading Controls */}
                        <div className="card" style={{ marginBottom: '30px' }}>
                            <div style={{ padding: '20px' }}>
                                <h3 style={{ marginBottom: '20px', color: 'var(--gold-primary)' }}>Controle de Trading</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Moeda</label>
                                        <select 
                                            value={tradingConfig.simbolo} 
                                            onChange={(e) => setTradingConfig(prev => ({ ...prev, simbolo: e.target.value }))}
                                            style={{ width: '100%', padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                        >
                                            <option value="BTC">Bitcoin (BTC)</option>
                                            <option value="ETH">Ethereum (ETH)</option>
                                            <option value="BNB">Binance Coin (BNB)</option>
                                            <option value="ADA">Cardano (ADA)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Compra (% abaixo)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            value={tradingConfig.percentual_compra * 100} 
                                            onChange={(e) => setTradingConfig(prev => ({ ...prev, percentual_compra: parseFloat(e.target.value) / 100 }))}
                                            style={{ width: '100%', padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Venda (% acima)</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            value={tradingConfig.percentual_venda * 100} 
                                            onChange={(e) => setTradingConfig(prev => ({ ...prev, percentual_venda: parseFloat(e.target.value) / 100 }))}
                                            style={{ width: '100%', padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Valor por Trade (R$)</label>
                                        <input 
                                            type="number" 
                                            value={tradingConfig.valor_investimento} 
                                            onChange={(e) => setTradingConfig(prev => ({ ...prev, valor_investimento: parseFloat(e.target.value) }))}
                                            style={{ width: '100%', padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {!tradingConfig.ativo ? (
                                        <button 
                                            onClick={iniciarTrading}
                                            style={{ 
                                                background: 'var(--success)', 
                                                color: 'white', 
                                                border: 'none', 
                                                padding: '12px 24px', 
                                                borderRadius: '8px', 
                                                cursor: 'pointer',
                                                fontWeight: '600'
                                            }}
                                        >
                                            <i className="fas fa-play"></i> Iniciar Trading
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={pararTrading}
                                            style={{ 
                                                background: 'var(--danger)', 
                                                color: 'white', 
                                                border: 'none', 
                                                padding: '12px 24px', 
                                                borderRadius: '8px', 
                                                cursor: 'pointer',
                                                fontWeight: '600'
                                            }}
                                        >
                                            <i className="fas fa-stop"></i> Parar Trading
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Portfolio Cards */}
                        <div className="portfolio-cards">
                            <div className="card card-gold">
                                <div className="card-header">
                                    <span className="card-title">Saldo em Carteira</span>
                                    <i className="fas fa-wallet"></i>
                                </div>
                                <div className="card-value">{formatarMoeda(portfolio.saldo_brl)}</div>
                                <div className="card-footer">
                                    <span className="badge">Disponível</span>
                                </div>
                            </div>

                            <div className="card card-gradient">
                                <div className="card-header">
                                    <span className="card-title">Valor Investido</span>
                                    <i className="fas fa-chart-line"></i>
                                </div>
                                <div className="card-value">{formatarMoeda(valorInvestido())}</div>
                                <div className="card-footer">
                                    <span className={`variacao ${portfolio.variacao_total >= 0 ? 'positiva' : 'negativa'}`}>
                                        <i className="fas fa-arrow-up"></i> {formatarPercentual(portfolio.variacao_total)}
                                    </span>
                                    <span className="badge">Em tempo real</span>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <span className="card-title">Patrimônio Total</span>
                                    <i className="fas fa-coins"></i>
                                </div>
                                <div className="card-value">{formatarMoeda(portfolio.patrimonio_total)}</div>
                                <div className="card-footer">
                                    <span className="badge">Carteira + Investido</span>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <span className="card-title">Preço {selectedCoin}</span>
                                    <i className="fas fa-bitcoin"></i>
                                </div>
                                <div className="card-value">
                                    {precos[selectedCoin] ? formatarMoeda(precos[selectedCoin].preco) : 'Carregando...'}
                                </div>
                                <div className="card-footer">
                                    <span className="badge">Cotação atual</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="stats-row">
                            <div className="stat-card">
                                <i className="fas fa-chart-bar stat-icon gold"></i>
                                <div className="stat-info">
                                    <span className="stat-label">Total de Trades</span>
                                    <span className="stat-number">{portfolio.ultimas_operacoes.length}</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <i className="fas fa-clock stat-icon gold"></i>
                                <div className="stat-info">
                                    <span className="stat-label">Status</span>
                                    <span className="stat-number">{tradingConfig.ativo ? 'Ativo' : 'Inativo'}</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <i className="fas fa-signal stat-icon gold"></i>
                                <div className="stat-info">
                                    <span className="stat-label">Conexão</span>
                                    <span className="stat-number">{isConnected ? 'Online' : 'Offline'}</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <i className="fas fa-robot stat-icon gold"></i>
                                <div className="stat-info">
                                    <span className="stat-label">Modo</span>
                                    <span className="stat-number">{tradingConfig.ativo ? 'Automático' : 'Manual'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="charts-section">
                            <div className="chart-container">
                                <div className="chart-header">
                                    <h3>Gráfico de {selectedCoin}</h3>
                                    <div className="chart-periods">
                                        <button className="period-btn active">Tempo Real</button>
                                    </div>
                                </div>
                                <canvas id="chart-coin"></canvas>
                            </div>

                            <div className="chart-container small">
                                <div className="chart-header">
                                    <h3>Distribuição</h3>
                                </div>
                                <canvas id="chart-distribuicao"></canvas>
                            </div>
                        </div>
                    </>
                );
            case 'historico':
                return (
                    <>
                        <div className="welcome-section">
                            <h1>Histórico de <span className="gold">Trades</span></h1>
                            <p>Veja todas as operações realizadas pelo bot</p>
                        </div>
                        <div className="card">
                            <div style={{ padding: '20px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Data</th>
                                            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Tipo</th>
                                            <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Ativo</th>
                                            <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary)' }}>Quantidade</th>
                                            <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary)' }}>Preço</th>
                                            <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-secondary)' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {portfolio.ultimas_operacoes.map((op, index) => (
                                            <tr key={index} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '12px', color: 'var(--text-primary)' }}>
                                                    {new Date(op.timestamp).toLocaleString('pt-BR')}
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '11px',
                                                        background: op.tipo === 'COMPRA' ? 'var(--success-light)' : 'var(--danger-light)',
                                                        color: op.tipo === 'COMPRA' ? 'var(--success)' : 'var(--danger)'
                                                    }}>
                                                        {op.tipo}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                                    {op.simbolo}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary)' }}>
                                                    {op.quantidade}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary)' }}>
                                                    R$ {op.preco?.toFixed(2) || '0.00'}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary)' }}>
                                                    R$ {op.total?.toFixed(2) || '0.00'}
                                                </td>
                                            </tr>
                                        ))}
                                        {portfolio.ultimas_operacoes.length === 0 && (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                                    Nenhuma operação realizada ainda
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                );
            case 'estrategias':
                return (
                    <div className="welcome-section">
                        <h1>Estratégias de <span className="gold">Trading</span></h1>
                        <p>Configure e monitore suas estratégias automatizadas</p>
                        <div className="card" style={{ marginTop: '30px' }}>
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                Estratégia atual: Compra em {tradingConfig.percentual_compra * 100}% abaixo, venda em {tradingConfig.percentual_venda * 100}% acima
                            </div>
                        </div>
                    </div>
                );
            case 'analises':
                return (
                    <div className="welcome-section">
                        <h1>Análises <span className="gold">Avançadas</span></h1>
                        <p>Relatórios detalhados e métricas de performance</p>
                        <div className="card" style={{ marginTop: '30px' }}>
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                Análises em desenvolvimento
                            </div>
                        </div>
                    </div>
                );
            case 'configuracoes':
                return (
                    <div className="welcome-section">
                        <h1>Configurações do <span className="gold">Sistema</span></h1>
                        <p>Ajuste os parâmetros do seu bot de trading</p>
                        <div className="card" style={{ marginTop: '30px' }}>
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                Configurações em desenvolvimento
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            {/* Background Effects */}
            <div className="bg-glow"></div>
            <div className="grid-overlay"></div>

            {/* Header */}
            <header className="header">
                <div className="logo">
                    <i className="fas fa-robot gold-icon"></i>
                    <span className="logo-text">CRYPTO<span className="gold">BOT</span></span>
                </div>
                
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-label">Status do Bot</span>
                        <div className="stat-value status-online">
                            <span className="dot"></span>
                            {tradingConfig.ativo ? 'Trading' : 'Parado'}
                        </div>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Última Atualização</span>
                        <div className="stat-value" id="ultima-atualizacao">{new Date().toLocaleTimeString('pt-BR')}</div>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Versão</span>
                        <div className="stat-value">v2.0.0</div>
                    </div>
                </div>
            </header>

            {/* Main Container */}
            <div className="container">
                {/* Sidebar */}
                <aside className="sidebar">
                    <nav className="nav-menu">
                        <div className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
                            <i className="fas fa-chart-line"></i>
                            <span>Visão Geral</span>
                        </div>
                        <div className={`nav-item ${currentView === 'estrategias' ? 'active' : ''}`} onClick={() => setCurrentView('estrategias')}>
                            <i className="fas fa-robot"></i>
                            <span>Estratégias</span>
                        </div>
                        <div className={`nav-item ${currentView === 'historico' ? 'active' : ''}`} onClick={() => setCurrentView('historico')}>
                            <i className="fas fa-history"></i>
                            <span>Histórico</span>
                        </div>
                        <div className={`nav-item ${currentView === 'analises' ? 'active' : ''}`} onClick={() => setCurrentView('analises')}>
                            <i className="fas fa-chart-pie"></i>
                            <span>Análises</span>
                        </div>
                        <div className={`nav-item ${currentView === 'configuracoes' ? 'active' : ''}`} onClick={() => setCurrentView('configuracoes')}>
                            <i className="fas fa-cog"></i>
                            <span>Configurações</span>
                        </div>
                    </nav>
                    
                    <div className="sidebar-footer">
                        <div className="user-info">
                            <i className="fas fa-user-circle"></i>
                            <span>Modo {tradingConfig.ativo ? 'Automático' : 'Manual'}</span>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="main-content">
                    {renderMainContent()}
                </main>
            </div>
        </>
    );
}

// Renderizar o App
ReactDOM.render(<App />, document.getElementById('root'));