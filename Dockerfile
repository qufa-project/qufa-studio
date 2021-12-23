FROM node:16.3.0-alpine

WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

RUN npm install -g pm2 

COPY . .

ENV QUFA_DB_USER=$QUFA_DB_USER
ENV QUFA_DB_PASSWORD=$QUFA_DB_PASSWORD
ENV QUFA_DB_DATABASE=$QUFA_DB_DATABASE
ENV QUFA_DB_HOST=$QUFA_DB_HOST

RUN npx sequelize-cli db:migrate --config=./configs/db.config.js

EXPOSE 3000

CMD ["pm2-runtime", "start", "./bin/www", "--env", "production"]