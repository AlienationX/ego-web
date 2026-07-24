<template>
    <view
        v-if="showAd && !isError"
        class="custom-ad-container"
        :class="[isFixed ? 'is-fixed' : '', settingsStore.isDark ? 'theme-dark' : 'theme-light']"
        :style="{ bottom: calculatedBottom }"
    >
        <!-- #ifdef APP -->
        <view class="ad-wrapper" :class="{ 'is-loaded': isLoaded }">
            <ad :adpid="adpid" @load="onload" @close="onclose" @error="onerror"></ad>
        </view>
        <!-- #endif -->
    </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useUserStore } from '@/stores/user.js';
import { useSettingsStore } from '@/stores/settings.js';
import { getTabBarHeight } from '@/utils/layout.js';

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
    },
});

import { USE_CUSTOM_TABBAR } from '@/common/config.js';

const calculatedBottom = computed(() => {
    if (!props.isFixed) return 'auto';
    if (props.bottomOffset > 0) return `${props.bottomOffset}px`;
    return USE_CUSTOM_TABBAR ? `${getTabBarHeight()}px` : '0px';
});

const userStore = useUserStore();
const settingsStore = useSettingsStore();

const showAd = computed(() => !userStore.isVip && userStore.showAd);

const isLoaded = ref(false);
const isError = ref(false);
const currentHeight = ref(0);
const defaultBannerHeight = uni.upx2px(200);

const updateHeight = (height = 0) => {
    const nextHeight = Math.max(0, Math.round(Number(height) || 0));
    if (currentHeight.value === nextHeight) return;
    currentHeight.value = nextHeight;
    emit('height-change', nextHeight);
};

// 导出 isLoaded 供父组件通过 ref 访问
defineExpose({ isLoaded });

const onload = (e) => {
    isError.value = false;
    isLoaded.value = true;
    emit('load', e);
    const fallbackHeight = Math.max(defaultBannerHeight, Number(e?.detail?.height || e?.detail?.adHeight || 0));
    updateHeight(fallbackHeight);
};
const onclose = (e) => {
    isError.value = true;
    isLoaded.value = false;
    updateHeight(0);
    emit('close', e);
};
const onerror = (e) => {
    isError.value = true;
    isLoaded.value = false;
    updateHeight(0);
    emit('error', e);
};

watch(showAd, (visible) => {
    if (!visible) {
        isLoaded.value = false;
        isError.value = false;
        updateHeight(0);
    }
});
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
        pointer-events: none; /* Let clicks pass through the container except for the ad */
    }
}

.ad-wrapper {
    width: 100%;
    pointer-events: auto;
    transition: opacity 0.24s ease;

    &.is-loaded {
        min-height: 180rpx;
    }

    &:not(.is-loaded) {
        height: 0;
        overflow: hidden;
        opacity: 0;
        pointer-events: none;
    }
}
</style>
