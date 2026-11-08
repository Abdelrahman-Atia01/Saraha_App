<script setup>
import { computed } from 'vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import { formatListDate } from '@/utils/format'

const props = defineProps({ message: { type: Object, required: true }, box: { type: String, required: true } })
const title = computed(() => (props.box === 'inbox' ? 'مجهول' : 'رسالة مرسلة'))
</script>

<template>
  <RouterLink
    :to="{ name: 'message', params: { box, id: message._id } }"
    class="flex items-center gap-3.5 rounded-2xl px-3 py-3.5 transition hover:bg-sand/60 focus-visible:bg-sand/60"
  >
    <UserAvatar size="size-12" />
    <div class="min-w-0 flex-1">
      <div class="flex items-baseline justify-between gap-3">
        <h3 class="truncate font-extrabold">{{ title }}</h3>
        <time class="shrink-0 text-xs text-muted" :datetime="message.createdAt">{{ formatListDate(message.createdAt) }}</time>
      </div>
      <p class="truncate text-sm text-muted">{{ message.content }}</p>
    </div>
  </RouterLink>
</template>
