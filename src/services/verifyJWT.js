const jwt = require("jsonwebtoken");

function verifyJWT(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ auth: false, message: "Token não fornecido" });
  }

  // Se vier "Bearer <token>", pega só o token
  // Se vier só "<token>", usa direto
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  if (!token) {
    return res.status(401).json({ auth: false, message: "Token inválido" });
  }

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .json({ auth: false, message: "Falha na autenticação do Token" });
    }

    req.user = {
      id: decoded.id,
      tipo: decoded.tipo.toLowerCase(),
    };

    next();
  });
}

module.exports = verifyJWT;