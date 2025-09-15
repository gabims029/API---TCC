module.exports = class scheduleController {
  static async createSchedule(req, res) {
    const {
      data_inicio,
      data_fim,
      dias,
      fk_id_user,
      fk_id_sala,
      fk_id_periodo,
    } = req.body;

    // Verificar se todos os campos estão preenchidos
    if (
      !data_inicio ||
      !data_fim ||
      !dias ||
      !fk_id_user ||
      !fk_id_sala ||
      !fk_id_periodo
    ) {
      return res
        .status(400)
        .json({ error: "Todos os campos devem ser preenchidos" });
    }

    // Caso 'dias' seja uma string, use-a diretamente
    let daysString;
    if (typeof dias === "string") {
      daysString = dias; // Se já for uma string com os dias separados por vírgula
    } else if (Array.isArray(dias)) {
      // Caso 'dias' seja um array, transforme-o em uma string
      daysString = dias.join(", ");
    }

    try {
      // Verificar se há agendamentos conflitantes
      const overlapQuery = `
        SELECT * FROM reserva
        WHERE 
          fk_id_sala = ? 
          AND fk_id_periodo = ? 
          AND (
            (data_inicio <= ? AND data_fim >= ?)
            OR (data_inicio <= ? AND data_fim >= ?)
          )
          AND dias LIKE ?
      `;
      
      connect.query(overlapQuery, [fk_id_sala, fk_id_periodo, data_inicio, data_inicio, data_fim, data_fim, `%${daysString}%`], function (err, results) {
        if (err) {
          console.error(err);
          return res
            .status(500)
            .json({ error: "Erro ao verificar agendamento existente" });
        }

        // Se a consulta retornar algum resultado, significa que já existe um agendamento
        if (results.length > 0) {
          return res.status(400).json({
            error:
              "Já existe um agendamento para os mesmos dias, sala e períodos",
          });
        }

        // Caso contrário, prossegue com a inserção na tabela
        const insertQuery = `
          INSERT INTO reserva (data_inicio, data_fim, dias, fk_id_user, fk_id_sala, fk_id_periodo)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        connect.query(insertQuery, [data_inicio, data_fim, daysString, fk_id_user, fk_id_sala, fk_id_periodo], function (err) {
          if (err) {
            console.error(err);
            return res
              .status(500)
              .json({ error: "Erro ao cadastrar agendamento" });
          }
          console.log("Agendamento cadastrado com sucesso");
          return res
            .status(201)
            .json({ message: "Agendamento cadastrado com sucesso" });
        });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
};
