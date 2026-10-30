<template>
    <view
        v-if="show"
        class="fab-back-top"
        :class="{ 'is-embedded': embedded }"
        :style="computedStyle"
        hover-class="none"
        :hover-stop-propagation="true"
        @click="handleClick"
    >
        <uni-icons class="fab-icon" type="arrow-up" size="24" color="#fff"></uni-icons>
    </view>
</template>

<script setup>
import { computed } from 'vue';
import { getTabBarHeight } from '@/utils/layout.js';
import { useSettingsStore } from '@/stores/settings.js';

const settingsStore = useSettingsStore();

const props = defineProps({
    show: {
        type: Boolean,
        default: false,
    },
    embedded: {
        type: Boolean,
        default: false,
    },
    adHeight: {
        type: Number,
        default: 0,
    },
    bottomOffset: {
        type: Number,
        default: 0,
    },
});

const emit = defineEmits(['click']);

const computedStyle = computed(() => {
    if (props.bottomOffset > 0) {
        return { bottom: `${props.bottomOffset}px` };
    }
    if (props.embedded) {
        const tabH = getTabBarHeight();
        const adH = props.adHeight > 0 ? props.adHeight : 0;
        return {
            bottom: `${tabH + adH + 16}px`,
        };
    }
    const adH = props.adHeight > 0 ? props.adHeight : 0;
    return {
        bottom: `calc(max(34px, env(safe-area-inset-bottom)) + ${adH + 16}px)`,
    };
});

const handleClick = (e) => {
    emit('click', e);
};
</script>

<style lang="scss" scoped>
.fab-back-top {
    position: fixed;
    right: 32rpx;
    width: 88rpx;
    height: 88rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #2b8cee;
    box-shadow: 0 12rpx 32rpx rgba(43, 140, 238, 0.4);
    z-index: 1000;
    pointer-events: auto;
    -webkit-tap-highlight-color: transparent !important;
    outline: none;
    animation: fabPopIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both;

    &:active {
        transform: scale(0.9);
    }

    .fab-icon {
        pointer-events: none;
    }
}

@keyframes fabPopIn {
    from {
        opacity: 0;
        transform: scale(0.6) translateY(20rpx);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}
</style>
