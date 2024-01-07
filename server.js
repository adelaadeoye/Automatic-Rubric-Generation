// server.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS middleware
app.use(cors());

// Parse JSON bodies
app.use(bodyParser.json());

// Define a route for handling the question request
app.post('/ask-question', async (req, res) => {
  try {
    const { model, content } = req.body;
    const response = await axios.get(`https://hercai.onrender.com/${model}/hercai?question=${encodeURIComponent(content)}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
