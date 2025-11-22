import express from "express";

import propertiesRoutes from "./properties.js";
import scrapeRoutes from "./scrape.js";
import distressRoutes from "./distress.js";

const router = express.Router();

router.use("/properties", propertiesRoutes);
router.use("/scrape", scrapeRoutes);
router.use("/distress", distressRoutes);

export default router;
