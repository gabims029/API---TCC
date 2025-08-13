const jwt = require("jsonwebtoken");

// Define a função middleware 'verifyJWT' para verificar a autenticidade do token JWT
function verifyJWT(req, res, next) {
    const token = req.headers["authorization"];

    if (!token) {
        return res.status(401).json({
            auth: false,
            message: "Token não foi fornecido" 
        });
    }

    // Verifica se o token é válido usando a chave secreta armazenada na variável de ambiente SECRET
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({
                auth: false, 
                message: "Falha na autenticação do Token"
            });
        }
        // Se o token for válido, salva o ID do usuário extraído do token na requisição
        req.userId = decoded.id;
        next();
    });
}

module.exports = verifyJWT;
