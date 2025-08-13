const connect = require("../db/connect");

module.exports = function getHorariosSala(id_sala, data) {
  return new Promise((resolve, reject) => {
    const query = `CALL getHorariosSala(?,?)`;
    connect.query(query, [id_sala, data], (err, results) => {
      if (err){
        return reject({ error: "Erro ao buscar salas"});
      }
      
      const Indisponiveis = results[0].map((item) => ({
        id_reserva: item.id_reserva,
        nomeUsuario: item.nomeUsuario,
        inicio: item.horarioInicio.toString().slice(0, 5),
        fim: item.horarioFim.toString().slice(0, 5),
      }));

      const Disponiveis = results[1].map((item) => ({
        inicio: item.horarioInicio.toString().slice(0, 5),
        fim: item.horarioFim.toString().slice(0, 5),
      }));

      resolve({
        Indisponiveis,
        Disponiveis,
      });
    });
  });
};