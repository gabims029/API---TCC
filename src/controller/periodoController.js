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
      // 400 Bad Request
      console.error("ERRO 400: Parâmetros data ou idSala ausentes.");
      return res.status(400).json({ error: "Informe data e idSala" });
    }
  
    const queryPeriodos = `SELECT * FROM periodo`; 
  
    try {
      connect.query(queryPeriodos, (err, periodos) => {
        
        // *** VERIFICAÇÃO DE ERRO PRINCIPAL AQUI ***
        if (err) {
          // 500 Internal Server Error
          console.error("ERRO 500 na queryPeriodos:", err);
          return res.status(500).json({ error: "Erro ao buscar períodos" });
        }
  
        console.log("Periodos carregados com sucesso. Total:", periodos.length);
        
        if (!periodos || periodos.length === 0) {
          // 404 Not Found (Ocorre se a tabela está vazia)
          console.warn("AVISO 404: Tabela 'periodo' está vazia.");
          return res.status(404).json({ error: "Período não encontrado" });
        }
  
        // ... o resto do código continua igual
        const queryReservas = `
          SELECT fk_id_periodo
          FROM reserva
          WHERE fk_id_sala = ?
            AND ? BETWEEN data_inicio AND data_fim
        `;
  
        connect.query(queryReservas, [idSala, data], (err, reservas) => {
          if (err) {
            console.error("ERRO 500 na queryReservas:", err);
            return res.status(500).json({ error: "Erro ao buscar reservas" });
          }
          
          // ... finaliza a resposta
          const reservados = new Set(reservas.map((r) => r.fk_id_periodo));
          const response = periodos.map((p) => ({
            id_periodo: p.id_periodo,
            horario_inicio: p.horario_inicio,
            horario_fim: p.horario_fim,
            status: reservados.has(p.id_periodo) ? "reservado" : "livre",
          }));
          
          return res.status(200).json({ periodos: response });
        });
      });
    } catch (error) {
      console.error("ERRO DE EXECUÇÃO:", error);
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
