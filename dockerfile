## Baixa e executa a imagem do node na versão Alpine (Versão simplificada)
FROM node:20.11.1-alpine

## Define o local onde o app irá ficar no disco do container
WORKDIR /usr/app

## Copia tudo que começa com package e termina com .json para dentro de /usr/app
COPY package*.json ./

## Executa npm install para adicionar todas as dependências e criar a pasta node_modules
RUN npm install

## Copia o restante do código da aplicação para dentro do container
COPY . .

## Container ficará ouvindo os acessos da porta 5000
EXPOSE 5000

## Executa o comando para iniciar o script que está no package.json
CMD ["npm", "start"]
