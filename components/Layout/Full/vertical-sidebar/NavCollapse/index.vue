<script setup>
import { Icon } from "@iconify/vue";
const props = defineProps({ item: Object, level: Number });

// Verificar permissões
const { hasPermission, isSuperAdmin } = usePermissions();

// Computed para verificar se o item deve ser exibido
const shouldShowItem = computed(() => {
  // Se não tem permissão definida, sempre mostrar
  if (!props.item.permission) {
    return true;
  }
  
  // Super admin vê tudo
  if (isSuperAdmin.value) {
    return true;
  }
  
  // Verificar permissão específica
  return hasPermission(props.item.permission);
});
</script>

<template>
  <!-- ---------------------------------------------- -->
  <!---Item Childern -->
  <!-- ---------------------------------------------- -->
  <div v-if="shouldShowItem" class="mb-1">
    <v-list-group no-action>
      <!-- ---------------------------------------------- -->
      <!---Dropdown  -->
      <!-- ---------------------------------------------- -->
      <template v-slot:activator="{ props }">
        <v-list-item
          v-bind="props"
          :value="item.title"
          :ripple="false"
          class="bg-hover-primary"
          color="primary"
        >
          <!---Icon  -->
          <template v-slot:prepend>
            <div
              class="navbox bg-hover-primary"
              color="primary"
            >
              <span class="icon-box" v-if="level > 0">
                <div class="sublink-dot" width="30"></div>
              </span>
              <span class="icon-box" v-else>
                <Icon
                  :icon="'solar:' + item.icon"
                  height="24"
                  width="24"
                  :level="level"
                  :class="
                    'position-relative z-index-2 texthover-' + item.BgColor
                  "
                />
              </span>
            </div>
          </template>
          <!---Title  -->
          <v-list-item-title class="text-subtitle-1 font-weight-medium">{{
            item.title
          }}</v-list-item-title>
          <!---If Caption-->
          <v-list-item-subtitle
            v-if="item.subCaption"
            class="text-caption mt-n1 hide-menu"
          >
            {{ item.subCaption }}
          </v-list-item-subtitle>
        </v-list-item>
      </template>
      <!-- ---------------------------------------------- -->
      <!---Sub Item-->
      <!-- ---------------------------------------------- -->
      <div class="mb-4 sublinks">
        <template
          v-for="(subitem, i) in item.children"
          :key="i"
          v-if="item.children"
        >
          <LayoutFullVerticalSidebarNavCollapse
            :item="subitem"
            v-if="subitem.children"
            :level="level + 1"
          />
          <LayoutFullVerticalSidebarDropdown
            :item="subitem"
            :level="level + 1"
            v-else
          ></LayoutFullVerticalSidebarDropdown>
        </template>
      </div>
    </v-list-group>
  </div>
  <!-- ---------------------------------------------- -->
  <!---End Item Sub Header -->
  <!-- ---------------------------------------------- -->
</template>
