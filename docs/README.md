# Documentação do Sistema de Chat

## Visão Geral

Este projeto implementa um sistema de chat completo com funcionalidades em tempo real usando **Nuxt.js** para o frontend web e **Laravel** para o backend. O sistema inclui integração com **Pusher** para comunicação em tempo real.

## Estrutura do Projeto

```
letsjamadmin/
├── components/           # Componentes Vue.js
│   └── ChatInterface.vue # Interface principal do chat
├── composables/          # Composables Vue.js
│   └── useChatManager.ts # Gerenciador de estado do chat
├── services/             # Camada de serviço
│   └── ChatService.ts    # Lógica de negócio do chat
├── infrastructure/       # Camada de infraestrutura
│   ├── repositories/     # Repositórios de dados
│   │   └── ChatRepository.ts
│   └── http/            # Cliente HTTP
│       └── ApiClient.ts
├── types/               # Definições de tipos TypeScript
│   ├── chat.d.ts       # Tipos do chat
│   └── pusher.d.ts     # Tipos do Pusher
├── config/              # Configurações
│   ├── api.ts          # Configuração da API
│   ├── pusher.ts       # Configuração do Pusher
│   └── pusher-events.ts # Eventos do Pusher
├── plugins/             # Plugins Nuxt.js
│   └── echo.client.ts  # Plugin do Laravel Echo
└── docs/               # Documentação
    ├── README.md       # Este arquivo
    ├── PUSHER_INTEGRATION.md
    └── PUSHER_CONFIGURATION.md
```

## Funcionalidades Principais

### 🚀 Chat em Tempo Real
- **Criação de chats** privados e em grupo
- **Envio de mensagens** instantâneo
- **Recebimento automático** de novas mensagens via Pusher
- **Indicadores de status** (online/offline, digitando)
- **Histórico de mensagens** com paginação

### 🔐 Autenticação e Segurança
- **Sistema de login** com tokens JWT
- **Canais seguros** para mensagens privadas
- **Validação de permissões** por usuário

### 📱 Multiplataforma
- **Frontend Web** (Nuxt.js + Vue.js)
- **Backend API** (Laravel)
- **Mobile** (Flutter - compatível)

## Tecnologias Utilizadas

### Frontend
- **Nuxt.js 3** - Framework Vue.js
- **Vue.js 3** - Framework de UI
- **Vuetify 3** - Componentes de UI
- **TypeScript** - Tipagem estática
- **Pusher-JS** - Cliente Pusher para web

### Backend
- **Laravel** - Framework PHP
- **Pusher** - Serviço de WebSockets
- **MySQL/PostgreSQL** - Banco de dados
- **Redis** - Cache e sessões

### Mobile
- **Flutter** - Framework mobile
- **Pusher Channels Flutter** - Cliente Pusher para mobile

## Configuração Rápida

### 1. Instalação de Dependências
```bash
npm install
```

### 2. Configuração do Ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Configurar variáveis do Pusher
PUSHER_APP_KEY=b395ac035994ca7af583
PUSHER_APP_CLUSTER=eu
PUSHER_APP_ID=1553073
PUSHER_APP_SECRET=8a20e39fc3f1ab6111af
```

### 3. Executar o Projeto
```bash
npm run dev
```

## Documentação Detalhada

### 📚 Chat e Mensagens
- [**PUSHER_INTEGRATION.md**](./PUSHER_INTEGRATION.md) - Integração completa com Pusher
- [**PUSHER_CONFIGURATION.md**](./PUSHER_CONFIGURATION.md) - Configuração detalhada do Pusher

### 🔧 Desenvolvimento
- [**API Reference**](./API_REFERENCE.md) - Documentação da API
- [**Component Development**](./COMPONENT_DEVELOPMENT.md) - Guia de desenvolvimento de componentes

## Arquitetura do Sistema

### Camadas da Aplicação

```
┌─────────────────────────────────────┐
│           UI Layer                  │
│     (ChatInterface.vue)            │
├─────────────────────────────────────┤
│        Composable Layer             │
│     (useChatManager.ts)            │
├─────────────────────────────────────┤
│         Service Layer               │
│      (ChatService.ts)              │
├─────────────────────────────────────┤
│      Repository Layer               │
│   (ChatRepository.ts)              │
├─────────────────────────────────────┤
│        HTTP Layer                   │
│      (ApiClient.ts)                │
├─────────────────────────────────────┤
│         API Layer                   │
│        (Laravel)                   │
└─────────────────────────────────────┘
```

### Fluxo de Dados

1. **UI** → **Composable** → **Service** → **Repository** → **API**
2. **Pusher** → **Composable** → **UI** (tempo real)
3. **API** → **Repository** → **Service** → **Composable** → **UI**

## Funcionalidades do Chat

### Tipos de Chat
- **Chat Privado**: Entre dois usuários
- **Chat em Grupo**: Múltiplos participantes
- **Canais Públicos**: Para comunicação geral

### Recursos de Mensagem
- **Texto**: Mensagens de texto simples
- **Formatação**: Suporte a markdown (futuro)
- **Arquivos**: Upload de imagens e documentos (futuro)
- **Emojis**: Suporte a emojis nativos

### Recursos de Usuário
- **Status Online**: Indicador de presença
- **Digitação**: Indicador "digitando..."
- **Notificações**: Push notifications (futuro)
- **Perfil**: Avatar e informações do usuário

## Configuração do Pusher

### Credenciais
```typescript
appId: '1553073',
appKey: 'b395ac035994ca7af583',
appSecret: '8a20e39fc3f1ab6111af',
cluster: 'eu'
```

### Canais
- **`chat.{chatId}`**: Canal principal para mensagens
- **`private-user.{userId}`**: Canal privado do usuário
- **`public-users`**: Canal público para status

### Eventos
- **`MessageSent`**: Nova mensagem enviada
- **`MessageRead`**: Mensagem marcada como lida
- **`UserTyping`**: Usuário digitando

## Desenvolvimento

### Estrutura de Arquivos
- **Componentes**: `components/`
- **Composables**: `composables/`
- **Serviços**: `services/`
- **Repositórios**: `infrastructure/repositories/`
- **Tipos**: `types/`
- **Configurações**: `config/`

### Convenções de Nomenclatura
- **Componentes**: PascalCase (ex: `ChatInterface.vue`)
- **Composables**: camelCase com prefixo `use` (ex: `useChatManager.ts`)
- **Serviços**: PascalCase com sufixo `Service` (ex: `ChatService.ts`)
- **Repositórios**: PascalCase com sufixo `Repository` (ex: `ChatRepository.ts`)
- **Tipos**: PascalCase (ex: `ChatMessage`, `PusherEvent`)

### Padrões de Código
- **TypeScript**: Tipagem estática para todos os arquivos
- **Composables**: Lógica reutilizável com `ref`, `computed`, `watch`
- **Serviços**: Lógica de negócio separada da UI
- **Repositórios**: Acesso a dados e APIs externas

## Testes

### Executar Testes
```bash
# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes E2E
npm run test:e2e
```

### Cobertura de Testes
- **Componentes**: Testes de renderização e interação
- **Composables**: Testes de lógica de estado
- **Serviços**: Testes de lógica de negócio
- **Repositórios**: Testes de chamadas de API

## Deploy

### Ambiente de Produção
```bash
# Build de produção
npm run build

# Preview da build
npm run preview

# Deploy
npm run deploy
```

### Configurações de Produção
- **Pusher**: Cluster de produção
- **API**: URL de produção
- **SSL**: Certificados válidos
- **CDN**: Assets otimizados

## Contribuição

### Como Contribuir
1. **Fork** o repositório
2. **Crie** uma branch para sua feature
3. **Desenvolva** seguindo os padrões
4. **Teste** suas alterações
5. **Submeta** um Pull Request

### Padrões de Commit
```
feat: adiciona nova funcionalidade
fix: corrige bug
docs: atualiza documentação
style: formatação de código
refactor: refatoração de código
test: adiciona ou corrige testes
chore: tarefas de manutenção
```

## Suporte

### Canais de Suporte
- **Issues**: GitHub Issues
- **Documentação**: Este diretório
- **Chat**: Sistema interno de chat

### Recursos Úteis
- [**Nuxt.js Documentation**](https://nuxt.com/docs)
- [**Vue.js Documentation**](https://vuejs.org/guide/)
- [**Pusher Documentation**](https://pusher.com/docs)
- [**Laravel Documentation**](https://laravel.com/docs)

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Desenvolvido com ❤️ pela equipe LetsJam**
