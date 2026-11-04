# Ouvir & Ler — publicação

Este pacote preserva o projeto Expo, servidor e site. Corrige a logo do site e do app e a quebra de linha do slogan no app.

## Publicar o site
1. Crie um repositório novo no GitHub.
2. Envie o conteúdo desta pasta (não o ZIP fechado).
3. Settings > Pages > Deploy from a branch > main > /docs > Save.
4. Aguarde o GitHub Pages disponibilizar o endereço.

## Aplicativo
Na pasta app, execute `npm install` e depois `eas build -p android --profile preview` para gerar uma APK atualizada.

## Importante
A publicação no GitHub Pages exibe a interface do site; a transcrição e a sincronização reais dependem de configuração dos serviços do projeto. Não envie arquivos `.env` com credenciais.
