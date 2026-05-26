<template>
    <uni-popup ref="popupRef" type="bottom" :safe-area="true">
        <view class="theme-popup" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
            <view class="popup-head">
                <text class="popup-title">{{ t('settings.items.theme.label') }}</text>
                <view class="popup-close" @click="close">
                    <mdi-icon path="/static/icons/close.svg" size="20px" :color="settingsStore.isDark ? '#9ca3af' : '#6f7786'"></mdi-icon>
                </view>
            </view>

            <view class="theme-list">
                <view
                    v-for="item in themeOptions"
                    :key="item.value"
                    class="theme-item"
                    :class="{ active: settingsStore.options.theme === item.value }"
                    @click="selectTheme(item.value)"
                >
                    <view class="item-left">
                        <view class="icon-box" :class="item.value">
                            <mdi-icon
                                :path="item.icon"
                                size="24px"
                                :color="settingsStore.options.theme === item.value ? '#28B389' : (settingsStore.isDark ? '#e5e7eb' : '#374151')"
                            ></mdi-icon>
                        </view>
                        <view class="label-block">
                            <text class="label">{{ item.label }}</text>
                            <text class="sublabel">{{ item.sublabel }}</text>
                        </view>
                    </view>
                    <view class="item-right" v-if="settingsStore.options.theme === item.value">
                        <mdi-icon path="/static/icons/check.svg" size="20px" color="#28B389"></mdi-icon>
                    </view>
                </view>
            </view>
        </view>
    </uni-popup>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';

const { t } = useI18n();
const settingsStore = useSettingsStore();

const popupRef = ref(null);

const themeOptions = computed(() => [
    {
        value: 'auto',
        icon: '/static/icons/theme-light-dark.svg',
        label: t('settings.items.theme.auto') || '跟随系统',
        sublabel: t('settings.theme.autoDesc') || '开启后将跟随系统设置自动切换深浅色',
    },
    {
        value: 'light',
        icon: '/static/icons/weather-sunny.svg',
        label: t('settings.items.theme.light') || '浅色模式',
        sublabel: t('settings.theme.lightDesc') || '始终使用明亮、纯净的浅色背景',
    },
    {
        value: 'dark',
        icon: '/static/icons/weather-night.svg',
        label: t('settings.items.theme.dark') || '深色模式',
        sublabel: t('settings.theme.darkDesc') || '始终使用护眼、沉浸的深色背景',
    },
]);

const open = () => {
    popupRef.value?.open();
};

const close = () => {
    popupRef.value?.close();
};

const selectTheme = (theme) => {
    settingsStore.options.theme = theme;
    uni.setStorageSync('theme', theme);

    // #ifdef APP
    const targetStyle = theme === 'auto' ? settingsStore.systemTheme : theme;
    plus.nativeUI.setUIStyle(targetStyle);
    // #endif

    uni.showToast({
        title: t('settings.toast.themeChanged') || '主题已切换',
        icon: 'none',
    });

    close();
};

defineExpose({
    open,
    close,
});
</script>

<style lang="scss" scoped>
.theme-popup {
    background: var(--page-background-secondary);
    border-radius: 32rpx 32rpx 0 0;
    padding: 30rpx 30rpx calc(36rpx + env(safe-area-inset-bottom));
}

.popup-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 30rpx;
    padding: 0 10rpx;
}

.popup-title {
    font-size: 32rpx;
    font-weight: 700;
    color: var(--text-primary);
}

.popup-close {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    background: var(--panel-background);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;

    &:active {
        opacity: 0.8;
    }
}

.theme-list {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
}

.theme-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 30rpx;
    background: var(--panel-background);
    border: 2rpx solid var(--panel-border);
    border-radius: 24rpx;
    transition: all 0.2s ease;

    &:active {
        transform: scale(0.99);
        background: var(--panel-background-strong);
    }

    &.active {
        border-color: #28B389;
        background: rgba(40, 179, 137, 0.04);
        
        .label {
            color: #28B389;
        }
    }
}

.item-left {
    display: flex;
    align-items: center;
    gap: 24rpx;
    flex: 1;
    min-width: 0;
}

.icon-box {
    width: 76rpx;
    height: 76rpx;
    border-radius: 18rpx;
    background: var(--page-background-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 2rpx solid var(--panel-border);
}

.label-block {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
}

.label {
    font-size: 30rpx;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.4;
    transition: color 0.2s ease;
}

.sublabel {
    font-size: 22rpx;
    color: var(--text-tertiary);
    line-height: 1.4;
    margin-top: 4rpx;
}

.item-right {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 20rpx;
}
</style>
