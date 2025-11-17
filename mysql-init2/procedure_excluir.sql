DELIMITER //

CREATE PROCEDURE deletar_reservas(IN p_ids_json JSON)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE quantidade_id INT;
    DECLARE v_id INT;

    -- Conta quantos IDs temos no JSON
    SET quantidade_id = JSON_LENGTH(p_ids_json);

    WHILE i < quantidade_id DO
        -- Pega o ID na posição i
        SET v_id = JSON_EXTRACT(p_ids_json, CONCAT('$[', i, ']'));

        -- Deleta a reserva correspondente
        DELETE FROM reserva WHERE id_reserva = v_id;

        SET i = i + 1;
    END WHILE;
END;
//

DELIMITER ;
