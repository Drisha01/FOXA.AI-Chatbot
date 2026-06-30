import express from "express";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Gemini
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Chat API
app.post("/chat", async (req, res) => {

    console.log("Request Body:", req.body);

    try {

        const { message } = req.body;

        if (!message || message.trim() === "") {
            return res.status(400).json({
                reply: "Message is required."
            });
        }

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: message,
                },
            ],
        });

        const text = completion.choices[0].message.content;

        console.log(text);

        res.status(200).json({
            reply: text
        });

    } catch (error) {

        console.error("Groq Error:", error);

        res.status(500).json({
            reply: error.message || "Internal Server Error"
        });

    }

});

// Home Route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});