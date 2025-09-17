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

module.exports = class scheduleController {
  static async createSchedule(req, res) {
    const { data_inicio, data_fim, dias, fk_id_user, fk_id_sala, fk_id_periodo } =
      req.body;
    // Verificar se todos os campos estão preenchidos
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

    // Caso 'days' seja uma string, use-a diretamente
    let diasString;
    if (typeof dias === "string") {
      diasString = dias; // Se já for uma string com os dias separados por vírgula
    } else if (Array.isArray(dias)) {
      // Caso 'days' seja um array, transforme-o em uma string
      diasString = dias.join(", ");
    }
    // Verificar se o tempo está dentro do intervalo permitido
    const isWithinTimeRange = (time) => {
      const [hours, minutes] = time.split(":").map(Number);
      const totalMinutes = hours * 60 + minutes;
      return totalMinutes >= 7.5 * 60 && totalMinutes <= 23 * 60;
    };

    // Verificar se o tempo de início e término está dentro do intervalo permitido
    if (!isWithinTimeRange(timeStart) || !isWithinTimeRange(timeEnd)) {
      return res.status(400).json({
        error:
          "A sala de aula só pode ser reservada dentro do intervalo de 7:30 às 23:00",
      });
    }

    try {
      const overlapQuery = `
    SELECT * FROM reserva
    WHERE 
        fk_id_sala = '${fk_id_sala}'
        AND (
            (data_inicio <= '${data_fim}' AND data_fim >= '${data_inicio}')
        )
       
        AND (
            (dias LIKE '%Seg%' AND '${diasString}' LIKE '%Seg%') OR
            (dias LIKE '%Ter%' AND '${diasString}' LIKE '%Ter%') OR
            (dias LIKE '%Qua%' AND '${diasString}' LIKE '%Qua%') OR 
            (dias LIKE '%Qui%' AND '${diasString}' LIKE '%Qui%') OR
            (dias LIKE '%Sex%' AND '${diasString}' LIKE '%Sex%') OR
            (dias LIKE '%Sab%' AND '${diasString}' LIKE '%Sab%')
        )`;

      connect.query(overlapQuery, function (err, results) {
        if (err) {
          console.log(err);
          return res
            .status(500)
            .json({ error: "Erro ao verificar agendamento existente" });
        }

        // Se a consulta retornar algum resultado, significa que já existe um agendamento
        if (results.length > 0) {
          return res.status(400).json({
            error:
              "Já existe um agendamento para os mesmos dias, sala e horários",
          });
        }

        // Caso contrário, prossegue com a inserção na tabela
        const insertQuery = `
                INSERT INTO schedule (data_inicio, data_fim, dias, fk_id_user, fk_id_sala, fk_id_periodo)
                VALUES (
                    '${data_inicio}',
                    '${data_fim}',
                    '${dias}',
                    '${fk_id_user}',
                    '${fk_id_sala}',
                    '${fk_id_periodo}'
                    
                )
            `;

        // Executa a consulta de inserção
        connect.query(insertQuery, function (err) {
          if (err) {
            console.log(err);
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
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getSchedulesByIdClassroomRanges(req, res) {
    const classroomID = req.params.id;
    const { weekStart, weekEnd } = req.query; // Variavel para armazenar a semana selecionada
    console.log(weekStart + " " + weekEnd);
    // Consulta SQL para obter todos os agendamentos para uma determinada sala de aula
    const query = `
    SELECT reserva.*, fk_id_user.nome AS userName
    FROM reserva
    JOIN user ON reserva.fk_id_user = user.id
    WHERE fk_id_sala = '${classroomID}'
    AND (data_inicio <= '${weekEnd}' AND data_fim >= '${weekStart}')
`;

    try {
      // Executa a consulta
      connect.query(query, function (err, results) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        // Objeto para armazenar os agendamentos organizados por dia da semana e intervalo de horário
        const schedulesByDayAndTimeRange = {
          Seg: {
            "07:30 - 09:30": [],
            "09:30 - 11:30": [],
            "12:30 - 15:30": [],
            "15:30 - 17:30": [],
            "19:00 - 22:00": [],
          },
          Ter: {
            "07:30 - 09:30": [],
            "09:30 - 11:30": [],
            "12:30 - 15:30": [],
            "15:30 - 17:30": [],
            "19:00 - 22:00": [],
          },
          Qua: {
            "07:30 - 09:30": [],
            "09:30 - 11:30": [],
            "12:30 - 15:30": [],
            "15:30 - 17:30": [],
            "19:00 - 22:00": [],
          },
          Qui: {
            "07:30 - 09:30": [],
            "09:30 - 11:30": [],
            "12:30 - 15:30": [],
            "15:30 - 17:30": [],
            "19:00 - 22:00": [],
          },
          Sex: {
            "07:30 - 09:30": [],
            "09:30 - 11:30": [],
            "12:30 - 15:30": [],
            "15:30 - 17:30": [],
            "19:00 - 22:00": [],
          },
          Sab: {
            "07:30 - 09:30": [],
            "09:30 - 11:30": [],
            "12:30 - 15:30": [],
            "15:30 - 17:30": [],
            "19:00 - 22:00": [],
          },
        };

        // Organiza os agendamentos pelos dias da semana e intervalo de horário
        splitDaysSchedule;
        results.forEach((reserva) => {
          const dias = reserva.dias.split(", ");
          const timeRanges = [
            "07:30 - 09:30",
            "09:30 - 11:30",
            "12:30 - 15:30",
            "15:30 - 17:30",
            "19:00 - 22:00",
          ];
          days.forEach((dia) => {
            timeRanges.forEach((timeRange) => {
              if (isInTimeRange(resrva.fk_id_periodo, timeRange)) {
                schedulesByDayAndTimeRange[day][timeRange].push(schedule);
              }
            });
          });
        });

        // Ordena os agendamentos dentro de cada lista com base no timeStart
        Object.keys(schedulesByDayAndTimeRange).forEach((day) => {
          Object.keys(schedulesByDayAndTimeRange[day]).forEach((timeRange) => {
            schedulesByDayAndTimeRange[day][timeRange].sort((a, b) => {
              const timeStartA = new Date(`1970-01-01T${a.timeStart}`);
              const timeStartB = new Date(`1970-01-01T${b.timeStart}`);
              return timeStartA - timeStartB;
            });
          });
        });

        // Retorna os agendamentos organizados por dia da semana e intervalo de horário
        return res.status(200).json({ schedulesByDayAndTimeRange });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getSchedulesByIdClassroom(req, res) {
    const classroomID = req.params.id;

    const query = `
      SELECT schedule.*, user.name AS userName
      FROM schedule
      JOIN user ON schedule.user = user.cpf
      WHERE classroom = ?
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
