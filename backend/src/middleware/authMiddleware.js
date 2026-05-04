const jwt = require("jsonwebtoken");
const config = require("../config");

// ── Verifica token JWT ─────────────────────────────────────────
function autenticar(req, res, next) {
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: "Token não fornecido." });
  }

  try {
    req.usuario = jwt.verify(token, config.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }
}

// ── Exige perfil mínimo ────────────────────────────────────────
const NIVEL = { operador: 1, supervisor: 2, admin: 3 };

function exigirPerfil(...perfisPermitidos) {
  return (req, res, next) => {
    const nivelUsuario  = NIVEL[req.usuario?.perfil] || 0;
    const nivelMinimo   = Math.min(...perfisPermitidos.map(p => NIVEL[p] || 99));
    if (nivelUsuario < nivelMinimo) {
      return res.status(403).json({ erro: "Acesso negado para este perfil." });
    }
    next();
  };
}

module.exports = { autenticar, exigirPerfil };
