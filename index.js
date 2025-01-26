const dotenv = require("dotenv");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");

const Database = require("./db.js");
const FileWatchService = require("./src/controllers/filewatch-service/FileWatchService.js");
const WebSocketService = require("./src/controllers/web-socket-service/WebSocketService.js");
const authRoutes = require("./src/routes/authRoutes.js");
const assetRoutes = require("./src/routes/assetRoutes.js");
const assetViewRoutes = require("./src/routes/AsssetViewRoutes.js");
const eventDeltaRoutes = require("./src/routes/eventDeltaRoutes.js");
const eventRoutes = require("./src/routes/eventRoutes.js");
const technicianRoutes = require("./src/routes/technicianRoutes.js");
const shiftRoutes = require("./src/routes/shiftRoutes.js");
const paRoutes = require("./src/routes/paRoutes.js");
const noteRoutes = require("./src/routes/noteRoutes.js");
const logRoutes = require("./src/routes/logRoutes.js");
const ahsRoutes = require("./src/routes/ahsRoutes.js");
const locationDeltaRoutes = require("./src/routes/locationDeltaRoutes.js");
const assetHistoryRoutes = require("./src/routes/assetHistoryRoutes.js");
const manualImportModalRoutes = require("./src/routes/ManualImportRoutes.js");
const formDataRoutes = require("./src/routes/FormDataRoutes.js");
const shopViewRoutes = require("./src/routes/ShopViewRoutes.js");
const shiftRosterRoutes = require("./src/routes/ShiftRosterRoutes.js");
const reportsViewRoutes = require("./src/routes/ReportsViewRoutes.js");

/* MIDDLEWARE CONFIGURATIONS */
dotenv.config();
const app = express();
const httpServer = http.createServer(app);
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(morgan("dev"));
app.use(cors());

/* GLOBAL MIDDLEWARE */
app.use((req, res, next) => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  next();
});

/* ROUTES */
const API_ENDPOINT = "/api";
app.use(API_ENDPOINT + "/auth", authRoutes);
app.use(API_ENDPOINT + "/shift", shiftRoutes);
app.use(API_ENDPOINT + "/log", logRoutes);
app.use(API_ENDPOINT + "/asset", assetRoutes);
app.use(API_ENDPOINT + "/asset-view", assetViewRoutes)
app.use(API_ENDPOINT + "/event", eventRoutes);
app.use(API_ENDPOINT + "/technician", technicianRoutes);
app.use(API_ENDPOINT + "/eventDelta", eventDeltaRoutes);
app.use(API_ENDPOINT + "/physicalAvailability", paRoutes);
app.use(API_ENDPOINT + "/note", noteRoutes);
app.use(API_ENDPOINT + "/ahsCalibrations", ahsRoutes);
app.use(API_ENDPOINT + "/location-delta", locationDeltaRoutes);
app.use(API_ENDPOINT + "/asset-history", assetHistoryRoutes);
app.use(API_ENDPOINT + "/manual-import-modal", manualImportModalRoutes);
app.use(API_ENDPOINT + "/form-data", formDataRoutes);
app.use(API_ENDPOINT + "/shop-view", shopViewRoutes);
app.use(API_ENDPOINT + "/shift-roster", shiftRosterRoutes);
app.use(API_ENDPOINT + "/report", reportsViewRoutes);
/* ERROR HANDLING */
app.use((req, res, next) => {
  next(Error.message);
});

app.use((error, _, res) => {
  console.error(error);
  let errorMessage = "An unknown error has occured.";
  if (error instanceof Error) errorMessage = error.message;
  res.status(500).json({ error: errorMessage });
});

/* DATABASE CONFIGURATIONS */
const SERVER_PORT = process.env.SERVER_PORT || 6000;
const WEB_SOCKET_SERVER_PORT = process.env.WEB_SOCKET_SERVER_PORT || 6001;

const db = new Database();
db.connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(SERVER_PORT, () => {
      console.log(`App server running on port: ${SERVER_PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Error: ${err.message}`);
  });

/* WATCH FOR STATUS CHANGE FROM WENCO AND MINESTAR */
const fileWatchService = new FileWatchService(
  process.env.FLEET_STATUS_DATA_DIR
);
const webSocketService = new WebSocketService(httpServer);

fileWatchService.on("FileEventProcessor", (data) => {
  webSocketService.broadcast(JSON.stringify(data));
});

fileWatchService.startWatching();
httpServer.listen(WEB_SOCKET_SERVER_PORT, () => {
  console.log(`Web socket server running on port: ${WEB_SOCKET_SERVER_PORT}`);
});
httpServer.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.log("Port 3002 is in use, trying another port...");
    server.listen(0);
  } else {
    throw error;
  }
});
