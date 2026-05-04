// src/routes/pesagem.js
const router                   = require("express").Router();
const { getPeso, travarPeso, liberarPeso } = require("../services/balancaService");
const { capturarTodasCameras } = require("../services/cameraService");
const db                       = require("../services/dbService");
const { autenticar }           = require("../middleware/authMiddleware");

router.use(autenticar);

// POST /pesagem/entrada
router.post("/entrada", async (req, res, next) => {
  try {
    const { peso, ultimaLeitura } = getPeso();
    if (peso === null)
      return res.status(503).json({ erro: "Balança sem leitura. Aguarde." });

    // 1. Trava o peso imediatamente
    const pesoTravado = travarPeso();

    // 2. Captura as 3 imagens de entrada
    console.log("[PESAGEM] Capturando imagens de entrada...");
    const cameras = await capturarTodasCameras();

    // 3. Salva no banco
    const pesagemId = await db.registrarEntrada({
      operadorId:  req.usuario.id,
      formData:    req.body,
      pesoEntrada: pesoTravado,
      cameras,
    });

    // 4. Libera a balança para nova leitura
    liberarPeso();

    res.json({
      id:           pesagemId,
      pesoEntrada:  pesoTravado,
      ultimaLeitura,
      operador:     req.usuario.nome,
      cameras:      cameras.map(({ posicao, ip, placa, erro }) => ({
        posicao, ip, placa, erro, momento: "entrada"
      })),
    });
  } catch (err) {
    liberarPeso(); // garante liberação mesmo em caso de erro
    next(err);
  }
});

// POST /pesagem/saida/:id
router.post("/saida/:id", async (req, res, next) => {
  try {
    const { peso, ultimaLeitura } = getPeso();
    if (peso === null)
      return res.status(503).json({ erro: "Balança sem leitura. Aguarde." });

    // 1. Trava o peso imediatamente
    const pesoTravado = travarPeso();

    // 2. Captura as 3 imagens de saída
    console.log("[PESAGEM] Capturando imagens de saída...");
    const cameras = await capturarTodasCameras();

    // 3. Salva no banco
    const pesagem = await db.registrarSaida({
      pesagemId: parseInt(req.params.id),
      pesoSaida: pesoTravado,
      cameras,
    });

    // 4. Libera a balança
    liberarPeso();

    res.json({
      id:           pesagem.id,
      pesoEntrada:  pesagem.peso_entrada,
      pesoSaida:    pesagem.peso_saida,
      pesoLiquido:  pesagem.peso_liquido,
      finalizadoEm: pesagem.finalizado_em,
      ultimaLeitura,
      cameras:      cameras.map(({ posicao, ip, placa, erro }) => ({
        posicao, ip, placa, erro, momento: "saida"
      })),
    });
  } catch (err) {
    liberarPeso(); // garante liberação mesmo em caso de erro
    next(err);
  }
});

// GET /pesagem — histórico com filtros
router.get("/", async (req, res, next) => {
  try {
    const pesagens = await db.buscarPesagens(req.query);
    res.json(pesagens);
  } catch (err) {
    next(err);
  }
});

// GET /pesagem/:id/imagens — busca todas as imagens da pesagem
router.get("/:id/imagens", async (req, res, next) => {
  try {
    const imagens = await db.buscarImagensPesagem(parseInt(req.params.id));
    res.json(imagens);
  } catch (err) {
    next(err);
  }
});

module.exports = router;