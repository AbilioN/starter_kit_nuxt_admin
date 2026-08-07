<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps<{
  templateId: string;
}>();

const { t } = useI18n();
const {
  backgroundFiles,
  backgroundLoading,
  backgroundUploading,
  loadBackgroundFiles,
  uploadBackgroundFile,
  deleteBackgroundFile,
} = useTemplates();

const fileInputRef = ref<HTMLInputElement | null>(null);
const showDeleteDialog = ref(false);
const fileToDelete = ref<{ id: string; original_name: string } | null>(null);
const deleting = ref(false);

const onFileInputChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    await uploadBackgroundFile(props.templateId, file);
  }
  input.value = '';
};

const confirmDeleteFile = (file: { id: string; original_name: string }) => {
  fileToDelete.value = file;
  showDeleteDialog.value = true;
};

const doDelete = async () => {
  if (!fileToDelete.value) return;
  deleting.value = true;
  await deleteBackgroundFile(props.templateId, fileToDelete.value.id);
  deleting.value = false;
  showDeleteDialog.value = false;
  fileToDelete.value = null;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

onMounted(() => loadBackgroundFiles(props.templateId));
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="text-body-2 text-medium-emphasis">
        {{ t('pages.templates.backgroundHint') }}
      </div>
      <input ref="fileInputRef" type="file" accept="application/pdf" style="display:none" @change="onFileInputChange" />
      <v-btn
        variant="outlined"
        size="small"
        prepend-icon="mdi-file-upload-outline"
        :loading="backgroundUploading"
        @click="fileInputRef?.click()"
      >
        {{ t('pages.templates.uploadBackground') }}
      </v-btn>
    </div>

    <div v-if="backgroundLoading" class="d-flex justify-center py-4">
      <v-progress-circular indeterminate color="primary" size="32" />
    </div>

    <div v-else-if="backgroundFiles.length === 0" class="text-body-2 text-medium-emphasis py-4 text-center">
      {{ t('pages.templates.noBackgroundYet') }}
    </div>

    <v-list v-else density="compact" class="pdf-background-list">
      <v-list-item v-for="file in backgroundFiles" :key="file.id">
        <template v-slot:prepend>
          <v-chip size="small" color="primary" variant="tonal" class="mr-2">
            {{ t('pages.templates.pageNumber', { page: (file.sort ?? 0) + 1 }) }}
          </v-chip>
        </template>
        <v-list-item-title>{{ file.original_name }}</v-list-item-title>
        <v-list-item-subtitle>{{ formatSize(file.size) }}</v-list-item-subtitle>
        <template v-slot:append>
          <v-btn icon size="small" variant="text" color="error" @click="confirmDeleteFile(file)">
            <v-icon>mdi-delete-outline</v-icon>
          </v-btn>
        </template>
      </v-list-item>
    </v-list>

    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title>{{ t('pages.templates.deleteBackgroundTitle') }}</v-card-title>
        <v-card-text>
          <p>{{ fileToDelete?.original_name }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="deleting" @click="showDeleteDialog = false">{{ t('common.actions.cancel') }}</v-btn>
          <v-btn color="error" :loading="deleting" :disabled="deleting" @click="doDelete">
            {{ t('common.actions.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.pdf-background-list {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
}
</style>
