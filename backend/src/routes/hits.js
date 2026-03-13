import express from "express";
import db from "../config/db.js";

const router = express.Router();

router.get("/:page", async (req, res) => {
  try {
    const page = req.params.page;
    await db.query("INSERT INTO page_hits(page_name) VALUES(?)", [page]);
    const [rows] = await db.query(
      "SELECT COUNT(*) as hits FROM page_hits WHERE page_name=?",
      [page]
    );
    res.json({ hits: rows[0].hits });
  } catch (err) {
    res.json({ hits: 0 });
  }
});

export default router;
