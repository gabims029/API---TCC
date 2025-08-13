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
  
    return null; // Retorna null se não houver erro
  };
  
  