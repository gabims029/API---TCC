const connect = require("../db/connect");
const validateUser = require("../services/validateUser");
const validateCpf = require("../services/validateCpf");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;
const validateEmail = require("../services/validateEmail");

module.exports = class userController {
  static async createUser(req, res) {
    const { cpf, email, senha, nome, tipo } = req.body;
    const foto = req.file ? req.file.buffer : null; // pega o buffer da imagem

    const validationError = validateUser(req.body);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    const emailValidation = validateEmail(email);
    if (emailValidation) {
      return res.status(400).json(emailValidation);
    }

    try {
      const cpfError = await validateCpf(cpf);
      if (cpfError) {
        return res.status(400).json(cpfError);
      }
      const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);

      const query = `INSERT INTO user (cpf, senha, email, nome, tipo) VALUES (?, ?, ?, ?, ?)`;
      connect.query(
        query,
        [cpf, hashedPassword, email, nome, tipo.toLowerCase(), foto],
        (err) => {
          if (err) {
            if (err.code === "ER_DUP_ENTRY") {
              if (err.message.includes("email")) {
                return res.status(400).json({ error: "Email já cadastrado" });
              }
            } else {
              console.log(err);
              return res
                .status(500)
                .json({ error: "Erro interno do servidor", err });
            }
          }
          return res
            .status(201)
            .json({ message: "Usuário criado com sucesso" });
        }
      );
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  static async getAllUsers(req, res) {
    const query = `SELECT * FROM user`;

    try {
      connect.query(query, function (err, results) {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        return res
          .status(200)
          .json({ message: "Obtendo todos os usuários", users: results });
      });
    } catch (error) {
      console.log("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async getUserById(req, res) {
    const userId = req.params.id;
    const query = `SELECT * FROM user WHERE id_user = ?`;
    const values = [userId];

    try {
      connect.query(query, values, function (err, results) {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        results[0].foto = results[0].foto
          ? results[0].foto.toString("base64")
          : null;

        if (results.length === 0) {
          return res.status(404).json({ error: "Usuário não encontrado" });
        }

        return res.status(200).json({
          message: "Obtendo usuário com id: " + userId,
          user: results[0],
        });
      });
    } catch (error) {
      console.log("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async updateUser(req, res) {
    const { cpf, email, senhaAtual, senha, nome, id } = req.body;
    const userId = id;

    // Verifica se o usuário logado é o dono do perfil
    if (Number(userId) !== Number(req.userId)) {
      return res
        .status(403)
        .json({ error: "Usuário não autorizado a atualizar este perfil" });
    }

    // Validação dos dados obrigatórios
    const validationError = validateUser({ cpf, email, senha, nome });
    if (validationError) {
      return res.status(400).json(validationError);
    }

    try {
      // Verifica se o CPF já existe em outro usuário
      const cpfError = await validateCpf(cpf, id);
      if (cpfError) {
        return res.status(400).json(cpfError);
      }

      // Busca a senha atual do usuário no banco
      const querySelect = "SELECT senha FROM user WHERE id_user = ?";
      connect.query(querySelect, [id], async (err, results) => {
        if (err) {
          console.log(err);
          return res
            .status(500)
            .json({ error: "Erro interno do servidor", err });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: "Usuário não encontrado" });
        }

        const senhaBanco = results[0].senha;

        // Compara a senha atual fornecida com o hash do banco
        const senhaOK = await bcrypt.compare(senhaAtual, senhaBanco);
        if (!senhaOK) {
          return res.status(401).json({ error: "Senha atual incorreta" });
        }

        // Gera hash da nova senha
        const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);

        // Atualiza os dados do usuário

        const queryUpdate =
          "UPDATE user SET cpf = ?, email = ?, senha = ?, nome = ? WHERE id_user = ?";
        connect.query(
          queryUpdate,

          [cpf, email, hashedPassword, nome, id],

          [cpf, email, senhaFinal, nome, userIdToUpdate],

          (err, results) => {
            if (err) {
              if (
                err.code === "ER_DUP_ENTRY" &&
                err.message.includes("email")
              ) {
                return res.status(400).json({ error: "Email já cadastrado" });
              }

              return res
                .status(500)
                .json({ error: "Erro interno do servidor", err });
            }

            if (results.affectedRows === 0) {
              return res.status(404).json({ error: "Usuário não encontrado" });
            }

            return res
              .status(200)
              .json({ message: "Usuário atualizado com sucesso" });
          }
        );
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }

  static async deleteUser(req, res) {
    const userId = req.params.id;
    const usuarioId = req.userId;
    const tipo = req.user.tipo; // injetado pelo verifyJWT

    // Permite admin deletar qualquer usuário, ou usuário deletar só ele mesmo
    if (Number(userId) !== Number(usuarioId) && tipo !== "admin") {
      return res
        .status(403)
        .json({ error: "Usuário não autorizado a deletar este perfil" });
    }

    try {
      const query = `CALL deletarUsuarioComReservas(?)`;

      connect.query(query, [userId], (err, results) => {
        if (err) {
          console.error("Erro ao executar procedure:", err);
          return res
            .status(500)
            .json({ error: "Erro ao excluir usuário e reservas" });
        }

        return res.status(200).json({
          message: `Usuário (ID: ${userId}) e suas reservas foram excluídos com sucesso`,
        });
      });
    } catch (error) {
      console.error("Erro inesperado:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  static async postLogin(req, res) {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    const query = `SELECT * FROM user WHERE email = ?`;

    try {
      connect.query(query, [email], (err, results) => {
        if (err) {
          console.log("Erro ao executar a consulta:", err);
          return res.status(500).json({ error: "Erro interno do servidor" });
        }

        if (results.length === 0) {
          return res.status(401).json({ error: "Usuário não encontrado" });
        }

        const user = results[0];

        const emailValidation = validateEmail(email);
        if (emailValidation) {
          return res.status(400).json(emailValidation);
        }

        const passwordOK = bcrypt.compareSync(senha, user.senha);

        if (!passwordOK) {
          return res.status(401).json({ error: "Senha incorreta" });
        }

        const token = jwt.sign(
          { id: user.id_user, tipo: user.tipo.toLowerCase() },
          process.env.SECRET,
          { expiresIn: "1h" }
        );

        delete user.senha;

        return res.status(200).json({
          message: "Login bem-sucedido",
          user,
          token,
        });
      });
    } catch (error) {
      console.log("Erro ao executar a consulta:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
};

async function atualizarSenha(req, res) {
  const { id_user, senhaAtual, novaSenha } = req.body;

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ error: "Preencha a senha atual e nova" });
  }

  try {
    // 1. Buscar o hash da senha atual no banco
    const query = "SELECT senha FROM user WHERE id_user = ?";
    connect.query(query, [id_user], async (err, results) => {
      if (err) return res.status(500).json({ error: "Erro no servidor" });
      if (results.length === 0)
        return res.status(404).json({ error: "Usuário não encontrado" });

      const hash = results[0].senha;

      // 2. Comparar senha atual digitada com o hash do banco
      const senhaCorreta = await bcrypt.compare(senhaAtual, hash);
      if (!senhaCorreta) {
        return res.status(401).json({ error: "Senha atual incorreta" });
      }

      // 3. Hash da nova senha

      const novaSenhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);

      // 4. Atualizar no banco
      const updateQuery = "UPDATE user SET senha = ? WHERE id_user = ?";
      connect.query(updateQuery, [novaSenhaHash, id_user], (err2) => {
        if (err2)
          return res.status(500).json({ error: "Erro ao atualizar senha" });
        return res
          .status(200)
          .json({ message: "Senha atualizada com sucesso" });
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
