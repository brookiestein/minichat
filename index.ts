import express from "express";
import {createServer} from "node:http";
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";
import {Server, Socket} from "socket.io";

const port: number = 3500;
const app = express();
const server = createServer(app);
const io = new Server(server);
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

io.on("connection", (socket) => {
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

    socket.on("chat message", (message) => {
        const user = users.find((user) => user.socket == socket);
        if (user)
            io.emit("chat message", `${user.username}: ${message}`);
    });
});

server.listen(port, () => {
    console.log(`Server running at port: ${port}.`);
});
