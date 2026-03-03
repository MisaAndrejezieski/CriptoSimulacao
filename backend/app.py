import atexit

from apscheduler.schedulers.background import BackgroundScheduler
from flask import Flask, jsonify, request
from flask_cors import CORS
# use relative imports so that the backend package can be imported cleanly
from mercado import ColetorMercado
from simulador import SimuladorCripto

app = Flask(__name__)
CORS(app)  # Permite requisições do front-end

# Inicializa componentes
coletor = ColetorMercado()
simulador = SimuladorCripto()

# Lista de moedas para monitorar
MOEDAS = ['BTC', 'ETH', 'BNB', 'ADA', 'DOT', 'LINK']

# Atualiza preços a cada 10 segundos em background
scheduler = BackgroundScheduler()
scheduler.add_job(
    func=lambda: coletor.get_multiplos_precos(MOEDAS),
    trigger="interval",
    seconds=10
)
scheduler.start()
atexit.register(lambda: scheduler.shutdown())

@app.route('/api/precos', methods=['GET'])
def get_precos():
    """Endpoint para obter preços atuais"""
    precos = coletor.get_multiplos_precos(MOEDAS)
    return jsonify({
        'precos': precos,
        'timestamp': coletor.ultima_atualizacao.isoformat() if coletor.ultima_atualizacao else None
    })

@app.route('/api/carteira', methods=['GET'])
def get_carteira():
    """Endpoint para obter estado da carteira"""
    precos = coletor.precos_cache
    patrimonio = simulador.get_patrimonio_total(precos)
    
    # Enriquece posições com preços atuais
    posicoes = []
    for simbolo, quantidade in simulador.carteira['moedas'].items():
        if simbolo in precos:
            preco_atual = precos[simbolo]['preco']
            valor_atual = quantidade * preco_atual
            posicoes.append({
                'simbolo': simbolo,
                'quantidade': quantidade,
                'preco_atual': preco_atual,
                'valor_atual': valor_atual,
                'variacao': precos[simbolo].get('variacao_24h', 0)
            })
    
    return jsonify({
        'saldo_brl': simulador.carteira['saldo_brl'],
        'posicoes': posicoes,
        'patrimonio': patrimonio,
        'historico': simulador.carteira['historico'][-10:]  # Últimas 10 operações
    })

@app.route('/api/comprar', methods=['POST'])
def comprar():
    """Endpoint para executar compra"""
    data = request.json
    simbolo = data.get('simbolo')
    quantidade = float(data.get('quantidade', 0))
    
    if simbolo not in coletor.precos_cache:
        return jsonify({'sucesso': False, 'mensagem': 'Moeda não encontrada'})
    
    preco_atual = coletor.precos_cache[simbolo]['preco']
    resultado = simulador.comprar(simbolo, quantidade, preco_atual)
    
    return jsonify(resultado)

@app.route('/api/vender', methods=['POST'])
def vender():
    """Endpoint para executar venda"""
    data = request.json
    simbolo = data.get('simbolo')
    quantidade = float(data.get('quantidade', 0))
    
    if simbolo not in coletor.precos_cache:
        return jsonify({'sucesso': False, 'mensagem': 'Moeda não encontrada'})
    
    preco_atual = coletor.precos_cache[simbolo]['preco']
    resultado = simulador.vender(simbolo, quantidade, preco_atual)
    
    return jsonify(resultado)

@app.route('/api/reset', methods=['POST'])
def reset_carteira():
    """Reseta a carteira para R$ 1000 iniciais"""
    global simulador
    simulador = SimuladorCripto()
    return jsonify({'sucesso': True, 'mensagem': 'Carteira resetada'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
