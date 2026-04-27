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
  pendingIncomingCall: null,
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
  tabPanels: Array.from(document.querySelectorAll(".tab-panel")),
};

function createChartConfig(label, border, background) {
  return {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: `${label} %`,
          data: [],
          borderColor: border,
          backgroundColor: background,
          tension: 0.35,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100 } },
    },
  };
}

const cpuChart = new Chart(
  document.getElementById("cpu-chart"),
  createChartConfig("CPU", "#d65a31", "rgba(214, 90, 49, 0.18)")
);
const ramChart = new Chart(
  document.getElementById("ram-chart"),
  createChartConfig("RAM", "#2b7a78", "rgba(43, 122, 120, 0.18)")
);

const tabButtonBaseClass =
  "tab-button rounded-2xl px-4 py-3 text-sm font-medium transition";
const tabButtonActiveClass = "is-active bg-sand-900 text-white shadow-md";
const tabButtonInactiveClass = "bg-transparent text-sand-700 hover:bg-sand-900/5";

function addToast(type, text) {
  const toast = document.createElement("div");
  const tone =
    type === "critical"
      ? "bg-red-700"
      : type === "warning"
        ? "bg-amber-600"
        : "bg-pine-500";
  toast.className = `pointer-events-auto rounded-3xl px-4 py-3 text-sm text-white shadow-panel ${tone}`;
  toast.textContent = text;
  els.toastStack.prepend(toast);
  setTimeout(() => toast.remove(), 4000);
}

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

function renderOnlineUsers() {
  els.onlineCount.textContent = state.onlineUsers.length;
  els.onlineUsers.innerHTML = "";

  state.onlineUsers.forEach((pseudo) => {
    const li = document.createElement("li");
    li.className =
      "flex items-center justify-between gap-3 rounded-2xl border border-sand-700/10 bg-white/80 px-4 py-3";
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
  els.callTarget.innerHTML = availableTargets.length
    ? availableTargets
      .map((pseudo) => `<option value="${escapeHtml(pseudo)}">${escapeHtml(pseudo)}</option>`)
      .join("")
    : `<option value="">Aucun utilisateur disponible</option>`;
}

function renderLeaderboard() {
  els.leaderboard.innerHTML = "";
  state.leaderboard.forEach((entry, index) => {
    const div = document.createElement("div");
    div.className = "rounded-2xl border border-sand-700/10 bg-white/80 px-4 py-3";
    div.innerHTML =
      `<strong>#${index + 1} ${escapeHtml(entry.pseudo)}</strong>` +
      `<span class="mt-1 block text-sm text-sand-700">${entry.messages_sent} msg - ${entry.alerts_received} alertes - ${entry.video_sessions_started} sessions</span>`;
    els.leaderboard.appendChild(div);
  });
}

function appendChatMessage(message, system = false) {
  const div = document.createElement("div");
  div.className = `rounded-2xl border px-4 py-3 ${system
    ? "border-dashed border-ember-500/30 bg-ember-500/5"
    : "border-sand-700/10 bg-white/80"
    }`;
  div.innerHTML =
    `<strong>${escapeHtml(message.pseudo)}</strong>` +
    `<div>${escapeHtml(message.content)}</div>` +
    `<span class="mt-1 block text-sm text-sand-700">${formatDate(message.created_at || Date.now())}</span>`;
  els.chatMessages.appendChild(div);
  els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
  renderOverviewFeed();
}

function renderNotifications() {
  els.notificationsList.innerHTML = "";
  state.notifications.forEach((notification) => {
    const div = document.createElement("div");
    const tone =
      notification.type === "critical"
        ? "border-l-red-700"
        : notification.type === "warning"
          ? "border-l-amber-500"
          : "border-l-pine-500";
    div.className = `rounded-2xl border border-sand-700/10 border-l-4 bg-white/80 px-4 py-3 ${tone}`;
    div.innerHTML =
      `<strong>${escapeHtml(notification.title)}</strong>` +
      `<div>${escapeHtml(notification.message)}</div>` +
      `<span class="mt-1 block text-sm text-sand-700">${escapeHtml(notification.created_by)} - ${formatDate(notification.created_at)}</span>`;
    els.notificationsList.appendChild(div);
  });

  renderOverviewFeed();
}

function appendSessionMessage(message) {
  const div = document.createElement("div");
  div.className = "rounded-2xl border border-sand-700/10 bg-white/80 px-4 py-3";
  div.innerHTML =
    `<strong>${escapeHtml(message.from)}</strong>` +
    `<div>${escapeHtml(message.content)}</div>` +
    `<span class="mt-1 block text-sm text-sand-700">${formatDate(message.created_at || Date.now())}</span>`;
  els.sessionChat.appendChild(div);
  els.sessionChat.scrollTop = els.sessionChat.scrollHeight;
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
      meta: formatDate(latestNotification.created_at),
    });
  }

  if (topUser) {
    items.push({
      title: "Utilisateur le plus actif",
      text: `${topUser.pseudo} mène avec ${topUser.score} points.`,
      meta: `${topUser.messages_sent} messages`,
    });
  }

  const lastChat = els.chatMessages.lastElementChild;
  if (lastChat) {
    items.push({
      title: "Conversation",
      text: "Le chat est actif et synchronisé en direct.",
      meta: "Temps réel",
    });
  }

  if (!items.length) {
    els.overviewFeed.innerHTML =
      '<div class="rounded-2xl border border-sand-700/10 bg-white/80 px-4 py-3"><strong>Aucun événement pour le moment</strong></div>';
    return;
  }

  els.overviewFeed.innerHTML = items
    .map(
      (item) =>
        `<div class="rounded-2xl border border-sand-700/10 bg-white/80 px-4 py-3"><strong>${escapeHtml(item.title)}</strong><div>${escapeHtml(
          item.text
        )}</div><span class="mt-1 block text-sm text-sand-700">${escapeHtml(item.meta)}</span></div>`
    )
    .join("");
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

function updateDashboard(payload) {
  const label = new Date(payload.timestamp).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  state.dashboardPoints.labels.push(label);
  state.dashboardPoints.cpu.push(payload.metrics.cpu);
  state.dashboardPoints.ram.push(payload.metrics.ram);

  if (state.dashboardPoints.labels.length > 12) {
    state.dashboardPoints.labels.shift();
    state.dashboardPoints.cpu.shift();
    state.dashboardPoints.ram.shift();
  }

  cpuChart.data.labels = [...state.dashboardPoints.labels];
  cpuChart.data.datasets[0].data = [...state.dashboardPoints.cpu];
  ramChart.data.labels = [...state.dashboardPoints.labels];
  ramChart.data.datasets[0].data = [...state.dashboardPoints.ram];
  cpuChart.update();
  ramChart.update();

  els.cpuValue.textContent = `${payload.metrics.cpu}%`;
  els.ramValue.textContent = `${payload.metrics.ram}%`;
  els.messagesTotal.textContent = payload.metrics.totalMessages;
  els.videoTotal.textContent = payload.metrics.totalVideoSessions;
  els.systemAlerts.innerHTML = "";
  updateOverviewCounters(payload);

  payload.alerts.forEach((alert) => {
    const span = document.createElement("span");
    const level = !alert.triggered
      ? "bg-pine-500/10 text-pine-500"
      : alert.metric === "cpu"
        ? "bg-red-700/10 text-red-700"
        : "bg-amber-500/15 text-amber-700";
    span.className = `rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-wide ${level}`;
    span.textContent = alert.triggered ? alert.message : `${alert.metric.toUpperCase()} stable`;
    els.systemAlerts.appendChild(span);
  });
}

function showIncomingCall(session) {
  state.pendingIncomingCall = session;
  els.incomingCallText.textContent = `${session.caller} t'appelle en visio`;
  els.incomingCallBox.classList.remove("hidden");
  els.incomingCallBox.classList.add("flex");
}

function hideIncomingCall() {
  state.pendingIncomingCall = null;
  els.incomingCallBox.classList.add("hidden");
  els.incomingCallBox.classList.remove("flex");
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    return;
  }
  if (Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch {
      // Ignore browser-specific permission failures.
    }
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

async function ensureLocalMedia() {
  if (state.localStream) {
    return state.localStream;
  }

  state.localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  els.localVideo.srcObject = state.localStream;
  return state.localStream;
}

function stopLocalMedia() {
  if (!state.localStream) {
    return;
  }

  state.localStream.getTracks().forEach((track) => track.stop());
  state.localStream = null;
  els.localVideo.srcObject = null;
}

async function flushPendingCandidates() {
  if (!state.peerConnection || !state.peerConnection.remoteDescription) {
    return;
  }

  while (state.pendingCandidates.length) {
    const candidate = state.pendingCandidates.shift();
    await state.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
}

async function createPeerConnection(target) {
  if (state.peerConnection) {
    return state.peerConnection;
  }

  await ensureLocalMedia();

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  state.remoteStream = new MediaStream();
  els.remoteVideo.srcObject = state.remoteStream;
  state.localStream.getTracks().forEach((track) => {
    pc.addTrack(track, state.localStream);
  });

  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => state.remoteStream.addTrack(track));
  };

  pc.onicecandidate = (event) => {
    if (!event.candidate || !state.currentCallTarget) {
      return;
    }

    socket.emit("webrtc:signal", {
      target: state.currentCallTarget,
      type: "candidate",
      data: event.candidate,
      sessionId: state.currentSessionId,
    });
  };

  state.peerConnection = pc;
  state.currentCallTarget = target;
  return pc;
}

function resetCallState() {
  if (state.peerConnection) {
    state.peerConnection.close();
  }

  state.peerConnection = null;
  state.remoteStream = null;
  state.currentCallTarget = "";
  state.currentSessionId = null;
  state.pendingCandidates = [];
  hideIncomingCall();
  els.remoteVideo.srcObject = null;
  els.sessionChat.innerHTML = "";
  els.callStatus.textContent = "Aucune session active.";
  stopLocalMedia();
}

function endCall(notifyRemote = true) {
  if (notifyRemote && state.currentCallTarget) {
    socket.emit("webrtc:end", {
      target: state.currentCallTarget,
      sessionId: state.currentSessionId,
    });
  }

  resetCallState();
}

async function startOutgoingCall(target) {
  if (state.currentCallTarget) {
    addToast("warning", "Une session est déjà en cours.");
    return;
  }

  const response = await new Promise((resolve) => {
    socket.emit("webrtc:request", { target }, resolve);
  });

  if (!response.ok) {
    addToast("critical", response.error);
    return;
  }

  state.currentCallTarget = target;
  state.currentSessionId = response.session.id;
  els.callStatus.textContent = `Invitation envoyée à ${target}. En attente de réponse...`;
}

async function handleAcceptedCall(from, sessionId) {
  state.currentCallTarget = from;
  state.currentSessionId = sessionId;

  const pc = await createPeerConnection(from);
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit("webrtc:signal", {
    target: from,
    type: "offer",
    data: offer,
    sessionId,
  });

  els.callStatus.textContent = `Négociation WebRTC en cours avec ${from}.`;
}

async function handleOffer(from, offer, sessionId) {
  state.currentCallTarget = from;
  state.currentSessionId = sessionId;

  const pc = await createPeerConnection(from);
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  await flushPendingCandidates();

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  socket.emit("webrtc:signal", {
    target: from,
    type: "answer",
    data: answer,
    sessionId,
  });

  els.callStatus.textContent = `Appel avec ${from} en cours.`;
}

async function handleAnswer(answer) {
  if (!state.peerConnection) {
    return;
  }

  await state.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  await flushPendingCandidates();
  els.callStatus.textContent = `Appel avec ${state.currentCallTarget} en cours.`;
}

async function handleCandidate(candidate) {
  if (!state.peerConnection || !state.peerConnection.remoteDescription) {
    state.pendingCandidates.push(candidate);
    return;
  }

  await state.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
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

els.notificationForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!state.currentUser) {
    addToast("warning", "Connecte-toi avant de diffuser une notification.");
    return;
  }

  const payload = {
    type: els.notificationType.value,
    title: els.notificationTitle.value.trim(),
    message: els.notificationMessage.value.trim(),
    createdBy: state.currentUser,
  };

  if (!payload.title || !payload.message) {
    addToast("warning", "Le titre et le message sont obligatoires.");
    return;
  }

  try {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      addToast("critical", data.error || "Impossible d'envoyer la notification.");
      return;
    }

    els.notificationTitle.value = "";
    els.notificationMessage.value = "";
    addToast(data.type, "Notification diffusée.");
  } catch (error) {
    addToast("critical", `Erreur réseau: ${error.message}`);
  }
});

els.startCall.addEventListener("click", async () => {
  const target = els.callTarget.value;

  if (!state.currentUser || !target) {
    addToast("warning", "Choisis un utilisateur disponible.");
    return;
  }

  try {
    await startOutgoingCall(target);
  } catch (error) {
    addToast("critical", `Impossible de démarrer l'appel: ${error.message}`);
  }
});

els.acceptCall.addEventListener("click", async () => {
  const session = state.pendingIncomingCall;
  if (!session) {
    return;
  }

  state.currentCallTarget = session.caller;
  state.currentSessionId = session.id;
  els.callStatus.textContent = "Invitation acceptée. Préparation des médias...";

  try {
    await ensureLocalMedia();
    socket.emit("webrtc:accept", {
      target: session.caller,
      sessionId: session.id,
    });
    hideIncomingCall();
  } catch (error) {
    socket.emit("webrtc:decline", {
      target: session.caller,
      sessionId: session.id,
    });
    resetCallState();
    addToast("critical", `Accès caméra/micro refusé: ${error.message}`);
  }
});

els.declineCall.addEventListener("click", () => {
  const session = state.pendingIncomingCall;
  if (!session) {
    return;
  }

  socket.emit("webrtc:decline", {
    target: session.caller,
    sessionId: session.id,
  });
  hideIncomingCall();
  els.callStatus.textContent = "Aucune session active.";
});

els.shareScreen.addEventListener("click", async () => {
  if (!state.peerConnection || !state.localStream) {
    addToast("warning", "Démarre un appel avant de partager l'écran.");
    return;
  }

  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = screenStream.getVideoTracks()[0];
    const sender = state.peerConnection
      .getSenders()
      .find((candidate) => candidate.track && candidate.track.kind === "video");

    if (sender) {
      await sender.replaceTrack(screenTrack);
      els.localVideo.srcObject = screenStream;
      screenTrack.onended = async () => {
        const cameraTrack = state.localStream?.getVideoTracks()[0];
        if (cameraTrack) {
          await sender.replaceTrack(cameraTrack);
          els.localVideo.srcObject = state.localStream;
        }
      };
      addToast("info", "Partage d'écran activé.");
    }
  } catch (error) {
    addToast("warning", `Partage annulé: ${error.message}`);
  }
});

els.endCall.addEventListener("click", () => endCall(true));

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

socket.on("presence:update", ({ onlineUsers }) => {
  state.onlineUsers = onlineUsers;
  renderOnlineUsers();
});

socket.on("leaderboard:update", (leaderboard) => {
  state.leaderboard = leaderboard;
  renderLeaderboard();
  renderOverviewFeed();
});

socket.on("chat:new", (message) => appendChatMessage(message));
socket.on("system:message", (message) => appendChatMessage(message, true));

socket.on("notification:new", (notification) => {
  state.notifications.unshift(notification);
  state.notifications = state.notifications.slice(0, 20);
  renderNotifications();
  showBrowserNotification(notification);
  addToast(notification.type, `${notification.title}: ${notification.message}`);
  socket.emit("notification:ack");
});

socket.on("notifications:list", (notifications) => {
  state.notifications = notifications;
  renderNotifications();
});

socket.on("webrtc:incoming", async (session) => {
  if (state.currentCallTarget || state.pendingIncomingCall) {
    socket.emit("webrtc:decline", {
      target: session.caller,
      sessionId: session.id,
    });
    return;
  }
  showIncomingCall(session);
  els.callStatus.textContent = `Appel entrant de ${session.caller}.`;
});

socket.on("webrtc:accepted", async ({ from, sessionId }) => {
  try {
    await handleAcceptedCall(from, sessionId);
  } catch (error) {
    addToast("critical", `Impossible de créer l'offre WebRTC: ${error.message}`);
    endCall(true);
  }
});

socket.on("webrtc:declined", ({ from }) => {
  addToast("warning", `${from} a refusé l'appel.`);
  resetCallState();
});

socket.on("webrtc:signal", async ({ from, type, data, sessionId }) => {
  try {
    if (type === "offer") {
      await handleOffer(from, data, sessionId);
      return;
    }

    if (type === "answer") {
      await handleAnswer(data);
      return;
    }

    if (type === "candidate" && data) {
      await handleCandidate(data);
    }
  } catch (error) {
    addToast("critical", `Erreur de signalisation WebRTC: ${error.message}`);
  }
});

socket.on("webrtc:session-message", appendSessionMessage);

socket.on("webrtc:end", ({ from }) => {
  addToast("warning", `Session terminée par ${from}.`);
  resetCallState();
});

const dashboardSource = new EventSource("/api/dashboard/stream");
dashboardSource.addEventListener("dashboard", (event) => {
  updateDashboard(JSON.parse(event.data));
});
