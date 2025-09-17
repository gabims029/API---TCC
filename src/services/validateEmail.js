module.exports = function validateEmail(email) {
  const dominioPermitido = "@docente.senai.br";

  if (!email.endsWith(dominioPermitido)) {
    return `O email deve terminar com ${dominioPermitido}`;
  }

  return null; // Sem erro
};