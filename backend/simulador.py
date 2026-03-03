import json
import os
from datetime import datetime


class SimuladorCripto:
    def __init__(self, usuario_id="default"):
        self.usuario_id = usuario_id
        self.saldo_inicial = 1000.0  # R$ 1000 fictícios
        self.carteira = self.carregar_carteira()
        
    def carregar_carteira(self):
        """Carrega ou cria carteira do usuário"""
        arquivo = f"carteira_{self.usuario_id}.json"
        if os.path.exists(arquivo):
            with open(arquivo, 'r') as f:
                return json.load(f)
        else:
            return {
                'saldo_brl': self.saldo_inicial,
                'moedas': {},  # {'BTC': 0.001, 'ETH': 0.5}
                'historico': []
            }
    
    def salvar_carteira(self):
        """Salva estado da carteira"""
        arquivo = f"carteira_{self.usuario_id}.json"
        with open(arquivo, 'w') as f:
            json.dump(self.carteira, f, indent=2)
    
    def comprar(self, simbolo, quantidade, preco):
        """Executa uma compra simulada"""
        custo_total = quantidade * preco
        
        if custo_total > self.carteira['saldo_brl']:
            return {'sucesso': False, 'mensagem': 'Saldo insuficiente'}
        
        # Atualiza saldo
        self.carteira['saldo_brl'] -= custo_total
        
        # Atualiza posição da moeda
        if simbolo in self.carteira['moedas']:
            self.carteira['moedas'][simbolo] += quantidade
        else:
            self.carteira['moedas'][simbolo] = quantidade
        
        # Registra no histórico
        self.carteira['historico'].append({
            'tipo': 'COMPRA',
            'simbolo': simbolo,
            'quantidade': quantidade,
            'preco': preco,
            'total': custo_total,
            'timestamp': datetime.now().isoformat()
        })
        
        self.salvar_carteira()
        return {
            'sucesso': True,
            'saldo_restante': self.carteira['saldo_brl'],
            'posicao': self.carteira['moedas'].get(simbolo, 0)
        }
    
    def vender(self, simbolo, quantidade, preco):
        """Executa uma venda simulada"""
        if simbolo not in self.carteira['moedas']:
            return {'sucesso': False, 'mensagem': 'Você não possui esta moeda'}
        
        if quantidade > self.carteira['moedas'][simbolo]:
            return {'sucesso': False, 'mensagem': 'Quantidade insuficiente'}
        
        valor_venda = quantidade * preco
        
        # Atualiza saldo
        self.carteira['saldo_brl'] += valor_venda
        
        # Atualiza posição da moeda
        self.carteira['moedas'][simbolo] -= quantidade
        if self.carteira['moedas'][simbolo] == 0:
            del self.carteira['moedas'][simbolo]
        
        # Registra no histórico
        self.carteira['historico'].append({
            'tipo': 'VENDA',
            'simbolo': simbolo,
            'quantidade': quantidade,
            'preco': preco,
            'total': valor_venda,
            'timestamp': datetime.now().isoformat()
        })
        
        self.salvar_carteira()
        return {
            'sucesso': True,
            'saldo_atual': self.carteira['saldo_brl'],
            'posicao': self.carteira['moedas'].get(simbolo, 0)
        }
    
    def get_patrimonio_total(self, precos_atuais):
        """Calcula patrimônio total com preços atuais"""
        total_cripto = 0
        for simbolo, quantidade in self.carteira['moedas'].items():
            if simbolo in precos_atuais:
                total_cripto += quantidade * precos_atuais[simbolo]['preco']
        
        return {
            'saldo_brl': round(self.carteira['saldo_brl'], 2),
            'total_cripto': round(total_cripto, 2),
            'patrimonio_total': round(self.carteira['saldo_brl'] + total_cripto, 2)
        }
