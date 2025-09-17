const jwt = require("jsonwebtoken");

function verifyJWT(req, res, next) {

  const token = req.headers["authorization"]; // token puro


  if (!token) {
    return res.status(401).json({ auth: false, message: "Token inválido" });
  }

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .json({ auth: false, message: "Falha na autenticação do Token" });
    }


    // Injeta usuário de forma consistente
    req.userId = decoded.id;          // id do usuário
    req.user = { tipo: decoded.tipo.toLowerCase() }; // tipo do usuário em minúsculo


    next();
  });
}

module.exports = verifyJWT;