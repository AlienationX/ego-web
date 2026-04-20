<template>
    <uni-popup ref="popupRef" type="center" :mask-click="maskClick" :safe-area="true">
        <view class="dialog">
            <view class="dialog__content">
                <text class="dialog__title">{{ title }}</text>
                <text v-if="description" class="dialog__desc">{{ description }}</text>
            </view>

            <view class="dialog__actions">
                <view class="dialog__button dialog__button--confirm" @click="handleConfirm">
                    {{ confirmText || $t('common.confirm') }}
                </view>
                <view class="dialog__button dialog__button--cancel" @click="handleCancel">
                    {{ cancelText || $t('common.cancel') }}
                </view>
            </view>
        </view>
    </uni-popup>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
    title: {
        type: String,
        default: '提示',
    },
    description: {
        type: String,
        default: '',
    },
    confirmText: {
        type: String,
        default: '',
    },
    cancelText: {
        type: String,
        default: '',
    },
    maskClick: {
        type: Boolean,
        default: true,
    },
});

const emit = defineEmits(['confirm', 'cancel']);

const popupRef = ref(null);

const open = () => {
    popupRef.value?.open();
};

const close = () => {
    popupRef.value?.close();
};

const handleConfirm = () => {
    close();
    emit('confirm');
};

const handleCancel = () => {
    close();
    emit('cancel');
};

defineExpose({
    open,
    close,
});
</script>

<style lang="scss" scoped>
.dialog {
    width: 600rpx;
    padding: 50rpx 48rpx 30rpx;
    background: #ffffff;
    border-radius: 56rpx;
    box-shadow: 0 24rpx 60rpx rgba(0, 0, 0, 0.12);
}

.dialog__content {
    text-align: left;
}

.dialog__title {
    display: block;
    font-size: 32rpx;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 24rpx;
}

.dialog__desc {
    display: block;
    font-size: 26rpx;
    color: #475569;
    line-height: 1.5;
    margin-bottom: 20rpx;
}

.dialog__actions {
    margin-top: 32rpx;
    display: flex;
    justify-content: flex-end;
    gap: 40rpx;
}

.dialog__button {
    padding: 20rpx 10rpx;
    font-size: 28rpx;
    font-weight: 600;
    transition: all 0.2s;
    
    // 文字颜色参考截图中的蓝紫色调
    color: #5c6ac4;

    &:active {
        opacity: 0.6;
        transform: scale(0.95);
    }
}

.dialog__button--cancel {
    // 如果需要取消按钮颜色稍淡，可以在此调整，但截图中似乎一致
}
</style>
