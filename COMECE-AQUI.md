# Comece aqui

## 1. Ver o site
Abra `site/index.html` no navegador.

## 2. Ver o app
No terminal:
```bash
cd app
npm install
npx expo start
```
O protótipo possui modo de demonstração.

## 3. Ligar dois celulares de verdade
Configure o Firebase usando `app/.env.example`. Os dois aparelhos devem entrar com o mesmo código de sala.

## 4. Ligar a IA
No servidor:
```bash
cd server
npm install
cp .env.example .env
npm run dev
```
Preencha a chave somente no `.env` do servidor e configure `EXPO_PUBLIC_API_URL` no app.

## 5. Antes de testar em uma conversa real
Implemente autenticação/regras privadas e mostre consentimento de gravação para todos os participantes.
