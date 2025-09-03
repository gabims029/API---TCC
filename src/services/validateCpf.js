const connect = require("../db/connect");

module.exports = async function validateCpf(cpf, userId = null) {
  return new Promise((resolve, reject) => {
    const query = "SELECT id_user FROM user WHERE cpf = ?";
    const values = [cpf];

    if (!validarCPF(cpf)) {
      resolve({ error: "Informe um CPF válido" });
      return;
    }

    connect.query(query, values, (err, results) => {
      if (err) {
        reject("Erro ao verificar CPF");
      } else if (results.length > 0) {
        const idCpfCadastrado = results[0].id_user;

        // Se o CPF pertence a outro usuário, retorna erro
        if (!userId || Number(idCpfCadastrado) !== Number(userId)) {
          resolve({ error: "CPF já cadastrado para outro usuário" });
        } else {
          resolve(null); // CPF é do próprio usuário → ok
        }
      } else {
        resolve(null); // CPF não existe → ok
      }
    });
  });
};

function validarCPF(cpf) {
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
