# Dockerfile da interface e do canvas
FROM --platform=linux/amd64 node:18-alpine

WORKDIR /app

COPY . .

RUN npm install

RUN npm install @mui/material @emotion/react @emotion/styled

EXPOSE 3000

CMD ["npm","start"]