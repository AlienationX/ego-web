<template>
    <view
        v-if="canShowAd && !isDestroyed"
        class="custom-ad-container"
        :class="[
            `custom-ad-container--${direction}`,
            settingsStore.isDark ? 'theme-dark' : 'theme-light',
            {
                'is-loaded': isLoaded,
                'is-failed': isFailed,
                'is-closed': isClosed,
                'is-international': IS_INTERNATIONAL
            }
        ]"
        :style="containerStyle"
    >
        <!-- 骨架占位底座：加载完成前全显，加载后作为底座垫底，杜绝 App 原生模板未上屏前的透明空洞 -->
        <view
            v-if="!isSkeletonRemoved"
            class="custom-ad-skeleton"
            :class="{ 'is-covered': isLoaded }"
            :style="skeletonStyle"
        >
            <text class="custom-ad-watermark">{{ isEn ? 'AD' : '广告' }}</text>
        </view>

        <view
            class="custom-ad-card"
            :class="{ 'is-hidden': !isLoaded }"
            :style="cardStyle"
        >
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
                v-if="effectiveAdpid && !isRemoved && active"
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
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/user.js';
import { useAppStore } from '@/stores/app.js';
import { useSettingsStore } from '@/stores/settings.js';
import { AD_CONFIG, IS_INTERNATIONAL } from '@/common/config.js';

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
    // 控制是否处于激活状态（用于宿主页面 onHide/onShow 或转场时主动避让）
    active: {
        type: Boolean,
        default: true,
    },
});

const emit = defineEmits(['load', 'error', 'close']);

const { locale } = useI18n();
const isEn = computed(() => locale.value === 'en');

const userStore = useUserStore();
const appStore = useAppStore();
const settingsStore = useSettingsStore();

const isLoaded = ref(false);
const isFailed = ref(false);
const isClosed = ref(false);
// 广告失败/关闭后彻底卸载原生组件（原生组件在 display:none 容器内仍可能残留渲染层资源，导致后续页面白屏）
const isRemoved = ref(false);
// 骨架占位层彻底销毁标志（在广告加载完成 1.2s 后销毁，避免常驻占用 GPU）
const isSkeletonRemoved = ref(false);
// 容器彻底销毁标志（在折叠动画结束后完全销毁 DOM）
const isDestroyed = ref(false);

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

// 是否满足基础展示条件（非 VIP、后台开启广告功能 且 对应端配置了广告位）
const canShowAd = computed(() => {
    if (userStore.isVip) return false;
    if (appStore.versionConfig?.ad_enabled === false) return false;
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

// 计算容器与占位高度：
// - 竖屏默认 620rpx
// - 横屏：微信小程序端与国内 App 端大卡片标准为 380rpx；
//   国际版（Google AdMob 自适应横版/Native Express 模板，左图标中文字右按钮）：精准匹配 212rpx，彻底消除黑边空隙与抖动
const containerHeight = computed(() => {
    if (props.height) return props.height;
    if (props.direction === 'vertical') return '620rpx';
    if (IS_INTERNATIONAL) return '212rpx';
    return '380rpx';
});

const containerStyle = computed(() => {
    if (isDestroyed.value) {
        return { display: 'none', height: '0px' };
    }
    if (isFailed.value || isClosed.value) {
        return {
            '--ad-height': '0px',
            minHeight: '0px',
            maxHeight: '0px',
            overflow: 'hidden',
        };
    }
    if (props.direction === 'vertical') {
        return {
            '--ad-height': containerHeight.value,
            height: containerHeight.value,
        };
    }
    return {
        '--ad-height': containerHeight.value,
        minHeight: containerHeight.value,
    };
});

const skeletonStyle = computed(() => {
    return {
        width: '100%',
        height: containerHeight.value,
        borderRadius: props.borderRadius || '28rpx',
    };
});

const cardStyle = computed(() => {
    if (isFailed.value || isClosed.value) {
        return { display: 'none', height: '0px' };
    }
    const style = {
        borderRadius: props.borderRadius || '28rpx',
    };
    // #ifndef APP
    if (props.background) {
        style.background = props.background;
    }
    // #endif
    if (props.direction === 'vertical') {
        style.height = containerHeight.value;
    }
    return style;
});

// App 端原生 ad 标签的具体样式（确保传递明确的高度值，避免原生 SDK 无法获取高度而崩溃）
const appAdStyle = computed(() => {
    const style = {
        width: '100%',
    };
    if (props.direction === 'vertical') {
        style.height = containerHeight.value;
    } else {
        style.minHeight = containerHeight.value;
    }
    return style;
});

let noticeTimer = null;
let timeoutTimer = null;
let skeletonTimer = null;
let destroyTimer = null;

const clearTimers = () => {
    if (noticeTimer) {
        clearTimeout(noticeTimer);
        noticeTimer = null;
    }
    if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
    }
    if (skeletonTimer) {
        clearTimeout(skeletonTimer);
        skeletonTimer = null;
    }
    if (destroyTimer) {
        clearTimeout(destroyTimer);
        destroyTimer = null;
    }
};

const handleLoad = (e) => {
    clearTimers();
    isLoaded.value = true;
    isFailed.value = false;
    // 保持底座骨架垫底 1.2s，确保原生视图已完全完成绘制并覆盖底座，再优雅卸载骨架动画节约 GPU
    skeletonTimer = setTimeout(() => {
        isSkeletonRemoved.value = true;
    }, 1200);
    emit('load', e);
};

const handleError = (e) => {
    clearTimers();
    isFailed.value = true;
    isLoaded.value = false;
    // 关键修复：立即同步卸载原生组件，强制释放 Native Surface，杜绝透明层拦截点击与阻塞路由转场
    isRemoved.value = true;
    // 待 380ms 优雅折叠收起动画播放完毕后再完全移除容器节点
    destroyTimer = setTimeout(() => {
        isDestroyed.value = true;
    }, 380);
    emit('error', e);
};

const handleClose = (e) => {
    clearTimers();
    isClosed.value = true;
    isLoaded.value = false;
    isRemoved.value = true;
    destroyTimer = setTimeout(() => {
        isDestroyed.value = true;
    }, 380);
    emit('close', e);
};

onMounted(() => {
    if (!canShowAd.value) {
        isFailed.value = true;
        isRemoved.value = true;
        isDestroyed.value = true;
        emit('error', { detail: { errMsg: 'ad disabled on current platform' } });
        return;
    }

    // #ifdef APP
    // 超时强制熔断器：APP 端若 3 秒内未触发 @load，视为加载失败/未填充，强制销毁原生组件以防原生视图阻断触控
    timeoutTimer = setTimeout(() => {
        if (!isLoaded.value && !isFailed.value && !isClosed.value) {
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
    position: relative;
    max-height: 1200rpx;
    transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                opacity 0.25s ease,
                margin 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                padding 0.35s cubic-bezier(0.4, 0, 0.2, 1);

    &.is-loaded {
        opacity: 1;
    }

    &.is-failed,
    &.is-closed {
        max-height: 0 !important;
        min-height: 0 !important;
        opacity: 0 !important;
        margin-top: 0 !important;
        margin-bottom: 0 !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        pointer-events: none !important;
        overflow: hidden !important;
    }

    &--vertical {
        width: 100%;
        height: var(--ad-height, 620rpx);
        min-height: var(--ad-height, 620rpx);

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
    }
}

.custom-ad-skeleton {
    width: 100%;
    height: var(--ad-height, 380rpx);
    min-height: var(--ad-height, 380rpx);
    border-radius: 28rpx;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;

    /* #ifdef APP */
    .custom-ad-container--horizontal & {
        width: 100% !important;
        height: var(--ad-height, 380rpx) !important;
        min-height: var(--ad-height, 380rpx) !important;
    }

    .custom-ad-container--horizontal.is-international & {
        height: var(--ad-height, 212rpx) !important;
        min-height: var(--ad-height, 212rpx) !important;
    }
    /* #endif */

    // 当真实广告触发 @load 后，骨架垫底作为底座，延迟渐隐并淡出，杜绝原生组件准备期透明空洞
    &.is-covered {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        height: 100% !important;
        min-height: 100% !important;
        pointer-events: none;
        z-index: 1;
        opacity: 0;
        transition: opacity 0.5s ease 0.4s;
    }

    background: linear-gradient(
        90deg,
        rgba(148, 163, 184, 0.10) 25%,
        rgba(148, 163, 184, 0.22) 50%,
        rgba(148, 163, 184, 0.10) 75%
    );
    background-size: 200% 100%;
    animation: custom-ad-shimmer 1.6s infinite linear;

    .theme-light & {
        background: linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.04) 25%,
            rgba(0, 0, 0, 0.08) 50%,
            rgba(0, 0, 0, 0.04) 75%
        );
        background-size: 200% 100%;
    }
}

// 骨架卡片正中间文字：扁平纯文本无背景，中文“广告”，英文“AD”
.custom-ad-watermark {
    font-size: 26rpx;
    font-weight: 600;
    letter-spacing: 6rpx;
    color: var(--text-tertiary);
    opacity: 0.65;
    pointer-events: none;
    user-select: none;
    text-align: center;
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
    position: relative;
    z-index: 2;

    &.is-hidden {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        opacity: 0 !important;
        pointer-events: none !important;
        z-index: -1 !important;
    }

    /* #ifndef APP */
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
    /* #endif */

    /* #ifdef APP */
    // APP 端原生广告底座透明
    background: transparent !important;
    box-shadow: none !important;
    overflow: hidden;

    .custom-ad-container--horizontal:not(.is-international) & {
        overflow: hidden;
        // 国内版原生广告 SDK 模板（穿山甲/优量汇）内部自带约 14rpx 透明内边距，向左右外扩 14rpx 精准抵消，使图文素材两端对齐宿主容器
        width: calc(100% + 28rpx) !important;
        margin-left: -14rpx !important;
        margin-right: -14rpx !important;
    }

    .custom-ad-container--horizontal.is-international & {
        overflow: hidden;
        // 国际版 Google AdMob 自适应横版模板无 14rpx 内边距，100% 居中贴合宿主容器
        width: 100% !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
    }
    /* #endif */

    .custom-ad-content {
        width: 100% !important;
        overflow: hidden;
        display: block;
        line-height: 1;
        border-radius: inherit;
    }
}
</style>
