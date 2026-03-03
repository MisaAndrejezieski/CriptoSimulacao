import time
from datetime import datetime

import requests


class ColetorMercado:
    def __init__(self):
        self.base_url = "https://api.binance.com/api/v3"
        self.precos_cache = {}
        self.ultima_atualizacao = None
        
    def get_preco_atual(self, simbolo):
        """Obtém preço atual de uma criptomoeda"""
        try:
            response = requests.get(
                f"{self.base_url}/ticker/price",
                params={"symbol": f"{simbolo}USDT"}
            )
            data = response.json()
            return {
                'simbolo': simbolo,
                'preco': float(data['price']),
                'variacao_24h': self.get_variacao_24h(simbolo),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Erro ao buscar {simbolo}: {e}")
            return None
    
    def get_variacao_24h(self, simbolo):
        """Obtém variação percentual nas últimas 24h"""
        try:
            response = requests.get(
                f"{self.base_url}/ticker/24hr",
                params={"symbol": f"{simbolo}USDT"}
            )
            data = response.json()
            return float(data['priceChangePercent'])
        except:
            return 0.0
    
    def get_multiplos_precos(self, simbolos):
        """Busca preços de várias moedas de uma vez"""
        precos = {}
        for simbolo in simbolos:
            preco_data = self.get_preco_atual(simbolo)
            if preco_data:
                precos[simbolo] = preco_data
        self.precos_cache = precos
        self.ultima_atualizacao = datetime.now()
        return precos
