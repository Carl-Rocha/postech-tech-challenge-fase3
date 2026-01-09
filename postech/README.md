# Byte Bank (Expo + Firebase)

Aplicativo mobile de gerenciamento financeiro com login, cadastro, extrato de transacoes, filtros e anexos.

## Funcionalidades

- Autenticacao com Firebase (login, cadastro e recuperar senha)
- Listagem de transacoes com filtros e paginacao
- Adicionar e editar transacoes
- Anexos salvos como base64 no Firestore

## Requisitos

- Node.js 18+
- NPM 9+
- Expo CLI (via `npx`)
- Android Studio (para emulador) ou dispositivo fisico

## Dependencias

```bash
npm install
```

## Configuracao do Firebase

A integracao com Firebase (Auth + Firestore) ja esta configurada no projeto. Se precisar ajustar as chaves:

- Arquivo: `postech/app.json`
- Secao: `expo.extra.firebase`

O bloco ja esta preenchido no arquivo do projeto.

## Rodando o app

```bash
npx expo start
```

Android (porta fixa):

```bash
npm run start:android
```

## Observacoes

- As transacoes sao salvas no Firestore com `userId`.
- Anexos sao armazenados como base64 no Firestore (sem Storage).
