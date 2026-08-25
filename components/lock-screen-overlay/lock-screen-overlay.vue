<template>
    <view class="lock-screen-wrapper" :class="[styleType]">
        <template v-if="styleType === 'default'">
            <view class="time-container">{{ timeStr }}</view>
            <view class="date-container" v-if="dateStr">{{ dateStr }}</view>
        </template>

        <!-- 部分样式时间在上面，部分日期在上面，可以通过 flex-direction: column-reverse 调整，但这里我们根据类名用绝对定位或固定结构 -->
        <template v-else-if="styleType === 'hyperos-magazine'">
            <view class="date-container" v-if="dateStr">{{ dateStr }}</view>
            <view class="time-container">
                <text class="time-h">{{ hours }}</text>
                <text class="time-m">{{ minutes }}</text>
            </view>
        </template>

        <template v-else-if="styleType === 'android-stock'">
            <view class="time-container">{{ timeStr }}</view>
            <view class="date-container" v-if="dateStr">{{ dateStr }}</view>
        </template>

        <template v-else-if="styleType === 'pixel-nine'">
            <!-- Pixel 9 双行大时钟 (居中屏幕，纯净无顶部假状态栏) -->
            <view class="pixel-clock-body">
                <view class="pixel-digits">
                    <text class="pixel-h">{{ hours }}</text>
                    <text class="pixel-m">{{ minutes }}</text>
                </view>
                <view class="pixel-date">{{ dateStr }}</view>
            </view>

            <!-- Pixel 9 底部解锁图标 -->
            <view class="pixel-bottom-unlock">
                <view class="unlock-icon-box">
                    <mdi-icon path="/static/icons/lock-open.svg" size="24px" color="rgba(255,255,255,0.85)"></mdi-icon>
                </view>
            </view>
        </template>

        <template v-else-if="styleType === 'ios-poster'">
            <!-- iOS 18/26 iPhone 17 巨型超高修长大数字海报时钟 (纯粹时钟与日期，超大半屏不遮挡，无底部组件) -->
            <view class="ios-poster-container">
                <view class="ios-date-row">{{ dateStr }}</view>
                <view class="ios-tall-clock">
                    <text class="ios-digit">{{ hours }}</text>
                    <view class="ios-colon">
                        <view class="colon-dot"></view>
                        <view class="colon-dot"></view>
                    </view>
                    <text class="ios-digit">{{ minutes }}</text>
                </view>
            </view>
        </template>

        <template v-else-if="styleType === 'modern-left'">
            <view class="time-v">
                <text>{{ hours }}</text>
                <text>{{ minutes }}</text>
            </view>
            <view class="date-container" v-if="dateStr">{{ dateStr }}</view>
        </template>

        <template v-else-if="styleType === 'elegant-serif'">
            <view class="time-container">{{ timeStr }}</view>
            <view class="date-container" v-if="dateStr">{{ dateStr }}</view>
        </template>

        <template v-else-if="styleType === 'tech-digital'">
            <view class="time-container">{{ timeStr }}</view>
            <view class="date-container" v-if="dateStr">{{ dateStr }}</view>
        </template>

        <template v-else>
            <!-- ios-classic, harmonyos -->
            <view class="date-container" v-if="dateStr">{{ dateStr }}</view>
            <view class="time-container">{{ timeStr }}</view>
        </template>
    </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useSettingsStore } from '@/stores/settings.js';
import { useI18n } from 'vue-i18n';

const props = defineProps({
    clockStyle: {
        type: String,
        default: ''
    }
});

const settingsStore = useSettingsStore();
const { locale } = useI18n();

const styleType = computed(() => props.clockStyle || settingsStore.options.clockStyle || 'default');

const currentTime = ref(new Date());
let timer = null;

onMounted(() => {
    timer = setInterval(() => {
        currentTime.value = new Date();
    }, 1000);
});

onUnmounted(() => {
    if (timer) clearInterval(timer);
});

const hours = computed(() => currentTime.value.getHours().toString().padStart(2, '0'));
const minutes = computed(() => currentTime.value.getMinutes().toString().padStart(2, '0'));
const timeStr = computed(() => `${hours.value}:${minutes.value}`);

const dateStr = computed(() => {
    const d = currentTime.value;
    const month = d.getMonth() + 1;
    const date = d.getDate();
    const day = d.getDay();
    const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const daysZh = ['日', '一', '二', '三', '四', '五', '六'];

    if (locale.value === 'zh-Hans') {
        return `${month}月${date}日 星期${daysZh[day]}`;
    } else {
        return `${daysEn[day]}, ${month}/${date}`;
    }
});
</script>

<style lang="scss" scoped>
.lock-screen-wrapper {
    position: absolute;
    left: 0;
    right: 0;
    margin: auto;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: rgba(255, 255, 255, 0.95);
    z-index: 5;
    pointer-events: none;

    // Shared shadows for legibility
    text-shadow:
        0 2rpx 6rpx rgba(0, 0, 0, 0.55),
        0 6rpx 20rpx rgba(0, 0, 0, 0.4),
        0 4rpx 16rpx rgba(0, 0, 0, 0.4);
}

/* 0. default */
.lock-screen-wrapper.default {
    top: 12vh;

    .time-container {
        font-size: 168rpx;
        font-weight: 400;
        letter-spacing: 2rpx;
        color: rgba(255, 255, 255, 0.95);
        line-height: 1em;
        text-shadow:
            0 2rpx 6rpx rgba(0, 0, 0, 0.55),
            0 6rpx 20rpx rgba(0, 0, 0, 0.4),
            0 16rpx 48rpx rgba(0, 0, 0, 0.28);
    }

    .date-container {
        font-size: 30rpx;
        font-weight: 500;
        letter-spacing: 1rpx;
        color: rgba(255, 255, 255, 0.9);
        text-shadow:
            0 1rpx 4rpx rgba(0, 0, 0, 0.6),
            0 4rpx 14rpx rgba(0, 0, 0, 0.4);
        margin-top: 32rpx;
    }
}

/* 1. ios-classic */
.ios-classic {
    top: 12vh;

    .date-container {
        font-size: 36rpx;
        font-weight: 500;
        margin-bottom: 8rpx;
        letter-spacing: 1rpx;
    }

    .time-container {
        font-size: 180rpx;
        font-weight: 800;
        line-height: 1;
        letter-spacing: -2rpx;
    }
}

/* 2. android-stock */
.android-stock {
    top: 12vh;

    .time-container {
        font-size: 160rpx;
        font-weight: 300;
        line-height: 1.1;
    }

    .date-container {
        font-size: 32rpx;
        font-weight: 400;
        opacity: 0.9;
        margin-top: 10rpx;
    }
}

/* 3. hyperos-magazine */
.hyperos-magazine {
    top: 12vh;
    align-items: center;
    padding-left: 0;

    .date-container {
        font-size: 30rpx;
        font-weight: 800;
        letter-spacing: 4rpx;
        margin-bottom: 8rpx;
        z-index: 2;
        text-align: center;
    }

    .time-container {
        font-size: 180rpx;
        font-weight: 900;
        line-height: 0.85;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        margin-left: -33rpx; // 整体中心对齐平衡补偿

        .time-h {
            color: rgba(255, 255, 255, 0.95);
        }

        .time-m {
            color: rgba(255, 255, 255, 0.5);
            margin-left: 66rpx; // 按 54rpx->180rpx 缩放比例精准与底部小卡片一致右偏
        }
    }
}

/* 4. harmonyos */
.harmonyos {
    top: 12vh;

    .time-container {
        font-size: 170rpx;
        font-weight: 500;
        line-height: 1;
        letter-spacing: 2rpx;
    }

    .date-container {
        font-size: 32rpx;
        font-weight: 400;
        margin-top: 16rpx;
        background: rgba(0, 0, 0, 0.2);
        padding: 6rpx 24rpx;
        border-radius: 30rpx;
        backdrop-filter: blur(10px);
        text-shadow: none;
    }
}

/* 5. pixel-nine (Pixel 9 Material You 双行大时钟，居中屏幕) */
.lock-screen-wrapper.pixel-nine {
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: calc(6vh + env(safe-area-inset-top)) 36rpx calc(48rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;

    .pixel-clock-body {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: auto 0;

        .pixel-digits {
            display: flex;
            flex-direction: column;
            align-items: center;
            line-height: 0.82;

            .pixel-h,
            .pixel-m {
                font-size: 260rpx;
                font-weight: 700;
                color: #ffd8be;
                letter-spacing: -2rpx;
                text-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.35);
            }
        }

        .pixel-date {
            font-size: 30rpx;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.94);
            margin-top: 28rpx;
            letter-spacing: 0.5rpx;
            text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.4);
        }
    }

    .pixel-bottom-unlock {
        width: 100%;
        display: flex;
        justify-content: center;
        padding-bottom: 24rpx;

        .unlock-icon-box {
            display: flex;
            align-items: center;
            justify-content: center;
            filter: drop-shadow(0 4rpx 12rpx rgba(0, 0, 0, 0.45));
        }
    }
}

/* 6. ios-poster (iOS 18/26 iPhone 17 巨型超高修长大数字海报时钟) */
.lock-screen-wrapper.ios-poster {
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    padding: calc(7.5vh + env(safe-area-inset-top)) 24rpx 0;
    box-sizing: border-box;

    .ios-poster-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;

        .ios-date-row {
            font-size: 32rpx;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.95);
            letter-spacing: 0.5rpx;
            margin-bottom: 16rpx;
            text-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.4);
            z-index: 2;
        }

        .ios-tall-clock {
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 0.80;
            margin-top: 20rpx;

            .ios-digit {
                font-size: 300rpx;
                font-weight: 600;
                letter-spacing: -2rpx;
                color: rgba(255, 255, 255, 0.95);
                transform: scaleY(1.58) scaleX(0.88);
                transform-origin: center top;
                font-family:
                    ui-rounded,
                    "SF Pro Rounded",
                    "Comfortaa",
                    "Arial Rounded MT Bold",
                    "Quicksand",
                    "Nunito",
                    "Hiragino Maru Gothic ProN",
                    "Yuanti SC",
                    "幼圆",
                    sans-serif;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                text-shadow:
                    0 4rpx 16rpx rgba(0, 0, 0, 0.35),
                    0 12rpx 36rpx rgba(0, 0, 0, 0.25);
            }

            .ios-colon {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 46rpx;
                margin: 0 14rpx;
                transform: scaleY(1.58);
                transform-origin: center top;

                .colon-dot {
                    width: 22rpx;
                    height: 22rpx;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.95);
                    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.4);
                }
            }
        }
    }
}

/* 7. modern-left */
.lock-screen-wrapper.modern-left {
    top: 12vh;
    margin: 0 !important;
    left: 40rpx !important;
    right: unset !important;
    width: auto !important;
    align-items: flex-start;

    .time-v {
        display: flex;
        flex-direction: column;
        font-size: 180rpx;
        font-weight: 600;
        line-height: 0.85;
        text-align: left;
    }

    .date-container {
        writing-mode: vertical-rl;
        white-space: nowrap;
        position: absolute;
        left: 210rpx;
        top: 20rpx;
        font-size: 30rpx;
        font-weight: 600;
        letter-spacing: 6rpx;
        margin-top: 0;
    }
}

/* 8. elegant-serif */
.elegant-serif {
    top: calc(12vh + 60rpx);

    .time-container {
        font-family: serif;
        font-size: 190rpx;
        font-weight: 500;
        line-height: 1;
        text-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.4);
    }

    .date-container {
        font-family: serif;
        font-size: 36rpx;
        font-style: italic;
        margin-top: 12rpx;
        font-weight: 400;
        text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.4);
    }
}

/* 9. tech-digital */
.tech-digital {
    top: calc(12vh + 60rpx);

    .time-container {
        font-family: monospace;
        font-size: 170rpx;
        font-weight: 300;
        letter-spacing: -8rpx;
        line-height: 1;
    }

    .date-container {
        font-family: monospace;
        font-size: 28rpx;
        letter-spacing: 6rpx;
        margin-top: 20rpx;
        text-transform: uppercase;
        background: rgba(255, 255, 255, 0.15);
        padding: 4rpx 16rpx;
        border: 1px solid rgba(255, 255, 255, 0.3);
    }
}
</style>
