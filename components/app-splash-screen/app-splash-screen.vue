<template>
    <view v-if="showSplash" class="splash-screen" :class="[
        settingsStore.isDark ? 'theme-dark' : 'theme-light',
        { 'is-closing': isClosing }
    ]">
        <!-- 柔和环境光斑 -->
        <view class="splash-glow splash-glow--primary"></view>
        <view class="splash-glow splash-glow--secondary"></view>

        <!-- 中央品牌标志与标语 -->
        <view class="splash-brand">
            <view class="logo-box">
                <view class="logo-aura"></view>
                <image class="logo-img" src="/static/logo.svg" mode="aspectFit"></image>
            </view>

            <view class="brand-text">
                <text class="brand-name">Ego Wallpapers</text>
                <text class="brand-slogan">{{ isEn ? 'Explore wallpapers, explore yourself' : '探索壁纸，亦探索自我' }}</text>
            </view>
        </view>

        <!-- 底部微流光加载条 -->
        <view class="splash-footer">
            <view class="loading-bar">
                <view class="loading-bar__fill"></view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSettingsStore } from '@/stores/settings.js';
import { useI18n } from 'vue-i18n';

const emit = defineEmits(['finish']);
const settingsStore = useSettingsStore();
const { locale } = useI18n();
const isEn = computed(() => locale.value === 'en');

// Session 级别的单次播放控制标记（模块作用域变量，仅在冷启动时首次为 false）
const hasShownSplashInSession = ref(typeof getApp === 'function' && getApp()?.globalData?.hasShownSplash);

const showSplash = ref(!hasShownSplashInSession.value);
const isClosing = ref(false);

// 关键：在组件初始化阶段立即隐藏 TabBar，确保首帧就是纯粹的全屏启动效果
if (showSplash.value) {
    uni.hideTabBar({ animation: false, fail: () => {} });
}

onMounted(() => {
    if (!showSplash.value) {
        return;
    }

    // 确保 TabBar 处于隐藏状态
    uni.hideTabBar({ animation: false, fail: () => {} });

    // 标记当前 Session 已播放过启动动画
    if (typeof getApp === 'function' && getApp()?.globalData) {
        getApp().globalData.hasShownSplash = true;
    }

    // #ifdef APP-PLUS
    // 延迟 50ms 关闭原生启动图，与 Vue 遮罩无缝接力，彻底消除黑白屏闪烁
    setTimeout(() => {
        try {
            plus.navigator.closeSplashscreen();
        } catch (e) {
            console.warn('closeSplashscreen error:', e);
        }
    }, 60);
    // #endif

    // 动画展示 1.25s 后触发优雅弥散退场
    setTimeout(() => {
        isClosing.value = true;
        // 退场时平滑显示原生 TabBar
        uni.showTabBar({ animation: true, fail: () => {} });

        setTimeout(() => {
            showSplash.value = false;
            emit('finish');
        }, 420);
    }, 1250);
});
</script>

<style lang="scss" scoped>
.splash-screen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100vw;
    height: 100vh;
    /* #ifdef H5 */
    height: 100%;
    /* #endif */
    z-index: 9999999;
    background: #080c14;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    pointer-events: auto;
    transition:
        opacity 0.42s cubic-bezier(0.4, 0, 0.2, 1),
        transform 0.42s cubic-bezier(0.4, 0, 0.2, 1),
        filter 0.42s cubic-bezier(0.4, 0, 0.2, 1);

    &.theme-light {
        background: #f8fafc;
    }

    &.is-closing {
        opacity: 0;
        transform: scale(1.05);
        filter: blur(8px);
        pointer-events: none;
    }
}

// ── 环境流光光斑 ──
.splash-glow {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    filter: blur(80rpx);
    opacity: 0.35;
    animation: glowPulse 3s ease-in-out infinite alternate;

    &--primary {
        width: 480rpx;
        height: 480rpx;
        top: 28%;
        left: 20%;
        background: radial-gradient(circle, rgba(74, 109, 255, 0.6) 0%, rgba(74, 109, 255, 0) 70%);
    }

    &--secondary {
        width: 400rpx;
        height: 400rpx;
        bottom: 30%;
        right: 18%;
        background: radial-gradient(circle, rgba(46, 185, 255, 0.45) 0%, rgba(46, 185, 255, 0) 70%);
    }

    .theme-light &--primary {
        opacity: 0.22;
        background: radial-gradient(circle, rgba(74, 109, 255, 0.4) 0%, rgba(74, 109, 255, 0) 70%);
    }

    .theme-light &--secondary {
        opacity: 0.18;
        background: radial-gradient(circle, rgba(46, 185, 255, 0.3) 0%, rgba(46, 185, 255, 0) 70%);
    }
}

// ── 品牌中心区域 ──
.splash-brand {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.logo-box {
    position: relative;
    width: 156rpx;
    height: 156rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: logoEntrance 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;

    .logo-aura {
        position: absolute;
        inset: -20rpx;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(74, 109, 255, 0.4) 0%, rgba(46, 185, 255, 0) 70%);
        animation: logoAuraBreath 2s ease-in-out infinite alternate;
        pointer-events: none;
    }

    .logo-img {
        width: 156rpx;
        height: 156rpx;
        border-radius: 36rpx;
        box-shadow: 0 16rpx 48rpx rgba(0, 0, 65, 0.35);
    }
}

.brand-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 32rpx;
    animation: textEntrance 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.18s both;

    .brand-name {
        font-size: 38rpx;
        font-weight: 700;
        color: #f8fafc;
        letter-spacing: 0.8rpx;
        text-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);

        .theme-light & {
            color: #0f172a;
            text-shadow: none;
        }
    }

    .brand-slogan {
        font-size: 22rpx;
        color: rgba(148, 163, 184, 0.88);
        letter-spacing: 1.2rpx;
        margin-top: 12rpx;

        .theme-light & {
            color: #64748b;
        }
    }
}

// ── 底部精致加载条 ──
.splash-footer {
    position: absolute;
    bottom: calc(60rpx + env(safe-area-inset-bottom));
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    z-index: 2;
    animation: footerEntrance 0.6s ease 0.3s both;

    .loading-bar {
        width: 100rpx;
        height: 4rpx;
        border-radius: 999rpx;
        background: rgba(148, 163, 184, 0.18);
        overflow: hidden;

        &__fill {
            height: 100%;
            width: 0%;
            border-radius: 999rpx;
            background: linear-gradient(90deg, #4a6dff, #2eb9ff);
            animation: progressFill 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
    }
}

// ── 关键帧动效定义 ──
@keyframes logoEntrance {
    0% {
        opacity: 0;
        transform: scale(0.72) translateY(30rpx);
        filter: blur(6px);
    }
    100% {
        opacity: 1;
        transform: scale(1) translateY(0);
        filter: blur(0);
    }
}

@keyframes logoAuraBreath {
    0% {
        transform: scale(0.9);
        opacity: 0.4;
    }
    100% {
        transform: scale(1.15);
        opacity: 0.85;
    }
}

@keyframes textEntrance {
    0% {
        opacity: 0;
        transform: translateY(24rpx);
        filter: blur(4px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
        filter: blur(0);
    }
}

@keyframes footerEntrance {
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}

@keyframes glowPulse {
    0% {
        transform: scale(0.9) translate(0, 0);
    }
    100% {
        transform: scale(1.1) translate(20rpx, -20rpx);
    }
}

@keyframes progressFill {
    0% {
        width: 0%;
    }
    60% {
        width: 75%;
    }
    100% {
        width: 100%;
    }
}
</style>
