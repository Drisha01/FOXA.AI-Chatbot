// =========================
// DOM ELEMENTS
// =========================

const promptInput = document.querySelector(".prompt-input");
const sendBtn = document.getElementById("send-prompt-btn");

const addFileBtn = document.getElementById("add-file-btn");
const fileInput = document.getElementById("file-input");

const themeToggleBtn = document.getElementById("theme-toggle-btn");
const mobileThemeToggleBtn = document.getElementById("mobile-theme-toggle-btn");
const deleteChatsBtn = document.getElementById("delete-chats-btn");
const mobileDeleteChatsBtn = document.getElementById("mobile-delete-chats-btn");
const hamburgerBtn = document.getElementById("hamburger-btn");
const dropdownMenu = document.querySelector(".dropdown-menu");

const appHeader = document.querySelector(".app-header");
const suggestions = document.querySelector(".suggestions");
const container = document.querySelector(".container");

// =========================
// STATE
// =========================

let attachedFile = null;
let filePreviewBar = null;
let chatArea = null;

// =========================
// INIT
// =========================

(function init() {

    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {

        document.body.classList.add("light-theme");
        themeToggleBtn.textContent = "dark_mode";
        if (mobileThemeToggleBtn) mobileThemeToggleBtn.textContent = "dark_mode";

    }

})();

// =========================
// THEME
// =========================

function toggleTheme() {
    const light = document.body.classList.toggle("light-theme");

    const icon = light ? "dark_mode" : "light_mode";
    themeToggleBtn.textContent = icon;
    if (mobileThemeToggleBtn) mobileThemeToggleBtn.textContent = icon;

    localStorage.setItem(
        "theme",
        light ? "light" : "dark"
    );
}

themeToggleBtn.addEventListener("click", toggleTheme);
if (mobileThemeToggleBtn) {
    mobileThemeToggleBtn.addEventListener("click", toggleTheme);
}

if (hamburgerBtn && dropdownMenu) {
    hamburgerBtn.addEventListener("click", () => {
        dropdownMenu.classList.toggle("hidden");
    });
    
    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
        if (!hamburgerBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.add("hidden");
        }
    });
}

// =========================
// SUGGESTIONS
// =========================

document
    .querySelectorAll(".suggestions-item")
    .forEach(card => {

        card.addEventListener("click", () => {

            promptInput.value =
                card.querySelector(".text").textContent;

            sendMessage();

        });

    });

// =========================
// FILE
// =========================

addFileBtn.addEventListener("click", () => {

    fileInput.click();

});

fileInput.addEventListener("change", () => {

    const file = fileInput.files[0];

    if (!file) return;

    attachedFile = file;

    showFilePreview(file.name);

});

function showFilePreview(name) {

    if (filePreviewBar) {

        filePreviewBar.remove();

    }

    filePreviewBar = document.createElement("div");

    filePreviewBar.className = "file-preview-bar";

    filePreviewBar.innerHTML = `

        <span class="material-symbols-rounded">
        attach_file
        </span>

        <span class="file-name">
        ${name}
        </span>

        <button
        id="remove-file-btn"
        class="material-symbols-rounded">

        close

        </button>

    `;

    document
        .querySelector(".prompt-container")
        .prepend(filePreviewBar);

    document
        .getElementById("remove-file-btn")
        .onclick = () => {

            attachedFile = null;

            filePreviewBar.remove();

            filePreviewBar = null;

            fileInput.value = "";

        };

}

// =========================
// INPUT
// =========================

promptInput.addEventListener("input", () => {

    sendBtn.classList.toggle(

        "active",

        promptInput.value.trim() !== ""

    );

});

promptInput.addEventListener("keydown", (e) => {

    if (e.key === "Enter" && !e.shiftKey) {

        e.preventDefault();

        sendMessage();

    }

});

sendBtn.addEventListener("click", sendMessage);

// =========================
// DELETE CHAT
// =========================

function deleteChats() {
    if (chatArea) {
        chatArea.remove();
        chatArea = null;
    }
    appHeader.classList.remove("hidden");
    suggestions.classList.remove("hidden");
    if (dropdownMenu) {
        dropdownMenu.classList.add("hidden");
    }
}

deleteChatsBtn.addEventListener("click", deleteChats);
if (mobileDeleteChatsBtn) {
    mobileDeleteChatsBtn.addEventListener("click", deleteChats);
}

// =========================
// SEND MESSAGE
// =========================

async function sendMessage() {

    const text = promptInput.value.trim();

    if (!text && !attachedFile) return;

    if (!chatArea) {

        appHeader.classList.add("hidden");
        suggestions.classList.add("hidden");

        chatArea = document.createElement("main");
        chatArea.className = "chat-area";

        container.insertBefore(
            chatArea,
            document.querySelector(".prompt-container")
        );

    }

    let userHTML = "";

    if (attachedFile) {

        if (attachedFile.type.startsWith("image/")) {

            const imageURL = URL.createObjectURL(attachedFile);

            userHTML += `
                <img
                src="${imageURL}"
                class="message-image"
                alt="uploaded image">
            `;

        } else {

            userHTML += `
                <div class="file-name">
                📎 ${attachedFile.name}
                </div>
            `;

        }

    }

    if (text) {

        userHTML += `
            <span>
            ${escapeHTML(text)}
            </span>
        `;

    }

    appendMessage("user", userHTML);

    promptInput.value = "";

    sendBtn.classList.remove("active");

    const typing = appendTyping();

    try {

        const response = await fetch("/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: text
            })

        });

        const data = await response.json();

        typing.remove();

        if (!response.ok) {

            appendMessage(
                "bot",
                `⚠️ ${escapeHTML(data.reply)}`
            );

            return;

        }

        appendMessage(
            "bot",
            formatMarkdown(data.reply)
        );

    }

    catch (err) {

        typing.remove();

        appendMessage(
            "bot",
            `⚠️ ${escapeHTML(err.message)}`
        );

    }

    attachedFile = null;

    if (filePreviewBar) {

        filePreviewBar.remove();

        filePreviewBar = null;

    }

    fileInput.value = "";

}

// =========================
// MESSAGE
// =========================

function appendMessage(role, html) {

    const wrapper = document.createElement("div");

    wrapper.className = `chat-message ${role}`;

    const bubble = document.createElement("div");

    bubble.className = "message-bubble";

    bubble.innerHTML = html;

    wrapper.appendChild(bubble);

    chatArea.appendChild(wrapper);

    scrollToBottom();

}

// =========================
// TYPING
// =========================

function appendTyping() {

    const div = document.createElement("div");

    div.className = "chat-message bot";

    div.innerHTML = `

    <div class="typing-dots">

        <span></span>

        <span></span>

        <span></span>

    </div>

    `;

    chatArea.appendChild(div);

    scrollToBottom();

    return div;

}

// =========================
// SCROLL
// =========================

function scrollToBottom() {

    window.scrollTo({

        top: document.body.scrollHeight,

        behavior: "smooth"

    });

}

// =========================
// ESCAPE HTML
// =========================

function escapeHTML(text) {

    return text

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;");

}

// =========================
// MARKDOWN
// =========================

function formatMarkdown(text) {

    text = text.replace(

        /```([\\s\\S]*?)```/g,

        "<pre><code>$1</code></pre>"

    );

    text = text.replace(

        /`([^`]+)`/g,

        "<code>$1</code>"

    );

    text = text.replace(

        /\*\*(.*?)\*\*/g,

        "<strong>$1</strong>"

    );

    text = text.replace(

        /\*(.*?)\*/g,

        "<em>$1</em>"

    );

    text = text.replace(

        /\n/g,

        "<br>"

    );

    return text;

}