import express from "express";

const app = express();
app.use(express.json());

// Health Check
app.get("/", (req, res) => {
  res.send("Acquire Intel Engine is running 🚀");
});

// MAIN ENDPOINT (REQBIN WILL CALL THIS)
app.post("/api/analyse", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "No text provided" });
    }

    const reply = `Received: ${text}. Engine analysis successful.`; // temporary mock

    res.json({
      status: "ok",
      reply
    });

  } catch (error) {
    console.error("Engine Error:", error);
    res.status(500).json({ error: "Internal engine error" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Acquire Intel Engine running on port ${PORT}`);
});
