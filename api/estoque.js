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
      const { rows } = await pool.query('SELECT * FROM estoque ORDER BY id DESC');
      return res.status(200).json(rows);
    }

    if (method === 'POST') {
      const { id, tipo_equipamento, modelo, numero_serie, status, observacoes } = req.body;
      
      if (id) {
        // Atualizar existente
        const query = `
          UPDATE estoque 
          SET tipo_equipamento = $1, modelo = $2, numero_serie = $3, status = $4, observacoes = $5, data_atualizacao = CURRENT_TIMESTAMP
          WHERE id = $6 RETURNING *;
        `;
        const result = await pool.query(query, [tipo_equipamento, modelo, numero_serie || '', status, observacoes || '', id]);
        return res.status(200).json(result.rows[0]);
      } else {
        // Criar novo
        const query = `
          INSERT INTO estoque (tipo_equipamento, modelo, numero_serie, status, observacoes, data_atualizacao)
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
          RETURNING *;
        `;
        const result = await pool.query(query, [tipo_equipamento, modelo, numero_serie || '', status, observacoes || '']);
        return res.status(201).json(result.rows[0]);
      }
    }

    if (method === 'DELETE') {
      const id = req.query.id;
      await pool.query('DELETE FROM estoque WHERE id = $1', [id]);
      return res.status(200).json({ message: 'Item deletado' });
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
