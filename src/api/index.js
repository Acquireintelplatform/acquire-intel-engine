// src/api/index.js
import express from "express";

import scrapeRouter from "./scrape.js";
import propertiesRouter from "./properties.js";
import distressRouter from "./distress.js";

const router = express.Router();

router.use("/scrape", scrapeRouter);
router.use("/properties", propertiesRouter);
router.use("/distress", distressRouter);

export default router;
