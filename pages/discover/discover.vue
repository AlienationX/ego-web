<template>
    <view class="layout" :class="isDark ? 'theme-dark' : 'theme-light'">
        <!-- #ifndef WEB -->
        <view class="status-bar-bg" :style="{ height: `${statusBarHeight}px` }">
            <view class="status-decorative-bg">
                <view class="bg-mesh"></view>
            </view>
        </view>
        <!-- #endif -->

        <view class="decorative-bg">
            <view class="bg-mesh"></view>
        </view>

        <view
            class="container"
            @touchstart="onChatTouchStart"
            @touchend="onChatTouchEnd"
            :style="{
                paddingTop: `${containerTopPadding}px`,
                paddingBottom: `${containerBottomSpace}px`,
            }"
        >
            <view class="hero-section">
                <view class="hero-title hero-enter-1">{{ $t('discover.title') }}</view>
                <view class="hero-subtitle hero-enter-2">{{ $t('discover.subtitle') }}</view>
                <view class="hero-desc hero-enter-3">{{ $t('discover.desc') }}</view>
            </view>

            <view class="chat-panel" v-if="chatMessages.length">
                <view v-for="msg in chatMessages" :id="`msg-${msg.id}`" :key="msg.id" class="msg-item" :class="msg.role">
                    <template v-if="msg.role === 'assistant'">
                        <view class="msg-header">
                            <image class="msg-avatar" :src="msg.avatar" mode="aspectFill"></image>
                            <view class="msg-label">{{ msg.name }}</view>
                        </view>
                        <view class="msg-content full-width">
                            <view class="msg-text markdown">
                                <mp-html :content="msg.html" :tag-style="markdownTagStyle"></mp-html>
                            </view>
                        </view>
                    </template>
                    <template v-else>
                        <view class="msg-row user">
                            <image class="msg-avatar" :src="msg.avatar" mode="aspectFill"></image>
                            <view class="msg-content">
                                <view class="msg-label">{{ msg.name }}</view>
                                <template v-if="msg.image">
                                    <image class="msg-image" :src="msg.image" mode="aspectFill"></image>
                                </template>
                                <template v-if="msg.text">
                                    <view class="msg-text">{{ msg.text }}</view>
                                </template>
                            </view>
                        </view>
                    </template>
                </view>

                <view v-if="isThinking" class="msg-item assistant">
                    <view class="msg-header">
                        <image class="msg-avatar" :src="aiProfile.avatar" mode="aspectFill"></image>
                        <view class="msg-label">{{ aiProfile.name }}</view>
                    </view>
                    <view class="msg-content full-width">
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
                        <scroll-view v-if="favoriteList.length" class="favorite-scroll" scroll-x @scroll="onFavScroll">
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
                                <view v-if="favLoadingMore" class="fav-card fav-card--loading">
                                    <rotate-loading :size="48"></rotate-loading>
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
                    <!-- <view class="source-item" :class="{ active: sourceMode === 'local' }" @click="setSourceMode('local')">
                        {{ $t('discover.sourceLocal') }}
                        <uni-icons class="lock-icon" type="vip-filled" size="14" color="#b7791f"></uni-icons>
                    </view> -->
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
import { useSettingsStore } from '@/stores/settings.js';
// #ifdef APP
import { chooseSystemMedia } from '@/uni_modules/uni-chooseSystemImage';
// #endif

const { t } = useI18n();

const isLoading = ref(false);
const isRunning = ref(false);
const favoriteList = ref([]);
const favPageNum = ref(1);
const favNoMore = ref(false);
const favLoadingMore = ref(false);
const selectedId = ref(null);
const userStore = useUserStore();
const settingsStore = useSettingsStore();
const isDark = computed(() => settingsStore.isDark);
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
const statusBarHeight = ref(getStatusBarHeight() || 0);
const containerTopPadding = computed(() => statusBarHeight.value + 10);
const tabBarHeight = ref(getTabBarHeight());

let typingTimer = null;
const chatMessages = ref([]);
let msgSeed = 1;
let streamFlushTimer = null;
const streamBufferMap = new Map();

const markdownTagStyle = {
    h1: 'font-weight: 700; font-size: 44rpx; margin: 56rpx 0 28rpx; line-height: 1.4; color: var(--text-primary);',
    h2: 'font-weight: 700; font-size: 40rpx; margin: 48rpx 0 24rpx; line-height: 1.4; color: var(--text-primary);',
    h3: 'font-weight: 700; font-size: 36rpx; margin: 40rpx 0 20rpx; line-height: 1.4; color: var(--text-primary);',
    h4: 'font-weight: 700; font-size: 34rpx; margin: 32rpx 0 16rpx; line-height: 1.4; color: var(--text-primary);',
    h5: 'font-weight: 700; font-size: 32rpx; margin: 24rpx 0 12rpx; line-height: 1.4; color: var(--text-primary);',
    h6: 'font-weight: 700; font-size: 30rpx; margin: 16rpx 0 8rpx; line-height: 1.4; color: var(--text-primary);',
    p: 'margin: 0 0 16rpx; line-height: 1.6;',
    ul: 'padding-left: 36rpx; margin: 0 0 16rpx;',
    ol: 'padding-left: 36rpx; margin: 0 0 16rpx;',
    li: 'margin-bottom: 8rpx; line-height: 1.6;',
    code: 'background: rgba(120, 120, 120, 0.1); border-radius: 8rpx; padding: 4rpx 8rpx; font-size: 26rpx; font-family: monospace;',
    pre: 'background: #1e1e1e; color: #d4d4d4; padding: 20rpx; border-radius: 12rpx; overflow-x: auto; margin: 16rpx 0;',
    strong: 'font-weight: 700;'
};

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

const stopStreamFlush = () => {
    if (streamFlushTimer) {
        clearInterval(streamFlushTimer);
        streamFlushTimer = null;
    }
};

const escapeHtml = (str = '') =>
    String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');

const markdownToHtml = (md = '', isStreaming = false) => {
    let html = escapeHtml(String(md));

    // 对块级元素前后追加双换行，确保后续拆分段落时能正确断开并包裹 <p>
    html = html.replace(/```([\s\S]*?)```/g, '\n\n<pre><code>$1</code></pre>\n\n');
    html = html.replace(/^######\s*(.*)$/gm, '\n\n<h6>$1</h6>\n\n');
    html = html.replace(/^#####\s*(.*)$/gm, '\n\n<h5>$1</h5>\n\n');
    html = html.replace(/^####\s*(.*)$/gm, '\n\n<h4>$1</h4>\n\n');
    html = html.replace(/^###\s*(.*)$/gm, '\n\n<h3>$1</h3>\n\n');
    html = html.replace(/^##\s*(.*)$/gm, '\n\n<h2>$1</h2>\n\n');
    html = html.replace(/^#\s*(.*)$/gm, '\n\n<h1>$1</h1>\n\n');
    
    // 内联元素恢复使用标准标签，mp-html 在包裹于 p 内时会合并为单个 rich-text 避免换行
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // 无序列表
    html = html.replace(/(?:^|\n)((?:[-*•]\s+.+(?:\n|$))+)/g, (m, p1) => {
        const items = p1
            .trim()
            .split('\n')
            .map((line) => `<li>${line.replace(/^[-*•]\s+/, '')}</li>`)
            .join('');
        return `\n\n<ul>${items}</ul>\n\n`;
    });

    // 有序列表
    html = html.replace(/(?:^|\n)((?:\d+\.\s+.+(?:\n|$))+)/g, (m, p1) => {
        const items = p1
            .trim()
            .split('\n')
            .map((line) => `<li>${line.replace(/^\d+\.\s+/, '')}</li>`)
            .join('');
        return `\n\n<ol>${items}</ol>\n\n`;
    });

    // 段落处理
    html = html
        .split(/\n{2,}/)
        .map(block => {
            block = block.trim();
            if (!block) return '';
            // 如果已经是块级标签，不作处理
            if (/^<(h[1-6]|ul|ol|pre|blockquote)/.test(block)) {
                return block;
            }
            // 普通文本包裹 p，内部单换行转 br
            return `<p>${block.replace(/\n/g, '<br/>')}</p>`;
        })
        .join('\n');
    
    if (isStreaming) {
        // 使用省略号代替带 class 的 span，防止 mp-html 停止合并 rich-text 节点
        const cursor = '......';
        if (html.endsWith('</p>')) {
            html = html.slice(0, -4) + cursor + '</p>';
        } else if (html.endsWith('</li></ul>')) {
            html = html.slice(0, -10) + cursor + '</li></ul>';
        } else if (html.endsWith('</li></ol>')) {
            html = html.slice(0, -10) + cursor + '</li></ol>';
        } else {
            html += cursor;
        }
    }
    return html;
};

const updateAssistantHtml = (id, force = false) => {
    const idx = chatMessages.value.findIndex((m) => m.id === id);
    if (idx === -1) return;
    const target = chatMessages.value[idx];
    const now = Date.now();
    const lastMarkdownAt = target.lastMarkdownAt || 0;
    if (!force && now - lastMarkdownAt < 120) return;
    
    chatMessages.value[idx] = {
        ...target,
        html: markdownToHtml(String(target.text || ''), target.isStreaming),
        lastMarkdownAt: now,
    };
};

const finishAssistantMessage = (id) => {
    const idx = chatMessages.value.findIndex((m) => m.id === id);
    if (idx === -1) return;
    const target = chatMessages.value[idx];
    const text = String(target.text || '');
    chatMessages.value[idx] = {
        ...target,
        isStreaming: false,
        html: markdownToHtml(text, false),
        lastMarkdownAt: Date.now(),
    };
    streamBufferMap.delete(id);
    nextTick(() => scrollToBottom(0));
};

const flushStreamText = () => {
    let hasPending = false;
    streamBufferMap.forEach((buffer, id) => {
        if (!buffer) return;
        hasPending = true;
        const idx = chatMessages.value.findIndex((m) => m.id === id);
        if (idx === -1) {
            streamBufferMap.delete(id);
            return;
        }
        const target = chatMessages.value[idx];
        const currentText = String(target.text || '');
        const consumeSize = buffer.length > 240 ? 3 : buffer.length > 120 ? 2 : 1;
        const nextChunk = buffer.slice(0, consumeSize);
        const remainChunk = buffer.slice(consumeSize);
        chatMessages.value[idx] = {
            ...target,
            text: currentText + nextChunk,
            isStreaming: true,
        };
        updateAssistantHtml(id, !remainChunk || !!target.streamEnded);
        if (remainChunk) {
            streamBufferMap.set(id, remainChunk);
        } else {
            streamBufferMap.delete(id);
            if (target.streamEnded) {
                finishAssistantMessage(id);
            }
        }
    });
    nextTick(() => scrollToBottom(0));
    if (!hasPending && streamBufferMap.size === 0) {
        stopStreamFlush();
    }
};

const ensureStreamFlush = () => {
    if (streamFlushTimer) return;
    streamFlushTimer = setInterval(() => {
        flushStreamText();
    }, 50);
};

const queueStreamText = (id, text) => {
    if (!text) return;
    const current = streamBufferMap.get(id) || '';
    streamBufferMap.set(id, current + text);
    ensureStreamFlush();
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

const isAutoScrollPaused = ref(false);
let autoScrollResumeTimer = null;

const onChatTouchStart = () => {
    isAutoScrollPaused.value = true;
    if (autoScrollResumeTimer) {
        clearTimeout(autoScrollResumeTimer);
        autoScrollResumeTimer = null;
    }
};

const onChatTouchEnd = () => {
    autoScrollResumeTimer = setTimeout(() => {
        isAutoScrollPaused.value = false;
    }, 5000);
};

let scrollTimer = null;
const scrollToBottom = (duration = 0) => {
    if (isAutoScrollPaused.value) return;
    if (scrollTimer) return;
    
    scrollTimer = setTimeout(() => {
        uni.pageScrollTo({
            scrollTop: 999999,
            duration,
        });
        scrollTimer = null;
    }, 200);
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
    const html = chatMessages.value[idx].role === 'assistant' ? markdownToHtml(nextText, chatMessages.value[idx].isStreaming) : undefined;
    chatMessages.value[idx] = { ...chatMessages.value[idx], text: nextText, html };
    scrollToBottom(0);
};

const startTypingToMessage = (targetId, text) => {
    stopTyping();
    const full = String(text || '');
    let index = 0;
    updateMessage(targetId, { text: '', html: '', isStreaming: true, lastMarkdownAt: 0 });

    typingTimer = setInterval(() => {
        index += 1;
        const next = full.slice(0, index);
        updateMessage(targetId, { text: next, isStreaming: true });
        updateAssistantHtml(targetId, index >= full.length || index % 2 === 0);
        scrollToBottom(0);
        if (index >= full.length) {
            stopTyping();
            finishAssistantMessage(targetId);
        }
    }, 80);
};


const getFavoriteList = async (isAppend = false) => {
    if (!userStore.isLoggedIn) {
        favoriteList.value = [];
        selectedId.value = null;
        return;
    }

    if (isAppend) {
        if (favLoadingMore.value || favNoMore.value) return;
        favLoadingMore.value = true;
    } else {
        isLoading.value = true;
        favPageNum.value = 1;
        favNoMore.value = false;
    }

    try {
        const res = await apiGetActions({
            pageNum: favPageNum.value,
            pageSize: 20,
            action_key: 'favorite',
        });
        const newData = (res.data || []).map((item) => handlePicUrl(item));
        if (isAppend) {
            favoriteList.value.push(...newData);
        } else {
            favoriteList.value = newData;
            if (favoriteList.value.length) {
                selectedId.value = favoriteList.value[0].id;
            }
        }
        const totalPages = Number(res?.pagination?.total_pages || 1);
        if (favPageNum.value >= totalPages) {
            favNoMore.value = true;
        }
    } catch (error) {
        favoriteList.value = [];
        selectedId.value = null;
    } finally {
        isLoading.value = false;
        favLoadingMore.value = false;
    }
};

let favScrollPending = false;
const onFavScroll = (e) => {
    if (favLoadingMore.value || favNoMore.value || favScrollPending) return;
    favScrollPending = true;
    const { scrollLeft, scrollWidth } = e.detail;
    uni.createSelectorQuery()
        .select('.favorite-scroll')
        .boundingClientRect((rect) => {
            favScrollPending = false;
            if (!rect || !scrollWidth) return;
            if (scrollLeft + rect.width >= scrollWidth - 60) {
                loadMoreFavorites();
            }
        })
        .exec();
};

const loadMoreFavorites = () => {
    if (favLoadingMore.value || favNoMore.value) return;
    favPageNum.value++;
    getFavoriteList(true);
};

const onSelect = async (id) => {
    if (isRunning.value) {
        uni.showToast({ title: t('discover.analyzingMessage'), icon: 'none' });
        return;
    }
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

const showPickerPermissionModal = () => {
    uni.showModal({
        title: t('feedback.permissionTitle') || '需要访问相册',
        content: t('feedback.permissionContent') || '为了选择本地图片，需要访问您的相册权限。请在设置中开启相册权限。',
        confirmText: t('feedback.goToSettings') || '去设置',
        cancelText: t('common.cancel') || '取消',
        success: (res) => {
            if (res.confirm) {
                // #ifdef APP
                if (typeof plus !== 'undefined' && plus.runtime) {
                    plus.runtime.openURL('app-settings:');
                } else {
                    uni.openSetting();
                }
                // #endif
                // #ifndef APP
                uni.openAppAuthorizeSetting({
                    fail: () => {
                        uni.openSetting();
                    },
                });
                // #endif
            }
        },
    });
};

const pickLocalImage = () => {
    if (isRunning.value) {
        uni.showToast({ title: t('discover.analyzingMessage'), icon: 'none' });
        return;
    }

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

    // #ifdef APP
    const channel = plus.runtime.channel;
    if (channel === 'google') {
        chooseSystemMedia({
            count: 1,
            mediaType: ['image'],
            success: async (res) => {
                localImage.value = res.filePaths?.[0] || '';
                await onAnalyze();
            },
            fail: (err) => {
                // 2101001 用户取消
                if (err?.errCode === 2101001) return;
                // 2101005 权限申请失败
                if (err?.errCode === 2101005 || /permission|权限|denied|拒绝/i.test(err?.errMsg || '')) {
                    showPickerPermissionModal();
                } else {
                    uni.showToast({ title: t('feedback.imageSelectFailed') || '选择图片失败', icon: 'none' });
                }
            },
        });
        return;
    }
    // #endif

    uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album'],
        success: async (res) => {
            localImage.value = res.tempFilePaths?.[0] || '';
            await onAnalyze();
        },
        fail: (err) => {
            if (err?.errMsg && (err.errMsg.toLowerCase().includes('permission') || err.errMsg.includes('权限') || err.errMsg.includes('denied'))) {
                showPickerPermissionModal();
            } else if (err?.errMsg && err.errMsg.includes('cancel')) {
                // 用户取消，忽略
            } else {
                uni.showToast({ title: t('feedback.imageSelectFailed') || '选择图片失败', icon: 'none' });
            }
        },
    });
};

const onAnalyze = async () => {
    if (!canAnalyze.value || isRunning.value) return;
    isRunning.value = true;
    stopTyping();
    stopStreamFlush();
    streamBufferMap.clear();
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
        let finalPicUrl = currentPicUrl;

        // 如果是本地图片，转为 Base64 再发给后端（因为 Zhipu AI 需要公网 URL 或 Base64）
        if (sourceMode.value === 'local' && finalPicUrl) {
            // #ifdef MP || APP-PLUS
            const fs = uni.getFileSystemManager();
            const base64Data = fs.readFileSync(finalPicUrl, 'base64');
            // 简单拼接，大模型一般能识别 data:image/... 的 base64
            finalPicUrl = 'data:image/jpeg;base64,' + base64Data;
            // #endif
            
            // #ifdef WEB
            const resBlob = await fetch(finalPicUrl);
            const blob = await resBlob.blob();
            finalPicUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            // #endif
        }

        let aiMsgId = null;
        const result = await apiPostDiscoverStream(
            {
                img_url: finalPicUrl,
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
                            html: '',
                            isStreaming: true,
                            streamEnded: false,
                            lastMarkdownAt: 0,
                        });
                    }

                    queueStreamText(aiMsgId, piece);
                },
                onDone: () => {
                    if (!aiMsgId) return;
                    const idx = chatMessages.value.findIndex((m) => m.id === aiMsgId);
                    if (idx === -1) return;
                    const target = chatMessages.value[idx];
                    chatMessages.value[idx] = {
                        ...target,
                        streamEnded: true,
                    };
                    if (!streamBufferMap.get(aiMsgId)) {
                        finishAssistantMessage(aiMsgId);
                    } else {
                        ensureStreamFlush();
                    }
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
                html: '',
                isStreaming: true,
                streamEnded: false,
                lastMarkdownAt: 0,
            });
            startTypingToMessage(aiMsgId, fallbackText);
        } else {
            const idx = chatMessages.value.findIndex((m) => m.id === aiMsgId);
            if (idx !== -1) {
                const target = chatMessages.value[idx];
                chatMessages.value[idx] = {
                    ...target,
                    streamEnded: true,
                };
                if (!streamBufferMap.get(aiMsgId)) {
                    finishAssistantMessage(aiMsgId);
                } else {
                    ensureStreamFlush();
                }
            }
        }
    } catch (error) {
        stopThinkingTimer(); // 停止思考计时器
        isThinking.value = false;
        const aiMsgId = appendMessage({
            role: 'assistant',
            name: aiProfile.value.name,
            avatar: aiProfile.value.avatar,
            text: '',
            html: '',
            isStreaming: true,
            lastMarkdownAt: 0,
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
        uni.navigateTo({ url: '/pages/auth/signin' });
        return;
    }
    uni.navigateTo({ url: '/pages/app/favorite' });
};

onLoad(() => {
    createAiProfile();
});

onShow(() => {
    if (userStore.isLoggedIn) {
        getFavoriteList();
    }
});

onUnload(() => {
    if (scrollTimer) clearTimeout(scrollTimer);
    stopTyping();
    stopStreamFlush();
    streamBufferMap.clear();
    stopThinkingTimer(); // 停止思考计时器
});
</script>

<style lang="scss" scoped>
.layout {
    // Discover-specific CSS variables (only those differing from global theme)
    --discover-border-strong: rgba(17, 17, 17, 0.12);
    --discover-user-bubble: rgba(255, 141, 179, 0.12);
    --discover-link: #d9487d;
    --discover-switch-active-text: #15171c;
    --discover-bottom-panel: rgba(255, 255, 255, 0.94);

    &.theme-dark {
        --discover-border-strong: rgba(255, 255, 255, 0.14);
        --discover-user-bubble: rgba(255, 215, 230, 0.12);
        --discover-link: #ffd7e6;
        --discover-switch-active-text: #111111;
        --discover-bottom-panel: rgba(10, 12, 20, 0.86);
    }

    position: relative;
    min-height: 94vh;
    background: var(--page-background);
    overflow: hidden;
}

.status-bar-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background: var(--page-background);
    overflow: hidden;
    pointer-events: none;
    z-index: 9999;
}

.container {
    position: relative;
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
}

.status-decorative-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    pointer-events: none;
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
    background: var(--panel-border);
}

.bg-line--top {
    top: calc(env(safe-area-inset-top) + 48rpx);
}

.bg-line--bottom {
    bottom: calc(env(safe-area-inset-bottom) + 146rpx);
}

.hero-section {
    position: relative;
    z-index: 10;
    padding: 0rpx 30rpx 30rpx;
    margin-bottom: 16rpx;
    border-bottom: 1rpx solid var(--panel-border);

    .hero-title {
        font-size: 68rpx;
        font-weight: 900;
        color: var(--text-primary);
        letter-spacing: -2rpx;
        line-height: 1.1;
        margin-bottom: 20rpx;
        filter: drop-shadow(0 4rpx 8rpx rgba(0, 0, 0, 0.05));
    }

    .hero-subtitle {
        font-size: 38rpx;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 16rpx;
        letter-spacing: 0.5rpx;
        opacity: 0.95;
    }

    .hero-desc {
        font-size: 26rpx;
        color: var(--text-secondary);
        line-height: 1.7;
        font-weight: 500;
    }
}

.hero-enter-1 {
    animation: hero-enter-up 0.5s ease-out both;
}

.hero-enter-2 {
    animation: hero-enter-up 0.6s ease-out both;
    animation-delay: 0.12s;
}

.hero-enter-3 {
    animation: hero-enter-up 0.7s ease-out both;
    animation-delay: 0.24s;
}

.panel {
    background: transparent;
    padding: 20rpx;
    border-bottom: 1rpx solid var(--panel-border);
}

.picker-title {
    font-size: 26rpx;
    font-weight: 600;
    color: var(--text-primary);
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
    border: 2rpx solid var(--panel-border);
    overflow: hidden;
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.06);
    box-shadow: 0 16rpx 32rpx var(--shadow-color);
}

.fav-card.active {
    border-color: var(--discover-border-strong);
    box-shadow:
        0 0 0 4rpx rgba(255, 215, 230, 0.16),
        0 18rpx 36rpx var(--shadow-color);
}

.fav-card--loading {
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    box-shadow: none;
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
    border: 1rpx solid var(--panel-border);
    background: var(--panel-background);
    box-shadow: 0 12rpx 24rpx var(--shadow-color);
}

.msg-content {
    max-width: calc(100% - 140rpx);
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
    color: var(--text-secondary);
    font-size: 28rpx;
    font-weight: 600;
    margin-bottom: 8rpx;
}

.msg-row.user .msg-label {
    margin-left: auto;
    color: var(--accent-primary);
}

.msg-text {
    display: inline-block;
    text-align: left;
    border: 1rpx solid var(--panel-border);
    background: var(--panel-background);
    padding: 16rpx 18rpx;
    border-radius: 22rpx;
    font-size: 30rpx;
    color: var(--text-primary);
    line-height: 1.72;
    white-space: pre-wrap;
    word-break: break-word;
    box-shadow: 0 14rpx 30rpx var(--shadow-color);
    backdrop-filter: blur(20rpx);
}

.msg-row.assistant .msg-text,
.msg-item.assistant .msg-text {
    border: none;
    background: transparent;
    box-shadow: none;
    backdrop-filter: none;
    padding: 8rpx 20rpx;
}

.msg-item {
    margin-top: 30rpx;
}

.msg-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 8rpx;
}

.msg-header .msg-avatar {
    width: 58rpx;
    height: 58rpx;
    border-radius: 50%;
    border: 1rpx solid var(--panel-border);
    background: var(--panel-background);
    box-shadow: 0 12rpx 24rpx var(--shadow-color);
}

.msg-header .msg-label {
    color: var(--text-secondary);
    font-size: 28rpx;
    font-weight: 600;
}

.msg-content.full-width {
    max-width: 100%;
}

.streaming-text {
    white-space: pre-wrap;
}

.markdown {
    width: auto;
}

.markdown :deep(h1),
.markdown :deep(h2),
.markdown :deep(h3),
.markdown :deep(h4),
.markdown :deep(h5),
.markdown :deep(h6) {
    font-weight: 700;
    line-height: 1.4;
    color: var(--text-primary);
}

.markdown :deep(h1) { font-size: 44rpx; margin: 56rpx 0 28rpx; }
.markdown :deep(h2) { font-size: 40rpx; margin: 48rpx 0 24rpx; }
.markdown :deep(h3) { font-size: 36rpx; margin: 40rpx 0 20rpx; }
.markdown :deep(h4) { font-size: 34rpx; margin: 32rpx 0 16rpx; }
.markdown :deep(h5) { font-size: 32rpx; margin: 24rpx 0 12rpx; }
.markdown :deep(h6) { font-size: 30rpx; margin: 16rpx 0 8rpx; }



.markdown :deep(p) {
    margin: 0 0 16rpx;
    line-height: 1.6;
}

.markdown :deep(p:last-child) {
    margin-bottom: 0;
}

.markdown :deep(ul),
.markdown :deep(ol) {
    padding-left: 36rpx;
    margin: 0 0 16rpx;
}

.markdown :deep(li) {
    margin-bottom: 8rpx;
    line-height: 1.6;
}

.markdown :deep(li:last-child) {
    margin-bottom: 0;
}

.markdown :deep(strong) {
    font-weight: 700;
}

.markdown :deep(code) {
    background: rgba(120, 120, 120, 0.1);
    border-radius: 8rpx;
    padding: 4rpx 8rpx;
    font-size: 26rpx;
    font-family: monospace;
}

.markdown :deep(pre) {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 20rpx;
    border-radius: 12rpx;
    overflow-x: auto;
    margin: 16rpx 0;
}

.markdown :deep(pre code) {
    background: transparent;
    color: inherit;
    padding: 0;
    font-size: 26rpx;
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
    color: var(--text-secondary);
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
    border: 1rpx solid var(--panel-border);
    box-shadow: 0 14rpx 28rpx var(--shadow-color);
}

.empty {
    padding: 120rpx 0;
    text-align: center;
}

.empty-text {
    color: var(--text-tertiary);
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
    border: 1rpx solid var(--panel-border);
    box-shadow: 0 14rpx 28rpx var(--shadow-color);
}

.pick-local-btn {
    border-radius: 22rpx;
    border: none;
    background: linear-gradient(135deg, #ffe0f1 0%, #ffd38f 100%);
    color: #111111;
    font-size: 28rpx;
    font-weight: 600;
    box-shadow: 0 16rpx 34rpx rgba(255, 190, 128, 0.18);
    display: flex;
    align-items: center;
    justify-content: center;

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
    border-top: 1rpx solid var(--panel-border);
    box-shadow: 0 -20rpx 44rpx var(--shadow-color);
    backdrop-filter: blur(24rpx);
    padding-top: 18rpx;
    padding-left: 24rpx;
    padding-right: 24rpx;
    padding-bottom: 22rpx;
    z-index: 99;
}

.picker-wrap {
    border: 1rpx solid var(--panel-border);
    border-radius: 26rpx;
    background: var(--panel-background);
    padding: 22rpx;
    margin-bottom: 14rpx;
    box-shadow: 0 14rpx 30rpx var(--shadow-color);
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
    color: var(--text-secondary);
    border: 1rpx solid var(--panel-border);
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

.source-item.active {
    color: var(--discover-switch-active-text);
    border-color: var(--discover-border-strong);
    background: linear-gradient(135deg, #ffe0f1 0%, #ffd38f 100%);
    box-shadow: 0 10rpx 24rpx rgba(255, 190, 128, 0.18);
}

.lock-icon {
    border: 1rpx solid rgba(255, 215, 143, 0.5);
    border-radius: 6rpx;
    padding: 2rpx 6rpx;
    background: rgba(255, 240, 214, 0.9);
}

.mini-empty {
    color: var(--text-tertiary);
    font-size: 24rpx;
}

.mini-link {
    color: var(--accent-primary);
    font-weight: 600;
    margin-left: 10rpx;
}

.local-line {
    display: flex;
    align-items: center;
    gap: 14rpx;
}

@keyframes hero-enter-up {
    from {
        opacity: 0;
        transform: translateY(40rpx);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
