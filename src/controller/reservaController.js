const connect = require("../db/connect");
const splitDaysSchedule = require("../services/splitDaysSchedule");

// Verificar se o horário de início de um agendamento está dentro de um intervalo de tempo
function isInTimeRange(timeStart, timeRange) {
  const [start, end] = timeRange.split(" - ");
  const startTime = new Date(`1970-01-01T${start}`).getTime();
  const endTime = new Date(`1970-01-01T${end}`).getTime();
  const scheduleTime = new Date(`1970-01-01T${timeStart}`).getTime();
  return scheduleTime >= startTime && scheduleTime < endTime;
}


module.exports = class ControllerReserva {
  //Create Reserva
  static async createReserva(req, res) {
    const { fk_id_periodo, fk_id_user, fk_id_sala, dias, data_inicio, data_fim } =
    req.body;
      console.log(req.body)

    const validation = validateReserva({
      fk_id_periodo,
      fk_id_user,
      fk_id_sala,
      dias,
      data_inicio,
      data_fim,
    });

    if (validation) {
      return res.status(400).json(validation);
    }

    try {
      const usuario = await queryAsync(
        "SELECT id_user FROM user WHERE id_user = ?",
        [fk_id_user]
      );
      if (usuario.length === 0) {
        return res.status(400).json({ error: "Usuário não encontrado" });
      }

      const sala = await queryAsync(
        "SELECT id_sala FROM sala WHERE id_sala = ?",
        [fk_id_sala]
      );
      if (sala.length === 0) {
        return res.status(400).json({ error: "Sala não encontrada" });
      }

      const conflito = await queryAsync(
        `
        SELECT id_reserva FROM reserva
        WHERE fk_id_sala = ? AND dias = ? AND (
          (data_inicio < ? AND data_fim > ?) OR
          (data_inicio < ? AND data_fim > ?) OR
          (data_inicio >= ? AND data_inicio < ?) OR
          (data_fim > ? AND data_fim <= ?)
        )
      `,
        [
          fk_id_sala,
          dias,
          data_inicio,
          data_inicio,
          data_inicio,
          data_fim,
          data_inicio,
          data_fim,
          data_inicio,
          data_fim,
        ]
      );

      if (conflito.length > 0) {
        return res
          .status(400)
          .json({ error: "A sala já está reservada neste dia e horário." });
      }

      const query = `
        INSERT INTO reserva (fk_id_periodo, fk_id_user, fk_id_sala, dias, data_inicio, data_fim)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const values = [fk_id_periodo, fk_id_user, fk_id_sala, dias, data_inicio, data_fim];

      const result = await queryAsync(query, values);

      return res.status(201).json({
        message: "Reserva criada com sucesso",
        id_reserva: result.insertId,
      });
    } catch (error) {
      console.error("Erro ao criar reserva:", error); // já imprime no terminal
      return res.status(500).json({ 
        error: "Erro ao criar reserva", 
        detalhe: error.message || error 
      });
    }
  }

  //Update Reserva
  static async updateReserva(req, res) {
    const { dias, data_inicio, data_fim } = req.body;
    const reservaId = req.params.id_reserva;

    const validation = validateReserva({
      fk_id_user: 1,
      fk_id_sala: 1,
      dias,
      data_inicio,
      data_fim,
    });

    if (validation) {
      return res.status(400).json(validation);
    }

    try {
      const reservaExistente = await queryAsync(
        "SELECT fk_id_sala FROM reserva WHERE id_reserva = ?",
        [reservaId]
      );

      if (reservaExistente.length === 0) {
        return res.status(404).json({ error: "Reserva não encontrada" });
      }

      const { fk_id_sala } = reservaExistente[0];

      const conflito = await queryAsync(
        `
        SELECT id_reserva FROM reserva
        WHERE fk_id_sala = ? AND dias = ? AND id_reserva != ? AND (
          (data_inicio < ? AND data_fim > ?) OR
          (data_inicio < ? AND data_fim > ?) OR
          (data_inicio >= ? AND data_inicio < ?) OR
          (data_fim > ? AND data_fim <= ?)
        )
        `,
        [
          fk_id_sala,
          dias,
          reservaId,
          data_inicio,
          data_inicio,
          data_inicio,
          data_fim,
          data_inicio,
          data_fim,
          data_inicio,
          data_fim,
        ]
      );

      if (conflito.length > 0) {
        return res
          .status(400)
          .json({ error: "A sala já está reservada neste dia e horário." });
      }

      await queryAsync(
        `
        UPDATE reserva 
        SET dias = ?, data_inicio = ?, data_fim = ?
        WHERE id_reserva = ?
        `,
        [dias, data_inicio, data_fim, reservaId]
      );

      return res
        .status(200)
        .json({ message: "Reserva atualizada com sucesso" });

    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getSchedulesByIdClassroom(req, res) {
    const classroomID = req.params.id;

    const query = `

      SELECT r.id_reserva, r.fk_id_user, r.fk_id_sala, r.dias, r.data_inicio, r.data_fim, 
      u.nome AS nomeUsuario, s.numero AS salaNome
      FROM reserva r
      INNER JOIN usuario u ON r.fk_id_user = u.id_user
      INNER JOIN sala s ON r.fk_id_sala = s.id_sala

    `;

    try {
      const results = await new Promise((resolve, reject) => {
        connect.query(query, [classroomID], (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });

      const schedulesByDay = splitDaysSchedule(results);
      return res.status(200).json({ schedulesByDay });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getSchedulesByUserCPF(req, res) {
    const userCPF = req.params.cpf;

    console.log("CPF: ", userCPF);

    const query = `
      SELECT schedule.*, classroom.number AS classroomName, user.name AS userName
      FROM schedule
      JOIN user ON schedule.user = user.cpf
      JOIN classroom ON schedule.classroom = classroom.number
      WHERE schedule.user = ?
    `;

    try {
      connect.query(query, [userCPF], function (err, results) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (results.length === 0) {
          return res
            .status(404)
            .json({ error: "Nenhuma reserva encontrada para esse usuário" });
        }

        const schedulesByDay = {
          Seg: [],
          Ter: [],
          Qua: [],
          Qui: [],
          Sex: [],
          Sab: [],
        };

        results.forEach((schedule) => {
          const diasSemana = schedule.days.split(","); // Ex: ["Seg", "Qua"]

          diasSemana.forEach((dia) => {
            if (schedulesByDay[dia]) {
              schedulesByDay[dia].push({
                id: schedule.id,
                nome: schedule.userName,
                classroomName: schedule.classroomName,
                horaInicio: schedule.timeStart,
                horaFim: schedule.timeEnd,
              });
            }
          });
        });

        return res.status(200).json({ schedule: schedulesByDay });
      });
    } catch (error) {
      console.log("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getAllSchedules(req, res) {
    try {
      // Consulta SQL para obter todos os agendamentos
      const query = `
      SELECT schedule.*, user.name AS userName
      FROM schedule
      JOIN user ON schedule.user = user.cpf
    `;

      const results = await new Promise((resolve, reject) => {
        connect.query(query, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      });

      const schedulesByDay = splitDaysSchedule(results);
      return res.status(200).json({ schedulesByDay });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async deleteSchedule(req, res) {
    const scheduleId = req.params.id;
    const query = `DELETE FROM schedule WHERE id = ?`;
    const values = [scheduleId];

    try {
      connect.query(query, values, function (err, results) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (results.affectedRows === 0) {
          return res.status(404).json({ error: "Agendamento não encontrado" });
        }

        return res
          .status(200)
          .json({ message: "Agendamento excluído com ID: " + scheduleId });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
};


// Função auxiliar que formata os campos de data e horário de uma reserva
function reservaFormat(reserva) {
  // Se o campo 'dias' for do tipo Date, converte para o formato YYYY-MM-DD
  if (reserva.dias instanceof Date) {
    reserva.dias = reserva.dias.toISOString().split("T")[0]; // Pega apenas a parte da data
  }

  // Se o campo 'dataInicio' for Date, extrai apenas o horário no formato HH:MM:SS
  if (reserva.data_inicio instanceof Date) {
    reserva.horarioInicio = reserva.data_inicio
      .toISOString()
      .split("T")[1]
      .split(".")[0]; // Pega apenas a parte de horário
  }

  // Mesmo processo para 'dataFim'
  if (reserva.data_fim instanceof Date) {
    reserva.data_fim = reserva.data_fim
      .toISOString()
      .split("T")[1]
      .split(".")[0]; // Pega apenas a parte de horário
  }

  // Retorna o objeto reserva com os campos formatados
  return reserva;
}

