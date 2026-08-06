export default defineNuxtConfig({
  ssr: false,

  modules: ["@nuxtjs/i18n"],

  i18n: {
    locales: [
      { code: "pt", name: "Português", file: "pt.json" },
      { code: "en", name: "English", file: "en.json" },
      { code: "es", name: "Español", file: "es.json" },
      { code: "fr", name: "Français", file: "fr.json" },
    ],
    defaultLocale: "pt",
    langDir: "locales/",
    strategy: "no_prefix",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "locale",
      alwaysRedirect: false,
    },
  },

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
  },

  // utils/tenant.ts and config/api.ts read these via useRuntimeConfig().public
  // rather than process.env directly. An earlier attempt used vite.define to
  // statically replace process.env.NUXT_PUBLIC_* in the client bundle, but
  // Nuxt doesn't reliably forward top-level vite.define through to the actual
  // dev-server Vite instance (confirmed empirically: the value was correct at
  // nuxt.config.ts eval time, but the served/transformed module still had the
  // raw unreplaced `process.env.X` expression) - runtimeConfig.public is
  // Nuxt's own supported mechanism for exposing env to the client and doesn't
  // have this gap.
  runtimeConfig: {
    public: {
      pusherKey: process.env.PUSHER_APP_KEY || 'b395ac035994ca7af583',
      pusherCluster: process.env.PUSHER_APP_CLUSTER || 'eu',
      pusherAppId: process.env.PUSHER_APP_ID || '1553073',
      pusherSecret: process.env.PUSHER_APP_SECRET || '8a20e39fc3f1ab6111af',
      apiBaseUrl: process.env.NUXT_API_BASE_URL || 'http://localhost:8006/api',
      tenantMode: process.env.NUXT_PUBLIC_TENANT_MODE || '',
      apiRootDomain: process.env.NUXT_PUBLIC_API_ROOT_DOMAIN || '',
      apiProtocol: process.env.NUXT_PUBLIC_API_PROTOCOL || '',
      defaultTenant: process.env.NUXT_PUBLIC_DEFAULT_TENANT || '',
    }
  },

  sourcemap: { server: false, client: false },
  devServerHandlers: [],
  compatibilityDate: "2025-04-04",
});