# Projeto Base - API Node.js

Este repositório fornece a estrutura inicial para uma API de gerenciamento de reserva de salas de aula. Ele foi desenvolvido para servir como base para o projeto dos alunos.

## Objetivo da Sprint

- Implementar serviços para reaproveitamento de código (Clean Code).
- Refatorar o código, separando lógicas repetidas e criando serviços reutilizáveis.
- Criar a base para a API de reserva de salas de aula com autenticação de usuários e controle de agendamentos.

## Instalação do Projeto Base

1. Clone o repositório:
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
- **POST /user/**: Cria um novo usuário.
- **POST /user/login**: Realiza login de um usuário.
- **GET /user/**: Obtém todos os usuários.
- **GET /user/:id**: Obtém um usuário pelo ID.
- **PUT /user/:id**: Atualiza os dados de um usuário.
- **DELETE /user/:id**: Deleta um usuário.

### Classroom Routes
- **POST /classroom/**: Cria uma nova sala de aula.
- **GET /classroom/**: Obtém todas as salas de aula.
- **GET /classroom/:number**: Obtém uma sala de aula pelo número.
- **PUT /classroom/**: Atualiza uma sala de aula.
- **DELETE /classroom/:number**: Deleta uma sala de aula.

### Schedule Routes
- **POST /schedule/**: Cria um novo agendamento.
- **GET /schedule/**: Obtém todos os agendamentos.
- **GET /schedule/:id**: Obtém os agendamentos de uma sala de aula específica pelo ID.
- **GET /schedule/ranges/:id**: Obtém os agendamentos de uma sala de aula específica em intervalos de tempo.
- **DELETE /schedule/:id**: Deleta um agendamento.

### Periodo Routes
- **POST /periodo/**: Cria um novo periodo.
- **GET /periodo/**: Obtém todos os periodos.
- **GET /periodo/:id**: Obtém um periodo específica pelo ID.
- **DELETE /periodo/:id**: Deleta um agendamento.
