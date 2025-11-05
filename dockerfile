## Usa Node 20 LTS com Alpine (leve e compatível)
FROM node:20-alpine

## Define o diretório de trabalho
WORKDIR /usr/app

## Copia os arquivos de dependências
COPY package*.json ./

## Instala dependências
RUN npm install

## Copia o restante do código da aplicação
COPY . .

## Expõe a porta 5000 (onde o app vai rodar)
EXPOSE 5000

## Comando padrão para iniciar a aplicação
CMD ["npm", "start"]
