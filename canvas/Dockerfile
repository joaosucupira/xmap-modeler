# Dockerfile da interface e do canvas
FROM --platform=linux/amd64 node:18-alpine

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 8080

CMD ["npm","start"]