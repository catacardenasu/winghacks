import cors from "cors";
import express from "express";
import { gradeRoute } from "./api/grade.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

// API route FIRST
app.post("/api/grade", gradeRoute);

// Static files AFTER
app.use(express.static("."));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on :${port}`);
});
