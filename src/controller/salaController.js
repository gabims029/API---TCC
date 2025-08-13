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
  static async createSala(req, res) {
    const { numero, descricao, capacidade, bloco } = req.body;
    
    const validationError = validateSala(req.body);
    if (validationError) {
      return res.status(400).json(validationError);
    }
    // Caso todos os campos estejam preenchidos, realiza a inserção na tabela
    const query = `INSERT INTO sala (numero, descricao, capacidade, bloco) VALUES ( 
        '${numero}', 
        '${descricao}', 
        '${capacidade}',
        '${bloco}'
      )`;

    try {
      connect.query(query, function (err) {
        if (err) {
          console.log(err);
          res.status(500).json({ error: "Erro ao cadastrar sala" });
          return;
        }
        console.log("Sala cadastrada com sucesso");
        res.status(201).json({ message: "Sala cadastrada com sucesso" });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getAllSalas(req, res) {
    try {
      const query = "SELECT * FROM sala";
      connect.query(query, function (err, results) {
        if (err) {
          console.error("Erro ao obter salas:", err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }
        console.log("Salas obtidas com sucesso");
        res.status(200).json({ salas: results });
      });
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getSalaById(req, res) {
    const salaId = req.params.numero;

    try {
      const query = `SELECT * FROM sala WHERE numero = '${salaId}'`;
      connect.query(query, function (err, result) {
        if (err) {
          console.error("Erro ao obter sala:", err);
          return res.status(500).json({ error: "Erro interno do servidor" });
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
  static async getSalaByBloco(req, res) {
  const bloco = req.params.bloco;

  try {
    const query = "SELECT * FROM sala WHERE bloco = ?";
    connect.query(query, [bloco], function (err, result) {
      if (err) {
        console.error("Erro ao obter salas:", err);
        return res.status(500).json({ error: "Erro interno do servidor" });
      }

      if (result.length === 0) {
        return res.status(404).json({ error: "Salas não encontradas" });
      }

      console.log("Salas obtidas com sucesso");
      res.status(200).json({
        message: "Obtendo as salas do bloco: " + bloco,
        salas: result,
      });
    });
  } catch (error) {
    console.error("Erro ao executar a consulta:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
}



  static async updateSala(req, res) {
    const { numero, descricao, capacidade, bloco } = req.body;

    const validationError = validateSala(req.body);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    try {
      // Verificar se a sala existe
      const findQuery = `SELECT * FROM sala WHERE numero = ?`;
      connect.query(findQuery, [numero], function (err, result) {
        if (err) {
          console.error("Erro ao buscar a sala:", err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (result.length === 0) {
          return res.status(404).json({ error: "Sala não encontrada" });
        }

        // Atualizar a sala
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
              console.error("Erro ao atualizar a sala:", err);
              return res
                .status(500)
                .json({ error: "Erro interno do servidor" });
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

  static async deleteSala(req, res) {
    const salaId = req.params.numero; // Usando 'numero' como parâmetro

    try {
      // Verificar se há reservas associadas à sala
      const checkReservasQuery = `SELECT * FROM reserva WHERE fk_id_sala = ?`; // Usando 'fk_id_sala'
      connect.query(
        checkReservasQuery,
        [salaId],
        function (err, reservas) {
          if (err) {
            console.error("Erro ao verificar reservas:", err);
            return res.status(500).json({ error: "Erro interno do servidor" });
          }

          // Verificar se existem reservas associadas
          if (reservas.length > 0) {
            // Impedir exclusão e retornar erro
            return res
              .status(400)
              .json({
                error:
                  "Não é possível excluir a sala, pois há reservas associadas.",
              });
          } else {
            // Deletar a sala de aula
            const deleteQuery = `DELETE FROM sala WHERE numero = ?`;
            connect.query(deleteQuery, [salaId], function (err, results) {
              if (err) {
                console.error("Erro ao deletar a sala:", err);
                return res
                  .status(500)
                  .json({ error: "Erro ao deletar a sala" });
              }

              if (results.affectedRows === 0) {
                return res.status(404).json({ error: "Sala não encontrada" });
              }

              console.log("Sala deletada com sucesso");
              res.status(200).json({ message: "Sala excluída com sucesso" });
            });
          }
        }
      );
    } catch (error) {
      console.error("Erro ao executar a consulta:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
};