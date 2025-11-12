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
- **POST /user/**: Cria um novo usuário.
- **POST /user/login**: Realiza login de um usuário.
- **GET /user/**: Obtém todos os usuários.
- **GET /user/:id**: Obtém um usuário pelo ID.
- **PUT /user/**: Atualiza os dados de um usuário.
- **DELETE /user/:id**: Deleta um usuário.

### Classroom Routes
- **POST /sala/**: Cria uma nova sala de aula.
- **GET /sala/**: Obtém todas as salas de aula.
- **GET /sala/numero/:numero**: Obtém uma sala de aula pelo número.
- **GET /sala/bloco/:bloco**: Obtém uma sala de aula pelo bloco.
- **GET /salas/disponiveis**: Obtém as salas disponíveis em um data específica
- **PUT /sala/**: Atualiza uma sala de aula.
- **DELETE /sala/:numero**: Deleta uma sala de aula.

### Schedule Routes
- **POST /reserva/**: Cria uma reserva.
- **GET /reserva/**: Obtém todos as reservas.
- **GET /reserva/usuario/:id_user**: Obtém as reservas de um usuário específica pelo ID.
- **GET /reserva/data/:data**: Obtém as resevas de uma data específica.
- **DELETE /reserva/:id_reserva**: Deleta uma reserva.

### Periodo Routes
- **POST /periodo/**: Cria um novo período.
- **GET /periodo/**: Obtém todos os períodos.
- **GET /periodo/status**: Obtém os status dos períodos.
- **GET /periodo/:id**: Obtém um período específica pelo ID.
- **DELETE /periodo/:id**: Deleta um período.
