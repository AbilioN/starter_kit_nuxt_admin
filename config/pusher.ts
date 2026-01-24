/**
 * Configuração centralizada do Pusher
 * Compatível com Nuxt.js e Flutter
 */

export const PUSHER_CONFIG = {
  // Credenciais principais
  appId: '1553073',
  appKey: 'b395ac035994ca7af583',
  appSecret: '8a20e39fc3f1ab6111af',
  cluster: 'eu',
  
  // Configurações de conexão
  host: '', // Deixar vazio para usar o padrão do cluster
  port: 443,
  scheme: 'https',
  
  // Configurações de segurança
  forceTLS: true,
  encrypted: true,
  
  // Configurações para cliente (Nuxt.js/Flutter)
  clientAppKey: 'b395ac035994ca7af583',
  clientCluster: 'eu',
  clientHost: null, // null para usar o padrão
  clientPort: 443,
  clientScheme: 'https'
} as const;

// Configuração para Nuxt.js
export const getPusherConfig = () => ({
  broadcaster: 'pusher' as const,
  key: PUSHER_CONFIG.appKey,
  cluster: PUSHER_CONFIG.cluster,
  forceTLS: PUSHER_CONFIG.forceTLS,
  encrypted: PUSHER_CONFIG.encrypted,
  // Configurações opcionais
  host: PUSHER_CONFIG.host || undefined,
  port: PUSHER_CONFIG.port,
  scheme: PUSHER_CONFIG.scheme
});

// Configuração para Flutter (referência)
export const getFlutterPusherConfig = () => ({
  appId: PUSHER_CONFIG.appId,
  appKey: PUSHER_CONFIG.appKey,
  appSecret: PUSHER_CONFIG.appSecret,
  cluster: PUSHER_CONFIG.cluster,
  host: PUSHER_CONFIG.host,
  port: PUSHER_CONFIG.port,
  scheme: PUSHER_CONFIG.scheme,
  // Configurações específicas do cliente
  clientAppKey: PUSHER_CONFIG.clientAppKey,
  clientCluster: PUSHER_CONFIG.clientCluster,
  clientHost: PUSHER_CONFIG.clientHost,
  clientPort: PUSHER_CONFIG.clientPort,
  clientScheme: PUSHER_CONFIG.clientScheme
});

// Tipos para configuração
export type PusherConfig = ReturnType<typeof getPusherConfig>;
export type FlutterPusherConfig = ReturnType<typeof getFlutterPusherConfig>;
