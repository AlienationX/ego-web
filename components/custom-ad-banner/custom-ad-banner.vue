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

        <!-- #ifdef MP-WEIXIN -->
        <view class="ad-wrapper" :class="{ 'is-loaded': isLoaded }">
            <ad :unit-id="unitId" ad-intervals="30" @load="onload" @close="onclose" @error="onerror"></ad>
        </view>
        <!-- #endif -->
    </view>
</template>

<script setup>
import { ref, computed, watch, getCurrentInstance, nextTick } from 'vue';
import { useUserStore } from '@/stores/user.js';
import { useSettingsStore } from '@/stores/settings.js';
import { useAppStore } from '@/stores/app.js';
import { getTabBarHeight } from '@/utils/layout.js';
import { AD_CONFIG } from '@/common/config.js';

const props = defineProps({
    adpid: {
        type: String,
        default: () => AD_CONFIG.app?.bannerAdpid,
    },
    unitId: {
        type: String,
        default: () => AD_CONFIG.weixin?.bannerUnitId,
    },
    isFixed: {
        type: Boolean,
        default: true,
    },
    bottomOffset: {
        type: Number,
        default: null,
    },
    hasTabBar: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['height-change', 'load', 'close', 'error']);

const calculatedBottom = computed(() => {
    if (!props.isFixed) return 'auto';
    if (typeof props.bottomOffset === 'number') return `${props.bottomOffset}px`;
    if (props.hasTabBar) return `${getTabBarHeight()}px`;
    return '0px';
});

const userStore = useUserStore();
const settingsStore = useSettingsStore();
const appStore = useAppStore();
const instance = getCurrentInstance();

const showAd = computed(() => !userStore.isVip && !!appStore.versionConfig?.ad_enabled);

const isLoaded = ref(false);
const isError = ref(false);
const currentHeight = ref(0);
const defaultBannerHeight = uni.upx2px(180);

const updateHeight = (height = 0) => {
    const rawHeight = Math.max(0, Math.round(Number(height) || 0));
    const safeBottom = uni.getWindowInfo?.()?.safeAreaInsets?.bottom || 0;
    const totalHeight = rawHeight > 0 ? rawHeight + safeBottom : 0;
    if (currentHeight.value === totalHeight) return;
    currentHeight.value = totalHeight;
    emit('height-change', totalHeight);
};

const measureActualHeight = () => {
    nextTick(() => {
        setTimeout(() => {
            const query = uni.createSelectorQuery().in(instance);
            query.select('.custom-ad-container').boundingClientRect((rect) => {
                if (rect && rect.height > 0) {
                    const measuredHeight = Math.max(0, Math.round(rect.height));
                    if (currentHeight.value === measuredHeight) return;
                    currentHeight.value = measuredHeight;
                    emit('height-change', measuredHeight);
                }
            }).exec();
        }, 150);
    });
};

// 导出 isLoaded 供父组件通过 ref 访问
defineExpose({ isLoaded });

const onload = (e) => {
    isError.value = false;
    isLoaded.value = true;
    emit('load', e);
    const fallbackHeight = Math.max(defaultBannerHeight, Number(e?.detail?.height || e?.detail?.adHeight || 0));
    updateHeight(fallbackHeight);
    measureActualHeight();
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
        padding-bottom: constant(safe-area-inset-bottom);
        padding-bottom: env(safe-area-inset-bottom);
        box-sizing: border-box;
        background: #ffffff;
        box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);

        .theme-dark & {
            background: #141416;
            box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.35);
        }
    }
}

.ad-wrapper {
    width: 100%;
    pointer-events: auto;
    transition: opacity 0.24s ease;

    &.is-loaded {
        min-height: 140rpx;
    }

    &:not(.is-loaded) {
        height: 0;
        overflow: hidden;
        opacity: 0;
        pointer-events: none;
    }
}
</style>
