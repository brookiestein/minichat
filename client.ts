const username = prompt("How should we call you?");
if (username === null) {
    alert("Username is required to chat.");
    history.back();
}

let counter: number = 0;
const socket = io();

socket.emit("username", username);

const form: HTMLFormElement = document.getElementById("form") as HTMLFormElement;
const input: HTMLInputElement = document.getElementById("input") as HTMLInputElement;
const messages: HTMLUListElement = document.getElementById("messages") as HTMLUListElement;
const clear: HTMLButtonElement = document.getElementById("clear") as HTMLButtonElement;

input.placeholder = "Write a message";

form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (input.value) {
        const clientOffset: string = `${socket.id}-${counter++}`;
        socket.emit("chat message", input.value, clientOffset);
        input.value = "";
    }
});

clear.addEventListener("click", () => {
    let lis = document.querySelectorAll("li");
    let li: HTMLLIElement;
    for (let i = 0; li = lis[i]; ++i) {
        if (li.parentNode)
            li.parentNode.removeChild(li);
    }
});

socket.on("loggedIn", (alreadyLogged) => {
    if (alreadyLogged) {
        alert("You're already logged in or there's another user with that name.");
        history.back();
    }
});

const addMessage = (message: string) => {
    const item = document.createElement("li");
    item.textContent = message;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
};

socket.on("newUser", addMessage);
socket.on("userDisconnected", addMessage);
socket.on("chat message", (message, serverOffset) => {
    addMessage(message);
});
