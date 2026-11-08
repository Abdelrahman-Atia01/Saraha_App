<script setup>
import { House, Inbox, PenLine, Send, UserRound } from 'lucide-vue-next'

const left = [
  { to: '/', label: 'الرئيسية', icon: House, exact: true },
  { to: '/inbox', label: 'واردة', icon: Inbox },
]
const right = [
  { to: '/outbox', label: 'صادرة', icon: Send },
  { to: '/profile', label: 'الملف الشخصي', icon: UserRound },
]
</script>

<template>
  <nav class="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-sand-dark/60 bg-cream/95 backdrop-blur lg:hidden" aria-label="التنقل الرئيسي">
    <ul class="mx-auto grid max-w-lg grid-cols-5 items-end px-2 pb-1.5 pt-2">
      <li v-for="item in left" :key="item.to">
        <RouterLink :to="item.to" custom v-slot="{ href, navigate, isActive, isExactActive }">
          <a :href="href" class="flex flex-col items-center gap-0.5 py-1 text-[0.7rem] font-semibold transition"
             :class="(item.exact ? isExactActive : isActive) ? 'text-forest-800' : 'text-muted'"
             :aria-current="(item.exact ? isExactActive : isActive) ? 'page' : undefined" @click="navigate">
            <component :is="item.icon" class="size-6" aria-hidden="true" />{{ item.label }}
          </a>
        </RouterLink>
      </li>
      <li class="flex justify-center">
        <RouterLink to="/send" class="-mt-7 grid size-14 place-items-center rounded-full bg-forest-800 text-white shadow-lg ring-4 ring-cream transition active:scale-95" aria-label="رسالة جديدة">
          <PenLine class="size-6" aria-hidden="true" />
        </RouterLink>
      </li>
      <li v-for="item in right" :key="item.to">
        <RouterLink :to="item.to" custom v-slot="{ href, navigate, isActive }">
          <a :href="href" class="flex flex-col items-center gap-0.5 py-1 text-[0.7rem] font-semibold transition"
             :class="isActive ? 'text-forest-800' : 'text-muted'" :aria-current="isActive ? 'page' : undefined" @click="navigate">
            <component :is="item.icon" class="size-6" aria-hidden="true" />{{ item.label }}
          </a>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
