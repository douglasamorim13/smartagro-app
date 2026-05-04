module.exports = (err, req, res, next) => {
  console.error(`[ERRO] ${req.method} ${req.path} —`, err.message);
  res.status(err.status || 500).json({
    erro: err.message || "Erro interno do servidor.",
  });
};