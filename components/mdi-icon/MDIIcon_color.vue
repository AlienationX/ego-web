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
        default: '',
    },
});

const svgContent = ref('');

const sizeValue = computed(() => {
    if (typeof props.size === 'number') {
        return `${props.size}rpx`;
    }
    return String(props.size);
});

const wrapperStyle = computed(() => {
    const style = {
        width: sizeValue.value,
        height: sizeValue.value,
    };

    if (props.color) {
        style.color = props.color;
    }

    return style;
});

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
    content = content.replace(/fill:\s*(?!none)[^;"']+/gi, 'fill: currentColor');
    content = content.replace(/stroke:\s*(?!none)[^;"']+/gi, 'stroke: currentColor');
    if (!/fill="currentColor"/i.test(content) && !/fill="none"/i.test(content)) {
        content = content.replace('<svg', '<svg fill="currentColor"');
    }
    if (!/stroke="currentColor"/i.test(content) && /stroke=/i.test(content)) {
        content = content.replace(/stroke="[^"]*"/i, 'stroke="currentColor"');
    }
    return content;
}

function readAppSvgFile(filePath) {
    return new Promise((resolve) => {
        // #ifdef APP
        if (typeof plus === 'undefined' || !plus.io) {
            resolve('');
            return;
        }

        const localPath = filePath.startsWith('/static/') ? `_www${filePath}` : filePath;
        plus.io.resolveLocalFileSystemURL(
            localPath,
            (entry) => {
                entry.file(
                    (file) => {
                        const reader = new plus.io.FileReader();
                        reader.onloadend = (event) => resolve(String(event.target?.result || ''));
                        reader.onerror = () => resolve('');
                        reader.readAsText(file, 'utf-8');
                    },
                    () => resolve(''),
                );
            },
            () => resolve(''),
        );
        // #endif

        // #ifndef APP
        resolve('');
        // #endif
    });
}

async function loadSvg() {
    if (!props.path) return;
    svgContent.value = '';

    // #ifdef WEB
    try {
        const res = await fetch(props.path);
        if (res.ok) {
            const text = await res.text();
            svgContent.value = normalizeSvg(text);
            return;
        }
    } catch (error) {
        svgContent.value = '';
    }
    // #endif

    // #ifdef APP
    try {
        const fileText = await readAppSvgFile(props.path);
        if (fileText && /<svg[\s>]/i.test(fileText)) {
            svgContent.value = normalizeSvg(fileText);
            return;
        }

        const res = await new Promise((resolve) => {
            uni.request({
                url: props.path,
                method: 'GET',
                responseType: 'text',
                success: (response) => resolve(response),
                fail: () => resolve(null),
            });
        });
        if (res && typeof res.data === 'string' && /<svg[\s>]/i.test(res.data)) {
            svgContent.value = normalizeSvg(res.data);
        }
    } catch (error) {
        svgContent.value = '';
    }
    // #endif
}

onMounted(loadSvg);

watch(
    () => [props.path],
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
    color: inherit;
    flex-shrink: 0;
}

.svg-inner {
    width: 100%;
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: inherit;

    :deep(svg) {
        width: 100%;
        height: 100%;
        display: block;
        color: inherit;
        fill: currentColor;
        stroke: currentColor;
    }

    :deep(svg *) {
        color: inherit;
    }
}

.svg-img {
    display: block;
    flex-shrink: 0;
}
</style>
