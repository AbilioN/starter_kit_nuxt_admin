<template>
  <div>
    <h3 class="mb-4">Select Permissions</h3>
    
    <div v-if="loading" class="text-center py-4">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <p class="mt-2">Loading permissions...</p>
    </div>
    
    <v-expansion-panels v-else variant="accordion" multiple>
      <v-expansion-panel
        v-for="(perms, resource) in groupedPermissions" 
        :key="resource"
      >
        <v-expansion-panel-title>
          <div class="d-flex align-center justify-space-between w-100">
            <span class="font-weight-bold text-h6">{{ formatResourceName(resource) }}</span>
            <v-chip color="primary" size="small" class="mr-4">
              {{ getSelectedCount(resource, perms) }} / {{ perms.length }}
            </v-chip>
          </div>
        </v-expansion-panel-title>
        
        <v-expansion-panel-text>
          <div class="mb-3">
            <v-btn
              size="small"
              :color="isAllSelected(resource, perms) ? 'error' : 'primary'"
              variant="tonal"
              @click.stop="toggleAll(resource, perms)"
            >
              <v-icon start>{{ isAllSelected(resource, perms) ? 'mdi-checkbox-multiple-blank-outline' : 'mdi-checkbox-multiple-marked' }}</v-icon>
              {{ isAllSelected(resource, perms) ? 'Deselect All' : 'Select All' }}
            </v-btn>
          </div>
          
          <v-row>
            <v-col 
              v-for="permission in perms" 
              :key="permission.id"
              cols="12" sm="6"
            >
              <v-checkbox
                v-model="selectedPermissions"
                :value="permission.id"
                hide-details
                density="compact"
                color="primary"
              >
                <template v-slot:label>
                  <div>
                    <div class="font-weight-medium">{{ permission.name }}</div>
                    <div class="text-caption text-medium-emphasis">{{ permission.description }}</div>
                  </div>
                </template>
              </v-checkbox>
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup lang="ts">
import type { Permission } from '~/types/api';

const props = defineProps<{
  modelValue: number[];
  groupedPermissions: Record<string, Permission[]>;
  loading: boolean;
  formatResourceName: (resource: string) => string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number[]): void;
}>();

// Computed bidirectional para v-model
const selectedPermissions = computed({
  get: () => props.modelValue,
  set: (value: number[]) => emit('update:modelValue', value)
});

// Função para obter contagem de selecionados
const getSelectedCount = (resource: string, perms: Permission[]): number => {
  return perms.filter((p: Permission) => props.modelValue.includes(p.id)).length;
};

// Função para verificar se todas estão selecionadas
const isAllSelected = (resource: string, perms: Permission[]): boolean => {
  if (perms.length === 0) return false;
  const permissionIds = perms.map((p: Permission) => p.id);
  return permissionIds.every((id: number) => props.modelValue.includes(id));
};

// Função para selecionar/desselecionar todas
const toggleAll = (resource: string, perms: Permission[]) => {
  const permissionIds = perms.map((p: Permission) => p.id);
  const allSelected = permissionIds.every((id: number) => props.modelValue.includes(id));
  
  let newValue: number[];
  
  if (allSelected) {
    // Desselecionar todas deste recurso
    newValue = props.modelValue.filter((id: number) => !permissionIds.includes(id));
  } else {
    // Selecionar todas (adicionar apenas as que não estão)
    const newPermissions = permissionIds.filter((id: number) => !props.modelValue.includes(id));
    newValue = [...props.modelValue, ...newPermissions];
  }
  
  emit('update:modelValue', newValue);
};
</script>
