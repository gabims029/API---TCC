DELIMITER //

CREATE PROCEDURE conflit_dia (
    IN p_dia DATE,
    IN p_fk_id_user INT,
    IN p_fk_id_sala INT,
    IN p_fk_id_periodo INT
)
BEGIN
    DECLARE v_dia_conflito DATE;

    -- Verifica se já existe uma reserva para o mesmo dia, sala e período
    SELECT r.dia 
    INTO v_dia_conflito
    FROM reserva AS r
    WHERE 
        r.fk_id_sala = p_fk_id_sala
        AND r.dia = p_dia
        AND r.fk_id_periodo = p_fk_id_periodo
    LIMIT 1;

    -- Se já existe, dispara erro
    IF v_dia_conflito IS NOT NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'A sala ja esta reservada no dia: ';
                
    ELSE
        -- Caso contrário, insere a reserva normalmente
        INSERT INTO reserva (fk_id_user, fk_id_sala, dia, fk_id_periodo)
        VALUES (p_fk_id_user, p_fk_id_sala, p_dia, p_fk_id_periodo);
    END IF;
END //

DELIMITER ;


DELIMITER //

CREATE PROCEDURE conflit_dia2 (
    IN p_dia DATE,
    IN p_fk_id_user INT,
    IN p_fk_id_sala INT,
    IN p_fk_id_periodo INT
)
BEGIN
    DECLARE v_dia_conflito DATE;
    DECLARE v_inicio TIME;
    DECLARE v_fim TIME;
    DECLARE v_saida char(255);

    -- Verifica se já existe uma reserva para o mesmo dia, sala e período
    SELECT r.dia 
    INTO v_dia_conflito
    FROM reserva AS r
    WHERE 
        r.fk_id_sala = p_fk_id_sala
        AND r.dia = p_dia
        AND r.fk_id_periodo = p_fk_id_periodo
    LIMIT 1;

    -- Se já existe, dispara erro
    IF v_dia_conflito IS NOT NULL THEN
        SELECT p.horario_inicio into v_inicio from periodo p where p.id_periodo = p_fk_id_periodo
        LIMIT 1;
        SELECT p.horario_fim into v_fim from periodo p where p.id_periodo = p_fk_id_periodo
        LIMIT 1;

        set v_saida = CONCAT(p_dia," no periodo: ",v_inicio, " - ",v_fim);

        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = v_saida;
                
    ELSE
        -- Caso contrário, insere a reserva normalmente
        INSERT INTO reserva (fk_id_user, fk_id_sala, dia, fk_id_periodo)
        VALUES (p_fk_id_user, p_fk_id_sala, p_dia, p_fk_id_periodo);
    END IF;
END //

DELIMITER ;