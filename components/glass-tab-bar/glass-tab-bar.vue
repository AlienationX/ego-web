<template>
    <view
        class="custom-tab-bar"
        :class="[
            isFloatingMode ? 'mode-floating' : 'mode-classic',
            `theme-${theme}`
        ]"
        :style="containerStyle"
    >
        <view
            v-for="item in items"
            :key="item.pagePath"
            class="tab-item"
            :class="{ 'tab-item--active': currentPath === item.pagePath }"
            @click="handleSwitch(item)"
        >
            <image
                class="tab-icon"
                :src="getItemIcon(item)"
                mode="aspectFit"
            />
            <text class="tab-text">{{ item.text }}</text>
        </view>
    </view>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { getSafeAreaBottom } from '@/utils/layout.js';

const settingsStore = useSettingsStore();

// 模式切换：true 为 iOS 悬浮胶囊，false 为经典贴底底栏（复刻附件4）
const isFloatingMode = computed(() => {
    return settingsStore.options.customTabBar !== false;
});

// 计算底栏垫高样式，保持与原生 1:1 绝对一致
const containerStyle = computed(() => {
    // 悬浮模式完全交由 CSS (.mode-floating) 控制 bottom，避免内联样式覆盖
    if (isFloatingMode.value) {
        return {};
    }
    // 经典贴底模式：垫高安全区，确保文字稳稳当当立于手势横条之上
    const safeBottom = getSafeAreaBottom() || 34;
    return {
        paddingBottom: `${Math.max(safeBottom, 34)}px`,
    };
});

// 自定义组件自动接管：挂载时隐藏原生 TabBar，各业务页面无需写额外逻辑
onMounted(() => {
    uni.hideTabBar({
        animation: false,
        fail: () => {},
    });
});

const props = defineProps({
    currentPath: {
        type: String,
        default: '',
    },
    placeholder: {
        type: Boolean,
        default: false,
    },
    theme: {
        type: String,
        default: 'light',
    },
    disableNavigation: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['change']);
const { locale, t } = useI18n();

const items = computed(() => {
    const _locale = locale.value;
    return [
        {
            text: t('tabbar.index'),
            pagePath: '/pages/app/index',
            lightIcon: '/static/tabbar/Light_Home.png',
            darkIcon: '/static/tabbar/Dark_Home.png',
            activeIcon: '/static/tabbar/Fill_Home_Green.png',
        },
        {
            text: t('tabbar.category'),
            pagePath: '/pages/app/classify',
            lightIcon: '/static/tabbar/Light_Category.png',
            darkIcon: '/static/tabbar/Dark_Category.png',
            activeIcon: '/static/tabbar/Fill_Category_Green.png',
        },
        {
            text: t('tabbar.discover'),
            pagePath: '/pages/discover/discover',
            lightIcon: '/static/tabbar/Light_Discover.png',
            darkIcon: '/static/tabbar/Dark_Discover.png',
            activeIcon: '/static/tabbar/Fill_Discover_Green.png',
        },
        {
            text: t('tabbar.user'),
            pagePath: '/pages/user/user',
            lightIcon: '/static/tabbar/Light_User.png',
            darkIcon: '/static/tabbar/Dark_User.png',
            activeIcon: '/static/tabbar/Fill_User_Green.png',
        },
    ];
});

const getItemIcon = (item) => {
    const isActive = props.currentPath === item.pagePath;
    // 经典贴底模式：激活态直接展示高亮绿色实心图标
    if (!isFloatingMode.value && isActive && item.activeIcon) {
        return item.activeIcon;
    }
    // 悬浮模式或未激活：根据当前深浅色主题展示
    return props.theme === 'dark' ? item.darkIcon : item.lightIcon;
};

const handleSwitch = (item) => {
    if (props.currentPath === item.pagePath) return;
    emit('change', item);
    if (props.disableNavigation) return;
    uni.switchTab({
        url: item.pagePath,
    });
};
</script>

<style lang="scss" scoped>
/* ─────────────────────────────────────────────────────────────
   1. 悬浮毛玻璃胶囊模式 (Floating Capsule)
───────────────────────────────────────────────────────────── */
.custom-tab-bar.mode-floating {
    position: fixed;
    // #ifdef MP-WEIXIN
    bottom: 24px;
    // #endif
    // #ifndef MP-WEIXIN
    bottom: max(24px, calc(8px + env(safe-area-inset-bottom, 10px)));
    // #endif
    left: 50%;
    transform: translate3d(-50%, 0, 0);
    -webkit-transform: translate3d(-50%, 0, 0);
    width: calc(100% - 44px);
    max-width: 375px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px;
    box-sizing: border-box;
    z-index: 999;
    pointer-events: auto;
    border-radius: 9999px;
    animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    transition: background 0.3s ease, border 0.3s ease, box-shadow 0.3s ease;

    &.theme-light {
        background: rgba(255, 255, 255, 0.82);
        backdrop-filter: blur(28px) saturate(190%);
        -webkit-backdrop-filter: blur(28px) saturate(190%);
        border: 1px solid rgba(255, 255, 255, 0.90);
        box-shadow:
            0 16px 36px rgba(15, 23, 42, 0.08),
            0 2px 6px rgba(0, 0, 0, 0.02),
            inset 0 1px 1px rgba(255, 255, 255, 0.95);
    }

    &.theme-dark {
        background: rgba(18, 18, 20, 0.88);
        backdrop-filter: blur(28px) saturate(190%);
        -webkit-backdrop-filter: blur(28px) saturate(190%);
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow:
            0 20px 44px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    .tab-item {
        flex: 1;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        cursor: pointer;
        position: relative;
        border-radius: 9999px;
        padding: 0 4px;
        box-sizing: border-box;
        transition: background-color 0.25s ease, transform 0.18s ease;

        &:active {
            transform: scale(0.93);
        }
    }

    .tab-icon {
        width: 22px;
        height: 22px;
        opacity: 0.85;
        flex-shrink: 0;
        transition: opacity 0.2s ease, transform 0.2s ease;

        .theme-light & {
            opacity: 0.65;
        }
    }

    .tab-text {
        font-size: 11px;
        font-weight: 500;
        line-height: 1;
        letter-spacing: 0.2px;
        text-align: center;
        transition: color 0.2s ease, font-weight 0.2s ease;

        .theme-light & {
            color: #64748b;
        }

        .theme-dark & {
            color: rgba(255, 255, 255, 0.85);
        }
    }

    .tab-item--active {
        .theme-light & {
            background: rgba(15, 23, 42, 0.07);
        }

        .theme-dark & {
            background: rgba(255, 255, 255, 0.18);
        }

        .tab-icon {
            opacity: 1;
            transform: scale(1.05);

            .theme-light & {
                opacity: 1;
            }
        }

        .theme-light & .tab-text {
            color: #0f172a;
            font-weight: 700;
        }

        .theme-dark & .tab-text {
            color: #ffffff;
            font-weight: 700;
        }
    }
}

/* ─────────────────────────────────────────────────────────────
   2. 经典贴底底栏模式 (Classic Docked Bar)
───────────────────────────────────────────────────────────── */
.custom-tab-bar.mode-classic {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    z-index: 999;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding-top: 5px;
    padding-bottom: max(34px, env(safe-area-inset-bottom, 34px));
    transition: background-color 0.25s ease, border-color 0.25s ease;

    &.theme-light {
        background-color: #ffffff;
        border-top: 1rpx solid rgba(0, 0, 0, 0.06);
    }

    &.theme-dark {
        background-color: #181818;
        border-top: 1rpx solid rgba(255, 255, 255, 0.08);
    }

    .tab-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2px 0;
        box-sizing: border-box;
        cursor: pointer;
        transition: transform 0.15s ease;

        &:active {
            transform: scale(0.92);
        }
    }

    .tab-icon {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        transition: transform 0.2s ease;
    }

    .tab-text {
        font-size: 11px;
        line-height: 1;
        margin-top: 4px;
        text-align: center;
        letter-spacing: 0.1px;
        transition: color 0.2s ease;

        .theme-light & {
            color: #94a3b8;
        }

        .theme-dark & {
            color: #71717a;
        }
    }

    .tab-item--active {
        .tab-icon {
            transform: scale(1.04);
        }

        .tab-text {
            color: #28b389 !important;
            font-weight: 600;
        }
    }
}

@keyframes slideUp {
    from {
        transform: translate3d(-50%, 100%, 0);
        opacity: 0;
    }
    to {
        transform: translate3d(-50%, 0, 0);
        opacity: 1;
    }
}
</style>
