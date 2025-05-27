const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const socketio = require("socket.io");
const userRouter = require("./routes/userRoutes");
const socketIo = require("./socket");
const groupRouter = require("./routes/groupRoutes");
const messageRouter = require("./routes/messageRoutes");
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: ["http://127.0.0.1:5173"],
    method: ["GET", "POST"],
    Credentials: true,
  },
});

//middlewares
app.use(cors());
//app.use(cors(corsOption));
app.use(express.json());
//connect to db
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("connected to DB"))
  .catch((err) => console.log("Mongodb connected failed", err));

//initialize
socketIo(io);
//our route
app.use("/api/users", userRouter);
app.use("/api/groups", groupRouter);
app.use("/api/messages", messageRouter);
//start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, console.log("server is up and running on port", PORT));
