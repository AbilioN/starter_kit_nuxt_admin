<script setup lang="ts">
import { ref, shallowRef } from "vue";
import sidebarItems from "@/components/Layout/Full/vertical-sidebar/sidebarItem";
// Icon Imports
import { Menu2Icon, BellRingingIcon } from "vue-tabler-icons";
const sidebarMenu = shallowRef(sidebarItems);
const sDrawer = ref(true);
</script>

<template>
  <v-navigation-drawer
    left
    v-model="sDrawer"
    app
    class="leftSidebar bg-containerBg"
    elevation="10"
    width="270"
  >
    <div class="pa-5 pl-4">
      <LayoutFullLogoDark />
    </div>
    <!-- ---------------------------------------------- -->
    <!---Navigation -->
    <!-- ---------------------------------------------- -->
    <perfect-scrollbar class="scrollnavbar bg-containerBg overflow-y-hidden">
      <v-list class="py-4 px-4 bg-containerBg">
        <!---Menu Loop -->
        <template v-for="(item, i) in sidebarMenu">
          <!---Item Sub Header -->
          <LayoutFullVerticalSidebarNavGroup
            :item="item"
            v-if="item.header"
            :key="item.title"
          />
          <!---If Has Child -->
          <LayoutFullVerticalSidebarNavCollapse class="leftPadding" :item="item" :level="0" v-else-if="item.children" />
          <!---Single Item-->
          <LayoutFullVerticalSidebarNavItem
            :item="item"
            v-else
            class="leftPadding"
          />
          <!---End Single Item-->
        </template>
        <!-- <Moreoption/> -->
      </v-list>
    </perfect-scrollbar>
  </v-navigation-drawer>
  <div class="container verticalLayout">
    <div class="maxWidth px-xl-0 px-sm-5 px-0">
      <v-app-bar elevation="0" height="70" class="top-header">
        <div class="d-flex align-center justify-space-between w-100">
          <div>
            <v-btn
              class="hidden-lg-and-up text-muted"
              @click="sDrawer = !sDrawer"
              icon
              variant="flat"
              size="small"
            >
              <Menu2Icon size="20" stroke-width="1.5" />
            </v-btn>
            <!-- Notification -->
            <LayoutFullVerticalHeaderNotificationDD />
          </div>
          <div>
            <!-- User Profile -->
            <LayoutFullVerticalHeaderProfileDD />
          </div>
        </div>
      </v-app-bar>
    </div>
  </div>
</template>
