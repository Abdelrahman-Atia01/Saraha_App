<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Calendar, SearchX, Trash2 } from 'lucide-vue-next'
import PageHeader from '@/components/common/PageHeader.vue'
import PageBody from '@/components/common/PageBody.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import BoxError from '@/components/messages/BoxError.vue'
import { useMessagesStore } from '@/stores/messages'
import { useToastStore } from '@/stores/toast'
import { messagesService } from '@/services/messages.service'
import { formatFullDate } from '@/utils/format'
import { errorMessage } from '@/utils/errors'

const props = defineProps({ box: String, id: String })
const messages = useMessagesStore()
const toast = useToastStore()
const router = useRouter()

const loading = ref(false)
const loadError = ref(null)
const recipientName = ref('')
const confirming = ref(false)
const deleting = ref(false)

const message = computed(() => messages.find(props.box, props.id))
const listRoute = computed(() => ({ name: props.box }))

async function load() {
  if (message.value) return
  loading.value = true
  loadError.value = null
  try { await messages.load(props.box, { force: true }) }
  catch (e) { loadError.value = e }
  finally { loading.value = false }
}

async function loadRecipient() {
  // Inbox: never call getMessage – it would send the sender's e-mail to this browser.
  // Outbox: the sender is the current user, so resolving the recipient's name is safe.
  if (props.box !== 'outbox' || !message.value) return
  try { recipientName.value = (await messagesService.getOne(props.id)).reciever?.userName || '' }
  catch { /* the name is optional */ }
}

onMounted(async () => { await load(); loadRecipient() })

async function confirmDelete() {
  if (deleting.value) return
  deleting.value = true
  try {
    await messages.remove(props.id) // list is updated only after the backend confirmed
    toast.success('تم حذف الرسالة.')
    router.replace(listRoute.value)
  } catch (e) {
    toast.error(errorMessage(e))
    confirming.value = false
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <PageHeader title="الرسالة" :back="listRoute" />

  <PageBody>
    <div v-if="loading" class="space-y-4 rounded-card bg-cream p-6 shadow-soft" role="status" aria-label="جارٍ التحميل">
      <div class="skeleton mx-auto size-20 rounded-full" />
      <div class="skeleton mx-auto h-4 w-24 rounded" />
      <div class="skeleton h-24 rounded-2xl" />
    </div>
    <BoxError v-else-if="loadError && !message" :error="loadError" @retry="load" />
    <EmptyState v-else-if="!message" :icon="SearchX" title="الرسالة غير موجودة" description="ربما حُذفت أو أن الرابط غير صحيح.">
      <AppButton :to="listRoute" variant="outline" size="sm">العودة للرسائل</AppButton>
    </EmptyState>

    <article v-else class="rounded-card bg-cream p-6 shadow-soft">
      <div class="flex flex-col items-center text-center">
        <UserAvatar size="size-20" />
        <h2 class="mt-3 text-lg font-extrabold">{{ box === 'inbox' ? 'مجهول' : recipientName ? `إلى: ${recipientName}` : 'رسالة مرسلة' }}</h2>
        <p class="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
          <Calendar class="size-4" aria-hidden="true" />
          <time :datetime="message.createdAt">{{ formatFullDate(message.createdAt) }}</time>
        </p>
      </div>

      <p class="mt-6 whitespace-pre-wrap break-words rounded-2xl bg-sand/70 p-5 text-[1.05rem] leading-8">{{ message.content }}</p>

      <div class="mt-6">
        <AppButton variant="dangerSoft" block @click="confirming = true"><Trash2 class="size-5" aria-hidden="true" />حذف</AppButton>
      </div>
    </article>

    <ConfirmDialog
      :open="confirming"
      title="هل أنت متأكد من حذف هذه الرسالة؟"
      :description="box === 'outbox' ? 'ستُحذف أيضًا من صندوق المستلم. لا يمكن التراجع عن هذا الإجراء.' : 'لا يمكن التراجع عن هذا الإجراء.'"
      confirm-label="حذف"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="confirming = false"
    />
  </PageBody>
</template>
