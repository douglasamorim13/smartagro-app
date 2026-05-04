const { Pool } = require("pg");
const bcrypt    = require("bcrypt");
const jwt       = require("jsonwebtoken");
const config    = require("../config");

const pool = new Pool({ connectionString: config.DB_URL });

// ── Login ──────────────────────────────────────────────────────
async function login(email, senha, ipOrigem) {
  const { rows } = await pool.query(
    "SELECT * FROM usuarios WHERE email = $1 AND ativo = TRUE",
    [email]
  );
  const usuario = rows[0];

  if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash))) {
    await registrarLog(usuario?.id || null, "login_falhou", ipOrigem, pool);
    throw new Error("E-mail ou senha inválidos.");
  }

  await pool.query(
    "UPDATE usuarios SET ultimo_login = NOW() WHERE id = $1",
    [usuario.id]
  );
  await registrarLog(usuario.id, "login", ipOrigem, pool);

  const token = jwt.sign(
    { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES }
  );

  return {
    token,
    usuario: {
      id:     usuario.id,
      nome:   usuario.nome,
      email:  usuario.email,
      perfil: usuario.perfil,
    },
  };
}

// ── Criar usuário (admin only) ─────────────────────────────────
async function criarUsuario({ nome, email, senha, perfil = "operador" }) {
  const senha_hash = await bcrypt.hash(senha, 10);
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nome, email, senha_hash, perfil)
     VALUES ($1, $2, $3, $4)
     RETURNING id, nome, email, perfil, criado_em`,
    [nome, email, senha_hash, perfil]
  );
  return rows[0];
}

// ── Listar usuários ────────────────────────────────────────────
async function listarUsuarios() {
  const { rows } = await pool.query(
    "SELECT id, nome, email, perfil, ativo, criado_em, ultimo_login FROM usuarios ORDER BY nome"
  );
  return rows;
}

// ── Alterar senha ──────────────────────────────────────────────
async function alterarSenha(id, senhaAtual, novaSenha) {
  const { rows } = await pool.query("SELECT senha_hash FROM usuarios WHERE id = $1", [id]);
  if (!rows[0]) throw new Error("Usuário não encontrado.");
  if (!(await bcrypt.compare(senhaAtual, rows[0].senha_hash))) {
    throw new Error("Senha atual incorreta.");
  }
  const senha_hash = await bcrypt.hash(novaSenha, 10);
  await pool.query("UPDATE usuarios SET senha_hash = $1 WHERE id = $2", [senha_hash, id]);
}

// ── Utilitário de log ──────────────────────────────────────────
async function registrarLog(usuarioId, acao, ipOrigem, poolRef = pool) {
  try {
    await poolRef.query(
      "INSERT INTO logs_acesso (usuario_id, acao, ip_origem) VALUES ($1, $2, $3)",
      [usuarioId, acao, ipOrigem]
    );
  } catch (e) {
    console.error("[AUTH] Erro ao registrar log:", e.message);
  }
}

module.exports = { login, criarUsuario, listarUsuarios, alterarSenha };
