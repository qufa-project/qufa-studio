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

RUN npx sequelize-cli db:migrate --config=./configs/db.config.json

EXPOSE 3000

CMD ["pm2-runtime", "start", "./bin/www", "--env", "production"]