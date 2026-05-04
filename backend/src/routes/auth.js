const router      = require("express").Router();
const authService = require("../services/authService");
const { autenticar, exigirPerfil } = require("../middleware/authMiddleware");

// POST /auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha)
      return res.status(400).json({ erro: "E-mail e senha são obrigatórios." });

    const ip = req.ip || req.headers["x-forwarded-for"];
    const resultado = await authService.login(email, senha, ip);
    res.json(resultado);
  } catch (err) {
    res.status(401).json({ erro: err.message });
  }
});

// GET /auth/me
router.get("/me", autenticar, (req, res) => {
  res.json({ usuario: req.usuario });
});

// POST /auth/usuarios — cria usuário (admin only)
router.post("/usuarios", autenticar, exigirPerfil("admin"), async (req, res, next) => {
  try {
    const usuario = await authService.criarUsuario(req.body);
    res.status(201).json(usuario);
  } catch (err) {
    if (err.code === "23505")
      return res.status(409).json({ erro: "E-mail já cadastrado." });
    next(err);
  }
});

// GET /auth/usuarios — lista usuários (supervisor+)
router.get("/usuarios", autenticar, exigirPerfil("supervisor"), async (req, res, next) => {
  try {
    const usuarios = await authService.listarUsuarios();
    res.json(usuarios);
  } catch (err) {
    next(err);
  }
});

// PUT /auth/senha — altera própria senha
router.put("/senha", autenticar, async (req, res, next) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    await authService.alterarSenha(req.usuario.id, senhaAtual, novaSenha);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

module.exports = router;