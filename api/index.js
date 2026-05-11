const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const SENHA_MESTRE = 'orto0421@';

// Middleware de Autenticação
app.use((req, res, next) => {
  if (req.headers.authorization !== SENHA_MESTRE) {
    return res.status(401).json({ error: 'Acesso não autorizado.' });
  }
  next();
});

// ==========================================
// ROTAS DE SERVIDORES (CATÁLOGO)
// ==========================================
app.get('/api/servers', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM servidores ORDER BY id ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/servers', async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    const query = `
      INSERT INTO servidores (nome, descricao) VALUES ($1, $2)
      ON CONFLICT (nome) DO UPDATE SET descricao = EXCLUDED.descricao
      RETURNING *;
    `;
    const result = await pool.query(query, [nome, descricao || '']);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/servers', async (req, res) => {
  try {
    await pool.query('DELETE FROM servidores WHERE id = $1', [req.query.id]);
    res.json({ message: 'Deletado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ROTAS DE MODELOS DE TERMINAL
// ==========================================
app.get('/api/models', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM modelos_terminal ORDER BY id ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/models', async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    const query = `
      INSERT INTO modelos_terminal (nome, descricao) VALUES ($1, $2)
      ON CONFLICT (nome) DO UPDATE SET descricao = EXCLUDED.descricao
      RETURNING *;
    `;
    const result = await pool.query(query, [nome, descricao || '']);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/models', async (req, res) => {
  try {
    await pool.query('DELETE FROM modelos_terminal WHERE id = $1', [req.query.id]);
    res.json({ message: 'Deletado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ROTAS DE ESTOQUE
// ==========================================
app.get('/api/estoque', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM estoque ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/estoque', async (req, res) => {
  try {
    const { id, tipo_equipamento, modelo, numero_serie, status, observacoes } = req.body;
    let result;
    if (id) {
      result = await pool.query(
        `UPDATE estoque SET tipo_equipamento = $1, modelo = $2, numero_serie = $3, status = $4, observacoes = $5, data_atualizacao = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *`,
        [tipo_equipamento, modelo, numero_serie || '', status, observacoes || '', id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO estoque (tipo_equipamento, modelo, numero_serie, status, observacoes) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [tipo_equipamento, modelo, numero_serie || '', status, observacoes || '']
      );
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/estoque', async (req, res) => {
  try {
    await pool.query('DELETE FROM estoque WHERE id = $1', [req.query.id]);
    res.json({ message: 'Deletado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ROTAS DE MAPA DE IPS
// ==========================================
app.get('/api/ips', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM rede_ips ORDER BY ip_suffix ASC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ips', async (req, res) => {
  try {
    const { ip_suffix, status, usuario, local_uso, observacao, modelo_terminal, servidor_alvo } = req.body;
    const query = `
      INSERT INTO rede_ips (ip_suffix, status, usuario, local_uso, observacao, modelo_terminal, servidor_alvo, data_atualizacao)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (ip_suffix) DO UPDATE 
      SET status = EXCLUDED.status, usuario = EXCLUDED.usuario, local_uso = EXCLUDED.local_uso,
          observacao = EXCLUDED.observacao, modelo_terminal = EXCLUDED.modelo_terminal,
          servidor_alvo = EXCLUDED.servidor_alvo, data_atualizacao = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const result = await pool.query(query, [ip_suffix, status, usuario || '', local_uso || '', observacao || '', modelo_terminal || '', servidor_alvo || '']);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/ips', async (req, res) => {
  try {
    await pool.query('DELETE FROM rede_ips WHERE ip_suffix = $1', [req.query.suffix]);
    res.json({ message: 'IP Zerado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ROTAS DO BLOCO DE NOTAS
// ==========================================
app.get('/api/notes', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT conteudo FROM bloco_notas WHERE id = 1');
    res.json(rows[0] || { conteudo: '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const { conteudo } = req.body;
    let result = await pool.query(`UPDATE bloco_notas SET conteudo = $1, data_atualizacao = CURRENT_TIMESTAMP WHERE id = 1 RETURNING *`, [conteudo]);
    if (result.rowCount === 0) {
      result = await pool.query(`INSERT INTO bloco_notas (id, conteudo) VALUES (1, $1) RETURNING *`, [conteudo]);
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
