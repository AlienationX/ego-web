<template>
    <view
        v-if="canShowAd"
        class="custom-ad-container"
        :class="[
            `custom-ad-container--${direction}`,
            settingsStore.isDark ? 'theme-dark' : 'theme-light',
            { 'is-loaded': isLoaded, 'is-failed': isFailed, 'is-closed': isClosed }
        ]"
        :style="containerStyle"
    >
        <view class="custom-ad-card" :style="cardStyle">
            <!-- #ifdef MP-WEIXIN -->
            <ad-custom
                v-if="effectiveUnitId"
                class="custom-ad-content"
                :unit-id="effectiveUnitId"
                @load="handleLoad"
                @error="handleError"
            />
            <!-- #endif -->

            <!-- #ifdef APP -->
            <ad
                v-if="effectiveAdpid"
                class="custom-ad-content"
                :adpid="effectiveAdpid"
                :style="appAdStyle"
                @load="handleLoad"
                @error="handleError"
                @close="handleClose"
            />
            <!-- #endif -->
        </view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useUserStore } from '@/stores/user.js';
import { useSettingsStore } from '@/stores/settings.js';
import { AD_CONFIG } from '@/common/config.js';

const props = defineProps({
    // 广告方向/形态：horizontal（横版/网格通栏）、vertical（竖版/单列）
    direction: {
        type: String,
        default: 'horizontal',
        validator: (val) => ['horizontal', 'vertical'].includes(val),
    },
    // 自定义广告高度（选填，竖屏默认 520rpx，可自定义如 '540rpx' 或 '300px'）
    height: {
        type: String,
        default: '',
    },
    // 手动指定的微信广告位 ID（若不传则按 direction 自动从 AD_CONFIG.weixin 获取）
    unitId: {
        type: String,
        default: '',
    },
    // 手动指定的 App 广告位 ID（若不传则按 direction 自动从 AD_CONFIG.app 获取）
    adpid: {
        type: String,
        default: '',
    },
    // 卡片圆角
    borderRadius: {
        type: String,
        default: '28rpx',
    },
    // 卡片背景色（选填）
    background: {
        type: String,
        default: '',
    },
});

const emit = defineEmits(['load', 'error', 'close']);

const userStore = useUserStore();
const settingsStore = useSettingsStore();

const isLoaded = ref(false);
const isFailed = ref(false);
const isClosed = ref(false);

// 微信端生效 unitId
const effectiveUnitId = computed(() => {
    if (props.unitId) return props.unitId;
    return props.direction === 'vertical'
        ? AD_CONFIG.weixin?.customVerticalUnitId
        : AD_CONFIG.weixin?.customHorizontalUnitId;
});

// App 端生效 adpid
const effectiveAdpid = computed(() => {
    if (props.adpid) return props.adpid;
    return props.direction === 'vertical'
        ? AD_CONFIG.app?.customVerticalAdpid
        : AD_CONFIG.app?.customHorizontalAdpid;
});

// 是否满足基础展示条件（非 VIP 且对应端配置了广告位）
const canShowAd = computed(() => {
    if (userStore.isVip) return false;
    // #ifdef MP-WEIXIN
    return !!effectiveUnitId.value;
    // #endif
    // #ifdef APP
    return !!effectiveAdpid.value;
    // #endif
    // #ifndef MP-WEIXIN || APP
    return false;
    // #endif
});

// 计算容器与卡片高度（竖屏默认 520rpx）
const containerHeight = computed(() => {
    if (props.height) return props.height;
    return props.direction === 'vertical' ? '520rpx' : 'auto';
});

const containerStyle = computed(() => {
    if (isFailed.value || isClosed.value) {
        return { display: 'none', height: '0px' };
    }
    if (!isLoaded.value) return {};
    return {
        '--ad-height': containerHeight.value,
        height: props.direction === 'vertical' ? containerHeight.value : 'auto',
    };
});

const cardStyle = computed(() => {
    if (isFailed.value || isClosed.value) {
        return { display: 'none', height: '0px' };
    }
    const style = {
        borderRadius: props.borderRadius,
    };
    if (props.background) {
        style.background = props.background;
    }
    if (props.direction === 'vertical' && isLoaded.value) {
        style.height = containerHeight.value;
    }
    return style;
});

// App 端原生 ad 标签的具体样式（确保传递明确的高度值如 520rpx，避免原生 SDK 无法获取高度）
const appAdStyle = computed(() => {
    const style = {
        width: '100%',
    };
    if (props.direction === 'vertical') {
        style.height = containerHeight.value;
    }
    return style;
});

let noticeTimer = null;

const handleLoad = (e) => {
    if (noticeTimer) clearTimeout(noticeTimer);
    isLoaded.value = true;
    isFailed.value = false;
    emit('load', e);
};

const handleError = (e) => {
    console.warn(`[CustomAd ${props.direction}] 广告加载失败/未填充:`, e?.detail || e);
    isFailed.value = true;
    isLoaded.value = false;
    if (noticeTimer) clearTimeout(noticeTimer);
    // 延迟 300ms 抛出 error 事件，给 uni-app 渲染层处理原生广告异常与生命周期留出安全执行窗口，
    // 防止业务层同步销毁 DOM 导致 uni-app-view.umd.js 报 Cannot read properties of null (reading 'getBoundingClientRect')
    noticeTimer = setTimeout(() => {
        emit('error', e);
    }, 300);
};

const handleClose = (e) => {
    isClosed.value = true;
    isLoaded.value = false;
    if (noticeTimer) clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
        emit('close', e);
    }, 300);
};

defineExpose({
    isLoaded,
    isFailed,
    isClosed,
});
</script>

<style lang="scss" scoped>
.custom-ad-container {
    width: 100%;
    display: block;
    box-sizing: border-box;
    line-height: 1;

    &:not(.is-loaded) {
        opacity: 0;
        pointer-events: none;
        height: 0 !important;
        min-height: 0 !important;
        overflow: hidden !important;

        .custom-ad-card {
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            height: 0 !important;
            min-height: 0 !important;
            overflow: hidden !important;
        }
    }

    &.is-loaded {
        opacity: 1;
        transition: opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    }

    &.is-failed,
    &.is-closed {
        display: none !important;
        height: 0 !important;
        min-height: 0 !important;
        max-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        opacity: 0 !important;
        pointer-events: none !important;
        overflow: hidden !important;
    }

    &--vertical {
        width: 100%;
        height: var(--ad-height, 520rpx);

        .custom-ad-card {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            // 竖屏瀑布流单列卡片必须完全透明底色、无阴影、无边框，避免未填满或未就绪时暴露灰白大卡片
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
        }

        .custom-ad-content,
        ad,
        ad-custom,
        :deep(ad),
        :deep(ad-custom) {
            height: 100% !important;
        }
    }
}

.custom-ad-card {
    width: 100%;
    overflow: hidden;
    line-height: 1;
    // 基础面板底色与阴影（横版卡片/通栏使用）
    background: rgba(24, 36, 49, 0.92);
    box-shadow:
        0 10rpx 24rpx rgba(0, 0, 0, 0.18),
        0 20rpx 40rpx rgba(0, 0, 0, 0.12);

    .theme-light & {
        background: #f8fafc;
        box-shadow: 0 6rpx 18rpx rgba(15, 23, 42, 0.05);
    }

    .custom-ad-content,
    ad,
    ad-custom,
    :deep(ad),
    :deep(ad-custom) {
        width: 100% !important;
        overflow: hidden;
        display: block;
        line-height: 1;
    }
}
</style>
