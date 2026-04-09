// ----------------------------- STATE & LOCALSTORAGE -----------------------------
let currentChatId = null;
let chats = {}; // { chatId: { id, title, messages } }

// Load dari localStorage atau inisialisasi default
function loadChatsFromStorage() {
  const stored = localStorage.getItem("chat_engine_chats");
  if (stored) {
    chats = JSON.parse(stored);
    // pastikan setiap chat punya field messages (jika kosong)
    for (let id in chats) {
      if (!chats[id].messages) chats[id].messages = [];
      if (!chats[id].title) chats[id].title = "Chat Baru";
    }
  } else {
    // Buat chat default
    const defaultId = generateId();
    chats = {
      [defaultId]: {
        id: defaultId,
        title: "Chat Baru",
        messages: [],
      },
    };
  }
  // Tentukan currentChatId: jika tidak ada atau tidak valid, ambil chat pertama
  const storedCurrent = localStorage.getItem("chat_engine_current");
  if (storedCurrent && chats[storedCurrent]) {
    currentChatId = storedCurrent;
  } else {
    const firstId = Object.keys(chats)[0];
    currentChatId = firstId;
  }
}

function saveChatsToStorage() {
  localStorage.setItem("chat_engine_chats", JSON.stringify(chats));
  localStorage.setItem("chat_engine_current", currentChatId);
}

function generateId() {
  return Date.now() + "-" + Math.random().toString(36).substr(2, 8);
}

// ----------------------------- RENDER SIDEBAR -----------------------------
function renderSidebar() {
  const chatListDiv = document.getElementById("chatList");
  if (!chatListDiv) return;
  let html = `<div class="text-xs uppercase tracking-wider text-gray-500 px-3 pt-4 pb-2">Riwayat Chat</div>`;
  for (let id in chats) {
    const chat = chats[id];
    const activeClass =
      id === currentChatId
        ? "bg-gray-700/50 text-white"
        : "hover:bg-gray-800 text-gray-300";
    html += `
                    <div data-chat-id="${id}" class="chat-item group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeClass}">
                        <div class="flex-1 truncate text-sm">
                            <span class="truncate block">${escapeHtml(
                              chat.title
                            )}</span>
                        </div>
                        <button class="delete-chat-btn opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all p-1" data-chat-id="${id}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                `;
  }
  chatListDiv.innerHTML = html;
  // Pasang event listener untuk setiap chat item
  document.querySelectorAll(".chat-item").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest(".delete-chat-btn")) return;
      const cid = el.getAttribute("data-chat-id");
      if (cid) switchChat(cid);
    });
  });
  document.querySelectorAll(".delete-chat-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const cid = btn.getAttribute("data-chat-id");
      if (cid) deleteChat(cid);
    });
  });
}

// ----------------------------- RENDER MESSAGES -----------------------------
function renderMessages() {
  const container = document.getElementById("chatMessages");
  if (!container) return;
  const currentChat = chats[currentChatId];
  if (
    !currentChat ||
    !currentChat.messages ||
    currentChat.messages.length === 0
  ) {
    container.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-center text-gray-500">
                    <div class="text-5xl mb-4">💬</div>
                    <p class="text-lg font-medium">Mulai percakapan baru</p>
                    <p class="text-sm">Klik "New Chat" atau kirim pesan di bawah</p>
                </div>`;
    return;
  }
  let html = "";
  for (const msg of currentChat.messages) {
    const isUser = msg.role === "user";
    html += `
                    <div class="flex ${
                      isUser ? "justify-end" : "justify-start"
                    }">
                        <div class="max-w-[80%] ${
                          isUser
                            ? "bg-blue-600/20 border border-blue-500/30 text-white"
                            : "bg-gray-800/80 text-gray-200"
                        } rounded-2xl px-4 py-2.5 shadow-sm">
                            <div class="text-xs opacity-70 mb-1">${
                              isUser ? "Anda" : "Assistant"
                            }</div>
                            <div class="chat-message text-sm whitespace-pre-wrap">${escapeHtml(
                              msg.content
                            )}</div>
                        </div>
                    </div>
                `;
  }
  container.innerHTML = html;
  container.scrollTop = container.scrollHeight;
}

// ----------------------------- CHAT ACTIONS -----------------------------
function switchChat(chatId) {
  if (!chats[chatId]) return;
  currentChatId = chatId;
  saveChatsToStorage();
  renderSidebar();
  renderMessages();
}

function deleteChat(chatId) {
  if (Object.keys(chats).length === 1) {
    alert("Tidak bisa menghapus chat terakhir");
    return;
  }
  delete chats[chatId];
  if (currentChatId === chatId) {
    // pindah ke chat pertama yang tersisa
    currentChatId = Object.keys(chats)[0];
  }
  saveChatsToStorage();
  renderSidebar();
  renderMessages();
}

function newChat() {
  const newId = generateId();
  chats[newId] = {
    id: newId,
    title: "Chat Baru",
    messages: [],
  };
  currentChatId = newId;
  saveChatsToStorage();
  renderSidebar();
  renderMessages();
}

// ----------------------------- SEND MESSAGE TO BACKEND -----------------------------
async function sendMessage() {
  const input = document.getElementById("messageInput");
  const msg = input.value.trim();
  if (!msg) return;
  const sendBtn = document.getElementById("sendBtn");
  sendBtn.disabled = true;

  const currentChat = chats[currentChatId];
  currentChat.messages.push({ role: "user", content: msg });
  if (currentChat.title === "Chat Baru" && currentChat.messages.length === 1) {
    currentChat.title = msg.length > 30 ? msg.substring(0, 30) + "..." : msg;
  }
  saveChatsToStorage();
  renderSidebar();
  renderMessages();
  input.value = "";

  // Tampilkan loading
  const container = document.getElementById("chatMessages");
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "flex justify-start";
  loadingDiv.innerHTML = `<div class="bg-gray-800/80 text-gray-300 rounded-2xl px-4 py-2.5"><div class="text-xs opacity-70 mb-1">Assistant</div><div><em>Mengetik...</em></div></div>`;
  container.appendChild(loadingDiv);
  container.scrollTop = container.scrollHeight;

  const apiMessages = currentChat.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: apiMessages }),
    });
    const data = await response.json();
    loadingDiv.remove();
    if (data.reply) {
      currentChat.messages.push({
        role: "assistant",
        content: data.reply,
      });
      saveChatsToStorage();
      renderMessages();
    } else if (data.error) {
      const errDiv = document.createElement("div");
      errDiv.className = "flex justify-start";
      errDiv.innerHTML = `<div class="bg-red-900/50 text-red-300 rounded-2xl px-4 py-2.5">Error: ${escapeHtml(
        data.error
      )}</div>`;
      container.appendChild(errDiv);
      container.scrollTop = container.scrollHeight;
    }
  } catch (err) {
    loadingDiv.remove();
    const errDiv = document.createElement("div");
    errDiv.className = "flex justify-start";
    errDiv.innerHTML = `<div class="bg-red-900/50 text-red-300 rounded-2xl px-4 py-2.5">Gagal terhubung ke server</div>`;
    container.appendChild(errDiv);
    container.scrollTop = container.scrollHeight;
  } finally {
    sendBtn.disabled = false;
    document.getElementById("messageInput").focus();
  }
}

// ----------------------------- HELPER -----------------------------
function escapeHtml(str) {
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

// ----------------------------- INIT -----------------------------
function init() {
  loadChatsFromStorage();
  renderSidebar();
  renderMessages();
  // Event listeners
  document.getElementById("newChatBtn").addEventListener("click", newChat);
  document.getElementById("sendBtn").addEventListener("click", sendMessage);
  const msgInput = document.getElementById("messageInput");
  msgInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  msgInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 120) + "px";
  });
}
init();
