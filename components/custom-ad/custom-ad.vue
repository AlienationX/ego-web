<template>
    <view
        v-if="canShowAd && !isFailed && !isClosed && !isRemoved"
        class="custom-ad-container"
        :class="[
            `custom-ad-container--${direction}`,
            settingsStore.isDark ? 'theme-dark' : 'theme-light',
            { 'is-loaded': isLoaded, 'is-failed': isFailed, 'is-closed': isClosed }
        ]"
        :style="containerStyle"
    >
        <view class="custom-ad-card" :style="cardStyle">
            <!-- 竖版广告加载中的占位骨架（固定高度，避免布局抖动） -->
            <view
                v-if="direction === 'vertical' && !isLoaded && !isFailed && !isClosed"
                class="custom-ad-skeleton"
            ></view>

            <!-- #ifdef MP-WEIXIN -->
            <ad-custom
                v-if="effectiveUnitId && !isRemoved"
                class="custom-ad-content"
                :unit-id="effectiveUnitId"
                @load="handleLoad"
                @error="handleError"
            />
            <!-- #endif -->
        </view>
    </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '@/stores/user.js';
import { useAppStore } from '@/stores/app.js';
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
    // 手动指定的 App 广告位 ID（保留兼顾历史调用兼容，App 端已彻底停用广告）
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
    // 控制是否处于激活状态（用于宿主页面 onHide/onShow 或转场时主动避让）
    active: {
        type: Boolean,
        default: true,
    },
});

const emit = defineEmits(['load', 'error', 'close']);

const userStore = useUserStore();
const appStore = useAppStore();
const settingsStore = useSettingsStore();

const isLoaded = ref(false);
const isFailed = ref(false);
const isClosed = ref(false);
// 广告失败/关闭后彻底卸载原生组件（原生组件在 display:none 容器内仍可能残留渲染层资源，导致后续页面白屏）
const isRemoved = ref(false);

// 微信端生效 unitId
const effectiveUnitId = computed(() => {
    if (props.unitId) return props.unitId;
    return props.direction === 'vertical'
        ? AD_CONFIG.weixin?.customVerticalUnitId
        : AD_CONFIG.weixin?.customHorizontalUnitId;
});

// 是否满足基础展示条件：仅在微信小程序端展示（非 VIP、后台开启广告功能 且 配置了广告位）
const canShowAd = computed(() => {
    // #ifdef MP-WEIXIN
    if (userStore.isVip) return false;
    if (appStore.versionConfig?.ad_enabled === false) return false;
    return !!effectiveUnitId.value;
    // #endif
    // #ifndef MP-WEIXIN
    return false;
    // #endif
});

// 计算容器与卡片高度（竖屏默认 620rpx，按 1.8 比例对应 345rpx 列宽：345 * 1.8 ≈ 620rpx）
const containerHeight = computed(() => {
    if (props.height) return props.height;
    return props.direction === 'vertical' ? '620rpx' : 'auto';
});

const containerStyle = computed(() => {
    if (isFailed.value || isClosed.value) {
        return { display: 'none', height: '0px' };
    }
    // 竖版广告：加载中与加载后都占固定高度，加载成功仅替换内容，避免瀑布流布局跳动
    if (props.direction === 'vertical') {
        return {
            '--ad-height': containerHeight.value,
            height: containerHeight.value,
        };
    }
    if (!isLoaded.value) return {};
    return {
        '--ad-height': containerHeight.value,
        height: 'auto',
    };
});

const cardStyle = computed(() => {
    if (isFailed.value || isClosed.value) {
        return { display: 'none', height: '0px' };
    }
    const style = {};
    style.borderRadius = props.borderRadius;
    if (props.background) {
        style.background = props.background;
    }
    if (props.direction === 'vertical') {
        style.height = containerHeight.value;
    }
    return style;
});

let noticeTimer = null;

const clearTimers = () => {
    if (noticeTimer) {
        clearTimeout(noticeTimer);
        noticeTimer = null;
    }
};

const handleLoad = (e) => {
    clearTimers();
    isLoaded.value = true;
    isFailed.value = false;
    emit('load', e);
};

const handleError = (e) => {
    clearTimers();
    isFailed.value = true;
    isLoaded.value = false;
    // 关键修复：立即同步卸载原生组件，强制释放 Native Surface，杜绝透明层拦截点击与阻塞路由转场
    isRemoved.value = true;
    emit('error', e);
};

const handleClose = (e) => {
    clearTimers();
    isClosed.value = true;
    isLoaded.value = false;
    isRemoved.value = true;
    emit('close', e);
};

onMounted(() => {
    // #ifndef MP-WEIXIN
    // 非微信小程序平台（如 App、H5）彻底停用广告，立即触发 error 向上通知宿主容器卸载外层占位包裹
    if (!canShowAd.value) {
        isFailed.value = true;
        isRemoved.value = true;
        emit('error', { detail: { errMsg: 'ad disabled on non-weixin platform' } });
    }
    // #endif
});

onUnmounted(() => {
    clearTimers();
});

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
    position: relative;

    &:not(.is-loaded) {
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1);
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
        height: var(--ad-height, 620rpx);
        min-height: var(--ad-height, 620rpx);

        // 竖版广告无论加载前后均保持固定高度占位，避免瀑布流布局闪烁
        &:not(.is-loaded) {
            opacity: 1;
            pointer-events: auto;

            .custom-ad-content {
                opacity: 0;
                pointer-events: none;
            }
        }

        .custom-ad-card {
            width: 100%;
            height: 100%;
            display: block;
            box-sizing: border-box;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            position: relative;
        }

        .custom-ad-content {
            width: 100% !important;
            height: 100% !important;
            display: block;
        }

        .custom-ad-skeleton {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            border-radius: 28rpx;
            background: linear-gradient(90deg,
                    rgba(148, 163, 184, 0.12) 25%,
                    rgba(148, 163, 184, 0.24) 50%,
                    rgba(148, 163, 184, 0.12) 75%);
            background-size: 200% 100%;
            animation: custom-ad-shimmer 1.6s infinite linear;
            z-index: 1;
        }
    }
}

@keyframes custom-ad-shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

.custom-ad-card {
    width: 100%;
    line-height: 1;
    overflow: hidden;
    // 基础面板底色与阴影（微信端横版卡片/通栏使用）
    background: rgba(24, 36, 49, 0.92);
    box-shadow:
        0 10rpx 24rpx rgba(0, 0, 0, 0.18),
        0 20rpx 40rpx rgba(0, 0, 0, 0.12);

    .theme-light & {
        background: #f8fafc;
        box-shadow: 0 6rpx 18rpx rgba(15, 23, 42, 0.05);
    }

    .custom-ad-content {
        width: 100% !important;
        overflow: hidden;
        display: block;
        line-height: 1;
    }
}
</style>
