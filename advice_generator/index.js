// Import express and axios
import express from "express";
import axios from "axios";

// Create express app and set port number
const app = express();
const port = 3000;

// Use public folder for static files
app.use(express.static("public"));

// When the user goes to the home page it should render the index.ejs file
// Use axios to get random advice and pass it to index.ejs to display a random advice
app.get("/", async (req, res) => {
    try {
        const response = await axios.get("https://api.adviceslip.com/advice");
        res.render("index.ejs", {advice: response.data.slip.advice});
    } catch (error) {
        console.log("Failed to make request:", error.message);
        res.status(500).send("Failed to fetch activity. Please try again.");
    }
});


// Listen on port and start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
