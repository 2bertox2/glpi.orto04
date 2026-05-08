const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const SENHA_MESTRE = 'orto0421@';

module.exports = async function handler(req, res) {
  if (req.headers.authorization !== SENHA_MESTRE) {
    return res.status(401).json({ error: 'Acesso não autorizado.' });
  }
  const { method } = req;
  try {
    if (method === 'GET') {
      const { rows } = await pool.query('SELECT * FROM servidores ORDER BY id ASC');
      return res.status(200).json(rows);
    }
    if (method === 'POST') {
      const { nome, descricao } = req.body;
      const query = `
        INSERT INTO servidores (nome, descricao) VALUES ($1, $2)
        ON CONFLICT (nome) DO UPDATE SET descricao = EXCLUDED.descricao
        RETURNING *;
      `;
      const result = await pool.query(query, [nome, descricao || '']);
      return res.status(200).json(result.rows[0]);
    }
    if (method === 'DELETE') {
      const id = req.query.id;
      await pool.query('DELETE FROM servidores WHERE id = $1', [id]);
      return res.status(200).json({ message: 'Servidor deletado' });
    }
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
