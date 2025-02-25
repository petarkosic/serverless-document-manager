FROM node:22-alpine

WORKDIR /app

# Install netcat for LocalStack readiness check
RUN apk add --no-cache netcat-openbsd

COPY package*.json ./

RUN npm install

COPY app.js .

COPY wait-for-localstack.sh .

RUN chmod +x wait-for-localstack.sh

EXPOSE 3000