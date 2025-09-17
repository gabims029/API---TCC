const connect = require("../db/connect");
const splitDaysSchedule = require("../services/splitDaysSchedule");
const validateReserva = require("../services/validateReserva");

const queryAsync = (query, values) => {
  return new Promise((resolve, reject) => {
    connect.query(query, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

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
    //Create Reserva
//Create Reserva
static async createReserva(req, res) {
  const { fk_id_periodo, fk_id_user, fk_id_sala, dias, data_inicio, data_fim } =
    req.body;

  console.log(req.body);

  // valida campos obrigatórios
  if (!fk_id_periodo || !fk_id_user || !fk_id_sala || !dias || !data_inicio || !data_fim) {
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  }

  // garantir que dias seja array
  if (!Array.isArray(dias) || dias.length === 0) {
    return res.status(400).json({ error: "O campo 'dias' deve ser um array com ao menos 1 dia" });
  }

  // string que será salva no banco (ex: "Seg,Qua,Sex")
  const diasString = dias.map(d => String(d).trim()).join(",");

  // validação com seu serviço (se ele espera string, passe diasString)
  const validation = validateReserva({
    fk_id_periodo,
    fk_id_user,
    fk_id_sala,
    dias: diasString,
    data_inicio,
    data_fim,
  });

  if (validation) {
    return res.status(400).json(validation);
  }

  try {
    // Verifica usuário
    const usuario = await queryAsync(
      "SELECT id_user FROM user WHERE id_user = ?",
      [fk_id_user]
    );
    if (usuario.length === 0) {
      return res.status(400).json({ error: "Usuário não encontrado" });
    }

    // Verifica sala
    const sala = await queryAsync(
      "SELECT id_sala FROM sala WHERE id_sala = ?",
      [fk_id_sala]
    );
    if (sala.length === 0) {
      return res.status(400).json({ error: "Sala não encontrada" });
    }

    // Verifica conflito (sobreposição de horários) para cada dia do array
    const conflitoQuery = `
      SELECT id_reserva FROM reserva
      WHERE fk_id_sala = ? AND FIND_IN_SET(?, dias) > 0
        AND (data_inicio < ? AND data_fim > ?)
    `;

    for (const dia of dias) {
      const conflito = await queryAsync(conflitoQuery, [
        fk_id_sala,
        dia,
        data_fim,    // new_end
        data_inicio, // new_start
      ]);

      if (conflito.length > 0) {
        return res.status(400).json({
          error: `A sala já está reservada no dia ${dia} nesse intervalo de horário.`,
        });
      }
    }

    // Inserir reserva
    const insertQuery = `
      INSERT INTO reserva (fk_id_periodo, fk_id_user, fk_id_sala, dias, data_inicio, data_fim)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [fk_id_periodo, fk_id_user, fk_id_sala, diasString, data_inicio, data_fim];

    const result = await queryAsync(insertQuery, values);

    return res.status(201).json({
      message: "Reserva criada com sucesso",
      id_reserva: result.insertId,
    });
  } catch (error) {
    console.error("Erro ao criar reserva:", error);
    return res.status(500).json({
      error: "Erro ao criar reserva",
      detalhe: error.message || error,
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
      INNER JOIN user u ON r.fk_id_user = u.id_user
      INNER JOIN sala s ON r.fk_id_sala = s.id_sala
      WHERE r.fk_id_sala = ?
    `;

    try {
      const results = await queryAsync(query, [classroomID]);
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
      SELECT r.*, s.numero AS salaNome, u.nome AS nomeUsuario
      FROM reserva r
      JOIN user u ON r.fk_id_user = u.id_user
      JOIN sala s ON r.fk_id_sala = s.id_sala
      WHERE u.cpf = ?
    `;

    try {
      const results = await queryAsync(query, [userCPF]);

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

      results.forEach((reserva) => {
        const diasSemana = reserva.dias.split(","); // Ex: ["Seg", "Qua"]

        diasSemana.forEach((dia) => {
          if (schedulesByDay[dia]) {
            schedulesByDay[dia].push({
              id: reserva.id_reserva,
              nome: reserva.nomeUsuario,
              classroomName: reserva.salaNome,
              horaInicio: reserva.data_inicio,
              horaFim: reserva.data_fim,
            });
          }
        });
      });

      return res.status(200).json({ schedule: schedulesByDay });
    } catch (error) {
      console.log("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getAllSchedules(req, res) {
    try {
      const query = `
        SELECT r.*, u.nome AS nomeUsuario, s.numero AS salaNome
        FROM reserva r
        JOIN user u ON r.fk_id_user = u.id_user
        JOIN sala s ON r.fk_id_sala = s.id_sala
      `;

      const results = await queryAsync(query);
      const schedulesByDay = splitDaysSchedule(results);
      return res.status(200).json({ schedulesByDay });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async deleteSchedule(req, res) {
    const reservaId = req.params.id;
    const query = `DELETE FROM reserva WHERE id_reserva = ?`;

    try {
      const result = await queryAsync(query, [reservaId]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Reserva não encontrada" });
      }

      return res
        .status(200)
        .json({ message: "Reserva excluída com ID: " + reservaId });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
};

// Função auxiliar que formata os campos de data e horário de uma reserva
function reservaFormat(reserva) {
  return {
    ...reserva,
    dias:
      reserva.dias instanceof Date
        ? reserva.dias.toISOString().split("T")[0]
        : reserva.dias,
    horarioInicio:
      reserva.data_inicio instanceof Date
        ? reserva.data_inicio.toISOString().split("T")[1].split(".")[0]
        : reserva.data_inicio,
    horarioFim:
      reserva.data_fim instanceof Date
        ? reserva.data_fim.toISOString().split("T")[1].split(".")[0]
        : reserva.data_fim,
  };
}
