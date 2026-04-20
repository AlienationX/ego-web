<template>
    <!-- #ifdef APP -->
    <view class="mdi-icon mdi-icon--app" :style="appContainerStyle">
        <image class="mdi-icon__image" :src="path" :style="appImageStyle" mode="aspectFit"></image>
    </view>
    <!-- #endif -->

    <!-- #ifndef APP -->
    <view class="mdi-icon" :style="iconStyle"></view>
    <!-- #endif -->
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    path: {
        type: String,
        required: true,
    },
    size: {
        type: [Number, String],
        default: '24px',
    },
    color: {
        type: String,
        default: 'currentColor',
    },
});

const sizeValue = computed(() => {
    const s = String(props.size);
    // 如果没有单位，默认补上 px (或根据项目规范补 rpx，此处遵循 mdi 一般使用 px 的规范)
    return isNaN(Number(s)) ? s : `${s}px`;
});

const iconStyle = computed(() => {
    return {
        width: sizeValue.value,
        height: sizeValue.value,
        backgroundColor: props.color,
        // 核心：使用遮罩技术
        '-webkit-mask-image': `url(${props.path})`,
        'mask-image': `url(${props.path})`,
        '-webkit-mask-size': '100% 100%',
        'mask-size': '100% 100%',
        '-webkit-mask-repeat': 'no-repeat',
        'mask-repeat': 'no-repeat',
        // 确保弹性布局下不缩放
        'flex-shrink': 0,
    };
});

const appContainerStyle = computed(() => {
    return {
        width: sizeValue.value,
        height: sizeValue.value,
        display: 'inline-block',
        verticalAlign: 'middle',
        overflow: 'hidden',
        flexShrink: 0,
    };
});

const appImageStyle = computed(() => {
    // 提取数值和单位用于偏移
    const val = parseFloat(sizeValue.value);
    const unit = sizeValue.value.replace(/[0-9.]/g, '') || 'px';
    const offset = `${val}${unit}`;
    
    return {
        width: sizeValue.value,
        height: sizeValue.value,
        display: 'block',
        // 使用 drop-shadow 产生指定颜色的投影，并将原图移出容器可见区
        filter: `drop-shadow(0 ${offset} 0 ${props.color})`,
        transform: `translateY(-${offset})`,
    };
});
</script>

<style scoped>
.mdi-icon {
    display: inline-block;
    vertical-align: middle;
}
</style>
