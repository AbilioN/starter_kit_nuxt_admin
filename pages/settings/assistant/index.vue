<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AgentDocument, DocumentAudience } from '~/types/agent-documents';

// Explicit, not auto-imported. Nuxt derives a component's auto-import name from
// its DIRECTORY, so `AgentDocumentDialog` in components/Assistant/ is really
// `AssistantAgentDocumentDialog` — and the bare name renders nothing at all,
// silently, with `nuxt build` passing clean.
import AgentDocumentDialog from '~/components/Assistant/AgentDocumentDialog.vue';

definePageMeta({ middleware: 'auth' });

const { t } = useI18n();
const { hasPermission } = usePermissions();
const { documents, loading, saving, error, load, save, remove, fetchOne } = useAgentDocuments();
const { settings, loadSettings, updateSetting, error: settingsError } = useSettings();

// Two cards, two endpoints, two permissions. Gating both on
// `document-manage` locked an "Office manager" holding setting-update out of
// the instructions the API would have accepted from them — and vice versa.
const canEditInstructions = computed(() => hasPermission('setting-update'));
const canManage = computed(() => hasPermission('document-manage'));

/* ---------------------------------------------------------------- instructions */

const instructions = ref('');
const instructionsInternal = ref('');
const instructionsSaving = ref(false);
const instructionsSaved = ref(false);
const instructionsError = ref<string | null>(null);

/**
 * Long enough for a real set of house rules, short enough that the answer is
 * "put it in a document". Every message carries this text, including the ones
 * it is irrelevant to.
 */
const INSTRUCTIONS_MAX = 4000;

const instructionsTooLong = computed(
  () => instructions.value.length > INSTRUCTIONS_MAX || instructionsInternal.value.length > INSTRUCTIONS_MAX,
);

const saveInstructions = async () => {
  if (instructionsTooLong.value) return;

  instructionsSaving.value = true;
  instructionsSaved.value = false;
  instructionsError.value = null;

  try {
    // updateSetting SWALLOWS its error and returns false rather than throwing,
    // so the old version showed a green "Saved" chip on a 403 or a 422. The
    // return value is the only signal there is.
    const ok =
      (await updateSetting('ai.instructions', instructions.value)) &&
      (await updateSetting('ai.instructions_internal', instructionsInternal.value));

    if (ok) {
      instructionsSaved.value = true;
    } else {
      instructionsError.value = settingsError.value ?? t('assistant.instructionsSaveFailed');
    }
  } finally {
    instructionsSaving.value = false;
  }
};

/* ------------------------------------------------------------------ documents */

const dialogOpen = ref(false);
const editing = ref<AgentDocument | null>(null);

const openNew = () => {
  editing.value = null;
  dialogOpen.value = true;
};

const openEdit = async (document: AgentDocument) => {
  // The list deliberately omits `content` — a manual has no place in a table —
  // so the edit form fetches the full record.
  editing.value = (await fetchOne(document.id)) ?? document;
  dialogOpen.value = true;
};

const onSaved = () => {
  dialogOpen.value = false;
  editing.value = null;
};

const confirmingDelete = ref<AgentDocument | null>(null);

const doDelete = async () => {
  if (!confirmingDelete.value) return;

  await remove(confirmingDelete.value.id);
  confirmingDelete.value = null;
};

const audienceColor = (audience: DocumentAudience) =>
  audience === 'published' ? 'success' : 'secondary';

onMounted(async () => {
  // Explicit load, never a side effect of calling the composable.
  await Promise.all([load(), loadSettings()]);

  const valueOf = (key: string) =>
    (settings.value?.find((s: { key: string }) => s.key === key)?.value as string | undefined) ?? '';

  instructions.value = valueOf('ai.instructions');
  instructionsInternal.value = valueOf('ai.instructions_internal');
});
</script>

<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h2 class="text-h5 mb-1">{{ t('assistant.title') }}</h2>
        <p class="text-body-2 text-medium-emphasis mb-4">{{ t('assistant.subtitle') }}</p>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable>
      {{ error }}
    </v-alert>

    <!-- Layer 1: what the assistant always knows -->
    <v-card class="mb-6" elevation="0" border>
      <v-card-item>
        <v-card-title class="text-subtitle-1">{{ t('assistant.instructionsTitle') }}</v-card-title>
        <v-card-subtitle class="text-wrap">{{ t('assistant.instructionsHelp') }}</v-card-subtitle>
      </v-card-item>

      <v-card-text>
        <v-alert v-if="instructionsError" type="error" variant="tonal" class="mb-4" closable>
          {{ instructionsError }}
        </v-alert>

        <div class="d-flex align-center ga-2 mb-1">
          <v-chip color="success" size="x-small" variant="tonal">
            {{ t('assistant.audience_published') }}
          </v-chip>
          <span class="text-caption text-medium-emphasis">{{ t('assistant.instructionsPublicHelp') }}</span>
        </div>

        <v-textarea
          v-model="instructions"
          :placeholder="t('assistant.instructionsPlaceholder')"
          :disabled="!canEditInstructions"
          :error="instructions.length > INSTRUCTIONS_MAX"
          :counter="INSTRUCTIONS_MAX"
          rows="5"
          auto-grow
          variant="outlined"
          hide-details="auto"
          class="mb-5"
        />

        <div class="d-flex align-center ga-2 mb-1">
          <v-chip color="secondary" size="x-small" variant="tonal">
            {{ t('assistant.audience_internal') }}
          </v-chip>
          <span class="text-caption text-medium-emphasis">{{ t('assistant.instructionsInternalHelp') }}</span>
        </div>

        <v-textarea
          v-model="instructionsInternal"
          :placeholder="t('assistant.instructionsInternalPlaceholder')"
          :disabled="!canEditInstructions"
          :error="instructionsInternal.length > INSTRUCTIONS_MAX"
          :counter="INSTRUCTIONS_MAX"
          rows="4"
          auto-grow
          variant="outlined"
          hide-details="auto"
        />

        <p v-if="instructionsTooLong" class="text-caption text-error mt-2">
          {{ t('assistant.instructionsTooLong') }}
        </p>
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-chip v-if="instructionsSaved" color="success" size="small" variant="tonal">
          {{ t('common.saved') }}
        </v-chip>
        <v-spacer />
        <v-btn
          color="primary"
          variant="flat"
          :loading="instructionsSaving"
          :disabled="!canEditInstructions || instructionsTooLong"
          @click="saveInstructions"
        >
          {{ t('common.actions.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Layer 2: what it can look up -->
    <v-card elevation="0" border>
      <v-card-item>
        <div class="d-flex align-center justify-space-between flex-wrap ga-2">
          <div>
            <v-card-title class="text-subtitle-1">{{ t('assistant.documentsTitle') }}</v-card-title>
            <v-card-subtitle class="text-wrap">{{ t('assistant.documentsHelp') }}</v-card-subtitle>
          </div>
          <v-btn v-if="canManage" color="primary" variant="flat" @click="openNew">
            {{ t('assistant.addDocument') }}
          </v-btn>
        </div>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />

        <v-table v-if="documents.length">
          <thead>
            <tr>
              <th>{{ t('assistant.document') }}</th>
              <th>{{ t('assistant.audience') }}</th>
              <th class="text-right"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doc in documents" :key="doc.id">
              <td>
                <div class="font-weight-medium d-flex align-center ga-2">
                  {{ doc.title }}
                  <v-icon v-if="doc.has_file" icon="mdi-paperclip" size="14" class="text-medium-emphasis" />
                  <v-chip v-if="!doc.is_active" size="x-small" variant="tonal">
                    {{ t('assistant.inactive') }}
                  </v-chip>
                </div>
                <div v-if="doc.description" class="text-caption text-medium-emphasis">
                  {{ doc.description }}
                </div>
              </td>
              <td>
                <v-chip :color="audienceColor(doc.audience)" size="small" variant="tonal">
                  {{ t(`assistant.audience_${doc.audience}`) }}
                </v-chip>
              </td>
              <td class="text-right">
                <v-btn
                  v-if="canManage"
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  @click="openEdit(doc)"
                />
                <v-btn
                  v-else
                  icon="mdi-eye"
                  size="small"
                  variant="text"
                  @click="openEdit(doc)"
                />
                <v-btn
                  v-if="canManage"
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="confirmingDelete = doc"
                />
              </td>
            </tr>
          </tbody>
        </v-table>

        <v-alert v-else-if="!loading" type="info" variant="tonal">
          {{ t('assistant.noDocuments') }}
        </v-alert>
      </v-card-text>
    </v-card>

    <AgentDocumentDialog
      v-model="dialogOpen"
      :document="editing"
      :saving="saving"
      :save="save"
      :error="error"
      :readonly="!canManage"
      @saved="onSaved"
    />

    <v-dialog v-model="confirmingDelete" max-width="420">
      <v-card v-if="confirmingDelete">
        <v-card-title class="text-subtitle-1">{{ t('assistant.deleteTitle') }}</v-card-title>
        <v-card-text>{{ t('assistant.deleteBody', { title: confirmingDelete.title }) }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmingDelete = null">{{ t('common.actions.cancel') }}</v-btn>
          <v-btn color="error" variant="flat" @click="doDelete">{{ t('common.actions.delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
