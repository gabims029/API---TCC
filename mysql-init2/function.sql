delimiter //

create function totalReservasPorUsuario(id_usuario int) 
returns int
deterministic
begin
    declare total int;
    
    select count(*) into total
    from reserva
    where fk_id_usuario = id_usuario;
    
    return total;
end; //

delimiter ;

select totalReservasPorUsuario(1);