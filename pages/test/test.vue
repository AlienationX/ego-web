<template>
    <view class="layout">
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
                    <uni-icons type="right" size="18" color="#98a2b3"></uni-icons>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
const testMenus = [
    { name: 'Sign In', url: '/pages/login/signin' },
    { name: 'Sign Up', url: '/pages/login/signup' },
    { name: 'Forget Password', url: '/pages/login/forget-password' },
    { name: 'Access', url: '/pages/access/access' },
    { name: 'Membership', url: '/pages/membership/membership' },
    { name: 'Settings1', url: '/pages/test/settings1' },
    { name: 'Interstitial Ad', url: '/pages/test/ad-inter' },
    { name: 'Rewarded Video Ad', url: '/pages/test/ad-rewarded' },
    { name: 'Waterfall View', url: '/pages/test/waterfall-view' },
    { name: 'Demo View', url: '/pages/test/demo-view' },
];

const go = (url) => {
    uni.navigateTo({ url });
};
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: #f5f7fa;
}

.container {
    padding: 20rpx 24rpx 30rpx;
}

.intro {
    background: #fff;
    border-radius: 16rpx;
    border: 1rpx solid #e8edf3;
    padding: 22rpx;
    margin-bottom: 18rpx;

    .title {
        font-size: 32rpx;
        color: #1f2937;
        font-weight: 700;
        margin-bottom: 8rpx;
    }

    .desc {
        font-size: 24rpx;
        line-height: 1.6;
        color: #64748b;
    }
}

.list {
    background: #fff;
    border-radius: 16rpx;
    border: 1rpx solid #e8edf3;
    overflow: hidden;

    .row {
        min-height: 104rpx;
        padding: 16rpx 22rpx;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1rpx solid #edf2f7;

        &:last-child {
            border-bottom: none;
        }

        .left {
            flex: 1;
            min-width: 0;
            margin-right: 12rpx;

            .name {
                font-size: 30rpx;
                color: #1f2937;
                font-weight: 600;
                margin-bottom: 4rpx;
            }

            .path {
                font-size: 22rpx;
                color: #94a3b8;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }
    }
}
</style>
