const config = {
  aws: {
    accessKeyId: "",
    secretAccessKey: "",
    region: "",
  },
  db: {
    host: "localhost",
    user: "root",
    port: 3306,
    database: "qufa",
    password: "",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  },
};

module.exports = config;
