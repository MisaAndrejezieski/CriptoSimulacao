# CriptoSimulacao

Simulador de criptomoedas com backend em Flask e frontend em HTML/JavaScript.

Estrutura do projeto:

```
cripto-simulador/
├── backend/           # API Flask e lógica do simulador
├── frontend/          # Interface web estática
└── README.md          # Documentação básica
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



