const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

const PORT = 8776;

let users = [];

app.use(express.static(path.join(__dirname, "/public")));

app.get("/", (res, req) => {
    req.sendFile(path.join(__dirname, "/public/index.html"));
});

io.on("connection", (socket) => {
    socket.on("add user", (username) => {
        socket.data.username = username;
        users.push(username);
        socket.emit("login", {
            numUsers: users.length,
        });
        socket.broadcast.emit("user joined", {
            username: username,
            numUsers: users.length,
        });
    });

    socket.on("new message", (message) => {
        socket.broadcast.emit("new message", {
            username: socket.data.username,
            message: message,
        });
    });

    socket.on("disconnect", () => {
        const username = socket.data.username;
        const index = users.indexOf(username);
        if (index !== -1) {
            users.splice(index, 1);
        }

        socket.broadcast.emit("user left", {
            username: username,
            numUsers: users.length,
        });
    });
});

httpServer.listen(PORT, () => {
    console.log(`server started on port ${PORT}`);
});
