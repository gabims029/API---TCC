const router = require("express").Router();
const userController = require("../controller/userController");
const salaController = require("../controller/salaController");
const periodoController = require("../controller/periodoController");
const reservaController = require("../controller/reservaController");
const authorizeRole = require("../services/authorizeRole");
const verifyJWT = require("../services/verifyJWT");

// Usuários (Routes consolidadas)
router.post("/user/login", userController.postLogin);
router.post("/user/", verifyJWT, authorizeRole("admin"), userController.createUser);
router.get("/user/", verifyJWT, userController.getAllUsers);
router.get("/user/:id", verifyJWT, userController.getUserById);
router.put("/user/", verifyJWT, userController.updateUser);
router.delete("/user/:id", verifyJWT, authorizeRole("admin"), userController.deleteUser);



// Salas (Routes consolidadas e conflitos resolvidos)
// A rota mais específica deve vir primeiro para evitar conflitos
router.get("/salas/disponiveis", salaController.getSalasDisponiveisPorData);

// Rotas genéricas com parâmetros
// As rotas com parâmetros de bloco e número não podem ter o mesmo padrão.
// O mais comum é usar um prefixo para diferenciar. Por exemplo:
router.get("/sala/bloco/:bloco", verifyJWT, salaController.getSalaByBloco);
router.get("/sala/numero/:numero", verifyJWT, salaController.getSalaById);

// Rotas sem parâmetros
router.post("/sala/", verifyJWT, authorizeRole("admin"), salaController.createSala);
router.get("/sala/", verifyJWT, salaController.getAllSalas);
router.put("/sala/", verifyJWT, authorizeRole("admin"), salaController.updateSala);
router.delete("/sala/:numero", verifyJWT, authorizeRole("admin"), salaController.deleteSala);



// Períodos (Routes consolidadas)
router.post("/periodo/", verifyJWT, authorizeRole("admin"), periodoController.createPeriodo);
router.get("/periodo/", verifyJWT, periodoController.getAllPeriodos);
router.get("/periodo/:id", verifyJWT, periodoController.getPeriodoById);
router.put("/periodo/:id", verifyJWT, authorizeRole("admin"), periodoController.updatePeriodo);
router.delete("/periodo/:id", verifyJWT, authorizeRole("admin"), periodoController.deletePeriodo);


// Reservas (Routes consolidadas e com segurança aplicada)
router.post("/reserva/", verifyJWT, reservaController.createReserva);
router.get("/reserva/", verifyJWT, reservaController.getAllSchedules);
router.put("/reserva/", verifyJWT, reservaController.updateReserva);
router.delete("/reserva/", verifyJWT, reservaController.deleteSchedule);


module.exports = router;