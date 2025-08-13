const router = require("express").Router();
const userController = require("../controller/userController");
// const classroomController = require("../controller/classroomController");
// const controllerReserva = require("../controller/controllerReserva");
const verifyJWT = require("../services/verifyJWT");

//User
router.post("/user/", userController.createUser);
router.post("/user/login", userController.postLogin);
router.get("/user/", verifyJWT, userController.getAllUsers);
router.get("/user/:id", verifyJWT, userController.getUserById);
router.put("/user/", verifyJWT, userController.updateUser); 
router.delete("/user/:id", verifyJWT, userController.deleteUser); 

//Classroom
// router.post("/sala/", verifyJWT, classroomController.createClassroom);
// router.get("/sala/", verifyJWT, classroomController.getAllClassrooms);
// router.get("/sala/:numero", verifyJWT, classroomController.getClassroomById);
// router.put("/sala/", verifyJWT, classroomController.updateClassroom);
// router.delete("/sala/:numero", verifyJWT, classroomController.deleteClassroom);

// // Reservas
// router.post("/reserva/",verifyJWT, controllerReserva.createReserva);
// router.get("/reserva/",verifyJWT, controllerReserva.getReservas);
// router.put("/reserva/:id_reserva",verifyJWT, controllerReserva.updateReserva);
// router.delete("/reserva/:id_reserva",verifyJWT, controllerReserva.deleteReserva);
// router.get("/reserva/horarios/:id_sala/:data",verifyJWT, controllerReserva.getHorariosSala);
// router.get("/reserva/usuario/:id_usuario",verifyJWT, controllerReserva.getReservasPorUsuario);

module.exports = router;

// http://10.89.240.77:3000/api/reserva
