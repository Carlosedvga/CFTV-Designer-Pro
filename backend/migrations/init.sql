
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS cameras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manufacturer TEXT,
    model TEXT,
    resolution INTEGER,
    lens_fov REAL,
    range_meters INTEGER,
    type TEXT
);
CREATE TABLE IF NOT EXISTS switches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manufacturer TEXT,
    model TEXT,
    ports INTEGER,
    poe INTEGER
);
CREATE TABLE IF NOT EXISTS nvr_dvr (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manufacturer TEXT,
    model TEXT,
    channels INTEGER,
    storage_tb REAL
);
CREATE TABLE IF NOT EXISTS fibers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    cores INTEGER,
    description TEXT
);
CREATE TABLE IF NOT EXISTS fiber_equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    manufacturer TEXT,
    model TEXT,
    properties TEXT
);
CREATE TABLE IF NOT EXISTS cables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    category TEXT,
    length_m INTEGER,
    brand TEXT
);
CREATE TABLE IF NOT EXISTS accessories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    brand TEXT,
    model TEXT,
    unit TEXT
);
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    client TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS project_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    item_type TEXT,
    item_id INTEGER,
    quantity INTEGER,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);
CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    model TEXT,
    model_3d TEXT
);
CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    description TEXT,
    model_3d TEXT
);
CREATE TABLE IF NOT EXISTS animals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    description TEXT,
    model_3d TEXT
);
CREATE TABLE IF NOT EXISTS objects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    description TEXT,
    model_3d TEXT
);
COMMIT;
