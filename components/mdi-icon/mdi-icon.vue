<template>
    <text 
        :class="['mdi-icon', 'mdi-icon-font', `appicons-${iconName}`]" 
        :style="iconStyle"
    ></text>
</template>

<script setup>
import { computed } from 'vue';

defineOptions({
    options: {
        virtualHost: true,
        styleIsolation: 'apply-shared',
    },
});

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

// 矢量字体图标样式
const iconStyle = computed(() => ({
    color: props.color || 'inherit',
    fontSize: sizeValue.value,
    width: sizeValue.value,
    height: sizeValue.value,
    lineHeight: sizeValue.value,
}));
</script>

<style>
@import '@/static/iconfont/appicons.css';

.mdi-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
}

.mdi-icon-font {
    font-family: 'appicons' !important;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    vertical-align: middle;
    flex-shrink: 0;
}
</style>
