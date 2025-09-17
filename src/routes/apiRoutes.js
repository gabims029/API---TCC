const router = require("express").Router();
const userController = require("../controller/userController");
const salaController = require("../controller/salaController");
const periodoController = require("../controller/periodoController");
const reservaController = require("../controller/reservaController");
const authorizeRole = require("../services/authorizeRole");
const verifyJWT = require("../services/verifyJWT");

// Users
router.post("/user/", verifyJWT, authorizeRole("admin"), userController.createUser);
router.post("/user/login", userController.postLogin);
router.get("/user/", verifyJWT, userController.getAllUsers);
router.get("/user/:id", verifyJWT, userController.getUserById);
router.put("/user/", verifyJWT, userController.updateUser);
router.delete("/user/:id", verifyJWT, authorizeRole("admin"), userController.deleteUser);

// Salas
router.post("/sala/", verifyJWT, authorizeRole("admin"), salaController.createSala);
router.get("/sala/", verifyJWT, salaController.getAllSalas);

router.get("/sala/:bloco", salaController.getSalaByBloco);
router.get("/sala/:numero", verifyJWT, salaController.getSalaById);
router.put("/sala/", verifyJWT,authorizeRole("admin"), salaController.updateSala);
router.delete("/sala/:numero", verifyJWT,authorizeRole("admin"), salaController.deleteSala);
router.get("/salas/disponiveis", salaController.getSalasDisponiveisPorData);

//Periodo
router.post("/periodo/", periodoController.createPeriodo);
router.get("/periodo/", periodoController.getAllPeriodos);
router.get("/periodo/:id", periodoController.getPeriodoById);
router.put("/periodo/:id", periodoController.updatePeriodo);
router.delete("/periodo/:id", periodoController.deletePeriodo);

//Reserva
router.post("/reserva/", reservaController.createReserva);
router.get("/reserva/", reservaController.getReservas);
router.put("/reserva/", reservaController.updateReserva);
router.delete("/reserva/",reservaController.deleteReserva);


//Reserva
router.post("/reserva/", verifyJWT, reservaController.createReserva);

module.exports = router;
