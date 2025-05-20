const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
app.use(cors());
app.use(express.json());

// Proxy para as câmeras
app.use("/camera/:canal", (req, res, next) => {
  const canal = req.params.canal;
  const url = `http://tecgesco:tecgesco25@192.168.0.167/cgi-bin/snapshot.cgi?channel=${canal}`;
  createProxyMiddleware({
    target: url,
    changeOrigin: true,
    pathRewrite: { [`/camera/${canal}`]: "" }
  })(req, res, next);
});

// Receber dados do formulário
app.post("/dados", (req, res) => {
  console.log("Dados recebidos:", req.body);
  res.json({ status: "Recebido com sucesso" });
});

app.listen(4000, () => console.log("Servidor rodando na porta 4000"));