import json
import os
from datetime import datetime, timedelta

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    """Fornece dados completos para o dashboard"""
    
    # Carrega estado atual do bot
    carteira_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'carteira_default.json')
    
    if os.path.exists(carteira_path):
        with open(carteira_path, 'r') as f:
            carteira = json.load(f)
    else:
        # Dados iniciais se não existir carteira
        return jsonify({
            'saldo_brl': 1000.0,
            'patrimonio_total': 1000.0,
            'variacao_total': 0.0,
            'total_cripto': 0.0,
            'total_trades': 0,
            'win_rate': 0,
            'posicoes': [],
            'ultimas_operacoes': [],
            'historico_patrimonio': [
                {'timestamp': (datetime.now() - timedelta(minutes=30)).isoformat(), 'valor': 1000},
                {'timestamp': (datetime.now() - timedelta(minutes=25)).isoformat(), 'valor': 1002},
                {'timestamp': (datetime.now() - timedelta(minutes=20)).isoformat(), 'valor': 998},
                {'timestamp': (datetime.now() - timedelta(minutes=15)).isoformat(), 'valor': 1005},
                {'timestamp': (datetime.now() - timedelta(minutes=10)).isoformat(), 'valor': 1010},
                {'timestamp': (datetime.now() - timedelta(minutes=5)).isoformat(), 'valor': 1008},
                {'timestamp': datetime.now().isoformat(), 'valor': 1012}
            ],
            'distribuicao': []
        })
    
    # Calcula patrimônio total atual
    patrimonio_atual = carteira['historico_patrimonio'][-1]['valor'] if carteira['historico_patrimonio'] else 1000.0
    patrimonio_inicial = 1000.0
    variacao_total = ((patrimonio_atual / patrimonio_inicial) - 1) * 100
    
    # Calcula total em cripto
    total_cripto = patrimonio_atual - carteira['saldo_brl']
    
    # Calcula win rate (últimas 20 operações)
    win_rate = 0
    operacoes_recentes = carteira['historico'][-20:] if len(carteira['historico']) > 0 else []
    
    if len(operacoes_recentes) > 0:
        # Simplificação: considera vendas com lucro se preço de venda > preço médio
        # Idealmente você teria um cálculo mais sofisticado
        operacoes_com_lucro = 0
        for op in operacoes_recentes:
            if op['tipo'] == 'VENDA':
                # Precisa de lógica melhor para calcular lucro real
                operacoes_com_lucro += 1  # Simplificado
        win_rate = round((operacoes_com_lucro / len(operacoes_recentes)) * 100) if operacoes_recentes else 0
    
    # Prepara posições atuais com preços
    posicoes = []
    for simbolo, quantidade in carteira['moedas'].items():
        # Busca preço atual (idealmente do cache do bot)
        preco_atual = 50000  # Placeholder - idealmente viria do bot
        preco_medio = 48000  # Placeholder - calcular do histórico
        valor_atual = quantidade * preco_atual
        
        posicoes.append({
            'simbolo': simbolo,
            'quantidade': quantidade,
            'preco_medio': preco_medio,
            'preco_atual': preco_atual,
            'valor_atual': valor_atual
        })
    
    # Prepara distribuição de ativos
    distribuicao = []
    for pos in posicoes:
        percentual = (pos['valor_atual'] / patrimonio_atual) * 100 if patrimonio_atual > 0 else 0
        distribuicao.append({
            'simbolo': pos['simbolo'],
            'percentual': round(percentual, 1)
        })
    
    # Adiciona saldo em BRL na distribuição
    if carteira['saldo_brl'] > 0:
        percentual_brl = (carteira['saldo_brl'] / patrimonio_atual) * 100
        distribuicao.append({
            'simbolo': 'BRL',
            'percentual': round(percentual_brl, 1)
        })
    
    return jsonify({
        'saldo_brl': round(carteira['saldo_brl'], 2),
        'patrimonio_total': round(patrimonio_atual, 2),
        'variacao_total': round(variacao_total, 2),
        'total_cripto': round(total_cripto, 2),
        'total_trades': len(carteira['historico']),
        'win_rate': win_rate,
        'posicoes': posicoes,
        'ultimas_operacoes': carteira['historico'][-10:],
        'historico_patrimonio': carteira['historico_patrimonio'][-20:],
        'distribuicao': distribuicao
    })

@app.route('/api/status', methods=['GET'])
def get_status():
    """Verifica se o bot está online"""
    return jsonify({
        'status': 'online',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/dashboard/index.html')
def serve_dashboard():
    return send_from_directory(os.path.join(os.path.dirname(__file__), '..', 'dashboard'), 'index.html')

@app.route('/frontend/index.html')
def serve_frontend():
    return send_from_directory(os.path.join(os.path.dirname(__file__), '..', 'frontend'), 'index.html')

@app.route('/dashboard/<path:filename>')
def serve_dashboard_files(filename):
    return send_from_directory(os.path.join(os.path.dirname(__file__), '..', 'dashboard'), filename)

@app.route('/frontend/<path:filename>')
def serve_frontend_files(filename):
    return send_from_directory(os.path.join(os.path.dirname(__file__), '..', 'frontend'), filename)

if __name__ == '__main__':
    app.run(debug=True, port=5001)