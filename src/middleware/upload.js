const sharp = require('sharp');
const multer = require('multer');

// Define o filtro para aceitar imagens JPEG, PNG, GIF e JFIF
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    return cb(null, true);
  }
  return cb(new Error("Tipo de arquivo não permitido. Apenas .jpg, .png, .gif são aceitos."), false);
};

// Configuração do Multer
const storage = multer.memoryStorage();  // Armazenar o arquivo na memória
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter, 
  limits: { fileSize: 5 * 1024 * 1024 }  // Limite de 5MB
});

module.exports = upload;

// Função de atualização da foto
const updateUserPhoto = (req, res) => {
  const { id } = req.params;
  const fotoBuffer = req.file ? req.file.buffer : null;

  if (!fotoBuffer) {
    return res.status(400).json({ error: "Foto não enviada." });
  }

  // Conversão de JFIF para JPEG usando sharp
  sharp(fotoBuffer)
    .toFormat('jpeg')  // Garantir que seja no formato JPEG
    .toBuffer()
    .then((convertedBuffer) => {
      // Atualizar no banco de dados
      const queryUpdate = "UPDATE user SET foto = ? WHERE id_user = ?";
      connect.query(queryUpdate, [convertedBuffer, id], (err, results) => {
        if (err) return res.status(500).json({ error: "Erro ao atualizar foto", err });
        if (results.affectedRows === 0) return res.status(404).json({ error: "Usuário não encontrado" });

        return res.status(200).json({ message: "Foto atualizada com sucesso!" });
      });
    })
    .catch((error) => {
      return res.status(500).json({ error: "Erro na conversão da imagem", err: error });
    });
};
