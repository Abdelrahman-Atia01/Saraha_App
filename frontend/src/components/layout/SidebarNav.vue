<script setup>
import { House, Inbox, LogOut, PenLine, Send, Settings, UserRound } from 'lucide-vue-next'
import BrandMark from '@/components/common/BrandMark.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { useAuthStore } from '@/stores/auth'

defineEmits(['logout'])
const auth = useAuthStore()
const items = [
  { to: '/', label: 'الرئيسية', icon: House, exact: true },
  { to: '/inbox', label: 'الرسائل الواردة', icon: Inbox },
  { to: '/outbox', label: 'الرسائل الصادرة', icon: Send },
  { to: '/profile', label: 'الملف الشخصي', icon: UserRound },
  { to: '/settings', label: 'الإعدادات', icon: Settings },
]
</script>

<template>
  <aside class="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col bg-forest-800 p-5 text-white lg:flex">
    <div class="flex items-center gap-3 px-2 py-3">
      <BrandMark :size="40" />
      <span class="text-2xl font-extrabold">صراحة</span>
    </div>

    <RouterLink to="/send" class="mt-6 flex h-12 items-center justify-center gap-2 rounded-control bg-ivory font-bold text-forest-800 transition hover:bg-white">
      <PenLine class="size-5" aria-hidden="true" /> رسالة جديدة
    </RouterLink>

    <nav class="mt-6 flex-1" aria-label="التنقل الرئيسي">
      <ul class="space-y-1">
        <li v-for="item in items" :key="item.to">
          <RouterLink :to="item.to" custom v-slot="{ href, navigate, isActive, isExactActive }">
            <a :href="href" class="flex h-11 items-center gap-3 rounded-control px-3.5 text-[0.95rem] font-semibold transition"
               :class="(item.exact ? isExactActive : isActive) ? 'bg-white/15' : 'text-white/75 hover:bg-white/10 hover:text-white'"
               :aria-current="(item.exact ? isExactActive : isActive) ? 'page' : undefined" @click="navigate">
              <component :is="item.icon" class="size-5" aria-hidden="true" />{{ item.label }}
            </a>
          </RouterLink>
        </li>
      </ul>
    </nav>

    <div class="border-t border-white/15 pt-4">
      <div class="flex items-center gap-3 px-1">
        <UserAvatar tone="dark" size="size-10" />
        <div class="min-w-0">
          <p class="truncate text-sm font-bold">{{ auth.user?.userName }}</p>
          <p class="truncate text-xs text-white/60" dir="ltr">{{ auth.user?.email }}</p>
        </div>
      </div>
      <button type="button" class="mt-3 flex h-11 w-full items-center gap-3 rounded-control px-3.5 text-sm font-semibold text-[#f0b8b0] transition hover:bg-white/10" @click="$emit('logout')">
        <LogOut class="size-5" aria-hidden="true" /> تسجيل الخروج
      </button>
    </div>
  </aside>
</template>
