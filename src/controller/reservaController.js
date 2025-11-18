const connect = require("../db/connect");
const validateReserva = require("../services/validateReserva");

//  Retorna a abreviação do dia (ex: 'Seg');
function getDiaDaSemana(dateString) {
  const date = new Date(dateString + "T00:00:00"); // Garante que a data é tratada no início do dia

  // Mapeamento direto de getDay() (0=Dom, 1=Seg, ..., 6=Sáb) para a abreviação
  const diasAbreviados = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

  const diaAbreviado = diasAbreviados[date.getDay()];

  return diaAbreviado;
}

const queryAsync = (query, values = []) => {
  return new Promise((resolve, reject) => {
    connect.query(query, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

module.exports = class ControllerReserva {
static async createReserva(req, res) {
  const {
    periodos, //Uma lista de períodos
    fk_id_user,
    fk_id_sala,
    dias, //Uma lista de dias
    data_inicio,
    data_fim,
  } = req.body;

  //  Validação de campos obrigatórios
  if (
    !periodos ||
    !fk_id_user ||
    !fk_id_sala ||
    !dias ||
    !data_inicio ||
    !data_fim
  ) {
    return res
      .status(400)
      .json({ error: "Todos os campos devem ser preenchidos" });
  }

  //  Padronização da string 'dias'
  let diasArray;

  if (Array.isArray(dias)) {
    diasArray = dias;
  } else if (typeof dias === "string") {
    diasArray = dias.split(",").map((d) => d.trim());
  } else {
    return res
      .status(400)
      .json({ error: "O campo 'dias' deve ser um array ou string de dias" });
  }

  if (diasArray.length === 0) {
    return res
      .status(400)
      .json({ error: "O campo 'dias' deve ter ao menos 1 dia" });
  }

  diasArray = diasArray.map((d) => d.trim()).sort();
  const diasString = diasArray.join(",");

  if (new Date(data_inicio) > new Date(data_fim)) {
    return res.status(400).json({
      error: "A data de início não pode ser maior que a data de fim",
    });
  }

  //  Validação de serviço
  const validation = validateReserva({
    fk_id_user,
    fk_id_sala,
    dias: diasString,
    data_inicio,
    data_fim,
  });

  if (validation) return res.status(400).json(validation);

  try {
    // Verificação de FKs
    const usuario = await queryAsync(
      "SELECT id_user FROM user WHERE id_user = ?",
      [fk_id_user]
    );
    if (usuario.length === 0)
      return res.status(400).json({ error: "Usuário não encontrado" });

    const sala = await queryAsync(
      "SELECT id_sala, numero, descricao FROM sala WHERE id_sala = ?",
      [fk_id_sala]
    );
    if (sala.length === 0)
      return res.status(400).json({ error: "Sala não encontrada" });

    //  Gera os dias válidos dentro do intervalo
    const start = new Date(data_inicio + "T00:00:00");
    const end = new Date(data_fim + "T00:00:00");
    const diasValidos = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dataFormatada = d.toISOString().split("T")[0];
      const diaAtual = getDiaDaSemana(dataFormatada);

      if (diasArray.includes(diaAtual)) {
        diasValidos.push(dataFormatada);
      }
    }

    if (diasValidos.length === 0) {
      return res.status(400).json({
        error: `Nenhum dos dias selecionados (${diasArray.join(
          ", "
        )}) corresponde ao intervalo informado.`,
      });
    }

    const reservasCriadas = [];
    const errosReservas = [];

    for (const dataFormatada of diasValidos) {
      for (const periodo of periodos) {

        //  Sábado não pode reservar período >= 15
        const diaSemana = getDiaDaSemana(dataFormatada);
        if (diaSemana === "Sab" && periodo > 15) {
          errosReservas.push({
            data: dataFormatada,
            periodo,
            erro: "Sábado não permite reservas a partir de 17:30",
          });
          continue; // pula esta reserva
        }

        const conflitoValues = [
          dataFormatada,
          fk_id_user,
          fk_id_sala,
          periodo,
        ];

        try {
          const results = await queryAsync(
            "CALL conflit_day (?,?,?,?)",
            conflitoValues
          );

          reservasCriadas.push({
            data: dataFormatada,
            periodo,
            results,
          });
        } catch (err) {
          errosReservas.push({
            data: dataFormatada,
            periodo,
            erro: "O dia " + err.sqlMessage + " já está reservado",
          });
          console.error("Erro ao criar reserva:", err);
        }
      }
    }

    return res.status(201).json({
      message:
        reservasCriadas.length === 0
          ? "Nenhuma reserva criada"
          : `${reservasCriadas.length} reserva(s) criada(s) com sucesso.`,
      reservas: reservasCriadas,
      erros: `${errosReservas.length} erros ao reservar sendo eles: `,
      msgErros: errosReservas,
    });
  } catch (error) {
    console.error("Erro ao criar reserva:", error);
    return res.status(500).json({
      error: "Erro interno do servidor ao criar reservas",
      detalhe: error.message || error,
    });
  }
}


  // --- Atualizar reserva ---
  static async updateReserva(req, res) {
    // ... (Revisitar esta função. Se você mudou a lógica de createReserva, updateReserva também precisará de uma grande refatoração para ser consistente.)
    // ... (Mantendo seu código original com o erro de sintaxe corrigido da nossa conversa anterior) ...
    const { dias, data_inicio, data_fim } = req.body;
    const reservaId = req.params.id_reserva;

    // O 'validateReserva' precisa de mais campos, estou simulando aqui
    const validation = validateReserva({
      fk_id_user: 1,
      fk_id_sala: 1,
      dias,
      data_inicio,
      data_fim,
    });
    if (validation) return res.status(400).json(validation);

    try {
      const reservaExistente = await queryAsync(
        "SELECT fk_id_sala FROM reserva WHERE id_reserva = ?",
        [reservaId]
      );
      if (reservaExistente.length === 0)
        return res.status(404).json({ error: "Reserva não encontrada" });
      const { fk_id_sala } = reservaExistente[0];

      // CORREÇÃO: Removido o 'WHERE id_reserva = ?' duplicado
      await queryAsync(
        "UPDATE reserva SET dias = ?, data_inicio = ?, data_fim = ? WHERE id_reserva = ?",
        [dias.join(","), data_inicio, data_fim, reservaId]
      );
      return res
        .status(200)
        .json({ message: "Reserva atualizada com sucesso" });
    } catch (error) {
      console.error("Erro ao atualizar reserva:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // --- Excluir reserva ---
  static async deleteSchedule(req, res) {
    const reservaId = req.params.id_reserva;
    if (!reservaId)
      return res.status(400).json({ error: "ID da reserva é obrigatório" });

    try {
      const results = await queryAsync(
        "DELETE FROM reserva WHERE id_reserva = ?",
        [reservaId]
      );
      if (results.affectedRows === 0)
        return res.status(404).json({ error: "Reserva não encontrada" });
      return res
        .status(200)
        .json({ message: "Agendamento excluído com ID: " + reservaId });
    } catch (error) {
      console.error("Erro ao excluir reserva:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // --- Buscar reservas de um usuário, agrupadas por data (MODIFICADA) ---
  static async getSchedulesByUserID(req, res) {
    const userId = req.params.id_user;
  
    try {
      // Consulta: reservas do usuário com sala e período
      const results = await queryAsync(
        `
        SELECT 
          r.id_reserva,
          r.dia,
          s.numero AS nomeSala,
          s.descricao AS descricaoSala,
          p.horario_inicio,
          p.horario_fim,
          r.fk_id_periodo
        FROM reserva r
        JOIN sala s ON r.fk_id_sala = s.id_sala
        JOIN periodo p ON r.fk_id_periodo = p.id_periodo
        WHERE r.fk_id_user = ?
        ORDER BY r.dia, s.numero, p.horario_inicio;
        `,
        [userId]
      );
  
      const reservasPorData = {};
      const agora = new Date();
  
      results.forEach((reserva) => {
        const diaFormatado = reserva.dia
          ? new Date(reserva.dia).toISOString().split("T")[0]
          : "Data não informada";
  
        if (!reservasPorData[diaFormatado]) reservasPorData[diaFormatado] = [];
  
        // Função auxiliar para o dia da semana
        const diaDaSemana = getDiaDaSemana(diaFormatado);
  
        // Cria data/hora completa para checar se já passou
        const dataHoraFim = new Date(`${diaFormatado}T${reserva.horario_fim}`);
        const reservaPassou = dataHoraFim <= agora;
  
        const nomeSalaDisplay = reserva.nomeSala || "Sala não informada";
        const descricaoDetalhe = reserva.descricaoSala || "Sem descrição";
  
        // Procura grupo existente (sala + descrição)
        const existente = reservasPorData[diaFormatado].find(
          (r) =>
            r.nomeSalaDisplay === nomeSalaDisplay &&
            r.descricaoDetalhe === descricaoDetalhe
        );
  
        const novoPeriodo = {
          id_reserva: reserva.id_reserva,
          id_periodo: reserva.fk_id_periodo,
          horario_inicio: reserva.horario_inicio,
          horario_fim: reserva.horario_fim,
          passou: reservaPassou,
        };
  
        if (existente) {
          existente.periodos.push(novoPeriodo);
        } else {
          reservasPorData[diaFormatado].push({
            nomeSalaDisplay,
            descricaoDetalhe,
            diaDaSemana,
            periodos: [novoPeriodo],
          });
        }
      });
  
      // Ordena os períodos por horário de início
      Object.values(reservasPorData).forEach((listaReservasDoDia) => {
        listaReservasDoDia.forEach((grupo) => {
          grupo.periodos.sort((a, b) =>
            a.horario_inicio > b.horario_inicio ? 1 : -1
          );
        });
      });
  
      return res.status(200).json({ reservas: reservasPorData });
    } catch (error) {
      console.error("Erro inesperado:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  
  // Excluir apenas UM período específico dentro de uma reserva
  static async deletePeriodoReserva(req, res) {
    const { id_reserva, id_periodo } = req.params;

    if (!id_reserva || !id_periodo) {
      return res.status(400).json({
        error: "É necessário informar o id_reserva e o id_periodo.",
      });
    }

    try {
      const query = `
      DELETE FROM reserva 
      WHERE id_reserva = ? AND fk_id_periodo = ?
    `;

      connect.query(query, [id_reserva, id_periodo], (err, result) => {
        if (err) {
          console.error("Erro ao excluir período da reserva:", err);
          return res.status(500).json({ error: "Erro interno do servidor." });
        }

        if (result.affectedRows === 0) {
          return res
            .status(404)
            .json({ error: "Reserva ou período não encontrado." });
        }

        return res.status(200).json({
          message: "Período da reserva excluído com sucesso!",
        });
      });
    } catch (error) {
      console.error("Erro interno:", error);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }
  }

  // --- Buscar todas as reservas (DEIXADA NO FORMATO ORIGINAL) ---
  static async getAllReservas(req, res) {
    try {
      const query = `
                SELECT r.*, u.nome AS usernome, s.numero AS salaNome, s.descricao AS descricaoSala,
                       p.horario_inicio, p.horario_fim
                FROM reserva r
                JOIN user u ON r.fk_id_user = u.id_user
                JOIN periodo p ON r.fk_id_periodo = p.id_periodo
                JOIN sala s ON r.fk_id_sala = s.id_sala
            `;
      const results = await queryAsync(query);

      const reservasPorData = {};
      results.forEach((reserva) => {
        const dataInicio =
          reserva.data_inicio?.toISOString().split("T")[0] ||
          "Data não informada";
        const dataFim =
          reserva.data_fim?.toISOString().split("T")[0] || dataInicio;

        const currentDate = new Date(dataInicio);
        const endDate = new Date(dataFim);

        while (currentDate <= endDate) {
          const diaFormatado = currentDate.toISOString().split("T")[0];
          if (!reservasPorData[diaFormatado])
            reservasPorData[diaFormatado] = [];

          const existente = reservasPorData[diaFormatado].find(
            (r) => r.id_reserva === reserva.id_reserva
          );
          if (existente) {
            existente.periodos.push({
              horario_inicio: reserva.horario_inicio,
              horario_fim: reserva.horario_fim,
            });
          } else {
            reservasPorData[diaFormatado].push({
              id_reserva: reserva.id_reserva,
              nomeUsuario: reserva.usernome,
              nomeSala: reserva.salaNome || "Sala não informada",
              descricaoSala: reserva.descricaoSala || "Sem descrição",
              periodos: [
                {
                  horario_inicio: reserva.horario_inicio,
                  horario_fim: reserva.horario_fim,
                },
              ],
              dias: reserva.dias?.split(",").map((d) => d.trim()) || [],
            });
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }
      });

      return res.status(200).json({ reservas: reservasPorData });
    } catch (error) {
      console.error("Erro ao buscar reservas:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
  // --- Excluir reservas recorrentes ---
  static async deleteRecurringReservas(req, res) {
    try {
      const { fk_id_user, fk_id_sala, dias } = req.body;

      if (!fk_id_user || !fk_id_sala || !dias) {
        return res.status(400).json({
          error: "Campos fk_id_user, fk_id_sala e dias são obrigatórios",
        });
      }

      // Converter o array de dias em string igual ao formato do banco
      const diasString = Array.isArray(dias) ? dias.join(",") : dias;

      // Apagar todas as reservas que correspondem ao mesmo usuário, sala e conjunto de dias
      const results = await queryAsync(
        `DELETE FROM reserva WHERE fk_id_user = ? AND fk_id_sala = ? AND dias = ?`,
        [fk_id_user, fk_id_sala, diasString]
      );

      if (results.affectedRows === 0) {
        return res.status(404).json({
          error: "Nenhuma reserva recorrente encontrada para exclusão",
        });
      }

      return res.status(200).json({
        message: `Reservas recorrentes excluídas com sucesso (${results.affectedRows} registros)`,
      });
    } catch (error) {
      console.error("Erro ao excluir reservas recorrentes:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // --- Buscar reservas por data 
  static async getReservasByDate(req, res) {
    const { data } = req.params; // exemplo: 2025-11-11
  
    try {
      const results = await queryAsync(
        `SELECT 
            r.id_reserva,
            r.dia,
            s.numero AS salaNome, 
            s.descricao AS descricaoSala, 
            s.capacidade, 
            u.nome AS nomeUsuario, 
            p.horario_inicio, 
            p.horario_fim
         FROM reserva r
         JOIN sala s ON r.fk_id_sala = s.id_sala
         JOIN user u ON r.fk_id_user = u.id_user
         JOIN periodo p ON r.fk_id_periodo = p.id_periodo
         WHERE r.dia = ?
         ORDER BY s.numero, p.horario_inicio;`,
        [data]
      );
  
      if (results.length === 0) {
        return res
          .status(404)
          .json({ message: "Nenhuma reserva encontrada para esta data." });
      }
  
      // Agrupar reservas por sala
      const reservaBySala = {};
  
      results.forEach((reserva) => {
        const sala = reserva.salaNome || "Sala Desconhecida";
        if (!reservaBySala[sala]) {
          reservaBySala[sala] = [];
        }
  
        reservaBySala[sala].push({
          id_reserva: reserva.id_reserva,
          dia: reserva.dia,
          salaNome: reserva.salaNome,
          descricaoSala: reserva.descricaoSala,
          capacidade: reserva.capacidade,
          nomeUsuario: reserva.nomeUsuario,
          horario_inicio: reserva.horario_inicio,
          horario_fim: reserva.horario_fim,
        });
      });
  
      console.log("Resultado agrupado:", reservaBySala);
  
      return res.status(200).json({ reservaBySala });
  
    } catch (error) {
      console.error("Erro ao buscar reservas por data:", error);
      return res.status(500).json({
        error: "Erro interno do servidor",
        detalhe: error.message,
      });
    }
  }
  
};
