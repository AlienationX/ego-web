<template>
    <!-- 统一使用字体图标 (iconfont) 方案，确保在 iOS App、Android App、微信小程序及 Web 端拥有一致的高性能矢量渲染与改色表现 -->
    <text 
        v-if="isFontIcon" 
        :class="['mdi-icon', 'mdi-icon-font', `appicons-${iconName}`]" 
        :style="iconStyle"
    ></text>

    <!-- 兜底模式：若图标不在 appicons 字体库中（如第三方品牌图片或动态 SVG），采用原生图片安全渲染 -->
    <view 
        v-else 
        class="mdi-icon mdi-icon--fallback" 
        :style="fallbackContainerStyle"
    >
        <image class="mdi-icon__image" :src="path" :style="fallbackImageStyle" mode="aspectFit"></image>
    </view>
</template>

<script setup>
import { computed } from 'vue';
import iconList from '@/static/iconfont/appicons-list.js';

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

// 构建字体库图标 Set，用于 O(1) 高性能匹配
const fontIconSet = new Set(iconList);

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

// 判断当前图标是否在字体图标库中
const isFontIcon = computed(() => {
    return fontIconSet.has(iconName.value);
});

// 矢量字体图标样式
const iconStyle = computed(() => ({
    color: props.color,
    fontSize: sizeValue.value,
    width: sizeValue.value,
    height: sizeValue.value,
    lineHeight: sizeValue.value,
}));

// 兜底图片容器与图片样式
const fallbackContainerStyle = computed(() => ({
    width: sizeValue.value,
    height: sizeValue.value,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
}));

const fallbackImageStyle = computed(() => ({
    width: sizeValue.value,
    height: sizeValue.value,
    display: 'block',
}));
</script>

<style>
@import '@/static/iconfont/appicons.css';

:host {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
}

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
