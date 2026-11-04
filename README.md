# Ouvir & Ler

Projeto de app + site para transformar conversas presenciais em um chat acessível, identificando cada participante pelo celular usado para falar.

## Estrutura

- `app/` — aplicativo Expo/React Native para iOS e Android.
- `server/` — API Node para transcrição de áudio e ajuste de texto com IA.
- `site/` — landing page estática explicando o propósito do projeto.
- `shared/assets/logo.svg` — marca vetorial em fundo bege.

## Experiência principal

1. Uma pessoa cria ou informa o código da sala.
2. Cada participante entra com o próprio nome.
3. O celular pode ficar em **Modo Ouvinte** ou **Vou falar**.
4. No modo de fala, o microfone daquele celular grava o trecho e o envia para transcrição.
5. Como cada aparelho já está associado a um participante, o chat sabe quem falou sem depender de reconhecimento de voz.
6. A IA pode corrigir pontuação e erros óbvios da transcrição usando as últimas mensagens como contexto, mas deve preservar o significado.
7. Todos os celulares na sala recebem as mensagens sincronizadas pelo Firebase Realtime Database.

## Demonstração sem configuração

O app abre com mensagens de exemplo mesmo sem Firebase ou servidor. Isso permite visualizar as telas e alternar entre Ouvinte e Participante. Ao tentar enviar uma fala sem API configurada, ele usa uma mensagem demonstrativa.

## Rodar o site

Abra `site/index.html` no navegador ou publique a pasta `site` no Netlify/Vercel/GitHub Pages.

## Rodar o app

```bash
cd app
npm install
cp .env.example .env
npx expo start
```

Para testar em celulares diferentes, use o mesmo código de sala e configure as mesmas credenciais Firebase em todos.

## Rodar o servidor de IA

```bash
cd server
npm install
cp .env.example .env
# preencha OPENAI_API_KEY
npm run dev
```

No `.env` do app, `EXPO_PUBLIC_API_URL` deve apontar para o endereço do servidor que o celular consegue alcançar. Em testes na mesma rede Wi‑Fi, use o IP local do computador em vez de `localhost`.

## Firebase Realtime Database

Crie um projeto Firebase e um Realtime Database. Preencha as variáveis do `app/.env`. Para protótipo, o app grava em:

```text
rooms/{roomId}/participants/{participantId}
rooms/{roomId}/messages/{messageId}
```

**Importante:** não publique com regras abertas. Antes de produção, adicione Firebase Authentication (inclusive login anônimo) e regras que permitam acesso somente aos participantes autorizados da sala.

## Privacidade e acessibilidade

Para produção, inclua consentimento claro de gravação/transcrição, opção de apagar a sala, retenção curta por padrão e indicador visível quando o microfone estiver ativo. Evite salvar áudio depois da transcrição, salvo se o usuário optar explicitamente por isso.

## Próxima evolução técnica

O MVP atual envia trechos após a pessoa tocar para concluir a fala. Uma evolução natural é usar streaming de áudio + transcrição em tempo real para reduzir a latência. Também pode haver QR Code para entrar na sala, histórico opcional, tradução, modo alto contraste, vibração para nova fala e integração com aparelhos auditivos/Bluetooth.
