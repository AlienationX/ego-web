<template>
    <view 
        v-if="showAd && !isError" 
        class="custom-ad-container" 
        :class="[isFixed ? 'is-fixed' : '', isDark ? 'theme-dark' : 'theme-light']"
        :style="{ bottom: isFixed ? `${bottomOffset}rpx` : 'auto' }"
    >
        <!-- #ifdef APP -->
        <view class="ad-wrapper" :class="{ 'is-loaded': isLoaded }">
            <ad :adpid="adpid" @load="onload" @close="onclose" @error="onerror"></ad>
        </view>
        <!-- #endif -->
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/user.js';
import { useSettingsStore } from '@/stores/settings.js';

const props = defineProps({
    adpid: {
        type: String,
        default: '1760125998',
    },
    isFixed: {
        type: Boolean,
        default: true,
    },
    bottomOffset: {
        type: Number,
        default: 0,
    }
});
const emit = defineEmits(['load', 'close', 'error']);

const userStore = useUserStore();
const settingsStore = useSettingsStore();

const showAd = computed(() => !userStore.isVip && userStore.showAd);
const isDark = computed(() => settingsStore.isDark);

const isLoaded = ref(false);
const isError = ref(false);

// 导出 isLoaded 供父组件通过 ref 访问
defineExpose({ isLoaded });

const onload = (e) => {
    isLoaded.value = true;
    emit('load', e);
};
const onclose = (e) => {
    isError.value = true;
    isLoaded.value = false;
    emit('close', e);
};
const onerror = (e) => {
    isError.value = true;
    isLoaded.value = false;
    emit('error', e);
};
</script>

<style lang="scss" scoped>
.custom-ad-container {
    width: 100%;
    position: relative;
    z-index: 100;
    display: flex;
    justify-content: center;
    background: transparent;

    &.is-fixed {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        padding-bottom: env(safe-area-inset-bottom);
        pointer-events: none; /* Let clicks pass through the container except for the ad */
    }
}

.ad-wrapper {
    width: 100%;
    pointer-events: auto;
    transition: opacity 0.24s ease;

    &:not(.is-loaded) {
        height: 0;
        overflow: hidden;
        opacity: 0;
        pointer-events: none;
    }
}
</style>
