import { http } from './http'
import { ApiError } from '@/utils/errors'

// Inbox/outbox requests use query parameters; account identity is derived from the JWT.
async function list(params) {
  const { data } = await http.get('/message/getMessages', { params })
  if (!Array.isArray(data?.message)) throw new ApiError('استجابة غير متوقعة من الخادم.', { raw: data })
  return data.message
}

export const messagesService = {
  /** POST /message/sendMessage { content, reciever }; sender is always derived from the JWT. */
  async send({ content, reciever }) {
    const { data } = await http.post('/message/sendMessage', { content, reciever })
    if (data?.result !== 'message Added Successfully' || !data.message?._id) {
      throw new ApiError('لم يؤكد الخادم إرسال الرسالة.', { raw: data })
    }
    return data.message
  },

  /** GET /message/getMessages?flag=inbox (authenticated; private sender id omitted from inbox). */
  inbox: () => list({ flag: 'inbox' }),

  /** Outbox identity is derived from the authenticated session. */
  outbox: () => list({ flag: 'outbox' }),

  /**
   * GET /message/getMessage/:id – returns the message only when the current user is sender or recipient.
   */
  async getOne(id) {
    const { data } = await http.get(`/message/getMessage/${id}`)
    if (!data?.message?._id) throw new ApiError('الرسالة غير موجودة.', { raw: data })
    return data.message
  },

  /** DELETE /message/deleteMessage/:id – only a participant can delete the message. */
  async remove(id) {
    const { data } = await http.delete(`/message/deleteMessage/${id}`)
    if (data?.message !== 'message deleted successfully') {
      throw new ApiError('الرسالة غير موجودة أو حُذفت مسبقًا.', { raw: data })
    }
    return true
  },
}
