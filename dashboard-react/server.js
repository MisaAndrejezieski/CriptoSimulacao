const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Rota para o dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`CryptoBot Pro Dashboard rodando em http://localhost:${port}`);
    console.log(`Conectado à API em tempo real via WebSocket`);
});