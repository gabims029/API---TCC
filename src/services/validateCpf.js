const connect = require("../db/connect");

module.exports = async function validateCpf(cpf, userId = null) {
  return new Promise((resolve, reject) => {

    if (!validarCPF(cpf)) {
      return resolve({ error: "Informe um CPF valido" });
    }

    const query = "SELECT id_user FROM user WHERE cpf = ?";
    connect.query(query, [cpf], (err, results) => {
      if (err) return reject("Erro ao verificar CPF");

      if (results.length > 0) {
        const idCadastrado = results[0].id_user;

        if (userId && idCadastrado !== Number(userId)) {
          return resolve({ error: "CPF já cadastrado para outro usuário" });
        } else if (!userId) {
          return resolve({ error: "CPF já cadastrado" });
        }

      }

      resolve(null);
    });
  });
};

function validarCPF(cpf) {

  cpf = cpf.replace(/[^\d]+/g, "");

  cpf = cpf.replace(/[^\d]+/g, '');

  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  const calcularDigito = (base, pesoInicial) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += parseInt(base[i]) * (pesoInicial - i);
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiroDigito = calcularDigito(cpf.substring(0, 9), 10);
  const segundoDigito = calcularDigito(cpf.substring(0, 9) + primeiroDigito, 11);

  return (
    parseInt(cpf[9]) === primeiroDigito &&
    parseInt(cpf[10]) === segundoDigito
  );
}
