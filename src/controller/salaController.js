const connect = require("../db/connect");
const validateSala = require("../services/validateSala");

// Função para facilitar a execução de queries assíncronas
const queryAsync = (query, values) => {
  return new Promise((resolve, reject) => {
    connect.query(query, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

module.exports = class salaController {
  // Criar sala
  static async createSala(req, res) {
    const { numero, descricao, capacidade, bloco } = req.body;


    console.log("Dados recebidos:", req.body);


    const validationError = validateSala(req.body);
    if (validationError) {
      return res.status(400).json(validationError);
    }

  
    // Validação para o campo bloco
    // const blocosPermitidos = ["A", "B", "C", "D"];
    // if (!blocosPermitidos.includes(bloco)) {
    //   return res.status(400).json({ error: "Bloco inválido. Use apenas A, B, C ou D." });
    // }
  
    const query = `INSERT INTO sala (numero, descricao, capacidade, bloco) VALUES (?, ?, ?, ?)`;
    try {
      connect.query(query, [numero, descricao, capacidade, bloco], function (err) {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: "Erro ao cadastrar sala" });
        }
        res.status(201).json({ message: "Sala cadastrada com sucesso" });
      });

    } catch (error) {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  

  // Listar todas as salas
  static async getAllSalas(req, res) {
    try {
      const query = "SELECT * FROM sala";
      connect.query(query, function (err, results) {
        if (err) {
          console.error("Erro ao obter salas:", err.sqlMessage);
          return res.status(500).json({ error: err.sqlMessage });
        }
        console.log("Salas obtidas com sucesso");
        res.status(200).json({ salas: results });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Listar salas disponíveis por data, organizadas por bloco
  static async getSalasDisponiveisPorData(req, res) {
    const { data } = req.query;

    if (!data) {
      return res
        .status(400)
        .json({ error: "A data é obrigatória (formato: YYYY-MM-DD)" });
    }

    try {
      const query = `
      SELECT s.*
      FROM sala s
      WHERE s.numero NOT IN (
        SELECT r.fk_id_sala
        FROM reserva r
        WHERE DATE(r.data_reserva) = ?
      )
      ORDER BY s.bloco, s.numero
    `;

      const salasDisponiveis = await queryAsync(query, [data]);

      if (salasDisponiveis.length === 0) {
        return res
          .status(404)
          .json({ message: "Nenhuma sala disponível nesta data." });
      }

      // Agrupar por bloco
      const salasPorBloco = {};
      salasDisponiveis.forEach((sala) => {
        if (!salasPorBloco[sala.bloco]) {
          salasPorBloco[sala.bloco] = [];
        }
        salasPorBloco[sala.bloco].push(sala);
      });

      res.status(200).json({ data, salasDisponiveis: salasPorBloco });
    } catch (error) {
      console.error("Erro ao buscar salas disponíveis:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Buscar sala por número
  static async getSalaById(req, res) {
    const salaId = req.params.numero;

    try {
      const query = `SELECT * FROM sala WHERE numero = ?`;
      connect.query(query, [salaId], function (err, result) {
        if (err) {
          console.error("Erro ao obter sala:", err.sqlMessage);
          return res.status(500).json({ error: err.sqlMessage });
        }

        if (result.length === 0) {
          return res.status(404).json({ error: "Sala não encontrada" });
        }

        console.log("Sala obtida com sucesso");
        res.status(200).json({
          message: "Obtendo a sala com o número: " + salaId,
          salas: result[0],
        });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Buscar salas por bloco
  static async getSalaByBloco(req, res) {
    const bloco = req.params.bloco;

    try {
      const query = "SELECT * FROM sala WHERE bloco = ?";
      connect.query(query, [bloco], function (err, result) {
        if (err) {
          console.error("Erro ao obter salas:", err.sqlMessage);
          return res.status(500).json({ error: err.sqlMessage });
        }


      // console.log("Salas obtidas com sucesso");
      res.status(200).json({
        message: "Obtendo as salas do bloco: " + bloco,
        salas: result,

      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Atualizar sala
  static async updateSala(req, res) {
    const { numero, descricao, capacidade, bloco } = req.body;

    const validationError = validateSala(req.body);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    try {
      const findQuery = `SELECT * FROM sala WHERE numero = ?`;
      connect.query(findQuery, [numero], function (err, result) {
        if (err) {
          console.error("Erro ao buscar a sala:", err.sqlMessage);
          return res.status(500).json({ error: err.sqlMessage });
        }

        if (result.length === 0) {
          return res.status(404).json({ error: "Sala não encontrada" });
        }

        const updateQuery = `
          UPDATE sala
          SET descricao = ?, capacidade = ?, bloco = ?
          WHERE numero = ?
        `;
        connect.query(
          updateQuery,
          [descricao, capacidade, bloco, numero],
          function (err) {
            if (err) {
              console.error("Erro ao atualizar a sala:", err.sqlMessage);
              return res.status(500).json({ error: err.sqlMessage });
            }

            console.log("Sala atualizada com sucesso");
            res.status(200).json({ message: "Sala atualizada com sucesso" });
          }
        );
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Deletar sala
  static async deleteSala(req, res) {
    const salaId = req.params.numero;

    try {
      const checkReservasQuery = `SELECT * FROM reserva WHERE fk_id_sala = ?`;
      connect.query(checkReservasQuery, [salaId], function (err, reservas) {
        if (err) {
          console.error("Erro ao verificar reservas:", err.sqlMessage);
          return res.status(500).json({ error: err.sqlMessage });
        }

        if (reservas.length > 0) {
          return res.status(400).json({
            error:
              "Não é possível excluir a sala, pois há reservas associadas.",
          });
        } else {
          const deleteQuery = `DELETE FROM sala WHERE numero = ?`;
          connect.query(deleteQuery, [salaId], function (err, results) {
            if (err) {
              console.error("Erro ao deletar a sala:", err.sqlMessage);
              return res.status(500).json({ error: err.sqlMessage });
            }

            if (results.affectedRows === 0) {
              return res.status(404).json({ error: "Sala não encontrada" });
            }

            console.log("Sala deletada com sucesso");
            res.status(200).json({ message: "Sala excluída com sucesso" });
          });
        }
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
};
