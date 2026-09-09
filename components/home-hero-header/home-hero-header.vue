<template>
    <view class="hero-header" :style="{ paddingTop: `${statusBarHeight + 10}px` }">
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
                    <text class="greeting-sub">{{ greetingText }}</text>
                    <text class="greeting-name">{{ userDisplayName }}</text>
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

                <!-- 铃铛按钮 -->
                <view class="bell-btn" @click="emit('open-notifications')">
                    <mdi-icon path="/static/icons/bell.svg" size="20px" color="var(--text-primary)"></mdi-icon>
                    <view v-if="statusStore.newWallpapersCount > 0" class="bell-badge">
                        <text class="badge-num">{{ statusStore.newWallpapersCount > 99 ? '99+' : statusStore.newWallpapersCount }}</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- Row 2: 沉浸大圆角搜索栏 + 快捷灵感键 -->
        <view class="hero-header__row hero-header__search-row">
            <view class="search-bar" @click="goSearch">
                <view class="search-bar__left">
                    <uni-icons type="search" size="18" :color="searchIconColor"></uni-icons>
                    <text class="search-bar__placeholder">{{ t('index.searchPlaceholder') || '探索海量 4K 精选壁纸、分类、标签...' }}</text>
                </view>
                <view class="search-bar__action" @click.stop="goSearch">
                    <mdi-icon path="/static/icons/palette-swatch.svg" size="16px" color="#ffffff"></mdi-icon>
                </view>
            </view>
        </view>

        <!-- Row 3: 四大快捷胶囊入口 (默认激活推荐) -->
        <view class="hero-header__row hero-header__pills-row">
            <view
                v-for="pill in navPills"
                :key="pill.key"
                class="nav-pill"
                :class="{ 'is-active': activePill === pill.key }"
                @click="onPillClick(pill)"
            >
                <view class="nav-pill__circle">
                    <mdi-icon
                        :path="pill.icon"
                        size="24px"
                        :color="activePill === pill.key ? '#ffffff' : 'var(--text-primary)'"
                    ></mdi-icon>
                    <!-- 最新角标红点 -->
                    <view v-if="pill.key === 'latest' && statusStore.newWallpapersCount > 0" class="pill-dot"></view>
                </view>
                <text class="nav-pill__label">{{ pill.label }}</text>
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

const emit = defineEmits(['open-notifications', 'select-recommend']);

const { t, locale } = useI18n();
const { tp } = useTranslateParams();
const userStore = useUserStore();
const statusStore = useStatusStore();
const settingsStore = useSettingsStore();

const activePill = ref('recommend');
const isBubbleVisible = ref(false);
const isBubbleFolding = ref(false);

const isEn = computed(() => locale.value === 'en');
const searchIconColor = computed(() => (settingsStore.isDark ? 'rgba(255, 255, 255, 0.5)' : '#94a3b8'));

// 用户头像与昵称
const userAvatar = computed(() => {
    return userStore.userinfo?.profile?.avatar || '/static/logo.svg';
});

const userDisplayName = computed(() => {
    if (userStore.userinfo?.profile?.nickname) {
        return userStore.userinfo.profile.nickname;
    }
    if (userStore.userinfo?.nickname) {
        return userStore.userinfo.nickname;
    }
    return isEn.value ? 'Explorer 👋' : '探索者 · 开启美学之旅';
});

// 时段动态问候语
const greetingText = computed(() => {
    const hour = new Date().getHours();
    if (isEn.value) {
        if (hour >= 5 && hour < 12) return 'Good morning ☀️';
        if (hour >= 12 && hour < 18) return 'Good afternoon ☕️';
        if (hour >= 18 && hour < 22) return 'Good evening 🌙';
        return 'Late night 🌌';
    }
    if (hour >= 5 && hour < 12) return '早上好 ☀️';
    if (hour >= 12 && hour < 14) return '中午好 ☕️';
    if (hour >= 14 && hour < 18) return '下午好 🌤';
    if (hour >= 18 && hour < 22) return '晚上好 🌙';
    return '夜深了 🌌';
});

// 4个快捷导航胶囊
const navPills = computed(() => [
    {
        key: 'recommend',
        label: t('common.recommend') || '每日精选',
        icon: '/static/icons/star.svg',
    },
    {
        key: 'hot',
        label: t('index.tabs.hot') || '最热榜单',
        icon: '/static/icons/fire.svg',
        path: '/pages/app/top',
    },
    {
        key: 'latest',
        label: t('index.tabs.latest') || '最新发布',
        icon: '/static/icons/flash.svg',
        path: '/pages/app/timeline',
    },
    {
        key: 'subjects',
        label: t('index.subjectRecommend') || '专题策划',
        icon: '/static/icons/cards.svg',
        path: '/pages/app/subjects',
    },
]);

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

const onPillClick = (pill) => {
    if (pill.key === 'recommend') {
        activePill.value = 'recommend';
        emit('select-recommend');
        return;
    }
    if (pill.path) {
        uni.navigateTo({
            url: pill.path,
        });
    }
};
</script>

<style lang="scss" scoped>
.hero-header {
    padding: 0 32rpx 20rpx;
    display: flex;
    flex-direction: column;
    gap: 28rpx;

    &__row {
        position: relative;
    }
}

// ── 1. 问候与铃铛行 ──
.hero-header__greeting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.user-block {
    display: flex;
    align-items: center;
    gap: 20rpx;
    max-width: 60%;
    cursor: pointer;

    .avatar-wrap {
        position: relative;
        width: 88rpx;
        height: 88rpx;
        border-radius: 50%;
        background: rgba(120, 120, 128, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);

        .avatar-img {
            width: 80rpx;
            height: 80rpx;
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

        .greeting-sub {
            font-size: 24rpx;
            color: var(--text-secondary, #64748b);
            margin-bottom: 4rpx;
            letter-spacing: 0.5rpx;
        }

        .greeting-name {
            font-size: 32rpx;
            font-weight: 700;
            color: var(--text-primary, #0f172a);
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
    right: 92rpx;
    background: rgba(15, 23, 42, 0.88);
    backdrop-filter: blur(16rpx);
    -webkit-backdrop-filter: blur(16rpx);
    color: #ffffff;
    padding: 10rpx 22rpx;
    border-radius: 40rpx;
    display: flex;
    align-items: center;
    gap: 8rpx;
    white-space: nowrap;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
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

.bell-btn {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: var(--card-bg, rgba(255, 255, 255, 0.85));
    backdrop-filter: blur(12rpx);
    -webkit-backdrop-filter: blur(12rpx);
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
    border: 1rpx solid rgba(120, 120, 128, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: transform 0.2s;

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
        border: 2rpx solid var(--card-bg, #ffffff);
        min-width: 24rpx;
        text-align: center;
    }
}

// ── 2. 大圆角胶囊搜索栏 ──
.hero-header__search-row {
    .search-bar {
        height: 88rpx;
        background: var(--card-bg, rgba(255, 255, 255, 0.85));
        backdrop-filter: blur(16rpx);
        -webkit-backdrop-filter: blur(16rpx);
        border-radius: 28rpx;
        border: 1rpx solid rgba(120, 120, 128, 0.12);
        box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16rpx 0 28rpx;
        transition: transform 0.2s, box-shadow 0.2s;

        &:active {
            transform: scale(0.99);
        }

        &__left {
            display: flex;
            align-items: center;
            gap: 16rpx;
            flex: 1;
            overflow: hidden;
        }

        &__placeholder {
            font-size: 26rpx;
            color: var(--text-secondary, #94a3b8);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        &__action {
            width: 60rpx;
            height: 60rpx;
            border-radius: 20rpx;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4rpx 12rpx rgba(37, 99, 235, 0.3);
            flex-shrink: 0;
        }
    }
}

// ── 3. 四大快捷胶囊入口 ──
.hero-header__pills-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8rpx;
}

.nav-pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    cursor: pointer;
    transition: transform 0.2s;

    &:active {
        transform: scale(0.94);
    }

    &__circle {
        width: 104rpx;
        height: 104rpx;
        border-radius: 50%;
        background: var(--card-bg, rgba(255, 255, 255, 0.9));
        backdrop-filter: blur(12rpx);
        -webkit-backdrop-filter: blur(12rpx);
        border: 1rpx solid rgba(120, 120, 128, 0.12);
        box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);

        .pill-dot {
            position: absolute;
            top: 10rpx;
            right: 12rpx;
            width: 14rpx;
            height: 14rpx;
            background: #ef4444;
            border-radius: 50%;
            border: 2rpx solid #ffffff;
        }
    }

    &__label {
        font-size: 22rpx;
        color: var(--text-secondary, #64748b);
        font-weight: 500;
        transition: color 0.2s, font-weight 0.2s;
    }

    // 激活态 (推荐默认激活)
    &.is-active {
        .nav-pill__circle {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            border-color: transparent;
            box-shadow: 0 8rpx 24rpx rgba(37, 99, 235, 0.38);
            transform: translateY(-2rpx);
        }

        .nav-pill__label {
            color: #3b82f6;
            font-weight: 700;
        }
    }
}
</style>
