const router = require("express").Router();
const { capturarTodasCameras, getRtspUrl, CAMERAS } = require("../services/cameraService");
const { autenticar } = require("../middleware/authMiddleware");

router.use(autenticar);

// GET /camera/capturar — captura manual das 3 câmeras
router.get("/capturar", async (req, res, next) => {
  try {
    const imagens = await capturarTodasCameras();
    res.json({ imagens });
  } catch (err) {
    next(err);
  }
});

// GET /camera/streams — retorna URLs RTSP de todas as câmeras
router.get("/streams", (req, res) => {
  const streams = CAMERAS.map(({ posicao, ip }) => ({
    posicao,
    ip,
    rtsp: getRtspUrl(ip),
  }));
  res.json({ streams });
});

module.exports = router;