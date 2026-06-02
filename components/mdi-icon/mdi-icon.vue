<template>
    <!-- #ifdef APP -->
    <view class="mdi-icon mdi-icon--app" :style="appContainerStyle">
        <image class="mdi-icon__image" :src="path" :style="appImageStyle" mode="aspectFit"></image>
    </view>
    <!-- #endif -->

    <!-- #ifndef APP -->
    <text :class="['mdi-icon', 'mdi-icon-font', `appicons-${iconName}`]" :style="webMiniStyle"></text>
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
    return isNaN(Number(s)) ? s : `${s}px`;
});

const iconName = computed(() => {
    const source = String(props.path || '');
    const parts = source.split('/');
    const filename = parts[parts.length - 1] || '';
    return filename.replace(/\.svg$/i, '');
});

const webMiniStyle = computed(() => ({
    color: props.color,
    fontSize: sizeValue.value,
    width: sizeValue.value,
    height: sizeValue.value,
    lineHeight: sizeValue.value,
}));

// ===== APP 原生：drop-shadow 方案 =====
const appContainerStyle = computed(() => ({
    width: sizeValue.value,
    height: sizeValue.value,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
}));

const appImageStyle = computed(() => {
    const val = parseFloat(sizeValue.value);
    const unit = sizeValue.value.replace(/[0-9.]/g, '') || 'px';
    const offset = `${val}${unit}`;
    return {
        width: sizeValue.value,
        height: sizeValue.value,
        display: 'block',
        filter: `drop-shadow(0 ${offset} 0 ${props.color})`,
        transform: `translateY(-${offset})`,
    };
});
</script>

<style>
@import '@/static/iconfont/appicons.css';

.mdi-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
    vertical-align: middle;
}

.mdi-icon-font {
    display: inline-block;
    text-align: center;
    flex-shrink: 0;
}
</style>
