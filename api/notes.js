const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const SENHA_MESTRE = 'orto0421@';

module.exports = async function handler(req, res) {
  if (req.headers.authorization !== SENHA_MESTRE) {
    return res.status(401).json({ error: 'Acesso não autorizado.' });
  }

  const { method } = req;

  try {
    if (method === 'GET') {
      const { rows } = await pool.query('SELECT conteudo FROM bloco_notas WHERE id = 1');
      return res.status(200).json(rows[0] || { conteudo: '' });
    }

    if (method === 'POST') {
      const { conteudo } = req.body;
      const query = `
        UPDATE bloco_notas 
        SET conteudo = $1, data_atualizacao = CURRENT_TIMESTAMP 
        WHERE id = 1 
        RETURNING conteudo;
      `;
      const result = await pool.query(query, [conteudo]);
      return res.status(200).json(result.rows[0]);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};