<template>
    <view class="classLayout">
        <view class="decorative-layer">
            <view class="sphere sphere-1"></view>
            <view class="sphere sphere-2"></view>
            <view class="sphere sphere-3"></view>
            <view class="glass-mask"></view>
        </view>

        <!-- 沉浸式头部区域 -->
        <view class="hero-section" :style="{ paddingTop: statusBarHeight + 'px' }">
            <view class="hero-header">
                <view class="title-group">
                    <view class="hero-title">{{ $t('category.title') }}</view>
                    <view class="hero-desc">{{ $t('category.desc') }}</view>
                </view>
            </view>

            <view class="search-container">
                <search-bar></search-bar>
            </view>
        </view>

        <!-- 加载状态 -->
        <view v-if="isLoading" class="loading-container">
            <rotate-loading :size="100"></rotate-loading>
            <view class="loading-text">{{ $t('message.loading') }}</view>
        </view>

        <!-- 空状态 -->
        <view v-else-if="!classifyList.length" class="empty-container">
            <view class="empty-text">{{ $t('category.empty') }}</view>
        </view>

        <!-- 分类网格：采用弹性 Span 布局，彻底解决错落有致不生效问题 -->
        <view class="classify" v-if="classifyList.length">
            <template v-for="(item, idx) in classifyComputed" :key="item.id">
                <view class="grid-item-wrap" :class="['grid-item-' + (idx % 6)]">
                    <classify-item :item="item"></classify-item>
                </view>

                <view v-if="(idx + 1) % 6 === 0 && isAdVisible(idx)" class="ad-row">
                    <custom-ad-banner
                        style="padding: 15rpx 0"
                        @load="onAdLoad(idx)"
                        @error="onAdError(idx)"
                        @close="onAdClose(idx)"
                    ></custom-ad-banner>
                </view>
            </template>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { apiGetClassify } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { useUserStore } from '@/stores/user.js';
import { getStatusBarHeight } from '@/utils/system.js';

const statusBarHeight = ref(getStatusBarHeight() + 10);
const classifyList = ref([]);
const isLoading = ref(true);
const userStore = useUserStore();
const adStateMap = ref({});

const classifyComputed = computed(() => {
    return classifyList.value.map((item) => ({
        ...item,
        name: uni.getLocale() === 'en' ? item.name_en : item.name,
    }));
});
const adEnabled = computed(() => !userStore.isVip && userStore.showAd);
const fullBlockCount = computed(() => Math.floor(classifyComputed.value.length / 6));

const getClassify = async () => {
    try {
        isLoading.value = true;
        let res = await apiGetClassify();
        classifyList.value = (res.data || []).map((item) => handlePicUrl(item));
        uni.setStorageSync('classifyList', classifyList.value);
    } catch (error) {
        console.error('获取分类数据失败:', error);
    } finally {
        isLoading.value = false;
    }
};

const setupAdBlocks = () => {
    const nextState = {};
    if (!adEnabled.value) {
        adStateMap.value = nextState;
        return;
    }
    for (let block = 0; block < fullBlockCount.value; block++) {
        nextState[block] = 'pending';
    }
    adStateMap.value = nextState;
};

watch([fullBlockCount, adEnabled], setupAdBlocks, { immediate: true });

const getBlockByIdx = (idx) => Math.floor(idx / 6);
const isAdBlockVisible = (block) => adEnabled.value && adStateMap.value[block] === 'loaded';

const onAdLoad = (idx) => {
    const block = getBlockByIdx(idx);
    adStateMap.value = { ...adStateMap.value, [block]: 'loaded' };
};

const onAdError = (idx) => {
    const block = getBlockByIdx(idx);
    adStateMap.value = { ...adStateMap.value, [block]: 'hidden' };
};

const onAdClose = (idx) => {
    const block = getBlockByIdx(idx);
    adStateMap.value = { ...adStateMap.value, [block]: 'hidden' };
};

const isAdVisible = (idx) => {
    const block = getBlockByIdx(idx);
    return isAdBlockVisible(block);
};

onLoad(() => {
    getClassify();
});
</script>

<style lang="scss" scoped>
.classLayout {
    background: #f4f7fd; // 改为更具通透感的浅瓷蓝作为基座
    min-height: 100vh;
    position: relative;
}

.decorative-layer {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;

    .sphere {
        position: absolute;
        border-radius: 50%;
        filter: blur(120px);
        opacity: 0.8; // 提升整体可见度
        will-change: transform;
    }

    .sphere-1 {
        top: -15%;
        right: -10%;
        width: 90%;
        height: 60%;
        background: radial-gradient(circle, rgba(52, 97, 253, 0.28) 0%, transparent 80%);
        animation: float-1 18s infinite alternate ease-in-out;
    }

    .sphere-2 {
        bottom: 5%;
        left: -15%;
        width: 100%;
        height: 70%;
        background: radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, transparent 80%);
        animation: float-2 22s infinite alternate ease-in-out;
    }

    .sphere-3 {
        top: 20%;
        left: 5%;
        width: 70%;
        height: 45%;
        background: radial-gradient(circle, rgba(20, 184, 166, 0.2) 0%, transparent 80%);
        animation: float-3 15s infinite alternate ease-in-out;
    }

    .glass-mask {
        position: absolute;
        inset: 0;
        // 降低遮罩白色的权重，确保下方流光能透出来
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.6) 100%);
        backdrop-filter: blur(10rpx);
    }
}

@keyframes float-1 {
    0% {
        transform: translate(0, 0) rotate(0deg) scale(1);
    }
    100% {
        transform: translate(-15%, 15%) rotate(15deg) scale(1.1);
    }
}
@keyframes float-2 {
    0% {
        transform: translate(0, 0) scale(1);
    }
    100% {
        transform: translate(15%, -15%) scale(1.15);
    }
}
@keyframes float-3 {
    0% {
        transform: translate(0, 0) rotate(0deg);
    }
    100% {
        transform: translate(-10%, -20%) rotate(-10deg);
    }
}

.hero-section {
    position: relative;
    padding: 0rpx 30rpx;
    z-index: 10;

    .hero-title {
        font-size: 68rpx;
        font-weight: 900;
        color: #000;
        letter-spacing: -2rpx;
        line-height: 1.1;
        // 针对 Web 端增强投影
        filter: drop-shadow(0 4rpx 8rpx rgba(0, 0, 0, 0.1));
    }

    .hero-desc {
        font-size: 28rpx;
        color: #666;
        margin-top: 15rpx;
        font-weight: 500;
        letter-spacing: 1rpx;
    }

    .search-container {
        margin: 10rpx -30rpx 0;
    }
}

.classify {
    padding: 20rpx 30rpx 100rpx;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 210rpx;
    gap: 24rpx;
    position: relative;
    z-index: 5;
}

.grid-item-wrap {
    width: 100%;
    height: 100%;
    display: block;

    // 核心布局逻辑：通过 CSS Span 解决杂志感错落
    // 第3个项目(idx 2)和第5个项目(idx 4)跨两行
    &.grid-item-2,
    &.grid-item-4 {
        grid-row: span 2;
    }

    // 强制其内部组件撑满父容器（微信小程序不支持 * 通配符，使用具体类名）
    & > .classify-item,
    & > view {
        height: 100%;
        width: 100%;
        display: block;
    }
}

.ad-row {
    grid-column: span 2;
    width: 100%;
}

.loading-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 50vh;
    z-index: 10;
    position: relative;

    .loading-text {
        margin-top: 20rpx;
        font-size: 24rpx;
        color: #999;
    }
}
</style>
