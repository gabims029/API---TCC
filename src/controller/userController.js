const connect = require("../db/connect");
const validateUser = require("../services/validateUser");
const validateCpf = require("../services/validateCpf");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

module.exports = class userController {
  static async createUser(req, res) {
    const { cpf, email, senha, nome, tipo } = req.body;

    const validationError = validateUser(req.body);
    if (validationError) {
      return res.status(400).json(validationError);
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
        [cpf, hashedPassword, email, nome, tipo.toLowerCase()],
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
  const { cpf, email, senhaAtual, novaSenha, nome, id } = req.body;

  // Define qual usuário será atualizado
  let userIdToUpdate;
  if (req.user.tipo === "admin" && id) {
    userIdToUpdate = id; // admin pode atualizar qualquer usuário
  } else {
    userIdToUpdate = req.userId; // usuário comum só pode atualizar a si mesmo
  }

  try {
    // Validar dados básicos
    const validationError = validateUser({
      cpf,
      email,
      nome,
      senha: novaSenha || senhaAtual,
    });
    if (validationError) {
      return res.status(400).json(validationError);
    }

    const cpfError = await validateCpf(cpf, userIdToUpdate);
    if (cpfError) {
      return res.status(400).json(cpfError);
    }

    // Buscar senha do usuário no banco
    const querySelect = "SELECT senha FROM user WHERE id_user = ?";
    connect.query(querySelect, [userIdToUpdate], async (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: "Erro interno do servidor" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      const senhaHash = results[0].senha;

      // Verificar senha atual (somente para usuário comum)
      if (req.user.tipo !== "admin") {
        const senhaCorreta = await bcrypt.compare(senhaAtual, senhaHash);
        if (!senhaCorreta) {
          return res.status(401).json({ error: "Senha atual incorreta" });
        }
      }

      // Se mandou nova senha → gerar hash
      let senhaFinal = senhaHash;
      if (novaSenha) {
        senhaFinal = await bcrypt.hash(novaSenha, SALT_ROUNDS);
      }

      // Atualizar usuário
      const queryUpdate =
        "UPDATE user SET cpf = ?, email = ?, senha = ?, nome = ? WHERE id_user = ?";
      connect.query(
        queryUpdate,
        [cpf, email, senhaFinal, nome, userIdToUpdate],
        (err, results) => {
          if (err) {
            if (err.code === "ER_DUP_ENTRY" && err.message.includes("email")) {
              return res.status(400).json({ error: "Email já cadastrado" });
            }
            console.log(err);
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
    console.log(error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}



  static async deleteUser(req, res) {
    const userId = req.params.id;
    const usuarioId = req.userId;

    if (Number(userId) !== Number(usuarioId)) {
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
