<template>
    <view class="layout">
        <!-- 头部 -->
        <view class="header">
            <!-- 状态栏占位 -->
            <view :style="{ height: statusBarHeight + 'px' }"></view>
            
            <view class="header__inner">
                <!-- 返回按钮 -->
                <view class="back-btn" @click="goBack">
                    <mdi-icon path="/static/icons/arrow-left.svg" size="24px" color="rgba(255,255,255,0.8)" />
                </view>
                <view class="header__content">
                    <text class="header__title">MDI Icon Explorer</text>
                    <text class="header__subtitle">CSS 遮罩着色方案 · 平台适配测试</text>
                </view>
            </view>
        </view>

        <view class="container">
            <!-- 1. 功能区 A: Hero Preview (核心演示 CSS 改色) -->
            <view class="hero-card">
                <view class="hero-card__preview">
                    <mdi-icon :path="selectedIcon" :size="previewSize" class="icon-styled" />
                </view>

                <view class="controls">
                    <!-- 1. 选择图标 -->
                    <view class="control-item is-full">
                        <text class="control-item__label">Pick Icon To Preview</text>
                        <picker :value="iconIndex" :range="icons" @change="onIconPick">
                            <view class="picker-box">
                                <text class="picker-box__text">{{ currentIconShortName }}</text>
                                <uni-icons type="bottom" size="14" color="#94a3b8"></uni-icons>
                            </view>
                        </picker>
                    </view>

                    <!-- 2. 调节大小 -->
                    <view class="control-item">
                        <text class="control-item__label">Size Adjust ({{ previewSize }})</text>
                        <slider :value="size" @change="onSizeChange" min="20" max="200" activeColor="#6366f1" block-size="20" />
                    </view>

                    <!-- 3. 设置颜色 -->
                    <view class="control-item">
                        <text class="control-item__label">Class Color</text>
                        <view class="color-presets">
                            <view
                                v-for="c in presets"
                                :key="c"
                                class="color-dot"
                                :style="{ backgroundColor: c }"
                                :class="{ 'is-active': activeColor === c }"
                                @click="activeColor = c"
                            ></view>
                        </view>
                    </view>
                </view>

                <view class="demo-badge">
                    <text>Class Styling</text>
                </view>
            </view>

            <!-- 2. 功能区 B: Library Grid (恢复原有全部展示) -->
            <view class="library-header">
                <text class="library-title">Full Icons Library</text>
                <text class="library-count">{{ icons.length }} total</text>
            </view>

            <view class="grid">
                <view v-for="icon in icons" :key="icon" class="item">
                    <view class="item__icon-wrap">
                        <!-- 联动全场：底部图标也跟随 size 变化，但保持较小比例 -->
                        <mdi-icon :path="icon" :size="size * 0.4" :color="activeColor" />
                    </view>
                    <text class="item__name">{{ getShortName(icon) }}</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getStatusBarHeight } from '@/utils/system.js';

const statusBarHeight = ref(getStatusBarHeight() || 0);
const size = ref(80);
const activeColor = ref('#ef4444');
const selectedIcon = ref('');
const icons = ref([]);
const presets = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#0f172a'];

const previewSize = computed(() => `${size.value}px`);
const iconIndex = computed(() => icons.value.indexOf(selectedIcon.value));
const currentIconShortName = computed(() => getShortName(selectedIcon.value) || 'Select');

const getShortName = (path) => {
    if (!path) return '';
    const parts = path.split('/');
    return parts[parts.length - 1];
};

const onIconPick = (e) => {
    selectedIcon.value = icons.value[e.detail.value];
};

const onSizeChange = (e) => {
    size.value = e.detail.value;
};

const goBack = () => {
    uni.navigateBack({
        fail: () => {
            uni.reLaunch({ url: '/pages/app/index' });
        }
    });
};

const loadIcons = () => {
    const modules = import.meta.glob('../../static/icons/**/*.svg', { eager: true, query: '?url', import: 'default' });
    const list = Object.entries(modules)
        .filter(([key]) => !key.includes('/brands/'))
        .map(([, url]) => url)
        .sort();
    icons.value = list;
    if (list.length > 0) selectedIcon.value = list[0];
};

loadIcons();
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background-color: #f8fafc;
    padding-bottom: 60rpx;
}

.header {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    padding: 0 40rpx 140rpx;
    position: relative;
    
    &__inner {
        position: relative;
        padding-top: 30rpx;
        display: flex;
        align-items: center;
    }
    
    .back-btn {
        width: 80rpx;
        height: 80rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 20rpx;
        border: 1rpx solid rgba(255, 255, 255, 0.1);
        margin-right: 20rpx;
        
        &:active {
            transform: scale(0.9);
            background: rgba(255, 255, 255, 0.1);
        }
    }

    &__title {
        font-size: 48rpx;
        font-weight: 800;
        color: #fff;
        display: block;
    }
    
    &__subtitle {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 8rpx;
        display: block;
    }
}

.container {
    padding: 0 30rpx;
    margin-top: -80rpx;
}

.hero-card {
    background: #fff;
    border-radius: 40rpx;
    padding: 50rpx 40rpx;
    box-shadow: 0 20rpx 50rpx rgba(0, 0, 0, 0.05);
    position: relative;
    overflow: hidden;
    margin-bottom: 50rpx;

    &__preview {
        height: 180rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 40rpx;
        background: radial-gradient(circle at center, #f1f5f9 0%, transparent 70%);
    }
}

.picker-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 80rpx;
    background: #f8fafc;
    border: 1rpx solid #e2e8f0;
    border-radius: 20rpx;
    padding: 0 24rpx;
    
    &__text {
        font-size: 26rpx;
        color: #1e293b;
        font-weight: 600;
    }
}

.controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30rpx;
    border-top: 1rpx solid #f1f5f9;
    padding-top: 40rpx;
}

.control-item {
    margin-bottom: 30rpx;

    &.is-full {
        grid-column: span 2;
    }

    &__label {
        font-size: 20rpx;
        color: #94a3b8;
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 12rpx;
        display: block;
    }
}

.color-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
}

.color-dot {
    width: 44rpx;
    height: 44rpx;
    border-radius: 50%;
    border: 4rpx solid transparent;
    transition: all 0.2s;

    &.is-active {
        border-color: #cbd5e1;
        transform: scale(1.1);
    }
}

.demo-badge {
    position: absolute;
    top: 20rpx;
    right: -60rpx;
    background: #6366f1;
    padding: 6rpx 80rpx;
    transform: rotate(45deg);
    
    text {
        font-size: 14rpx;
        font-weight: 800;
        color: #fff;
        text-transform: uppercase;
    }
}

.library-header {
    margin-bottom: 24rpx;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}

.library-title {
    font-size: 32rpx;
    font-weight: 800;
    color: #1e293b;
}

.library-count {
    font-size: 22rpx;
    color: #94a3b8;
}

.grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20rpx;
}

.item {
    background: #fff;
    border-radius: 24rpx;
    padding: 30rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1rpx solid #eff6ff;
    transition: all 0.2s;

    &__icon-wrap {
        margin-bottom: 20rpx;
        transition: transform 0.2s;
    }

    &__name {
        font-size: 20rpx;
        color: #64748b;
        text-align: center;
        width: 100%;
        word-break: break-all;
    }
}

// 核心功能点：CSS 颜色注入
.icon-styled {
    color: v-bind(activeColor);
    transition: color 0.3s ease;
}
</style>
