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
            <view class="bg-mesh"></view>
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
    if (!userStore.isLoggedIn) {
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
    if (!userStore.isLoggedIn) {
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
    --discover-bg: #f5f5f8;
    --discover-panel: rgba(255, 255, 255, 0.9);
    --discover-panel-strong: rgba(255, 255, 255, 0.98);
    --discover-border: rgba(17, 17, 17, 0.08);
    --discover-border-strong: rgba(17, 17, 17, 0.12);
    --discover-text-main: #15171c;
    --discover-text-secondary: rgba(21, 23, 28, 0.72);
    --discover-text-muted: rgba(21, 23, 28, 0.52);
    --discover-accent: #ff8db3;
    --discover-accent-strong: #15171c;
    --discover-success: #28b389;
    --discover-shadow: rgba(19, 25, 39, 0.12);
    --discover-user-bubble: rgba(255, 141, 179, 0.12);
    --discover-code-bg: #0f172a;
    --discover-code-text: #e2e8f0;
    --discover-link: #d9487d;
    --discover-switch-active-text: #15171c;
    --discover-switch-active-shadow: rgba(255, 190, 128, 0.18);
    --discover-bottom-panel: rgba(255, 255, 255, 0.94);
    position: relative;
    min-height: 94vh;
    background: var(--discover-bg);
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
        filter: blur(6rpx);
    }

    .circle-1 {
        width: 420rpx;
        height: 420rpx;
        top: 100rpx;
        right: -120rpx;
        background: radial-gradient(circle, rgba(255, 154, 158, 0.26) 0%, rgba(255, 154, 158, 0) 72%);
    }

    .circle-2 {
        width: 520rpx;
        height: 520rpx;
        bottom: 240rpx;
        left: -200rpx;
        background: radial-gradient(circle, rgba(127, 219, 255, 0.2) 0%, rgba(127, 219, 255, 0) 72%);
    }

    .circle-3 {
        width: 180rpx;
        height: 180rpx;
        top: 38%;
        right: 16%;
        background: radial-gradient(circle, rgba(255, 214, 143, 0.18) 0%, rgba(255, 214, 143, 0) 72%);
    }

    .circle-4 {
        width: 220rpx;
        height: 220rpx;
        top: 20%;
        left: 8%;
        background: radial-gradient(circle, rgba(143, 119, 255, 0.18) 0%, rgba(143, 119, 255, 0) 72%);
    }

    .circle-5 {
        width: 300rpx;
        height: 300rpx;
        top: 66%;
        right: -90rpx;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 72%);
    }

    .circle-6 {
        width: 140rpx;
        height: 140rpx;
        top: 28%;
        right: 6%;
        background: radial-gradient(circle, rgba(125, 247, 196, 0.18) 0%, rgba(125, 247, 196, 0) 72%);
    }

    .circle-7 {
        width: 240rpx;
        height: 240rpx;
        bottom: 90rpx;
        left: 22%;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0) 72%);
    }

    .circle-8 {
        width: 120rpx;
        height: 120rpx;
        top: 74%;
        left: -26rpx;
        background: radial-gradient(circle, rgba(255, 214, 143, 0.18) 0%, rgba(255, 214, 143, 0) 72%);
    }
}

.bg-mesh {
    position: absolute;
    inset: 0;
    opacity: 0.18;
    background-image:
        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
    background-size: 64rpx 64rpx;
    mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.95), transparent 92%);
}

.bg-line {
    position: absolute;
    left: 40rpx;
    right: 40rpx;
    height: 2rpx;
    background: var(--discover-border);
}

.bg-line--top {
    top: calc(env(safe-area-inset-top) + 48rpx);
}

.bg-line--bottom {
    bottom: calc(env(safe-area-inset-bottom) + 146rpx);
}

.intro {
    position: relative;
    z-index: 1;
    background: transparent;
    padding: 24rpx 24rpx 28rpx;
    margin-bottom: 18rpx;
    border-bottom: 1rpx solid var(--discover-border);
}

.intro-title {
    font-size: 40rpx;
    font-weight: 700;
    color: var(--discover-text-main);
    margin-bottom: 12rpx;
    letter-spacing: 1rpx;
}

.intro-desc {
    font-size: 26rpx;
    color: var(--discover-text-secondary);
    line-height: 1.75;
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
    border-bottom: 1rpx solid var(--discover-border);
}

.picker-title {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--discover-text-main);
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
    border-radius: 24rpx;
    border: 2rpx solid var(--discover-border);
    overflow: hidden;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.06);
    box-shadow: 0 16rpx 32rpx var(--discover-shadow);
}

.fav-card.active {
    border-color: var(--discover-border-strong);
    box-shadow:
        0 0 0 4rpx rgba(255, 215, 230, 0.16),
        0 18rpx 36rpx var(--discover-shadow);
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
    border: 1rpx solid var(--discover-border);
    background: var(--discover-panel);
    box-shadow: 0 12rpx 24rpx var(--discover-shadow);
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
    color: var(--discover-text-secondary);
    font-size: 28rpx;
    font-weight: 600;
    margin-bottom: 8rpx;
}

.msg-row.user .msg-label {
    margin-left: auto;
    color: var(--discover-accent);
}

.msg-text {
    display: inline-block;
    text-align: left;
    border: 1rpx solid var(--discover-border);
    background: var(--discover-panel);
    padding: 16rpx 18rpx;
    border-radius: 22rpx;
    font-size: 30rpx;
    color: var(--discover-text-main);
    line-height: 1.72;
    white-space: pre-wrap;
    word-break: break-word;
    box-shadow: 0 14rpx 30rpx var(--discover-shadow);
    backdrop-filter: blur(20rpx);
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
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8rpx;
    padding: 2rpx 6rpx;
    font-size: 26rpx;
}

.markdown :deep(pre) {
    background: var(--discover-code-bg);
    color: var(--discover-code-text);
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
    color: var(--discover-link);
    text-decoration: underline;
}

.msg-row.user .msg-text {
    border-color: var(--discover-border-strong);
    background: var(--discover-user-bubble);
}

.thinking-text {
    display: inline-flex;
    align-items: center;
    // gap: 12rpx;
    margin-top: 2rpx;
    padding: 0;
    font-size: 28rpx;
    color: var(--discover-text-secondary);
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
    border-radius: 18rpx;
    display: block;
    margin-bottom: 10rpx;
    border: 1rpx solid var(--discover-border);
    box-shadow: 0 14rpx 28rpx var(--discover-shadow);
}

.empty {
    padding: 120rpx 0;
    text-align: center;
}

.empty-text {
    color: var(--discover-text-muted);
    margin-bottom: 28rpx;
    font-size: 30rpx;
}

.go-btn {
    width: 280rpx;
    height: 80rpx;
    line-height: 80rpx;
    border: 1rpx solid var(--discover-border-strong);
    border-radius: 18rpx;
    color: #111111;
    background: linear-gradient(135deg, #ffe0f1 0%, #ffd38f 100%);
    font-size: 28rpx;
    box-shadow: 0 14rpx 28rpx rgba(255, 190, 128, 0.18);
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
    border: 1rpx solid var(--discover-border);
    box-shadow: 0 14rpx 28rpx var(--discover-shadow);
}

.pick-local-btn {
    border-radius: 22rpx;
    border: none;
    background: linear-gradient(135deg, #ffe0f1 0%, #ffd38f 100%);
    color: #111111;
    font-size: 28rpx;
    font-weight: 600;
    box-shadow: 0 16rpx 34rpx rgba(255, 190, 128, 0.18);

    &::after {
        border: none;
    }
}

.bottom-panel {
    position: fixed;
    left: 0;
    right: 0;
    background: var(--discover-bottom-panel);
    border-top-left-radius: 34rpx;
    border-top-right-radius: 34rpx;
    border-top: 1rpx solid var(--discover-border);
    box-shadow: 0 -20rpx 44rpx var(--discover-shadow);
    backdrop-filter: blur(24rpx);
    padding-top: 18rpx;
    padding-left: 24rpx;
    padding-right: 24rpx;
    padding-bottom: 22rpx;
    z-index: 99;
}

.picker-wrap {
    border: 1rpx solid var(--discover-border);
    border-radius: 26rpx;
    background: var(--discover-panel);
    padding: 22rpx;
    margin-bottom: 14rpx;
    box-shadow: 0 14rpx 30rpx var(--discover-shadow);
    backdrop-filter: blur(18rpx);
}

.source-switch {
    display: flex;
    gap: 12rpx;
}

.source-item {
    flex: 1;
    text-align: center;
    font-size: 27rpx;
    color: var(--discover-text-secondary);
    border: 1rpx solid var(--discover-border);
    padding: 16rpx 12rpx;
    border-radius: 20rpx;
    background: rgba(255, 255, 255, 0.05);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    font-weight: 500;
}

@media (prefers-color-scheme: dark) {
    .layout {
        --discover-bg: #111111;
        --discover-panel: rgba(255, 255, 255, 0.06);
        --discover-panel-strong: rgba(255, 255, 255, 0.08);
        --discover-border: rgba(255, 255, 255, 0.1);
        --discover-border-strong: rgba(255, 255, 255, 0.14);
        --discover-text-main: #f7f7fb;
        --discover-text-secondary: rgba(247, 247, 251, 0.72);
        --discover-text-muted: rgba(247, 247, 251, 0.56);
        --discover-accent: #ffd7e6;
        --discover-accent-strong: #ffffff;
        --discover-success: #7df7c4;
        --discover-shadow: rgba(0, 0, 0, 0.28);
        --discover-user-bubble: rgba(255, 215, 230, 0.12);
        --discover-code-bg: #0f172a;
        --discover-code-text: #e2e8f0;
        --discover-link: #ffd7e6;
        --discover-switch-active-text: #111111;
        --discover-switch-active-shadow: rgba(255, 190, 128, 0.18);
        --discover-bottom-panel: rgba(10, 12, 20, 0.86);
    }
}

.source-item.active {
    color: var(--discover-switch-active-text);
    border-color: var(--discover-border-strong);
    background: linear-gradient(135deg, #ffe0f1 0%, #ffd38f 100%);
    box-shadow: 0 10rpx 24rpx var(--discover-switch-active-shadow);
}

.lock-icon {
    border: 1rpx solid rgba(255, 215, 143, 0.5);
    border-radius: 6rpx;
    padding: 2rpx 6rpx;
    background: rgba(255, 240, 214, 0.9);
}

.mini-empty {
    color: var(--discover-text-muted);
    font-size: 24rpx;
}

.mini-link {
    color: var(--discover-accent);
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
