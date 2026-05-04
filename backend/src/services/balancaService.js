// src/services/balancaService.js
const { SerialPort }     = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const config             = require("../config");

let ultimoPeso    = null;
let ultimaLeitura = null;
let pesoTravado   = null; // peso congelado no momento do registro
let intervalo     = null;

// ── Simulador ────────────────────────────────────────────────
function iniciarSimulador() {
  console.log("[BALANÇA] Modo simulado ativado.");
  let pesoAtual = parseFloat((Math.random() * 30000 + 10000).toFixed(1));

  intervalo = setInterval(() => {
    // Só oscila se o peso não estiver travado
    if (pesoTravado === null) {
      const oscilacao = parseFloat((Math.random() * 40 - 20).toFixed(1));
      pesoAtual       = Math.max(0, pesoAtual + oscilacao);
      ultimoPeso      = parseFloat(pesoAtual.toFixed(1));
      ultimaLeitura   = new Date();
    }
  }, 1000);
}

// ── Serial real ──────────────────────────────────────────────
function iniciarSerial() {
  const serial = new SerialPort({
    path:     config.SERIAL_PATH,
    baudRate: config.SERIAL_BAUD,
    dataBits: 8,
    parity:   "none",
    stopBits: 1,
    autoOpen: false,
  });

  const parser = serial.pipe(new ReadlineParser({ delimiter: "\r\n" }));

  parser.on("data", (linha) => {
    if (pesoTravado !== null) return; // ignora leituras com peso travado
    const match = linha.match(/([\d]+[.,][\d]+)\s*kg/i);
    if (match) {
      ultimoPeso    = parseFloat(match[1].replace(",", "."));
      ultimaLeitura = new Date();
      console.log(`[BALANÇA] ${ultimoPeso} kg — ${ultimaLeitura.toISOString()}`);
    }
  });

  serial.on("error", (err) => {
    console.error("[BALANÇA] Erro serial:", err.message);
  });

  serial.open((err) => {
    if (err) console.error("[BALANÇA] Falha ao abrir porta:", err.message);
    else     console.log(`[BALANÇA] Conectada em ${config.SERIAL_PATH} @ ${config.SERIAL_BAUD} baud`);
  });
}

// ── API pública ──────────────────────────────────────────────
function conectar() {
  config.BALANCA_SIMULADA ? iniciarSimulador() : iniciarSerial();
}

function getPeso() {
  // Se travado, retorna o peso congelado
  const peso = pesoTravado !== null ? pesoTravado : ultimoPeso;
  return { peso, ultimaLeitura, travado: pesoTravado !== null };
}

// Trava o peso atual (chamado ao registrar entrada/saída)
function travarPeso() {
  pesoTravado = ultimoPeso;
  console.log(`[BALANÇA] Peso travado: ${pesoTravado} kg`);
  return pesoTravado;
}

// Libera o peso para voltar a oscilar (chamado após salvar no banco)
function liberarPeso() {
  pesoTravado = null;
  console.log("[BALANÇA] Peso liberado.");
}

function setPesoManual(peso) {
  ultimoPeso    = peso;
  ultimaLeitura = new Date();
  pesoTravado   = null;
}

process.on("SIGINT", () => {
  if (intervalo) clearInterval(intervalo);
  process.exit();
});

module.exports = { conectar, getPeso, travarPeso, liberarPeso, setPesoManual };