<script setup lang="ts">
import { ref, onMounted } from 'vue';
import UiChildCard from '@/components/shared/UiChildCard.vue';
import type { FileItem } from '~/composables/useFiles';

definePageMeta({ middleware: 'auth' });

const { can } = usePermissions();
const { files, loading, uploading, error, pagination, loadFiles, uploadFile, deleteFile, formatSize, mimeIcon, mimeColor } = useFiles();

const viewMode = ref<'grid' | 'list'>('grid');
const fileInputRef = ref<HTMLInputElement>();
const deleteTarget = ref<string | null>(null);
const deleteDialog = ref(false);

// ── Preview ──────────────────────────────────────────────────────────────────

type PreviewType = 'image' | 'pdf' | 'text' | 'none';

interface PreviewState {
  url: string;
  name: string;
  mime: string;
  type: PreviewType;
  textContent: string | null;
  loadingText: boolean;
  error: string | null;
}

const preview = ref<PreviewState | null>(null);

const authUrl = (url: string): string => {
  const token = process.client ? localStorage.getItem('auth_token') : null;
  if (!token) return url;
  return `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
};

const resolvePreviewType = (mime: string): PreviewType => {
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf') return 'pdf';
  if (
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    mime === 'application/xml'
  ) return 'text';
  return 'none';
};

const openPreview = async (file: FileItem) => {
  const type = resolvePreviewType(file.mime_type);

  preview.value = {
    url: authUrl(file.url),
    name: file.original_name,
    mime: file.mime_type,
    type,
    textContent: null,
    loadingText: type === 'text',
    error: null,
  };

  if (type === 'text') {
    try {
      const textToken = process.client ? localStorage.getItem('auth_token') : null;
      const res = await fetch(authUrl(file.url), {
        headers: textToken ? { Authorization: `Bearer ${textToken}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      preview.value.textContent = await res.text();
    } catch (err: any) {
      preview.value.error = err.message ?? 'Failed to load file content.';
    } finally {
      preview.value.loadingText = false;
    }
  }
};

const closePreview = () => { preview.value = null; };

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
            <h1 class="text-h4 font-weight-bold">Files</h1>
            <p class="text-body-1 text-medium-emphasis">
              Manage uploaded files — {{ pagination.total }} total
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
              Upload
            </v-btn>
            <input ref="fileInputRef" type="file" multiple style="display:none" @change="onFileInputChange" />
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Permission denied -->
    <v-row v-if="!can('file-read')">
      <v-col cols="12">
        <v-alert type="warning" variant="tonal">You don't have permission to view files.</v-alert>
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
              <p class="text-h6">No files yet</p>
              <p class="text-body-2 mt-1">Upload your first file to get started.</p>
              <v-btn v-if="can('file-upload')" color="primary" class="mt-4" prepend-icon="mdi-upload" @click="fileInputRef?.click()">
                Upload File
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
              <v-btn size="small" variant="text" :href="authUrl(file.url)" target="_blank" icon="mdi-download" @click.stop />
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
                  <th>File</th>
                  <th>Size</th>
                  <th>Type</th>
                  <th>Uploaded</th>
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
                      <v-btn size="small" variant="text" icon="mdi-download" :href="authUrl(file.url)" target="_blank" />
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
        <v-card-title class="text-h6 pa-6 pb-3">Delete file?</v-card-title>
        <v-card-text class="pa-6 pt-0 text-medium-emphasis">
          This action cannot be undone.
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="handleDelete">Delete</v-btn>
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

          <!-- Image -->
          <v-img
            v-if="preview.type === 'image'"
            :src="preview.url"
            contain
            max-height="72vh"
          />

          <!-- PDF -->
          <iframe
            v-else-if="preview.type === 'pdf'"
            :src="preview.url + '#toolbar=1&navpanes=0&scrollbar=1'"
            style="width:100%; height:72vh; border:none; display:block;"
          />

          <!-- Text / JSON / XML -->
          <div v-else-if="preview.type === 'text'" style="height:72vh; overflow:auto;">
            <div v-if="preview.loadingText" class="d-flex justify-center align-center" style="height:100%">
              <v-progress-circular indeterminate color="primary" />
            </div>
            <v-alert v-else-if="preview.error" type="error" variant="tonal" class="ma-4">
              {{ preview.error }}
            </v-alert>
            <pre v-else class="text-viewer pa-5 text-body-2">{{ preview.textContent }}</pre>
          </div>

          <!-- No preview available -->
          <div v-else class="d-flex flex-column align-center justify-center py-16 text-medium-emphasis">
            <v-icon size="64" class="mb-4">{{ mimeIcon(preview.mime) }}</v-icon>
            <p class="text-h6">No preview available</p>
            <p class="text-body-2 mt-1">Download the file to open it.</p>
          </div>

        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-3">
          <v-spacer />
          <v-btn
            :href="preview.url"
            target="_blank"
            download
            prepend-icon="mdi-download"
            variant="tonal"
            color="primary"
          >
            Download
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
