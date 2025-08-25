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

        return res.status(200).json({ message: "Período excluído com sucesso" });
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }
};
