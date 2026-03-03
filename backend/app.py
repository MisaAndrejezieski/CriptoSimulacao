import atexit
import time

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from flask import Flask, jsonify, request
from flask_cors import CORS
from mercado import ColetorMercado
from simulador import SimuladorCripto

app = Flask(__name__)
CORS(app)

# Inicializa componentes
coletor = ColetorMercado()
simulador = SimuladorCripto()

# Lista de moedas para monitorar
MOEDAS = ['BTC', 'ETH', 'BNB', 'ADA', 'DOT', 'LINK']

# Busca preços iniciais
with app.app_context():
    coletor.get_multiplos_precos(MOEDAS)

# Configura o scheduler corretamente
scheduler = BackgroundScheduler()

# Configura o job com max_instances=1 e coalesce=True
scheduler.add_job(
    func=lambda: coletor.get_multiplos_precos(MOEDAS),
    trigger=IntervalTrigger(seconds=10),
    id='atualizar_precos',
    name='Atualizar preços das criptomoedas',
    replace_existing=True,
    max_instances=1,  # Permite apenas uma instância por vez
    coalesce=True     # Se acumular execuções, roda apenas a última
)

scheduler.start()
atexit.register(lambda: scheduler.shutdown())

# Pequena pausa para o scheduler iniciar
time.sleep(1)

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
    