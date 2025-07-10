const express = require('express');
const app = express();
const port = 3000;

// Servir arquivos estáticos da pasta atual
app.use(express.static('./'));

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor AutoPass rodando em http://localhost:${port}`);
}); 