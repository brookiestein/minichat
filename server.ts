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

const users: {socket: Socket, username: string, typing: boolean}[] = [];
const emitUsers = () => {
    let usernames: string[] = [];
    for (const user of users) {
        usernames.push(user.username);
    }

    io.emit("usersChanged", usernames);
}

app.get("/", (request, response) => {
    response.sendFile(join(__dirname, "index.html"));
});

app.get("/styles.css", (request, response) => {
    response.sendFile(join(__dirname, "styles.css"));
});

app.get("/client.js", (request, response) => {
    response.sendFile(join(__dirname, "client.js"));
});

io.on("connection", async (socket) => {
    let username: string = "";
    socket.on("username", (name) => {
        if (users.length === 0 || !users.find((user) => user.username === name)) {
            users.push({"socket": socket, "username": name, typing: false});
            socket.emit("loggedIn", false);
            username = name;
        } else {
            socket.emit("loggedIn", true);
            return;
        }

        io.emit("newUser", `${username} has jumped in!`);
        emitUsers();
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
        emitUsers();
    });

    socket.on("typing", () => {
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

        users[index].typing = true;

        let message: string = "";
        let typingUsers: number = 0;
        for (const user of users) {
            if (!user.typing) {
                continue;
            }

            ++typingUsers;
            message += `${user.username}, `;
        }

        message = message.slice(0, message.lastIndexOf(", "));
        if (typingUsers < 2) {
            message += " is typing...";
        } else {
            message += " are typing...";
        }

        socket.broadcast.emit("typing", message);
    });

    socket.on("endtyping", () => {
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

        users[index].typing = false;
        let typingUsers: number = 0;
        for (const user of users) {
            if (user.typing) {
                ++typingUsers;
            }
        }

        if (typingUsers === 0) {
            io.emit("typing", "");
        }
    });

    socket.on("chat message", async (message, clientOffset) => {
        const user = users.find((user) => user.socket === socket);
        if (user)
            message = `${user.username}: ${message}`;

        let result;
        try {
            result = await db.run("INSERT INTO Messages (content, client_offset) VALUES (?, ?)", message, clientOffset);
        } catch (e: any) {
            return;
        }

        io.emit("chat message", message, result.lastID);
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
