<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import type { TemplateEntry } from '~/types/api';

const props = defineProps<{
  templateId: string;
}>();

const entries = defineModel<TemplateEntry[]>({ required: true });

const { t } = useI18n();
const { updateTemplate, previewPdf } = useTemplates();

// mm -> px at the current render scale. PDF user units are points (1/72in)
// and pdfjs's viewport is already in "px == points * scale", so this one
// factor is all mm<->px conversion ever needs, in both directions.
const MM_TO_PT = 72 / 25.4;
const scale = ref(1.5);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const pageContainerRef = ref<HTMLElement | null>(null);
let pdfDoc: any = null;
const numPages = ref(0);
const currentPage = ref(1);
const canvasWidth = ref(0);
const canvasHeight = ref(0);
const pageWidthMm = ref(210); // A4 fallback until the first page renders
const pageHeightMm = ref(297);

const refreshing = ref(false);
const rendering = ref(false);
let previewObjectUrl: string | null = null;

// No merge-context catalogue endpoint exists yet (see PlaceholderResolverService
// — only a StubMergeContext backs this today), so this mirrors its fixed
// catalogue directly. Swap for a real /templates/merge-fields call once a
// real MergeContext lands.
const fieldCatalogue = ['first_name', 'last_name', 'email', 'zip', 'date'];

const entriesOnPage = computed(() =>
  entries.value.map((e, index) => ({ entry: e, index })).filter(({ entry }) => entry.page === currentPage.value)
);

const selectedIndex = ref<number | null>(null);
const selectedEntry = computed(() => selectedIndex.value !== null ? entries.value[selectedIndex.value] ?? null : null);

const renderPage = async (pageNum: number) => {
  if (!pdfDoc || !canvasRef.value) return;
  rendering.value = true;
  try {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: scale.value });
    const canvas = canvasRef.value;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvasWidth.value = viewport.width;
    canvasHeight.value = viewport.height;
    pageWidthMm.value = viewport.width / scale.value / MM_TO_PT;
    pageHeightMm.value = viewport.height / scale.value / MM_TO_PT;

    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;
  } finally {
    rendering.value = false;
  }
};

const loadPdf = async (url: string) => {
  const pdfjsLib = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  pdfDoc = await pdfjsLib.getDocument(url).promise;
  numPages.value = pdfDoc.numPages;
  if (currentPage.value > numPages.value) currentPage.value = 1;
  await renderPage(currentPage.value);
};

// The full round-trip the spec calls for: persist the in-memory entries,
// ask the server to render them over the real background, then load that
// rendered PDF into the canvas — never the raw background, so the author
// sees the actual resolved values and any real text overflow.
const refreshPreview = async () => {
  refreshing.value = true;
  try {
    await updateTemplate(props.templateId, { body: JSON.stringify(entries.value) });
    const url = await previewPdf(props.templateId);
    if (url) {
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
      previewObjectUrl = url;
      await loadPdf(url);
    }
  } finally {
    refreshing.value = false;
  }
};

const goToPage = async (page: number) => {
  if (page < 1 || page > numPages.value) return;
  currentPage.value = page;
  await renderPage(page);
};

// Drag state — a small movement threshold distinguishes a click (select)
// from a drag (reposition), since both start with the same pointerdown.
let dragIndex: number | null = null;
let dragStartClientX = 0;
let dragStartClientY = 0;
let dragStartEntryX = 0;
let dragStartEntryY = 0;
let dragMoved = false;

const onEntryPointerDown = (index: number, e: PointerEvent) => {
  dragIndex = index;
  dragStartClientX = e.clientX;
  dragStartClientY = e.clientY;
  dragStartEntryX = entries.value[index].x;
  dragStartEntryY = entries.value[index].y;
  dragMoved = false;
  (e.target as HTMLElement).setPointerCapture(e.pointerId);
};

const onEntryPointerMove = (e: PointerEvent) => {
  if (dragIndex === null) return;
  const dxPx = e.clientX - dragStartClientX;
  const dyPx = e.clientY - dragStartClientY;
  if (Math.abs(dxPx) > 2 || Math.abs(dyPx) > 2) dragMoved = true;
  if (!dragMoved) return;

  const dxMm = dxPx / (MM_TO_PT * scale.value);
  const dyMm = dyPx / (MM_TO_PT * scale.value);
  const entry = entries.value[dragIndex];
  entry.x = Math.round((dragStartEntryX + dxMm) * 10) / 10;
  entry.y = Math.round((dragStartEntryY + dyMm) * 10) / 10;
};

const onEntryPointerUp = (index: number) => {
  if (!dragMoved) selectedIndex.value = index;
  dragIndex = null;
};

const addEntryAtCenter = (field: string) => {
  entries.value.push({
    x: Math.round((pageWidthMm.value / 2) * 10) / 10,
    y: Math.round((pageHeightMm.value / 2) * 10) / 10,
    text: `{${field}}`,
    page: currentPage.value,
  });
  selectedIndex.value = entries.value.length - 1;
};

const addBlankEntry = () => {
  entries.value.push({
    x: Math.round((pageWidthMm.value / 2) * 10) / 10,
    y: Math.round((pageHeightMm.value / 2) * 10) / 10,
    text: '',
    page: currentPage.value,
  });
  selectedIndex.value = entries.value.length - 1;
};

const removeSelectedEntry = () => {
  if (selectedIndex.value === null) return;
  entries.value.splice(selectedIndex.value, 1);
  selectedIndex.value = null;
};

onMounted(refreshPreview);

onBeforeUnmount(() => {
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
});
</script>

<template>
  <div>
    <div class="d-flex align-center flex-wrap ga-2 mb-3">
      <v-btn size="small" variant="outlined" prepend-icon="mdi-refresh" :loading="refreshing" @click="refreshPreview">
        {{ t('pages.templates.refreshPreview') }}
      </v-btn>

      <v-btn-group v-if="numPages > 1" density="compact" variant="outlined">
        <v-btn size="small" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
        <v-btn size="small" disabled>{{ t('pages.templates.pageOf', { current: currentPage, total: numPages }) }}</v-btn>
        <v-btn size="small" :disabled="currentPage >= numPages" @click="goToPage(currentPage + 1)">
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </v-btn-group>

      <v-select
        v-model="scale"
        :items="[{ title: '75%', value: 1.125 }, { title: '100%', value: 1.5 }, { title: '125%', value: 1.875 }, { title: '150%', value: 2.25 }]"
        density="compact"
        variant="outlined"
        hide-details
        style="width: 110px"
        @update:model-value="renderPage(currentPage)"
      />

      <v-btn size="small" variant="outlined" prepend-icon="mdi-plus" @click="addBlankEntry">
        {{ t('pages.templates.addEntry') }}
      </v-btn>
    </div>

    <div class="pdf-canvas-layout">
      <div ref="pageContainerRef" class="pdf-canvas-scroll">
        <div class="pdf-canvas-stage" :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }">
          <canvas ref="canvasRef" />
          <div v-if="rendering" class="pdf-canvas-loading">
            <v-progress-circular indeterminate color="primary" />
          </div>
          <div
            v-for="{ entry, index } in entriesOnPage"
            :key="index"
            class="pdf-entry-box"
            :class="{ 'pdf-entry-box--selected': selectedIndex === index }"
            :style="{ left: (entry.x * MM_TO_PT * scale) + 'px', top: (entry.y * MM_TO_PT * scale) + 'px' }"
            @pointerdown="onEntryPointerDown(index, $event)"
            @pointermove="onEntryPointerMove"
            @pointerup="onEntryPointerUp(index)"
          >
            {{ entry.text || t('pages.templates.emptyEntry') }}
          </div>
        </div>
      </div>

      <div class="pdf-canvas-sidebar">
        <div class="mb-4">
          <div class="text-caption font-weight-medium text-medium-emphasis mb-1">{{ t('pages.templates.fieldCatalogue') }}</div>
          <div class="d-flex flex-wrap ga-1">
            <v-chip v-for="field in fieldCatalogue" :key="field" size="small" variant="outlined" @click="addEntryAtCenter(field)">
              {{ field }}
            </v-chip>
          </div>
        </div>

        <div v-if="selectedEntry">
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="text-caption font-weight-medium text-medium-emphasis">{{ t('pages.templates.entryInspector') }}</div>
            <v-btn icon size="x-small" variant="text" color="error" @click="removeSelectedEntry">
              <v-icon size="small">mdi-delete-outline</v-icon>
            </v-btn>
          </div>

          <v-text-field v-model="selectedEntry.text" :label="t('pages.templates.entryText')" variant="outlined" density="compact" class="mb-2" />
          <div class="d-flex ga-2 mb-2">
            <v-text-field v-model.number="selectedEntry.x" label="x (mm)" type="number" variant="outlined" density="compact" />
            <v-text-field v-model.number="selectedEntry.y" label="y (mm)" type="number" variant="outlined" density="compact" />
          </div>
          <div class="d-flex ga-2 mb-2">
            <v-text-field v-model.number="selectedEntry.size" :label="t('pages.templates.entrySize')" type="number" variant="outlined" density="compact" />
            <v-text-field v-model="selectedEntry.color" :label="t('pages.templates.entryColor')" placeholder="#000000" variant="outlined" density="compact" />
          </div>
          <div class="d-flex ga-2 mb-2">
            <v-switch v-model="selectedEntry.bold" :label="t('pages.templates.entryBold')" density="compact" hide-details />
            <v-switch v-model="selectedEntry.italic" :label="t('pages.templates.entryItalic')" density="compact" hide-details />
          </div>

          <v-expansion-panels variant="accordion">
            <v-expansion-panel :title="t('pages.templates.advancedAttributes')">
              <v-expansion-panel-text>
                <v-text-field v-model.number="selectedEntry.width" label="width (mm)" type="number" variant="outlined" density="compact" class="mb-2" />
                <div class="d-flex ga-2 mb-2">
                  <v-text-field v-model.number="selectedEntry.space" label="space (mm)" type="number" variant="outlined" density="compact" />
                  <v-text-field v-model.number="selectedEntry.boxes" label="boxes" type="number" variant="outlined" density="compact" />
                </div>
                <v-select
                  v-model="selectedEntry.format"
                  :items="[null, 'int', 'floor', 'ceil', 'round']"
                  :label="t('pages.templates.entryFormat')"
                  variant="outlined"
                  density="compact"
                  clearable
                  class="mb-2"
                />
                <v-text-field v-model="selectedEntry.if" :label="t('pages.templates.entryIf')" placeholder="{field}:value" variant="outlined" density="compact" class="mb-2" />
                <v-text-field v-model="selectedEntry.slice" :label="t('pages.templates.entrySlice')" placeholder="0:-4" variant="outlined" density="compact" class="mb-2" />
                <v-text-field v-model="selectedEntry.month" :label="t('pages.templates.entryMonth')" placeholder="fr / Fr / FR" variant="outlined" density="compact" class="mb-2" />
                <v-switch v-model="selectedEntry.digits" :label="t('pages.templates.entryDigits')" density="compact" hide-details class="mb-2" />
                <v-text-field v-model="selectedEntry.bg" :label="t('pages.templates.entryBg')" placeholder="#ffff00" variant="outlined" density="compact" class="mb-2" />
                <v-switch v-model="selectedEntry.highlight" :label="t('pages.templates.entryHighlight')" density="compact" hide-details />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
        <div v-else class="text-body-2 text-medium-emphasis">
          {{ t('pages.templates.selectEntryHint') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pdf-canvas-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.pdf-canvas-scroll {
  overflow: auto;
  max-height: 640px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  flex: 1 1 auto;
}

.pdf-canvas-stage {
  position: relative;
}

.pdf-canvas-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05);
}

.pdf-entry-box {
  position: absolute;
  transform: translate(-2px, -2px);
  border: 1px dashed #1976d2;
  background: rgba(25, 118, 210, 0.12);
  color: #0d47a1;
  font-size: 11px;
  line-height: 1.2;
  padding: 1px 3px;
  cursor: move;
  white-space: nowrap;
  user-select: none;
  touch-action: none;
}

.pdf-entry-box--selected {
  border-color: #d32f2f;
  background: rgba(211, 47, 47, 0.15);
  color: #b71c1c;
  z-index: 2;
}

.pdf-canvas-sidebar {
  width: 280px;
  flex: 0 0 280px;
}
</style>
