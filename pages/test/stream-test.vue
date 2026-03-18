<template>
    <view class="layout">
        <menu-bar>
            <template #title>Stream Test</template>
        </menu-bar>

        <view class="container">
            <view class="intro">
                <view class="title">SSE 流式测试</view>
                <view class="desc">用于验证 App 端 onChunkReceived 以及流式回调日志。</view>
            </view>

            <view class="form">
                <view class="label">图片 URL</view>
                <input class="input" v-model="imageUrl" placeholder="请输入可访问的图片地址" />
                <button class="btn" :disabled="isRunning" @click="startTest">开始测试</button>
            </view>

            <view class="result">
                <view class="section-title">流式输出</view>
                <view class="result-box">{{ streamText || '暂无输出' }}</view>
            </view>

            <view class="logs">
                <view class="section-title-row">
                    <view class="section-title">回调日志</view>
                    <button class="copy-btn" @click="copyLogs">复制日志</button>
                </view>
                <view class="log-box">
                    <view class="log-row" v-for="(item, index) in logs" :key="index">{{ item }}</view>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref } from 'vue';
import { apiPostDiscoverStream } from '@/api/wallpaper.js';

const imageUrl = ref('https://api.wp.ego8.space/static/wallpaper/media/pics/classify_bing/20250320-春日仙境.jpg');
const logs = ref([]);
const streamText = ref('');
const isRunning = ref(false);

const pushLog = (text) => {
    logs.value.unshift(`${new Date().toLocaleTimeString()} ${text}`);
    if (logs.value.length > 200) logs.value.pop();
};

const startTest = async () => {
    if (!imageUrl.value.trim() || isRunning.value) {
        uni.showToast({ title: '请输入图片地址', icon: 'none' });
        return;
    }
    logs.value = [];
    streamText.value = '';
    isRunning.value = true;

    try {
        await apiPostDiscoverStream(
            { img_url: imageUrl.value.trim() },
            {
                debug: true,
                onLog: (...args) => pushLog(JSON.stringify(args)),
                onMessage: (chunk) => {
                    streamText.value += String(chunk || '');
                },
                onDone: () => pushLog('DONE'),
            }
        );
    } catch (error) {
        pushLog(`ERROR: ${error?.message || String(error)}`);
    } finally {
        isRunning.value = false;
    }
};

const copyLogs = () => {
    if (!logs.value.length) {
        uni.showToast({ title: '暂无日志', icon: 'none' });
        return;
    }
    const text = logs.value.join('\n');
    uni.setClipboardData({
        data: text,
        success: () => {
            uni.showToast({ title: '已复制', icon: 'none' });
        },
    });
};
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: #f5f7fa;
}

.container {
    padding: 20rpx 24rpx 30rpx;
}

.intro {
    background: #fff;
    border-radius: 16rpx;
    border: 1rpx solid #e8edf3;
    padding: 22rpx;
    margin-bottom: 18rpx;

    .title {
        font-size: 32rpx;
        color: #1f2937;
        font-weight: 700;
        margin-bottom: 8rpx;
    }

    .desc {
        font-size: 24rpx;
        line-height: 1.6;
        color: #64748b;
    }
}

.form {
    background: #fff;
    border-radius: 16rpx;
    border: 1rpx solid #e8edf3;
    padding: 22rpx;
    margin-bottom: 18rpx;

    .label {
        font-size: 24rpx;
        color: #94a3b8;
        margin-bottom: 10rpx;
    }

    .input {
        height: 76rpx;
        border-radius: 14rpx;
        border: 1rpx solid #e2e8f0;
        padding: 0 18rpx;
        font-size: 26rpx;
        margin-bottom: 18rpx;
        background: #fff;
    }

    .btn {
        height: 76rpx;
        border-radius: 999rpx;
        background: #28b389;
        color: #fff;
        font-size: 28rpx;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .btn[disabled] {
        opacity: 0.6;
    }
}

.section-title {
    font-size: 26rpx;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 10rpx;
}

.section-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10rpx;

    .section-title {
        margin-bottom: 0;
    }
}

.copy-btn {
    height: 56rpx;
    padding: 0 20rpx;
    border-radius: 999rpx;
    border: 1rpx solid #e2e8f0;
    background: #fff;
    color: #475569;
    font-size: 22rpx;
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

.result,
.logs {
    background: #fff;
    border-radius: 16rpx;
    border: 1rpx solid #e8edf3;
    padding: 22rpx;
    margin-bottom: 18rpx;
}

.result-box {
    min-height: 120rpx;
    font-size: 24rpx;
    color: #334155;
    line-height: 1.6;
    white-space: pre-wrap;
}

.log-box {
    max-height: 360rpx;
    overflow: auto;
}

.log-row {
    font-size: 22rpx;
    color: #64748b;
    line-height: 1.5;
    padding: 6rpx 0;
    border-bottom: 1rpx dashed #e2e8f0;
}

.log-row:last-child {
    border-bottom: none;
}
</style>
