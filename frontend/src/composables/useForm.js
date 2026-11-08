import { reactive, ref } from 'vue'

/**
 * Tiny form helper: values + per-field errors + "touched on blur" + submit guard.
 * rules: { field: (value, values) => '' | 'error message' }
 */
export function useForm(initial, rules) {
  const values = reactive({ ...initial })
  const errors = reactive(Object.fromEntries(Object.keys(initial).map((k) => [k, ''])))
  const touched = reactive({})
  const submitting = ref(false)

  const check = (field) => (errors[field] = rules[field] ? rules[field](values[field], values) : '')
  const touch = (field) => { touched[field] = true; check(field) }
  const onInput = (field) => { if (touched[field]) check(field) }
  const validate = () => {
    let ok = true
    for (const field of Object.keys(rules)) { touched[field] = true; if (check(field)) ok = false }
    return ok
  }

  /** Runs `fn` once at a time; a second call while pending is ignored (duplicate-submit guard). */
  async function submit(fn) {
    if (submitting.value || !validate()) return
    submitting.value = true
    try { await fn({ ...values }) } finally { submitting.value = false }
  }

  return { values, errors, submitting, touch, onInput, validate, submit }
}
