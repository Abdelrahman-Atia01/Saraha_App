<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Inbox, RefreshCw, Search, Send } from 'lucide-vue-next'
import PageHeader from '@/components/common/PageHeader.vue'
import PageBody from '@/components/common/PageBody.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import AppButton from '@/components/common/AppButton.vue'
import BoxTabs from '@/components/messages/BoxTabs.vue'
import MessageItem from '@/components/messages/MessageItem.vue'
import MessageListSkeleton from '@/components/messages/MessageListSkeleton.vue'
import BoxError from '@/components/messages/BoxError.vue'
import { useMessagesStore } from '@/stores/messages'
import { useToastStore } from '@/stores/toast'

const props = defineProps({ box: { type: String, required: true } })
const messages = useMessagesStore()
const toast = useToastStore()
const state = computed(() => messages[props.box])

// Backend has no search/pagination: filtering is done client-side on the loaded list (debounced).
const query = ref('')
const applied = ref('')
let timer
watch(query, (v) => { clearTimeout(timer); timer = setTimeout(() => (applied.value = v.trim()), 200) })
onBeforeUnmount(() => clearTimeout(timer))

const visible = computed(() => {
  const q = applied.value
  return q ? state.value.items.filter((m) => m.content.includes(q)) : state.value.items
})
const firstLoad = computed(() => state.value.loading && !state.value.loaded)

async function refresh() {
  try { await messages.load(props.box, { force: true }) }
  catch (e) { if (state.value.loaded) toast.error(e.message) }
}
onMounted(() => refresh().catch(() => {}))

const empty = computed(() => props.box === 'inbox'
  ? { icon: Inbox, title: 'لا توجد رسائل واردة حاليًا', description: 'ستظهر الرسائل هنا عندما تستلم رسالة جديدة.' }
  : { icon: Send, title: 'لا توجد رسائل صادرة', description: 'ستظهر الرسائل التي ترسلها هنا.' })
</script>

<template>
  <PageHeader title="الرسائل">
    <template #actions>
      <button type="button" class="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20 lg:bg-sand lg:hover:bg-sand-dark/60" aria-label="تحديث" :disabled="state.loading" @click="refresh">
        <RefreshCw class="size-[18px]" :class="{ 'animate-spin': state.loading }" />
      </button>
    </template>
  </PageHeader>

  <PageBody>
    <div class="space-y-4">
      <BoxTabs />

      <div v-if="state.items.length" class="relative">
        <Search class="pointer-events-none absolute inset-y-0 start-3.5 my-auto size-5 text-muted" aria-hidden="true" />
        <input v-model="query" type="search" dir="auto" placeholder="ابحث في الرسائل..." aria-label="ابحث في الرسائل"
               class="h-12 w-full rounded-control border border-sand-dark/70 bg-cream ps-11 pe-4 text-[0.95rem] placeholder:text-muted/70 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/25" />
      </div>

      <div class="rounded-card bg-cream p-2 shadow-soft">
        <MessageListSkeleton v-if="firstLoad" />
        <BoxError v-else-if="state.error && !state.loaded" :error="state.error" @retry="refresh" />
        <EmptyState v-else-if="!state.items.length" v-bind="empty">
          <AppButton to="/" variant="outline" size="sm">العودة للرئيسية</AppButton>
        </EmptyState>
        <p v-else-if="!visible.length" class="px-4 py-10 text-center text-sm text-muted">لا توجد رسائل مطابقة لبحثك.</p>
        <ul v-else class="divide-y divide-sand/80">
          <li v-for="m in visible" :key="m._id"><MessageItem :message="m" :box="box" /></li>
        </ul>
      </div>
    </div>
  </PageBody>
</template>
