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

    .theme-dark & {
        background: rgba(255, 255, 255, 0.08);
        border: 1rpx solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 12rpx 24rpx rgba(0, 0, 0, 0.3);
    }
}

.empty-state__title {
    margin-top: 28rpx;
    font-size: 32rpx;
    font-weight: 700;
    color: #101828;

    .theme-dark & {
        color: var(--text-primary);
    }
}

.empty-state__description {
    margin-top: 14rpx;
    font-size: 24rpx;
    line-height: 1.7;
    color: #667085;

    .theme-dark & {
        color: var(--text-tertiary);
    }
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

    .theme-dark & {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
        color: var(--text-primary);
    }
}
</style>
