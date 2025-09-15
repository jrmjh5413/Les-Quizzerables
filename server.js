// server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// This object will now hold the data for all active rooms
// Example: { '123456': { question: '...', options: {...} } }
const rooms = {};

// The default poll structure for a new room
const defaultPoll = {
    question: "What is your favorite programming language?",
    options: { "JavaScript": 0, "Python": 0, "Rust": 0, "Go": 0 },
};

app.use(express.static('public'));

io.on('connection', (socket) => {
    // --- PRESENTER EVENTS ---
    socket.on('create_room', () => {
        // Generate a random 6-digit code
        let roomCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Ensure the code is unique
        while(rooms[roomCode]) {
            roomCode = Math.floor(100000 + Math.random() * 900000).toString();
        }

        socket.join(roomCode);
        rooms[roomCode] = JSON.parse(JSON.stringify(defaultPoll)); // Create a fresh copy of the poll
        
        console.log(`Presenter created and joined room ${roomCode}`);
        socket.emit('room_created', { roomCode, pollData: rooms[roomCode] });
    });

    // --- PARTICIPANT EVENTS ---
    socket.on('join_room', (roomCode) => {
        if (rooms[roomCode]) {
            socket.join(roomCode);
            console.log(`Participant joined room ${roomCode}`);
            // Send the current poll data to the participant who just joined
            socket.emit('update', rooms[roomCode]);
        } else {
            socket.emit('error_message', 'Room not found.');
        }
    });

    socket.on('vote', ({ roomCode, option }) => {
        const room = rooms[roomCode];
        if (room && room.options.hasOwnProperty(option)) {
            room.options[option]++;
            // Broadcast the update ONLY to clients in that specific room
            io.to(roomCode).emit('update', room);
        }
    });
    
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        // Here you might add logic to clean up empty rooms
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
