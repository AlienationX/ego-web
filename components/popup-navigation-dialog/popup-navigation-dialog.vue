<template>
    <uni-popup ref="popupRef" type="center" :mask-click="maskClick" :safe-area="true">
        <view class="dialog">
            <view class="dialog__close" @click="handleCancel">
                <mdi-icon path="/static/icons/close.svg" size="16px" color="#f5f7fb"></mdi-icon>
            </view>

            <view class="dialog__content">
                <text class="dialog__title">{{ title }}</text>
                <text v-if="description" class="dialog__desc">{{ description }}</text>
            </view>

            <view class="dialog__actions">
                <button class="dialog__button dialog__button--primary" @click="handleConfirm">
                    {{ confirmText }}
                </button>
                <button class="dialog__button dialog__button--secondary" @click="handleCancel">
                    {{ cancelText }}
                </button>
            </view>
        </view>
    </uni-popup>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
    title: {
        type: String,
        default: '',
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
    width: 620rpx;
    padding: 42rpx 36rpx 30rpx;
    position: relative;
    border-radius: 40rpx;
    background: #2b2d36;
    box-shadow: 0 28rpx 80rpx rgba(15, 23, 42, 0.34);
}

.dialog__close {
    position: absolute;
    top: 24rpx;
    right: 24rpx;
    width: 54rpx;
    height: 54rpx;
    border-radius: 27rpx;
    border: 2rpx solid rgba(255, 255, 255, 0.24);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.04);
}

.dialog__content {
    padding: 10rpx 30rpx 0;
    text-align: center;
}

.dialog__title {
    display: block;
    color: #ffffff;
    font-size: 52rpx;
    line-height: 1.18;
    font-weight: 700;
}

.dialog__desc {
    display: block;
    margin-top: 22rpx;
    color: rgba(255, 255, 255, 0.74);
    font-size: 30rpx;
    line-height: 1.6;
}

.dialog__actions {
    margin-top: 42rpx;
    display: flex;
    flex-direction: column;
    gap: 18rpx;
}

.dialog__button {
    width: 100%;
    border: none;
    border-radius: 30rpx;
    font-size: 30rpx;
    font-weight: 600;
    line-height: 96rpx;
}

.dialog__button::after {
    border: none;
}

.dialog__button--primary {
    color: #ffffff;
    background: #ce645c;
    box-shadow: 0 14rpx 30rpx rgba(206, 100, 92, 0.24);
}

.dialog__button--secondary {
    color: rgba(255, 255, 255, 0.92);
    background: transparent;
}
</style>
