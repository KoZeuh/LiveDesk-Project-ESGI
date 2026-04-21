const socket = io();

const state = {
    currentUser: "",
    onlineUsers: [],
    notifications: [],
    leaderboard: [],
    dashboardPoints: { labels: [], cpu: [], ram: [] },
    peerConnection: null,
    localStream: null,
    remoteStream: null,
    currentCallTarget: "",
    currentSessionId: null,
    pendingCandidates: [],
    pendingIncomingCall: null
};

const els = {
    joinForm: document.getElementById("join-form"),
    pseudoInput: document.getElementById("pseudo"),
    joinStatus: document.getElementById("join-status"),
    onlineUsers: document.getElementById("online-users"),
    onlineCount: document.getElementById("online-count"),
    leaderboard: document.getElementById("leaderboard"),
    chatMessages: document.getElementById("chat-messages"),
    chatForm: document.getElementById("chat-form"),
    chatInput: document.getElementById("chat-input"),
    notificationForm: document.getElementById("notification-form"),
    notificationType: document.getElementById("notification-type"),
    notificationTitle: document.getElementById("notification-title"),
    notificationMessage: document.getElementById("notification-message"),
    notificationsList: document.getElementById("notifications-list"),
    overviewFeed: document.getElementById("overview-feed"),
    overviewActiveUsers: document.getElementById("overview-active-users"),
    overviewNotificationsTotal: document.getElementById("overview-notifications-total"),
    incomingCallBox: document.getElementById("incoming-call-box"),
    incomingCallText: document.getElementById("incoming-call-text"),
    acceptCall: document.getElementById("accept-call"),
    declineCall: document.getElementById("decline-call"),
    callTarget: document.getElementById("call-target"),
    startCall: document.getElementById("start-call"),
    shareScreen: document.getElementById("share-screen"),
    endCall: document.getElementById("end-call"),
    localVideo: document.getElementById("local-video"),
    remoteVideo: document.getElementById("remote-video"),
    callStatus: document.getElementById("call-status"),
    sessionChat: document.getElementById("session-chat"),
    sessionChatForm: document.getElementById("session-chat-form"),
    sessionChatInput: document.getElementById("session-chat-input"),
    cpuValue: document.getElementById("cpu-value"),
    ramValue: document.getElementById("ram-value"),
    messagesTotal: document.getElementById("messages-total"),
    videoTotal: document.getElementById("video-total"),
    systemAlerts: document.getElementById("system-alerts"),
    toastStack: document.getElementById("toast-stack"),
    tabButtons: Array.from(document.querySelectorAll(".tab-button")),
    tabPanels: Array.from(document.querySelectorAll(".tab-panel"))
};

function formatDate(value) {
    return new Date(value).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}


///


const tabButtonBaseClass = "tab-button rounded-2xl px-4 py-3 text-sm font-medium transition";
const tabButtonActiveClass = "is-active bg-sand-900 text-white shadow-md";
const tabButtonInactiveClass = "bg-transparent text-sand-700 hover:bg-sand-900/5";

function addToast(type, text) {
    const toast = document.createElement("div");
    const tone = type === "critical" ? "bg-red-700" : type === "warning" ? "bg-amber-600" : "bg-pine-500";

    toast.className = `pointer-events-auto rounded-3xl px-4 py-3 text-sm text-white shadow-panel ${tone}`;
    toast.textContent = text;
    els.toastStack.prepend(toast);

    setTimeout(() => toast.remove(), 4000);
}

function renderOnlineUsers() {
    els.onlineCount.textContent = state.onlineUsers.length;
    els.onlineUsers.innerHTML = "";

    state.onlineUsers.forEach((pseudo) => {
        const li = document.createElement("li");
        li.className = "flex items-center justify-between gap-3 rounded-2xl border border-sand-700/10 bg-white/80 px-4 py-3";
        li.innerHTML = `<div class="flex items-center gap-3"><span class="h-2.5 w-2.5 rounded-full bg-green-500"></span><span>${escapeHtml(pseudo)}</span></div>`;

        if (pseudo === state.currentUser) {
            const you = document.createElement("span");

            you.className = "text-xs text-sand-700";
            you.textContent = "vous";

            li.appendChild(you);
        }

        els.onlineUsers.appendChild(li);
    });

    const availableTargets = state.onlineUsers.filter((pseudo) => pseudo !== state.currentUser);
    els.callTarget.innerHTML = availableTargets.length ? availableTargets.map((pseudo) => `<option value="${escapeHtml(pseudo)}">${escapeHtml(pseudo)}</option>`).join("") : `<option value="">Aucun utilisateur disponible</option>`;
}

function renderLeaderboard() {
    els.leaderboard.innerHTML = "";
    state.leaderboard.forEach((entry, index) => {
        const div = document.createElement("div");

        div.className = "rounded-2xl border border-sand-700/10 bg-white/80 px-4 py-3";
        div.innerHTML = `<strong>#${index + 1} ${escapeHtml(entry.pseudo)}</strong>` + `<span class="mt-1 block text-sm text-sand-700">Score ${entry.score} - ${entry.messages_sent} msg - ${entry.alerts_received} alertes - ${entry.video_sessions_started} sessions</span>`;
        els.leaderboard.appendChild(div);
    });
}

function renderOverviewFeed() {
    if (!els.overviewFeed) {
        return;
    }

    const items = [];
    const latestNotification = state.notifications[0];
    const topUser = state.leaderboard[0];

    if (latestNotification) {
        items.push({
            title: `Notif ${latestNotification.type}`,
            text: `${latestNotification.title} - ${latestNotification.message}`,
            meta: formatDate(latestNotification.created_at)
        });
    }

    if (topUser) {
        items.push({
            title: "Utilisateur le plus actif",
            text: `${topUser.pseudo} mene avec ${topUser.score} points.`,
            meta: `${topUser.messages_sent} messages`
        });
    }

    const lastChat = els.chatMessages.lastElementChild;
    if (lastChat) {
        items.push({
            title: "Conversation",
            text: "Le chat est actif et synchronise en direct.",
            meta: "Temps reel"
        });
    }

    if (!items.length) {
        els.overviewFeed.innerHTML = '<div class="rounded-2xl border border-sand-700/10 bg-white/80 px-4 py-3"><strong>Aucun evenement pour le moment</strong><span class="mt-1 block text-sm text-sand-700">Connecte des utilisateurs pour voir bouger la plateforme.</span></div>';
        return;
    }

    els.overviewFeed.innerHTML = items.map((item) =>
        `<div class="rounded-2xl border border-sand-700/10 bg-white/80 px-4 py-3"><strong>${escapeHtml(item.title)}</strong><div>${escapeHtml(
          item.text
        )}</div><span class="mt-1 block text-sm text-sand-700">${escapeHtml(item.meta)}</span></div>`
    ).join("");
}

function appendChatMessage(message, system = false) {
    const div = document.createElement("div");

    div.className = `rounded-2xl border px-4 py-3 ${
        system
        ? "border-dashed border-ember-500/30 bg-ember-500/5"
        : "border-sand-700/10 bg-white/80"
    }`;

    div.innerHTML = `<strong>${escapeHtml(message.pseudo)}</strong>` + `<div>${escapeHtml(message.content)}</div>` + `<span class="mt-1 block text-sm text-sand-700">${formatDate(message.created_at || Date.now())}</span>`;
    els.chatMessages.appendChild(div);
    els.chatMessages.scrollTop = els.chatMessages.scrollHeight;

    renderOverviewFeed();
}

function renderNotifications() {
    els.notificationsList.innerHTML = "";

    state.notifications.forEach((notification) => {
        const div = document.createElement("div");
        
        const tone = notification.type === "critical" ? "border-l-red-700" : notification.type === "warning" ? "border-l-amber-500" : "border-l-pine-500";
        div.className = `rounded-2xl border border-sand-700/10 border-l-4 bg-white/80 px-4 py-3 ${tone}`;
        div.innerHTML = `<strong>${escapeHtml(notification.title)}</strong>` + `<div>${escapeHtml(notification.message)}</div>` + `<span class="mt-1 block text-sm text-sand-700">${escapeHtml(notification.created_by)} - ${formatDate(notification.created_at)}</span>`;
        els.notificationsList.appendChild(div);
    });

    renderOverviewFeed();
}

function appendSessionMessage(message) {
    const div = document.createElement("div");

    div.className = "rounded-2xl border border-sand-700/10 bg-white/80 px-4 py-3";
    div.innerHTML = `<strong>${escapeHtml(message.from)}</strong>` + `<div>${escapeHtml(message.content)}</div>` + `<span class="mt-1 block text-sm text-sand-700">${formatDate(message.created_at || Date.now())}</span>`;
    
    els.sessionChat.appendChild(div);
    els.sessionChat.scrollTop = els.sessionChat.scrollHeight;
}

function updateOverviewCounters(payload) {
    els.overviewActiveUsers.textContent = payload.metrics.activeUsers;
    els.overviewNotificationsTotal.textContent = payload.metrics.totalNotifications;
}

function activateTab(tabName) {
    els.tabButtons.forEach((button) => {
        const isActive = button.dataset.tab === tabName;
        button.className = `${tabButtonBaseClass} ${isActive ? tabButtonActiveClass : tabButtonInactiveClass}`;
    });

    els.tabPanels.forEach((panel) => {
        panel.classList.toggle("hidden", panel.dataset.panel !== tabName);
    });

    if (tabName === "overview") {
        cpuChart.resize();
        ramChart.resize();
    }
}

async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        return;
    }

    if (Notification.permission === "default") {
        try {
            await Notification.requestPermission();
        } catch {}
    }
}

function showBrowserNotification(notification) {
    if (!("Notification" in window) || Notification.permission !== "granted") {
        return;
    }

    new Notification(notification.title, {
        body: notification.message,
    });
}

function bootstrapUser(pseudo) {
    return new Promise((resolve) => {
        socket.emit("user:join", { pseudo }, resolve);
    });
}

els.joinForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const pseudo = els.pseudoInput.value.trim();

    if (!pseudo) {
        return;
    }

    const response = await bootstrapUser(pseudo);
    if (!response.ok) {
        els.joinStatus.textContent = response.error;
        return;
    }

    state.currentUser = pseudo;
    state.onlineUsers = response.payload.onlineUsers;
    state.notifications = response.payload.notifications;
    state.leaderboard = response.payload.leaderboard;
    els.chatMessages.innerHTML = "";

    response.payload.messages.forEach((message) => appendChatMessage(message));
    renderOnlineUsers();
    renderNotifications();
    renderLeaderboard();
    renderOverviewFeed();
    els.joinStatus.textContent = `Connecté en tant que ${pseudo}.`;
    addToast("info", `Bienvenue ${pseudo}`);
    requestNotificationPermission();
});

els.tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
        activateTab(button.dataset.tab);
    });
});

els.chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const content = els.chatInput.value.trim();

    if (!content || !state.currentUser) {
        return;
    }

    socket.emit("chat:send", { content }, (response) => {
        if (!response.ok) {
            addToast("critical", response.error);
        }
    });
    els.chatInput.value = "";
});

els.sessionChatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const content = els.sessionChatInput.value.trim();

    if (!content || !state.currentCallTarget) {
        return;
    }

    appendSessionMessage({
        from: state.currentUser,
        content,
        created_at: new Date().toISOString(),
    });
    socket.emit("webrtc:session-message", {
        target: state.currentCallTarget,
        content,
    });
    els.sessionChatInput.value = "";
});


socket.on("chat:new", (message) => appendChatMessage(message));
socket.on("system:message", (message) => appendChatMessage(message, true));

socket.on("presence:update", ({ onlineUsers }) => {
    state.onlineUsers = onlineUsers;
    renderOnlineUsers();
});

socket.on("leaderboard:update", (leaderboard) => {
    state.leaderboard = leaderboard;
    renderLeaderboard();
    renderOverviewFeed();
});
