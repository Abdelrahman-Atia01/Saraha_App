<script setup>
import { computed, onMounted } from 'vue'
import { Inbox, Send } from 'lucide-vue-next'
import PageBody from '@/components/common/PageBody.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import MessageItem from '@/components/messages/MessageItem.vue'
import MessageListSkeleton from '@/components/messages/MessageListSkeleton.vue'
import BoxError from '@/components/messages/BoxError.vue'
import StatTile from '@/components/profile/StatTile.vue'
import ShareLinkCard from '@/components/profile/ShareLinkCard.vue'
import ActivationBanner from '@/components/profile/ActivationBanner.vue'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import { toArabicNumber } from '@/utils/format'

const auth = useAuthStore()
const messages = useMessagesStore()
const inbox = messages.inbox
const outbox = messages.outbox
const recent = computed(() => inbox.items.slice(0, 4))
const firstLoad = computed(() => inbox.loading && !inbox.loaded)

const refresh = () => {
  messages.load('inbox', { force: true }).catch(() => {})
  messages.load('outbox', { force: true }).catch(() => {})
}
onMounted(refresh)
</script>

<template>
  <header class="bg-forest-800 text-white lg:bg-transparent lg:text-charcoal">
    <div class="mx-auto max-w-2xl px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))] lg:max-w-3xl lg:px-8 lg:pb-2 lg:pt-8">
      <div class="flex items-center justify-between lg:hidden">
        <RouterLink to="/profile" aria-label="الملف الشخصي"><UserAvatar tone="dark" size="size-10" /></RouterLink>
        <span class="text-2xl font-extrabold">صراحة</span>
        <RouterLink to="/send" class="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="رسالة جديدة"><Send class="size-5" /></RouterLink>
      </div>

      <div class="mt-5 flex items-center justify-between rounded-card bg-cream px-5 py-4 text-charcoal shadow-soft lg:mt-0">
        <div class="min-w-0">
          <p class="text-sm text-muted">أهلًا بك</p>
          <h1 class="truncate text-xl font-extrabold">{{ auth.user?.userName }}</h1>
        </div>
        <div class="text-center">
          <p class="text-3xl font-extrabold leading-none text-forest-800">
            <span v-if="firstLoad" class="skeleton inline-block h-8 w-8 rounded align-middle" /><template v-else>{{ toArabicNumber(inbox.items.length) }}</template>
          </p>
          <p class="mt-1 text-xs text-muted">رسالة واردة</p>
        </div>
      </div>
    </div>
  </header>

  <PageBody>
    <div class="space-y-5">
      <ActivationBanner />

      <div class="grid grid-cols-2 gap-3">
        <StatTile :value="toArabicNumber(inbox.items.length)" label="رسائل واردة" :loading="firstLoad" />
        <StatTile :value="toArabicNumber(outbox.items.length)" label="رسائل صادرة" :loading="outbox.loading && !outbox.loaded" />
      </div>

      <ShareLinkCard />

      <section aria-labelledby="recent-title">
        <div class="mb-1 flex items-center justify-between px-1">
          <h2 id="recent-title" class="font-extrabold">آخر الرسائل</h2>
          <RouterLink v-if="inbox.items.length" to="/inbox" class="text-sm font-bold text-forest-600 hover:underline">عرض الكل</RouterLink>
        </div>
        <div class="rounded-card bg-cream p-2 shadow-soft">
          <MessageListSkeleton v-if="firstLoad" :rows="3" />
          <BoxError v-else-if="inbox.error && !inbox.loaded" :error="inbox.error" @retry="refresh" />
          <EmptyState v-else-if="!recent.length" :icon="Inbox" title="لا توجد رسائل واردة حاليًا" description="ستظهر الرسائل هنا عندما تستلم رسالة جديدة. شارك رابطك ليبدأ أصدقاؤك بمراسلتك.">
            <AppButton to="/send" variant="outline" size="sm">إرسال رسالة</AppButton>
          </EmptyState>
          <ul v-else class="divide-y divide-sand/80">
            <li v-for="m in recent" :key="m._id"><MessageItem :message="m" box="inbox" /></li>
          </ul>
        </div>
      </section>
    </div>
  </PageBody>
</template>
