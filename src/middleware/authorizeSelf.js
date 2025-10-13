function authorizeSelf(req, res, next) {
    const userIdFromParams = req.params.id;  // Captura o ID da URL
    const loggedInUserId = req.user.id;  // Captura o ID do usuário autenticado via JWT
  
    // Se os IDs não coincidirem, bloqueia a ação
    if (Number(userIdFromParams) !== Number(loggedInUserId)) {
      return res.status(403).json({ error: "Usuário não autorizado a atualizar este perfil" });
    }
  
    next(); // Permite a continuação do fluxo da requisição
  }
  
  module.exports = authorizeSelf;
  