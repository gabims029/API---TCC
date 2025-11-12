# Projeto Base - API Node.js

Este repositório fornece a estrutura inicial para uma API de gerenciamento de reserva de salas de aula. Ele foi desenvolvido para servir como base para o projeto dos alunos.

## Objetivo da Sprint

- Implementar serviços para reaproveitamento de código (Clean Code).
- Refatorar o código, separando lógicas repetidas e criando serviços reutilizáveis.
- Criar a base para a API de reserva de salas de aula com autenticação de usuários e controle de agendamentos.

## Instalação do Projeto Base

1. Clone o repositório:
   ```sh
   git clone https://github.com/gabims029/API---TCC/tree/main

2. Crie um arquivo chamado ".env", nele você vai colar o que esta no arquivo ".env.example" e preencher com: 
SECRET=minhachavesecreta
DB_HOST=db
DB_USER=root
DB_PASSWORD=root
DB_NAME=senai

3. Digite no terminal o comando do Docker (Docker precisa estar intalado e aberto):
   docker compose up --build 

4. No Docker, você vai no conteiner que acabou de ser criado, clique na "db-1" e na na parte "Exec"

5. Digite o comando "mysql -u root -p" e coloque a senha: root. Digite o camando para entrar no bando de dados "use senai"

## Rotas da API

### User Routes
- **POST /user/login**: Realiza login de um usuário.
- **POST /user/**: Cria um novo usuário (somente para admin).
- **GET /user/**: Obtém todos os usuários.
- **GET /user/:id**: Obtém um usuário pelo ID.
- **PUT /user/**: Atualiza os dados de um usuário.
- **DELETE /user/:id**: Deleta um usuário.

### Classroom Routes
- **GET /salas/disponiveis**: Obtém as salas disponíveis para reserva (baseado na data).
- **GET /sala/bloco/:bloco**: Obtém uma sala de aula pelo bloco.
- **GET /sala/numero/:numero**: Obtém uma sala de aula pelo número.
- **POST /sala/**: Cria uma nova sala de aula (somente para admin).
- **GET /sala/**: Obtém todas as salas de aula.
- **PUT /sala/**: Atualiza os dados de uma sala de aula (somente para admin).
- **DELETE /sala/:numero**: Deleta uma sala de aula pelo número (somente para admin).

### Schedule Routes
- **POST /reserva/**: Cria um novo agendamento de reserva.
- **GET /reserva/**: Obtém todos os agendamentos de reserva.
- **GET /reserva/usuario/:id_user**: Obtém todos os agendamentos de um usuário específico pelo ID.
- **GET /reservas/data/:data**: Obtém os agendamentos para uma data específica.
- **GET /reserva/periodo/:id_reserva/:id_periodo**: Deleta um agendamento de reserva de um período específico.
- **PUT /reserva/:id_reserva**: Atualiza os dados de um agendamento de reserva.
- **DELETE /reserva/:id_reserva**: Deleta um agendamento de reserva.

### Periodo Routes
- **POST /periodo/**: Cria um novo período (somente para admin).
- **GET /periodo/**: Obtém todos os períodos.
- **GET /periodo/:id**: Obtém um período específico pelo ID.
- **PUT /periodo/:id**: Atualiza os dados de um período (somente para admin).
- **DELETE /periodo/:id**: Deleta um período específico (somente para admin).