const username = prompt("How should we call you?");
if (username === null) {
    alert("Username is required to chat.");
    history.back();
}

const socket = io({auth: {serverOffset: 0}});
socket.emit("username", username);

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const clear = document.getElementById("clear");

form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (input.value) {
        socket.emit("chat message", input.value);
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

socket.on("newUser", (message) => {
    const item = document.createElement("li");
    item.textContent = message;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

socket.on("userDisconnected", (message) => {
    const item = document.createElement("li");
    item.textContent = message;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

socket.on("chat message", (message, serverOffset) => {
    const item = document.createElement("li");
    item.textContent = message;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
    socket.auth.serverOffset = serverOffset;
});
