# Ouvir & Ler — Plano de Produto V2

## Missão
Permitir que uma pessoa com perda auditiva parcial ou total acompanhe conversas presenciais como um chat, especialmente em ambientes com ruído e várias pessoas.

## Fluxo principal
1. Criar sala com código.
2. Cada participante entra com o próprio nome.
3. Escolher `Ouvinte` ou `Vou falar`.
4. Cada celular que está no modo fala funciona como uma fonte identificada de áudio.
5. O servidor transcreve a fala.
6. A camada de IA usa somente o contexto recente para melhorar legibilidade.
7. O chat distribui a mensagem para todos os aparelhos da sala.
8. O ouvinte pode aumentar fonte, usar alto contraste e rever a conversa.

## O que já existe no protótipo
- App Expo/React Native.
- Site institucional.
- Backend Node/Express.
- Sala compartilhada.
- Identificação por participante/aparelho.
- Modos Ouvinte e Participante.
- Chat.
- Gravação.
- Transcrição via backend.
- Contexto recente para ajuste de escrita.
- Preservação da transcrição original.
- Firebase Realtime Database preparado.
- Modo demonstração.

## Evolução prioritária
### P0 — tornar utilizável entre dois celulares
- Firebase Authentication anônimo.
- Regras privadas por sala.
- Entrada por código e QR Code.
- Presença online/offline.
- Indicador permanente de microfone.
- Consentimento de gravação.
- Exclusão automática do áudio depois da transcrição.

### P1 — experiência realmente em tempo real
- Streaming do microfone.
- Texto parcial enquanto a pessoa fala.
- Atualização da mesma mensagem até a frase ficar final.
- Latência visível e recuperação automática de conexão.
- Fila local quando a internet oscilar.

### P1 — ambientes barulhentos
- Captura do microfone próximo de cada participante.
- Testes com restaurante, TV, música e várias conversas.
- Supressão de ruído antes da transcrição quando disponível.
- Detecção de silêncio para evitar envio desnecessário.
- Aviso de “não entendi bem” quando a confiança for baixa, em vez de inventar texto.

### P1 — acessibilidade
- Fonte pequena/média/grande/extra grande.
- Alto contraste.
- Destaque da fala mais recente.
- Vibração opcional em nova fala.
- Rolagem automática que pode ser pausada.
- Botão “repetir/mostrar original”.
- Compatibilidade com leitor de tela.
- Botões grandes e áreas de toque acessíveis.

### P2 — recursos adicionais
- Tradução opcional.
- Histórico somente com consentimento.
- Favoritar uma fala.
- Resumo pós-conversa opcional e separado da transcrição ao vivo.
- Perfil com preferências de acessibilidade.
- Convite por link.
- Aplicativo para relógio como alerta visual, no futuro.

## Regra central da IA
A IA não deve “embelezar” a conversa. Ela pode corrigir pontuação, concordância óbvia e uma palavra provavelmente reconhecida errado quando o contexto sustentar a correção. Em caso de dúvida, deve preservar o texto original ou sinalizar baixa confiança.

## Privacidade
Áudio é dado sensível no contexto de uma conversa. A versão de produção deve ter consentimento explícito, comunicação visual de microfone ativo, retenção mínima, exclusão fácil, regras de acesso por sala e política de privacidade clara.

## Arquitetura sugerida
Celular do participante → captura de áudio → API segura → transcrição → ajuste opcional de clareza → banco em tempo real → celulares ouvintes.

A chave da API fica somente no servidor. O app nunca deve conter segredo de API.
