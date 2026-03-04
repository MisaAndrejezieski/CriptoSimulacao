const { useState, useEffect } = React;

// Componente Principal do Dashboard
function App() {
    const [portfolio, setPortfolio] = useState({
        saldo_brl: 1000,
        patrimonio_total: 1000,
        variacao_total: 0,
        total_cripto: 0,
        posicoes: {},
        ultimas_operacoes: [],
        historico_patrimonio: []
    });

    const [precos, setPrecos] = useState({});
    const [isConnected, setIsConnected] = useState(false);
    const [charts, setCharts] = useState({});

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

    return (
        <div className="dashboard">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="logo">
                    <i className="fas fa-robot"></i>
                    <span className="logo-text">CRYPTOBOT PRO</span>
                </div>

                <ul className="nav-menu">
                    <li className="nav-item active">
                        <i className="fas fa-chart-line"></i>
                        <span>Dashboard</span>
                    </li>
                    <li className="nav-item">
                        <i className="fas fa-robot"></i>
                        <span>Estratégias</span>
                    </li>
                    <li className="nav-item">
                        <i className="fas fa-history"></i>
                        <span>Histórico</span>
                    </li>
                    <li className="nav-item">
                        <i className="fas fa-exchange-alt"></i>
                        <span>Trading</span>
                    </li>
                    <li className="nav-item">
                        <i className="fas fa-cog"></i>
                        <span>Configurações</span>
                    </li>
                </ul>

                <div style={{ marginTop: 'auto', padding: '2rem', textAlign: 'center' }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: isConnected ? '#10b981' : '#ef4444',
                        display: 'inline-block',
                        marginRight: '0.5rem'
                    }}></div>
                    <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                        {isConnected ? 'Online' : 'Offline'}
                    </span>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="header">
                    <h1>Dashboard Profissional</h1>
                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                        Última atualização: {new Date().toLocaleTimeString('pt-BR')}
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Saldo BRL</span>
                            <div className="stat-icon gold">
                                <i className="fas fa-wallet"></i>
                            </div>
                        </div>
                        <div className="stat-value">{formatarMoeda(portfolio.saldo_brl)}</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Patrimônio Total</span>
                            <div className="stat-icon gold">
                                <i className="fas fa-chart-line"></i>
                            </div>
                        </div>
                        <div className="stat-value">{formatarMoeda(portfolio.patrimonio_total)}</div>
                        <div style={{
                            color: portfolio.variacao_total >= 0 ? '#10b981' : '#ef4444',
                            fontSize: '0.875rem',
                            marginTop: '0.5rem'
                        }}>
                            {formatarPercentual(portfolio.variacao_total)}
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Em Criptomoedas</span>
                            <div className="stat-icon gold">
                                <i className="fas fa-bitcoin"></i>
                            </div>
                        </div>
                        <div className="stat-value">{formatarMoeda(portfolio.total_cripto)}</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-header">
                            <span className="stat-title">Total de Trades</span>
                            <div className="stat-icon gold">
                                <i className="fas fa-chart-bar"></i>
                            </div>
                        </div>
                        <div className="stat-value">{portfolio.ultimas_operacoes.length}</div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="charts-section">
                    <div className="chart-container">
                        <div className="chart-header">
                            <h3>Evolução do Patrimônio</h3>
                        </div>
                        <div className="chart-wrapper">
                            <canvas id="chart-patrimonio"></canvas>
                        </div>
                    </div>

                    <div className="chart-container">
                        <div className="chart-header">
                            <h3>Distribuição de Ativos</h3>
                        </div>
                        <div className="chart-wrapper">
                            <canvas id="chart-distribuicao"></canvas>
                        </div>
                    </div>
                </div>

                {/* Positions Table */}
                <div className="positions-section">
                    <h3>Posições Atuais</h3>
                    <div className="table-container">
                        <table className="positions-table">
                            <thead>
                                <tr>
                                    <th>Ativo</th>
                                    <th>Quantidade</th>
                                    <th>Preço Atual</th>
                                    <th>Valor Total</th>
                                    <th>P&L</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(portfolio.posicoes).map(([simbolo, quantidade]) => {
                                    const precoAtual = precos[simbolo]?.preco || 0;
                                    const valorTotal = quantidade * precoAtual;
                                    const pl = 0; // Calcular P&L real depois

                                    return (
                                        <tr key={simbolo}>
                                            <td><strong>{simbolo}</strong></td>
                                            <td>{quantidade.toFixed(6)}</td>
                                            <td>${precoAtual.toFixed(2)}</td>
                                            <td>{formatarMoeda(valorTotal)}</td>
                                            <td style={{ color: pl >= 0 ? '#10b981' : '#ef4444' }}>
                                                {formatarMoeda(pl)}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {Object.keys(portfolio.posicoes).length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                            Nenhuma posição aberta no momento
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Renderizar o App
ReactDOM.render(<App />, document.getElementById('root'));