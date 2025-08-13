delimiter // 
create procedure ListarReservasPorUsuario(
    in id_usuario int
)
begin
    declare totalReservas int;
    set totalReservas = totalReservasPorUsuario(id_usuario)
    select
        u.id_usuario,
        totalReservas,
        u.nome as nomeUsuario,
        s.numero as nomeSala,
        s.descricao,
        s.capacidade,
        r.id_reserva,
        r.data,
        r.horarioInicio,
        r.horarioFim
    from reserva r
    join usuario u on r.fk_id_usuario = u.id_usuario
    join sala s on r.fk_id_sala = s.id_sala
    where r.fk_id_usuario = id_usuario
    order by r.data, r.horarioInicio;
end; //

delimiter ;

delimiter //

create procedure deletarUsuarioComReservas(in p_id_usuario int)
begin
  -- Excluir reservas (isso ativa a trigger de log automaticamente)
  delete from reserva where fk_id_usuario = p_id_usuario;

  -- Excluir o usuário
  delete from usuario where id_usuario = p_id_usuario;
end; //

delimiter ;


call ListarReservasPorUsuario()
call deletarUsuarioComReservas();

