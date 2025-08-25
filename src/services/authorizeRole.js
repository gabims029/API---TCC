
function authorizeRole(role) {
  return (req, res, next) => {
    if (req.userTipo !== role) {
      return res.status(403).json({ error: "Acesso negado: Você não acesso á essa atividade" });
    }
    next();
  };
}

module.exports = authorizeRole;
