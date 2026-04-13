<template>
    <view class="classLayout">
        <!-- 装饰性背景层：改为绝对定位并提升层级，确保在 Web 端可见 -->
        <view class="decorative-layer">
            <view class="glow-sphere"></view>
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
                <view 
                    class="grid-item-wrap" 
                    :class="['grid-item-' + (idx % 6)]"
                >
                    <classify-item :item="item"></classify-item>
                </view>
                
                <view v-if="(idx + 1) % 6 === 0 && isAdVisible(idx)" class="ad-row">
                    <custom-ad-banner
                        style="padding: 15rpx 0"
                        @load="onAdLoad(idx)"
                        @error="onAdError(idx)"
                        @close="onAdClose(idx)"></custom-ad-banner>
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

    const statusBarHeight = ref(getStatusBarHeight());
    const classifyList = ref([]);
    const isLoading = ref(true);
    const userStore = useUserStore();
    const adStateMap = ref({});

    const classifyComputed = computed(() => {
        return classifyList.value.map((item) => ({
            ...item,
            name: uni.getLocale() === 'en' ? item.name_en : item.name
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
    })
</script>

<style lang="scss" scoped>
    .classLayout {
        background: #fff;
        min-height: 100vh;
        position: relative;
    }

    .decorative-layer {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;

        .glow-sphere {
            position: absolute;
            top: 5%;
            left: -10%;
            width: 80%;
            height: 40%;
            background: radial-gradient(circle, rgba(40, 179, 137, 0.15) 0%, transparent 70%);
            filter: blur(80px);
            animation: move 15s infinite alternate ease-in-out;
        }

        .glass-mask {
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(240, 242, 245, 0.5) 100%);
        }
    }

    @keyframes move {
        0% { transform: translate(0, 0); }
        100% { transform: translate(10%, 10%); }
    }

    .hero-section {
        position: relative;
        padding: 50rpx 40rpx 10rpx;
        z-index: 10;
        
        .hero-title {
            font-size: 68rpx;
            font-weight: 900;
            color: #000;
            letter-spacing: -2rpx;
            line-height: 1.1;
            // 针对 Web 端增强投影
            filter: drop-shadow(0 4rpx 8rpx rgba(0,0,0,0.1));
        }

        .hero-desc {
            font-size: 26rpx;
            color: #666;
            margin-top: 15rpx;
            font-weight: 500;
            letter-spacing: 1rpx;
        }

        .search-container {
            margin: 30rpx -30rpx 0;
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
        &.grid-item-2, &.grid-item-4 {
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
