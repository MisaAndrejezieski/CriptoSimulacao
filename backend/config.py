"""
Configurações do Cripto Simulação
"""

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # APIs de preço
    FOXBIT_URL = "https://api.foxbit.com.br/rest/v3"
    COINGECKO_URL = "https://api.coingecko.com/api/v3"
    BINANCE_URL = "https://api.binance.com/api/v3"
    
    # Criptomoedas disponíveis
    CRYPTO_SYMBOLS = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'SOL': 'solana',
        'ADA': 'cardano',
        'DOGE': 'dogecoin'
    }
    
    # Configurações do bot
    UPDATE_INTERVAL = 10  # segundos
    SIMULATION_MODE = True
    
    # Chaves (opcional para modo real)
    FOXBIT_API_KEY = os.getenv('FOXBIT_API_KEY', '')
    FOXBIT_API_SECRET = os.getenv('FOXBIT_API_SECRET', '')
