export default defineNuxtConfig({
  ssr: false,

  typescript: {
    shim: false,
  },

  app: {
    head: {
      title: "Admin Console",
    },
  },

  build: {
    transpile: ["vuetify"],
  },

  nitro: {
    serveStatic: true,
  },

  // Vite 5.4+ blocks requests whose Host header isn't localhost/127.0.0.1 by
  // default — without this, visiting the dev server via a tenant subdomain
  // (tenant-a.localhost:3000, *.nip.io, etc.) 404s before it reaches the app.
  vite: {
    server: {
      allowedHosts: true,
    },
    // utils/tenant.ts and config/api.ts read process.env.NUXT_PUBLIC_* directly
    // (not via useRuntimeConfig()) because ApiClient gets instantiated in ~10
    // places across composables/repositories/services, several of which are
    // plain TS classes with no Nuxt context to call useRuntimeConfig() from.
    // ssr: false means all of that code runs in the browser bundle, where
    // process.env is normally empty - `define` statically replaces each of
    // these references at build time with the literal value read here (in
    // Node, where process.env genuinely is populated from .env), so the
    // request path this app builds actually reflects NUXT_PUBLIC_TENANT_MODE
    // instead of silently defaulting to "subdomain" every time.
    define: {
      'process.env.NUXT_PUBLIC_TENANT_MODE': JSON.stringify(process.env.NUXT_PUBLIC_TENANT_MODE || ''),
      'process.env.NUXT_PUBLIC_API_ROOT_DOMAIN': JSON.stringify(process.env.NUXT_PUBLIC_API_ROOT_DOMAIN || ''),
      'process.env.NUXT_PUBLIC_API_PROTOCOL': JSON.stringify(process.env.NUXT_PUBLIC_API_PROTOCOL || ''),
      'process.env.NUXT_PUBLIC_DEFAULT_TENANT': JSON.stringify(process.env.NUXT_PUBLIC_DEFAULT_TENANT || ''),
    },
  },

  runtimeConfig: {
    public: {
      pusherKey: process.env.PUSHER_APP_KEY || 'b395ac035994ca7af583',
      pusherCluster: process.env.PUSHER_APP_CLUSTER || 'eu',
      pusherAppId: process.env.PUSHER_APP_ID || '1553073',
      pusherSecret: process.env.PUSHER_APP_SECRET || '8a20e39fc3f1ab6111af',
      apiBaseUrl: process.env.NUXT_API_BASE_URL || 'http://localhost:8006/api',
    }
  },

  sourcemap: { server: false, client: false },
  devServerHandlers: [],
  compatibilityDate: "2025-04-04",
});