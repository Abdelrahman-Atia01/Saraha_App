import { defineStore } from 'pinia'
import { computed, reactive } from 'vue'
import { messagesService } from '@/services/messages.service'

const emptyBox = () => ({ items: [], loading: false, loaded: false, error: null })
const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt)

export const useMessagesStore = defineStore('messages', () => {
  const boxes = reactive({ inbox: emptyBox(), outbox: emptyBox() })
  const inflight = {}

  const inbox = computed(() => boxes.inbox)
  const outbox = computed(() => boxes.outbox)

  /** Loads a box from the backend. Concurrent calls share one request; `force` refreshes. */
  async function load(box, { force = false } = {}) {
    const state = boxes[box]
    if (state.loaded && !force) return state.items
    if (inflight[box]) return inflight[box]
    state.loading = true
    state.error = null
    inflight[box] = (async () => {
      try {
        const fetcher = box === 'inbox' ? messagesService.inbox : messagesService.outbox
        state.items = (await fetcher()).sort(byNewest)
        state.loaded = true
        return state.items
      } catch (e) {
        state.error = e
        throw e
      } finally {
        state.loading = false
        inflight[box] = null
      }
    })()
    return inflight[box]
  }

  async function send(payload) {
    const message = await messagesService.send(payload)
    boxes.outbox.loaded = false // stale: next visit refetches from the server
    return message
  }

  /** Removes the row locally ONLY after the backend confirmed the deletion. */
  async function remove(id) {
    await messagesService.remove(id)
    for (const box of Object.values(boxes)) box.items = box.items.filter((m) => m._id !== id)
  }

  const find = (box, id) => boxes[box].items.find((m) => m._id === id)

  function reset() {
    boxes.inbox = emptyBox()
    boxes.outbox = emptyBox()
  }

  return { inbox, outbox, load, send, remove, find, reset }
})
