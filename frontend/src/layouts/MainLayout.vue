<script setup>
import SidebarNav from '@/components/layout/SidebarNav.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import ConfirmLogout from '@/components/layout/ConfirmLogout.vue'
import { useLogout } from '@/composables/useLogout'

const { confirming, logout } = useLogout()
</script>

<template>
  <div class="min-h-dvh lg:flex">
    <SidebarNav @logout="confirming = true" />
    <div class="min-w-0 flex-1 pb-28 lg:pb-12">
      <main id="main">
        <RouterView v-slot="{ Component, route }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="route.path" />
          </Transition>
        </RouterView>
      </main>
    </div>
    <BottomNav />
    <ConfirmLogout :open="confirming" @confirm="logout" @cancel="confirming = false" />
  </div>
</template>
