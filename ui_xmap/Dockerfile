# Use uma imagem base mais recente e eficiente
FROM --platform=linux/amd64 node:20-alpine

# Defina o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copie os arquivos de manifesto e bloqueio de dependências primeiro
COPY package*.json ./

# Instale todas as dependências do projeto
RUN npm install

RUN npm install react-modal

# Copie o restante dos arquivos da aplicação
COPY . .

# Expõe a porta que a aplicação de desenvolvimento usa
EXPOSE 8080

# Defina o comando para iniciar a aplicação
CMD ["npm", "run", "dev"]