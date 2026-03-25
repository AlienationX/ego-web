<template>
    <view class="layout">
        <menu-bar>
            <template #title>MDI Icon Test</template>
        </menu-bar>

        <view class="container">
            <view class="intro">
                <text class="title">MDI Icon 组件测试</text>
                <text class="desc">支持本地 /static/icons 的路径，支持颜色与大小。</text>
            </view>

            <view class="control">
                <view class="row">
                    <text class="label">颜色</text>
                    <input class="input" v-model="color" placeholder="#E5322D" />
                </view>
                <view class="row">
                    <text class="label">大小 (rpx)</text>
                    <input class="input" v-model="size" placeholder="32" type="number" />
                </view>
                <view class="count">图标数量：{{ icons.length }}</view>
            </view>

            <view class="grid">
                <view class="item" v-for="icon in icons" :key="icon">
                    <mdi-icon :path="icon" :size="Number(size || 32)" :color="color" />
                    <text class="name">{{ icon }}</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref } from 'vue';

const color = ref('#E5322D');
const size = ref('50');
const icons = ref([]);

const loadIcons = () => {
    // 编译期自动收集图标路径（排除 brands 目录）
    const modules = import.meta.glob('../../static/icons/**/*.svg', { eager: true, query: '?url', import: 'default' });
    const list = Object.entries(modules)
        .filter(([key]) => !key.includes('/brands/'))
        .map(([, url]) => url)
        .sort();
    icons.value = list;
};

loadIcons();
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: #f5f7fa;
}

.container {
    padding: 20rpx 24rpx 40rpx;
}

.intro {
    background: #fff;
    border-radius: 16rpx;
    border: 1rpx solid #e8edf3;
    padding: 22rpx;
    margin-bottom: 18rpx;

    .title {
        font-size: 32rpx;
        font-weight: 700;
        color: #111827;
        margin-bottom: 8rpx;
        display: block;
    }

    .desc {
        font-size: 24rpx;
        color: #64748b;
    }
}

.control {
    background: #fff;
    border-radius: 16rpx;
    border: 1rpx solid #e8edf3;
    padding: 22rpx;
    margin-bottom: 18rpx;

    .row {
        display: flex;
        align-items: center;
        gap: 16rpx;
        margin-bottom: 16rpx;
    }

    .row:last-child {
        margin-bottom: 0;
    }

    .label {
        width: 140rpx;
        font-size: 24rpx;
        color: #64748b;
    }

    .input {
        flex: 1;
        height: 72rpx;
        border-radius: 14rpx;
        border: 1rpx solid #e2e8f0;
        padding: 0 16rpx;
        font-size: 26rpx;
        background: #fff;
    }

    .count {
        font-size: 26rpx;
        color: #94a3b8;
        padding: 16rpx;
        text-align: right;
    }
}

.grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16rpx;
}

.item {
    background: #fff;
    border-radius: 16rpx;
    border: 1rpx solid #e8edf3;
    padding: 20rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;

    .name {
        font-size: 22rpx;
        color: #64748b;
        text-align: center;
        word-break: break-all;
    }
}
</style>
