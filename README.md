# CriptoSimulacao

Simulador de criptomoedas com bot automatizado e dashboard elegante.

Nova estrutura do projeto:

```
cripto-simulador/
├── bot/                # Lógica do trading bot (decisões, carteira, coleta de preços)
├── api/                # API Flask que expõe dados para o dashboard
├── dashboard/          # Aplicação front‑end estática com gráficos e status
├── requirements.txt    # Dependências de todo o sistema
└── README.md           # Esta documentação
```

O backend fornece endpoints para preços em tempo real, compra/venda e gerenciamento de carteira.
O frontend se comunica com a API e exibe informações ao usuário.

## Começando

1. Crie um ambiente virtual e instale dependências:

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate   # windows: .venv\\Scripts\\activate
pip install -r requirements.txt
```

2. Execute a API Flask:

```bash
python app.py
```

3. Abra `frontend/index.html` em um navegador ou sirva com um servidor estático.

O front-end se comunica com `http://localhost:5000/api` por padrão.

## Como executar o sistema completo

1. **Instalar dependências**

   ```bash
   cd E:\CriptoSimulacao
   .venv\Scripts\activate   # windows
   pip install -r requirements.txt
   ```

2. **Iniciar o bot automático** (terminal 1):

   ```bash
   cd bot
   python trading_bot.py
   ```

3. **Rodar a API do dashboard** (terminal 2):

   ```bash
   cd api
   python app.py
   ```

4. **Servir o frontend** (terminal 3):

   ```bash
   cd dashboard
   live-server   # ou use extensão de servidor estático do VSCode
   ```

Após isso, abra o dashboard no navegador (geralmente em `http://127.0.0.1:8080`) para acompanhar o bot.



