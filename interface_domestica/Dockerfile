FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install

RUN npm install @mui/material @emotion/react @emotion/styled

EXPOSE 3000

CMD ["npm","start"]