const connect = require("../db/connect");

// A função validateCpf agora será o módulo exportado
module.exports = async function validateCpf(cpf, userId = null) {
  // ⚠️ CRUCIAL: Limpa o CPF ANTES de qualquer uso posterior
  const cpfLimpo = cpf ? cpf.replace(/[^\d]+/g, "") : ''; 

  return new Promise((resolve, reject) => {

    if (!validarCPF(cpfLimpo)) { // Chama validarCPF com o CPF JÁ LIMPO
      return resolve({ error: "Informe um CPF valido" });
    }

    // 1. Lógica de Checagem de Duplicidade
    let query = "SELECT id_user, cpf FROM user WHERE cpf = ?";
    let params = [cpfLimpo]; // 🛑 USA O CPF LIMPO NA CONSULTA

    connect.query(query, params, (err, results) => {
      if (err) {
        console.error("Erro ao verificar CPF no banco de dados:", err);
        return reject({ error: "Erro interno ao verificar CPF" });
      }

      if (results.length > 0) {
        const idCadastrado = results[0].id_user;
        
        // Se estivermos atualizando E o ID do CPF encontrado não for o nosso
        if (userId && idCadastrado !== Number(userId)) { 
          return resolve({ error: "CPF já cadastrado para outro usuário" });
        } 
        // Se estivermos criando (sem userId)
        else if (!userId) { 
          return resolve({ error: "CPF já cadastrado" });
        }
      }

      resolve(null); // CPF válido e não duplicado (ou é o próprio usuário)
    });
  });
};

function validarCPF(cpfLimpo) {
  // A string 'cpfLimpo' já deve estar limpa (apenas números)

  if (cpfLimpo.length !== 11 || /^(\d)\1{10}$/.test(cpfLimpo)) return false;

  const calcularDigito = (base, pesoInicial) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += parseInt(base[i]) * (pesoInicial - i);
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiroDigito = calcularDigito(cpfLimpo.substring(0, 9), 10);
  const segundoDigito = calcularDigito(cpfLimpo.substring(0, 9) + primeiroDigito, 11);

  return (
    parseInt(cpfLimpo[9]) === primeiroDigito &&
    parseInt(cpfLimpo[10]) === segundoDigito
  );
}