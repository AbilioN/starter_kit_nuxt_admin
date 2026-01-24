# Comportamento Inteligente do Scroll

## Visão Geral

O sistema de chat implementa um comportamento inteligente de scroll que melhora significativamente a experiência do usuário ao receber mensagens em tempo real.

## Como Funciona

### **Scroll Automático Inteligente** 🧠

O sistema **NÃO** força o scroll para baixo sempre que uma nova mensagem chega. Em vez disso, ele:

1. **Verifica a posição atual** do scroll
2. **Decide se deve fazer scroll automático** baseado no comportamento do usuário
3. **Mantém a posição** quando o usuário está lendo mensagens antigas
4. **Faz scroll automático** apenas quando apropriado

### **Lógica de Decisão** 📊

```typescript
const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
```

- **`isNearBottom = true`**: Usuário está próximo do final → **Scroll automático**
- **`isNearBottom = false`**: Usuário está lendo mensagens antigas → **Mantém posição**

### **Tolerância de 100px** 📏

O sistema considera que o usuário está "próximo do final" se estiver a 100 pixels ou menos do final da conversa. Isso evita scrolls desnecessários quando o usuário está quase no final.

## Cenários de Uso

### **1. Usuário no Final da Conversa** ✅
```
┌─────────────────────────────────────┐
│ Mensagem antiga 1                   │
│ Mensagem antiga 2                   │
│ Mensagem antiga 3                   │
│ Mensagem antiga 4                   │
│ Mensagem antiga 5                   │
│ Nova mensagem ← Usuário aqui        │
└─────────────────────────────────────┘
```
**Resultado**: Scroll automático para mostrar a nova mensagem

### **2. Usuário Lendo Mensagens Antigas** ✅
```
┌─────────────────────────────────────┐
│ Mensagem antiga 1                   │
│ Mensagem antiga 2 ← Usuário aqui    │
│ Mensagem antiga 3                   │
│ Mensagem antiga 4                   │
│ Mensagem antiga 5                   │
│ Nova mensagem (não visível)         │
└─────────────────────────────────────┘
```
**Resultado**: Mantém posição, mostra indicador de nova mensagem

### **3. Usuário no Meio da Conversa** ✅
```
┌─────────────────────────────────────┐
│ Mensagem antiga 1                   │
│ Mensagem antiga 2                   │
│ Mensagem antiga 3 ← Usuário aqui    │
│ Mensagem antiga 4                   │
│ Mensagem antiga 5                   │
│ Nova mensagem (não visível)         │
└─────────────────────────────────────┘
```
**Resultado**: Mantém posição, mostra indicador de nova mensagem

## Indicador de Nova Mensagem

### **Quando Aparece** 🔔
- Usuário **NÃO** está no final da conversa
- Nova mensagem chega via Pusher
- Usuário está lendo mensagens antigas

### **Como Funciona** ⚡
```vue
<div v-if="showNewMessageBtn" class="new-message-indicator">
  <v-btn @click="scrollToBottom; showNewMessageBtn = false">
    <v-icon>mdi-arrow-down</v-icon>
    Nova mensagem
  </v-btn>
</div>
```

### **Comportamento** 🎯
1. **Aparece** com animação suave
2. **Permite scroll manual** para o final
3. **Desaparece** automaticamente após o clique
4. **Esconde** quando usuário faz scroll manual

## Implementação Técnica

### **Evento Personalizado** 📡
```typescript
window.dispatchEvent(new CustomEvent('check-scroll-position', {
  detail: { 
    chatId: event.chat_id,
    messageId: event.id,
    shouldAutoScroll: true
  }
}));
```

### **Listener Inteligente** 🎧
```typescript
const handleScrollCheck = (event: Event) => {
  const customEvent = event as CustomEvent;
  const { shouldAutoScroll } = customEvent.detail;
  
  const container = messagesContainer.value;
  const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
  
  if (isNearBottom && shouldAutoScroll) {
    scrollToBottom(); // Scroll automático
  } else if (shouldAutoScroll) {
    showNewMessageIndicator(); // Mostra indicador
  }
};
```

### **Controle de Estado** 🎛️
```typescript
const showNewMessageBtn = ref(false);

const showNewMessageIndicator = () => {
  showNewMessageBtn.value = true;
};

const handleScroll = () => {
  if (showNewMessageBtn.value) {
    showNewMessageBtn.value = false;
  }
};
```

## Benefícios

### **Para o Usuário** 👤
- **Controle total** sobre a posição do scroll
- **Não perde o lugar** ao ler mensagens antigas
- **Indicador visual** quando há novas mensagens
- **Scroll automático** quando apropriado

### **Para a Experiência** 🎯
- **Mais natural** e intuitivo
- **Menos intrusivo** que scroll forçado
- **Preserva contexto** da conversa
- **Facilita navegação** em conversas longas

## Configuração

### **Tolerância de Scroll** ⚙️
```typescript
const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100;
```
- **100px**: Padrão (recomendado)
- **50px**: Mais restritivo
- **200px**: Mais permissivo

### **Personalização** 🎨
```css
.new-message-indicator {
  position: absolute;
  bottom: 80px;
  right: 20px;
  z-index: 1000;
  animation: slideInUp 0.3s ease-out;
}
```

## Testando

### **1. Teste de Scroll Automático** 🧪
1. Vá para o final da conversa
2. Aguarde nova mensagem
3. **Resultado esperado**: Scroll automático

### **2. Teste de Preservação de Posição** 🧪
1. Vá para o meio da conversa
2. Aguarde nova mensagem
3. **Resultado esperado**: Posição mantida, indicador aparece

### **3. Teste do Indicador** 🧪
1. Posicione-se no meio da conversa
2. Aguarde nova mensagem
3. Clique no indicador "Nova mensagem"
4. **Resultado esperado**: Scroll para o final

## Troubleshooting

### **Problemas Comuns** 🔧

#### **1. Scroll sempre automático**
- Verificar se `isNearBottom` está sendo calculado corretamente
- Verificar se o container tem altura correta

#### **2. Indicador não aparece**
- Verificar se `showNewMessageBtn.value` está sendo definido
- Verificar se o CSS está correto

#### **3. Scroll não funciona**
- Verificar se `messagesContainer.value` existe
- Verificar se a função `scrollToBottom` está funcionando

### **Logs de Debug** 📝
```typescript
console.log('📜 Verificando posição do scroll:', {
  scrollTop: container.scrollTop,
  clientHeight: container.clientHeight,
  scrollHeight: container.scrollHeight,
  isNearBottom,
  shouldAutoScroll
});
```

## Futuras Melhorias

### **Funcionalidades Planejadas** 🚀
- **Contador de mensagens** não lidas
- **Notificação sonora** para novas mensagens
- **Scroll suave** com animação
- **Preferências do usuário** para comportamento do scroll

### **Otimizações** ⚡
- **Debounce** no evento de scroll
- **Throttling** para verificações de posição
- **Cache** de posições de scroll
- **Lazy loading** de mensagens antigas

---

**Sistema desenvolvido para proporcionar a melhor experiência possível ao usuário!** 🎉
