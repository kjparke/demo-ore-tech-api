const dotenv = require("dotenv");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const morgan = require("morgan");

const Database = require("./db.js");
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

/* Configure CORS */
const corsOptions = {
  origin: 'https://demo-ore-tech-app.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token '], 
  credentials: true
};

/* MIDDLEWARE CONFIGURATIONS */
dotenv.config();
const app = express();
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(morgan("dev"));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

/* GLOBAL MIDDLEWARE */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://demo-ore-tech-app.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-access-token");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === 'OPTIONS') {
    return res.status(200).send();
  }

  next();
});

/* ROUTES */
const API_ENDPOINT = "/api";
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

app.use((error, req, res, next) => {
  console.error(error);
  let errorMessage = "An unknown error has occurred.";
  if (error instanceof Error) errorMessage = error.message;
  res.status(500).json({ error: errorMessage });
});

/* DATABASE CONFIGURATIONS */
const SERVER_PORT = process.env.SERVER_PORT || 6000;

const db = new Database();
db.connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(SERVER_PORT, () => {
      console.log(`Ore-Tech API server running on port: ${SERVER_PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Error: ${err.message}`);
  });

module.exports = app;