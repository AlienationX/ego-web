<template>
    <view class="guide-layout">
        <swiper
            class="swiper"
            :current="currentIndex"
            :indicator-dots="false"
            :autoplay="false"
            :circular="false"
            :duration="320"
            @change="onSwiperChange"
        >
            <swiper-item v-for="(item, index) in guideList" :key="index" class="swiper-item">
                <view class="guide-page">
                    <view class="guide-stage">
                        <image class="guide-visual" :src="item.visual" mode="widthFix"></image>
                    </view>

                    <view class="guide-content">
                        <view class="guide-content__panel">
                            <view class="guide-title">{{ item.title }}</view>
                            <view class="guide-desc">{{ item.desc }}</view>
                            <view class="guide-meta">
                                <view class="guide-meta__item" v-for="feature in item.features" :key="feature">
                                    {{ feature }}
                                </view>
                            </view>
                        </view>
                    </view>
                </view>
            </swiper-item>
        </swiper>

        <view class="skip-btn" v-if="currentIndex < guideList.length - 1" @click="skipGuide">
            <text class="skip-btn__text">{{ t('guide.skip') }}</text>
            <text class="skip-btn__arrow">›</text>
        </view>

        <view class="guide-status" v-if="currentIndex === guideList.length - 1">
            <view class="guide-status__dot"></view>
            <text class="guide-status__text">{{ t('guide.ready') }}</text>
        </view>

        <view class="indicator-wrapper">
            <view
                class="indicator-dot"
                v-for="(item, index) in guideList"
                :key="index"
                :class="{ active: currentIndex === index }"
            ></view>
        </view>

        <view class="enter-btn" v-if="currentIndex === guideList.length - 1" @click="enterApp">
            {{ t('guide.enter') }}
        </view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const currentIndex = ref(0);

const guideList = computed(() => [
    {
        visual: '/static/images/guide/guide1.png',
        title: t('guide.page1.title'),
        desc: t('guide.page1.desc'),
        placeholder: t('guide.page1.placeholder'),
        hint: t('guide.page1.hint'),
        features: [t('guide.page1.feature1'), t('guide.page1.feature2'), t('guide.page1.feature3')],
    },
    {
        visual: '/static/images/guide/guide2.png',
        title: t('guide.page2.title'),
        desc: t('guide.page2.desc'),
        placeholder: t('guide.page2.placeholder'),
        hint: t('guide.page2.hint'),
        features: [t('guide.page2.feature1'), t('guide.page2.feature2'), t('guide.page2.feature3')],
    },
    {
        visual: '/static/images/guide/guide3.png',
        title: t('guide.page3.title'),
        desc: t('guide.page3.desc'),
        placeholder: t('guide.page3.placeholder'),
        hint: t('guide.page3.hint'),
        features: [t('guide.page3.feature1'), t('guide.page3.feature2'), t('guide.page3.feature3')],
    },
]);

const onSwiperChange = (e) => {
    currentIndex.value = e.detail.current;
};

const handleIndicatorClick = (index) => {
    if (index === currentIndex.value && index === guideList.value.length - 1) {
        enterApp();
        return;
    }

    currentIndex.value = index;
};

const skipGuide = () => {
    enterApp();
};

const enterApp = () => {
    uni.setStorageSync('hasSeenGuide', true);
    uni.switchTab({
        url: '/pages/app/index',
    });
};

onLoad(() => {});
</script>

<style lang="scss" scoped>
.guide-layout {
    --text-main: #f7f7fb;
    --text-sub: rgba(247, 247, 251, 0.72);
    width: 100%;
    height: 100vh;
    position: relative;
    overflow: hidden;
    background: #111111;
}

.guide-bg-shape {
    position: absolute;
    border: 2rpx solid rgba(255, 255, 255, 0.06);
    border-radius: 50%;
    opacity: 0.7;
}

.guide-bg-shape--left {
    width: 520rpx;
    height: 520rpx;
    left: -180rpx;
    top: 220rpx;
}

.guide-bg-shape--right {
    width: 680rpx;
    height: 680rpx;
    right: -260rpx;
    bottom: 220rpx;
}

.guide-bg-line {
    position: absolute;
    left: 48rpx;
    right: 48rpx;
    height: 2rpx;
    background: rgba(255, 255, 255, 0.08);
}

.guide-bg-line--top {
    top: calc(env(safe-area-inset-top) + 56rpx);
}

.guide-bg-line--bottom {
    bottom: calc(env(safe-area-inset-bottom) + 124rpx);
}

.swiper,
.swiper-item {
    width: 100%;
    height: 100%;
}

.guide-page {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    padding: calc(env(safe-area-inset-top) + 84rpx) 44rpx calc(env(safe-area-inset-bottom) + 176rpx);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 20rpx;
}

.guide-stage {
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    min-height: 0;
}

.guide-visual {
    display: block;
    width: 100%;
    max-width: 840rpx;
    margin: 100rpx auto 0;
}

.guide-content {
    display: flex;
    justify-content: center;
    flex-shrink: 0;
}

.guide-content__panel {
    width: 100%;
    padding: 12rpx 10rpx 0;
}

.guide-title {
    color: var(--text-main);
    font-size: 52rpx;
    line-height: 1.2;
    font-weight: 700;
    letter-spacing: 1rpx;
    text-align: center;
}

.guide-desc {
    margin-top: 18rpx;
    color: var(--text-sub);
    font-size: 28rpx;
    line-height: 1.75;
    text-align: center;
}

.guide-meta {
    margin-top: 26rpx;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 16rpx;
}

.guide-meta__item {
    padding: 14rpx 22rpx;
    border-radius: 999rpx;
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.86);
    background: rgba(255, 255, 255, 0.06);
    border: 2rpx solid rgba(255, 255, 255, 0.06);
}

.skip-btn {
    position: fixed;
    top: calc(env(safe-area-inset-top) + 32rpx);
    right: 28rpx;
    z-index: 8;
    display: flex;
    align-items: center;
    gap: 10rpx;
    padding: 14rpx 18rpx 14rpx 24rpx;
    border-radius: 999rpx;
    background: rgba(255, 255, 255, 0.05);
    border: 2rpx solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10rpx);
}

.skip-btn__text {
    color: rgba(255, 255, 255, 0.86);
    font-size: 24rpx;
    letter-spacing: 1rpx;
}

.skip-btn__arrow {
    width: 34rpx;
    height: 34rpx;
    border-radius: 50%;
    text-align: center;
    line-height: 34rpx;
    color: #111111;
    font-size: 26rpx;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.88);
}

.guide-status {
    position: fixed;
    top: calc(env(safe-area-inset-top) + 32rpx);
    right: 28rpx;
    z-index: 8;
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 16rpx 22rpx;
    border-radius: 999rpx;
    background: rgba(255, 255, 255, 0.05);
    border: 2rpx solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10rpx);
}

.guide-status__dot {
    width: 14rpx;
    height: 14rpx;
    border-radius: 50%;
    background: #7df7c4;
    box-shadow: 0 0 18rpx rgba(125, 247, 196, 0.6);
}

.guide-status__text {
    color: rgba(255, 255, 255, 0.88);
    font-size: 24rpx;
    letter-spacing: 1rpx;
}

.indicator-wrapper {
    position: fixed;
    left: 50%;
    bottom: calc(env(safe-area-inset-bottom) + 74rpx);
    z-index: 8;
    display: flex;
    align-items: center;
    gap: 22rpx;
    transform: translateX(-50%);
}

.indicator-dot {
    width: 18rpx;
    height: 18rpx;
    border-radius: 999rpx;
    background: rgba(255, 255, 255, 0.24);
    transition: all 0.28s ease;
}

.indicator-dot.active {
    width: 48rpx;
    height: 8rpx;
    background: #ffffff;
    box-shadow: none;
}

.enter-btn {
    position: fixed;
    left: 50%;
    bottom: calc(env(safe-area-inset-bottom) + 140rpx);
    z-index: 8;
    min-width: 240rpx;
    padding: 22rpx 48rpx;
    border-radius: 999rpx;
    transform: translateX(-50%);
    text-align: center;
    color: #111111;
    font-size: 28rpx;
    font-weight: 600;
    background: #ffffff;
}
</style>
