<template>
    <view
        v-if="showAd && !isError && !isRemoved"
        class="custom-ad-container"
        :class="[
            isFixed ? 'is-fixed' : '',
            settingsStore.isDark ? 'theme-dark' : 'theme-light',
            { 'is-loaded': isLoaded, 'is-failed': isError }
        ]"
        :style="containerStyle"
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
import { ref, computed, watch, getCurrentInstance, nextTick, onMounted, onUnmounted } from 'vue';
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
    background: {
        type: String,
        default: '',
    },
});

const emit = defineEmits(['height-change', 'load', 'close', 'error']);

const calculatedBottom = computed(() => {
    if (!props.isFixed) return 'auto';
    if (typeof props.bottomOffset === 'number') return `${props.bottomOffset}px`;
    if (props.hasTabBar) return `${getTabBarHeight()}px`;
    return '0px';
});

const containerStyle = computed(() => {
    const style = {
        bottom: calculatedBottom.value,
    };
    if (props.background) {
        style.background = props.background;
    }
    return style;
});

const userStore = useUserStore();
const settingsStore = useSettingsStore();
const appStore = useAppStore();
const instance = getCurrentInstance();

const showAd = computed(() => !userStore.isVip && !!appStore.versionConfig?.ad_enabled);

const isLoaded = ref(false);
const isError = ref(false);
const isRemoved = ref(false);
const currentHeight = ref(0);
const defaultBannerHeight = uni.upx2px(180);

let bannerTimer = null;
let timeoutTimer = null;

const clearTimers = () => {
    if (bannerTimer) {
        clearTimeout(bannerTimer);
        bannerTimer = null;
    }
    if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
    }
};

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
defineExpose({ isLoaded, isError });

const onload = (e) => {
    clearTimers();
    isError.value = false;
    isLoaded.value = true;
    emit('load', e);
    const fallbackHeight = Math.max(defaultBannerHeight, Number(e?.detail?.height || e?.detail?.adHeight || 0));
    updateHeight(fallbackHeight);
    measureActualHeight();
};

const onclose = (e) => {
    clearTimers();
    updateHeight(0);
    isError.value = true;
    isLoaded.value = false;
    bannerTimer = setTimeout(() => {
        emit('close', e);
        isRemoved.value = true;
    }, 300);
};

const onerror = (e) => {
    clearTimers();
    updateHeight(0);
    isError.value = true;
    isLoaded.value = false;
    bannerTimer = setTimeout(() => {
        emit('error', e);
        isRemoved.value = true;
    }, 300);
};

onMounted(() => {
    // #ifdef APP
    // APP 端 3 秒超时强制熔断器，避免原生 ad 挂起阻断触控
    timeoutTimer = setTimeout(() => {
        if (!isLoaded.value && !isError.value) {
            // console.warn('[CustomAdBanner] 3000ms 加载超时，触发强制熔断与物理销毁');
            onerror({ detail: { errMsg: 'timeout 3000ms' } });
        }
    }, 3000);
    // #endif
});

onUnmounted(() => {
    clearTimers();
});

watch(showAd, (visible) => {
    if (!visible) {
        clearTimers();
        isLoaded.value = false;
        isError.value = false;
        isRemoved.value = false;
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

    &:not(.is-loaded) {
        position: absolute !important;
        top: -9999rpx !important;
        left: -9999rpx !important;
        width: 0 !important;
        height: 0 !important;
        min-height: 0 !important;
        opacity: 0 !important;
        pointer-events: none !important;
        overflow: hidden !important;
    }

    &.is-failed {
        display: none !important;
        height: 0 !important;
        opacity: 0 !important;
        pointer-events: none !important;
    }

    &.is-fixed {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        padding-bottom: constant(safe-area-inset-bottom);
        padding-bottom: env(safe-area-inset-bottom);
        box-sizing: border-box;
        background: transparent;
        box-shadow: none;

        &.theme-dark {
            background: transparent;
            box-shadow: none;
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
        position: absolute !important;
        top: -9999rpx !important;
        left: -9999rpx !important;
        width: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
    }
}
</style>
