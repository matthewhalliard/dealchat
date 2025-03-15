require("dotenv").config({ path: ".env.local" }); console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "is set" : "is NOT set");
