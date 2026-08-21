<script setup lang="ts">
/**
 * Permanent, unmissable marker that this panel is being driven by platform
 * support rather than by the account's own owner.
 *
 * A support session that looks exactly like a normal login is how an operator
 * forgets which account they are in — and how a customer later finds actions
 * in their audit log they cannot explain. The banner is the live half of the
 * same transparency the audit entry provides after the fact.
 */
const { state, load, stop } = useImpersonation();
const ending = ref(false);

// In onMounted, never at call time: this component lives in the layout and
// renders on every page.
onMounted(() => load());

const endSession = async () => {
  ending.value = true;
  try {
    await stop();
  } finally {
    ending.value = false;
  }
};

const expiresAtLabel = computed(() => {
  if (!state.value.expires_at) return null;
  return new Date(state.value.expires_at).toLocaleTimeString();
});
</script>

<template>
  <v-alert
    v-if="state.active"
    :color="state.can_write ? 'error' : 'warning'"
    variant="tonal"
    density="compact"
    class="rounded-0"
    border="start"
  >
    <div class="d-flex align-center justify-space-between ga-4 flex-wrap">
      <div class="text-body-2">
        <strong>Support session</strong> &mdash;
        you are viewing this workspace as <strong>{{ state.admin_name }}</strong>
        on behalf of {{ state.operator }}.
        <span v-if="state.can_write">This session <strong>can change data</strong>.</span>
        <span v-else>Read-only: changes are blocked.</span>
        <span v-if="expiresAtLabel"> Expires at {{ expiresAtLabel }}.</span>
      </div>

      <v-btn
        size="small"
        variant="flat"
        :color="state.can_write ? 'error' : 'warning'"
        :loading="ending"
        @click="endSession"
      >
        End session
      </v-btn>
    </div>
  </v-alert>
</template>
