// server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// This will store our poll data in memory for this simple example
const pollData = {
    question: "What is your favorite programming language?",
    options: { "JavaScript": 0, "Python": 0, "Rust": 0, "Go": 0 },
};

// This line tells Express to serve the files inside the 'public' folder
app.use(express.static('public'));

// This is where we handle all the real-time magic
io.on('connection', (socket) => {
    console.log('A user connected');

    // When a new user connects, immediately send them the current poll status
    socket.emit('update', pollData);

    // When a user sends a 'vote' event, we update the data
    socket.on('vote', (option) => {
        if (pollData.options.hasOwnProperty(option)) {
            pollData.options[option]++;
            // After updating, send the new data to EVERYONE connected
            io.emit('update', pollData);
        }
    });

    // Handle when a user closes their browser
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000; // Use the host's port, or 3000 for local development
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
