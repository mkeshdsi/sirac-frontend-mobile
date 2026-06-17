# Guia de OTA: Pilot para Production

Este guia explica como publicar atualizacoes OTA no EAS para o app mobile SIRAC.

## Quando usar OTA

Use OTA para alteracoes de JavaScript/React Native, como:

- textos e labels;
- regras de exibicao;
- ajustes de layout;
- pequenas correcoes em telas;
- validacoes e fluxos que nao alteram codigo nativo.

Nao use OTA quando a alteracao exigir novo APK/AAB, por exemplo:

- novas permissoes Android;
- novas bibliotecas nativas;
- mudancas em plugins nativos;
- alteracao de runtime/SDK;
- mudancas em package name, icone nativo ou splash nativo.

## Pasta do projeto

Execute os comandos dentro da pasta do mobile:

```bash
cd C:\Workspace\2026\sirac\sirac-frontend-mobile
```

## 1. Confirmar canais atuais

```bash
npx eas-cli channel:list --non-interactive
```

Deve aparecer algo parecido com:

```text
Channel: pilot
Branch: pilot

Channel: production
Branch: production
```

## 2. Publicar primeiro no pilot

Depois de fazer e validar uma alteracao local, publique no canal de testes internos:

```bash
npx eas-cli update --branch pilot --environment production --platform android --message "Mensagem da alteracao"
```

Exemplo:

```bash
npx eas-cli update --branch pilot --environment production --platform android --message "Show EWP created partners as active"
```

Depois teste no APK/app ligado ao canal `pilot`.

## 3. Promover para production

Quando o `pilot` estiver aprovado, publique o mesmo estado atual do codigo local para `production`:

```bash
npx eas-cli update --branch production --environment production --platform android --message "Promote pilot updates to production"
```

## 4. Confirmar production

Depois da publicacao, confirme se `production` ficou com a nova OTA:

```bash
npx eas-cli channel:list --non-interactive
```

Procure pelo canal `production` e confirme a mensagem mais recente.

## Regra importante

O comando de `production` nao copia automaticamente a OTA remota do `pilot`.

Ele publica o codigo local atual para a branch `production`.

Antes de promover para producao, confirme que o codigo local e exatamente o mesmo que foi testado e aprovado no `pilot`.

## Comandos uteis

Ver estado do Git:

```bash
git status --short
```

Ver ultimos commits:

```bash
git log -3 --oneline
```

Validar TypeScript:

```bash
npx tsc --noEmit
```

Publicar em pilot:

```bash
npx eas-cli update --branch pilot --environment production --platform android --message "Mensagem da alteracao"
```

Publicar em production:

```bash
npx eas-cli update --branch production --environment production --platform android --message "Promote pilot updates to production"
```

## Resumo rapido

```bash
cd C:\Workspace\2026\sirac\sirac-frontend-mobile
npx tsc --noEmit
npx eas-cli update --branch pilot --environment production --platform android --message "Mensagem da alteracao"
npx eas-cli channel:list --non-interactive
npx eas-cli update --branch production --environment production --platform android --message "Promote pilot updates to production"
npx eas-cli channel:list --non-interactive
```
