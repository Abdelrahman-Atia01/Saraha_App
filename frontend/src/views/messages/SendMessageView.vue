<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Check, ShieldCheck } from 'lucide-vue-next'
import PageHeader from '@/components/common/PageHeader.vue'
import PageBody from '@/components/common/PageBody.vue'
import AppInput from '@/components/common/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useForm } from '@/composables/useForm'
import { useMessagesStore } from '@/stores/messages'
import { usersService } from '@/services/users.service'
import { MESSAGE_MAX, OBJECT_ID, validateMessage, validateRecipientId } from '@/utils/validators'
import { errorMessage } from '@/utils/errors'

const props = defineProps({ recipientId: { type: String, default: '' } })
const messages = useMessagesStore()
const router = useRouter()

const sent = ref(false)
const recipientName = ref('')
const serverError = ref('')

const { values, errors, submitting, touch, onInput, submit } = useForm(
  { reciever: props.recipientId, content: '' },
  { reciever: validateRecipientId, content: validateMessage },
)
// A shared link carries the recipient id: confirm the account exists before the user writes anything.
async function resolveRecipient() {
  recipientName.value = ''
  const id = values.reciever.trim()
  if (!OBJECT_ID.test(id)) return
  try { recipientName.value = (await usersService.getPublicProfile(id)).userName }
  catch (e) { serverError.value = errorMessage(e) }
}
onMounted(() => { if (props.recipientId) resolveRecipient() })
const remaining = computed(() => MESSAGE_MAX - values.content.length)

const onSubmit = () => submit(async (v) => {
  serverError.value = ''
  try {
    await messages.send({ content: v.content.trim(), reciever: v.reciever.trim() })
    sent.value = true // only after the backend confirmed and returned the stored message
  } catch (e) {
    serverError.value = errorMessage(e)
  }
})

function another() {
  values.content = ''
  errors.content = ''
  sent.value = false
}
</script>

<template>
  <!-- Success: shown only after a confirmed server response -->
  <div v-if="sent" class="grid min-h-dvh place-items-center bg-forest-800 px-6 text-center text-white">
    <div class="w-full max-w-sm" role="status">
      <span class="mx-auto grid size-24 place-items-center rounded-full bg-forest-600"><Check class="size-12" aria-hidden="true" /></span>
      <h1 class="mt-6 text-2xl font-extrabold">تم إرسال الرسالة بنجاح!</h1>
      <p class="mt-2 text-white/70">أكّد الخادم حفظ رسالتك.</p>
      <div class="mt-8 grid gap-3">
        <AppButton variant="onDark" block @click="router.push('/outbox')">عرض الرسائل الصادرة</AppButton>
        <AppButton variant="outline" block class="!border-white/60 !text-white hover:!bg-white/10" @click="another">إرسال رسالة أخرى</AppButton>
        <AppButton variant="ghost" block class="!text-white/80 hover:!bg-white/10" @click="router.push('/')">حسنًا</AppButton>
      </div>
    </div>
  </div>

  <template v-else>
    <PageHeader title="رسالة جديدة" back />
    <PageBody>
      <form class="space-y-5 rounded-card bg-cream p-5 shadow-soft" novalidate @submit.prevent="onSubmit">
        <p v-if="serverError" class="rounded-control bg-terracotta-soft px-4 py-3 text-sm font-medium text-terracotta" role="alert">{{ serverError }}</p>

        <AppInput v-model="values.reciever" label="معرّف المستلم" placeholder="الصق المعرّف أو افتح رابط المستلم"
                  hint="تجده في رابط الاستقبال الذي يشاركه معك المستلم." :error="errors.reciever"
                  @update:model-value="onInput('reciever'); serverError = ''" @blur="touch('reciever'); resolveRecipient()" />
        <p v-if="recipientName" class="-mt-3 text-sm font-semibold text-forest-800" role="status">إلى: {{ recipientName }}</p>

        <div>
          <label for="msg" class="mb-1.5 block text-sm font-semibold">رسالتك</label>
          <textarea
            id="msg" v-model="values.content" rows="7" dir="auto" placeholder="اكتب ما تريد قوله بصراحة..."
            :aria-invalid="!!errors.content || undefined" aria-describedby="msg-meta"
            class="w-full resize-y rounded-control border bg-white p-4 text-[1rem] leading-7 placeholder:text-muted/70 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/25"
            :class="errors.content ? 'border-terracotta' : 'border-sand-dark/70'"
            @input="onInput('content')" @blur="touch('content')"
          />
          <div id="msg-meta" class="mt-1.5 flex items-start justify-between gap-3 text-[0.8rem]">
            <p v-if="errors.content" class="font-medium text-terracotta" role="alert">{{ errors.content }}</p>
            <p v-else class="flex items-center gap-1.5 text-muted"><ShieldCheck class="size-4" aria-hidden="true" />لا يُعرض اسمك للمستلم داخل التطبيق.</p>
            <span dir="ltr" class="shrink-0 tabular-nums" :class="remaining < 0 ? 'font-bold text-terracotta' : 'text-muted'" aria-live="polite">{{ values.content.length }} / {{ MESSAGE_MAX }}</span>
          </div>
        </div>

        <AppButton type="submit" block :loading="submitting">إرسال</AppButton>
      </form>
    </PageBody>
  </template>
</template>
