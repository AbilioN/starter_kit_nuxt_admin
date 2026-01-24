export default defineNuxtConfig({
  ssr: false,

  typescript: {
    shim: false,
  },

  app: {
    head: {
      title:
        "Spikeadmin Free Nuxt 3 Dashboard",
    },
  },

  build: {
    transpile: ["vuetify"],
  },

  nitro: {
    serveStatic: true,
  },

  runtimeConfig: {
    public: {
      pusherKey: process.env.PUSHER_APP_KEY || 'b395ac035994ca7af583',
      pusherCluster: process.env.PUSHER_APP_CLUSTER || 'eu',
      pusherAppId: process.env.PUSHER_APP_ID || '1553073',
      pusherSecret: process.env.PUSHER_APP_SECRET || '8a20e39fc3f1ab6111af'
    }
  },

  sourcemap: { server: false, client: false },
  devServerHandlers: [],
  compatibilityDate: "2025-04-04",
});