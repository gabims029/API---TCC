const connect = require("../db/connect");

module.exports = function listarReservasPorUsuario(id_usuario) {
  return new Promise((resolve, reject) => {
    const query = `CALL ListarReservasPorUsuario(?)`;
    connect.query(query, [id_usuario], (err, results) => {
      if (err){
        return reject({ error: "Erro ao listar reservas"});
      }
      return resolve(results[0]);
    });
  });
};