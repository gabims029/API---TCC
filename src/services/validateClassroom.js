module.exports = function validateClassroom({
    numero,
    descricao,
    capacidade,
  }) {
    if (!numero || !descricao || !capacidade) {
      return { error: "Todos os campos devem ser preenchidos" };
    }
  
    return null; // Retorna null se não houver erro
  };
  
  