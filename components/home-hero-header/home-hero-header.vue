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
                    <mdi-icon path="/static/icons/bell.svg" size="20px" :color="settingsStore.isDark ? '#f7f7fb' : '#15171c'"></mdi-icon>
                    <view v-if="statusStore.newWallpapersCount > 0" class="bell-badge">
                        <text class="badge-num">{{ statusStore.newWallpapersCount > 99 ? '99+' : statusStore.newWallpapersCount }}</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- Row 2: 沉浸搜索栏 (对齐 classify.vue：小巧淡雅占位符) -->
        <view class="hero-header__row hero-header__search-row">
            <view class="search-bar" @click="goSearch">
                <view class="search-bar__left">
                    <mdi-icon path="/static/icons/magnify.svg" size="18" :color="settingsStore.isDark ? 'rgba(247, 247, 251, 0.52)' : 'rgba(21, 23, 28, 0.52)'"></mdi-icon>
                    <text class="search-bar__placeholder">{{ t('search.placeholder') || '搜索壁纸、分类、标签...' }}</text>
                </view>
                <view class="search-bar__action" @click.stop="goSearch">
                    <mdi-icon path="/static/icons/palette-swatch.svg" size="16px" color="#ffffff"></mdi-icon>
                </view>
            </view>
        </view>

        <!-- Row 3: 四大快捷扁平化入口 (微圆角方块 Squircle，解除与圆形头像冲突) -->
        <view class="hero-header__row hero-header__pills-row">
            <view
                v-for="pill in navPills"
                :key="pill.key"
                class="nav-pill"
                :class="{ 'is-active': activePill === pill.key }"
                @click="onPillClick(pill)"
            >
                <view class="nav-pill__box">
                    <mdi-icon
                        :path="pill.icon"
                        size="26px"
                        :color="activePill === pill.key ? (settingsStore.isDark ? '#60a5fa' : '#2563eb') : (settingsStore.isDark ? '#e2e8f0' : '#475569')"
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
    background: var(--panel-background);
    border: 1rpx solid var(--panel-border);
    backdrop-filter: blur(16rpx);
    -webkit-backdrop-filter: blur(16rpx);
    box-shadow: 0 4rpx 16rpx var(--shadow-color);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: transform 0.2s, background-color 0.2s;

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

// ── 2. 大圆角胶囊搜索栏 (完美适配 Light/Dark 模式) ──
.hero-header__search-row {
    .search-bar {
        height: 88rpx;
        background: var(--panel-background);
        backdrop-filter: blur(20rpx);
        -webkit-backdrop-filter: blur(20rpx);
        border-radius: 28rpx;
        border: 1rpx solid var(--panel-border);
        box-shadow: 0 4rpx 20rpx var(--shadow-color);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16rpx 0 28rpx;
        transition: transform 0.2s, box-shadow 0.2s, background-color 0.2s, border-color 0.2s;

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
            font-size: 24rpx;
            color: var(--text-tertiary);
            letter-spacing: 0.5rpx;
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

            .theme-dark & {
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.4);
            }
        }
    }
}

// ── 3. 四大快捷扁平化入口 (微圆角方块 Squircle，纯平无阴影，解决与圆形头像冲突) ──
.hero-header__pills-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10rpx;
}

.nav-pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    cursor: pointer;
    transition: transform 0.2s ease;

    &:active {
        transform: scale(0.94);
    }

    &__box {
        width: 92rpx;
        height: 92rpx;
        border-radius: 26rpx;
        background: rgba(0, 0, 0, 0.035);
        border: 1rpx solid rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        transition: all 0.25s ease;

        .theme-dark & {
            background: rgba(255, 255, 255, 0.07);
            border: 1rpx solid rgba(255, 255, 255, 0.1);
        }

        .pill-dot {
            position: absolute;
            top: 10rpx;
            right: 10rpx;
            width: 14rpx;
            height: 14rpx;
            background: #ef4444;
            border-radius: 50%;
            border: 2rpx solid var(--page-background);
        }
    }

    &__label {
        font-size: 22rpx;
        color: var(--text-secondary);
        font-weight: 500;
        transition: color 0.2s, font-weight 0.2s;

        .theme-dark & {
            color: rgba(247, 247, 251, 0.72);
        }
    }

    // 激活态 (扁平化轻量微亮底，彻底去除厚阴影与厚重球体感)
    &.is-active {
        .nav-pill__box {
            background: rgba(37, 99, 235, 0.1);
            border-color: rgba(37, 99, 235, 0.2);

            .theme-dark & {
                background: rgba(59, 130, 246, 0.18);
                border-color: rgba(59, 130, 246, 0.35);
            }
        }

        .nav-pill__label {
            color: #2563eb;
            font-weight: 700;

            .theme-dark & {
                color: #60a5fa;
            }
        }
    }
}
</style>
