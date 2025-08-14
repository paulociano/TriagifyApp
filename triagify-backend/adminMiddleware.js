const verifyToken = require('./authMiddleware');
const { jwtDecode } = require('jwt-decode'); // Usaremos jwt-decode para ler o perfil

function verifyAdmin(req, res, next) {
  // Primeiro, verifica se o token é válido
  verifyToken(req, res, () => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    try {
      const decodedToken = jwtDecode(token);
      // Depois, verifica se o perfil do utilizador é ADMIN
      if (decodedToken && decodedToken.role === 'ADMIN') {
        req.user = decodedToken; // Garante que req.user está definido
        next(); // Se for admin, permite o acesso
      } else {
        res.status(403).json({ message: 'Acesso negado. Apenas administradores.' }); // 403 Forbidden
      }
    } catch (error) {
        res.status(401).json({ message: 'Token inválido.' });
    }
  });
}

module.exports = verifyAdmin;
