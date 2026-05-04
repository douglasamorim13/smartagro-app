// src/routes/nfe.js
const router = require("express").Router();
const axios  = require("axios");
const config = require("../config");
const { autenticar } = require("../middleware/authMiddleware");

router.use(autenticar);

// GET /nfe/:chave
router.get("/:chave", async (req, res, next) => {
  try {
    const chave = req.params.chave.replace(/\D/g, "");
    if (chave.length !== 44)
      return res.status(400).json({ erro: "Chave NF-e deve ter 44 dígitos numéricos." });

    // ── MODO SIMULADO ────────────────────────────────────────
    // Remova este bloco quando tiver o token real do Focus NF-e
    if (!config.NFE_TOKEN) {
      return res.json({
        numero:       "000123",
        emitente:     "Fazenda Modelo Ltda",
        destinatario: "SmartAgro Transportes",
        produto:      "Soja em Grão",
        pesoNfe:      28500.00,
        valor:        95000.00,
        status:       "autorizado",
      });
    }
    // ────────────────────────────────────────────────────────

    const url  = `https://api.focusnfe.com.br/v2/nfe/${chave}?completo=1`;
    const resp = await axios.get(url, {
      headers: { Authorization: `Token ${config.NFE_TOKEN}` },
      timeout: 10000,
    });

    const nfe = resp.data;
    res.json({
      numero:       nfe.numero,
      emitente:     nfe.emitente?.nome,
      destinatario: nfe.destinatario?.nome,
      produto:      nfe.itens?.[0]?.descricao,
      pesoNfe:      nfe.itens?.[0]?.peso_bruto || null,
      valor:        nfe.valor_total,
      status:       nfe.status,
    });
  } catch (err) {
    if (err.response?.status === 404)
      return res.status(404).json({ erro: "NF-e não encontrada." });
    if (err.response?.status === 401)
      return res.status(401).json({ erro: "Token NF-e inválido ou expirado." });
    next(err);
  }
});

module.exports = router;