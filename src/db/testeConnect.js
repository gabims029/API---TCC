const connect = require("./connect");

module.exports = async function testConnect() {
  try {
    const [rows] = await connect.query(
      "SELECT 'Conexão bem-sucedida' AS Mensagem"
    );

    console.log("Conexão realizada com MySQL:", rows[0].Mensagem);
  } catch (err) {
    console.error("Erro ao executar a consulta:", err);
  }
};
