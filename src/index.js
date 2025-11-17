import express from "express";

const app = express();
app.use(express.json());

// Health Check
app.get("/", (req, res) => {
  res.send("Acquire Intel Engine is running 🚀");
});

// 🔥 MAIN ANALYSIS ENDPOINT (this is what REQBIN is calling)
app.post("/api/analyse", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    // TEMPORARY MOCK RESPONSE (we will later replace with real AI + scrapers)
    const reply = `Received: "${text}". Engine analysis successful.`;

    res.json({
      status: "ok",
      reply
    });

  } catch (err) {
    console.error("Engine Error:", err);
    res.status(500).json({ error: "Internal engine error" });
  }
});

// Temporary process route (optional)
app.post("/process", (req, res) => {
  res.json({ message: "Process route working", data: req.body });
});

// Render port
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Acquire Intel Engine running on port ${PORT}`);
});
