const API_URL = "http://localhost:3000/api";
let token = localStorage.getItem("token");
let currentUser = null;
let ws = null;
let currentUserId = null;
let currentChatId = null;

// === Элементы ===
const authScreen = document.getElementById("auth-screen");
const chatsScreen = document.getElementById("chats-screen");
const chatScreen = document.getElementById("chat-screen");

const chatList = document.getElementById("chats-list");

const chatForm = document.getElementById("chat-created-form");
const authForm = document.getElementById("auth-form");
const authError = document.getElementById("auth-error");
const usernameEl = document.getElementById("username");
const totalEl = document.getElementById("total");

const messageForm = document.getElementById("chat-form");
const messageInput = document.getElementById("messageInput");
const messageList = document.getElementById("messages");

if (token) {
  fetchMe();
} else {
  showAuth();
}

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const action = e.submitter.dataset.action;
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const name = document.getElementById("name").value.trim();

  if (!email || !password) return;

  try {
    const endpoint = action === "login" ? "/auth/login" : "/auth/register";
    if (action === "register" && !name) {
      authError.textContent = "Для регистрации укажите ник";
      return;
    }
    const body = { email, password };
    if (action === "register") {
      body.name = name;
    }
    const res = await fetch(API_URL + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Ошибка сервера");

    token = data.token;
    localStorage.setItem("token", token);

    currentUser = data.user;
    currentUserId = currentUser.id;
    localStorage.setItem("currentUser", currentUser.name);
    localStorage.setItem("currentUserId", currentUserId);
    showChats();
  } catch (err) {
    authError.textContent = err.message;
  }
});

document.getElementById("logout").addEventListener("click", (e) => {
  e.preventDefault();
  token = null;
  currentUser = null;
  showAuth();
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = document.getElementById("chat").value.trim();
  if (!text) return;

  addChat(text);
});

async function addChat(name) {
  try {
    const res = await fetch(API_URL + "/chats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Ошибка");
    }

    document.getElementById("chat").value = "";
    await loadChats();
  } catch (err) {
    alert(err.message);
  }
}

async function loadChats() {
  try {
    const res = await fetch(API_URL + "/chats", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Не удалось загрузить чаты");

    const chats = await res.json();
    renderChats(chats);
  } catch (err) {
    console.error(err);
    if (err.message.includes("token")) {
      localStorage.removeItem("token");
      showAuth();
    }
  }
}

function renderChats(chats) {
  chatList.textContent = "";
  chats.forEach((chat) => {
    const isOwn =
      chat.user_id === Number(localStorage.getItem("currentUserId"));
    const li = document.createElement("li");
    li.className = `chat-item click ${isOwn ? "own" : ""}`;
    li.dataset.id = chat.id;

    const span = document.createElement("span");
    span.className = "chat-name click";
    span.id = chat.id;
    const b = document.createElement("b");
    b.textContent = chat.name;
    const id = document.createElement("p");
    id.textContent = `#${chat.id}`;
    span.appendChild(b);
    span.appendChild(id);
    li.appendChild(span);

    if (isOwn) {
      const buttonUpdate = document.createElement("button");
      buttonUpdate.addEventListener("click", (e) => {
        e.preventDefault();
        editChat(li, chat);
      });
      buttonUpdate.className = "btn_update";
      buttonUpdate.textContent = "Изменить";

      const buttonDel = document.createElement("button");
      buttonDel.addEventListener("click", (e) => {
        e.preventDefault();
        deleteChat(chat.id);
      });
      buttonDel.className = "btn_del";
      buttonDel.textContent = "Удалить";
      const div = document.createElement("div");
      div.appendChild(buttonUpdate);
      div.appendChild(buttonDel);
      li.appendChild(div);
    }

    chatList.appendChild(li);
  });

  totalEl.textContent = chats.length;
}

async function editChat(li, chat) {
  const span = li.querySelector(".chat-name");
  if (!span) return;

  const buttonUpdate = li.querySelector(".btn_update");
  const buttonDel = li.querySelector(".btn_del");
  if (buttonUpdate) buttonUpdate.disabled = true;
  if (buttonDel) buttonDel.disabled = true;

  li.classList.add("not-clickable");

  const input = document.createElement("input");
  input.className = "edit-input";
  input.maxLength = 20;
  input.value = chat.name;
  span.replaceWith(input);
  input.focus();
  input.setSelectionRange(chat.name.length, chat.name.length);

  let done = false;

  const restoreSpan = (name) => {
    const s = document.createElement("span");
    s.className = "chat-name click";
    s.id = chat.id;
    s.textContent = `${name} #${chat.id}`;
    input.replaceWith(s);
    if (buttonUpdate && buttonDel) {
      buttonUpdate.disabled = false;
      buttonDel.disabled = false;
    }
    li.classList.remove("not-clickable");
  };

  const save = () => {
    if (done) return;
    done = true;
    const newName = input.value.trim();
    if (!newName || newName === chat.name) {
      restoreSpan(chat.name);
      return;
    }
    restoreSpan(newName);
    chat.name = newName;
    updateChat(chat.id, newName);
  };

  const cancel = () => {
    if (done) return;
    done = true;
    restoreSpan(chat.name);
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  });
  input.addEventListener("blur", save);
}

async function updateChat(idChat, name) {
  try {
    const res = await fetch(API_URL + `/chats/${idChat}/update`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Ошибка редактирования");
      loadChats();
    }
  } catch (err) {
    alert(err.message);
    loadChats();
  }
}

async function deleteChat(id) {
  await fetch(API_URL + `/chats/${id}/delete`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  loadChats();
}

function showAuth() {
  localStorage.setItem("page", "auth");
  authScreen.classList.add("active");
  chatsScreen.classList.remove("active");
  chatScreen.classList.remove("active");
  authError.textContent = "";
  authForm.reset();
  localStorage.removeItem("currentChatId");
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("currentUserId");
}

function showChats() {
  localStorage.setItem("page", "chats");
  authScreen.classList.remove("active");
  chatsScreen.classList.add("active");
  chatScreen.classList.remove("active");
  usernameEl.textContent = localStorage.getItem("currentUser");
  localStorage.removeItem("currentChatId");
  loadChats();
}

function showChat() {
  localStorage.setItem("page", "chat");
  authScreen.classList.remove("active");
  chatsScreen.classList.remove("active");
  chatScreen.classList.add("active");
  connectWS();
  loadMessages();
}

async function fetchMe() {
  try {
    const res = await fetch(API_URL + "/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error("Токен недействителен");

    const data = await res.json();
    currentUser = data.user;

    currentUserId = currentUser.id;
    localStorage.setItem("currentUserId", data.user.id);

    if (localStorage.getItem("page") === "chats") {
      showChats();
    } else if (localStorage.getItem("page") === "chat") {
      showChat();
    }
  } catch {
    localStorage.removeItem("token");
    token = null;
    showAuth();
  }
}

chatList.addEventListener("click", (e) => {
  const li = e.target.closest(".chat-item");
  if (!li) return;
  if (e.target.tagName === "BUTTON") return;
  if (li.querySelector(".edit-input")) return;
  currentChatId = li.dataset.id;
  localStorage.setItem("currentChatId", currentChatId);
  showChat();
});

document.getElementById("back").addEventListener("click", (e) => {
  e.preventDefault();
  if (ws) {
    ws.close();
    ws = null;
  }
  document.getElementById("messages").textContent = "";
  document.getElementById("invite-email").value = "";
  showChats();
});

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  e.stopPropagation();
  const text = messageInput.value.trim();
  messageInput.value = "";
  if (!text) return;

  sendMessage(text);
});

function connectWS() {
  if (ws) {
    ws.close();
    ws = null;
  }

  ws = new WebSocket(
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`,
    ["authorization", token],
  );

  ws.onopen = () => {
    console.log("WS connected");
    ws.send(
      JSON.stringify({
        type: "subscribe",
        chatId: localStorage.getItem("currentChatId"),
      }),
    );
  };
  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (
        data.type === "new_message" &&
        data.chatId == localStorage.getItem("currentChatId")
      ) {
        appendMessage(data.message);
      }
      if (
        data.type === "delete_message" &&
        data.chatId == localStorage.getItem("currentChatId")
      ) {
        const li = messageList.querySelector(`li[data-id="${data.messageId}"]`);
        if (li) li.remove();
      }

      if (
        data.type === "update_message" &&
        data.chatId == localStorage.getItem("currentChatId")
      ) {
        const li = messageList.querySelector(
          `li[data-id="${data.message.id}"]`,
        );
        if (li) {
          const span = li.querySelector(".msg-text");
          if (span) span.textContent = data.message.text;
        }
      }
    } catch (err) {
      console.error("WS parse error:", err);
    }
  };

  ws.onerror = (error) => {
    console.error("Websocket error:", error);
  };
  ws.onclose = (event) => {
    console.log("WS disconnected");
  };
}

async function sendMessage(text) {
  try {
    const res = await fetch(
      `${API_URL}/message/${localStorage.getItem("currentChatId")}/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ text: text }),
      },
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Ошибка");
    }
  } catch (err) {
    alert(err.message);
  }
}

async function loadMessages() {
  try {
    const res = await fetch(
      `${API_URL}/message/${localStorage.getItem("currentChatId")}/receive`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      },
    );

    if (!res.ok) throw new Error("Не удалось загрузить сообщения");

    const messages = await res.json();

    renderMessages(messages);
  } catch (err) {
    alert(err.message);
  }
}

function renderMessages(messages) {
  messageList.textContent = "";
  messages.forEach((message) => {
    appendMessage(message);
  });
}

function appendMessage(message) {
  const isOwn =
    message.user_id === Number(localStorage.getItem("currentUserId"));

  const li = document.createElement("li");
  li.className = `chat-li ${isOwn ? "own" : ""}`;
  li.dataset.id = message.id;

  const textDiv = document.createElement("div");
  textDiv.className = "name-text-div";

  const b = document.createElement("b");
  b.textContent = `${message.author_name}`;
  textDiv.appendChild(b);

  const textSpan = document.createElement("span");
  textSpan.className = "msg-text";
  textSpan.textContent = message.text;
  textDiv.appendChild(textSpan);

  li.appendChild(textDiv);

  if (isOwn) {
    const btn_div = document.createElement("div");
    btn_div.className = "btn-div";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Изменить";
    editBtn.classList = "btn_update";
    editBtn.addEventListener("click", (e) => {
      e.preventDefault();
      startEdit(li, message);
    });
    btn_div.appendChild(editBtn);

    const delBtn = document.createElement("button");
    delBtn.textContent = "Удалить";
    delBtn.classList = "btn_del";
    delBtn.addEventListener("click", (e) => {
      e.preventDefault();
      deleteMessage(message.chat_id, message.id);
    });
    btn_div.appendChild(delBtn);
    li.appendChild(btn_div);
  }

  messageList.appendChild(li);
  messageList.scrollTop = messageList.scrollHeight;
}

async function deleteMessage(idChat, idMessage) {
  const res = await fetch(API_URL + `/message/${idChat}/${idMessage}/delete`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json();
    alert(err.error || "Ошибка удаления");
  }
}

function startEdit(li, message) {
  const span = li.querySelector(".msg-text");
  if (!span) return;
  const current = span.textContent;

  const buttonUpdate = li.querySelector(".btn_update");
  const buttonDel = li.querySelector(".btn_del");
  if (buttonUpdate) buttonUpdate.disabled = true;
  if (buttonDel) buttonDel.disabled = true;

  li.classList.add("not-clickable");

  const input = document.createElement("input");
  input.className = "edit-input";
  input.value = current;
  span.replaceWith(input);
  input.focus();
  input.setSelectionRange(current.length, current.length);

  let done = false;

  const restoreSpan = (txt) => {
    const s = document.createElement("span");
    ((s.className = "msg-text"), (s.textContent = txt));
    input.replaceWith(s);
    if (buttonUpdate && buttonDel) {
      buttonUpdate.disabled = false;
      buttonDel.disabled = false;
    }
    li.classList.remove("not-clickable");
  };

  const save = () => {
    if (done) return;
    done = true;
    const newText = input.value.trim();
    if (!newText || newText === current) {
      restoreSpan(current);
      return;
    }
    restoreSpan(newText);
    updateMessage(message.chat_id, message.id, newText);
  };

  const cancel = () => {
    if (done) return;
    done = true;
    restoreSpan(current);
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  });
  input.addEventListener("blur", save);
}

async function updateMessage(idChat, idMessage, text) {
  try {
    const res = await fetch(
      API_URL + `/message/${idChat}/${idMessage}/update`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      },
    );
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Ошибка редактирования");
      loadMessages();
    }
  } catch (err) {
    alert(err.message);
    loadMessages();
  }
}

document
  .getElementById("chat-join-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("join-id").value.trim();
    if (!id) return;
    const res = await fetch(`${API_URL}/chats/${id}/join`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      alert((await res.json()).error || "Ошибка");
      return;
    }
    document.getElementById("join-id").value = "";
    loadChats();
  });

document
  .getElementById("chat-invite-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("invite-email").value.trim();
    const id = localStorage.getItem("currentChatId");
    if (!email) return;
    const res = await fetch(`${API_URL}/chats/${id}/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      alert((await res.json()).error || "Ошибка");
      return;
    }
    document.getElementById("invite-email").value = "";
  });
