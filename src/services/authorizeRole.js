function authorizeRole(role) {
  return (req, res, next) => {
    if ((req.user?.tipo || "").toLowerCase() !== role.toLowerCase()) {
      return res.status(403).json({ error: "Acesso negado: Você não tem permissão" });
    }
    next();
  };
}

module.exports = authorizeRole;