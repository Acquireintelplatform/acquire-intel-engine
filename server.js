import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

// =============================
// IMPORT API ROUTES
// =============================
import apiRouter from "./src/api/index.js";

const app = express();
app.use(cors());
app.use(express.json());

// =============================
// USE API ROUTER
// =============================
app.use("/api", apiRouter);

// =============================
// START SERVER
// =============================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
