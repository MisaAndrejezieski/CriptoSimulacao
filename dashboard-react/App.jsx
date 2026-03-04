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

    // Conexão WebSocket
    useEffect(() => {
        const socket = io('http://localhost:5001');

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
        });

        socket.on('portfolio_update', (data) => {
            console.log('📊 Portfolio atualizado:', data);
            setPortfolio(data);
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

    const inicializarGraficos = () => {
        // Gráfico de Patrimônio
        const ctxPatrimonio = document.getElementById('chart-patrimonio');
        if (ctxPatrimonio && !charts.patrimonio) {
            const chart = new Chart(ctxPatrimonio, {
                type: 'line',
                data: {
                    labels: portfolio.historico_patrimonio.map(h => new Date(h.timestamp).toLocaleTimeString()),
                    datasets: [{
                        label: 'Patrimônio (R$)',
                        data: portfolio.historico_patrimonio.map(h => h.valor),
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
            setCharts(prev => ({ ...prev, patrimonio: chart }));
        }

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

                        {/* Portfolio Cards */}
                        <div className="portfolio-cards">
                            <div className="card card-gold">
                                <div className="card-header">
                                    <span className="card-title">Saldo Inicial</span>
                                    <i className="fas fa-wallet"></i>
                                </div>
                                <div className="card-value">R$ 1.000,00</div>
                                <div className="card-footer">
                                    <span className="badge">Capital inicial</span>
                                </div>
                            </div>

                            <div className="card card-gradient">
                                <div className="card-header">
                                    <span className="card-title">Patrimônio Atual</span>
                                    <i className="fas fa-chart-line"></i>
                                </div>
                                <div className="card-value" id="patrimonio-atual">{formatarMoeda(portfolio.patrimonio_total)}</div>
                                <div className="card-footer">
                                    <span className={`variacao ${portfolio.variacao_total >= 0 ? 'positiva' : 'negativa'}`}>
                                        <i className="fas fa-arrow-up"></i> {formatarPercentual(portfolio.variacao_total)}
                                    </span>
                                    <span className="badge">Últimos 30 dias</span>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <span className="card-title">Saldo Disponível</span>
                                    <i className="fas fa-coins"></i>
                                </div>
                                <div className="card-value" id="saldo-disponivel">{formatarMoeda(portfolio.saldo_brl)}</div>
                                <div className="card-footer">
                                    <span className="badge">Em BRL</span>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <span className="card-title">Em Criptomoedas</span>
                                    <i className="fas fa-bitcoin"></i>
                                </div>
                                <div className="card-value" id="total-cripto">{formatarMoeda(portfolio.total_cripto)}</div>
                                <div className="card-footer">
                                    <span className="badge">Valor de mercado</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="stats-row">
                            <div className="stat-card">
                                <i className="fas fa-chart-bar stat-icon gold"></i>
                                <div className="stat-info">
                                    <span className="stat-label">Total de Trades</span>
                                    <span className="stat-number" id="total-trades">{portfolio.ultimas_operacoes.length}</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <i className="fas fa-clock stat-icon gold"></i>
                                <div className="stat-info">
                                    <span className="stat-label">Tempo Online</span>
                                    <span className="stat-number">24h</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <i className="fas fa-signal stat-icon gold"></i>
                                <div className="stat-info">
                                    <span className="stat-label">Status</span>
                                    <span className="stat-number">{isConnected ? 'Online' : 'Offline'}</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <i className="fas fa-robot stat-icon gold"></i>
                                <div className="stat-info">
                                    <span className="stat-label">Modo</span>
                                    <span className="stat-number">Automático</span>
                                </div>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="charts-section">
                            <div className="chart-container">
                                <div className="chart-header">
                                    <h3>Evolução do Patrimônio</h3>
                                    <div className="chart-periods">
                                        <button className="period-btn active">1D</button>
                                        <button className="period-btn">7D</button>
                                        <button className="period-btn">30D</button>
                                    </div>
                                </div>
                                <canvas id="chart-patrimonio"></canvas>
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
                    <div className="welcome-section">
                        <h1>Histórico de <span className="gold">Trades</span></h1>
                        <p>Veja todas as operações realizadas pelo bot</p>
                        <div className="card" style={{ marginTop: '30px' }}>
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                Funcionalidade em desenvolvimento
                            </div>
                        </div>
                    </div>
                );
            case 'estrategias':
                return (
                    <div className="welcome-section">
                        <h1>Estratégias de <span className="gold">Trading</span></h1>
                        <p>Configure e monitore suas estratégias automatizadas</p>
                        <div className="card" style={{ marginTop: '30px' }}>
                            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                Funcionalidade em desenvolvimento
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
                                Funcionalidade em desenvolvimento
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
                                Funcionalidade em desenvolvimento
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
                            {isConnected ? 'Online' : 'Offline'}
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
                            <span>Modo Automático</span>
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