<template>
    <view class="test-layout pageBackground">
        <!-- 沉浸式状态栏占位 -->
        <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
        
        <!-- 简易返回导航 -->
        <view class="nav-header">
            <view class="back-btn" @click="goBack">
                <uni-icons type="back" size="24" color="#f1f5f9"></uni-icons>
            </view>
            <text class="title">实验室：TabbedPicsView 测试</text>
        </view>

        <!-- Tabbed 组件容器 -->
        <view class="component-wrapper">
            <tabbed-pics-view 
                v-if="testTabs.length"
                :tabs="testTabs" 
                :initialIndex="0"
            />
        </view>
    </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getStatusBarHeight } from '@/utils/system.js';
import TabbedPicsView from '@/components/tabbed-pics-view/tabbed-pics-view.vue';

const statusBarHeight = ref(getStatusBarHeight());

const testTabs = ref([
    { label: '推荐', query: { sortord: 'random' } },
    { label: '最热', query: { sortord: 'score' } },
    { label: '日期', query: { sortord: 'date_desc' }, isDate: true }
]);

const goBack = () => {
    uni.navigateBack();
};
</script>

<style lang="scss" scoped>
.test-layout {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #0f172a; // 兜底暗色背景

    .status-bar {
        width: 100%;
        flex-shrink: 0;
    }

    .nav-header {
        height: 88rpx;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        padding: 0 30rpx;
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(20rpx);
        border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
        
        .back-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 60rpx;
            height: 60rpx;
            margin-right: 10rpx;
            &:active { opacity: 0.7; }
        }
        
        .title {
            font-size: 32rpx;
            color: #f1f5f9;
            font-weight: 800;
        }
    }

    .component-wrapper {
        flex: 1;
        width: 100%;
        position: relative;
        overflow: hidden;
    }
}
</style>
