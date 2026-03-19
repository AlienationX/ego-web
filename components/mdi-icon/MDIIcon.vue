<template>
    <view class="svg-icon" :style="wrapperStyle">
        <!-- #ifdef WEB || APP -->
        <view v-if="svgContent" class="svg-inner" v-html="svgContent"></view>
        <image v-else class="svg-img" :src="path" :style="imgStyle" mode="aspectFit" />
        <!-- #endif -->

        <!-- #ifdef MP -->
        <image class="svg-img" :src="path" :style="imgStyle" mode="aspectFit" />
        <!-- #endif -->
    </view>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';

const props = defineProps({
    path: {
        type: String,
        required: true,
    },
    size: {
        type: [Number, String],
        default: 24,
    },
    color: {
        type: String,
        default: '#111827',
    },
});

const svgContent = ref('');

const sizeValue = computed(() => {
    if (typeof props.size === 'number') {
        return `${props.size}rpx`;
    }
    // 如果是字符串
    // let size = props.size;
    // if (typeof size === 'string') {
    //     // 去除首尾空格
    //     const trimmed = size.trim();

    //     // 检查是否是有效的数字字符串
    //     if (!isNaN(trimmed) && trimmed !== '') {
    //         // 已经是数字字符串，直接添加 rpx
    //         if (!trimmed.includes('rpx') && !trimmed.includes('px')) {
    //             return `${trimmed}rpx`;
    //         }
    //         // 如果已经有单位，保持原样
    //         return trimmed;
    //     }
    // }

    // 参数统一必须带单位，且使用px
    return String(props.size);
});

const wrapperStyle = computed(() => ({
    width: sizeValue.value,
    height: sizeValue.value,
    color: props.color,
}));

const imgStyle = computed(() => ({
    width: sizeValue.value,
    height: sizeValue.value,
}));

function normalizeSvg(svgText) {
    let content = svgText || '';
    content = content.replace(/width="[^"]*"/gi, '');
    content = content.replace(/height="[^"]*"/gi, '');
    content = content.replace(/fill="(?!none)[^"]*"/gi, 'fill="currentColor"');
    content = content.replace(/stroke="(?!none)[^"]*"/gi, 'stroke="currentColor"');
    if (!/fill="currentColor"/i.test(content) && !/fill="none"/i.test(content)) {
        content = content.replace('<svg', '<svg fill="currentColor"');
    }
    return content;
}

async function loadSvg() {
    if (!props.path) return;
    svgContent.value = '';

    // #ifdef WEB
    // try {
    //     const res = await fetch(props.path);
    //     if (res.ok) {
    //         const text = await res.text();
    //         svgContent.value = normalizeSvg(text);
    //     }
    // } catch (error) {
    //     svgContent.value = '';
    // }
    // #endif

    try {
        const res = await new Promise((resolve) => {
            uni.request({
                url: props.path,
                method: 'GET',
                responseType: 'text',
                success: (response) => resolve(response),
                fail: () => resolve(null),
            });
        });
        if (res && typeof res.data === 'string') {
            svgContent.value = normalizeSvg(res.data);
        }
    } catch (error) {
        svgContent.value = '';
    }
}

onMounted(loadSvg);

watch(
    () => [props.path, props.color],
    () => {
        loadSvg();
    },
);
</script>

<style lang="scss" scoped>
.svg-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.svg-inner {
    width: 100%;
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    :deep(svg) {
        width: 100%;
        height: 100%;
        display: block;
    }
}

.svg-img {
    display: block;
}
</style>
