import time
from collections import deque

import numpy as np


class EstrategiaTrading:
    def __init__(self):
        self. historico_precos = {
            'BTC': deque(maxlen=50),
            'ETH': deque(maxlen=50),
            'BNB': deque(maxlen=50)
        }
        self.ultima_decisao = {}
        
    def analisar_mercado(self, simbolo, preco_atual):
        """Analisa o mercado e decide se compra ou vende"""
        
        # Adiciona preço ao histórico
        self.historico_precos[simbolo].append(preco_atual)
        
        # Precisa de no mínimo 20 dados para análise
        if len(self.historico_precos[simbolo]) < 20:
            return 'MANTER'
        
        # Calcula indicadores
        precos = list(self.historico_precos[simbolo])
        
        # Média móvel rápida (5 períodos)
        media_rapida = np.mean(precos[-5:])
        
        # Média móvel lenta (20 períodos)
        media_lenta = np.mean(precos)
        
        # RSI simplificado
        variacoes = np.diff(precos)
        ganhos = np.mean([v for v in variacoes if v > 0]) if any(v > 0 for v in variacoes) else 0
        perdas = abs(np.mean([v for v in variacoes if v < 0])) if any(v < 0 for v in variacoes) else 0
        
        if perdas == 0:
            rsi = 100
        else:
            rsi = 100 - (100 / (1 + (ganhos / perdas)))
        
        # Lógica de decisão
        # COMPRA: média rápida cruza acima da lenta E RSI < 70
        if media_rapida > media_lenta * 1.01 and rsi < 70:
            return 'COMPRAR'
        
        # VENDA: média rápida cruza abaixo da lenta OU RSI > 80
        elif media_rapida < media_lenta * 0.99 or rsi > 80:
            return 'VENDER'
        
        return 'MANTER'
    
    def calcular_quantidade(self, simbolo, preco, saldo_disponivel, posicao_atual, decisao):
        """Calcula quanto comprar/vender baseado na estratégia"""
        
        if decisao == 'COMPRAR':
            # Compra 20% do saldo disponível
            valor_compra = saldo_disponivel * 0.2
            quantidade = valor_compra / preco
            return round(quantidade, 6)
        
        elif decisao == 'VENDER' and posicao_atual > 0:
            # Vende 30% da posição atual
            quantidade = posicao_atual * 0.3
            return round(quantidade, 6)
        
        return 0
