SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS `senai`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `senai`;

DROP TABLE IF EXISTS `periodo`;
CREATE TABLE `periodo` (
  `id_periodo` int NOT NULL AUTO_INCREMENT,
  `horario_inicio` time NOT NULL,
  `horario_fim` time NOT NULL,
  PRIMARY KEY (`id_periodo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `periodo` VALUES
(1,'07:30:00','08:30:00'),(2,'08:30:00','09:30:00'),(3,'09:30:00','10:30:00'),
(4,'10:30:00','11:30:00'),(5,'11:30:00','12:30:00'),(6,'12:30:00','13:30:00'),
(7,'13:30:00','14:30:00'),(8,'14:30:00','15:30:00'),(9,'10:30:00','11:30:00'),
(10,'11:30:00','12:30:00'),(11,'12:30:00','13:30:00'),(12,'13:30:00','14:30:00'),
(13,'14:30:00','15:30:00'),(14,'15:30:00','16:30:00'),(15,'16:30:00','17:30:00'),
(16,'17:30:00','18:30:00'),(17,'18:30:00','19:30:00'),(18,'19:30:00','20:30:00'),
(19,'20:30:00','21:30:00'),(20,'21:30:00','22:30:00');

DELETE p1
FROM periodo p1
INNER JOIN periodo p2
  ON p1.horario_inicio = p2.horario_inicio
 AND p1.horario_fim = p2.horario_fim
 AND p1.id_periodo > p2.id_periodo;

DROP TABLE IF EXISTS `sala`;
CREATE TABLE `sala` (
  `id_sala` int NOT NULL AUTO_INCREMENT,
  `numero` char(5) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `capacidade` int NOT NULL,
  `bloco` char(1) NOT NULL,
  PRIMARY KEY (`id_sala`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `sala` VALUES
(1,'A1','CONVERSORES',16,'A'),
(2,'A2','ELETRÔNICA',16,'A'),
(3,'A3','CLP',16,'A'),
(4,'A4','AUTOMAÇÃO',20,'A'),
(5,'A5','METROLOGIA',16,'A'),
(6,'A6','PNEUMÁTICA/HIDRÁULICA',20,'A'),
(7,'COEL','OFICINA DE COMANDOS ELÉTRICOS',16,'A'),
(8,'ITEL1','OFICINA DE INSTALAÇÕES ELÉTRICAS - G1',16,'A'),
(9,'ITEL2','OFICINA DE INSTALAÇÕES ELÉTRICAS - G2',16,'A'),
(10,'TOR','OFICINA DE TORNEARIA',20,'A'),
(11,'AJFR','OFICINA DE AJUSTAGEM/FRESAGEM',16,'A'),
(12,'CNC','OFICINA DE CNC',16,'A'),
(13,'MMC','OFICINA DE MANUTENÇÃO MECÂNICA',16,'A'),
(14,'SOLD','OFICINA DE SOLDAGEM',16,'A'),
(15,'B2','SALA DE AULA',32,'B'),
(16,'B3','SALA DE AULA',32,'B'),
(17,'B5','SALA DE AULA',40,'B'),
(18,'B6','SALA DE AULA',32,'B'),
(19,'B7','SALA DE AULA',32,'B'),
(20,'B8','LAB. INFORMÁTICA',20,'B'),
(21,'B9','LAB. INFORMÁTICA',16,'B'),
(22,'B10','LAB. INFORMÁTICA',16,'B'),
(23,'B11','LAB. INFORMÁTICA',40,'B'),
(24,'B12','LAB. INFORMÁTICA',40,'B'),
(25,'ALI','LAB. ALIMENTOS',16,'A'),
(26,'C1','SALA DE AULA',24,'C'),
(27,'C2','LAB. DE INFORMÁTICA',32,'C'),
(28,'C3','SALA DE MODELAGEM VESTUÁRIO',20,'C'),
(29,'C4','SALA DE MODELAGEM VESTUÁRIO',20,'C'),
(30,'C5','SALA DE AULA',16,'C'),
(31,'VEST','OFICINA DE VESTUÁRIO',20,'C'),
(32,'MPESP','OFICINA DE MANUTENÇÃO PESPONTO',16,'C'),
(33,'AUTO','OFICINA DE MANUTENÇÃO AUTOMOTIVA',20,'C'),
(34,'D1','SALA MODELAGEM',16,'D'),
(35,'D2','SALA DE MODELAGEM',20,'D'),
(36,'D3','SALA DE AULA',16,'D'),
(37,'D4','SALA DE CRIAÇÃO',18,'D'),
(38,'CORT1','OFICINA DE CORTE - G1',16,'D'),
(39,'CORT2','OFICINA DE CORTE - G2',16,'D'),
(40,'PRE','OFICINA DE PREPARAÇÃO',16,'D'),
(41,'PESP1','OFICINA DE PESPONTO - G1',16,'D'),
(42,'PESP2','OFICINA DE PESPONTO - G2',16,'D'),
(43,'PESP3','OFICINA DE PESPONTO - G3',16,'D'),
(44,'MONT1','OFICINA DE MONTAGEM - G1',16,'D'),
(45,'MONT2','OFICINA DE MONTAGEM - G2',16,'D');

DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id_user` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) NOT NULL,
  `email` varchar(50) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `cpf` varchar(50) NOT NULL,
  `tipo` varchar(255) NOT NULL,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `cpf` (`cpf`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `user` VALUES
(1,'Administrador','admin@docente.senai.br',
'$2b$10$cUCNfB8zeLxEfopVSyBtIOhmUR6vtZrvIMShv.VNHqKWmiE1.AaoK',
'12345678909','Admin'),
(2, 'teste', 'teste@docente.senai.br',
'$2b$10$BSVb7srFNTSchbqdCLis1O.8z6krNgApDGNiuNCMy9Y3ZwxEcViDm',
'12345678909', 'comum'),
(3, 'testeAdmin', 'testeAdmini@docente.senai.br',
'$2b$10$BSVb7srFNTSchbqdCLis1O.8z6krNgApDGNiuNCMy9Y3ZwxEcViDm',
'01234567890', 'Admin');


DROP TABLE IF EXISTS `reserva`;
CREATE TABLE `reserva` (
  `id_reserva` int NOT NULL AUTO_INCREMENT,
  `fk_id_periodo` int DEFAULT NULL,
  `fk_id_user` int DEFAULT NULL,
  `fk_id_sala` int DEFAULT NULL,
  `dia` date DEFAULT NULL,
  PRIMARY KEY (`id_reserva`),
  KEY `fk_id_periodo` (`fk_id_periodo`),
  KEY `fk_id_user` (`fk_id_user`),
  KEY `fk_id_sala` (`fk_id_sala`),
  CONSTRAINT `reserva_ibfk_1` FOREIGN KEY (`fk_id_periodo`) REFERENCES `periodo` (`id_periodo`),
  CONSTRAINT `reserva_ibfk_2` FOREIGN KEY (`fk_id_user`) REFERENCES `user` (`id_user`),
  CONSTRAINT `reserva_ibfk_3` FOREIGN KEY (`fk_id_sala`) REFERENCES `sala` (`id_sala`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DELIMITER //
CREATE PROCEDURE deletarUsuarioComReservas(IN p_id_user INT)
BEGIN
  DELETE FROM reserva WHERE fk_id_user = p_id_user;
  DELETE FROM user WHERE id_user = p_id_user;
END;
//
DELIMITER ;

DELIMITER //
CREATE PROCEDURE conflit_day(
    IN p_dia DATE,
    IN p_fk_id_user INT,
    IN p_fk_id_sala INT,
    IN p_fk_id_periodo INT
)
BEGIN
    DECLARE v_dia_conflito DATE;
    DECLARE v_inicio TIME;
    DECLARE v_fim TIME;
    DECLARE v_saida CHAR(255);

    SELECT r.dia INTO v_dia_conflito
    FROM reserva r
    WHERE r.fk_id_sala = p_fk_id_sala
      AND r.dia = p_dia
      AND r.fk_id_periodo = p_fk_id_periodo
    LIMIT 1;

    IF v_dia_conflito IS NOT NULL THEN
        SELECT horario_inicio INTO v_inicio FROM periodo WHERE id_periodo = p_fk_id_periodo;
        SELECT horario_fim INTO v_fim FROM periodo WHERE id_periodo = p_fk_id_periodo;

        SET v_saida = CONCAT(p_dia, ' no periodo: ', v_inicio, ' - ', v_fim);

        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = v_saida;
    ELSE
        INSERT INTO reserva (fk_id_user, fk_id_sala, dia, fk_id_periodo)
        VALUES (p_fk_id_user, p_fk_id_sala, p_dia, p_fk_id_periodo);
    END IF;
END;
//
DELIMITER ;
