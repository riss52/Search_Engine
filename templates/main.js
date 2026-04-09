let currentChatId = "{{ current_chat_id }}";
const chatMessagesDiv = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");
const chatListDiv = document.getElementById("chatList");

function escapeHtml(str) {
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

function renderMessages(messages) {
  chatMessagesDiv.innerHTML = "";
  if (!messages || messages.length === 0) {
    chatMessagesDiv.innerHTML = `<div class="flex flex-col items-center justify-center h-full text-center text-gray-500">
                    <div class="text-5xl mb-4">💬</div>
                    <p class="text-lg font-medium">Mulai percakapan baru</p>
                    <p class="text-sm">Klik "New Chat" atau kirim pesan di bawah</p>
                </div>`;
    return;
  }
  for (const msg of messages) {
    const div = document.createElement("div");
    div.className = `flex ${
      msg.role === "user" ? "justify-end" : "justify-start"
    }`;
    div.innerHTML = `
                    <div class="max-w-[80%] ${
                      msg.role === "user"
                        ? "bg-emerald-600/20 border border-emerald-500/30 text-white"
                        : "bg-gray-800/80 text-gray-200"
                    } rounded-2xl px-4 py-2.5 shadow-sm">
                        <div class="text-xs opacity-70 mb-1">${
                          msg.role === "user" ? "Anda" : "Assistant"
                        }</div>
                        <div class="chat-message text-sm whitespace-pre-wrap">${escapeHtml(
                          msg.content
                        )}</div>
                    </div>
                `;
    chatMessagesDiv.appendChild(div);
  }
  chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}

function updateSidebar(chats, currentId) {
  const chatList = document.getElementById("chatList");
  if (!chatList) return;
  let html = `<div class="text-xs uppercase tracking-wider text-gray-500 px-3 pt-4 pb-2">Riwayat Chat</div>`;
  for (const [id, chat] of Object.entries(chats)) {
    const activeClass =
      id === currentId
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
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>`;
  }
  chatList.innerHTML = html;
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

async function switchChat(chatId) {
  try {
    const res = await fetch("/switch_chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId }),
    });
    const data = await res.json();
    if (data.messages) {
      currentChatId = chatId;
      renderMessages(data.messages);
      document.querySelectorAll(".chat-item").forEach((el) => {
        if (el.getAttribute("data-chat-id") === chatId) {
          el.classList.add("bg-gray-700/50", "text-white");
          el.classList.remove("hover:bg-gray-800", "text-gray-300");
        } else {
          el.classList.remove("bg-gray-700/50", "text-white");
          el.classList.add("hover:bg-gray-800", "text-gray-300");
        }
      });
    } else {
      alert("Gagal beralih chat");
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteChat(chatId) {
  if (!confirm("Hapus chat ini?")) return;
  try {
    const res = await fetch("/delete_chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId }),
    });
    const data = await res.json();
    if (data.status === "ok") {
      window.location.reload();
    } else {
      alert(data.error || "Gagal hapus");
    }
  } catch (err) {
    console.error(err);
  }
}

async function newChat() {
  try {
    const res = await fetch("/new_chat", { method: "POST" });
    const data = await res.json();
    if (data.chat_id) {
      window.location.href = "/";
    }
  } catch (err) {
    console.error(err);
  }
}

async function sendMessage() {
  const msg = messageInput.value.trim();
  if (!msg) return;
  sendBtn.disabled = true;
  const tempUserDiv = document.createElement("div");
  tempUserDiv.className = "flex justify-end";
  tempUserDiv.innerHTML = `<div class="max-w-[80%] bg-emerald-600/20 border border-emerald-500/30 text-white rounded-2xl px-4 py-2.5 shadow-sm"><div class="text-xs opacity-70 mb-1">Anda</div><div>${escapeHtml(
    msg
  )}</div></div>`;
  chatMessagesDiv.appendChild(tempUserDiv);
  chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
  messageInput.value = "";
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "flex justify-start";
  loadingDiv.innerHTML = `<div class="bg-gray-800/80 text-gray-300 rounded-2xl px-4 py-2.5"><div class="text-xs opacity-70 mb-1">Assistant</div><div><em>Mengetik...</em></div></div>`;
  chatMessagesDiv.appendChild(loadingDiv);
  chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, chat_id: currentChatId }),
    });
    const data = await res.json();
    loadingDiv.remove();
    if (data.reply && data.messages) {
      renderMessages(data.messages);
    } else if (data.error) {
      const errDiv = document.createElement("div");
      errDiv.className = "flex justify-start";
      errDiv.innerHTML = `<div class="bg-red-900/50 text-red-300 rounded-2xl px-4 py-2.5">Error: ${escapeHtml(
        data.error
      )}</div>`;
      chatMessagesDiv.appendChild(errDiv);
    }
  } catch (err) {
    loadingDiv.remove();
    const errDiv = document.createElement("div");
    errDiv.className = "flex justify-start";
    errDiv.innerHTML = `<div class="bg-red-900/50 text-red-300 rounded-2xl px-4 py-2.5">Gagal terhubung ke server</div>`;
    chatMessagesDiv.appendChild(errDiv);
  } finally {
    sendBtn.disabled = false;
    messageInput.focus();
  }
}

sendBtn.addEventListener("click", sendMessage);
newChatBtn.addEventListener("click", newChat);
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
messageInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 120) + "px";
});
