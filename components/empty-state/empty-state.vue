<template>
    <view class="empty-state">
        <view class="empty-state__icon">
            <mdi-icon :path="iconPath" size="32px" color="#98A2B3"></mdi-icon>
        </view>
        <view class="empty-state__title">{{ title }}</view>
        <view v-if="description" class="empty-state__description">{{ description }}</view>
        <button v-if="actionText" class="empty-state__action" @click="$emit('action')">{{ actionText }}</button>
    </view>
</template>

<script setup>
defineEmits(['action']);

defineProps({
    iconPath: {
        type: String,
        default: '/static/icons/image.svg',
    },
    title: {
        type: String,
        default: '',
    },
    description: {
        type: String,
        default: '',
    },
    actionText: {
        type: String,
        default: '',
    },
});
</script>

<style lang="scss" scoped>
.empty-state {
    padding: 180rpx 48rpx 120rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.empty-state__icon {
    width: 112rpx;
    height: 112rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.82);
    border: 1rpx solid rgba(16, 24, 40, 0.05);
    box-shadow: 0 12rpx 24rpx rgba(15, 23, 42, 0.06);
}

.empty-state__title {
    margin-top: 28rpx;
    font-size: 32rpx;
    font-weight: 700;
    color: #101828;
}

.empty-state__description {
    margin-top: 14rpx;
    font-size: 24rpx;
    line-height: 1.7;
    color: #667085;
}

.empty-state__action {
    margin-top: 38rpx;
    min-width: 260rpx;
    height: 82rpx;
    padding: 0 34rpx;
    border-radius: 999rpx;
    border: none;
    background: linear-gradient(135deg, #18202a 0%, #283648 100%);
    color: #fff;
    font-size: 28rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
        border: none;
    }
}
</style>
