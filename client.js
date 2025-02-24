const username = prompt("How should we call you?");
if (username === null) {
    alert("Username is required to chat.");
    history.back();
}

let counter = 0;
const socket = io({
    auth: {
        serverOffset: 0
    },
});
socket.emit("username", username);

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const clear = document.getElementById("clear");

input.placeholder = "Write a message";

form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (input.value) {
        const clientOffset = `${socket.id}-${counter++}`;
        socket.emit("chat message", input.value, clientOffset);
        input.value = "";
    }
});

clear.addEventListener("click", () => {
    let lis = document.querySelectorAll("li");
    for (let i = 0; li = lis[i]; ++i) {
        li.parentNode.removeChild(li);
    }
});

socket.on("loggedIn", (alreadyLogged) => {
    if (alreadyLogged) {
        alert("You're already logged in or there's another user with that name.");
        history.back();
    }
});

const addMessage = (message) => {
    const item = document.createElement("li");
    item.textContent = message;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
};

socket.on("newUser", addMessage);
socket.on("userDisconnected", addMessage);
socket.on("chat message", (message, serverOffset) => {
    addMessage(message);
    socket.auth.serverOffset = serverOffset;
});
