<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface Props {
  name?: string | null;
  src?: string | null;
  size?: number | string;
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  src: null,
  size: 40,
});

const broken = ref(false);
// Uma URL nova merece nova tentativa: sem isto, um erro anterior deixaria o
// componente preso nas iniciais mesmo depois de um upload bem-sucedido.
watch(() => props.src, () => { broken.value = false; });

const initials = computed(() => {
  const parts = (props.name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase();
});

const showImage = computed(() => Boolean(props.src) && !broken.value);
</script>

<template>
  <!--
    Fallback para iniciais quando não há foto OU quando a URL falha. O @error
    importa: avatar_url aponta para o storage do tenant e pode dar 404 depois de
    uma migração de storage — sem ele o <v-avatar> mostraria o ícone de imagem
    partida do browser.
  -->
  <v-avatar :size="size" :color="showImage ? undefined : 'primary'" :variant="showImage ? undefined : 'tonal'">
    <img
      v-if="showImage"
      :src="src as string"
      :alt="name || ''"
      class="user-avatar-img"
      @error="broken = true"
    />
    <span v-else class="user-avatar-initials">{{ initials }}</span>
  </v-avatar>
</template>

<style scoped>
.user-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-avatar-initials {
  font-weight: 600;
  font-size: 0.8em;
  line-height: 1;
}
</style>
