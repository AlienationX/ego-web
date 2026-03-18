<template>
    <view class="layout">
        <view class="decorative-bg">
            <view class="bg-circle circle-1"></view>
            <view class="bg-circle circle-2"></view>
            <view class="bg-circle circle-3"></view>
            <view class="bg-circle circle-4"></view>
            <view class="bg-circle circle-5"></view>
            <view class="bg-circle circle-6"></view>
            <view class="bg-circle circle-7"></view>
            <view class="bg-circle circle-8"></view>
        </view>

        <view
            class="container"
            :style="{
                paddingBottom: `${containerBottomSpace}px`,
            }"
        >
            <view class="intro">
                <view :style="{ height: getStatusBarHeight() + 'px' }"></view>
                <view class="intro-title intro-enter-1">{{ $t('discover.subtitle') }}</view>
                <view class="intro-desc intro-enter-2">{{ $t('discover.desc') }}</view>
            </view>

            <view class="chat-panel" v-if="chatMessages.length">
                <view v-for="msg in chatMessages" :id="`msg-${msg.id}`" :key="msg.id" class="msg-row" :class="msg.role">
                    <image class="msg-avatar" :src="msg.avatar" mode="aspectFill"></image>
                    <view class="msg-content">
                        <view class="msg-label">{{ msg.name }}</view>
                        <template v-if="msg.image">
                            <image class="msg-image" :src="msg.image" mode="aspectFill"></image>
                        </template>
                        <template v-if="msg.text">
                            <rich-text v-if="msg.role === 'assistant'" class="msg-text markdown" :nodes="msg.html"></rich-text>
                            <view v-else class="msg-text">{{ msg.text }}</view>
                        </template>
                    </view>
                </view>

                <view v-if="isThinking" class="msg-row assistant">
                    <image class="msg-avatar" :src="aiProfile.avatar" mode="aspectFill"></image>
                    <view class="msg-content">
                        <view class="msg-label">{{ aiProfile.name }}</view>
                        <view class="thinking-text">
                            <rotate-loading :size="30" :speed="1.2"></rotate-loading>
                            <text>{{ $t('discover.analyzingMessage') }} {{ thinkingTime }}s</text>
                        </view>
                    </view>
                </view>
            </view>

            <view class="bottom-panel" :style="{ bottom: `${tabBarHeight}px` }">
                <view class="picker-wrap" v-if="pickerOpen">
                    <template v-if="sourceMode === 'favorite'">
                        <view class="picker-title">{{ $t('discover.pickFavorite') }}</view>
                        <scroll-view v-if="favoriteList.length" class="favorite-scroll" scroll-x>
                            <view class="favorite-row">
                                <view
                                    v-for="item in favoriteList"
                                    :key="item.id"
                                    class="fav-card"
                                    :class="{ active: selectedId === item.id }"
                                    @click="onSelect(item.id)"
                                >
                                    <image class="fav-image" :src="item.smallPicurl || item.picurl" mode="aspectFill"></image>
                                </view>
                            </view>
                        </scroll-view>
                        <view v-else-if="!isLoading" class="mini-empty">
                            <text>{{ $t('discover.empty') }}</text>
                            <text class="mini-link" @click="goFavorite">{{ $t('discover.goFavorite') }}</text>
                        </view>
                    </template>

                    <template v-else>
                        <view class="picker-title">{{ $t('discover.pickLocal') }}</view>
                        <view class="local-line">
                            <view class="local-preview" v-if="localImage">
                                <image class="local-image" :src="localImage" mode="aspectFill"></image>
                            </view>
                            <button class="pick-local-btn" @click="pickLocalImage">{{ $t('discover.pickLocalBtn') }}</button>
                        </view>
                    </template>
                </view>

                <view class="source-switch">
                    <view class="source-item" :class="{ active: sourceMode === 'favorite' }" @click="setSourceMode('favorite')">
                        {{ $t('discover.sourceFavorite') }}
                    </view>
                    <view class="source-item" :class="{ active: sourceMode === 'local' }" @click="setSourceMode('local')">
                        {{ $t('discover.sourceLocal') }}
                        <uni-icons class="lock-icon" type="vip-filled" size="14" color="#b7791f"></uni-icons>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { onLoad, onUnload, onShow } from '@dcloudio/uni-app';
import { apiGetActions, apiPostDiscoverStream } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { useUserStore } from '@/stores/user.js';
import { getStatusBarHeight, getTabBarHeight } from '@/utils/system.js';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const isLoading = ref(false);
const isRunning = ref(false);
const favoriteList = ref([]);
const selectedId = ref(null);
const userStore = useUserStore();
const sourceMode = ref('favorite');
const localImage = ref('');
const pickerOpen = ref(true);
const aiProfile = ref({
    name: 'EgoBot',
    avatar: '',
});
const isThinking = ref(false);
const thinkingTime = ref(0);
let thinkingTimer = null;
const statusBarHeight = ref(getStatusBarHeight());
const tabBarHeight = ref(getTabBarHeight());

let typingTimer = null;
const chatMessages = ref([]);
let msgSeed = 1;

const selectedItem = computed(() => favoriteList.value.find((item) => item.id === selectedId.value));
const userName = computed(() => userStore.userinfo?.profile?.nickname || 'User');
const userAvatar = computed(() => userStore.userinfo?.profile?.avatar || '/static/images/pics/default_avatar.svg');
const canAnalyze = computed(() => {
    if (sourceMode.value === 'local') return !!localImage.value;
    return !!selectedItem.value;
});
const containerBottomSpace = computed(() => {
    // 为 fixed 的 bottom-panel 预留空间，防止聊天内容被遮挡
    // return tabBarHeight.value + 0;
    return 80;
});

const stopTyping = () => {
    if (typingTimer) {
        clearInterval(typingTimer);
        typingTimer = null;
    }
};

const startThinkingTimer = () => {
    thinkingTime.value = 0;
    thinkingTimer = setInterval(() => {
        thinkingTime.value++;
    }, 1000);
};

const stopThinkingTimer = () => {
    if (thinkingTimer) {
        clearInterval(thinkingTimer);
        thinkingTimer = null;
    }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scrollToBottom = (duration = 0) => {
    uni.pageScrollTo({
        scrollTop: 999999,
        duration,
    });
};

const appendMessage = (msg) => {
    const id = msgSeed++;
    chatMessages.value.push({ id, ...msg });
    nextTick(() => scrollToBottom(0));
    return id;
};

const updateMessage = (id, patch) => {
    const idx = chatMessages.value.findIndex((m) => m.id === id);
    if (idx === -1) return;
    chatMessages.value[idx] = { ...chatMessages.value[idx], ...patch };
};

const appendTextToMessage = (id, text) => {
    if (!text) return;
    const idx = chatMessages.value.findIndex((m) => m.id === id);
    if (idx === -1) return;
    const current = String(chatMessages.value[idx].text || '');
    const nextText = current + text;
    const html = chatMessages.value[idx].role === 'assistant' ? markdownToHtml(nextText) : undefined;
    chatMessages.value[idx] = { ...chatMessages.value[idx], text: nextText, html };
    scrollToBottom(0);
};

const startTypingToMessage = (targetId, text) => {
    stopTyping();
    const full = String(text || '');
    let index = 0;
    updateMessage(targetId, { text: '', html: '' });

    typingTimer = setInterval(() => {
        index += 1;
        const next = full.slice(0, index);
        updateMessage(targetId, { text: next, html: markdownToHtml(next) });
        scrollToBottom(0);
        if (index >= full.length) {
            stopTyping();
        }
    }, 80);
};

const escapeHtml = (str = '') =>
    String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');

const markdownToHtml = (md = '') => {
    let html = escapeHtml(md);
    html = html.replace(/```([\s\S]*?)```/g, (_m, code) => `<pre><code>${code}</code></pre>`);
    html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    html = html.replace(/(?:^|\n)(- .+(?:\n- .+)*)/g, (m) => {
        const items = m
            .trim()
            .split('\n')
            .map((line) => `<li>${line.replace(/^- /, '')}</li>`)
            .join('');
        return `\n<ul>${items}</ul>`;
    });
    html = html.replace(/\n/g, '<br/>');
    return html;
};

const getFavoriteList = async () => {
    if (!userStore.isLogin) {
        favoriteList.value = [];
        selectedId.value = null;
        return;
    }

    isLoading.value = true;
    try {
        const res = await apiGetActions({
            pageNum: 1,
            pageSize: 30,
            action_type: 'collect',
        });
        favoriteList.value = (res.data || []).map((item) => handlePicUrl(item));
        if (favoriteList.value.length) {
            selectedId.value = favoriteList.value[0].id;
        }
    } catch (error) {
        favoriteList.value = [];
        selectedId.value = null;
    } finally {
        isLoading.value = false;
    }
};

const onSelect = async (id) => {
    selectedId.value = id;
    await onAnalyze();
};

const setSourceMode = (mode) => {
    if (mode === 'local' && !userStore.isVip) {
        uni.showModal({
            title: t('common.tip'),
            content: t('discover.localVipRequired'),
            success: (res) => {
                if (res.confirm) {
                    uni.navigateTo({ url: '/pages/member/payment' });
                }
            },
        });
        return;
    }

    // 点击当前按钮：展开/收起切换
    if (sourceMode.value === mode) {
        pickerOpen.value = !pickerOpen.value;
        return;
    }

    // 点击另一个按钮：切换来源并展开
    sourceMode.value = mode;
    pickerOpen.value = true;
};

const createAiProfile = () => {
    const seed = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    aiProfile.value = {
        name: 'EgoBot',
        avatar: `https://api.dicebear.com/9.x/bottts/svg?seed=${seed}`,
    };
};

const pickLocalImage = () => {
    if (!userStore.isVip) {
        uni.showModal({
            title: t('common.tip'),
            content: t('discover.localVipRequired'),
            success: (res) => {
                if (res.confirm) {
                    uni.navigateTo({ url: '/pages/member/payment' });
                }
            },
        });
        return;
    }

    uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album'],
        success: async (res) => {
            localImage.value = res.tempFilePaths?.[0] || '';
            await onAnalyze();
        },
    });
};

const onAnalyze = async () => {
    if (!canAnalyze.value || isRunning.value) return;
    isRunning.value = true;
    stopTyping();
    pickerOpen.value = false;

    const currentImage =
        sourceMode.value === 'local' ? localImage.value : selectedItem.value?.smallPicurl || selectedItem.value?.picurl || '';
    const currentPicUrl = sourceMode.value === 'local' ? localImage.value : selectedItem.value?.picurl || '';

    console.log('>>> currentPicUrl', currentPicUrl);

    appendMessage({
        role: 'user',
        name: userName.value,
        avatar: userAvatar.value,
        image: currentImage,
    });

    // 先把用户消息渲染到当前窗口，再请求 AI
    await nextTick();
    isThinking.value = true;
    startThinkingTimer(); // 启动思考计时器
    await nextTick();
    scrollToBottom(0);
    await sleep(2000);

    try {
        let aiMsgId = null;
        const result = await apiPostDiscoverStream(
            {
                img_url: currentPicUrl,
                lang: uni.getStorageSync('lang') || uni.getLocale(),
            },
            {
                onMessage: (chunk) => {
                    const piece = String(chunk || '');
                    if (!piece) return;

                    if (!aiMsgId) {
                        stopThinkingTimer();
                        isThinking.value = false;
                        aiMsgId = appendMessage({
                            role: 'assistant',
                            name: aiProfile.value.name,
                            avatar: aiProfile.value.avatar,
                            text: '',
                        });
                    }

                    appendTextToMessage(aiMsgId, piece);
                },
            },
        );

        // 后端降级为非流式时，使用最终文本兜底
        if (!aiMsgId) {
            stopThinkingTimer();
            isThinking.value = false;
            const text = String(result?.text || '').trim();
            const fallbackText = text || t('discover.systemError');
            aiMsgId = appendMessage({
                role: 'assistant',
                name: aiProfile.value.name,
                avatar: aiProfile.value.avatar,
                text: '',
            });
            startTypingToMessage(aiMsgId, fallbackText);
        }
    } catch (error) {
        stopThinkingTimer(); // 停止思考计时器
        isThinking.value = false;
        const aiMsgId = appendMessage({
            role: 'assistant',
            name: aiProfile.value.name,
            avatar: aiProfile.value.avatar,
            text: '',
        });
        startTypingToMessage(aiMsgId, t('discover.systemError'));
    } finally {
        stopThinkingTimer(); // 确保计时器停止
        isThinking.value = false;
        isRunning.value = false;
    }
};

const goFavorite = () => {
    if (!userStore.isLogin) {
        uni.navigateTo({ url: '/pages/auth/login' });
        return;
    }
    uni.navigateTo({ url: '/pages/app/favorite' });
};

onLoad(() => {
    createAiProfile();
    statusBarHeight.value = getStatusBarHeight();
    tabBarHeight.value = getTabBarHeight();
});

onShow(() => {
    getFavoriteList();
});

onUnload(() => {
    stopTyping();
    stopThinkingTimer(); // 停止思考计时器
});
</script>

<style lang="scss" scoped>
.layout {
    position: relative;
    min-height: 94vh;
    background: #fff;
    overflow: hidden;
}

.container {
    position: relative;
    padding: 0 24rpx;
    background: transparent;
    z-index: 1;
}

.decorative-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;

    .bg-circle {
        position: absolute;
        border-radius: 50%;
        opacity: 0.06;
        background: linear-gradient(135deg, $wp-theme-color 0%, darken($wp-theme-color, 8%) 100%);
    }

    .circle-1 {
        width: 300rpx;
        height: 300rpx;
        top: -80rpx;
        right: -62rpx;
    }

    .circle-2 {
        width: 220rpx;
        height: 220rpx;
        bottom: 230rpx;
        left: -60rpx;
    }

    .circle-3 {
        width: 160rpx;
        height: 160rpx;
        top: 42%;
        right: 18%;
    }

    .circle-4 {
        width: 180rpx;
        height: 180rpx;
        top: 18%;
        left: 8%;
    }

    .circle-5 {
        width: 260rpx;
        height: 260rpx;
        top: 66%;
        right: -70rpx;
    }

    .circle-6 {
        width: 140rpx;
        height: 140rpx;
        top: 28%;
        right: 6%;
    }

    .circle-7 {
        width: 200rpx;
        height: 200rpx;
        bottom: 90rpx;
        left: 22%;
    }

    .circle-8 {
        width: 120rpx;
        height: 120rpx;
        top: 74%;
        left: -26rpx;
    }
}

.intro {
    position: relative;
    z-index: 1;
    background: transparent;
    padding: 24rpx;
    margin-bottom: 12rpx;
    border-bottom: 1rpx solid #e3e6eb;
}

.intro-title {
    font-size: 34rpx;
    font-weight: 700;
    color: #1f2d3d;
    margin-bottom: 10rpx;
}

.intro-desc {
    font-size: 26rpx;
    color: #5b6675;
    line-height: 1.6;
}

.intro-enter-1 {
    animation: intro-enter-up 0.45s ease-out both;
}

.intro-enter-2 {
    animation: intro-enter-up 0.55s ease-out both;
    animation-delay: 0.08s;
}

.panel {
    background: transparent;
    padding: 20rpx;
    border-bottom: 1rpx solid #e3e6eb;
}

.picker-title {
    font-size: 26rpx;
    font-weight: 600;
    color: #3e4d66;
    margin-bottom: 14rpx;
}

.favorite-scroll {
    white-space: nowrap;
    width: 100%;
}

.favorite-row {
    display: flex;
    gap: 16rpx;
    padding-bottom: 12rpx;
}

.fav-card {
    width: 180rpx;
    height: 320rpx;
    border-radius: 18rpx;
    border: 2rpx solid transparent;
    overflow: hidden;
    flex-shrink: 0;
    background: #fff;
    box-shadow: 0 8rpx 18rpx rgba(20, 35, 66, 0.08);
}

.fav-card.active {
    border-color: #3a66f4;
    box-shadow: 0 10rpx 22rpx rgba(58, 102, 244, 0.2);
}

.fav-image {
    width: 100%;
    height: 100%;
    display: block;
}

.chat-panel {
    position: relative;
    z-index: 1;
    margin-top: 0;
    padding: 0 20rpx 24rpx;
}

.msg-row {
    display: flex;
    align-items: flex-start;
    gap: 12rpx;
    margin-top: 30rpx;
}

.msg-row.user {
    flex-direction: row-reverse;
}

.msg-avatar {
    width: 58rpx;
    height: 58rpx;
    border-radius: 50%;
    border: 1rpx solid #d9dee6;
    background: #fff;
    box-shadow: 0 6rpx 14rpx rgba(24, 39, 75, 0.12);
}

.msg-content {
    max-width: calc(100% - 80rpx);
    padding-top: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.msg-row.user .msg-content {
    text-align: right;
    align-items: flex-end;
}

.msg-row.user .msg-text {
    margin-left: auto;
}

.msg-row.user .msg-image {
    margin-left: auto;
}

.msg-label {
    display: flex;
    align-items: center;
    min-height: 58rpx;
    padding: 0;
    color: #46566b;
    font-size: 28rpx;
    font-weight: 600;
    margin-bottom: 8rpx;
}

.msg-row.user .msg-label {
    margin-left: auto;
    color: #1f9f79;
}

.msg-text {
    display: inline-block;
    text-align: left;
    border: 1rpx solid #dbe3ec;
    background: #fff;
    padding: 16rpx 18rpx;
    border-radius: 14rpx;
    font-size: 30rpx;
    color: #2b3440;
    line-height: 1.72;
    white-space: pre-wrap;
    word-break: break-word;
    box-shadow: 0 8rpx 20rpx rgba(18, 31, 53, 0.08);
}

.markdown {
    width: auto;
}

.markdown :deep(h1),
.markdown :deep(h2),
.markdown :deep(h3) {
    font-weight: 700;
    margin: 12rpx 0 6rpx;
    line-height: 1.4;
}

.markdown :deep(h1) {
    font-size: 34rpx;
}
.markdown :deep(h2) {
    font-size: 32rpx;
}
.markdown :deep(h3) {
    font-size: 30rpx;
}

.markdown :deep(p) {
    margin: 6rpx 0;
}

.markdown :deep(ul) {
    padding-left: 26rpx;
    margin: 6rpx 0;
}

.markdown :deep(li) {
    margin: 4rpx 0;
}

.markdown :deep(code) {
    background: #f4f6f9;
    border-radius: 8rpx;
    padding: 2rpx 6rpx;
    font-size: 26rpx;
}

.markdown :deep(pre) {
    background: #0f172a;
    color: #e2e8f0;
    padding: 12rpx;
    border-radius: 12rpx;
    overflow-x: auto;
    margin: 8rpx 0;
}

.markdown :deep(pre code) {
    background: transparent;
    color: inherit;
    padding: 0;
}

.markdown :deep(a) {
    color: #1f9f79;
    text-decoration: underline;
}

.msg-row.user .msg-text {
    border-color: #bfe8da;
    background: #f2fbf8;
}

.thinking-text {
    display: inline-flex;
    align-items: center;
    // gap: 12rpx;
    margin-top: 2rpx;
    padding: 0;
    font-size: 28rpx;
    color: #516071;
    border: none;
    background: transparent;
    box-shadow: none;

    :deep(.container) {
        min-width: 30rpx;
        min-height: 30rpx;
    }
}

.thinking-text text {
    display: block;
    line-height: 1.4;
}

.msg-image {
    width: 240rpx;
    height: 520rpx;
    border-radius: 10rpx;
    display: block;
    margin-bottom: 10rpx;
    border: 1rpx solid #dde2e9;
    box-shadow: 0 8rpx 20rpx rgba(18, 31, 53, 0.08);
}

.empty {
    padding: 120rpx 0;
    text-align: center;
}

.empty-text {
    color: #8a94a6;
    margin-bottom: 28rpx;
    font-size: 30rpx;
}

.go-btn {
    width: 280rpx;
    height: 80rpx;
    line-height: 80rpx;
    border: 1rpx solid #1f9f79;
    border-radius: 8rpx;
    color: #fff;
    background: #28b389;
    font-size: 28rpx;
}

.local-panel {
    margin-top: 8rpx;
}

.local-preview {
    margin-bottom: 16rpx;
}

.local-image {
    width: 180rpx;
    height: 240rpx;
    border-radius: 18rpx;
    border: 1rpx solid #d8e2f4;
    box-shadow: 0 8rpx 18rpx rgba(20, 35, 66, 0.08);
}

.pick-local-btn {
    // height: 84rpx;
    // line-height: 84rpx;
    border-radius: 22rpx;
    border: none;
    background: linear-gradient(135deg, #3461fd 0%, #4a6fd4 100%);
    color: #ffffff;
    font-size: 28rpx;
    font-weight: 600;

    &::after {
        border: none;
    }
}

.bottom-panel {
    position: fixed;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.96);
    border-top-left-radius: 28rpx;
    border-top-right-radius: 28rpx;
    border-top: 1rpx solid #dce4f5;
    box-shadow: 0 -12rpx 24rpx rgba(24, 40, 72, 0.08);
    padding-top: 14rpx;
    padding-left: 24rpx;
    padding-right: 24rpx;
    padding-bottom: 18rpx;
    z-index: 99;
}

.picker-wrap {
    border: 1rpx solid #d8e1f5;
    border-radius: 22rpx;
    background: linear-gradient(180deg, #ffffff 0%, #f6f9ff 100%);
    padding: 18rpx;
    margin-bottom: 14rpx;
    box-shadow: 0 8rpx 18rpx rgba(24, 40, 72, 0.05);
}

.source-switch {
    display: flex;
    gap: 12rpx;
}

.source-item {
    flex: 1;
    text-align: center;
    font-size: 27rpx;
    color: #55627b;
    border: 1rpx solid #cfd8ee;
    padding: 16rpx 12rpx;
    border-radius: 18rpx;
    background: #f5f8ff;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    font-weight: 500;
}

.source-item.active {
    color: #2f5ee8;
    border-color: #3461fd;
    background: #eaf0ff;
    box-shadow: 0 6rpx 16rpx rgba(52, 97, 253, 0.16);
}

.lock-icon {
    border: 1rpx solid #f0cc8d;
    border-radius: 6rpx;
    padding: 2rpx 6rpx;
    background: #fff6e5;
}

.mini-empty {
    color: #7f8ba2;
    font-size: 24rpx;
}

.mini-link {
    color: #3461fd;
    font-weight: 600;
    margin-left: 10rpx;
}

.local-line {
    display: flex;
    align-items: center;
    gap: 14rpx;
}

@keyframes intro-enter-up {
    from {
        transform: translateY(12rpx);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}
</style>
