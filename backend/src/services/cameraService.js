// src/services/cameraService.js
const axios  = require("axios");
const fs     = require("fs");
const path   = require("path");
const config = require("../config");

// ── Câmeras reais (IPs configurados no .env) ──────────────────
/*
const CAMERAS = [
  { posicao: "dianteira", ip: config.CAM_DIANTEIRA },
  { posicao: "traseira",  ip: config.CAM_TRASEIRA  },
  { posicao: "topo",      ip: config.CAM_TOPO       },
].filter(c => c.ip);

const auth = { username: config.CAM_USER, password: config.CAM_PASS };

async function capturarSnapshot(ip) {
  const url = `http://${ip}/ISAPI/Streaming/channels/101/picture`;
  const resp = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 6000,
    auth,
  });
  return Buffer.from(resp.data).toString("base64");
}

async function capturarPlaca(ip) {
  try {
    const url  = `http://${ip}/ISAPI/Traffic/channels/1/vehicleDetect/plates`;
    const resp = await axios.get(url, { timeout: 5000, auth });
    return resp.data?.PlateInfo?.plateNumber || null;
  } catch {
    return null;
  }
}

async function capturarCamera({ posicao, ip }) {
  try {
    const [imagem, placa] = await Promise.all([
      capturarSnapshot(ip),
      capturarPlaca(ip),
    ]);
    console.log(`[CÂMERA] ${posicao} (${ip}) — placa: ${placa || "não detectada"}`);
    return { posicao, ip, imagem, placa, erro: null };
  } catch (err) {
    console.error(`[CÂMERA] ${posicao} (${ip}) — erro: ${err.message}`);
    return { posicao, ip, imagem: null, placa: null, erro: err.message };
  }
}
*/

// ── MODO SIMULADO — imagens locais ────────────────────────────
// Coloque 3 imagens JPG na pasta backend/mock-images/ com os nomes:
//   dianteira.jpg, traseira.jpg, topo.jpg
// Remova este bloco e descomente o bloco acima quando for usar as câmeras reais

const CAMERAS = [
  { posicao: "dianteira", ip: config.CAM_DIANTEIRA || "192.168.1.101" },
  { posicao: "traseira",  ip: config.CAM_TRASEIRA  || "192.168.1.102" },
  { posicao: "topo",      ip: config.CAM_TOPO      || "192.168.1.103" },
];

const MOCK_DIR = path.join(__dirname, "../../mock-images");

function carregarImagemMock(posicao) {
  try {
    const arquivo = path.join(MOCK_DIR, `${posicao}.jpg`);
    if (fs.existsSync(arquivo)) {
      return fs.readFileSync(arquivo).toString("base64");
    }
    return null;
  } catch {
    return null;
  }
}

const PLACAS_MOCK = {
  dianteira: "ABC1D23",
  traseira:  "ABC1D23",
  topo:      null,
};

async function capturarCamera({ posicao, ip }) {
  console.log(`[CÂMERA] ${posicao} (simulado)`);
  await new Promise(r => setTimeout(r, 300));
  return {
    posicao,
    ip,
    imagem: carregarImagemMock(posicao),
    placa:  PLACAS_MOCK[posicao] || null,
    erro:   null,
  };
}

// ── API pública (igual para real e simulado) ──────────────────
async function capturarTodasCameras() {
  return Promise.all(CAMERAS.map(capturarCamera));
}

function getRtspUrl(ip) {
  return `rtsp://${config.CAM_USER}:${config.CAM_PASS}@${ip}:554/Streaming/Channels/101`;
}

module.exports = { capturarTodasCameras, getRtspUrl, CAMERAS };