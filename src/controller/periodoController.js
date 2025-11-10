const connect = require("../db/connect");

module.exports = class periodoController {
  // Criar período
  static async createPeriodo(req, res) {
    const { horario_inicio, horario_fim } = req.body;

    if (!horario_inicio || !horario_fim) {
      return res
        .status(400)
        .json({ error: "Horário de início e fim são obrigatórios" });
    }

    try {
      const query = `INSERT INTO periodo (horario_inicio, horario_fim) VALUES (?, ?)`;
      connect.query(query, [horario_inicio, horario_fim], (err, result) => {
        if (err) {
          console.error("Erro ao criar período:", err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        return res.status(201).json({
          message: "Período criado com sucesso",
          periodoId: result.insertId,
        });
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  // Listar todos os períodos
  static async getAllPeriodos(req, res) {
    const query = `SELECT * FROM periodo`;

    try {
      connect.query(query, (err, results) => {
        if (err) {
          console.error("Erro ao obter períodos:", err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        return res.status(200).json({ periodos: results });
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  // Buscar período por ID
  static async getPeriodoById(req, res) {
    const { id } = req.params;
    const query = `SELECT * FROM periodo WHERE id_periodo = ?`;

    try {
      connect.query(query, [id], (err, results) => {
        if (err) {
          console.error("Erro ao buscar período:", err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "Período não encontrado" });
        }

        return res.status(200).json({ periodo: results[0] });
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  // Atualizar período
  static async updatePeriodo(req, res) {
    const { id } = req.params;
    const { horario_inicio, horario_fim } = req.body;

    if (!horario_inicio || !horario_fim) {
      return res
        .status(400)
        .json({ error: "Horário de início e fim são obrigatórios" });
    }

    const query = `UPDATE periodo SET horario_inicio = ?, horario_fim = ? WHERE id_periodo = ?`;

    try {
      connect.query(query, [horario_inicio, horario_fim, id], (err, result) => {
        if (err) {
          console.error("Erro ao atualizar período:", err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Período não encontrado" });
        }

        return res
          .status(200)
          .json({ message: "Período atualizado com sucesso" });
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  static async getPeriodoStatus(req, res) {
    const { data, idSala } = req.query;
  
    if (!data || !idSala) {
      return res.status(400).json({ error: "Informe data e idSala" });
    }
  
    const queryPeriodos = `SELECT * FROM periodo`;
  
    try {
      // Buscar todos os períodos
      connect.query(queryPeriodos, (err, periodos) => {
        if (err) {
          console.error("Erro ao buscar períodos:", err);
          return res.status(500).json({ error: "Erro ao buscar períodos" });
        }
  
        if (!periodos || periodos.length === 0) {
          return res.status(404).json({ error: "Nenhum período encontrado" });
        }
  
        //  Buscar reservas + nome do usuário
        const queryReservas = `
          SELECT r.fk_id_periodo, u.nome AS nome_usuario
          FROM reserva r
          JOIN user u ON r.fk_id_user = u.id_user
          WHERE r.fk_id_sala = ?
            AND ? BETWEEN r.data_inicio AND r.data_fim
        `;
  
        connect.query(queryReservas, [idSala, data], (err, reservas) => {
          if (err) {
            console.error("Erro ao obter reservas:", err);
            return res.status(500).json({ error: "Erro ao buscar reservas" });
          }
  
          // Cria um map com { id_periodo: nome_usuario }
          const reservasMap = new Map(
            reservas.map((r) => [r.fk_id_periodo, r.nome_usuario])
          );
  
          // Monta o retorno final
          const response = periodos.map((p) => ({
            id_periodo: p.id_periodo,
            horario_inicio: p.horario_inicio,
            horario_fim: p.horario_fim,
            status: reservasMap.has(p.id_periodo) ? "reservado" : "livre",
            usuario: reservasMap.get(p.id_periodo) || null,
          }));
  
          return res.status(200).json({ periodos: response });
        });
      });
    } catch (error) {
      console.error("Erro interno:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  

  // Deletar período
  static async deletePeriodo(req, res) {
    const { id } = req.params;
    const query = `DELETE FROM periodo WHERE id_periodo = ?`;

    try {
      connect.query(query, [id], (err, result) => {
        if (err) {
          console.error("Erro ao deletar período:", err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Período não encontrado" });
        }

        return res
          .status(200)
          .json({ message: "Período excluído com sucesso" });
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }
};
