"""
API do Cripto Simulação - Preços em Tempo Real
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import time
from datetime import datetime, date
import random
from config import Config

app = Flask(__name__)
CORS(app)  # Permite requisições do frontend
config = Config()

# Dados da simulação (em memória)
simulacao = {
    'capital': 10000,
    'capital_inicial': 10000,
    'position': None,
    'trades': [],
    'historico_precos': {},
    'usuarios': {}
}

def get_preco_foxbit(symbol='BTCBRL'):
    """Busca preço na Foxbit"""
    try:
        url = f"{config.FOXBIT_URL}/ticker"
        params = {'market_symbol': symbol}
        
        response = requests.get(url, params=params, timeout=5)
        
        if response.status_code == 200:
            dados = response.json()
            if 'data' in dados and len(dados['data']) > 0:
                return {
                    'preco': float(dados['data'][0]['last']),
                    'volume': float(dados['data'][0]['volume']),
                    'fonte': 'Foxbit'
                }
    except:
        pass
    return None

def get_preco_coingecko(coin_id='bitcoin'):
    """Busca preço na CoinGecko"""
    try:
        url = f"{config.COINGECKO_URL}/simple/price"
        params = {
            'ids': coin_id,
            'vs_currencies': 'brl',
            'include_24hr_change': 'true',
            'include_last_updated_at': 'true'
        }
        
        response = requests.get(url, params=params, timeout=5)
        
        if response.status_code == 200:
            dados = response.json()
            if coin_id in dados:
                return {
                    'preco': float(dados[coin_id]['brl']),
                    'variacao_24h': float(dados[coin_id]['brl_24h_change']),
                    'fonte': 'CoinGecko'
                }
    except:
        pass
    return None

def get_preco_binance(symbol='BTCBRL'):
    """Busca preço na Binance"""
    try:
        # Converte BTCBRL para BTCUSDT e depois converte
        if symbol == 'BTCBRL':
            url = f"{config.BINANCE_URL}/ticker/price?symbol=BTCUSDT"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                dados = response.json()
                preco_usdt = float(dados['price'])
                
                # Busca cotação USD/BRL
                url_brl = "https://economia.awesomeapi.com.br/last/USD-BRL"
                response_brl = requests.get(url_brl, timeout=5)
                dados_brl = response_brl.json()
                cotacao_dolar = float(dados_brl['USDBRL']['bid'])
                
                return {
                    'preco': preco_usdt * cotacao_dolar,
                    'fonte': 'Binance'
                }
    except:
        pass
    return None

@app.route('/api/precos', methods=['GET'])
def get_precos():
    """Endpoint principal - Retorna preços de todas as criptos"""
    moeda = request.args.get('moeda', 'BTC')
    precos = {}
    
    # Mapeia símbolo para ID da CoinGecko
    coin_id = config.CRYPTO_SYMBOLS.get(moeda, 'bitcoin')
    
    # Tenta Foxbit primeiro (apenas para BTC)
    if moeda == 'BTC':
        dados = get_preco_foxbit('BTCBRL')
        if dados:
            precos[moeda] = dados
        else:
            dados = get_preco_binance('BTCBRL')
            if dados:
                precos[moeda] = dados
            else:
                dados = get_preco_coingecko(coin_id)
                if dados:
                    precos[moeda] = dados
    else:
        # Para outras moedas, usa CoinGecko
        dados = get_preco_coingecko(coin_id)
        if dados:
            precos[moeda] = dados
    
    # Se não conseguir preço real, gera simulado
    if moeda not in precos:
        precos[moeda] = {
            'preco': random.uniform(100, 50000) if moeda == 'BTC' else random.uniform(1, 3000),
            'variacao_24h': random.uniform(-5, 5),
            'fonte': 'Simulação',
            'simulado': True
        }
    
    return jsonify({
        'timestamp': datetime.now().isoformat(),
        'moeda': moeda,
        'dados': precos[moeda]
    })

@app.route('/api/precos/todas', methods=['GET'])
def get_todas_precos():
    """Retorna preços de todas as criptomoedas"""
    resultados = {}
    
    for simbolo, coin_id in config.CRYPTO_SYMBOLS.items():
        if simbolo == 'BTC':
            dados = get_preco_foxbit('BTCBRL')
            if not dados:
                dados = get_preco_coingecko(coin_id)
        else:
            dados = get_preco_coingecko(coin_id)
        
        if dados:
            resultados[simbolo] = dados
        else:
            # Fallback para simulação
            resultados[simbolo] = {
                'preco': random.uniform(1, 50000),
                'variacao_24h': random.uniform(-5, 5),
                'fonte': 'Simulação',
                'simulado': True
            }
    
    return jsonify({
        'timestamp': datetime.now().isoformat(),
        'precos': resultados
    })

@app.route('/api/simulacao/status', methods=['GET'])
def get_simulacao_status():
    """Retorna status atual da simulação"""
    user_id = request.args.get('user_id', 'default')
    
    if user_id not in simulacao['usuarios']:
        # Cria novo usuário
        simulacao['usuarios'][user_id] = {
            'capital': 10000,
            'capital_inicial': 10000,
            'position': None,
            'trades': []
        }
    
    usuario = simulacao['usuarios'][user_id]
    
    return jsonify({
        'capital': usuario['capital'],
        'capital_inicial': usuario['capital_inicial'],
        'position': usuario['position'],
        'total_trades': len(usuario['trades']),
        'trades_lucro': len([t for t in usuario['trades'] if t.get('lucro_percent', 0) > 0])
    })

@app.route('/api/simulacao/comprar', methods=['POST'])
def simular_compra():
    """Simula uma compra"""
    data = request.json
    user_id = data.get('user_id', 'default')
    moeda = data.get('moeda', 'BTC')
    preco = data.get('preco')
    quantidade = data.get('quantidade')
    
    if user_id not in simulacao['usuarios']:
        simulacao['usuarios'][user_id] = {
            'capital': 10000,
            'capital_inicial': 10000,
            'position': None,
            'trades': []
        }
    
    usuario = simulacao['usuarios'][user_id]
    
    # Calcula valor da compra
    valor_compra = quantidade * preco
    
    if valor_compra > usuario['capital']:
        return jsonify({'erro': 'Saldo insuficiente'}), 400
    
    if usuario['position']:
        return jsonify({'erro': 'Já existe posição aberta'}), 400
    
    # Executa compra
    usuario['position'] = {
        'moeda': moeda,
        'preco': preco,
        'quantidade': quantidade,
        'valor': valor_compra,
        'timestamp': datetime.now().isoformat()
    }
    
    usuario['capital'] -= valor_compra
    
    return jsonify({
        'sucesso': True,
        'position': usuario['position'],
        'capital': usuario['capital']
    })

@app.route('/api/simulacao/vender', methods=['POST'])
def simular_venda():
    """Simula uma venda"""
    data = request.json
    user_id = data.get('user_id', 'default')
    preco_atual = data.get('preco')
    
    if user_id not in simulacao['usuarios']:
        return jsonify({'erro': 'Usuário não encontrado'}), 404
    
    usuario = simulacao['usuarios'][user_id]
    
    if not usuario['position']:
        return jsonify({'erro': 'Nenhuma posição aberta'}), 400
    
    # Calcula resultado
    position = usuario['position']
    valor_venda = position['quantidade'] * preco_atual
    lucro_abs = valor_venda - position['valor']
    lucro_percent = (lucro_abs / position['valor']) * 100
    
    # Registra trade
    trade = {
        'compra': position,
        'venda_preco': preco_atual,
        'lucro_abs': lucro_abs,
        'lucro_percent': lucro_percent,
        'timestamp': datetime.now().isoformat()
    }
    
    usuario['trades'].append(trade)
    usuario['capital'] = valor_venda
    usuario['position'] = None
    
    return jsonify({
        'sucesso': True,
        'trade': trade,
        'capital': usuario['capital']
    })

@app.route('/api/simulacao/historico', methods=['GET'])
def get_historico():
    """Retorna histórico de trades"""
    user_id = request.args.get('user_id', 'default')
    
    if user_id not in simulacao['usuarios']:
        return jsonify({'trades': []})
    
    return jsonify({
        'trades': simulacao['usuarios'][user_id]['trades']
    })

@app.route('/api/simulacao/reset', methods=['POST'])
def reset_simulacao():
    """Reseta a simulação"""
    user_id = request.json.get('user_id', 'default')
    
    simulacao['usuarios'][user_id] = {
        'capital': 10000,
        'capital_inicial': 10000,
        'position': None,
        'trades': []
    }
    
    return jsonify({'sucesso': True})

if __name__ == '__main__':
    print("="*60)
    print("🚀 CRIPTO SIMULAÇÃO - BACKEND")
    print("="*60)
    print("📡 API rodando em: http://localhost:5000")
    print("📊 Endpoints disponíveis:")
    print("   • GET  /api/precos?moeda=BTC")
    print("   • GET  /api/precos/todas")
    print("   • GET  /api/simulacao/status")
    print("   • POST /api/simulacao/comprar")
    print("   • POST /api/simulacao/vender")
    print("   • GET  /api/simulacao/historico")
    print("   • POST /api/simulacao/reset")
    print("="*60)
    
    app.run(debug=True, port=5000)
