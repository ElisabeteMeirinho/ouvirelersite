import {initializeApp,getApps} from 'firebase/app';
import {getDatabase,onChildAdded,push,ref,set,off} from 'firebase/database';
import type {Message,Mode} from '../types';
const config={apiKey:process.env.EXPO_PUBLIC_FIREBASE_API_KEY,authDomain:process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,databaseURL:process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,projectId:process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,appId:process.env.EXPO_PUBLIC_FIREBASE_APP_ID};
export const firebaseConfigured=Boolean(config.apiKey&&config.databaseURL&&config.projectId);
const app=firebaseConfigured?(getApps()[0]??initializeApp(config)):null;
const db=app?getDatabase(app):null;
export async function upsertParticipant(roomId:string,id:string,name:string,mode:Mode){if(!db)return;await set(ref(db,`rooms/${roomId}/participants/${id}`),{name,mode,connectedAt:Date.now()});}
export async function sendRoomMessage(message:Omit<Message,'id'>){if(!db)return;await push(ref(db,`rooms/${message.roomId}/messages`),message);}
export function listenRoomMessages(roomId:string,onMessage:(m:Message)=>void){if(!db)return()=>{};const messagesRef=ref(db,`rooms/${roomId}/messages`);onChildAdded(messagesRef,s=>onMessage({id:s.key??String(Date.now()),...s.val()}));return()=>off(messagesRef);}
