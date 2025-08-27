function authorizeRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.tipo.toLowerCase() !== role.toLowerCase()) {
      return res
        .status(403)
        .json({ error: "Acesso negado: Você não tem acesso a essa atividade" });
    }
    next();
  };
}

module.exports = authorizeRole;
