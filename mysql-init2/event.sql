create event if not exists excliurReservasAntigas
    on schedule every 1 day
    starts current_timestamp + interval 5 minute
    on completion preserve
    enable
do
    delete from reserva
    where data < now() - interval 6 month;

