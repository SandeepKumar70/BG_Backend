import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db/dbconnect.js";
import cookieParser from "cookie-parser";
import cron from "node-cron";
import {
  calculateRating,
  createAndAssignDailyTasks,
} from "./controllers/task.controller.js";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "https://bringletech-crm-frontend.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://bringletech-crm-frontend.vercel.app",
      "http://192.168.18.100:5173",
      "http://localhost:5174",
      "https://bg-frontend-delta.vercel.app/"
    ], // Your React app's URL 
    credentials: true,
  })
);
app.use(cookieParser());
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

connectDB();

cron.schedule("59 23 * * *", () => {
  console.log("Running daily task assignment job");
  createAndAssignDailyTasks();
});

cron.schedule("59 23 * * *", () => {
  console.log("Running daily rating update");
  calculateRating();
});
// 0 22 * * *
import adminrouter from "./routes/admin.route.js";
import employeeRouter from "./routes/employee.route.js";
import taskRouter from "./routes/task.route.js";
import projectRouter from "./routes/project.route.js";
import configRouter from "./routes/config.route.js";
import notificationRouter from "./routes/notification.route.js";
import breakRouter from "./routes/break.route.js";
import AnnouncementRouter from "./routes/announcement.routes.js";
import leaveRouter from "./routes/leave.routes.js";
import employeeRatingRouter from "./routes/employeeRatings.routes.js"
import dailyTasksRouter from "./routes/dailyTasks.routes.js"

app.use("/admin", adminrouter);
app.use("/employee", employeeRouter);
app.use("/task", taskRouter);
app.use("/project", projectRouter);
app.use("/config", configRouter);
app.use("/notification", notificationRouter);
app.use("/break", breakRouter);
app.use("/announcement", AnnouncementRouter);
app.use("/leave", leaveRouter);
app.use("/ratings", employeeRatingRouter)
app.use("/dailyTasks", dailyTasksRouter)

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("join", (userId) => {
    socket.join(userId.toString());
    console.log(`User ${userId} joined their personal room`);
  });
  socket.on("join", (employeeId) => {
    socket.join(`employee_${employeeId}`);
    console.log(`Employee ${employeeId} joined their room`);
  });

  socket.on("message_delivered", ({ messageId, deliveredTo }) => {
    io.to(deliveredTo.toString()).emit("message_status", { messageId, status: 'delivered' });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });});

// Make io accessible to our routes
app.set("io", io);

httpServer.listen(3000, () =>
  console.log("Server listening on http://localhost on port 3000")
);
