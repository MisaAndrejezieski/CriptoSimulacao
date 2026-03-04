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
                'historico': [],
                'historico_patrimonio': []
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
    
    def iniciar_trading_automatico(self, simbolo, percentual_compra, percentual_venda, valor_investimento):
        """Inicia trading automático com parâmetros definidos"""
        self.trading_ativo = True
        self.simbolo_trading = simbolo
        self.percentual_compra = percentual_compra  # ex: -0.02 (2% abaixo)
        self.percentual_venda = percentual_venda    # ex: 0.03 (3% acima)
        self.valor_investimento = valor_investimento
        self.preco_referencia = None  # Será definido na primeira execução
        
        return {'sucesso': True, 'mensagem': 'Trading automático iniciado'}
    
    def parar_trading_automatico(self):
        """Para o trading automático"""
        self.trading_ativo = False
        return {'sucesso': True, 'mensagem': 'Trading automático parado'}
    
    def executar_trading_automatico(self, preco_atual):
        """Executa uma rodada de trading automático baseado no preço atual"""
        if not self.trading_ativo or not self.simbolo_trading:
            return None
        
        simbolo = self.simbolo_trading
        
        # Define preço de referência na primeira execução
        if self.preco_referencia is None:
            self.preco_referencia = preco_atual
            return {'acao': 'referencia_definida', 'preco': preco_atual}
        
        # Calcula percentual de variação
        variacao = (preco_atual - self.preco_referencia) / self.preco_referencia
        
        resultado = None
        
        # Verifica se deve comprar (preço abaixo do percentual definido)
        if variacao <= self.percentual_compra:
            # Calcula quanto pode comprar com o valor de investimento
            quantidade = self.valor_investimento / preco_atual
            
            # Verifica se tem saldo suficiente
            if self.carteira['saldo_brl'] >= self.valor_investimento:
                resultado = self.comprar(simbolo, quantidade, preco_atual)
                if resultado['sucesso']:
                    resultado['acao'] = 'compra'
                    # Atualiza preço de referência após compra
                    self.preco_referencia = preco_atual
            else:
                resultado = {'sucesso': False, 'mensagem': 'Saldo insuficiente para compra'}
        
        # Verifica se deve vender (preço acima do percentual definido)
        elif variacao >= self.percentual_venda:
            # Vende toda a posição atual
            quantidade_atual = self.carteira['moedas'].get(simbolo, 0)
            if quantidade_atual > 0:
                resultado = self.vender(simbolo, quantidade_atual, preco_atual)
                if resultado['sucesso']:
                    resultado['acao'] = 'venda'
                    # Atualiza preço de referência após venda
                    self.preco_referencia = preco_atual
            else:
                resultado = {'sucesso': False, 'mensagem': 'Nenhuma posição para vender'}
        
        return resultado
