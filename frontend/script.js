// Configuração
const API_URL = 'http://localhost:5000/api'; // Mude para URL do seu backend quando hospedar

// Estado da aplicação
let precosAtuais = {};
let carteiraAtual = {};

// Atualiza a cada 5 segundos
setInterval(carregarDados, 5000);

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    configurarEventos();
});

function configurarEventos() {
    document.getElementById('btn-comprar').addEventListener('click', () => executarOperacao('COMPRA'));
    document.getElementById('btn-vender').addEventListener('click', () => executarOperacao('VENDA'));
    document.getElementById('btn-reset').addEventListener('click', resetCarteira);
}

async function carregarDados() {
    try {
        // Carrega preços
        const responsePrecos = await fetch(`${API_URL}/precos`);
        const dadosPrecos = await responsePrecos.json();
        precosAtuais = dadosPrecos.precos;
        
        // Carrega carteira
        const responseCarteira = await fetch(`${API_URL}/carteira`);
        carteiraAtual = await responseCarteira.json();
        
        // Atualiza interface
        atualizarTabelaPrecos();
        atualizarCarteira();
        atualizarHistorico();
        atualizarSelectMoedas();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

function atualizarTabelaPrecos() {
    const tabela = document.getElementById('tabela-precos');
    let html = `
        <table>
            <tr>
                <th>Moeda</th>
                <th>Preço (USDT)</th>
                <th>Preço (BRL)</th>
                <th>Variação 24h</th>
            </tr>
    `;
    
    for (const [simbolo, dados] of Object.entries(precosAtuais)) {
        const variacaoClass = dados.variacao_24h >= 0 ? 'positiva' : 'negativa';
        const precoBrl = dados.preco * 5; // Taxa USD/BRL aproximada
        
        html += `
            <tr>
                <td><strong>${simbolo}</strong></td>
                <td>$${dados.preco.toFixed(2)}</td>
                <td>R$${precoBrl.toFixed(2)}</td>
                <td class="${variacaoClass}">${dados.variacao_24h.toFixed(2)}%</td>
            </tr>
        `;
    }
    
    html += '</table>';
    tabela.innerHTML = html;
}

function atualizarCarteira() {
    document.getElementById('saldo-brl').textContent = carteiraAtual.saldo_brl.toFixed(2);
    document.getElementById('patrimonio-total').textContent = carteiraAtual.patrimonio.patrimonio_total.toFixed(2);
    
    const posicoesDiv = document.getElementById('posicoes');
    if (carteiraAtual.posicoes.length === 0) {
        posicoesDiv.innerHTML = '<p class="vazio">Nenhuma posição aberta</p>';
        return;
    }
    
    let html = '<div class="grid-posicoes">';
    carteiraAtual.posicoes.forEach(pos => {
        const variacaoClass = pos.variacao >= 0 ? 'positiva' : 'negativa';
        html += `
            <div class="card-posicao">
                <h3>${pos.simbolo}</h3>
                <p>Quantidade: ${pos.quantidade.toFixed(6)}</p>
                <p>Preço: $${pos.preco_atual.toFixed(2)}</p>
                <p>Valor: R$${pos.valor_atual.toFixed(2)}</p>
                <p class="${variacaoClass}">Variação: ${pos.variacao.toFixed(2)}%</p>
            </div>
        `;
    });
    html += '</div>';
    posicoesDiv.innerHTML = html;
}

function atualizarHistorico() {
    const historicoDiv = document.getElementById('historico-lista');
    if (!carteiraAtual.historico || carteiraAtual.historico.length === 0) {
        historicoDiv.innerHTML = '<p class="vazio">Nenhuma operação realizada</p>';
        return;
    }
    
    let html = '<ul class="lista-historico">';
    carteiraAtual.historico.slice().reverse().forEach(op => {
        const tipoClass = op.tipo === 'COMPRA' ? 'compra' : 'venda';
        const data = new Date(op.timestamp).toLocaleString('pt-BR');
        html += `
            <li class="${tipoClass}">
                <span>${op.tipo}</span>
                <span>${op.quantidade.toFixed(6)} ${op.simbolo}</span>
                <span>@ $${op.preco.toFixed(2)}</span>
                <span>Total: R$${op.total.toFixed(2)}</span>
                <span class="data">${data}</span>
            </li>
        `;
    });
    html += '</ul>';
    historicoDiv.innerHTML = html;
}

function atualizarSelectMoedas() {
    const select = document.getElementById('select-moeda');
    const options = Object.keys(precosAtuais).map(simbolo => 
        `<option value="${simbolo}">${simbolo} - $${precosAtuais[simbolo].preco.toFixed(2)}</option>`
    ).join('');
    select.innerHTML = `<option value="">Selecione uma moeda</option>${options}`;
}

async function executarOperacao(tipo) {
    const simbolo = document.getElementById('select-moeda').value;
    const quantidade = document.getElementById('quantidade').value;
    
    if (!simbolo || !quantidade) {
        alert('Selecione uma moeda e insira a quantidade');
        return;
    }
    
    const endpoint = tipo === 'COMPRA' ? 'comprar' : 'vender';
    
    try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ simbolo, quantidade: parseFloat(quantidade) })
        });
        
        const resultado = await response.json();
        
        if (resultado.sucesso) {
            alert('Operação realizada com sucesso!');
            document.getElementById('quantidade').value = '';
            carregarDados(); // Atualiza dados
        } else {
            alert(`Erro: ${resultado.mensagem}`);
        }
    } catch (error) {
        alert('Erro ao executar operação');
    }
}

async function resetCarteira() {
    if (confirm('Tem certeza? Todo seu progresso será perdido.')) {
        try {
            await fetch(`${API_URL}/reset`, { method: 'POST' });
            carregarDados();
        } catch (error) {
            alert('Erro ao resetar carteira');
        }
    }
}