import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import type { Message, Mode } from '../types';

const firebaseConfig = {
  apiKey: 'AIzaSyDKRn1M5HvCRo9dtCWFP3adepUEe7lBbvg',
  authDomain: 'ouvir-e-ler.firebaseapp.com',
  projectId: 'ouvir-e-ler',
  storageBucket: 'ouvir-e-ler.firebasestorage.app',
  messagingSenderId: '1032722618943',
  appId: '1:1032722618943:web:21d05ad36b46290ca6b68a',
  measurementId: 'G-V167H5ZQLV'
};

const app = getApps()[0] ?? initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const firebaseConfigured = true;

async function ensureAnonymousUser() {
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

function toRoomMode(mode: Mode) {
  return mode === 'listener' ? 'ouvinte' : 'falante';
}

export async function upsertParticipant(roomId: string, _localId: string, name: string, mode: Mode) {
  const user = await ensureAnonymousUser();
  const participantRef = doc(db, 'salas', roomId, 'participantes', user.uid);
  const existing = await getDoc(participantRef);
  const participantData = {
    nome: name.trim().slice(0, 40),
    modo: toRoomMode(mode),
    ultimoAcesso: serverTimestamp()
  };

  if (existing.exists()) {
    await updateDoc(participantRef, participantData);
  } else {
    await setDoc(participantRef, {
      ...participantData,
      entrouEm: serverTimestamp()
    });
  }

  return user.uid;
}

export async function sendRoomMessage(message: Omit<Message, 'id'>) {
  const user = await ensureAnonymousUser();
  const participantRef = doc(db, 'salas', message.roomId, 'participantes', user.uid);
  const participant = await getDoc(participantRef);
  if (!participant.exists()) {
    throw new Error('Você não está registrado como participante desta sala.');
  }

  await addDoc(collection(db, 'salas', message.roomId, 'mensagens'), {
    participanteId: user.uid,
    participante: participant.data().nome,
    texto: message.text.trim().slice(0, 1500),
    criadoEm: serverTimestamp()
  });
}

export function listenRoomMessages(roomId: string, onMessage: (message: Message) => void) {
  const messagesQuery = query(
    collection(db, 'salas', roomId, 'mensagens'),
    orderBy('criadoEm', 'asc'),
    limit(100)
  );

  return onSnapshot(messagesQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type !== 'added') return;
      const data = change.doc.data();
      const createdAt = data.criadoEm?.toMillis?.() ?? Date.now();
      onMessage({
        id: change.doc.id,
        roomId,
        participantId: data.participanteId ?? '',
        participantName: data.participante ?? 'Participante',
        text: data.texto ?? '',
        createdAt,
        aiAdjusted: false
      });
    });
  });
}
