import express from "express";

const app = express();
app.use(express.json());

// Health Check
app.get("/", (req, res) => {
  res.send("Acquire Intel Engine is running 🚀");
});

// Example processing route
app.post("/process", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    // Placeholder logic (will replace with live scrapers + scanners)
    const result = {
      input: text,
      message: "Engine received your request successfully."
    };

    res.json(result);

  } catch (err) {
    console.error("Engine Error:", err);
    res.status(500).json({ error: "Internal engine error" });
  }
});

// Render port
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Acquire Intel Engine running on port ${PORT}`);
});
