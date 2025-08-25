const jwt = require("jsonwebtoken");

// Middleware para verificar se o token JWT é válido
function verifyJWT(req, res, next) {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(401).json({
      auth: false,
      message: "Token não foi fornecido",
    });
  }

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        auth: false,
        message: "Falha na autenticação do Token",
      });
    }

    //  id e tipo 
    req.userId = decoded.id;
    req.userTipo = decoded.tipo;

    next();
  });
}

module.exports = verifyJWT;
