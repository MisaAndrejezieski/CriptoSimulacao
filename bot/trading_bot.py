import json
import os
import time
from datetime import datetime

import requests
from estrategia import EstrategiaTrading
from mercado import ColetorMercado


class TradingBot:
    def __init__(self):
        self.coletor = ColetorMercado()
        self.estrategia = EstrategiaTrading()
        self.moedas = ['BTC', 'ETH', 'BNB']
        self.carteira = self.carregar_carteira()
        self.saldo_inicial = 1000.0
        
    def carregar_carteira(self):
        """Carrega ou cria carteira"""
        if os.path.exists('carteira.json'):
            with open('carteira.json', 'r') as f:
                return json.load(f)
        else:
            return {
                'saldo_brl': 1000.0,
                'moedas': {},
                'historico': [],
                'historico_patrimonio': []
            }
    
    def salvar_carteira(self):
        """Salva estado da carteira"""
        with open('carteira.json', 'w') as f:
            json.dump(self.carteira, f, indent=2)
    
    def executar_ordem(self, tipo, simbolo, quantidade, preco):
        """Executa uma ordem de compra ou venda"""
        
        if tipo == 'COMPRA':
            custo = quantidade * preco
            if custo <= self.carteira['saldo_brl']:
                self.carteira['saldo_brl'] -= custo
                
                if simbolo in self.carteira['moedas']:
                    self.carteira['moedas'][simbolo] += quantidade
                else:
                    self.carteira['moedas'][simbolo] = quantidade
                
                print(f"🤖 COMPROU {quantidade:.6f} {simbolo} a ${preco:.2f}")
                return True
                
        elif tipo == 'VENDA' and simbolo in self.carteira['moedas']:
            if quantidade <= self.carteira['moedas'][simbolo]:
                valor_venda = quantidade * preco
                self.carteira['saldo_brl'] += valor_venda
                self.carteira['moedas'][simbolo] -= quantidade
                
                if self.carteira['moedas'][simbolo] == 0:
                    del self.carteira['moedas'][simbolo]
                
                print(f"🤖 VENDEU {quantidade:.6f} {simbolo} a ${preco:.2f}")
                return True
        
        return False
    
    def calcular_patrimonio(self, precos):
        """Calcula patrimônio total"""
        total_cripto = 0
        for simbolo, quantidade in self.carteira['moedas'].items():
            if simbolo in precos:
                total_cripto += quantidade * precos[simbolo]['preco']
        
        return self.carteira['saldo_brl'] + total_cripto
    
    def executar_ciclo(self):
        """Executa um ciclo completo de trading"""
        
        print(f"\n🔄 Ciclo de Trading - {datetime.now().strftime('%H:%M:%S')}")
        
        # Atualiza preços
        precos = self.coletor.get_multiplos_precos(self.moedas)
        
        # Analisa cada moeda
        for simbolo in self.moedas:
            if simbolo not in precos:
                continue
                
            preco_atual = precos[simbolo]['preco']
            
            # Decide o que fazer
            decisao = self.estrategia.analisar_mercado(simbolo, preco_atual)
            
            if decisao != 'MANTER':
                posicao_atual = self.carteira['moedas'].get(simbolo, 0)
                
                quantidade = self.estrategia.calcular_quantidade(
                    simbolo, 
                    preco_atual,
                    self.carteira['saldo_brl'],
                    posicao_atual,
                    decisao
                )
                
                if quantidade > 0:
                    # Executa a ordem
                    sucesso = self.executar_ordem(
                        decisao, 
                        simbolo, 
                        quantidade, 
                        preco_atual
                    )
                    
                    if sucesso:
                        # Registra no histórico
                        self.carteira['historico'].append({
                            'tipo': decisao,
                            'simbolo': simbolo,
                            'quantidade': quantidade,
                            'preco': preco_atual,
                            'total': quantidade * preco_atual,
                            'timestamp': datetime.now().isoformat()
                        })
        
        # Calcula e registra patrimônio
        patrimonio = self.calcular_patrimonio(precos)
        self.carteira['historico_patrimonio'].append({
            'timestamp': datetime.now().isoformat(),
            'valor': patrimonio
        })
        
        # Mantém apenas últimos 100 registros
        if len(self.carteira['historico_patrimonio']) > 100:
            self.carteira['historico_patrimonio'] = self.carteira['historico_patrimonio'][-100:]
        
        # Salva estado
        self.salvar_carteira()
        
        # Mostra resumo
        self.mostrar_resumo(patrimonio)
    
    def mostrar_resumo(self, patrimonio):
        """Mostra resumo do estado atual"""
        variacao = ((patrimonio / self.saldo_inicial) - 1) * 100
        
        print("\n📊 RESUMO DA CARTEIRA")
        print(f"💰 Saldo BRL: R$ {self.carteira['saldo_brl']:.2f}")
        print(f"📈 Patrimônio: R$ {patrimonio:.2f}")
        print(f"📉 Variação: {variacao:+.2f}%")
        
        if self.carteira['moedas']:
            print("\n🪙 Posições:")
            for simbolo, qtd in self.carteira['moedas'].items():
                print(f"   {simbolo}: {qtd:.6f}")
    
    def iniciar(self):
        """Inicia o bot em loop infinito"""
        print("="*50)
        print("🤖 CRYPTO TRADING BOT INICIADO")
        print(f"💵 Saldo Inicial: R$ {self.saldo_inicial:.2f}")
        print(f"🔄 Monitorando: {', '.join(self.moedas)}")
        print("="*50)
        
        try:
            while True:
                self.executar_ciclo()
                time.sleep(30)  # Executa a cada 30 segundos
        except KeyboardInterrupt:
            print("\n👋 Bot encerrado pelo usuário")
            self.salvar_carteira()

if __name__ == "__main__":
    bot = TradingBot()
    bot.iniciar()
