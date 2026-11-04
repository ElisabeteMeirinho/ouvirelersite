
import { auth, signInAnonymously } from "./firebase.js";

signInAnonymously(auth)
  .then(() => {
    console.log("Ouvir & Ler conectado ao Firebase!");
  })
  .catch((error) => {
    console.error("Erro na autenticação:", error);
  });
