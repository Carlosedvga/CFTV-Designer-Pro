
const express = require("express");
const path = require("path");
const cors = require("cors");
const db = require("./database");
const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/cameras", (req, res) => {
  const rows = db.prepare("SELECT * FROM cameras").all();
  res.json(rows);
});
app.get("/api/switches", (req, res) => {
  const rows = db.prepare("SELECT * FROM switches").all();
  res.json(rows);
});
app.get("/api/nvr", (req, res) => {
  const rows = db.prepare("SELECT * FROM nvr_dvr").all();
  res.json(rows);
});
app.get("/api/cables", (req, res) => {
  const rows = db.prepare("SELECT * FROM cables").all();
  res.json(rows);
});
app.get("/api/fiberCables", (req, res) => {
  const rows = db.prepare("SELECT * FROM fibers").all();
  res.json(rows);
});
app.get("/api/fiberEquipment", (req, res) => {
  const rows = db.prepare("SELECT * FROM fiber_equipment").all();
  res.json(rows);
});
app.get("/api/objects", (req, res) => {
  const rows = db.prepare("SELECT * FROM objects").all();
  res.json(rows);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`CFTV Designer Pro Backend running on port ${PORT}`));
