const jwt = require("jsonwebtoken");

function verifyJWT(req, res, next) {
  const authHeader = req.headers["authorization"];
  
  if (!authHeader) {
    return res.status(401).json({
      auth: false,
      message: "Token não foi fornecido",
    });
  }

  // Suporta "Bearer <token>" ou só "<token>"
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

  if (!token) {
    return res.status(401).json({ auth: false, message: "Token não foi fornecido" });
  }

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ auth: false, message: "Falha na autenticação do Token" });
    }

    // injeta usuário de forma consistente
    req.user = {
      id: decoded.id,
      tipo: decoded.tipo.toLowerCase(), // força minúsculo
    };

    next();
  });
}

module.exports = verifyJWT;
