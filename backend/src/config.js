require("dotenv").config();

module.exports = {
  PORT:              process.env.PORT              || 4000,
  SERIAL_PATH:       process.env.SERIAL_PATH       || "COM7",
  SERIAL_BAUD:       parseInt(process.env.SERIAL_BAUD) || 9600,
  BALANCA_SIMULADA:  process.env.BALANCA_SIMULADA  === "true",

  // Câmeras por posição
  CAM_DIANTEIRA:     process.env.CAM_DIANTEIRA     || "",
  CAM_TRASEIRA:      process.env.CAM_TRASEIRA      || "",
  CAM_TOPO:          process.env.CAM_TOPO          || "",
  CAM_USER:          process.env.CAM_USER          || "admin",
  CAM_PASS:          process.env.CAM_PASS          || "admin",

  // Banco
  DB_URL:            process.env.DB_URL            || "postgresql://user:pass@localhost:5432/smartagro",

  // Auth
  JWT_SECRET:        process.env.JWT_SECRET        || "troque-em-producao",
  JWT_EXPIRES:       process.env.JWT_EXPIRES       || "8h",

  // NF-e
  NFE_TOKEN:         process.env.NFE_TOKEN         || "",

  // ERP
  ERP_BASE_URL:      process.env.ERP_BASE_URL      || "",
  ERP_TOKEN:         process.env.ERP_TOKEN         || "",
};
