const connect = require("../db/connect");

module.exports = async function validateCpf(cpf, userId = null) {
  return new Promise((resolve, reject) => {
    const query = "SELECT id_user FROM user WHERE cpf = ?";
    const values = [cpf];

    if(!validarCPF(cpf)){
      resolve({ error: "Informe um CPF valido" });
    }

    connect.query(query, values, (err, results) => {
      if (err) {
        reject("Erro ao verificar CPF");
      } else if (results.length > 0) {
        const idcpfCadastrado = results[0].id_usuario;

        // Se um userId foi passado (update) e o CPF pertence a outro usuário, retorna erro
        if (userId && idcpfCadastrado !== userId) {
          resolve({ error: "CPF já cadastrado para outro usuário" });
        } else if (!userId) {
          resolve({ error: "CPF já cadastrado  " });
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
};

function validarCPF(cpf) {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]+/g, '');

  // Verifica se tem 11 dígitos ou se todos os dígitos são iguais
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  // Função auxiliar para calcular dígito verificador
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


