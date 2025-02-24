import express from "express";
import {createServer} from "node:http";
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";
import {Server, Socket} from "socket.io";
import sqlite3 from "sqlite3";
import {open} from "sqlite";

const db = await open({
    filename: "chat.db",
    driver: sqlite3.Database
});

await db.exec(`
CREATE TABLE IF NOT EXISTS Messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_offset TEXT UNIQUE,
    content TEXT
);
`);

const port: number = 3500;
const app = express();
const server = createServer(app);
const io = new Server(server, {connectionStateRecovery: {}});
const __dirname = dirname(fileURLToPath(import.meta.url));

const users: {socket: Socket, username: string}[] = [];

app.get("/", (request, response) => {
    response.sendFile(join(__dirname, "index.html"));
});

app.get("/styles.css", (request, response) => {
    response.sendFile(join(__dirname, "styles.css"));
});

app.get("/scripts.js", (request, response) => {
    response.sendFile(join(__dirname, "scripts.js"));
});

io.on("connection", async (socket) => {
    let username: string = "";
    socket.on("username", (name) => {
        if (users.length === 0 || !users.find((user) => user.username === name)) {
            users.push({"socket": socket, "username": name});
            socket.emit("loggedIn", false);
            username = name;
        } else {
            socket.emit("loggedIn", true);
            return;
        }

        io.emit("newUser", `${username} has jumped in!`);
    });

    socket.on("disconnect", () => {
        let index: number = -1;
        for (let i = 0; i < users.length; ++i) {
            if (users[i].socket === socket) {
                index = i;
                break;
            }
        }

        if (index < 0) {
            return;
        }

        io.emit("userDisconnected", `${users[index].username} has gone.`);
        users.splice(index, 1);
    });

    socket.on("chat message", async (message) => {
        let result;
        try {
            result = await db.run("INSERT INTO Messages (content) VALUES (?)", message);
        } catch (e) {
            return;
        }

        const user = users.find((user) => user.socket == socket);
        if (user)
            io.emit("chat message", `${user.username}: ${message}`, result.lastID);
    });

    if (!socket.recovered) {
        try {
            await db.each(
                "SELECT id, content FROM Messages WHERE id > ?",
                [socket.handshake.auth.serverOffset || 0],
                (_err, row) => {
                    socket.emit("chat message", row.content, row.id);
                }
            );
        } catch (e) {}
    }
});

server.listen(port, () => {
    console.log(`Server running at port: ${port}.`);
});
