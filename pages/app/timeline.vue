<template>
    <timeline-tab :embedded="false" :unread-count="unreadCount" />
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const unreadCount = ref(0);

onLoad((options) => {
    if (options.unreadCount) {
        unreadCount.value = parseInt(options.unreadCount, 10);
    }
});
</script>

<style lang="scss">
/* Pages can have global styles but we keep it empty to delegate everything to the component */
</style>
