const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

const PORT = 8776;

const usernameRegex = /[^A-Za-z0-9 `.]/g;
let users = [];

app.use(express.static(path.join(__dirname, "/public")));

app.get("/", (res, req) => {
    req.sendFile(path.join(__dirname, "/public/index.html"));
});

io.on("connection", (socket) => {
    socket.on("add user", (username) => {
        username = username.trim();

        if (username.length > 16) {
            return;
        }
        if (users.includes(username)) {
            socket.emit("name rejected", {
                reason: "This name is already in use. Please choose another name.",
            });
            return;
        }
        if (usernameRegex.test(username)) {
            socket.emit("name rejected", {
                reason: "This name contains invalid characters. Only alphanumeric characters and spaces are allowed.",
            });
            return;
        }

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
        if (message.length > 300) {
            return;
        }
        socket.broadcast.emit("new message", {
            username: socket.data.username,
            message: sanitize(message),
        });
    });

    socket.on("disconnect", () => {
        const username = socket.data.username;

        if (!username) return;

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

function sanitize(input) {
    return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

httpServer.listen(PORT, () => {
    console.log(`server started on port ${PORT}`);
});
