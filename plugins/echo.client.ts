import Pusher from 'pusher-js';
import { getPusherConfig } from '~/config/pusher';

// Declaração do tipo para window.Pusher
declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

export default defineNuxtPlugin(() => {
  console.log('🔌 Plugin Pusher iniciando...');

  // Configuração do Pusher
  window.Pusher = Pusher;
  console.log('🔌 Pusher configurado no window:', window.Pusher);

  // Obter configuração centralizada
  const pusherConfig = getPusherConfig();
  console.log('🔌 Configuração Pusher:', pusherConfig);

  // Criar instância do Pusher
  const pusher = new Pusher(pusherConfig.key, {
    cluster: pusherConfig.cluster,
    forceTLS: pusherConfig.forceTLS
  });

  console.log('🔌 Instância Pusher criada:', pusher);

  // Fornecer Pusher globalmente
  return {
    provide: {
      pusher
    }
  };
}); 