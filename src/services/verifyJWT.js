const jwt = require("jsonwebtoken");

function verifyJWT(req, res, next) {
    // Pega o valor do cabeçalho Authorization. Espera-se que seja o token puro.
    const token = req.headers["authorization"]; 

    if (!token) {
        // 401: Não autorizado. Token ausente.
        return res.status(401).json({ auth: false, message: "Acesso negado. Token não fornecido." });
    }
    
    // Tenta verificar o token puro
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) {
            if (err.name === "TokenExpiredError") {
                return res
                  .status(401) // 401 = Não autorizado
                  .json({ auth: false, message: "Token expirado, realize a autenticação novamente" });
              }
              
            // 403: Proibido. Token inválido, expirado ou com chave secreta errada.
            console.error("Falha na verificação JWT:", err.message);
            return res
                .status(403)
                .json({ auth: false, message: "Falha na autenticação do Token. Token inválido ou expirado." });
        }

        // Token válido: injeta dados do usuário e avança
        req.userId = decoded.id;
        req.user = { tipo: decoded.tipo.toLowerCase() };

        next();
    });
}

module.exports = verifyJWT;