<script setup lang="ts">
import { ref, onMounted } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import type { FileItem } from '~/composables/useFiles';

definePageMeta({ middleware: 'auth' });

const { t } = useI18n();
const { can } = usePermissions();
const { files, loading, uploading, error, pagination, loadFiles, uploadFile, deleteFile, formatSize, mimeIcon, mimeColor } = useFiles();

const viewMode = ref<'grid' | 'list'>('grid');
const fileInputRef = ref<HTMLInputElement>();
const deleteTarget = ref<string | null>(null);
const deleteDialog = ref(false);

// ── Preview ──────────────────────────────────────────────────────────────────

type PreviewType = 'image' | 'pdf' | 'text' | 'none';

interface PreviewState {
  blobUrl: string | null;
  name: string;
  mime: string;
  type: PreviewType;
  textContent: string | null;
  loading: boolean;
  error: string | null;
}

const preview = ref<PreviewState | null>(null);

const resolvePreviewType = (mime: string): PreviewType => {
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('text/') || mime === 'application/json' || mime === 'application/xml') return 'text';
  return 'none';
};

const fetchWithAuth = (url: string): Promise<Response> => {
  const token = process.client ? localStorage.getItem('auth_token') : null;
  return fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
};

const openPreview = async (file: FileItem) => {
  const type = resolvePreviewType(file.mime_type);

  preview.value = { blobUrl: null, name: file.original_name, mime: file.mime_type, type, textContent: null, loading: true, error: null };

  try {
    const res = await fetchWithAuth(file.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    if (type === 'text') {
      preview.value.textContent = await res.text();
    } else if (type === 'image' || type === 'pdf') {
      const blob = await res.blob();
      preview.value.blobUrl = URL.createObjectURL(blob);
    }
  } catch (err: any) {
    preview.value.error = err.message ?? 'Failed to load file.';
  } finally {
    if (preview.value) preview.value.loading = false;
  }
};

const closePreview = () => {
  if (preview.value?.blobUrl) URL.revokeObjectURL(preview.value.blobUrl);
  preview.value = null;
};

const downloadFile = async (file: FileItem) => {
  try {
    const res = await fetchWithAuth(file.url);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.original_name;
    a.click();
    URL.revokeObjectURL(url);
  } catch {}
};

// ── Upload / Delete ───────────────────────────────────────────────────────────

onMounted(() => loadFiles());

const onFileInputChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;
  for (const file of Array.from(input.files)) {
    await uploadFile(file);
  }
  input.value = '';
};

const confirmDelete = (id: string) => {
  deleteTarget.value = id;
  deleteDialog.value = true;
};

const handleDelete = async () => {
  if (deleteTarget.value === null) return;
  await deleteFile(deleteTarget.value);
  deleteDialog.value = false;
  deleteTarget.value = null;
};
</script>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h1 class="text-h4 font-weight-bold">{{ t('pages.files.title') }}</h1>
            <p class="text-body-1 text-medium-emphasis">
              {{ t('pages.files.subtitle', { count: pagination.total }) }}
            </p>
          </div>
          <div class="d-flex gap-3 align-center">
            <v-btn-toggle v-model="viewMode" density="compact" variant="outlined" divided>
              <v-btn value="grid" icon="mdi-view-grid-outline" size="small" />
              <v-btn value="list" icon="mdi-view-list-outline" size="small" />
            </v-btn-toggle>
            <v-btn
              v-if="can('file-upload')"
              color="primary"
              prepend-icon="mdi-upload"
              :loading="uploading"
              @click="fileInputRef?.click()"
            >
              {{ t('pages.files.upload') }}
            </v-btn>
            <input ref="fileInputRef" type="file" multiple style="display:none" @change="onFileInputChange" />
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Permission denied -->
    <v-row v-if="!can('file-read')">
      <v-col cols="12">
        <v-alert type="warning" variant="tonal">{{ t('pages.files.noPermission') }}</v-alert>
      </v-col>
    </v-row>

    <template v-else>
      <!-- Loading -->
      <v-row v-if="loading">
        <v-col cols="12">
          <UiChildCard>
            <div class="d-flex justify-center py-12">
              <v-progress-circular indeterminate color="primary" size="64" />
            </div>
          </UiChildCard>
        </v-col>
      </v-row>

      <!-- Error -->
      <v-row v-else-if="error">
        <v-col cols="12">
          <v-alert type="error" variant="tonal">{{ error }}</v-alert>
        </v-col>
      </v-row>

      <!-- Empty state -->
      <v-row v-else-if="files.length === 0">
        <v-col cols="12">
          <UiChildCard>
            <div class="d-flex flex-column align-center py-16 text-medium-emphasis">
              <v-icon size="64" class="mb-4">mdi-folder-open-outline</v-icon>
              <p class="text-h6">{{ t('pages.files.noFilesYet') }}</p>
              <p class="text-body-2 mt-1">{{ t('pages.files.noFilesHint') }}</p>
              <v-btn v-if="can('file-upload')" color="primary" class="mt-4" prepend-icon="mdi-upload" @click="fileInputRef?.click()">
                {{ t('pages.files.uploadFile') }}
              </v-btn>
            </div>
          </UiChildCard>
        </v-col>
      </v-row>

      <!-- Grid view -->
      <v-row v-else-if="viewMode === 'grid'">
        <v-col
          v-for="file in files"
          :key="file.id"
          cols="12" sm="6" md="4" lg="3"
        >
          <v-card rounded="xl" border class="h-100" style="cursor:pointer" @click="openPreview(file)">
            <!-- Thumbnail -->
            <div class="d-flex align-center justify-center bg-grey-lighten-4" style="height:140px; overflow:hidden">
              <v-img
                v-if="file.mime_type.startsWith('image/')"
                :src="file.url"
                :alt="file.original_name"
                cover
                height="140"
              />
              <v-icon v-else size="56" :color="mimeColor(file.mime_type)">
                {{ mimeIcon(file.mime_type) }}
              </v-icon>
            </div>

            <v-card-text class="pt-2 pb-1">
              <div class="text-body-2 font-weight-medium text-truncate">{{ file.original_name }}</div>
              <div class="text-caption text-medium-emphasis mt-1">
                {{ formatSize(file.size) }} · {{ new Date(file.created_at).toLocaleDateString() }}
              </div>
            </v-card-text>

            <v-card-actions class="pt-0">
              <v-btn size="small" variant="text" icon="mdi-download" @click.stop="downloadFile(file)" />
              <v-spacer />
              <v-btn
                v-if="can('file-delete')"
                size="small"
                variant="text"
                color="error"
                icon="mdi-delete-outline"
                @click.stop="confirmDelete(file.id)"
              />
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- List view -->
      <v-row v-else>
        <v-col cols="12">
          <UiChildCard>
            <v-table density="comfortable">
              <thead>
                <tr>
                  <th>{{ t('pages.files.tableFile') }}</th>
                  <th>{{ t('pages.files.tableSize') }}</th>
                  <th>{{ t('pages.files.tableType') }}</th>
                  <th>{{ t('pages.files.tableUploaded') }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="file in files" :key="file.id" style="cursor:pointer" @click="openPreview(file)">
                  <td>
                    <div class="d-flex align-center gap-3">
                      <v-icon :color="mimeColor(file.mime_type)">{{ mimeIcon(file.mime_type) }}</v-icon>
                      <span class="text-body-2">{{ file.original_name }}</span>
                    </div>
                  </td>
                  <td class="text-body-2 text-medium-emphasis">{{ formatSize(file.size) }}</td>
                  <td>
                    <v-chip :color="mimeColor(file.mime_type)" variant="tonal" size="small">
                      {{ file.mime_type.split('/').pop() }}
                    </v-chip>
                  </td>
                  <td class="text-body-2 text-medium-emphasis">{{ new Date(file.created_at).toLocaleDateString() }}</td>
                  <td @click.stop>
                    <div class="d-flex gap-1 justify-end">
                      <v-btn size="small" variant="text" icon="mdi-download" @click.stop="downloadFile(file)" />
                      <v-btn
                        v-if="can('file-delete')"
                        size="small"
                        variant="text"
                        color="error"
                        icon="mdi-delete-outline"
                        @click="confirmDelete(file.id)"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </UiChildCard>
        </v-col>
      </v-row>

      <!-- Pagination -->
      <v-row v-if="pagination.last_page > 1">
        <v-col cols="12" class="d-flex justify-center">
          <v-pagination
            :model-value="pagination.current_page"
            :length="pagination.last_page"
            @update:model-value="loadFiles"
          />
        </v-col>
      </v-row>
    </template>

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="text-h6 pa-6 pb-3">{{ t('pages.files.deleteDialogTitle') }}</v-card-title>
        <v-card-text class="pa-6 pt-0 text-medium-emphasis">
          {{ t('pages.files.deleteDialogBody') }}
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">{{ t('common.actions.cancel') }}</v-btn>
          <v-btn color="error" variant="flat" @click="handleDelete">{{ t('common.actions.delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Preview dialog -->
    <v-dialog v-model="preview" max-width="960" scrollable @keydown.esc="closePreview">
      <v-card v-if="preview" rounded="xl">
        <!-- Title bar -->
        <v-card-title class="d-flex align-center gap-2 pa-4 pb-3">
          <v-icon :color="mimeColor(preview.mime)" size="20">{{ mimeIcon(preview.mime) }}</v-icon>
          <span class="text-body-1 font-weight-medium text-truncate flex-grow-1">{{ preview.name }}</span>
          <v-chip size="x-small" variant="tonal" class="mr-2">{{ preview.mime }}</v-chip>
          <v-btn icon="mdi-close" variant="text" size="small" @click="closePreview" />
        </v-card-title>
        <v-divider />

        <!-- Body -->
        <v-card-text class="pa-0" style="max-height: 72vh; overflow: hidden;">

          <!-- Loading -->
          <div v-if="preview.loading" class="d-flex justify-center align-center" style="height:72vh">
            <v-progress-circular indeterminate color="primary" size="48" />
          </div>

          <!-- Error -->
          <v-alert v-else-if="preview.error" type="error" variant="tonal" class="ma-4">
            {{ preview.error }}
          </v-alert>

          <template v-else>
            <!-- Image -->
            <v-img
              v-if="preview.type === 'image'"
              :src="preview.blobUrl!"
              contain
              max-height="72vh"
            />

            <!-- PDF -->
            <iframe
              v-else-if="preview.type === 'pdf'"
              :src="preview.blobUrl! + '#toolbar=1&navpanes=0&scrollbar=1'"
              style="width:100%; height:72vh; border:none; display:block;"
            />

            <!-- Text / JSON / XML -->
            <div v-else-if="preview.type === 'text'" style="height:72vh; overflow:auto;">
              <pre class="text-viewer pa-5 text-body-2">{{ preview.textContent }}</pre>
            </div>

            <!-- No preview available -->
            <div v-else class="d-flex flex-column align-center justify-center py-16 text-medium-emphasis">
              <v-icon size="64" class="mb-4">{{ mimeIcon(preview.mime) }}</v-icon>
              <p class="text-h6">{{ t('pages.files.noPreview') }}</p>
              <p class="text-body-2 mt-1">{{ t('pages.files.noPreviewHint') }}</p>
            </div>
          </template>

        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-3">
          <v-spacer />
          <v-btn
            v-if="preview.blobUrl"
            :href="preview.blobUrl"
            :download="preview.name"
            prepend-icon="mdi-download"
            variant="tonal"
            color="primary"
          >
            {{ t('common.actions.download') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.text-viewer {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 0.8rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  background: transparent;
  margin: 0;
}
</style>
