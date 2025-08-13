module.exports = function validateSala({
    numero,
    descricao,
    capacidade,
    bloco
  }) {
    if (!numero || !descricao || !capacidade || !bloco) {
      return { error: "Todos os campos devem ser preenchidos" };
    }
  
    return null; // Retorna null se não houver erro
  };
  
  