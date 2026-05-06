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
      const { rows } = await pool.query('SELECT * FROM rede_ips ORDER BY ip_suffix ASC');
      return res.status(200).json(rows);
    } 
    
    if (method === 'POST') {
      const { ip_suffix, status, usuario, local_uso, observacao, modelo_terminal, servidor_alvo } = req.body;
      const query = `
        INSERT INTO rede_ips (ip_suffix, status, usuario, local_uso, observacao, modelo_terminal, servidor_alvo, data_atualizacao)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        ON CONFLICT (ip_suffix) DO UPDATE 
        SET status = EXCLUDED.status,
            usuario = EXCLUDED.usuario,
            local_uso = EXCLUDED.local_uso,
            observacao = EXCLUDED.observacao,
            modelo_terminal = EXCLUDED.modelo_terminal,
            servidor_alvo = EXCLUDED.servidor_alvo,
            data_atualizacao = CURRENT_TIMESTAMP
        RETURNING *;
      `;
      const values = [
        ip_suffix, 
        status, 
        usuario || '', 
        local_uso || '', 
        observacao || '', 
        modelo_terminal || '', 
        servidor_alvo || ''
      ];
      const result = await pool.query(query, values);
      return res.status(200).json(result.rows[0]);
    }

    if (method === 'DELETE') {
      const suffix = req.query.suffix;
      await pool.query('DELETE FROM rede_ips WHERE ip_suffix = $1', [suffix]);
      return res.status(200).json({ message: 'Registro deletado' });
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};