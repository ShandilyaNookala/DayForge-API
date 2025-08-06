const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");

dotenv.config({ path: "./config.env" });

const positionsRouter = require("./routes/positionsRouter");
const recordsRouter = require("./routes/recordsRouter");
const rulesRouter = require("./routes/rulesRouter");
const usersRouter = require("./routes/usersRouter");
const authRouter = require("./routes/authRouter");
const integrationRouter = require("./routes/integrationRouter");
const { nonProtectedRoutes } = require("./config");
const { protect } = require("./controllers/authController");

const app = express();

app.use(
  cors({
    origin: process.env.ORIGIN_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
app.use(cookieParser());
app.use((req, res, next) => {
  if (req.method === "POST" && nonProtectedRoutes.includes(req.path)) {
    next();
  } else {
    protect(req, res, next);
  }
});

const DB = process.env.DATABASE_DAYFORGE.replace(
  "<USERNAME>",
  process.env.DB_USERNAME
).replace("<PASSWORD>", process.env.PASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
  })
  .then(() => console.log("DB successfully connected"));

app.listen(8000, () => {
  console.log(`App running on port ${8000}...`);
});

app.use("/positions", positionsRouter);
app.use("/records", recordsRouter);
app.use("/rules", rulesRouter);
app.use("/users", usersRouter);
app.use("/auth", authRouter);
app.use("/", integrationRouter);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    status: "fail",
    message: err.message,
  });
});

exports.dayForgeAPI = app;
