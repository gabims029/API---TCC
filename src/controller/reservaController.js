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
  static async createReserva(req, res) {
    const {
      fk_id_periodo,
      fk_id_user,
      fk_id_sala,
      dias,
      data_inicio,
      data_fim,
    } = req.body;


    // Campos obrigatórios
    if (
      !fk_id_periodo ||
      !fk_id_user ||
      !fk_id_sala ||
      !dias ||
      !data_inicio ||
      !data_fim
    ) {
      return res
        .status(400)
        .json({ error: "Todos os campos devem ser preenchidos" });
    }

    // Validar se data_inicio <= data_fim
    if (new Date(data_inicio) > new Date(data_fim)) {
      return res.status(400).json({
        error: "A data de início não pode ser maior que a data de fim",
      });
    }


    if (!Array.isArray(dias) || dias.length === 0) {
      return res
        .status(400)
        .json({ error: "O campo 'dias' deve ser um array com ao menos 1 dia" });
    }

    const diasArray = dias.map((d) => d.trim());
    const diasString = diasArray.join(",");

    // Validação com serviço externo
    const validation = validateReserva({
      fk_id_periodo,
      fk_id_user,
      fk_id_sala,
      dias: diasString,
      data_inicio,
      data_fim,
    });
    if (validation) return res.status(400).json(validation);

    // Verifica se a data de início e fim são no mesmo dia, mas múltiplos dias foram escolhidos
    if (
      diasArray.length > 1 &&
      new Date(data_inicio).toISOString().split("T")[0] ===
        new Date(data_fim).toISOString().split("T")[0]
    ) {
      return res.status(400).json({
        error:
          "Você escolheu múltiplos dias, mas a data de início e fim é o mesmo dia. Por favor, escolha uma data de fim diferente.",
      });
    }

    try {
      // Verifica usuário
      const usuario = await queryAsync(
        "SELECT id_user FROM user WHERE id_user = ?",
        [fk_id_user]
      );
      if (usuario.length === 0)
        return res.status(400).json({ error: "Usuário não encontrado" });

      // Verifica sala
      const sala = await queryAsync(
        "SELECT id_sala FROM sala WHERE id_sala = ?",
        [fk_id_sala]
      );
      if (sala.length === 0)
        return res.status(400).json({ error: "Sala não encontrada" });

      // Valida dias x datas
      const start = new Date(data_inicio);
      const end = new Date(data_fim);

      const diasSemanaMap = {
        0: "Dom",
        1: "Seg",
        2: "Ter",
        3: "Qua",
        4: "Qui",
        5: "Sex",
        6: "Sab",
      };

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const diaAtual = diasSemanaMap[d.getDay()];
        if (!diasArray.includes(diaAtual)) {
          return res.status(400).json({
            error: `O dia '${diaAtual}' da data ${
              d.toISOString().split("T")[0]
            } não está incluído no array 'dias'`,
          });
        }
      }

      // Verifica conflito de período
      const periodo = await queryAsync(
        "SELECT * FROM periodo WHERE id_periodo = ?",
        [fk_id_periodo]
      );
      if (periodo.length === 0)
        return res.status(400).json({ error: "Período não encontrado" });

      const { horario_inicio, horario_fim } = periodo[0];


      const conflitoQuery = `
      SELECT r.id_reserva 
      FROM reserva r
      JOIN periodo p ON r.fk_id_periodo = p.id_periodo
      WHERE r.fk_id_sala = ? AND FIND_IN_SET(?, r.dias) > 0
        AND (
          (p.horario_inicio < ? AND p.horario_fim > ?) 
          OR
          (p.horario_inicio < ? AND p.horario_fim > ?)
        )
    `;

      for (const dia of diasArray) {
        const conflito = await queryAsync(conflitoQuery, [
          fk_id_sala,
          dia,
          horario_fim,
          horario_inicio,
          horario_inicio,
          horario_fim,
        ]);
        if (conflito.length > 0) {
          return res.status(400).json({
            error: `A sala já está reservada no dia ${dia} nesse período (${horario_inicio} - ${horario_fim})`,
          });
        }
      }

      // Inserir reserva
      const insertQuery = `
      INSERT INTO reserva (fk_id_periodo, fk_id_user, fk_id_sala, dias, data_inicio, data_fim)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
      const values = [
        fk_id_periodo,
        fk_id_user,
        fk_id_sala,
        diasString,
        data_inicio,
        data_fim,
      ];
      const result = await queryAsync(insertQuery, values);

      return res.status(201).json({
        message: "Reserva criada com sucesso",
        id_reserva: result.insertId,
      });
    } catch (error) {

      console.error("Erro ao criar reserva:", error); // já imprime no terminal

      return res.status(500).json({
        error: "Erro ao criar reserva",
        detalhe: error.message || error,
      });
    }
  }

  // Update Reserva
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
        WHERE id_reserva =
 ?
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

<<<<<<< HEAD
  static async getReservasByBloco(req, res) {
  const { bloco } = req.params; // Exemplo: 'A', 'B', 'C', etc.

  const query = `
    SELECT 
      reserva.id_reserva,
      reserva.fk_id_user,
      reserva.fk_id_sala,
      reserva.dias,
      reserva.data_inicio,
      reserva.data_fim,
      user.nome AS nomeUsuario,
      sala.numero AS numeroSala,
      sala.descricao AS descricaoSala,
      sala.bloco AS blocoSala,
      periodo.horario_inicio,
      periodo.horario_fim
    FROM reserva
    JOIN user ON reserva.fk_id_user = user.id_user
    JOIN sala ON reserva.fk_id_sala = sala.id_sala
    JOIN periodo ON reserva.fk_id_periodo = periodo.id_periodo
    WHERE sala.bloco = ?
  `;

  try {
    const results = await queryAsync(query, [bloco]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Nenhuma reserva encontrada para esse bloco." });
    }

    const schedulesByDay = splitDaysSchedule(results); // Mantém sua organização existente

    return res.status(200).json({ schedulesByDay });
  } catch (error) {
    console.error("Erro ao buscar reservas por bloco:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
=======
>>>>>>> eacb7d99fbf55889b8d0f47fa1dd2ed39f1ae366

  // Nova rota para buscar as reservas por data
static async getReservasByDate(req, res) {
  const { data } = req.params;  // Data passada na URL no formato 'YYYY-MM-DD'

  const query = `
    SELECT 
      reserva.id_reserva, 
      reserva.fk_id_user, 
      reserva.fk_id_sala, 
      reserva.dias, 
      reserva.data_inicio, 
      reserva.data_fim, 
      user.nome AS nomeUsuario, 
      sala.numero AS nomeSala, 
      periodo.horario_inicio, 
      periodo.horario_fim
    FROM reserva
    JOIN user ON reserva.fk_id_user = user.id_user
    JOIN sala ON reserva.fk_id_sala = sala.id_sala
    JOIN periodo ON reserva.fk_id_periodo = periodo.id_periodo
    WHERE (reserva.data_inicio <= ? AND reserva.data_fim >= ?)
  `;

  try {
    // Buscar as reservas que incluem a data fornecida
    const results = await queryAsync(query, [data, data]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Nenhuma reserva encontrada para essa data." });
    }

    // Organizar as reservas por dias (se necessário, pode usar a função splitDaysSchedule)
    const schedulesByDay = splitDaysSchedule(results);

    return res.status(200).json({ schedulesByDay });
  } catch (error) {
    console.error("Erro ao buscar reservas por data:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

  static async getSchedulesByUserID(req, res) {
    const userId = req.params.id_user;

    console.log("ID do usuário: ", userId);

    const query = `
    SELECT 
      reserva.*, 
      sala.numero AS nomeSala, 
      sala.descricao AS descricaoSala,
      user.nome AS nomeUsuario,
      periodo.horario_inicio, 
      periodo.horario_fim
    FROM reserva
    JOIN user ON reserva.fk_id_user = user.id_user
    JOIN sala ON reserva.fk_id_sala = sala.id_sala
    JOIN periodo ON reserva.fk_id_periodo = periodo.id_periodo
    WHERE reserva.fk_id_user = ?
  `;

    try {
      connect.query(query, [userId], function (err, results) {
        if (err) {
          console.error("Erro ao buscar reservas:", err);
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
      console.log("Erro inesperado:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getAllReservas(req, res) {
    try {
      const query = `

  SELECT 
    reserva.*, 
    reserva.data_inicio, 
    reserva.data_fim, 
    user.nome AS usernome,
    CONCAT(periodo.horario_inicio, ' - ', periodo.horario_fim) AS periodo, 
    sala.capacidade
  FROM reserva
  JOIN user ON reserva.fk_id_user = user.id_user
  JOIN periodo ON reserva.fk_id_periodo = periodo.id_periodo
  JOIN sala ON reserva.fk_id_sala = sala.id_sala
`;


      const results = await queryAsync(query);

      if (!results || results.length === 0) {
        return res.status(200).json({ schedulesByDay: {} });
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
        if (!reserva.dias) return;

        const diasArray = Array.isArray(reserva.dias)
          ? reserva.dias
          : reserva.dias.split(",");

        diasArray.forEach((dia) => {
          const d = dia.trim();
          if (schedulesByDay[d]) {
            schedulesByDay[d].push({
              id: reserva.id_reserva,
              fk_id_periodo: reserva.fk_id_periodo, // adicionando fk_id_periodo
              nome: reserva.nomeUsuario,
              classroomName: reserva.salaNome,
              dataInicio: reserva.data_inicio
                ? reserva.data_inicio.toISOString().split("T")[0]
                : null,
              dataFim: reserva.data_fim
                ? reserva.data_fim.toISOString().split("T")[0]
                : null,
            });
          }
        });
      });

      return res.status(200).json({ schedulesByDay });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        detalhe: error.message,
      });
    }
  }

  static async deleteSchedule(req, res) {

    const reservaId = req.params.id_reserva; // Rota deve ter o mesmo nome!

    if (!reservaId) {
      return res.status(400).json({ error: "ID da reserva é obrigatório" });
    }

    const query = `DELETE FROM reserva WHERE id_reserva = ?`;
    const values = [reservaId];

    try {
      connect.query(query, values, function (err, results) {
        if (err) {
          console.error("Erro no DELETE:", err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }


      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Reserva não encontrada" });
      }


        return res
          .status(200)
          .json({ message: "Agendamento excluído com ID: " + reservaId });
      });

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

