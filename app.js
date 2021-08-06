var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var sassMiddleware = require("node-sass-middleware");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require('swagger-ui-express');

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var datasRouter = require("./routes/datas");

// swagger initialize
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Qufa API',
      version: '0.0.1'
    },
  },
  apis: ['./routes/datas.js']
}

const openapiSpecification = swaggerJsdoc(options);

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  sassMiddleware({
    src: path.join(__dirname, "public"),
    dest: path.join(__dirname, "public"),
    indentedSyntax: false, // true = .sass and false = .scss
    sourceMap: true,
    outputStyle: "compressed",
  })
);
app.use(express.static(path.join(__dirname, "public")));

//web
app.use("/", indexRouter);
app.use("/users", usersRouter);

//api
app.use("/datas", datasRouter);

//docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiSpecification))


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
