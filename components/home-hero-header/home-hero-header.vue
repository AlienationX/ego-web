<template>
    <view class="hero-header" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'" :style="{ paddingTop: headerPaddingTop }">
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
                <!-- 灵动微抽屉 (高度与铃铛严格保持 84rpx 一致，类似通知小抽屉，6s 自动推回) -->
                <view
                    v-if="statusStore.newWallpapersCount > 0 && isBubbleVisible"
                    class="dynamic-drawer"
                    :class="{ 'is-folding': isBubbleFolding }"
                    @click="goTimeline"
                >
                    <text class="drawer-spark">✨</text>
                    <text class="drawer-text">{{ isEn ? `+${statusStore.newWallpapersCount} New` : `上新 ${statusStore.newWallpapersCount} 张` }}</text>
                    <text class="drawer-arrow">›</text>
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
                    <mdi-icon
                        path="/static/icons/tune-variant.svg"
                        size="20px"
                        :color="settingsStore.isDark ? '#f1f5f9' : 'rgba(30, 41, 59, 0.75)'"
                    ></mdi-icon>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
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
let bubbleTimer = null;
let foldTimer = null;

const isEn = computed(() => locale.value === 'en');

// 计算顶部内边距：小程序端动态避让右上角胶囊按钮，非小程序端保持 statusBarHeight + 10px
const headerPaddingTop = computed(() => {
    let topPx = (props.statusBarHeight || 0) + 10;
    // #ifdef MP
    try {
        const menuButton = uni.getMenuButtonBoundingClientRect();
        if (menuButton && menuButton.bottom) {
            // 胶囊底部下方留出 10px 间距，确保整个问候行与铃铛完全在胶囊下方，绝无遮挡
            topPx = Math.max(menuButton.bottom + 10, topPx);
        }
    } catch (e) {
        topPx = (props.statusBarHeight || 0) + 48;
    }
    // #endif
    return `${topPx}px`;
});

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

// 灵动微抽屉展开与吸入动效触发器 (停留 6s 后优雅推回收纳回铃铛)
const triggerBubbleAnimation = () => {
    if (bubbleTimer) clearTimeout(bubbleTimer);
    if (foldTimer) clearTimeout(foldTimer);
    isBubbleFolding.value = false;
    isBubbleVisible.value = true;
    bubbleTimer = setTimeout(() => {
        isBubbleFolding.value = true;
        foldTimer = setTimeout(() => {
            isBubbleVisible.value = false;
        }, 400);
    }, 6000);
};

// 监听新壁纸数量变化：异步接口拿到数据时立刻触发气泡展示
watch(
    () => statusStore.newWallpapersCount,
    (count) => {
        if (count > 0) {
            triggerBubbleAnimation();
        } else {
            isBubbleVisible.value = false;
        }
    },
    { immediate: true }
);

onUnmounted(() => {
    if (bubbleTimer) clearTimeout(bubbleTimer);
    if (foldTimer) clearTimeout(foldTimer);
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
    padding: 0 20rpx 0;
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
    flex: 1;
    min-width: 0;
    margin-right: 16rpx;
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
            border: none;
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
            letter-spacing: 0rpx;
        }

        .greeting-sub {
            font-size: 24rpx;
            line-height: 1.4;
            color: var(--text-tertiary, #94a3b8);
            margin-top: 6rpx;
            letter-spacing: 0rpx;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
}

.notify-wrap {
    display: flex;
    align-items: center;
    gap: 14rpx; // 独立分离，保持舒适间距，坚决不连在一起
    position: relative;
    flex-shrink: 0;
}

// 灵动微胶囊 (独立全圆角药丸，与铃铛高度严格 78rpx 1:1 一致，统一对称向下阴影)
.dynamic-drawer {
    height: 78rpx; // 严格与铃铛高度 78rpx 1:1 完全一致！
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    padding: 0 22rpx; // 两侧对称呼吸留白
    border-radius: 999rpx; // 完美全圆角胶囊
    white-space: nowrap;
    width: max-content;
    cursor: pointer;
    user-select: none;
    box-sizing: border-box;

    // 浅色模式：与铃铛完全相同材质、全边框、对称正下方柔光投影
    .theme-light & {
        background: #ffffff;
        color: #0f172a;
        border: 1rpx solid rgba(30, 41, 59, 0.08);
        box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.06);
    }

    // 深色模式：与暗夜铃铛完全相同材质、全边框、对称暗夜投影
    .theme-dark & {
        background: #222228;
        color: #f8fafc;
        border: 1rpx solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.35);
    }

    // 胶囊淡入展开动效
    animation: drawerFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    transform-origin: right center;

    // 胶囊收起动效
    &.is-folding {
        animation: drawerFadeOut 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    &:active {
        transform: scale(0.95);
        opacity: 0.9;
    }

    .drawer-spark {
        font-size: 24rpx;
        line-height: 1;
    }

    .drawer-text {
        font-size: 24rpx;
        font-weight: 650;
        line-height: 1;
        letter-spacing: 0rpx;
        white-space: nowrap;
    }

    .drawer-arrow {
        font-size: 24rpx;
        opacity: 0.5;
        line-height: 1;
        margin-left: 2rpx;
    }
}

@keyframes drawerFadeIn {
    0% {
        opacity: 0;
        transform: scale(0.88) translateX(16rpx);
    }
    100% {
        opacity: 1;
        transform: scale(1) translateX(0);
    }
}

@keyframes drawerFadeOut {
    0% {
        opacity: 1;
        transform: scale(1) translateX(0);
    }
    100% {
        opacity: 0;
        transform: scale(0.88) translateX(16rpx);
    }
}

// 独立浮岛圆球铃铛按钮 (尺寸严格保持 78rpx * 78rpx 与胶囊等高)
.bell-btn {
    width: 78rpx;
    height: 78rpx;
    border-radius: 50%;
    background: #ffffff;
    border: 1rpx solid rgba(30, 41, 59, 0.08);
    box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    flex-shrink: 0;
    box-sizing: border-box;

    .theme-dark & {
        background: #222228;
        border: 1rpx solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.35);
    }

    &:active {
        transform: scale(0.92);
    }

    .bell-badge {
        position: absolute;
        top: -4rpx;
        right: -4rpx;
        background: #ef4444;
        color: #ffffff;
        font-size: 18rpx;
        font-weight: 700;
        padding: 2rpx 8rpx;
        border-radius: 20rpx;
        border: 2rpx solid var(--page-background);
        min-width: 24rpx;
        text-align: center;
        line-height: 1.2;

        .theme-dark & {
            border: none;
        }
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
        padding: 0 24rpx 0 30rpx;
        transition: transform 0.2s, box-shadow 0.2s;

        .theme-dark & {
            background: #222228;
            border: none;
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
            letter-spacing: 0.2rpx;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        &__action {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 54rpx;
            height: 54rpx;
            border-radius: 50%;
            background: rgba(15, 23, 42, 0.04);
            flex-shrink: 0;
            transition: opacity 0.2s, transform 0.2s, background 0.2s;

            .theme-dark & {
                background: rgba(255, 255, 255, 0.08);
            }

            &:active {
                opacity: 0.6;
                transform: scale(0.92);
            }
        }
    }
}
</style>
