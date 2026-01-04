# JSON Server - Configuração

Este projeto utiliza JSON Server para simular uma API REST durante o desenvolvimento.

## Instalação

1. Instale as dependências:
```bash
npm install
```

## Como usar

### 1. Iniciar o JSON Server

Em um terminal separado, execute:

```bash
npm run server
```

Ou para Android Emulator:
```bash
npm run server:android
```

O servidor estará rodando em: `http://localhost:3001`

### 2. Iniciar o app Expo

Em outro terminal, execute:

```bash
npm start
```

## Endpoints disponíveis

- **GET** `/transactions` - Lista todas as transações
- **GET** `/transactions/:id` - Busca uma transação específica
- **POST** `/transactions` - Cria uma nova transação
- **PUT** `/transactions/:id` - Atualiza uma transação
- **DELETE** `/transactions/:id` - Remove uma transação

## Filtros e Query Parameters

O JSON Server suporta os seguintes filtros:

- `_page` - Número da página (para paginação)
- `_limit` - Itens por página
- `_sort` - Campo para ordenação
- `_order` - Ordem (asc ou desc)
- `category` - Filtrar por categoria
- `type` - Filtrar por tipo (income ou expense)
- `date_gte` - Data maior ou igual (formato: YYYY-MM-DD)
- `date_lte` - Data menor ou igual (formato: YYYY-MM-DD)

### Exemplos:

```
GET /transactions?type=expense&category=alimentacao
GET /transactions?_page=1&_limit=20&_sort=date&_order=desc
GET /transactions?date_gte=2024-01-01&date_lte=2024-01-31
```

## Configuração para diferentes ambientes

### Android Emulator
O app está configurado para usar `http://10.0.2.2:3001` automaticamente quando rodando no Android Emulator.

### iOS Simulator
O app usa `http://localhost:3001` quando rodando no iOS Simulator.

### Dispositivo Físico
Se estiver testando em um dispositivo físico, você precisará:

1. Descobrir o IP da sua máquina na rede local
2. Atualizar o arquivo `config/api.ts` com o IP correto
3. Garantir que o dispositivo e a máquina estão na mesma rede
4. Usar o comando `npm run server:android` para permitir conexões externas

## Estrutura dos dados

As transações seguem o seguinte formato:

```json
{
  "id": "string",
  "description": "string",
  "amount": number,
  "type": "income" | "expense",
  "category": "alimentacao" | "transporte" | "saude" | "educacao" | "lazer" | "moradia" | "salario" | "outros",
  "date": "ISO 8601 date string",
  "createdAt": "ISO 8601 date string"
}
```

## Troubleshooting

### Erro de conexão
- Certifique-se de que o JSON Server está rodando
- Verifique se a porta 3001 está disponível
- Para Android, use `npm run server:android` ao invés de `npm run server`

### CORS Issues
O JSON Server não tem problemas de CORS por padrão, mas se encontrar problemas, você pode adicionar um middleware.

### Dados não aparecem
- Verifique se o arquivo `db.json` existe na raiz do projeto
- Confirme que o servidor está rodando na porta correta
- Verifique o console do app para erros de rede

