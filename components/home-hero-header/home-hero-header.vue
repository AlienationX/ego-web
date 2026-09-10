<template>
    <view class="hero-header" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'" :style="{ paddingTop: `${statusBarHeight + 10}px` }">
        <!-- Row 1: 用户问候 + 通知铃铛 -->
        <view class="hero-header__row hero-header__greeting-row">
            <view class="user-block" @click="goUser">
                <view class="avatar-wrap">
                    <image
                        class="avatar-img"
                        :src="userAvatar"
                        mode="aspectFill"
                    ></image>
                    <view v-if="userStore.isVip" class="vip-crown">
                        <mdi-icon path="/static/icons/crown-circle.svg" size="14px" color="#fbbf24"></mdi-icon>
                    </view>
                </view>
                <view class="greeting-info">
                    <text class="greeting-name">{{ userTitleText }}</text>
                    <text class="greeting-sub">{{ userSubText }}</text>
                </view>
            </view>

            <view class="notify-wrap">
                <!-- 瞬时灵动微气泡 (冷启动/有上新时轻量滑出，4.5秒后优雅收缩吸入铃铛) -->
                <view
                    v-if="statusStore.newWallpapersCount > 0 && isBubbleVisible"
                    class="dynamic-bubble"
                    :class="{ 'is-folding': isBubbleFolding }"
                    @click="goTimeline"
                >
                    <text class="bubble-spark">✨</text>
                    <text class="bubble-text">{{ tp('index.newWallpapersNoticeDesc', { count: statusStore.newWallpapersCount }) || `今日已更新 ${statusStore.newWallpapersCount} 张壁纸` }}</text>
                </view>

                <!-- 铃铛按钮 (纯白浮岛圆球) -->
                <view class="bell-btn" @click="emit('open-notifications')">
                    <mdi-icon path="/static/icons/bell.svg" size="20px" :color="settingsStore.isDark ? '#f7f7fb' : '#1e293b'"></mdi-icon>
                    <view v-if="statusStore.newWallpapersCount > 0" class="bell-badge">
                        <text class="badge-num">{{ statusStore.newWallpapersCount > 99 ? '99+' : statusStore.newWallpapersCount }}</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- Row 2: 沉浸式质感搜索栏 -->
        <view class="hero-header__row hero-header__search-row">
            <view class="search-bar" @click="goSearch">
                <view class="search-bar__left">
                    <mdi-icon path="/static/icons/magnify.svg" size="20px" :color="settingsStore.isDark ? 'rgba(247, 247, 251, 0.45)' : 'rgba(30, 41, 59, 0.45)'"></mdi-icon>
                    <text class="search-bar__placeholder">{{ t('search.placeholder') || '搜索壁纸、分类、标签...' }}</text>
                </view>
                <view class="search-bar__action" @click.stop="goSearch">
                    <mdi-icon path="/static/icons/palette-swatch.svg" size="18px" color="#ffffff"></mdi-icon>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTranslateParams } from '@/utils/i18n.js';
import { useUserStore } from '@/stores/user.js';
import { useStatusStore } from '@/stores/status.js';
import { useSettingsStore } from '@/stores/settings.js';

const props = defineProps({
    statusBarHeight: {
        type: Number,
        default: 0,
    },
});

const emit = defineEmits(['open-notifications']);

const { t, locale } = useI18n();
const { tp } = useTranslateParams();
const userStore = useUserStore();
const statusStore = useStatusStore();
const settingsStore = useSettingsStore();

const isBubbleVisible = ref(false);
const isBubbleFolding = ref(false);

const isEn = computed(() => locale.value === 'en');

// 用户头像
const userAvatar = computed(() => {
    return userStore.userinfo?.profile?.avatar || '/static/logo.svg';
});

// 用户主标题 (问候 + 昵称)
const userTitleText = computed(() => {
    const nickname = userStore.userinfo?.profile?.nickname;
    const hour = new Date().getHours();
    
    if (isEn.value) {
        let greeting = 'Hello';
        if (hour >= 5 && hour < 12) greeting = 'Good morning';
        else if (hour >= 12 && hour < 18) greeting = 'Good afternoon';
        else if (hour >= 18 && hour < 22) greeting = 'Good evening';
        else greeting = 'Hello';
        return nickname ? `${greeting}, ${nickname}` : 'Hello, Explorer';
    }

    let timePrefix = '你好';
    if (hour >= 5 && hour < 12) timePrefix = '早上好';
    else if (hour >= 12 && hour < 14) timePrefix = '中午好';
    else if (hour >= 14 && hour < 18) timePrefix = '下午好';
    else if (hour >= 18 && hour < 22) timePrefix = '晚上好';
    else timePrefix = '夜深了';
    
    return nickname ? `${timePrefix}，${nickname}` : `${timePrefix}，探索者`;
});

// 副标题描述 (引导探索美学灵感)
const userSubText = computed(() => {
    return isEn.value ? 'What aesthetic fits you today?' : '今天想探索什么美学风格？';
});

// 灵动微气泡生命周期：展示 4.5 秒后优雅吸入铃铛
onMounted(() => {
    if (statusStore.newWallpapersCount > 0) {
        isBubbleVisible.value = true;
        setTimeout(() => {
            isBubbleFolding.value = true;
            setTimeout(() => {
                isBubbleVisible.value = false;
            }, 600);
        }, 4500);
    }
});

const goUser = () => {
    uni.switchTab({
        url: '/pages/user/user',
    });
};

const goSearch = () => {
    uni.navigateTo({
        url: '/pages/app/search',
    });
};

const goTimeline = () => {
    uni.navigateTo({
        url: `/pages/app/timeline?unreadCount=${statusStore.newWallpapersCount || 0}`,
    });
};
</script>

<style lang="scss" scoped>
.hero-header {
    padding: 0 32rpx 14rpx;
    display: flex;
    flex-direction: column;
    gap: 24rpx;

    &__row {
        position: relative;
    }
}

// ── 1. 问候与铃铛行 ──
.hero-header__greeting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 6rpx;
}

.user-block {
    display: flex;
    align-items: center;
    gap: 22rpx;
    max-width: 72%;
    cursor: pointer;

    .avatar-wrap {
        position: relative;
        width: 92rpx;
        height: 92rpx;
        border-radius: 50%;
        background: #ffffff;
        border: 2rpx solid rgba(255, 255, 255, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 6rpx 20rpx rgba(15, 23, 42, 0.08);

        .theme-dark & {
            background: #1e293b;
            border-color: rgba(255, 255, 255, 0.12);
            box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.35);
        }

        .avatar-img {
            width: 86rpx;
            height: 86rpx;
            border-radius: 50%;
        }

        .vip-crown {
            position: absolute;
            bottom: -4rpx;
            right: -4rpx;
            background: #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.12);
        }
    }

    .greeting-info {
        display: flex;
        flex-direction: column;
        overflow: hidden;

        .greeting-name {
            font-size: 34rpx;
            line-height: 1.25;
            font-weight: 800;
            color: var(--text-primary, #0f172a);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            letter-spacing: -0.5rpx;
        }

        .greeting-sub {
            font-size: 24rpx;
            line-height: 1.4;
            color: var(--text-tertiary, #94a3b8);
            margin-top: 6rpx;
            letter-spacing: 0.2rpx;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
}

.notify-wrap {
    display: flex;
    align-items: center;
    position: relative;
}

// 灵动微气泡动画
.dynamic-bubble {
    position: absolute;
    right: 96rpx;
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(16rpx);
    -webkit-backdrop-filter: blur(16rpx);
    color: #ffffff;
    padding: 10rpx 22rpx;
    border-radius: 40rpx;
    display: flex;
    align-items: center;
    gap: 8rpx;
    white-space: nowrap;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.18);
    border: 1rpx solid rgba(255, 255, 255, 0.15);
    z-index: 10;
    animation: bubbleSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    transform-origin: right center;

    &.is-folding {
        animation: bubbleFoldIntoBell 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .bubble-spark {
        font-size: 22rpx;
    }

    .bubble-text {
        font-size: 22rpx;
        font-weight: 500;
        max-width: 320rpx;
        overflow: hidden;
        text-overflow: ellipsis;
    }
}

@keyframes bubbleSlideIn {
    0% {
        opacity: 0;
        transform: translateX(30rpx) scale(0.85);
    }
    100% {
        opacity: 1;
        transform: translateX(0) scale(1);
    }
}

@keyframes bubbleFoldIntoBell {
    0% {
        opacity: 1;
        transform: translateX(0) scale(1);
    }
    60% {
        opacity: 0.6;
        transform: translateX(40rpx) scale(0.5);
    }
    100% {
        opacity: 0;
        transform: translateX(60rpx) scale(0);
    }
}

// 纯白浮岛圆球铃铛按钮
.bell-btn {
    width: 84rpx;
    height: 84rpx;
    border-radius: 50%;
    background: #ffffff;
    border: 1rpx solid rgba(30, 41, 59, 0.06);
    box-shadow: 0 6rpx 20rpx rgba(15, 23, 42, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);

    .theme-dark & {
        background: #222228;
        border-color: rgba(255, 255, 255, 0.08);
        box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.3);
    }

    &:active {
        transform: scale(0.92);
    }

    .bell-badge {
        position: absolute;
        top: 2rpx;
        right: 2rpx;
        background: #ef4444;
        color: #ffffff;
        font-size: 18rpx;
        font-weight: 700;
        padding: 2rpx 8rpx;
        border-radius: 20rpx;
        border: 2rpx solid var(--page-background);
        min-width: 24rpx;
        text-align: center;
    }
}

// ── 2. 大圆角沉浸搜索栏 (参考原型：白底纯净微浮岛 + 右侧深橄榄操作键) ──
.hero-header__search-row {
    .search-bar {
        height: 94rpx;
        background: #ffffff;
        border-radius: 30rpx;
        border: 1rpx solid rgba(30, 41, 59, 0.06);
        box-shadow: 0 6rpx 24rpx rgba(15, 23, 42, 0.04);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16rpx 0 30rpx;
        transition: transform 0.2s, box-shadow 0.2s;

        .theme-dark & {
            background: #222228;
            border-color: rgba(255, 255, 255, 0.08);
            box-shadow: 0 6rpx 24rpx rgba(0, 0, 0, 0.3);
        }

        &:active {
            transform: scale(0.99);
        }

        &__left {
            display: flex;
            align-items: center;
            gap: 18rpx;
            flex: 1;
            overflow: hidden;
        }

        &__placeholder {
            font-size: 26rpx;
            color: var(--text-tertiary);
            letter-spacing: 0.3rpx;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        &__action {
            width: 66rpx;
            height: 66rpx;
            border-radius: 22rpx;
            background: #2e382b;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4rpx 14rpx rgba(46, 56, 43, 0.25);
            flex-shrink: 0;
            transition: transform 0.2s;

            &:active {
                transform: scale(0.92);
            }

            .theme-dark & {
                background: #3b82f6;
                box-shadow: 0 4rpx 14rpx rgba(59, 130, 246, 0.3);
            }
        }
    }
}
</style>
