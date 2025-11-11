const connect = require("../db/connect");
const validateSala = require("../services/validateSala");

// Função para facilitar a execução de queries assíncronas (já está correta)
const queryAsync = (query, values) => {
  return new Promise((resolve, reject) => {
    connect.query(query, values, (err, results) => {
      if (err) {
        console.error("Erro na consulta SQL:", err.sqlMessage);
        return reject(err);
      }
      resolve(results);
    });
  });
};

module.exports = class salaController {
  // Criar sala (Refatorado para async/await)
  static async createSala(req, res) {
    const { numero, descricao, capacidade, bloco } = req.body;

    const validationError = validateSala(req.body);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    const query = `INSERT INTO sala (numero, descricao, capacidade, bloco) VALUES (?, ?, ?, ?)`;
    try {
      await queryAsync(query, [numero, descricao, capacidade, bloco]);
      res.status(201).json({ message: "Sala cadastrada com sucesso" });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "Número de sala já existe." });
      }
      console.error("Erro ao cadastrar sala:", error);
      res
        .status(500)
        .json({ error: "Erro interno do servidor ao cadastrar sala." });
    }
  }

  // Listar todas as salas (Refatorado para async/await)
  static async getAllSalas(req, res) {
    try {
      const query = "SELECT * FROM sala";
      const results = await queryAsync(query);
      res.status(200).json({ salas: results });
    } catch (error) {
      console.error("Erro ao obter salas:", error);
      res
        .status(500)
        .json({ error: "Erro interno do servidor ao obter salas." });
    }
  }

  // Listar salas disponíveis por data (Já estava em async/await)
  static async getSalasDisponiveisPorData(req, res) {
    const { data } = req.query;
    if (!data) {
      return res
        .status(400)
        .json({ error: "A data é obrigatória (formato: YYYY-MM-DD)" });
    }

    try {
      // Total de períodos existentes
      const totalPeriodosResult = await queryAsync(
        "SELECT COUNT(*) AS total FROM periodo"
      );
      const totalPeriodos = totalPeriodosResult[0].total;

      // Buscar todas as salas
      const salas = await queryAsync("SELECT * FROM sala");

      // Buscar quantos períodos cada sala já possui reservados na data
      const reservas = await queryAsync(
        `
       SELECT fk_id_sala, COUNT(DISTINCT fk_id_periodo) AS periodos_ocupados
       FROM reserva
       WHERE dia = ?
      GROUP BY fk_id_sala
`,
        [data]
      );

      //  Criar mapa de reservas
      const mapaReservas = {};
      reservas.forEach((r) => {
        mapaReservas[r.fk_id_sala] = r.periodos_ocupados;
      });

      //  Filtrar salas que ainda possuem pelo menos 1 período livre
      const salasDisponiveis = salas.filter((sala) => {
        const ocupados = mapaReservas[sala.id_sala] || 0;
        return ocupados < totalPeriodos;
      });

      if (salasDisponiveis.length === 0) {
        return res
          .status(404)
          .json({ message: "Nenhuma sala disponível nesta data." });
      }

      // Agrupar por bloco
      const salasPorBloco = {};
      salasDisponiveis.forEach((sala) => {
        if (!salasPorBloco[sala.bloco]) salasPorBloco[sala.bloco] = [];
        salasPorBloco[sala.bloco].push(sala);
      });

      res.status(200).json({ data, salasDisponiveis: salasPorBloco });
    } catch (error) {
      console.error("Erro ao buscar salas disponíveis:", error);
      res
        .status(500)
        .json({
          error: "Erro interno do servidor ao buscar salas disponíveis.",
        });
    }
  }

  // Buscar sala por número (Refatorado para async/await)
  static async getSalaById(req, res) {
    const salaId = req.params.numero;
    try {
      const query = `SELECT * FROM sala WHERE numero = ?`;
      const result = await queryAsync(query, [salaId]);

      if (result.length === 0) {
        return res.status(404).json({ error: "Sala não encontrada" });
      }

      res.status(200).json({
        message: "Obtendo a sala com o número: " + salaId,
        salas: result[0],
      });
    } catch (error) {
      console.error("Erro ao obter sala:", error);
      res
        .status(500)
        .json({ error: "Erro interno do servidor ao obter sala." });
    }
  }

  // Buscar salas por bloco (Já estava em async/await e correto)
  static async getSalaByBloco(req, res) {
    const bloco = req.params.bloco;
    try {
      const query = "SELECT * FROM sala WHERE bloco = ?";
      const result = await queryAsync(query, [bloco]);

      if (result.length === 0) {
        return res
          .status(404)
          .json({ message: `Nenhuma sala encontrada para o bloco ${bloco}.` });
      }

      res.status(200).json({
        message: `Obtendo as salas do bloco: ${bloco}`,
        salas: result,
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Atualizar sala (Refatorado para async/await)
  static async updateSala(req, res) {
    const { numero, descricao, capacidade, bloco } = req.body;

    const validationError = validateSala(req.body);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    try {
      const findQuery = `SELECT * FROM sala WHERE numero = ?`;
      const result = await queryAsync(findQuery, [numero]);

      if (result.length === 0) {
        return res.status(404).json({ error: "Sala não encontrada" });
      }

      const updateQuery = `UPDATE sala SET descricao = ?, capacidade = ?, bloco = ? WHERE numero = ?`;
      const updateResult = await queryAsync(updateQuery, [
        descricao,
        capacidade,
        bloco,
        numero,
      ]);

      if (updateResult.affectedRows === 0) {
        return res
          .status(404)
          .json({ error: "Sala não encontrada ou sem alterações." });
      }

      res.status(200).json({ message: "Sala atualizada com sucesso" });
    } catch (error) {
      console.error("Erro ao atualizar a sala:", error);
      res
        .status(500)
        .json({ error: "Erro interno do servidor ao atualizar a sala." });
    }
  }

  // Deletar sala (Refatorado para async/await)
  static async deleteSala(req, res) {
    const salaId = req.params.numero;
    try {
      const checkReservasQuery = `SELECT * FROM reserva WHERE fk_id_sala = ?`;
      const reservas = await queryAsync(checkReservasQuery, [salaId]);

      if (reservas.length > 0) {
        return res.status(400).json({
          error: "Não é possível excluir a sala, pois há reservas associadas.",
        });
      }

      const deleteQuery = `DELETE FROM sala WHERE numero = ?`;
      const results = await queryAsync(deleteQuery, [salaId]);

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Sala não encontrada" });
      }

      res.status(200).json({ message: "Sala excluída com sucesso" });
    } catch (error) {
      console.error("Erro ao deletar a sala:", error);
      res
        .status(500)
        .json({ error: "Erro interno do servidor ao deletar sala." });
    }
  }
};
