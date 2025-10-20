const connect = require("../db/connect");
const validateReserva = require("../services/validateReserva");

// Função auxiliar para obter o nome do dia da semana (em português)
function getDiaDaSemana(dateString) {
    const date = new Date(dateString + 'T00:00:00'); // Adiciona T00:00:00 para evitar problemas de fuso horário
    // Cria um formatador de data para o nome do dia em português
    const formatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });
    // Retorna o nome formatado e capitaliza a primeira letra
    return formatter.format(date).charAt(0).toUpperCase() + formatter.format(date).slice(1);
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
    // --- Criar reserva ---
    static async createReserva(req, res) {
        const { fk_id_periodo, fk_id_user, fk_id_sala, dias, data_inicio, data_fim } = req.body;

        if (!fk_id_periodo || !fk_id_user || !fk_id_sala || !dias || !data_inicio || !data_fim) {
            return res.status(400).json({ error: "Todos os campos devem ser preenchidos" });
        }

        if (new Date(data_inicio) > new Date(data_fim)) {
            return res.status(400).json({ error: "A data de início não pode ser maior que a data de fim" });
        }

        if (!Array.isArray(dias) || dias.length === 0) {
            return res.status(400).json({ error: "O campo 'dias' deve ser um array com ao menos 1 dia" });
        }

        const diasArray = dias.map(d => d.trim());
        const diasString = diasArray.join(",");

        const validation = validateReserva({ fk_id_periodo, fk_id_user, fk_id_sala, dias: diasString, data_inicio, data_fim });
        if (validation) return res.status(400).json(validation);

        try {
            const usuario = await queryAsync("SELECT id_user FROM user WHERE id_user = ?", [fk_id_user]);
            if (usuario.length === 0) return res.status(400).json({ error: "Usuário não encontrado" });

            const sala = await queryAsync("SELECT id_sala, numero, descricao FROM sala WHERE id_sala = ?", [fk_id_sala]);
            if (sala.length === 0) return res.status(400).json({ error: "Sala não encontrada" });

            const periodo = await queryAsync("SELECT * FROM periodo WHERE id_periodo = ?", [fk_id_periodo]);
            if (periodo.length === 0) return res.status(400).json({ error: "Período não encontrado" });

            const { horario_inicio, horario_fim } = periodo[0];

            // Verifica conflitos
            const conflitoQuery = `
                SELECT r.id_reserva 
                FROM reserva r
                JOIN periodo p ON r.fk_id_periodo = p.id_periodo
                WHERE r.fk_id_sala = ? AND FIND_IN_SET(?, r.dias) > 0
                  AND (
                    (p.horario_inicio < ? AND p.horario_fim > ?) 
                    OR
                    (p.horario_inicio < ? AND p.horario_fim > ?)
                  )
            `;
            for (const dia of diasArray) {
                const conflito = await queryAsync(conflitoQuery, [fk_id_sala, dia, horario_fim, horario_inicio, horario_inicio, horario_fim]);
                if (conflito.length > 0) {
                    return res.status(400).json({ error: `A sala já está reservada no dia ${dia} nesse período (${horario_inicio} - ${horario_fim})` });
                }
            }

            // Inserção da reserva
            const insertQuery = `
                INSERT INTO reserva (fk_id_periodo, fk_id_user, fk_id_sala, dias, data_inicio, data_fim)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const result = await queryAsync(insertQuery, [fk_id_periodo, fk_id_user, fk_id_sala, diasString, data_inicio, data_fim]);

            return res.status(201).json({ message: "Reserva criada com sucesso", id_reserva: result.insertId });
        } catch (error) {
            console.error("Erro ao criar reserva:", error);
            return res.status(500).json({ error: "Erro ao criar reserva", detalhe: error.message || error });
        }
    }

    // --- Atualizar reserva ---
    static async updateReserva(req, res) {
        const { dias, data_inicio, data_fim } = req.body;
        const reservaId = req.params.id_reserva;

        // O 'validateReserva' precisa de mais campos, estou simulando aqui
        const validation = validateReserva({ fk_id_user: 1, fk_id_sala: 1, dias, data_inicio, data_fim });
        if (validation) return res.status(400).json(validation);

        try {
            const reservaExistente = await queryAsync("SELECT fk_id_sala FROM reserva WHERE id_reserva = ?", [reservaId]);
            if (reservaExistente.length === 0) return res.status(404).json({ error: "Reserva não encontrada" });
            const { fk_id_sala } = reservaExistente[0];

            await queryAsync("UPDATE reserva SET dias = ?, data_inicio = ?, data_fim = ? WHERE id_reserva = ? WHERE id_reserva = ?", [dias.join(","), data_inicio, data_fim, reservaId]);
            return res.status(200).json({ message: "Reserva atualizada com sucesso" });
        } catch (error) {
            console.error("Erro ao atualizar reserva:", error);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
    }

    // --- Excluir reserva ---
    static async deleteSchedule(req, res) {
        const reservaId = req.params.id_reserva;
        if (!reservaId) return res.status(400).json({ error: "ID da reserva é obrigatório" });

        try {
            const results = await queryAsync("DELETE FROM reserva WHERE id_reserva = ?", [reservaId]);
            if (results.affectedRows === 0) return res.status(404).json({ error: "Reserva não encontrada" });
            return res.status(200).json({ message: "Agendamento excluído com ID: " + reservaId });
        } catch (error) {
            console.error("Erro ao excluir reserva:", error);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
    }

    // --- Buscar reservas de um usuário, agrupadas por data (MODIFICADA) ---
    static async getSchedulesByUserID(req, res) {
        const userId = req.params.id_user;

        try {
            // 1. Consulta SQL para buscar todas as reservas, salas e períodos do usuário
            const results = await queryAsync(
                `SELECT r.*, s.numero AS nomeSala, s.descricao AS descricaoSala,
                        p.horario_inicio, p.horario_fim
                 FROM reserva r
                 JOIN sala s ON r.fk_id_sala = s.id_sala
                 JOIN periodo p ON r.fk_id_periodo = p.id_periodo
                 WHERE r.fk_id_user = ?`,
                [userId]
            );

            const reservasPorData = {};
            const agora = new Date(); // Data/Hora atual para comparação

            // 2. Loop sobre os resultados e agrupe por data, nome da sala e descrição
            results.forEach(reserva => {
                const dataInicio = reserva.data_inicio?.toISOString().split("T")[0] || "Data não informada";
                const dataFim = reserva.data_fim?.toISOString().split("T")[0] || dataInicio;

                const currentDate = new Date(dataInicio);
                const endDate = new Date(dataFim);

                // Troca de Campos conforme solicitado:
                const nomeSalaDisplay = reserva.nomeSala || "Sala não informada";       // Ex: "A6" (NOVO TÍTULO)
                const descricaoDetalhe = reserva.descricaoSala || "Sem descrição"; // Ex: "PNEUMATICA/HIDRAULICA" (NOVO DETALHE)

                // Loop para cobrir todas as datas do período de reserva
                while (currentDate <= endDate) {
                    const diaFormatado = currentDate.toISOString().split("T")[0];
                    if (!reservasPorData[diaFormatado]) reservasPorData[diaFormatado] = [];

                    // OBTÉM O DIA DA SEMANA
                    const diaDaSemana = getDiaDaSemana(diaFormatado);

                    // Cria a data/hora COMPLETA de TÉRMINO para verificar se passou
                    const dataHoraFimString = diaFormatado + ' ' + reserva.horario_fim;
                    const dataHoraFim = new Date(dataHoraFimString);
                    const reservaPassou = dataHoraFim <= agora;

                    // 3. Busca um grupo existente (nomeSalaDisplay + descricaoDetalhe)
                    const existente = reservasPorData[diaFormatado].find(
                        r => r.nomeSalaDisplay === nomeSalaDisplay && r.descricaoDetalhe === descricaoDetalhe
                    );

                    const novoPeriodo = {
                        horario_inicio: reserva.horario_inicio,
                        horario_fim: reserva.horario_fim,
                        passou: reservaPassou // Flag para o Front-end
                    };

                    if (existente) {
                        // Adiciona o novo período
                        existente.periodos.push(novoPeriodo);
                    } else {
                        // Cria um novo grupo
                        reservasPorData[diaFormatado].push({
                            nomeSalaDisplay: nomeSalaDisplay,
                            descricaoDetalhe: descricaoDetalhe,
                            diaDaSemana: diaDaSemana, // NOVO CAMPO
                            periodos: [novoPeriodo],
                            dias: reserva.dias?.split(",").map(d => d.trim()) || [],
                        });
                    }

                    // Avança para o próximo dia.
                    // É crucial usar `currentDate.getTime() + 24 * 60 * 60 * 1000` para evitar problemas com DST
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            });

            // Opcional: Ordenar os períodos dentro de cada grupo por horário de início
            Object.values(reservasPorData).forEach(listaReservasDoDia => {
                listaReservasDoDia.forEach(grupo => {
                    grupo.periodos.sort((a, b) => (a.horario_inicio > b.horario_inicio) ? 1 : -1);
                });
            });

            return res.status(200).json({ reservas: reservasPorData });
        } catch (error) {
            console.error("Erro inesperado:", error);
            return res.status(500).json({ error: "Erro interno do servidor" });
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
            results.forEach(reserva => {
                const dataInicio = reserva.data_inicio?.toISOString().split("T")[0] || "Data não informada";
                const dataFim = reserva.data_fim?.toISOString().split("T")[0] || dataInicio;

                const currentDate = new Date(dataInicio);
                const endDate = new Date(dataFim);

                while (currentDate <= endDate) {
                    const diaFormatado = currentDate.toISOString().split("T")[0];
                    if (!reservasPorData[diaFormatado]) reservasPorData[diaFormatado] = [];

                    const existente = reservasPorData[diaFormatado].find(r => r.id_reserva === reserva.id_reserva);
                    if (existente) {
                        existente.periodos.push({ horario_inicio: reserva.horario_inicio, horario_fim: reserva.horario_fim });
                    } else {
                        reservasPorData[diaFormatado].push({
                            id_reserva: reserva.id_reserva,
                            nomeUsuario: reserva.usernome,
                            nomeSala: reserva.salaNome || "Sala não informada",
                            descricaoSala: reserva.descricaoSala || "Sem descrição",
                            periodos: [{ horario_inicio: reserva.horario_inicio, horario_fim: reserva.horario_fim }],
                            dias: reserva.dias?.split(",").map(d => d.trim()) || [],
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

    // --- Buscar reservas por data (DEIXADA NO FORMATO ORIGINAL) ---
    static async getReservasByDate(req, res) {
        const { data } = req.params;
        try {
            const results = await queryAsync(
                `SELECT r.*, s.numero AS salaNome, s.descricao AS descricaoSala, u.nome AS nomeUsuario
                 FROM reserva r
                 JOIN sala s ON r.fk_id_sala = s.id_sala
                 JOIN user u ON r.fk_id_user = u.id_user
                 JOIN periodo p ON r.fk_id_periodo = p.id_periodo
                 WHERE r.data_inicio <= ? AND r.data_fim >= ?`,
                [data, data]
            );

            return res.status(200).json({ reservas: results });
        } catch (error) {
            console.error("Erro ao buscar reservas por data:", error);
            return res.status(500).json({ error: "Erro interno do servidor" });
        }
    }
};