import {
  auth, db, signInAnonymously, collection, addDoc, onSnapshot,
  doc, setDoc, getDoc, serverTimestamp, query, orderBy, limit, updateDoc
} from "./firebase.js";

const demoMessages = [
  ["Carlos", "A gente pode sair umas três da tarde."],
  ["Marina", "Pra mim está ótimo, eu só preciso pegar uma coisa antes."],
  ["Joana", "Então combinamos assim. Depois eu mando o endereço no grupo."]
];
const miniChat = document.querySelector("#miniChat");
if (miniChat) {
  demoMessages.forEach(([name, text], index) => {
    window.setTimeout(() => {
      const item = document.createElement("div");
      item.className = "mini-message";
      const author = document.createElement("b");
      author.textContent = name;
      const body = document.createElement("p");
      body.textContent = text;
      item.append(author, body);
      miniChat.appendChild(item);
    }, 250 + index * 450);
  });
}

const modeText = document.querySelector("#modeText");
const statusTitle = document.querySelector("#statusTitle");
const statusSub = document.querySelector("#statusSub");
document.querySelectorAll(".mode").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".mode").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const isSpeaker = button.dataset.mode === "speaker";
    if (modeText) {
      modeText.textContent = isSpeaker
        ? "Seu celular usa o microfone para transformar a sua fala em texto. Como você entrou com seu nome, as mensagens deste aparelho chegam identificadas."
        : "Você acompanha todas as falas em um chat grande e legível. Pode aumentar a fonte e acompanhar a última fala.";
    }
    if (statusTitle) statusTitle.textContent = isSpeaker ? "Microfone pronto" : "Acompanhando conversa";
    if (statusSub) statusSub.textContent = isSpeaker ? "Toque para começar a falar" : "As falas aparecem automaticamente";
  });
});
const talkButton = document.querySelector("#talkButton");
if (talkButton) talkButton.addEventListener("click", () => document.querySelector(".mode:not(.active)")?.click());

// Sala compartilhada com Firebase
const participantNameInput = document.querySelector("#participantName");
const newRoomNameInput = document.querySelector("#newRoomName");
const roomCodeInput = document.querySelector("#roomCodeInput");
const createRoomButton = document.querySelector("#createRoomBtn");
const joinRoomButton = document.querySelector("#joinRoomBtn");
const roomEntry = document.querySelector("#roomEntry");
const activeRoomPanel = document.querySelector("#activeRoomPanel");
const roomFeedback = document.querySelector("#roomFeedback");
const activeRoomTitle = document.querySelector("#activeRoomTitle");
const activeRoomCode = document.querySelector("#activeRoomCode");
const participantCount = document.querySelector("#participantCount");
const roomMessages = document.querySelector("#roomMessages");
const messageForm = document.querySelector("#messageForm");
const messageInput = document.querySelector("#messageInput");
const voiceButton = document.querySelector("#voiceButton");
const copyInviteButton = document.querySelector("#copyInviteBtn");
const leaveRoomButton = document.querySelector("#leaveRoomBtn");
const roomModeButtons = Array.from(document.querySelectorAll(".room-mode-btn"));

let currentUser = null;
let currentRoom = null;
let currentMode = "ouvinte";
let stopMessagesListener = null;
let stopParticipantsListener = null;
let speechRecognition = null;

function setRoomFeedback(message, state) {
  if (!roomFeedback) return;
  roomFeedback.textContent = message;
  if (state) roomFeedback.dataset.state = state;
  else delete roomFeedback.dataset.state;
}

async function ensureAnonymousUser() {
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

const firebaseReady = ensureAnonymousUser()
  .then((user) => {
    currentUser = user;
    console.info("Ouvir & Ler conectado ao Firebase!");
    setRoomFeedback("Conexão pronta. Informe seu nome para criar ou entrar em uma sala.", "success");
    return user;
  })
  .catch((error) => {
    console.error("Erro na autenticação do Ouvir & Ler:", error);
    setRoomFeedback("Não foi possível conectar ao Firebase. Atualize a página e tente novamente.", "error");
    throw error;
  });
firebaseReady.catch(() => {});

function randomRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const values = new Uint8Array(8);
  window.crypto.getRandomValues(values);
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join("");
}

function displayRoomCode(code) {
  return code.length === 8 ? code.slice(0, 4) + " " + code.slice(4) : code;
}

function stopRoomListeners() {
  if (stopMessagesListener) stopMessagesListener();
  if (stopParticipantsListener) stopParticipantsListener();
  stopMessagesListener = null;
  stopParticipantsListener = null;
}

function formatMessageTime(value) {
  if (!value) return "";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function renderRoomMessages(snapshot) {
  if (!roomMessages) return;
  roomMessages.replaceChildren();
  if (snapshot.empty) {
    const empty = document.createElement("p");
    empty.className = "empty-room-message";
    empty.textContent = "A conversa ainda não começou. Quando alguém enviar uma mensagem, ela aparecerá aqui.";
    roomMessages.appendChild(empty);
    return;
  }

  snapshot.forEach((documentSnapshot) => {
    const message = documentSnapshot.data();
    const article = document.createElement("article");
    article.className = "live-message";

    const avatar = document.createElement("span");
    avatar.className = "live-message-avatar";
    avatar.textContent = String(message.participante || "P").trim().charAt(0).toUpperCase() || "P";

    const content = document.createElement("div");
    content.className = "live-message-content";
    const meta = document.createElement("div");
    meta.className = "live-message-meta";
    const name = document.createElement("strong");
    name.textContent = message.participante || "Participante";
    const time = document.createElement("time");
    time.textContent = formatMessageTime(message.criadoEm);
    meta.append(name, time);

    const body = document.createElement("p");
    body.textContent = message.texto || "";
    content.append(meta, body);
    article.append(avatar, content);
    roomMessages.appendChild(article);
  });
  roomMessages.scrollTop = roomMessages.scrollHeight;
}

async function registerParticipant(roomRef, user, name, mode) {
  const participantRef = doc(roomRef, "participantes", user.uid);
  const existing = await getDoc(participantRef);
  if (existing.exists()) {
    await updateDoc(participantRef, {
      nome: name,
      modo: mode,
      ultimoAcesso: serverTimestamp()
    });
  } else {
    await setDoc(participantRef, {
      nome: name,
      modo: mode,
      entrouEm: serverTimestamp(),
      ultimoAcesso: serverTimestamp()
    });
  }
}

function openRoom(roomId, roomData, user, name, mode) {
  stopRoomListeners();
  currentRoom = { id: roomId, nome: roomData.nome || "Conversa em grupo", user, name };
  currentMode = mode;
  if (roomEntry) roomEntry.hidden = true;
  if (activeRoomPanel) activeRoomPanel.hidden = false;
  if (activeRoomTitle) activeRoomTitle.textContent = currentRoom.nome;
  if (activeRoomCode) activeRoomCode.textContent = displayRoomCode(roomId);
  if (voiceButton) voiceButton.hidden = currentMode !== "falante";
  roomModeButtons.forEach((button) => button.classList.toggle("active", button.dataset.roomMode === currentMode));

  const messagesQuery = query(
    collection(db, "salas", roomId, "mensagens"),
    orderBy("criadoEm", "asc"),
    limit(100)
  );
  stopMessagesListener = onSnapshot(messagesQuery, renderRoomMessages, (error) => {
    console.error("Erro ao acompanhar mensagens:", error);
    setRoomFeedback("Não foi possível carregar as mensagens. Confira as regras do Firestore.", "error");
  });

  stopParticipantsListener = onSnapshot(
    collection(db, "salas", roomId, "participantes"),
    (snapshot) => {
      const count = snapshot.size;
      if (participantCount) participantCount.textContent = count === 1 ? "1 pessoa na sala" : count + " pessoas na sala";
    },
    (error) => {
      console.error("Erro ao acompanhar participantes:", error);
    }
  );

  const url = new URL(window.location.href);
  url.searchParams.set("sala", roomId);
  window.history.replaceState({}, "", url);
  setRoomFeedback("Você entrou na sala. As mensagens aparecerão aqui em tempo real.", "success");
  activeRoomPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function createRoom() {
  const name = participantNameInput?.value.trim();
  const title = newRoomNameInput?.value.trim() || "Conversa em família";
  if (!name) {
    setRoomFeedback("Informe seu nome para que as mensagens sejam identificadas.", "error");
    participantNameInput?.focus();
    return;
  }
  if (name.length > 40 || title.length > 60) {
    setRoomFeedback("Confira o tamanho do nome e do título da conversa.", "error");
    return;
  }

  createRoomButton.disabled = true;
  joinRoomButton.disabled = true;
  setRoomFeedback("Criando sua sala…");
  try {
    const user = await firebaseReady;
    let roomId = randomRoomCode();
    let roomRef = doc(db, "salas", roomId);
    let attempts = 0;
    while ((await getDoc(roomRef)).exists() && attempts < 5) {
      roomId = randomRoomCode();
      roomRef = doc(db, "salas", roomId);
      attempts += 1;
    }
    if ((await getDoc(roomRef)).exists()) throw new Error("Não foi possível gerar um código livre. Tente novamente.");

    const roomData = { nome: title, status: "ativa", ownerUid: user.uid, criadoEm: serverTimestamp() };
    await setDoc(roomRef, roomData);
    await registerParticipant(roomRef, user, name, "ouvinte");
    openRoom(roomId, { nome: title }, user, name, "ouvinte");
  } catch (error) {
    console.error("Erro ao criar sala:", error);
    setRoomFeedback(error.code === "permission-denied"
      ? "O Firebase ainda está bloqueando o acesso. Publique as regras do arquivo firestore.rules no Console do Firebase e tente novamente."
      : "Não foi possível criar a sala. " + (error.message || "Tente novamente."), "error");
  } finally {
    createRoomButton.disabled = false;
    joinRoomButton.disabled = false;
  }
}

async function joinRoom() {
  const name = participantNameInput?.value.trim();
  const enteredCode = roomCodeInput?.value.trim().replace(/\s+/g, "");
  if (!name) {
    setRoomFeedback("Informe seu nome para entrar na conversa.", "error");
    participantNameInput?.focus();
    return;
  }
  if (!enteredCode) {
    setRoomFeedback("Digite o código que recebeu de quem criou a sala.", "error");
    roomCodeInput?.focus();
    return;
  }

  createRoomButton.disabled = true;
  joinRoomButton.disabled = true;
  setRoomFeedback("Procurando a sala…");
  try {
    const user = await firebaseReady;
    const candidates = Array.from(new Set([enteredCode, enteredCode.toUpperCase()]));
    let roomSnapshot = null;
    let roomId = null;
    for (const candidate of candidates) {
      const snapshot = await getDoc(doc(db, "salas", candidate));
      if (snapshot.exists()) {
        roomSnapshot = snapshot;
        roomId = candidate;
        break;
      }
    }
    if (!roomSnapshot) throw new Error("Sala não encontrada. Confira o código com quem criou a conversa.");
    const roomData = roomSnapshot.data();
    if (roomData.status !== "ativa") throw new Error("Essa sala não está mais ativa.");
    await registerParticipant(roomSnapshot.ref, user, name, "ouvinte");
    openRoom(roomId, roomData, user, name, "ouvinte");
  } catch (error) {
    console.error("Erro ao entrar na sala:", error);
    setRoomFeedback(error.code === "permission-denied"
      ? "O Firebase bloqueou o acesso. Confira se as regras de firestore.rules já foram publicadas."
      : (error.message || "Não foi possível entrar na sala."), "error");
  } finally {
    createRoomButton.disabled = false;
    joinRoomButton.disabled = false;
  }
}

async function sendRoomMessage(text) {
  if (!currentRoom || !text.trim()) return;
  const cleanText = text.trim().slice(0, 1500);
  await addDoc(collection(db, "salas", currentRoom.id, "mensagens"), {
    participanteId: currentRoom.user.uid,
    participante: currentRoom.name,
    texto: cleanText,
    criadoEm: serverTimestamp()
  });
}

async function changeRoomMode(mode) {
  if (!currentRoom || !["ouvinte", "falante"].includes(mode)) return;
  currentMode = mode;
  roomModeButtons.forEach((button) => button.classList.toggle("active", button.dataset.roomMode === mode));
  if (voiceButton) voiceButton.hidden = mode !== "falante";
  try {
    await updateDoc(doc(db, "salas", currentRoom.id, "participantes", currentRoom.user.uid), {
      modo: mode,
      ultimoAcesso: serverTimestamp()
    });
    setRoomFeedback(mode === "falante" ? "Modo de fala ativado. Você pode usar o botão Falar ou digitar." : "Modo ouvinte ativado. Você acompanha as mensagens da sala.", "success");
  } catch (error) {
    console.error("Não foi possível atualizar o modo:", error);
    setRoomFeedback("Não foi possível atualizar seu modo de participação.", "error");
  }
}

async function leaveRoom() {
  if (!currentRoom) return;
  const leaving = currentRoom;
  try {
    await updateDoc(doc(db, "salas", leaving.id, "participantes", leaving.user.uid), {
      modo: "offline",
      ultimoAcesso: serverTimestamp()
    });
  } catch (error) {
    console.warn("Não foi possível atualizar o status do participante:", error);
  }
  stopRoomListeners();
  currentRoom = null;
  if (activeRoomPanel) activeRoomPanel.hidden = true;
  if (roomEntry) roomEntry.hidden = false;
  const url = new URL(window.location.href);
  url.searchParams.delete("sala");
  window.history.replaceState({}, "", url);
  setRoomFeedback("Você saiu da sala. Pode criar outra conversa ou entrar com um novo código.", "success");
}

createRoomButton?.addEventListener("click", createRoom);
joinRoomButton?.addEventListener("click", joinRoom);
roomModeButtons.forEach((button) => button.addEventListener("click", () => changeRoomMode(button.dataset.roomMode)));
messageForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = messageInput?.value || "";
  if (!text.trim()) return;
  const sendButton = messageForm.querySelector('button[type="submit"]');
  if (sendButton) sendButton.disabled = true;
  try {
    await sendRoomMessage(text);
    messageInput.value = "";
    messageInput.focus();
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    setRoomFeedback(error.code === "permission-denied"
      ? "Mensagem não enviada: confira as regras e se você continua na sala."
      : "Não foi possível enviar a mensagem. Tente novamente.", "error");
  } finally {
    if (sendButton) sendButton.disabled = false;
  }
});

voiceButton?.addEventListener("click", () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setRoomFeedback("Este navegador não oferece ditado por voz. Você ainda pode digitar sua mensagem.", "error");
    return;
  }
  if (speechRecognition) {
    speechRecognition.stop();
    return;
  }
  speechRecognition = new SpeechRecognition();
  speechRecognition.lang = "pt-BR";
  speechRecognition.continuous = false;
  speechRecognition.interimResults = false;
  voiceButton.disabled = true;
  voiceButton.textContent = "Ouvindo…";
  setRoomFeedback("Pode falar. O navegador vai transformar sua fala em texto.");
  speechRecognition.onresult = async (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || "";
    if (transcript) {
      try {
        await sendRoomMessage(transcript);
        setRoomFeedback("Fala enviada para a conversa.", "success");
      } catch (error) {
        console.error("Erro ao enviar a fala:", error);
        setRoomFeedback("A fala foi reconhecida, mas não foi possível enviá-la. Confira a conexão e as regras.", "error");
      }
    }
  };
  speechRecognition.onerror = (event) => {
    setRoomFeedback("Não foi possível reconhecer a fala (" + event.error + "). Você pode tentar novamente ou digitar.", "error");
  };
  speechRecognition.onend = () => {
    speechRecognition = null;
    voiceButton.disabled = false;
    voiceButton.textContent = "Falar";
  };
  try {
    speechRecognition.start();
  } catch (error) {
    speechRecognition = null;
    voiceButton.disabled = false;
    voiceButton.textContent = "Falar";
    setRoomFeedback("Não foi possível iniciar o microfone. Verifique a permissão do navegador.", "error");
  }
});

copyInviteButton?.addEventListener("click", async () => {
  if (!currentRoom) return;
  const inviteUrl = new URL(window.location.href);
  inviteUrl.searchParams.set("sala", currentRoom.id);
  inviteUrl.hash = "sala";
  try {
    await navigator.clipboard.writeText(inviteUrl.toString());
    setRoomFeedback("Convite copiado! Compartilhe o link e o código da sala.", "success");
  } catch (error) {
    window.prompt("Copie o link da conversa:", inviteUrl.toString());
  }
});
leaveRoomButton?.addEventListener("click", leaveRoom);

const sharedCode = new URLSearchParams(window.location.search).get("sala");
if (sharedCode && roomCodeInput) {
  roomCodeInput.value = sharedCode;
  document.querySelector("#sala")?.scrollIntoView({ behavior: "smooth" });
}

window.addEventListener("pagehide", stopRoomListeners);
