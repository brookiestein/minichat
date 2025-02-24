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
const listOfUsers: HTMLUListElement = document.getElementById("connectedUsers") as HTMLUListElement;
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
    let lis = document.querySelectorAll("#messages li");
    let li: HTMLLIElement;
    for (let i = 0; li = lis[i] as HTMLLIElement; ++i) {
        if (li.parentNode)
            li.parentNode.removeChild(li);
    }
});

socket.on("loggedIn", (alreadyLogged: boolean) => {
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
socket.on("chat message", (message: string, serverOffset: number) => {
    addMessage(message);
});

socket.on("usersChanged", (users: string[]) => {
    let lis = document.querySelectorAll("#connectedUsers li");
    let li: HTMLLIElement;
    for (let i = 0; li = lis[i] as HTMLLIElement; ++i) {
        if (li.parentNode)
            li.parentNode.removeChild(li);
    }

    for (const username of users) {
        const item = document.createElement("li");
        item.textContent = username;
        listOfUsers.appendChild(item);
    }
})
