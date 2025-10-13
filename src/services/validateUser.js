module.exports = function validateUser({
    cpf,
    email,
    senha,
    nome,
  }) {
    if (!cpf || !email || !senha || !nome) {
      return { error: "Todos os campos devem ser preenchidos" };
    }
  
    if (isNaN(cpf) || cpf.length !== 11) {
      return {
        error: "CPF inválido. Deve conter exatamente 11 dígitos numéricos",
      };
    }
  
    if (!email.includes("@")) {
      return { error: "Email inválido. Deve conter @" };
    }

     if (!email.endsWith("@docente.senai.br")) {
    return { error: "O email deve terminar com @docente.senai.br" };
  }
  
    return null; // Retorna null se não houver erro
  };