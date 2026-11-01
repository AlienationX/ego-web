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

            <!-- #ifdef APP -->
            <ad
                v-if="effectiveAdpid && !isRemoved"
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
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
// 广告失败/关闭后彻底卸载原生组件（原生组件在 display:none 容器内仍可能残留渲染层资源，导致后续页面白屏）
const isRemoved = ref(false);

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
    const style = {
        borderRadius: props.borderRadius,
    };
    if (props.background) {
        style.background = props.background;
    }
    if (props.direction === 'vertical') {
        style.height = containerHeight.value;
    }
    return style;
});

// App 端原生 ad 标签的具体样式（确保传递明确的高度值如 620rpx，避免原生 SDK 无法获取高度）
const appAdStyle = computed(() => {
    const style = {
        width: '100%',
        // APP 端 ad 是原生组件，父级 overflow:hidden 无法裁剪它；圆角必须直接设置在 ad 标签上
        // （uni-app 会将样式同步到原生视图的 cornerRadius，部分版本生效，需真机验证）
        borderRadius: props.borderRadius,
    };
    if (props.direction === 'vertical') {
        style.height = containerHeight.value;
    }
    return style;
});

let noticeTimer = null;
let timeoutTimer = null;

const clearTimers = () => {
    if (noticeTimer) {
        clearTimeout(noticeTimer);
        noticeTimer = null;
    }
    if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
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
    // console.warn(`[CustomAd ${props.direction}] 广告加载失败/未填充:`, e?.detail || e);
    isFailed.value = true;
    isLoaded.value = false;
    // 延迟 300ms 抛出 error 事件并卸载原生组件，彻底释放原生渲染层资源
    noticeTimer = setTimeout(() => {
        emit('error', e);
        isRemoved.value = true;
    }, 300);
};

const handleClose = (e) => {
    clearTimers();
    isClosed.value = true;
    isLoaded.value = false;
    noticeTimer = setTimeout(() => {
        emit('close', e);
        isRemoved.value = true;
    }, 300);
};

onMounted(() => {
    // #ifdef APP
    // 超时强制熔断器：APP 端若 3 秒内未触发 @load，视为加载失败/未填充，强制销毁原生组件以防原生视图阻断触控
    timeoutTimer = setTimeout(() => {
        if (!isLoaded.value && !isFailed.value && !isClosed.value) {
            // console.warn(`[CustomAd ${props.direction}] 3000ms 加载超时，触发强制熔断与物理销毁`);
            handleError({ detail: { errMsg: 'timeout 3000ms' } });
        }
    }, 3000);
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

    &:not(.is-loaded) {
        position: absolute !important;
        top: -9999rpx !important;
        left: -9999rpx !important;
        opacity: 0 !important;
        pointer-events: none !important;
        width: 0 !important;
        height: 0 !important;
        min-height: 0 !important;
        max-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;

        .custom-ad-card {
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            width: 0 !important;
            height: 0 !important;
            min-height: 0 !important;
            overflow: hidden !important;
        }
    }

    &.is-loaded {
        position: relative;
        top: 0;
        left: 0;
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

        // 竖版广告加载中也占固定高度（覆盖上方 :not(.is-loaded) 的 height:0），仅隐藏原生组件、展示占位骨架
        &:not(.is-loaded) {
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
            opacity: 1;
            height: var(--ad-height, 620rpx) !important;
            min-height: var(--ad-height, 620rpx) !important;
            overflow: hidden !important;

            .custom-ad-card {
                width: 100% !important;
                height: 100% !important;
                min-height: 100% !important;
            }

            // 原生广告控件在未就绪前绝对定位至视口外，杜绝在骨架屏位置拦截触控
            .custom-ad-content {
                position: absolute !important;
                top: -9999rpx !important;
                left: -9999rpx !important;
                width: 0 !important;
                height: 0 !important;
                opacity: 0 !important;
                pointer-events: none !important;
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
        }

        .custom-ad-content {
            width: 100% !important;
            display: block;
        }

        .custom-ad-skeleton {
            width: 100%;
            height: 100%;
            border-radius: 28rpx;
            background: linear-gradient(90deg,
                    rgba(148, 163, 184, 0.12) 25%,
                    rgba(148, 163, 184, 0.24) 50%,
                    rgba(148, 163, 184, 0.12) 75%);
            background-size: 200% 100%;
            animation: custom-ad-shimmer 1.6s infinite linear;
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

    .custom-ad-content {
        width: 100% !important;
        overflow: hidden;
        display: block;
        line-height: 1;
    }
}
</style>
