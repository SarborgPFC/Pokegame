const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');  // Import path module to serve static files
const app = express();
const port = 3000;
const db = new sqlite3.Database('./scores.db'); // Connect to SQLite database

// Enable CORS for all incoming requests (allow frontend to communicate with backend)
app.use(cors({
    origin: 'http://localhost:3000', // Adjust this to allow the frontend to talk to the backend
    methods: 'GET, POST',
    allowedHeaders: 'Content-Type'
}));

// Serve static files (HTML, CSS, JS) from "dinosaur-game-client" folder
app.use(express.static(path.join(__dirname, 'dinosaur-game-client')));

// Create a table for scores if it doesn't exist
db.run('CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY AUTOINCREMENT, playerName TEXT, score INTEGER)');

// Middleware to parse JSON data
app.use(express.json());

// Endpoint to save score
app.post('/save-score', (req, res) => {
  const { playerName, score } = req.body;

  // Validate input
  if (typeof playerName !== 'string' || typeof score !== 'number') {
    return res.status(400).send('Invalid data format. playerName must be a string, and score must be a number.');
  }

  db.run(`INSERT INTO scores (playerName, score) VALUES (?, ?)`, [playerName, score], function (err) {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.send(`Score saved with id: ${this.lastID}`);
  });
});

// Endpoint to retrieve all scores (sorted in descending order)
app.get('/scores', (req, res) => {
  db.all('SELECT * FROM scores ORDER BY score DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(rows);  // Send scores as a JSON array
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
