import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const routes = [
  { path: '/welcome', name: 'welcome', component: () => import('@/views/auth/WelcomeView.vue'), meta: { guest: true } },
  { path: '/login', name: 'login', component: () => import('@/views/auth/LoginView.vue'), meta: { guest: true } },
  { path: '/register', name: 'register', component: () => import('@/views/auth/RegisterView.vue'), meta: { guest: true } },
  { path: '/forgot-password', name: 'forgot-password', component: () => import('@/views/auth/ForgotPasswordView.vue'), meta: { guest: true } },
  { path: '/reset-password/:token', name: 'reset-password', component: () => import('@/views/auth/ResetPasswordView.vue') },
  { path: '/activate/:token', name: 'activate', component: () => import('@/views/auth/ActivateView.vue') },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('@/views/dashboard/DashboardView.vue') },
      { path: 'inbox', name: 'inbox', component: () => import('@/views/messages/MessagesView.vue'), props: { box: 'inbox' } },
      { path: 'outbox', name: 'outbox', component: () => import('@/views/messages/MessagesView.vue'), props: { box: 'outbox' } },
      { path: 'messages/:box(inbox|outbox)/:id', name: 'message', component: () => import('@/views/messages/MessageDetailView.vue'), props: true },
      { path: 'send/:recipientId?', name: 'send', component: () => import('@/views/messages/SendMessageView.vue'), props: true },
      { path: 'profile', name: 'profile', component: () => import('@/views/profile/ProfileView.vue') },
      { path: 'settings', name: 'settings', component: () => import('@/views/settings/SettingsView.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (_to, _from, saved) => saved || { top: 0 },
})

// Only allow same-app redirects (avoids open-redirect via ?redirect=https://evil.example).
export const safeRedirect = (value) => (typeof value === 'string' && /^\/(?!\/)/.test(value) ? value : '/')

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()

  // A token that expired while the tab was open: drop it instead of silently showing stale pages.
  if (auth.token && !auth.isAuthenticated) {
    auth.logout()
    useToastStore().error('انتهت صلاحية تسجيل الدخول، سجل دخولك مرة تانية.')
  }

  if (to.meta.requiresAuth || to.matched.some((r) => r.meta.requiresAuth)) {
    if (!auth.isAuthenticated) {
      return to.fullPath === '/' ? { name: 'welcome' } : { name: 'login', query: { redirect: to.fullPath } }
    }
  }
  if (to.meta.guest && auth.isAuthenticated) return safeRedirect(to.query.redirect)
})

export default router
