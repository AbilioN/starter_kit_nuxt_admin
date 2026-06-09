import Pusher from 'pusher-js';
import Echo from 'laravel-echo';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

export default defineNuxtPlugin(() => {
  window.Pusher = Pusher;

  const config = useRuntimeConfig();
  const token = process.client ? (localStorage.getItem('auth_token') ?? '') : '';

  const echo = new Echo({
    broadcaster: 'pusher',
    key: config.public.pusherKey,
    cluster: config.public.pusherCluster,
    forceTLS: true,
    authEndpoint: `${config.public.apiBaseUrl}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });

  return {
    provide: {
      echo,
    },
  };
});
