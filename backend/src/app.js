import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import financeRoutes from "./routes/finance.routes.js";
import hitsRoutes from "./routes/hits.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/finance", financeRoutes);
app.use("/api/hits", hitsRoutes);

// TEST ROUTE
app.get("/test", (req, res) => {
  res.send("Finance backend working");
});

const PORT = process.env.PORT || 8800;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});