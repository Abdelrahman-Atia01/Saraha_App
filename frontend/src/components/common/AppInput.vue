<script setup>
import { computed, ref, useId } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  icon: { type: [Object, Function], default: null },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: 'off' },
  inputmode: { type: String, default: undefined },
  maxlength: { type: Number, default: undefined },
  disabled: Boolean,
})
const emit = defineEmits(['update:modelValue', 'blur'])

const id = useId()
const visible = ref(false)
const isPassword = computed(() => props.type === 'password')
const inputType = computed(() => (isPassword.value && visible.value ? 'text' : props.type))
</script>

<template>
  <div>
    <label :for="id" class="mb-1.5 block text-sm font-semibold text-charcoal">{{ label }}</label>
    <div class="relative">
      <component :is="icon" v-if="icon" class="pointer-events-none absolute inset-y-0 start-3.5 my-auto size-5 text-forest-800/70" aria-hidden="true" />
      <input
        :id="id"
        :type="inputType"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :maxlength="maxlength"
        :disabled="disabled"
        :aria-invalid="!!error || undefined"
        :aria-describedby="error || hint ? `${id}-msg` : undefined"
        dir="auto"
        class="h-12 w-full rounded-control border bg-cream text-[0.95rem] text-charcoal placeholder:text-muted/70 transition focus:border-forest-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/25 disabled:opacity-60"
        :class="[icon ? 'ps-11' : 'ps-4', isPassword ? 'pe-12' : 'pe-4', error ? 'border-terracotta' : 'border-sand-dark/70']"
        @input="emit('update:modelValue', $event.target.value)"
        @blur="emit('blur')"
      />
      <button
        v-if="isPassword"
        type="button"
        class="absolute inset-y-0 end-1.5 my-auto grid size-9 place-items-center rounded-lg text-muted hover:text-forest-800"
        :aria-label="visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        <EyeOff v-if="visible" class="size-5" />
        <Eye v-else class="size-5" />
      </button>
    </div>
    <p v-if="error" :id="`${id}-msg`" class="mt-1.5 text-[0.8rem] font-medium text-terracotta" role="alert">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-msg`" class="mt-1.5 text-[0.8rem] text-muted">{{ hint }}</p>
  </div>
</template>
