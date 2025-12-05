<template>
    <view class="guide-layout">
        <swiper 
            class="swiper" 
            :indicator-dots="false" 
            :autoplay="false" 
            :circular="false"
            :duration="300"
            @change="onSwiperChange"
        >
            <swiper-item v-for="(item, index) in guideList" :key="index" class="swiper-item">
                <view class="guide-page">
                    <view class="guide-image-wrapper">
                        <image 
                            v-if="!imageError[index]"
                            class="guide-image" 
                            :src="item.image" 
                            mode="aspectFit"
                            @error="() => onImageError(index)"
                        ></image>
                        <!-- 图片加载失败时显示图标占位 -->
                        <view class="guide-icon-placeholder" v-else>
                            <uni-icons :type="item.icon + '-filled'" size="120" color="#fff"></uni-icons>
                        </view>
                    </view>
                    <view class="guide-content">
                        <view class="guide-title">{{ item.title }}</view>
                        <view class="guide-desc">{{ item.desc }}</view>
                    </view>
                </view>
            </swiper-item>
        </swiper>

        <!-- 跳过按钮 -->
        <view class="skip-btn" v-if="currentIndex < guideList.length - 1" @click="skipGuide">
            {{ t('guide.skip') }}
        </view>

        <!-- 进入按钮（最后一页显示） -->
        <view class="enter-btn" v-if="currentIndex === guideList.length - 1" @click="enterApp">
            {{ t('guide.enter') }}
        </view>

        <!-- 指示器（自定义样式） -->
        <view class="indicator-wrapper">
            <view 
                class="indicator-dot" 
                v-for="(item, index) in guideList" 
                :key="index"
                :class="{ active: currentIndex === index }"
            ></view>
        </view>
    </view>
</template>

<script setup>
    import { ref, onMounted, computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    const { t } = useI18n();
    
    const currentIndex = ref(0);
    const imageError = ref({});
    
    // 引导页数据（使用计算属性确保国际化正确）
    const guideList = computed(() => [
        {
            image: '/static/guide/guide1.png',
            icon: 'image',
            title: t('guide.page1.title'),
            desc: t('guide.page1.desc')
        },
        {
            image: '/static/guide/guide2.png',
            icon: 'grid',
            title: t('guide.page2.title'),
            desc: t('guide.page2.desc')
        },
        {
            image: '/static/guide/guide3.png',
            icon: 'heart',
            title: t('guide.page3.title'),
            desc: t('guide.page3.desc')
        }
    ]);

    // 图片加载失败处理
    const onImageError = (index) => {
        imageError.value[index] = true;
    };

    // 轮播切换事件
    const onSwiperChange = (e) => {
        currentIndex.value = e.detail.current;
    };

    // 跳过引导
    const skipGuide = () => {
        enterApp();
    };

    // 进入应用
    const enterApp = () => {
        // 标记已看过引导页
        uni.setStorageSync('hasSeenGuide', true);
        
        // 跳转到首页
        uni.reLaunch({
            url: '/pages/index/index'
        });
    };

    onMounted(() => {
        // 检查是否已看过引导页
        const hasSeenGuide = uni.getStorageSync('hasSeenGuide');
        if (hasSeenGuide) {
            // 已看过，直接跳转到首页
            uni.reLaunch({
                url: '/pages/index/index'
            });
        }
    });
</script>

<style lang="scss" scoped>
    .guide-layout {
        width: 100%;
        height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        position: relative;
        overflow: hidden;
    }

    .swiper {
        width: 100%;
        height: 100%;
    }

    .swiper-item {
        width: 100%;
        height: 100%;
    }

    .guide-page {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0 60rpx;
        padding-top: calc(env(safe-area-inset-top) + 100rpx);
        padding-bottom: calc(env(safe-area-inset-bottom) + 200rpx);
        box-sizing: border-box;
    }

    .guide-image-wrapper {
        width: 600rpx;
        height: 600rpx;
        margin-bottom: 80rpx;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .guide-image {
        width: 100%;
        height: 100%;
        border-radius: 32rpx;
        box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
    }

    .guide-icon-placeholder {
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 32rpx;
        backdrop-filter: blur(10rpx);
    }

    .guide-content {
        text-align: center;
        color: #fff;
    }

    .guide-title {
        font-size: 48rpx;
        font-weight: 700;
        margin-bottom: 32rpx;
        color: #fff;
        text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
    }

    .guide-desc {
        font-size: 32rpx;
        line-height: 1.6;
        color: rgba(255, 255, 255, 0.9);
        padding: 0 40rpx;
    }

    .skip-btn {
        position: fixed;
        top: calc(env(safe-area-inset-top) + 40rpx);
        right: 40rpx;
        padding: 16rpx 32rpx;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 40rpx;
        font-size: 28rpx;
        color: #fff;
        z-index: 10;
        backdrop-filter: blur(10rpx);
        border: 2rpx solid rgba(255, 255, 255, 0.3);
        transition: all 0.3s;

        &:active {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0.95);
        }
    }

    .enter-btn {
        position: fixed;
        bottom: calc(env(safe-area-inset-bottom) + 80rpx);
        left: 50%;
        transform: translateX(-50%);
        width: 600rpx;
        padding: 28rpx 0;
        background: #fff;
        border-radius: 50rpx;
        font-size: 36rpx;
        font-weight: 600;
        color: #667eea;
        text-align: center;
        z-index: 10;
        box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
        transition: all 0.3s;

        &:active {
            transform: translateX(-50%) scale(0.95);
            box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
        }
    }

    .indicator-wrapper {
        position: fixed;
        bottom: calc(env(safe-area-inset-bottom) + 200rpx);
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 16rpx;
        z-index: 10;
    }

    .indicator-dot {
        width: 16rpx;
        height: 16rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.4);
        transition: all 0.3s;

        &.active {
            width: 40rpx;
            background: #fff;
            border-radius: 8rpx;
        }
    }
</style>
