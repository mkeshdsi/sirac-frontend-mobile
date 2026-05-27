# Deploy na Google Play Store - Agente mkesh

Este guia explica como gerar o AAB, preencher o Google Play Console e publicar a app **Agente mkesh**.

## Estado atual

- App: `Agente mkesh`
- Package name Android: `com.sirac.app`
- Versao: `1.0.0`
- EAS account atual: `emabecuane`
- EAS project: `@emabecuane/sirac`
- EAS project ID: `5359f0b9-c61f-4c70-9f90-d28bcdd89e45`
- Canal EAS Update: `production`
- Runtime version: `exposdk:54.0.0`
- Tipo exigido pela Google Play: `.aab`

## AAB atualizado

Build AAB atualizado para upload na Google Play:

https://expo.dev/artifacts/eas/eeEgUjvQuZfn3RCsLVERgD.aab

Pagina do build no EAS:

https://expo.dev/accounts/emabecuane/projects/sirac/builds/6b2f0f13-3c6c-472f-b372-3559b7918aaf

Data do build: 2026-05-27

APK atualizado para instalacao direta fora da Play Store:

https://expo.dev/accounts/emabecuane/projects/sirac/builds/03ab7d44-9257-4c5d-a721-a33724302406

Observacao: o AAB atual foi gerado com `versionCode 2`, incrementado automaticamente pelo EAS.

## Antes de publicar

Confirme que esta tudo limpo e que o TypeScript passa:

```bash
cd sirac-frontend-mobile
npx tsc --noEmit
git status --short
```

Confirme a conta EAS:

```bash
npx eas-cli whoami
```

Deve mostrar:

```text
emabecuane
juniormabecuane7@gmail.com
```

## Gerar novo AAB

Use este comando sempre que precisar enviar uma nova versao para a Google Play:

```bash
npx eas-cli build --profile production --platform android --non-interactive
```

O perfil `production` em `eas.json` ja gera `app-bundle`, que e o formato `.aab` exigido pela Google Play.

O perfil `production` tambem usa `autoIncrement: true`. Isto e importante porque a Google Play so aceita uma atualizacao quando o novo AAB tem `versionCode` maior que o AAB anterior.

Se quiser gerar APK para instalacao direta fora da Play Store:

```bash
npx eas-cli build --profile apk --platform android --non-interactive
```

## Variaveis de ambiente no EAS

No projeto EAS novo devem existir estas variaveis no ambiente `production`:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

Para listar:

```bash
npx eas-cli env:list --environment production
```

Para recriar a variavel da API:

```bash
npx eas-cli env:create production --name EXPO_PUBLIC_API_BASE_URL --value http://41.220.193.110 --visibility plaintext --scope project --force --non-interactive
```

Para a chave do Google Maps, use `sensitive` e nao coloque a chave em ficheiros versionados:

```bash
npx eas-cli env:create production --name EXPO_PUBLIC_GOOGLE_MAPS_API_KEY --value SUA_CHAVE --visibility sensitive --scope project --force --non-interactive
```

## Criar app no Google Play Console

Entre em:

https://play.google.com/console

Depois:

1. Clique em `Create app`.
2. Preencha:
   - App name: `Agente mkesh`
   - Default language: `Portuguese`
   - App or game: `App`
   - Free or paid: `Free` se nao houver cobranca.
3. Aceite as declaracoes iniciais da Google Play.

## Dados da ficha da loja

Preencha em `Store presence > Main store listing`.

Sugestao de preenchimento:

### App name

```text
Agente mkesh
```

### Short description

```text
App para registo e gestao de agentes mkesh em campo.
```

### Full description

```text
Agente mkesh e uma aplicacao para apoiar equipas de campo no registo, validacao e acompanhamento de agentes, parceiros e dados comerciais.

A app permite iniciar sessao por contacto Tmcel, preencher formularios operacionais, anexar documentos, capturar localizacao quando necessario e submeter informacao para processamento interno.

O acesso e restrito a utilizadores autorizados.
```

### App category

Sugestao:

```text
Business
```

### Contact details

Preencha com os contactos oficiais da organizacao:

- Email de suporte
- Website, se existir
- Telefone, se existir

### Privacy Policy

A Google Play normalmente exige uma URL publica de Politica de Privacidade, especialmente porque a app usa camera, localizacao e documentos.

Coloque uma URL HTTPS publica, por exemplo:

```text
https://SEU-DOMINIO/politica-de-privacidade
```

Se ainda nao existir, crie uma pagina simples explicando:

- Que dados sao recolhidos.
- Por que sao recolhidos.
- Quem pode aceder aos dados.
- Como os dados sao protegidos.
- Como o utilizador pode pedir correcao/remocao.
- Contacto de suporte.

## Assets exigidos pela Google Play

Prepare estes ficheiros:

- App icon: `512x512 PNG`
- Feature graphic: `1024x500 PNG/JPG`
- Screenshots de telefone Android: pelo menos 2
- Opcional: screenshots tablet

Icones atuais do projeto:

- `assets/logomkesh-icon.png`
- `assets/logomkesh-adaptive-icon.png`
- Fonte original: `assets/logomkesh.jpg`

Observacao: a Google Play pede icone de loja em 512x512. Se necessario, redimensione `assets/logomkesh-icon.png` para 512x512.

## App Content no Play Console

Preencha em `Policy and programs > App content`.

### Privacy policy

Use a URL da Politica de Privacidade.

### Ads

Se a app nao mostra publicidade:

```text
No, my app does not contain ads.
```

### App access

Como a app exige login, informe que ha acesso restrito.

Sugestao:

```text
All or some functionality is restricted.
```

Forneca uma conta de teste para revisao da Google, se solicitado:

```text
Contacto Tmcel de teste: 82xxxxxxx
Password: ********
Notas: usar ambiente de producao/teste conforme configurado no backend.
```

Nao coloque credenciais reais neste ficheiro. Preencha apenas no Play Console.

### Content rating

Responda o questionario como app de negocio/produtividade sem conteudo sensivel para criancas, violencia, apostas ou conteudo adulto, se aplicavel.

### Target audience

Sugestao:

```text
18+
```

Marque que a app nao e direcionada a criancas.

### Data safety

Declare os dados conforme uso real da app.

Dados que a app pode tratar:

- Nome
- Contacto/MSISDN
- Email cadastral, se usado em formularios administrativos
- BI/identificacao
- NUIT
- Documentos/imagens anexadas
- Localizacao da banca/parceiro quando capturada
- Dados de login/autenticacao

Finalidade:

- Funcionalidade da app
- Gestao de contas
- Operacoes internas
- Prevencao de fraude/seguranca, se aplicavel

Partilha com terceiros:

- Declare apenas se houver partilha real com servicos externos.
- Google Maps pode ser usado para mapas/localizacao.
- Backend/API interna recebe os dados submetidos.

### Permissions declaration

A app usa permissoes Android:

- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `CAMERA`
- `READ_MEDIA_IMAGES`
- `READ_EXTERNAL_STORAGE`

Justificacoes sugeridas:

```text
Location is used to capture the position of a banca or commercial point during field registration.
```

```text
Camera is used to capture required documents and images during agent or partner registration.
```

```text
Photo/media access is used to attach existing document images selected by the user.
```

## Upload do AAB

Para primeira publicacao, use primeiro teste interno ou fechado.

No Play Console:

1. Abra a app `Agente mkesh`.
2. Va para `Testing > Internal testing`.
3. Clique em `Create new release`.
4. Faca upload do `.aab`:

```text
https://expo.dev/artifacts/eas/eeEgUjvQuZfn3RCsLVERgD.aab
```

5. Preencha release notes.
6. Clique em `Review release`.
7. Corrija avisos obrigatorios, se aparecerem.
8. Clique em `Start rollout to Internal testing`.

Sugestao de release notes:

```text
Primeira versao Android do Agente mkesh para testes internos.
Inclui login por contacto Tmcel, registo operacional, anexos de documentos e suporte a localizacao.
```

## Testadores

Em `Testing > Internal testing > Testers`:

1. Crie uma lista de emails.
2. Adicione contas Google dos testadores.
3. Copie o link de opt-in.
4. Envie o link aos testadores.

Para contas Google Play Developer pessoais novas, a Google pode exigir teste fechado com pelo menos 12 testadores por 14 dias antes de liberar producao. Verifique o estado da sua conta no Play Console.

## Publicar em producao

Depois dos testes:

1. Va para `Production`.
2. Clique em `Create new release`.
3. Faca upload de um AAB novo ou promova o release testado.
4. Revise warnings e politicas.
5. Clique em `Send for review`.

A revisao da Google pode demorar de horas a dias, especialmente na primeira publicacao.

## Atualizacoes futuras

A Google Play so mostra uma nova atualizacao para os utilizadores quando:

- um novo AAB e enviado no Play Console;
- o novo AAB tem `versionCode` maior;
- a release e aprovada pela Google;
- a release e publicada em producao ou promovida para a faixa usada pelos utilizadores.

Se publicar apenas uma OTA pelo EAS Update, a Play Store nao mostra o botao `Atualizar`. Nesse caso, a app instalada baixa a atualizacao internamente ao abrir, desde que esteja no mesmo canal/runtime.

Para alteracoes nativas, como:

- icone do APK
- nome instalado
- package name
- permissoes Android
- plugins nativos

gere novo AAB:

```bash
npx eas-cli build --profile production --platform android --non-interactive
```

Para alteracoes JavaScript/React Native que nao mudam nativo, pode publicar OTA:

```bash
npx eas-cli update --branch production --environment production --platform android --message "Descricao da atualizacao"
```

Importante: a OTA nao altera icone, nome instalado, permissoes ou package name.

## Submeter via EAS Submit

Depois que a app existir no Play Console, tambem pode usar:

```bash
npx eas-cli submit --platform android
```

Para isso, configure uma Google Service Account no Google Cloud/Play Console e forneca o JSON ao EAS Submit.

## Links oficiais

- Google Play Console: https://play.google.com/console
- Preparar e publicar release: https://support.google.com/googleplay/android-developer/answer/9859348
- Expo EAS Submit Android: https://docs.expo.dev/submit/android/
- Expo EAS Build: https://docs.expo.dev/build/introduction/
