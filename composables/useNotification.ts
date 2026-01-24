export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  message: string;
  type: NotificationType;
  timeout?: number;
}

export const useNotification = () => {
  // Estado reativo para controlar o snackbar
  const show = useState<boolean>('notification-show', () => false);
  const message = useState<string>('notification-message', () => '');
  const type = useState<NotificationType>('notification-type', () => 'info');
  const timeout = useState<number>('notification-timeout', () => 3000);

  // Função para mostrar notificação
  const showNotification = (notification: Notification) => {
    console.log('📢 Showing notification:', notification);
    message.value = notification.message;
    type.value = notification.type;
    timeout.value = notification.timeout || 3000;
    show.value = true;
    console.log('📢 State after update:', {
      show: show.value,
      message: message.value,
      type: type.value,
      timeout: timeout.value
    });
  };

  // Funções de atalho para tipos específicos
  const success = (msg: string, duration?: number) => {
    showNotification({
      message: msg,
      type: 'success',
      timeout: duration
    });
  };

  const error = (msg: string, duration?: number) => {
    showNotification({
      message: msg,
      type: 'error',
      timeout: duration
    });
  };

  const warning = (msg: string, duration?: number) => {
    showNotification({
      message: msg,
      type: 'warning',
      timeout: duration
    });
  };

  const info = (msg: string, duration?: number) => {
    showNotification({
      message: msg,
      type: 'info',
      timeout: duration
    });
  };

  // Função para fechar manualmente
  const close = () => {
    show.value = false;
  };

  return {
    // Estados
    show,
    message,
    type,
    timeout,
    
    // Funções
    showNotification,
    success,
    error,
    warning,
    info,
    close
  };
};
