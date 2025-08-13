const router = require("express").Router();
const userController = require("../controller/userController");
const salaController = require("../controller/salaController");
// const controllerReserva = require("../controller/controllerReserva");
const verifyJWT = require("../services/verifyJWT");

//User
router.post("/user/", userController.createUser);
router.post("/user/login", userController.postLogin);
router.get("/user/", verifyJWT, userController.getAllUsers);
router.get("/user/:id", verifyJWT, userController.getUserById);
router.put("/user/", verifyJWT, userController.updateUser); 
router.delete("/user/:id", verifyJWT, userController.deleteUser); 

//salas
router.post("/sala/", verifyJWT, salaController.createSala);
router.get("/sala/", verifyJWT, salaController.getAllSalas);
router.get("/sala/:bloco", salaController.getSalaByBloco);
router.get("/sala/:numero", verifyJWT, salaController.getSalaById);
router.put("/sala/", verifyJWT, salaController.updateSala);
router.delete("/sala/:numero", verifyJWT, salaController.deleteSala);

// // Reservas
// router.post("/reserva/",verifyJWT, controllerReserva.createReserva);
// router.get("/reserva/",verifyJWT, controllerReserva.getReservas);
// router.put("/reserva/:id_reserva",verifyJWT, controllerReserva.updateReserva);
// router.delete("/reserva/:id_reserva",verifyJWT, controllerReserva.deleteReserva);
// router.get("/reserva/horarios/:id_sala/:data",verifyJWT, controllerReserva.getHorariosSala);
// router.get("/reserva/usuario/:id_usuario",verifyJWT, controllerReserva.getReservasPorUsuario);

module.exports = router;

// http://10.89.240.77:3000/api/reserva
