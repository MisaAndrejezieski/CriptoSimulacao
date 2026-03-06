// Configurações
const API_URL = 'http://localhost:5000/api';
let userId = 'user_' + Math.random().toString(36).substr(2, 9);
let precoAtual = 0;
let moedaAtual = 'BTC';
let grafico = null;
let historicoPrecos = [];
let intervalIds = [];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Cripto Simulação iniciado');
    
    // Salva userId
    const userIdElem = document.getElementById('user-id');
    if (userIdElem) userIdElem.textContent = userId;
    
    // Carrega dados iniciais
    carregarPrecos();
    carregarStatus();
    carregarHistorico();
    
    // Configura atualizações em tempo real
    startPriceUpdates();
    startStatusUpdates();
    
    // Configura eventos
    const qty = document.getElementById('quantity');
    if (qty) qty.addEventListener('input', calcularValorTotal);
    const tradeCrypto = document.getElementById('trade-crypto');
    if (tradeCrypto) tradeCrypto.addEventListener('change', mudarMoeda);
    
    // Carrega preços na página inicial se existir
    if (document.getElementById('live-prices')) {
        carregarTodasCriptos();
    }
});

// ========== PREÇOS EM TEMPO REAL ==========

function startPriceUpdates() {
    // Atualiza a cada 10 segundos
    const interval = setInterval(() => {
        carregarPrecos();
    }, 10000);
    intervalIds.push(interval);
}

async function carregarPrecos() {
    try {
        const response = await fetch(`${API_URL}/precos?moeda=${moedaAtual}`);
        const data = await response.json();
        
        if (data.dados) {
            precoAtual = data.dados.preco;
            
            // Atualiza interface
            const priceElement = document.getElementById('current-price');
            if (priceElement) {
                priceElement.value = formatarMoeda(precoAtual);
            }
            
            // Atualiza preço no sidebar
            atualizarPrecoSidebar(moedaAtual, precoAtual, data.dados.variacao_24h);
            
            // Adiciona ao histórico para gráfico
            historicoPrecos.push({
                preco: precoAtual,
                timestamp: new Date()
            });
            
            if (historicoPrecos.length > 20) {
                historicoPrecos.shift();
            }
            
            // Atualiza gráfico
            atualizarGrafico();
            
            // Gera alertas
            gerarAlertas(data.dados);
        }
    } catch (error) {
        console.error('Erro ao carregar preços:', error);
    }
}

async function carregarTodasCriptos() {
    try {
        const response = await fetch(`${API_URL}/precos/todas`);
        const data = await response.json();
        
        const pricesGrid = document.getElementById('live-prices');
        if (pricesGrid) {
            pricesGrid.innerHTML = '';
            
            for (const [moeda, dados] of Object.entries(data.precos)) {
                const changeClass = dados.variacao_24h >= 0 ? 'positive' : 'negative';
                const changeSignal = dados.variacao_24h >= 0 ? '▲' : '▼';
                
                pricesGrid.innerHTML += `
                    <div class="price-item">
                        <h4>${moeda}</h4>
                        <div class="value">${formatarMoeda(dados.preco)}</div>
                        <div class="change ${changeClass}">
                            ${changeSignal} ${Math.abs(dados.variacao_24h).toFixed(2)}%
                        </div>
                        <small>${dados.fonte}</small>
                    </div>
                `;
            }
        }
        
        // Atualiza também o sidebar se estiver no dashboard
        atualizarSidebarCriptos(data.precos);
    } catch (error) {
        console.error('Erro ao carregar todas criptos:', error);
    }
}

function atualizarSidebarCriptos(precos) {
    const cryptoList = document.getElementById('crypto-list');
    if (!cryptoList) return;
    
    cryptoList.innerHTML = '';
    
    for (const [moeda, dados] of Object.entries(precos)) {
        const changeClass = dados.variacao_24h >= 0 ? 'positive' : 'negative';
        const changeSignal = dados.variacao_24h >= 0 ? '▲' : '▼';
        
        cryptoList.innerHTML += `
            <div class="crypto-item ${moeda === moedaAtual ? 'active' : ''}" onclick="selecionarMoeda('${moeda}')">
                <span class="name">${moeda}</span>
                <span class="price">${formatarMoedaResumido(dados.preco)}</span>
                <span class="change ${changeClass}">${changeSignal} ${Math.abs(dados.variacao_24h).toFixed(1)}%</span>
            </div>
        `;
    }
}

function atualizarPrecoSidebar(moeda, preco, variacao) {
    const cryptoItems = document.querySelectorAll('.crypto-item');
    cryptoItems.forEach(item => {
        if (item.querySelector('.name').textContent === moeda) {
            item.querySelector('.price').textContent = formatarMoedaResumido(preco);
            const changeSpan = item.querySelector('.change');
            const changeClass = variacao >= 0 ? 'positive' : 'negative';
            const changeSignal = variacao >= 0 ? '▲' : '▼';
            
            changeSpan.className = `change ${changeClass}`;
            changeSpan.textContent = `${changeSignal} ${Math.abs(variacao).toFixed(1)}%`;
        }
    });
}

// ========== GRÁFICO ==========

function atualizarGrafico() {
    const canvas = document.getElementById('price-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (grafico) {
        grafico.destroy();
    }
    
    const labels = historicoPrecos.map(p => 
        p.timestamp.toLocaleTimeString()
    );
    
    const dados = historicoPrecos.map(p => p.preco);
    
    grafico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${moedaAtual}/BRL`,
                data: dados,
                borderColor: '#f7931a',
                backgroundColor: 'rgba(247, 147, 26, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
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
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function mudarGrafico() {
    const select = document.getElementById('chart-crypto');
    if (select) {
        moedaAtual = select.value;
        const tradeSelect = document.getElementById('trade-crypto');
        if (tradeSelect) tradeSelect.value = moedaAtual;
        historicoPrecos = [];
        carregarPrecos();
    }
}

// ========== SIMULAÇÃO ==========

function startStatusUpdates() {
    const interval = setInterval(() => {
        carregarStatus();
    }, 5000);
    intervalIds.push(interval);
}

async function carregarStatus() {
    try {
        const response = await fetch(`${API_URL}/simulacao/status?user_id=${userId}`);
        const data = await response.json();
        
        const capitalEl = document.getElementById('capital');
        if (capitalEl) capitalEl.textContent = formatarMoeda(data.capital);
        const totalTradesEl = document.getElementById('total-trades');
        if (totalTradesEl) totalTradesEl.textContent = data.total_trades;
        
        if (data.total_trades > 0) {
            const winRate = (data.trades_lucro / data.total_trades * 100).toFixed(1);
            document.getElementById('win-rate').textContent = winRate + '%';
        }
        
        // Atualiza informação de posição
        const emPosicao = document.getElementById('em-posicao');
        const btnComprar = document.getElementById('btn-comprar');
        const btnVender = document.getElementById('btn-vender');
        const positionInfo = document.getElementById('position-info');
        
        if (data.position) {
            if (emPosicao) emPosicao.textContent = 'Sim';
            if (btnComprar) btnComprar.disabled = true;
            if (btnVender) btnVender.disabled = false;
            
            // Calcula lucro atual
            const lucro = (precoAtual - data.position.preco) / data.position.preco * 100;
            const profitClass = lucro >= 0 ? 'profit' : 'loss';
            
            positionInfo.innerHTML = `
                <h4>Posição Atual</h4>
                <div class="info-row">
                    <span class="label">Moeda:</span>
                    <span class="value">${data.position.moeda}</span>
                </div>
                <div class="info-row">
                    <span class="label">Compra:</span>
                    <span class="value">${formatarMoeda(data.position.preco)}</span>
                </div>
                <div class="info-row">
                    <span class="label">Quantidade:</span>
                    <span class="value">${data.position.quantidade.toFixed(6)}</span>
                </div>
                <div class="info-row">
                    <span class="label">Valor:</span>
                    <span class="value">${formatarMoeda(data.position.valor)}</span>
                </div>
                <div class="info-row">
                    <span class="label">Lucro Atual:</span>
                    <span class="value ${profitClass}">${lucro.toFixed(2)}%</span>
                </div>
            `;
        } else {
            if (emPosicao) emPosicao.textContent = 'Não';
            if (btnComprar) btnComprar.disabled = false;
            if (btnVender) btnVender.disabled = true;
            positionInfo.innerHTML = '<p>Nenhuma posição aberta</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar status:', error);
    }
}

async function carregarHistorico() {
    try {
        const response = await fetch(`${API_URL}/simulacao/historico?user_id=${userId}`);
        const data = await response.json();
        
        const tbody = document.getElementById('trades-list');
        if (!tbody) return;
        
        if (data.trades.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Nenhum trade realizado</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        data.trades.slice().reverse().forEach(trade => {
            const lucroClass = trade.lucro_percent >= 0 ? 'profit-positive' : 'profit-negative';
            
            tbody.innerHTML += `
                <tr>
                    <td>${new Date(trade.timestamp).toLocaleString()}</td>
                    <td>${trade.compra.moeda}</td>
                    <td>${formatarMoeda(trade.compra.preco)}</td>
                    <td>${formatarMoeda(trade.venda_preco)}</td>
                    <td class="${lucroClass}">${trade.lucro_percent.toFixed(2)}%</td>
                    <td class="${lucroClass}">${formatarMoeda(trade.lucro_abs)}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
    }
}

async function comprar() {
    const moeda = document.getElementById('trade-crypto').value;
    const quantidade = parseFloat(document.getElementById('quantity').value);
    
    if (!quantidade || quantidade <= 0) {
        alert('Por favor, insira uma quantidade válida');
        return;
    }
    
    const valorTotal = quantidade * precoAtual;
    const capitalTexto = document.getElementById('capital').textContent;
    const capital = parseFloat(capitalTexto.replace('R$ ', '').replace(/\./g, '').replace(',', '.'));
    
    if (valorTotal > capital) {
        alert('Saldo insuficiente!');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/simulacao/comprar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                moeda: moeda,
                preco: precoAtual,
                quantidade: quantidade
            })
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            alert('✅ Compra simulada realizada com sucesso!');
            document.getElementById('quantity').value = '';
            calcularValorTotal();
            carregarStatus();
            carregarHistorico();
        } else if (data.erro) {
            alert('❌ ' + data.erro);
        }
    } catch (error) {
        console.error('Erro ao comprar:', error);
        alert('Erro ao realizar compra');
    }
}

async function vender() {
    if (!confirm('Tem certeza que deseja vender sua posição?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/simulacao/vender`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                preco: precoAtual
            })
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            const lucro = data.trade.lucro_percent;
            const mensagem = lucro >= 0 
                ? `✅ Venda realizada com lucro de ${lucro.toFixed(2)}%!`
                : `⚠️ Venda realizada com prejuízo de ${Math.abs(lucro).toFixed(2)}%`;
            
            alert(mensagem);
            carregarStatus();
            carregarHistorico();
        } else if (data.erro) {
            alert('❌ ' + data.erro);
        }
    } catch (error) {
        console.error('Erro ao vender:', error);
        alert('Erro ao realizar venda');
    }
}

async function resetSimulacao() {
    if (!confirm('Isso irá resetar toda sua simulação. Continuar?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/simulacao/reset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId
            })
        });
        
        const data = await response.json();
        
        if (data.sucesso) {
            alert('✅ Simulação resetada!');
            carregarStatus();
            carregarHistorico();
        }
    } catch (error) {
        console.error('Erro ao resetar:', error);
    }
}

// ========== ALERTAS ==========

function gerarAlertas(dados) {
    const alertasList = document.getElementById('alertas-list');
    if (!alertasList) return;
    
    const variacao = dados.variacao_24h || 0;
    
    let alertas = [];
    
    // Alerta de queda
    if (variacao <= -2) {
        alertas.push({
            tipo: 'compra',
            mensagem: `⚠️ Queda de ${Math.abs(variacao).toFixed(1)}%! Momento de COMPRA?`
        });
    }
    
    // Alerta de alta
    if (variacao >= 4) {
        alertas.push({
            tipo: 'venda',
            mensagem: `📈 Alta de ${variacao.toFixed(1)}%! Momento de VENDA?`
        });
    }
    
    // Alerta de volatilidade
    if (Math.abs(variacao) > 5) {
        alertas.push({
            tipo: 'info',
            mensagem: `⚡ Mercado volátil! Cuidado com os trades.`
        });
    }
    
    // Mostra alertas
    if (alertas.length > 0) {
        alertasList.innerHTML = alertas.map(alerta => `
            <div class="alerta-item alerta-${alerta.tipo}">
                ${alerta.mensagem}
            </div>
        `).join('');
    } else {
        alertasList.innerHTML = '<div class="alerta-item alerta-info">📊 Mercado estável</div>';
    }
}

// ========== UTILITÁRIOS ==========

function formatarMoeda(valor) {
    return 'R$ ' + valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatarMoedaResumido(valor) {
    if (valor >= 1000) {
        return 'R$ ' + (valor / 1000).toFixed(1) + 'k';
    }
    return 'R$ ' + valor.toFixed(0);
}

function calcularValorTotal() {
    const quantidade = parseFloat(document.getElementById('quantity').value) || 0;
    const total = quantidade * precoAtual;
    const totalEl = document.getElementById('total-value');
    if (totalEl) totalEl.value = formatarMoeda(total);
}

function mudarMoeda() {
    moedaAtual = document.getElementById('trade-crypto').value;
    const chartSelect = document.getElementById('chart-crypto');
    if (chartSelect) chartSelect.value = moedaAtual;
    historicoPrecos = [];
    carregarPrecos();
}

function selecionarMoeda(moeda) {
    moedaAtual = moeda;
    const tradeSelect = document.getElementById('trade-crypto');
    if (tradeSelect) tradeSelect.value = moeda;
    const chartSelect = document.getElementById('chart-crypto');
    if (chartSelect) chartSelect.value = moeda;
    historicoPrecos = [];
    carregarPrecos();
    
    // Atualiza classe ativa
    document.querySelectorAll('.crypto-item').forEach(item => {
        if (item.querySelector('.name').textContent === moeda) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Limpa intervals ao sair da página
window.addEventListener('beforeunload', function() {
    intervalIds.forEach(id => clearInterval(id));
});
