const { Pool } = require("pg");
const config = require("../config");

const pool = new Pool({ connectionString: config.DB_URL });

// ── Salvar imagens vinculadas à pesagem ────────────────────────
async function salvarImagens(pesagemId, momento, cameras, client) {
  const db = client || pool;
  for (const cam of cameras) {
    await db.query(
      `INSERT INTO imagens
         (pesagem_id, momento, posicao, camera_ip, placa_ocr, imagem_b64)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [pesagemId, momento, cam.posicao, cam.ip, cam.placa, cam.imagem]
    );
  }
}

// ── Registrar entrada ──────────────────────────────────────────
async function registrarEntrada({ operadorId, formData, pesoEntrada, cameras }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO pesagens
         (operador_id, motorista, cpf_motorista, transportadora,
          nfe_chave, nfe_numero, nfe_emitente, nfe_destinatario,
          nfe_produto, nfe_peso, nfe_valor,
          produto_codigo, produto_descricao,
          placa_dianteira, placa_traseira, peso_entrada, etapa)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'entrada')
       RETURNING id`,
      [
        operadorId,
        formData.motorista,
        formData.cpfMotorista,
        formData.transportadora,
        formData.nfeChave,
        formData.nfeNumero,
        formData.nfeEmitente,
        formData.nfeDestinatario,
        formData.produtoDescricao,
        formData.nfePeso,
        formData.nfeValor,
        formData.produtoCodigo,
        formData.produtoDescricao,
        cameras.find(c => c.posicao === "dianteira")?.placa || null,
        cameras.find(c => c.posicao === "traseira")?.placa  || null,
        pesoEntrada,
      ]
    );

    const pesagemId = rows[0].id;
    await salvarImagens(pesagemId, "entrada", cameras, client);

    await client.query("COMMIT");
    return pesagemId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ── Registrar saída ────────────────────────────────────────────
async function registrarSaida({ pesagemId, pesoSaida, cameras }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE pesagens
       SET peso_saida = $1, etapa = 'finalizado', finalizado_em = NOW()
       WHERE id = $2`,
      [pesoSaida, pesagemId]
    );
    await salvarImagens(pesagemId, "saida", cameras, client);

    const { rows } = await client.query(
      "SELECT * FROM pesagens WHERE id = $1",
      [pesagemId]
    );

    await client.query("COMMIT");
    return rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ── Buscar pesagens ────────────────────────────────────────────
async function buscarPesagens({ placa, dataInicio, dataFim, operadorId } = {}) {
  let query = `
    SELECT p.*, u.nome AS operador_nome
    FROM pesagens p
    JOIN usuarios u ON u.id = p.operador_id
    WHERE 1=1
  `;
  const params = [];

  if (placa) {
    params.push(`%${placa}%`);
    query += ` AND (p.placa_dianteira ILIKE $${params.length}
               OR p.placa_traseira ILIKE $${params.length})`;
  }
  if (dataInicio) {
    params.push(dataInicio);
    query += ` AND p.criado_em >= $${params.length}`;
  }
  if (dataFim) {
    params.push(dataFim);
    query += ` AND p.criado_em <= $${params.length}`;
  }
  if (operadorId) {
    params.push(operadorId);
    query += ` AND p.operador_id = $${params.length}`;
  }

  query += " ORDER BY p.criado_em DESC LIMIT 100";
  const { rows } = await pool.query(query, params);
  return rows;
}

// ── Buscar imagens de uma pesagem ──────────────────────────────
async function buscarImagensPesagem(pesagemId) {
  const { rows } = await pool.query(
    "SELECT posicao, momento, placa_ocr, capturado_em FROM imagens WHERE pesagem_id = $1 ORDER BY capturado_em",
    [pesagemId]
  );
  return rows;
}

module.exports = { registrarEntrada, registrarSaida, buscarPesagens, buscarImagensPesagem };
