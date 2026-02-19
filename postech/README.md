# Byte Bank (Expo + Firebase)

Aplicativo mobile de gerenciamento financeiro com autenticacao, extrato, filtros e anexos.

## Tecnologias utilizadas

- React Native + Expo + Expo Router
- TypeScript
- Firebase Auth + Firestore
- AsyncStorage
- Formik + Yup
- CryptoJS (AES para criptografia de anexos sensiveis)

## Arquitetura (Fase 4)

- `app/` e `hooks/`: camada de apresentacao.
- `application/usecases/`: casos de uso da aplicacao.
- `domain/repositories/`: contratos de dominio.
- `infrastructure/repositories/`: implementacao Firebase dos contratos.
- State management com Context API + hooks customizados.
- Sinal reativo de atualizacao via assinatura em tempo real do Firestore.

## Funcionalidades

- Login, cadastro e recuperacao de senha com Firebase Auth.
- Listagem paginada de transacoes com filtros.
- Resumo financeiro (saldo, receitas e despesas).
- Criacao e edicao de transacoes.
- Upload de imagem/PDF como anexo.
- Criptografia AES de anexos antes de persistir no Firestore.

## Requisitos

- Node.js 18+
- npm 9+
- Android Studio (emulador) ou dispositivo fisico

## Instalacao

```bash
npm install
```

## Configuracao

Arquivo de configuracao principal: `app.json`

- Firebase: `expo.extra.firebase`
- Chave de criptografia de anexos: `EXPO_PUBLIC_ATTACHMENT_ENCRYPTION_KEY`
- O repositório ja inclui `.env` para avaliacao.

PowerShell (sessao atual):

```powershell
$env:EXPO_PUBLIC_ATTACHMENT_ENCRYPTION_KEY="sua-chave-forte-aqui"
```
Sem essa variavel o app nao inicializa a camada de criptografia.
Para avaliacao do professor, basta usar o `.env` versionado e rodar o projeto.

## Como rodar

```bash
npm run start
```

Android:

```bash
npm run start:android
```

Web:

```bash
npm run web
```

## Scripts

- `npm run start`: inicia o Metro/Expo.
- `npm run start:android`: inicia no Android com porta fixa.
- `npm run android`: build/run nativo Android.
- `npm run ios`: build/run nativo iOS.
- `npm run web`: execucao web.
- `npm run server`: json-server local.
- `npm run server:android`: json-server acessivel em rede local.

## Observacoes

- As transacoes sao segregadas por `userId`.
- Anexos sao armazenados criptografados no Firestore (sem Firebase Storage).
- Defina uma chave forte de criptografia para ambiente real.
