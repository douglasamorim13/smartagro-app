const router   = require("express").Router();
const { getPeso, setPesoManual } = require("../services/balancaService");
const { autenticar } = require("../middleware/authMiddleware");
const config   = require("../config");

router.use(autenticar);

// GET /balanca/abrir-porta
router.get("/abrir-porta", (req, res) => {
  console.log("[PORTA] Abrindo...");
  res.json({ status: "ok", mensagem: "Porta aberta!" });
});

// GET /balanca/fechar-porta
router.get("/fechar-porta", (req, res) => {
  console.log("[PORTA] Fechando...");
  res.json({ status: "ok", mensagem: "Porta fechada!" });
});

// GET /balanca/peso — leitura atual
router.get("/peso", (req, res) => {
  const { peso, ultimaLeitura } = getPeso();
  if (peso === null)
    return res.status(503).json({ erro: "Nenhuma leitura disponível." });
  res.json({ peso, ultimaLeitura, simulado: config.BALANCA_SIMULADA });
});

// PUT /balanca/peso — força peso manual (só simulado)
router.put("/peso", (req, res) => {
  if (!config.BALANCA_SIMULADA)
    return res.status(403).json({ erro: "Só disponível em modo simulado." });

  const peso = parseFloat(req.body.peso);
  if (isNaN(peso) || peso < 0)
    return res.status(400).json({ erro: "Peso inválido." });

  setPesoManual(peso);
  res.json({ ok: true, peso });
});

module.exports = router;