const router = require("express").Router();
const userController = require("../controller/userController");
const salaController = require("../controller/salaController");
const periodoController = require("../controller/periodoController");
const authorizeRole = require("../services/authorizeRole");
const verifyJWT = require("../services/verifyJWT");

// Usuário
router.post("/user/", verifyJWT, authorizeRole("admin"), userController.createUser);
router.post("/user/login", userController.postLogin);
router.get("/user/", verifyJWT, userController.getAllUsers);
router.get("/user/:id", verifyJWT, userController.getUserById);
router.put("/user/", verifyJWT, userController.updateUser); 
router.delete("/user/:id", verifyJWT, authorizeRole("admin"), userController.deleteUser); 

// Salas
router.post("/sala/", verifyJWT, salaController.createSala);
router.get("/sala/", verifyJWT, salaController.getAllSalas);
router.get("/sala/:bloco", verifyJWT, salaController.getSalaByBloco);
router.get("/sala/:numero", verifyJWT, salaController.getSalaById);
router.put("/sala/", verifyJWT, authorizeRole("admin"), salaController.updateSala);
router.delete("/sala/:numero", verifyJWT, authorizeRole("admin"), salaController.deleteSala);

// Períodos
router.post("/periodo/", verifyJWT, authorizeRole("admin"), periodoController.createPeriodo);
router.get("/periodo/", verifyJWT, periodoController.getAllPeriodos);
router.get("/periodo/:id", verifyJWT, periodoController.getPeriodoById);
router.put("/periodo/:id", verifyJWT, authorizeRole("admin"), periodoController.updatePeriodo);
router.delete("/periodo/:id", verifyJWT, authorizeRole("admin"), periodoController.deletePeriodo);

module.exports = router;

// http://10.89.240.77:3000/api/reserva
