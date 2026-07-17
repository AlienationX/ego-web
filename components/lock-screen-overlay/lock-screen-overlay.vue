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
    top: calc(12vh + 80rpx);
    
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
    top: calc(12vh + 80rpx);
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
    top: calc(12vh + 60rpx);
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
    top: calc(12vh + 120rpx);
    align-items: flex-start;
    padding-left: 60rpx;
    
    .date-container {
        font-size: 30rpx;
        font-weight: 800;
        letter-spacing: 4rpx;
        margin-bottom: 8rpx;
        z-index: 2;
    }
    .time-container {
        font-size: 180rpx;
        font-weight: 900;
        line-height: 0.85;
        display: flex;
        flex-direction: column;
        
        .time-h {
            color: rgba(255, 255, 255, 0.95);
        }
        .time-m {
            color: rgba(255, 255, 255, 0.5);
            margin-left: 80rpx; // staggered look
        }
    }
}

/* 4. harmonyos */
.harmonyos {
    top: calc(12vh + 90rpx);
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

/* 6. modern-left */
.lock-screen-wrapper.modern-left {
    top: calc(12vh + 80rpx);
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

/* 7. elegant-serif */
.elegant-serif {
    top: calc(12vh + 90rpx);
    
    .time-container {
        font-family: serif;
        font-size: 190rpx;
        font-weight: 500;
        line-height: 1;
        text-shadow: 0 4rpx 16rpx rgba(0,0,0,0.4);
    }
    .date-container {
        font-family: serif;
        font-size: 36rpx;
        font-style: italic;
        margin-top: 12rpx;
        font-weight: 400;
        text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.4);
    }
}

/* 8. tech-digital */
.tech-digital {
    top: calc(12vh + 100rpx);
    
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
        background: rgba(255,255,255,0.15);
        padding: 4rpx 16rpx;
        border: 1px solid rgba(255,255,255,0.3);
    }
}
</style>
