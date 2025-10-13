const connect = require("../db/connect");
const validateUser = require("../services/validateUser");
const validateCpf = require("../services/validateCpf");
const validateEmail = require("../services/validateEmail");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

module.exports = class userController {
  // Criar usuário
  static async createUser(req, res) {
    const { cpf, email, senha, nome, tipo } = req.body; // const fotoBuffer = req.file ? req.file.buffer : null; // captura foto
    const validationError = validateUser(req.body);
    if (validationError) return res.status(400).json(validationError);

    const emailValidation = validateEmail(email);
    if (emailValidation) return res.status(400).json(emailValidation);

    try {
      const cpfError = await validateCpf(cpf);
      if (cpfError) return res.status(400).json(cpfError);

      const hashedPassword = await bcrypt.hash(senha, SALT_ROUNDS);

      const query = `
        INSERT INTO user (cpf, senha, email, nome, tipo, foto) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      connect.query(
        query,
        [cpf, hashedPassword, email, nome, tipo.toLowerCase(), fotoBuffer],
        (err) => {
          if (err) {
            if (err.code === "ER_DUP_ENTRY" && err.message.includes("email")) {
              return res.status(400).json({ error: "Email já cadastrado" });
            }
            return res
              .status(500)
              .json({ error: "Erro interno do servidor", err });
          }
          return res
            .status(201)
            .json({ message: "Usuário criado com sucesso" });
        }
      );
    } catch (error) {
      return res.status(500).json({ error });
    }
  } // Listar todos os usuários

  static async getAllUsers(req, res) {
    connect.query("SELECT * FROM user", (err, results) => {
      if (err)
        return res.status(500).json({ error: "Erro interno do servidor" }); // converte fotos para base64

      const users = results.map((user) => ({
        ...user,
        foto: user.foto
          ? `data:image/jpeg;base64,${user.foto.toString("base64")}`
          : null,
      }));

      return res
        .status(200)
        .json({ message: "Obtendo todos os usuários", users });
    });
  } // Obter usuário por ID

  static async getUserById(req, res) {
    const userId = req.params.id;
    connect.query(
      "SELECT * FROM user WHERE id_user = ?",
      [userId],
      (err, results) => {
        if (err)
          return res.status(500).json({ error: "Erro interno do servidor" });
        if (results.length === 0)
          return res.status(404).json({ error: "Usuário não encontrado" });

        const user = results[0];
        user.foto = user.foto
          ? `data:image/jpeg;base64,${user.foto.toString("base64")}`
          : null;

        return res
          .status(200)
          .json({ message: `Obtendo usuário com id: ${userId}`, user });
      }
    );
  } // Atualizar usuário (incluindo foto)

  static async updateUser(req, res) {
    const {
      email,
      senhaAtual = "",
      senha: novaSenha = "", // novaSenha (se vazia, não atualiza)
      nome,
      id,
      cpf,
    } = req.body;
    
    // 🛑 NOVIDADE: Captura a foto e o tipo do Multer (req.file)
    const fotoBuffer = req.file?.buffer || null;
    const fotoTipo = req.file?.mimetype || null; 

    const idUsuarioLogado = req.userId;
    
    // 1. Validação de Permissão e Campos Essenciais
    if (Number(id) !== Number(idUsuarioLogado)) {
      return res
        .status(403)
        .json({ error: "Você só pode atualizar seu próprio perfil." });
    }
    
    if (!id || !cpf || !email || !nome || !senhaAtual) {
      return res
        .status(400)
        .json({ error: "ID, CPF, Email, Nome e Senha Atual são obrigatórios." });
    }

    try {
      // 2. Validação do CPF
      const cpfError = await validateCpf(cpf, id);
      if (cpfError) return res.status(400).json(cpfError);

      // 3. Busca a senha atual no banco para autenticar (e obter a senha para manter, se for o caso)
      const querySelect = "SELECT senha FROM user WHERE id_user = ?";
      connect.query(querySelect, [id], async (err, results) => {
        if (err) return res.status(500).json({ error: "Erro interno do servidor: " + err.message });
        if (results.length === 0) return res.status(404).json({ error: "Usuário não encontrado" });

        const senhaBanco = results[0].senha;
        
        // 4. Verifica Senha Atual (OBRIGATÓRIO para qualquer alteração de dados)
        const senhaOK = await bcrypt.compare(senhaAtual, senhaBanco);
        if (!senhaOK) return res.status(401).json({ error: "Senha atual incorreta." });

        // 5. Montagem Dinâmica da Query
        let setClauses = ["email = ?", "nome = ?", "cpf = ?"];
        let values = [email, nome, cpf];
        let hashParaSalvar = senhaBanco; // Padrão: Mantém a senha atual

        // A. Se houver NOVA senha, gera o hash e a inclui
        if (novaSenha.length > 0) {
          hashParaSalvar = await bcrypt.hash(novaSenha, SALT_ROUNDS);
        }
        setClauses.push("senha = ?");
        values.push(hashParaSalvar); 

        // B. Se houver FOTO, inclui o buffer e o tipo
        if (fotoBuffer) {
          setClauses.push("foto = ?");
          values.push(fotoBuffer);
          setClauses.push("foto_tipo = ?"); // <<-- Requer que você crie a coluna 'foto_tipo'
          values.push(fotoTipo);
        }

        // 6. Executa a Query
        const queryUpdate = `UPDATE user SET ${setClauses.join(", ")} WHERE id_user = ?`;
        values.push(id); // Adiciona o ID no final para a cláusula WHERE

        connect.query(queryUpdate, values, (err) => {
          if (err) {
            if (err.code === "ER_DUP_ENTRY" && err.message.includes("email")) {
              return res.status(400).json({ error: "Email já cadastrado." });
            }
            return res.status(500).json({ error: "Erro ao atualizar usuário", err });
          }
          return res.status(200).json({ message: "Perfil atualizado com sucesso." });
        });
      });
    } catch (error) {
      return res.status(500).json({ error: "Erro interno do servidor: " + error.message });
    }
  }

  // 🛑 ATUALIZAÇÃO: getUserPhoto para usar o foto_tipo
  static async getUserPhoto(req, res) {
    const userId = req.params.id;
    connect.query(
      "SELECT foto, foto_tipo FROM user WHERE id_user = ?", // Seleciona o tipo também
      [userId],
      (err, results) => {
        if (err || results.length === 0 || !results[0].foto) {
          return res.status(404).send("Foto não encontrada");
        }
        const fotoBuffer = results[0].foto;
        // Usa o tipo salvo no banco, ou fallback para jpeg
        const contentType = results[0].foto_tipo || "image/jpeg"; 
        
        res.writeHead(200, {
          "Content-Type": contentType, // <--- Usa o tipo dinâmico
          "Content-Length": fotoBuffer.length,
        });
        res.end(fotoBuffer);
      }
    );
  }

  // Deletar usuário
  static async deleteUser(req, res) {
    const userId = req.params.id;
    const usuarioId = req.userId;
    const tipo = req.user.tipo;

    if (Number(userId) !== Number(usuarioId) && tipo !== "admin") {
      return res
        .status(403)
        .json({ error: "Usuário não autorizado a deletar este perfil" });
    }

    connect.query("CALL deletarUsuarioComReservas(?)", [userId], (err) => {
      if (err)
        return res
          .status(500)
          .json({ error: "Erro ao excluir usuário e reservas", err });
      return res
        .status(200)
        .json({
          message: `Usuário (ID: ${userId}) e suas reservas foram excluídos com sucesso`,
        });
    });
  } // Login

  static async postLogin(req, res) {
    const { email, senha } = req.body;
    if (!email || !senha)
      return res.status(400).json({ error: "Email e senha são obrigatórios" });

    connect.query(
      "SELECT * FROM user WHERE email = ?",
      [email],
      (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0)
          return res.status(401).json({ error: "Usuário não encontrado" });

        const user = results[0];
        const emailValidation = validateEmail(email);
        if (emailValidation) return res.status(400).json(emailValidation);

        const passwordOK = bcrypt.compareSync(senha, user.senha);
        if (!passwordOK)
          return res.status(401).json({ error: "Senha incorreta" });

        const token = jwt.sign(
          { id: user.id_user, tipo: user.tipo.toLowerCase() },
          process.env.SECRET,
          { expiresIn: "1h" }
        );
        delete user.senha;

        return res
          .status(200)
          .json({ message: "Login bem-sucedido", user, token });
      }
    );
  } // Atualizar senha

  static async atualizarSenha(req, res) {
    const { id_user, senhaAtual, novaSenha } = req.body;

    connect.query(
      "SELECT senha FROM user WHERE id_user = ?",
      [id_user],
      async (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0)
          return res.status(404).json({ error: "Usuário não encontrado" });

        const senhaBanco = results[0].senha;
        const senhaOK = await bcrypt.compare(senhaAtual, senhaBanco);
        if (!senhaOK)
          return res.status(401).json({ error: "Senha atual incorreta" });

        const novaSenhaHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
        connect.query(
          "UPDATE user SET senha = ? WHERE id_user = ?",
          [novaSenhaHash, id_user],
          (err2) => {
            if (err2)
              return res
                .status(500)
                .json({ error: "Erro ao atualizar senha", err: err2 });
            return res
              .status(200)
              .json({ message: "Senha atualizada com sucesso" });
          }
        );
      }
    );
  }
};
