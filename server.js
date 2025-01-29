const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const path = require("path");
const { readFileSync } = require("fs");

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

const PORT = 3000;

const usernameRegex = /[^A-Za-z0-9 `.]/g;
let users = [];
const admins = JSON.parse(readFileSync("./users.json"));

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

        if (admins[username]) {
            socket.emit("password prompt", username);
            return;
        }

        addUser(socket, username);
    });

    socket.on("password submit", (password, username) => {
        const userData = admins[username];

        if (!userData) return;
        if (userData.password !== password) {
            socket.emit("name rejected", {
                reason: "Invalid password.",
            });
            return;
        }
        socket.data.roles = userData.roles || [];
        addUser(socket, username);
    });

    socket.on("new message", async (message) => {
        if (message.length > 300) {
            return;
        }
        if (message[0] === "/") {
            //todo make better command parser
            parsed = message.split(" ");
            const roles = socket.data.roles;
            switch (parsed[0]) {
                case "/kick":
                    const username = message.split("/kick ")[1];
                    if (!roles || !roles.includes("admin")) return;
                    if (!users.includes(username)) return;
                    socket.emit("user kicked", {
                        username: username,
                    });
                    for (const socket of await io.fetchSockets()) {
                        if (socket.data.username == username) {
                            socket.disconnect();
                        }
                    }
                    return;
                case "/list":
                    socket.emit("new message", {
                        username: "system",
                        message: `Currently online users: ${users.join(", ")}`,
                    });
                    return;
                default:
                    return;
            }
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

httpServer.listen(PORT, () => {
    console.log(`server started on port ${PORT}`);
});

function sanitize(input) {
    return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function addUser(socket, username) {
    socket.data.username = username;
    users.push(username);
    socket.emit("login", {
        numUsers: users.length,
    });
    socket.broadcast.emit("user joined", {
        username: username,
        numUsers: users.length,
    });
}
