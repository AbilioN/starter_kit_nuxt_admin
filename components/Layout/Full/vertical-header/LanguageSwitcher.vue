<script setup lang="ts">
const { locale, setLocale } = useI18n();

// As bandeiras eram emoji (🇫🇷 = U+1F1EB U+1F1F7, um par de REGIONAL INDICATOR
// SYMBOL LETTER). Cabe à fonte reconhecer o par e desenhar a bandeira: a Apple
// Color Emoji faz isso, mas a Segoe UI Emoji do Windows deliberadamente não tem
// glifos de bandeira de país — o navegador então renderiza as duas letras soltas
// e o seletor virava "FR EN ES PT". Trocado por SVG inline: mesmo desenho em
// qualquer SO, sem dependência nova (são 4 bandeiras; o flag-icons traria CSS de
// ~250 países pra isso).
const languages = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
] as const;

type LanguageCode = (typeof languages)[number]['code'];

const switchLanguage = (code: LanguageCode) => {
  setLocale(code);
};
</script>

<template>
  <div class="d-flex align-center ga-2">
    <button
      v-for="lang in languages"
      :key="lang.code"
      type="button"
      class="lang-flag-btn"
      :class="{ 'lang-flag-btn--active': locale === lang.code }"
      :title="lang.label"
      :aria-label="lang.label"
      @click="switchLanguage(lang.code)"
    >
      <span class="lang-flag">
        <!-- viewBox 60x45 (4:3) para todas: o mesmo que uma fonte de emoji faz,
             normalizar proporções diferentes (França 2:3, Reino Unido 1:2) num
             box único, senão a fileira fica desalinhada. -->
        <svg viewBox="0 0 60 45" aria-hidden="true" focusable="false">
          <!-- França: três faixas verticais iguais -->
          <template v-if="lang.code === 'fr'">
            <rect width="60" height="45" fill="#fff" />
            <rect width="20" height="45" fill="#002654" />
            <rect x="40" width="20" height="45" fill="#ED2939" />
          </template>

          <!-- Reino Unido: saltires branco/vermelho + cruz de São Jorge.
               Proporções oficiais escaladas para altura 45 (cruz vermelha 1/5,
               fimbriação branca 1/3; saltire vermelho 1/15, branco 1/5).
               O contra-trocado do saltire vermelho (o deslocamento em relação à
               diagonal) foi omitido: é sub-pixel a 20px de largura.
               Os traços que passam do viewBox são cortados pelo próprio <svg>,
               que tem overflow:hidden por padrão. -->
          <template v-else-if="lang.code === 'en'">
            <rect width="60" height="45" fill="#012169" />
            <path d="M0,0 L60,45 M60,0 L0,45" stroke="#fff" stroke-width="9" />
            <path d="M0,0 L60,45 M60,0 L0,45" stroke="#C8102E" stroke-width="3" />
            <path d="M30,0 V45 M0,22.5 H60" stroke="#fff" stroke-width="15" />
            <path d="M30,0 V45 M0,22.5 H60" stroke="#C8102E" stroke-width="9" />
          </template>

          <!-- Espanha: faixas 1:2:1. Brasão omitido, ilegível a este tamanho. -->
          <template v-else-if="lang.code === 'es'">
            <rect width="60" height="45" fill="#AA151B" />
            <rect y="11.25" width="60" height="22.5" fill="#F1BF00" />
          </template>

          <!-- Portugal: verde 2/5, vermelho 3/5, esfera armilar simplificada a
               um anel amarelo com o escudo branco por cima. -->
          <template v-else-if="lang.code === 'pt'">
            <rect width="60" height="45" fill="#DA291C" />
            <rect width="24" height="45" fill="#046A38" />
            <circle cx="24" cy="22.5" r="8.6" fill="none" stroke="#FFE600" stroke-width="2.2" />
            <path
              d="M21.4,20.2 A2.6,2.6 0 0 1 26.6,20.2 L26.6,23.3 Q26.6,25.9 24,26.7 Q21.4,25.9 21.4,23.3 Z"
              fill="#fff"
              stroke="#DA291C"
              stroke-width="1.3"
            />
          </template>

          <!-- Contorno sutil: sem ele as faixas brancas (FR/ES) somem no fundo
               claro do botão. Traço centrado na borda, metade fica visível. -->
          <rect
            width="60"
            height="45"
            fill="none"
            stroke="#000"
            stroke-opacity="0.2"
            stroke-width="3"
          />
        </svg>
      </span>
    </button>
  </div>
</template>

<style scoped>
.lang-flag-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-containerBg));
  border: 2px solid transparent;
  cursor: pointer;
  padding: 0;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s ease, opacity 0.2s ease;
  opacity: 0.6;
}

.lang-flag-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

.lang-flag-btn--active {
  opacity: 1;
  border-color: rgb(var(--v-theme-primary));
  transform: scale(1.05);
}

/* O <span> é quem arredonda os cantos: border-radius direto no <svg> nem sempre
   recorta o conteúdo pintado, num wrapper com overflow:hidden sempre recorta. */
.lang-flag {
  display: block;
  width: 20px;
  height: 15px;
  border-radius: 2px;
  overflow: hidden;
}

.lang-flag svg {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
