// backend/authMiddleware.js
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

  if (!token) {
    return res.status(403).json({ message: 'Nenhum token fornecido.' }); // 403 Forbidden
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido ou expirado.' }); // 401 Unauthorized
    }
    req.user = decoded; // Adiciona os dados do utilizador (id, email) à requisição
    next(); // Passa para a próxima função (a rota principal)
  });
}

module.exports = verifyToken;