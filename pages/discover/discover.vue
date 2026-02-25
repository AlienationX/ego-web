<template>
    <view class="layout">
        <view
            class="container"
            :style="{
                paddingTop: `${statusBarHeight + 10}px`,
                paddingBottom: `${containerBottomSpace}px`,
            }">
            <view class="intro">
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
                        <view class="msg-text">{{ msg.text || $t('discover.waiting') }}</view>
                    </view>
                </view>

                <view v-if="isThinking" class="msg-row assistant">
                    <image class="msg-avatar" :src="aiProfile.avatar" mode="aspectFill"></image>
                    <view class="msg-content">
                        <view class="msg-label">{{ aiProfile.name }}</view>
                        <view class="thinking-text">
                            <uni-icons class="spinning-icon" type="spinner-cycle" size="16" color="#6b7688"></uni-icons>
                            <text>{{ $t('discover.analyzingMessage') }}</text>
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
                                    @click="onSelect(item.id)">
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
                    <view
                        class="source-item"
                        :class="{ active: sourceMode === 'favorite' }"
                        @click="setSourceMode('favorite')">
                        {{ $t('discover.sourceFavorite') }}
                    </view>
                    <view
                        class="source-item"
                        :class="{ active: sourceMode === 'local' }"
                        @click="setSourceMode('local')">
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
    import { apiGetActions, apiPostDiscoverAnalyze } from '@/api/wallpaper.js';
    import { handlePicUrl } from '@/utils/common.js';
    import { useUserStore } from '@/stores/user.js';
    import { getStatusBarHeight, getTabBarHeight } from '@/utils/system.js';
    import { useI18n } from 'vue-i18n';

    const isLoading = ref(false);
    const isRunning = ref(false);
    const favoriteList = ref([]);
    const selectedId = ref(null);
    const userStore = useUserStore();
    const { t } = useI18n();
    const sourceMode = ref('favorite');
    const localImage = ref('');
    const pickerOpen = ref(true);
    const aiProfile = ref({
        name: 'EgoBot',
        avatar: '',
    });
    const isThinking = ref(false);
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

    const startTypingToMessage = (targetId, text) => {
        stopTyping();
        const full = String(text || '');
        let index = 0;
        updateMessage(targetId, { text: '' });

        typingTimer = setInterval(() => {
            index += 1;
            const next = full.slice(0, index);
            updateMessage(targetId, { text: next });
            scrollToBottom(0);
            if (index >= full.length) {
                stopTyping();
            }
        }, 80);
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
                        uni.navigateTo({ url: '/pages/membership/membership' });
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
                        uni.navigateTo({ url: '/pages/membership/membership' });
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

    const buildFallbackAnalysis = (item) => {
        const title = item?.description || item?.name || '这张图片';
        return `你偏好「${title}」这类视觉内容。整体风格倾向于重视秩序感与审美一致性，说明你在决策时更注重长期感受而非短期冲动。你对色彩和氛围细节敏感，通常会先观察再判断，属于稳健型思维。建议你在日常生活里保留固定的“审美补给”时间：比如每周整理一次图片收藏、回顾触动你的元素，这有助于你更清晰地识别自我价值偏好与情绪触发点。`;
    };

    const extractContent = (res) => {
        const data = res?.data || {};
        return (
            data.analysis ||
            data.content ||
            data.result ||
            data.message ||
            res?.message ||
            ''
        );
    };

    const onAnalyze = async () => {
        if (!canAnalyze.value || isRunning.value) return;
        isRunning.value = true;
        stopTyping();
        pickerOpen.value = false;

        const currentImage =
            sourceMode.value === 'local'
                ? localImage.value
                : selectedItem.value?.smallPicurl || selectedItem.value?.picurl || '';
        const currentPicUrl = sourceMode.value === 'local' ? localImage.value : selectedItem.value?.picurl || '';
        const currentId = sourceMode.value === 'local' ? 'local' : selectedItem.value?.id;

        appendMessage({
            role: 'user',
            name: userName.value,
            avatar: userAvatar.value,
            image: currentImage,
            text: `请分析这张我喜欢的图片（ID: ${currentId}）。`,
        });

        // 先把用户消息渲染到当前窗口，再请求 AI
        await nextTick();
        isThinking.value = true;
        await nextTick();
        scrollToBottom(0);
        await sleep(2000);

        try {
            const res = await apiPostDiscoverAnalyze({
                wall_id: currentId,
                picurl: currentPicUrl,
                prompt:
                    '请根据这张用户最喜欢的壁纸，输出简洁但有洞察力的中文分析：审美偏好、可能的人格特质、情绪需求、发现自我建议。避免绝对化判断。',
            });
            const content = extractContent(res) || buildFallbackAnalysis(selectedItem.value);
            isThinking.value = false;
            const aiMsgId = appendMessage({
                role: 'assistant',
                name: aiProfile.value.name,
                avatar: aiProfile.value.avatar,
                text: '',
            });
            startTypingToMessage(aiMsgId, content);
        } catch (error) {
            // 后端接口未就绪时，降级成本地分析，避免页面不可用
            isThinking.value = false;
            const aiMsgId = appendMessage({
                role: 'assistant',
                name: aiProfile.value.name,
                avatar: aiProfile.value.avatar,
                text: '',
            });
            startTypingToMessage(aiMsgId, buildFallbackAnalysis(selectedItem.value));
        } finally {
            isThinking.value = false;
            isRunning.value = false;
        }
    };

    const goFavorite = () => {
        if (!userStore.isLogin) {
            uni.navigateTo({ url: '/pages/login/login' });
            return;
        }
        uni.navigateTo({ url: '/pages/favorite/favorite' });
    };

    onLoad(() => {
        createAiProfile();
        getFavoriteList();
        statusBarHeight.value = getStatusBarHeight();
        tabBarHeight.value = getTabBarHeight();
    });

    onShow(() => {
        getFavoriteList();
    });

    onUnload(() => {
        stopTyping();
    });
</script>

<style lang="scss" scoped>
    .layout {
        background: #fff;
    }

    .container {
        padding: 0 24rpx;
        background: #fff;
    }

    .intro {
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
        font-size: 28rpx;
        font-weight: 600;
        color: #243447;
        margin-bottom: 16rpx;
    }

    .favorite-scroll {
        white-space: nowrap;
        width: 100%;
    }

    .favorite-row {
        display: flex;
        gap: 14rpx;
        padding-bottom: 10rpx;
    }

    .fav-card {
        width: 180rpx;
        height: 240rpx;
        border-radius: 8rpx;
        border: 2rpx solid transparent;
        overflow: hidden;
        flex-shrink: 0;
    }

    .fav-card.active {
        border-color: #28b389;
        background: #e9f7f3;
    }

    .fav-image {
        width: 100%;
        height: 100%;
        display: block;
    }

    .chat-panel {
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
        box-shadow: 0 8rpx 20rpx rgba(18, 31, 53, 0.07);
    }

    .msg-row.user .msg-text {
        border-color: #bfe8da;
        background: #f2fbf8;
    }

    .thinking-text {
        display: inline-flex;
        align-items: center;
        gap: 8rpx;
        margin-top: 2rpx;
        padding: 0;
        font-size: 28rpx;
        color: #516071;
        border: none;
        background: transparent;
        box-shadow: none;
    }

    .thinking-text text {
        display: block;
        line-height: 1.4;
    }

    .spinning-icon {
        animation: spinning 2.5s linear infinite;
    }

    .msg-image {
        width: 180rpx;
        height: 240rpx;
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
        border-radius: 8rpx;
        border: 1rpx solid #dde2e9;
    }

    .pick-local-btn {
        height: 76rpx;
        line-height: 76rpx;
        border-radius: 8rpx;
        border: 1rpx solid #c6ccd7;
        background: #fff;
        color: #2f3a48;
        font-size: 30rpx;
    }

    .bottom-panel {
        position: fixed;
        left: 0;
        right: 0;
        background: #fff;
        padding-top: 12rpx;
        padding-left: 24rpx;
        padding-right: 24rpx;
        padding-bottom: 16rpx;
        margin-top: 20rpx;
        z-index: 99;
    }

    .picker-wrap {
        border: 1rpx solid #d7dde7;
        border-radius: 12rpx;
        background: #ffffff;
        padding: 14rpx;
        margin-bottom: 12rpx;
    }

    .source-switch {
        display: flex;
        gap: 10rpx;
        margin-bottom: 12rpx;
    }

    .source-item {
        flex: 1;
        text-align: center;
        font-size: 28rpx;
        color: #5d687a;
        border: 1rpx solid #cfd5df;
        padding: 14rpx 10rpx;
        border-radius: 8rpx;
        background: #fff;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8rpx;
    }

    .source-item.active {
        color: #1f9f79;
        border-color: #1f9f79;
        background: #eaf7f3;
    }

    .lock-icon {
        border: 1rpx solid #f1d19b;
        border-radius: 6rpx;
        padding: 2rpx 6rpx;
        background: #fff7e8;
    }

    .mini-empty {
        color: #7f8b9e;
        font-size: 24rpx;
    }

    .mini-link {
        color: #1f9f79;
        margin-left: 10rpx;
    }

    .local-line {
        display: flex;
        align-items: center;
        gap: 12rpx;
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

    @keyframes spinning {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

</style>
