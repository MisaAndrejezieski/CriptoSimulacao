// Configuração
const API_URL = 'http://localhost:5001/api';

// Charts
let patrimonioChart, distribuicaoChart;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    iniciarCharts();
    carregarDados();
    setInterval(carregarDados, 5000); // Atualiza a cada 5 segundos
});

function iniciarCharts() {
    // Chart de Patrimônio
    const ctxPatrimonio = document.getElementById('chart-patrimonio').getContext('2d');
    patrimonioChart = new Chart(ctxPatrimonio, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Patrimônio (R$)',
                data: [],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        display: true,
                        color: '#f1f5f9'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // Chart de Distribuição
    const ctxDistribuicao = document.getElementById('chart-distribuicao').getContext('2d');
    distribuicaoChart = new Chart(ctxDistribuicao, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#3b82f6',
                    '#22c55e',
                    '#a855f7',
                    '#f97316',
                    '#ef4444'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            cutout: '70%'
        }
    });
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

function atualizarDashboard(data) {
    document.getElementById('patrimonio-atual').textContent = 
        formatarMoeda(data.patrimonio_total);
    
    const variacao = data.variacao_total || 0;
    const variacaoEl = document.getElementById('variacao-total');
    variacaoEl.textContent = formatarPercentual(variacao);
    variacaoEl.className = variacao >= 0 ? 'positivo' : 'negativo';
    
    document.getElementById('saldo-disponivel').textContent = 
        formatarMoeda(data.saldo_brl);
    document.getElementById('total-cripto').textContent = 
        formatarMoeda(data.total_cripto);
    document.getElementById('total-trades').textContent = 
        data.total_trades || 0;
    document.getElementById('win-rate').textContent = 
        (data.win_rate || 0) + '%';
}

function atualizarPosicoes(posicoes) {
    const tbody = document.getElementById('posicoes-body');
    
    if (!posicoes || posicoes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #64748b;">
                    Nenhuma posição aberta no momento
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = posicoes.map(pos => {
        const lucroPrejuizo = (pos.preco_atual - pos.preco_medio) * pos.quantidade;
        const lucroPercentual = ((pos.preco_atual / pos.preco_medio) - 1) * 100;
        const lucroClass = lucroPrejuizo >= 0 ? 'lucro' : 'prejuizo';
        
        return `
            <tr>
                <td><strong>${pos.simbolo}</strong></td>
                <td>${pos.quantidade.toFixed(6)}</td>
                <td>$${pos.preco_medio.toFixed(2)}</td>
                <td>$${pos.preco_atual.toFixed(2)}</td>
                <td>${formatarMoeda(pos.valor_atual)}</td>
                <td class="${lucroClass}">${formatarMoeda(lucroPrejuizo)}</td>
                <td class="${lucroClass}">${formatarPercentual(lucroPercentual)}</td>
            </tr>
        `;
    }).join('');
}

function atualizarTimeline(operacoes) {
    const timeline = document.getElementById('timeline');
    
    if (!operacoes || operacoes.length === 0) {
        timeline.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #64748b;">
                Nenhuma operação realizada ainda
            </div>
        `;
        return;
    }
    
    timeline.innerHTML = operacoes.map(op => `
        <div class="timeline-item ${op.tipo.toLowerCase()}">
            <div class="timeline-icon">
                <i class="fas fa-${op.tipo === 'COMPRA' ? 'arrow-down' : 'arrow-up'}"></i>
            </div>
            <div class="timeline-content">
                <h4>${op.tipo} ${op.simbolo}</h4>
                <p>${new Date(op.timestamp).toLocaleString('pt-BR')}</p>
            </div>
            <div class="timeline-price">
                ${op.quantidade.toFixed(6)} @ $${op.preco.toFixed(2)}
            </div>
        </div>
    `).join('');
}

function atualizarCharts(data) {
    // Atualiza chart de patrimônio
    if (data.historico_patrimonio) {
        patrimonioChart.data.labels = data.historico_patrimonio.map(h => 
            new Date(h.timestamp).toLocaleTimeString()
        );
        patrimonioChart.data.datasets[0].data = 
            data.historico_patrimonio.map(h => h.valor);
        patrimonioChart.update();
    }
    
    // Atualiza chart de distribuição
    if (data.distribuicao) {
        distribuicaoChart.data.labels = data.distribuicao.map(d => d.simbolo);
        distribuicaoChart.data.datasets[0].data = 
            data.distribuicao.map(d => d.percentual);
        distribuicaoChart.update();
    }
}

function atualizarUltimaAtualizacao() {
    const agora = new Date();
    document.getElementById('ultima-atualizacao').textContent = 
        agora.toLocaleTimeString('pt-BR');
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function formatarPercentual(valor) {
    return (valor >= 0 ? '+' : '') + valor.toFixed(2) + '%';
}