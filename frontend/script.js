// Configuração
const API_URL = 'http://localhost:5001/api';

// Charts
let patrimonioChart, distribuicaoChart;

// Dados históricos hora a hora
const gerarDadosHoraHora = () => {
    const dados = [];
    const horas = [];
    
    // Gerar dados das últimas 24 horas
    for (let i = 24; i >= 0; i--) {
        const data = new Date();
        data.setHours(data.getHours() - i);
        
        // Formato: "00:00" ou "01:00" etc
        horas.push(data.getHours().toString().padStart(2, '0') + ':00');
        
        // Simular variação do patrimônio
        const base = 1000;
        const variacao = Math.sin(i / 4) * 50 + (i * 2);
        dados.push(base + variacao);
    }
    
    return { horas, dados };
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    iniciarCharts();
    carregarDados();
    setInterval(carregarDados, 30000); // Atualiza a cada 30 segundos
    setInterval(atualizarUltimaAtualizacao, 1000);
});

function iniciarCharts() {
    // Chart de Patrimônio - Estilo LSEG
    const ctxPatrimonio = document.getElementById('chart-patrimonio').getContext('2d');
    
    // Criar gradiente dourado
    const gradient = ctxPatrimonio.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0.0)');
    
    const { horas, dados } = gerarDadosHoraHora();
    
    patrimonioChart = new Chart(ctxPatrimonio, {
        type: 'line',
        data: {
            labels: horas,
            datasets: [{
                label: 'BTC/BRL',
                data: dados,
                borderColor: '#FFD700',
                backgroundColor: gradient,
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHoverBackgroundColor: '#FFD700',
                pointHoverBorderColor: '#B8860B',
                tension: 0.2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 20,
                    bottom: 30
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#1E2329',
                    titleColor: '#FFD700',
                    bodyColor: '#FFFFFF',
                    borderColor: '#B8860B',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `R$ ${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    position: 'right',
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false,
                        lineWidth: 0.5
                    },
                    ticks: {
                        color: '#9CA3AF',
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(0);
                        },
                        stepSize: 200000
                    },
                    min: 0,
                    max: 1000000
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#9CA3AF',
                        maxRotation: 0,
                        maxTicksLimit: 12
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            elements: {
                line: {
                    borderJoinStyle: 'round'
                }
            }
        }
    });

    // Chart de Distribuição - Donut
    const ctxDistribuicao = document.getElementById('chart-distribuicao').getContext('2d');
    distribuicaoChart = new Chart(ctxDistribuicao, {
        type: 'doughnut',
        data: {
            labels: ['BTC', 'ETH', 'BNB', 'ADA', 'BRL'],
            datasets: [{
                data: [45, 30, 15, 5, 5],
                backgroundColor: [
                    '#FFD700',
                    '#B8860B',
                    '#DAA520',
                    '#CD7F32',
                    '#9CA3AF'
                ],
                borderWidth: 0,
                hoverOffset: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1E2329',
                    titleColor: '#FFD700',
                    bodyColor: '#FFFFFF',
                    borderColor: '#B8860B',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `${context.raw}%`;
                        }
                    }
                }
            },
            cutout: '65%',
            layout: {
                padding: 10
            }
        }
    });

    // Atualizar lista de distribuição
    atualizarDistribuicaoLista([
        { simbolo: 'BTC', percentual: 45, valor: 450000 },
        { simbolo: 'ETH', percentual: 30, valor: 300000 },
        { simbolo: 'BNB', percentual: 15, valor: 150000 },
        { simbolo: 'ADA', percentual: 5, valor: 50000 },
        { simbolo: 'BRL', percentual: 5, valor: 50000 }
    ]);

    // Adicionar footer do gráfico
    adicionarFooterGrafico();
}

function adicionarFooterGrafico() {
    const chartContainer = document.querySelector('.chart-container');
    if (chartContainer && !document.querySelector('.chart-footer')) {
        const footer = document.createElement('div');
        footer.className = 'chart-footer';
        footer.innerHTML = `
            <div class="chart-footer-left">
                <span class="chart-footer-label">BTC - Bitcoin</span>
                <span class="chart-footer-label">BRL R$ - Real Brasileiro</span>
                <span class="chart-footer-value">1,00</span>
                <span class="chart-footer-value">360.652,00</span>
            </div>
            <div class="chart-footer-right">
                <span class="chart-footer-data">Dados do LSEG · Aviso de Isenção de Responsabilidade</span>
            </div>
        `;
        chartContainer.appendChild(footer);
    }
}

function atualizarDashboard(data) {
    document.getElementById('patrimonio-atual').textContent = 
        formatarMoeda(data.patrimonio_total);
    
    const variacao = data.variacao_total || 0;
    const variacaoEl = document.getElementById('variacao-total');
    variacaoEl.innerHTML = variacao >= 0 
        ? `<i class="fas fa-arrow-up"></i> +${variacao.toFixed(2)}%`
        : `<i class="fas fa-arrow-down"></i> ${variacao.toFixed(2)}%`;
    variacaoEl.className = `variacao ${variacao >= 0 ? 'positiva' : 'negativa'}`;
    
    document.getElementById('saldo-disponivel').textContent = 
        formatarMoeda(data.saldo_brl);
    document.getElementById('total-cripto').textContent = 
        formatarMoeda(data.total_cripto);
    document.getElementById('total-trades').textContent = 
        data.total_trades || 0;
    document.getElementById('win-rate').textContent = 
        (data.win_rate || 0) + '%';
    document.getElementById('trades-hoje').textContent = '0'; // Placeholder
    document.getElementById('melhor-trade').textContent = '+0%'; // Placeholder
}

function atualizarCharts(data) {
    // Atualiza chart de patrimônio
    if (data.historico_patrimonio && patrimonioChart) {
        // Use real data if available, otherwise keep mock data
        if (data.historico_patrimonio.length > 0) {
            patrimonioChart.data.labels = data.historico_patrimonio.map(h => 
                new Date(h.timestamp).toLocaleTimeString()
            );
            patrimonioChart.data.datasets[0].data = 
                data.historico_patrimonio.map(h => h.valor);
            patrimonioChart.update();
        }
    }
    
    // Atualiza chart de distribuição
    if (data.distribuicao && distribuicaoChart) {
        distribuicaoChart.data.labels = data.distribuicao.map(d => d.simbolo);
        distribuicaoChart.data.datasets[0].data = 
            data.distribuicao.map(d => d.percentual);
        distribuicaoChart.update();
        
        // Atualizar lista de distribuição
        atualizarDistribuicaoLista(data.distribuicao.map(d => ({
            simbolo: d.simbolo,
            percentual: d.percentual,
            valor: (d.percentual / 100) * data.patrimonio_total
        })));
    }
}

async function carregarDados() {
    try {
        const response = await fetch(`${API_URL}/dashboard`);
        const data = await response.json();
        
        atualizarDashboard(data);
        atualizarPosicoes(data.posicoes);
        atualizarTimeline(data.ultimas_operacoes);
        atualizarCharts(data);
        atualizarUltimaAtualizacao();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

function atualizarPosicoes(posicoes) {
    const tbody = document.getElementById('posicoes-body');
    if (!tbody) return;
    
    if (!posicoes || posicoes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #64748b;">
                    Nenhuma posição aberta no momento
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = posicoes.map(pos => {
        const valor_total = pos.quantidade * pos.preco_atual;
        const lucro_prejuizo = (pos.preco_atual - pos.preco_medio) * pos.quantidade;
        const lucro_percentual = ((pos.preco_atual / pos.preco_medio) - 1) * 100;
        const lucroClass = lucro_prejuizo >= 0 ? 'lucro' : 'prejuizo';
        
        return `
            <tr>
                <td><strong>${pos.simbolo}</strong></td>
                <td>${pos.quantidade.toFixed(6)}</td>
                <td>R$ ${formatarNumero(pos.preco_medio)}</td>
                <td>R$ ${formatarNumero(pos.preco_atual)}</td>
                <td>${formatarMoeda(valor_total)}</td>
                <td class="${lucroClass}">${formatarMoeda(lucro_prejuizo)}</td>
                <td class="${lucroClass}">${lucro_percentual >= 0 ? '+' : ''}${lucro_percentual.toFixed(2)}%</td>
                <td><i class="fas fa-chart-line" style="color: #FFD700;"></i></td>
            </tr>
        `;
    }).join('');
}

function atualizarTimeline(operacoes) {
    const timeline = document.getElementById('timeline-container');
    if (!timeline) return;
    
    if (!operacoes || operacoes.length === 0) {
        timeline.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #64748b;">
                Nenhuma operação realizada ainda
            </div>
        `;
        return;
    }
    
    timeline.innerHTML = operacoes.map(op => {
        const horario = new Date(op.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="timeline-item ${op.tipo.toLowerCase()}">
                <div class="timeline-icon ${op.tipo.toLowerCase()}">
                    <i class="fas fa-${op.tipo === 'COMPRA' ? 'arrow-down' : 'arrow-up'}"></i>
                </div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <h4>${op.tipo} ${op.simbolo}</h4>
                        <span class="timeline-time">${horario}</span>
                    </div>
                    <p class="timeline-motivo">Decisão automática do bot</p>
                    <p class="timeline-detalhes">
                        ${op.quantidade.toFixed(6)} unidades • R$ ${formatarNumero(op.preco)}
                    </p>
                </div>
                <div class="timeline-price">
                    R$ ${(op.quantidade * op.preco).toFixed(2)}
                </div>
            </div>
        `;
    }).join('');
}

function atualizarUltimaAtualizacao() {
    const agora = new Date();
    const elemento = document.getElementById('ultima-atualizacao');
    if (elemento) {
        elemento.textContent = agora.toLocaleTimeString('pt-BR') + ' UTC';
    }
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor);
}

function formatarNumero(valor) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor);
}
