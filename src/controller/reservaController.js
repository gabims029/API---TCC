// Importações necessárias
const connect = require("../db/connect");
const validateReserva = require("../services/validateReserva");
const listarReservasPorUsuario = require("../services/listarReservasPorUsuario"); //Procedure
const getHorariosSala = require("../services/getHorariosSala"); //Procedure

// Função auxiliar para usar Promises com consultas SQL
const queryAsync = (query, values) => {
  return new Promise((resolve, reject) => {
    connect.query(query, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

module.exports = class ControllerReserva {
  //Create Reserva
  static async createReserva(req, res) {
    const { fk_id_periodo, fk_id_user, fk_id_sala, dias, dataInicio, dataFim } =
    req.body;
      console.log(req.body)

    const validation = validateReserva({
      fk_id_periodo,
      fk_id_user,
      fk_id_sala,
      dias,
      dataInicio,
      dataFim,
    });

    if (validation) {
      return res.status(400).json(validation);
    }

    try {
      const usuario = await queryAsync(
        "SELECT id_user FROM usuario WHERE id_user = ?",
        [id_user]
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
          (dataInicio < ? AND dataFim > ?) OR
          (dataInicio < ? AND dataFim > ?) OR
          (dataInicio >= ? AND dataInicio < ?) OR
          (dataFim > ? AND dataFim <= ?)
        )
      `,
        [
          fk_id_sala,
          dias,
          dataInicio,
          dataInicio,
          dataInicio,
          dataFim,
          dataInicio,
          dataFim,
          dataInicio,
          dataFim,
        ]
      );

      if (conflito.length > 0) {
        return res
          .status(400)
          .json({ error: "A sala já está reservada neste dia e horário." });
      }

      const query = `
        INSERT INTO reserva (fk_id_periodo, fk_id_user, fk_id_sala, dias, dataInicio, dataFim)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      const values = [fk_id_user, fk_id_sala, dias, dataInicio, dataFim];

      const result = await queryAsync(query, values);

      return res.status(201).json({
        message: "Reserva criada com sucesso",
        id_reserva: result.insertId,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao criar reserva" });
    }
  }

  //Update Reserva
  static async updateReserva(req, res) {
    const { dias, dataInicio, dataFim } = req.body;
    const reservaId = req.params.id_reserva;

    const validation = validateReserva({
      fk_id_user: 1,
      fk_id_sala: 1,
      dias,
      dataInicio,
      dataFim,
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
          (dataInicio < ? AND dataFim > ?) OR
          (dataInicio < ? AND dataFim > ?) OR
          (dataInicio >= ? AND dataInicio < ?) OR
          (dataFim > ? AND dataFim <= ?)
        )
        `,
        [
          fk_id_sala,
          dias,
          reservaId,
          dataInicio,
          dataInicio,
          dataInicio,
          dataFim,
          dataInicio,
          dataFim,
          dataInicio,
          dataFim,
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
        SET dias = ?, dataInicio = ?, dataFim = ?
        WHERE id_reserva = ?
        `,
        [dias, dataInicio, dataFim, reservaId]
      );

      return res
        .status(200)
        .json({ message: "Reserva atualizada com sucesso" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao atualizar reserva" });
    }
  }

  //Get Reservas
  static async getReservas(req, res) {
    const query = `
      SELECT r.id_reserva, r.fk_id_user, r.fk_id_sala, r.dias, r.dataInicio, r.dataFim, 
      u.nome AS nomeUsuario, s.numero AS salaNome
      FROM reserva r
      INNER JOIN usuario u ON r.fk_id_user = u.id_user
      INNER JOIN sala s ON r.fk_id_sala = s.id_sala
    `;

    try {
      const results = await queryAsync(query);

      const reservasFormatadas = results.map((reserva) =>
        reservaFormat(reserva)
      );

      return res
        .status(200)
        .json({ message: "Lista de Reservas", reservas: reservasFormatadas });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  //Delete Reserva
  static async deleteReserva(req, res) {
    const reservaId = req.params.id_reserva;
    const query = `DELETE FROM reserva WHERE id_reserva = ?`;

    try {
      const results = await queryAsync(query, [reservaId]);

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Reserva não encontrada" });
      }

      return res.status(200).json({ message: "Reserva excluída com sucesso" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro interno no servidor" });
    }
  }

  //Get Horarios Sala
  static async getHorariosSala(req, res) {
    const { id_sala, dias } = req.params;

    if (!id_sala || !dias) {
      return res
        .status(400)
        .json({ error: "Parâmetros 'id_sala' e 'data' são obrigatórios." });
    }

    try {
      const horarios = await getHorariosSala(id_sala, dias);
      return res.status(200).json({
        sala: id_sala,
        data,
        horarios,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erro ao obter horários da sala." });
    }
  }

  //Get Reservas Por Usuario - PROCEDURE
  static async getReservasPorUsuario(req, res) {
    const { id_user } = req.params;

    if (!id_user) {
      return res.status(400).json({ error: "ID do usuário é obrigatório." });
    }

    try {
      const reservas = await listarReservasPorUsuario(id_user);

      const reservasFormatadas = reservas.map((reserva) =>
        reservaFormat(reserva)
      );

      return res.status(200).json({
        message: `Reservas do usuário ${id_user}`,
        reservas: reservasFormatadas,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: "Erro ao buscar reservas do usuário." });
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
  if (reserva.dataInicio instanceof Date) {
    reserva.horarioInicio = reserva.dataInicio
      .toISOString()
      .split("T")[1]
      .split(".")[0]; // Pega apenas a parte de horário
  }

  // Mesmo processo para 'dataFim'
  if (reserva.dataFim instanceof Date) {
    reserva.dataFim = reserva.dataFim
      .toISOString()
      .split("T")[1]
      .split(".")[0]; // Pega apenas a parte de horário
  }

  // Retorna o objeto reserva com os campos formatados
  return reserva;
}