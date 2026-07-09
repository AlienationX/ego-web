<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <menu-bar>
            <template #title>Test Lab</template>
        </menu-bar>

        <view class="container">
            <view class="intro">
                <view class="title">测试页面入口</view>
                <view class="desc">所有入口均使用 navigateTo 打开，测试完成后点击返回即可回到本页。</view>
            </view>

            <view class="list">
                <view class="row" v-for="item in testMenus" :key="item.url" @click="go(item.url)">
                    <view class="left">
                        <view class="name">{{ item.name }}</view>
                        <view class="path">{{ item.url }}</view>
                    </view>
                    <uni-icons type="right" size="18" :color="arrowColor"></uni-icons>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app';
import { computed } from 'vue';
import { useUserStore } from '@/stores/user.js';
import { useSettingsStore } from '@/stores/settings.js';

const userStore = useUserStore();
const settingsStore = useSettingsStore();
const arrowColor = computed(() => (settingsStore.isDark ? '#6b7280' : '#98a2b3'));

const testMenus = [
    { name: 'Edit Cover', url: '/pages/app/cover' },
    { name: 'Access', url: '/pages/access/access' },
    { name: 'Watch Later', url: '/pages/app/watch-later' },
    { name: 'Subscriptions', url: '/pages/user/subscriptions' },
    { name: 'Preference Manager', url: '/pages/user/preferences' },
    { name: 'Membership', url: '/pages/member/payment' },
    { name: 'Stream Test', url: '/pages/test/stream-test' },
    { name: 'MDI Icon Test', url: '/pages/test/mdi-icon-test' },
    { name: 'Custom Bars', url: '/pages/test/custom-bars' },
    { name: 'Interstitial Ad', url: '/pages/test/ad-interstitial-test' },
    { name: 'Rewarded Video Ad', url: '/pages/test/ad-rewarded-test' },
    { name: 'PicsView Test', url: '/pages/test/pics-view-test' },
];

const go = (url) => {
    uni.navigateTo({ url });
};

onLoad(() => {
    if (userStore.isAdmin) return;
    uni.showToast({ title: '测试实验室仅管理员可用', icon: 'none' });
    uni.switchTab({ url: '/pages/user/user' });
});
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;

    &.theme-light {
        --test-bg: #f5f7fa;
        --test-panel-bg: #ffffff;
        --test-panel-border: #e8edf3;
        --test-divider: #edf2f7;
        --test-title: #1f2937;
        --test-text: #64748b;
        --test-muted: #94a3b8;
    }

    &.theme-dark {
        --test-bg: #111114;
        --test-panel-bg: #1b1c20;
        --test-panel-border: rgba(255, 255, 255, 0.08);
        --test-divider: rgba(255, 255, 255, 0.06);
        --test-title: #f3f4f6;
        --test-text: rgba(243, 244, 246, 0.72);
        --test-muted: rgba(243, 244, 246, 0.42);
    }

    background: var(--test-bg);
}

.container {
    padding: 20rpx 24rpx 30rpx;
}

.intro {
    background: var(--test-panel-bg);
    border-radius: 16rpx;
    border: 1rpx solid var(--test-panel-border);
    padding: 22rpx;
    margin-bottom: 18rpx;

    .title {
        font-size: 32rpx;
        color: var(--test-title);
        font-weight: 700;
        margin-bottom: 8rpx;
    }

    .desc {
        font-size: 24rpx;
        line-height: 1.6;
        color: var(--test-text);
    }
}

.list {
    background: var(--test-panel-bg);
    border-radius: 16rpx;
    border: 1rpx solid var(--test-panel-border);
    overflow: hidden;

    .row {
        min-height: 104rpx;
        padding: 16rpx 22rpx;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1rpx solid var(--test-divider);

        &:last-child {
            border-bottom: none;
        }

        .left {
            flex: 1;
            min-width: 0;
            margin-right: 12rpx;

            .name {
                font-size: 30rpx;
                color: var(--test-title);
                font-weight: 600;
                margin-bottom: 4rpx;
            }

            .path {
                font-size: 22rpx;
                color: var(--test-muted);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }
    }
}
</style>
