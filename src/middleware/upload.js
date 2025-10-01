const multer = require("multer");

const storage = multer.memoryStorage(); // Guarda a imagem na memória (como buffer)

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
});

module.exports = upload;
