<template>
    <view
        class="glass-status-bar"
        :class="[
            isScrolled ? 'is-scrolled' : 'is-top',
            `theme-${currentTheme}`
        ]"
        :style="{
            height: `${statusBarHeight + 36}px`,
            '--status-bar-height': `${statusBarHeight}px`,
        }"
    ></view>
</template>

<script setup>
import { computed } from 'vue';
import { getStatusBarHeight } from '@/utils/layout.js';
import { useSettingsStore } from '@/stores/settings.js';

const props = defineProps({
    isScrolled: {
        type: Boolean,
        default: false,
    },
    theme: {
        type: String,
        default: '',
    },
});

const settingsStore = useSettingsStore();
const currentTheme = computed(() => props.theme || (settingsStore.isDark ? 'dark' : 'light'));
const statusBarHeight = computed(() => getStatusBarHeight() || 0);
</script>

<style lang="scss" scoped>
.glass-status-bar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 990;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1);

    // 核心毛玻璃磨砂滤镜：增大模糊半径和色彩饱和度，主要依靠模糊虚化而非厚重底漆
    backdrop-filter: blur(24px) saturate(200%);
    -webkit-backdrop-filter: blur(24px) saturate(200%);

    // 渐变羽化遮罩：更加柔和轻薄地向下衰减
    -webkit-mask-image: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 1) 0%,
        rgba(0, 0, 0, 0.88) calc(var(--status-bar-height, 24px) * 0.7),
        rgba(0, 0, 0, 0.5) calc(var(--status-bar-height, 24px) + 12px),
        rgba(0, 0, 0, 0) 100%
    );
    mask-image: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 1) 0%,
        rgba(0, 0, 0, 0.88) calc(var(--status-bar-height, 24px) * 0.7),
        rgba(0, 0, 0, 0.5) calc(var(--status-bar-height, 24px) + 12px),
        rgba(0, 0, 0, 0) 100%
    );

    &.is-scrolled {
        opacity: 1;

        // 浅色模式背景：不透明度 0.8 适中透光与清晰度
        &.theme-light {
            background: linear-gradient(
                to bottom,
                rgba(255, 255, 255, 0.8) 0%,
                rgba(255, 255, 255, 0.55) var(--status-bar-height, 24px),
                rgba(255, 255, 255, 0.2) calc(var(--status-bar-height, 24px) + 18px),
                rgba(255, 255, 255, 0) 100%
            );
        }

        // 深色模式背景：不透明度 0.8
        &.theme-dark {
            background: linear-gradient(
                to bottom,
                rgba(18, 18, 20, 0.8) 0%,
                rgba(18, 18, 20, 0.55) var(--status-bar-height, 24px),
                rgba(18, 18, 20, 0.2) calc(var(--status-bar-height, 24px) + 18px),
                rgba(18, 18, 20, 0) 100%
            );
        }
    }
}
</style>
