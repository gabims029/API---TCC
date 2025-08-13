module.exports = function validateReserva({
  fk_id_usuario,
  fk_id_sala,
  data,
  horarioInicio,
  horarioFim
}) {
  // Verificar se todos os campos foram preenchidos
  if (!fk_id_usuario || !fk_id_sala || !data || !horarioInicio || !horarioFim) {
    return { error: "Todos os campos devem ser preenchidos" };
  }

  // Criar objetos Date para os horários
  const inicioReserva = new Date(`${data}T${horarioInicio}`);
  const fimReserva = new Date(`${data}T${horarioFim}`);
  const agora = new Date();

  // Formatar a data atual no padrão YYYY-MM-DD HH:mm:ss
  const agoraFormatado = agora.toISOString().replace("T", " ").split(".")[0];

  // Validar se a data e horário são válidos
  if (inicioReserva < agora) {
    return { error: `A reserva deve ser para um horário futuro. Horário atual: ${agoraFormatado}` };
  }
  if (fimReserva <= inicioReserva) {
    return { error: "O horário final deve ser maior que o horário inicial" };
  }

  // Verificar se está dentro do horário permitido (7h - 23h)
  const horaInicio = inicioReserva.getHours();
  const horaFim = fimReserva.getHours();
  if (horaInicio < 7 || horaInicio >= 23 || horaFim < 7 || horaFim > 23) {
    return { error: "A reserva deve ser feita entre 7:00 e 23:00" };
  }

  return null; // Retorna null se não houver erro
};
