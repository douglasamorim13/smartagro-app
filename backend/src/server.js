const express    = require("express");
const cors       = require("cors");
const config     = require("./config");
const { conectar } = require("./services/balancaService");
const errorHandler = require("./middleware/errorHandler");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" })); // imagens base64 podem ser grandes

// ── Rotas públicas ─────────────────────────────────────────────
app.use("/auth",    require("./routes/auth"));

// ── Rotas protegidas (JWT obrigatório) ─────────────────────────
app.use("/balanca",  require("./routes/balanca"));
app.use("/pesagem",  require("./routes/pesagem"));
app.use("/camera",   require("./routes/camera"));
app.use("/nfe",      require("./routes/nfe"));

// ── Handler global de erros ────────────────────────────────────
app.use(errorHandler);

// ── Inicialização ──────────────────────────────────────────────
app.listen(config.PORT, () => {
  console.log(`[SERVER] Porta ${config.PORT}`);
  console.log(`[CONFIG] Balança: ${config.BALANCA_SIMULADA ? "SIMULADA" : config.SERIAL_PATH}`);
  console.log(`[CONFIG] Câmeras: dianteira=${config.CAM_DIANTEIRA} | traseira=${config.CAM_TRASEIRA} | topo=${config.CAM_TOPO}`);
  conectar();
});
