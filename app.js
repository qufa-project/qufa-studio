var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
const passportConfig = require("./utils/passport");
const flash = require("connect-flash");

const cron = require("node-cron");
const TaskService = require("./services/TaskService");
const taskService = new TaskService();

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var datasRouter = require("./routes/datas");
var datasetsRouter = require("./routes/datasets");
var projectsRouter = require("./routes/projects");
var groupRouter = require("./routes/groups");

const initSession = require("./utils/session");

// swagger initialize
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Qufa API",
      version: "0.0.1",
    },
  },
  apis: ["./routes/datas.js"],
};

const openapiSpecification = swaggerJsdoc(options);

var app = express();
app.locals.moment = require("moment");
app.locals.util = require("./utils");

initSession(app);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passportConfig();

// locals currentUser middleware
app.use(function (req, res, next) {
  if (req.user) {
    res.locals.currentUser = req.user;
  }
  next();
});

//flash middleware
app.use(function (req, res, next) {
  res.locals.message = req.flash();
  next();
});

//web
app.use("/", indexRouter);
app.use("/users", usersRouter);

//api
app.use("/datas", datasRouter);

//projects
app.use("/projects", projectsRouter);

//datasets
app.use("/datasets", datasetsRouter);

//groups
app.use("/groups", groupRouter);

//docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiSpecification));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  console.error(err);
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// Task 처리를 위한 Scheduler
cron.schedule("*/10 * * * * *", async () => {
  console.log("check task ===================================");
  try {
    await taskService.runTask();
  } catch (err) {
    console.log(err);
  }
});

// Task 완료에 따른 데이터 후처리
cron.schedule("*/10 * * * * *", async () => {
  console.log("check post task ===================================");
  try {
    await taskService.runPostTask();
  } catch (err) {
    console.log(err);
  }
});

// Task 완료에 따른 데이터 후처리
cron.schedule("*/10 * * * * *", async () => {
  console.log("check profiling task ===================================");
  try {
    await taskService.checkProfiling();
  } catch (err) {
    console.log(err);
  }
});

module.exports = app;
