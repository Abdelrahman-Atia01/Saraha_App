<template>
  <nav class="grid grid-cols-2 gap-1 rounded-2xl bg-sand p-1 text-sm font-bold" aria-label="نوع الرسائل">
    <RouterLink to="/inbox" class="rounded-xl py-2.5 text-center transition" active-class="bg-forest-800 text-white shadow-soft" inactive-class="text-charcoal/70 hover:text-charcoal">واردة</RouterLink>
    <RouterLink to="/outbox" class="rounded-xl py-2.5 text-center transition" active-class="bg-forest-800 text-white shadow-soft" inactive-class="text-charcoal/70 hover:text-charcoal">صادرة</RouterLink>
  </nav>
</template>
