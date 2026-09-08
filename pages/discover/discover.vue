<template>
    <view class="discover-layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 顶部毛玻璃状态栏：静止时透明沉浸，向上滑时淡入渐变羽化毛玻璃 -->
        <glass-status-bar
            :is-scrolled="isScrolled"
            :theme="settingsStore.isDark ? 'dark' : 'light'"
        ></glass-status-bar>

        <!-- 背景动态氛围光晕 -->
        <view class="decorative-bg">
            <view class="bg-mesh"></view>
            <view class="bg-orb bg-orb--1"></view>
            <view class="bg-orb bg-orb--2"></view>
        </view>

        <!-- 主内容容器（原生页面顺滑滚动） -->
        <view class="discover-container" :style="{
            paddingTop: `${containerTopPadding}px`,
            paddingBottom: `${tabBarHeight + 36}px`,
        }">
            <!-- 头部 Hero 区域 -->
            <view class="hero-section">
                <view class="hero-badge">
                    <uni-icons type="fire-filled" size="14" color="#d9487d"></uni-icons>
                    <text class="hero-badge__text">Ego Lab · 灵感实验室</text>
                </view>
                <view class="hero-title">{{ $t('discover.heroTitle') }}</view>
                <view class="hero-subtitle">{{ $t('discover.heroSubtitle') }}</view>
            </view>

            <!-- 核心板块 1: 本我实验室 (Ego Persona AI) -->
            <view class="section-card ego-card">
                <!-- 状态 A: 初始选图 / 重新选择阶段 -->
                <view v-if="!isThinking && !hasResult" class="ego-stage ego-stage--pick">
                    <view class="ego-card__header">
                        <view class="ego-card__title-row">
                            <uni-icons type="star-filled" size="18" color="#d9487d"></uni-icons>
                            <text class="ego-card__title">{{ $t('discover.egoSectionTitle') }}</text>
                        </view>
                        <text class="ego-card__desc">{{ $t('discover.egoSectionDesc') }}</text>
                    </view>

                    <!-- 模式切换小胶囊 (预设心境 / 我的收藏 / 本地相册) -->
                    <view class="source-nav">
                        <view class="source-nav__item" :class="{ 'is-active': sourceMode === 'preset' }"
                            @click="setSourceMode('preset')">
                            <text>{{ $t('discover.presetLabel') }}</text>
                        </view>
                        <view class="source-nav__item" :class="{ 'is-active': sourceMode === 'favorite' }"
                            @click="setSourceMode('favorite')">
                            <text>{{ $t('discover.sourceFavorite') }}</text>
                        </view>
                        <view class="source-nav__item" :class="{ 'is-active': sourceMode === 'local' }"
                            @click="setSourceMode('local')">
                            <text>{{ $t('discover.sourceLocal') }}</text>
                            <uni-icons class="vip-icon" type="vip-filled" size="12" color="#b7791f"></uni-icons>
                        </view>
                    </view>

                    <!-- 预设心境样本区（即点即测，新老用户零门槛） -->
                    <view v-if="sourceMode === 'preset'" class="pick-area">
                        <scroll-view class="card-scroll" scroll-x show-scrollbar="false">
                            <view class="card-scroll__row">
                                <view v-for="item in presetMoods" :key="item.id" class="mood-card"
                                    :class="{ 'is-selected': selectedId === item.id }" @click="onSelectPreset(item)">
                                    <image class="mood-card__img" :src="item.smallPicurl" mode="aspectFill" lazy-load></image>
                                    <view class="mood-card__overlay">
                                        <text class="mood-card__tag">{{ item.tag }}</text>
                                        <text class="mood-card__mood">{{ item.mood }}</text>
                                    </view>
                                </view>
                            </view>
                        </scroll-view>
                    </view>

                    <!-- 我的收藏夹区域 -->
                    <view v-else-if="sourceMode === 'favorite'" class="pick-area">
                        <scroll-view v-if="favoriteList.length" class="card-scroll" scroll-x show-scrollbar="false"
                            :lower-threshold="60" @scrolltolower="loadMoreFavorites">
                            <view class="card-scroll__row">
                                <view v-for="item in favoriteList" :key="item.id" class="mood-card"
                                    :class="{ 'is-selected': selectedId === item.id }" @click="onSelectFavorite(item)">
                                    <image class="mood-card__img" :src="item.smallPicurl || item.picurl" mode="aspectFill" lazy-load></image>
                                </view>
                                <view v-if="favLoadingMore" class="mood-card mood-card--loading">
                                    <rotate-loading :size="40"></rotate-loading>
                                </view>
                            </view>
                        </scroll-view>
                        <view v-else class="empty-fav-card">
                            <text class="empty-fav-card__text">{{ $t('discover.empty') }}</text>
                            <view class="empty-fav-card__btn" @click="goFavorite">
                                <text>{{ $t('discover.goFavorite') }}</text>
                            </view>
                        </view>
                    </view>

                    <!-- 本地相册上传区域 -->
                    <view v-else class="pick-area pick-area--local">
                        <view v-if="localImage" class="local-card-preview" @click="pickLocalImage">
                            <image class="local-card-preview__img" :src="localImage" mode="aspectFill"></image>
                            <view class="local-card-preview__hint">
                                <uni-icons type="refreshempty" size="16" color="#ffffff"></uni-icons>
                                <text>更换图片</text>
                            </view>
                        </view>
                        <view v-else class="local-card-placeholder" @click="pickLocalImage">
                            <view class="upload-icon-circle">
                                <uni-icons type="camera-filled" size="24" color="#d9487d"></uni-icons>
                            </view>
                            <text class="upload-title">{{ $t('discover.pickLocalBtn') }}</text>
                            <text class="upload-subtitle">从本地相册上传一张图片分析本我</text>
                        </view>
                    </view>

                    <!-- 底部立即测验操作提示 -->
                    <view class="ego-card__action-bar">
                        <view class="hint-text">
                            <uni-icons type="info" size="14" color="var(--text-tertiary)"></uni-icons>
                            <text>轻触上方任意壁纸即可开启本我探索</text>
                        </view>
                    </view>
                </view>

                <!-- 状态 B: 分析感知中 (Thinking / Streaming) -->
                <view v-else-if="isThinking && !hasResult" class="ego-stage ego-stage--thinking">
                    <view class="thinking-aura">
                        <image v-if="currentSelectedImg" class="thinking-aura__img" :src="currentSelectedImg" mode="aspectFill"></image>
                        <view class="thinking-aura__glow"></view>
                        <view class="thinking-aura__spinner">
                            <rotate-loading :size="48" :speed="1.2"></rotate-loading>
                        </view>
                    </view>
                    <view class="thinking-title">色彩共鸣与性格解构中...</view>
                    <view class="thinking-time">{{ thinkingTime }}s</view>
                    <view class="thinking-quote">“在每一张心动的视界深处，都潜藏着未曾言说的本我”</view>
                </view>

                <!-- 状态 C: 生成专属「本我性格档案卡片」(Persona Result Card) -->
                <view v-else-if="hasResult" class="ego-stage ego-stage--result">
                    <!-- 档案卡片本体 (视觉海报雏形) -->
                    <view class="persona-card" :class="settingsStore.isDark ? 'is-dark' : 'is-light'">
                        <!-- 卡片顶栏 -->
                        <view class="persona-card__top">
                            <view class="persona-card__brand">
                                <text class="brand-en">EGO WALLPAPERS</text>
                                <text class="brand-cn">本我审美档案</text>
                            </view>
                            <view class="persona-card__id">№ {{ activePersona.code }}</view>
                        </view>

                        <!-- 壁纸与色彩视窗 -->
                        <view class="persona-card__cover">
                            <image class="persona-cover__img" :src="currentSelectedImg" mode="aspectFill"></image>
                            <view class="persona-cover__overlay"></view>
                            <view class="persona-palette">
                                <view v-for="(color, cIdx) in activePersona.palette" :key="cIdx"
                                    class="palette-dot" :style="{ backgroundColor: color }"></view>
                            </view>
                        </view>

                        <!-- 性格代号与核心标签 -->
                        <view class="persona-card__body">
                            <view class="persona-tag-pill">
                                <text># {{ activePersona.archetype }}</text>
                            </view>
                            <view class="persona-title">{{ activePersona.title }}</view>
                            <view class="persona-quote">“{{ activePersona.quote }}”</view>

                            <!-- AI 深度解读折叠区 -->
                            <view class="persona-detail">
                                <view class="persona-detail__header" @click="isDetailExpanded = !isDetailExpanded">
                                    <text class="detail-label">深度心理与审美解读</text>
                                    <uni-icons :type="isDetailExpanded ? 'arrowup' : 'arrowdown'" size="14"
                                        color="var(--text-tertiary)"></uni-icons>
                                </view>
                                <view v-if="isDetailExpanded" class="persona-detail__content markdown">
                                    <mp-html :content="activePersona.html" :tag-style="markdownTagStyle"></mp-html>
                                </view>
                            </view>
                        </view>
                    </view>

                    <!-- 卡片下方动作按钮组 -->
                    <view class="persona-actions">
                        <button class="action-btn action-btn--primary" @click="generateAndSavePoster">
                            <uni-icons type="download" size="18" color="#ffffff"></uni-icons>
                            <text>{{ $t('discover.shareCard') }}</text>
                        </button>
                        <button class="action-btn action-btn--secondary" @click="resetToPicker">
                            <uni-icons type="refreshempty" size="16" color="var(--text-primary)"></uni-icons>
                            <text>{{ $t('discover.reAnalyze') }}</text>
                        </button>
                    </view>
                </view>
            </view>

            <!-- 核心板块 2: 壁纸创意工坊 (Wall Studio) -->
            <view class="section-card studio-card">
                <view class="section-header">
                    <view class="section-header__title-row">
                        <uni-icons type="tune-filled" size="18" color="#8b5cf6"></uni-icons>
                        <text class="section-header__title">{{ $t('discover.studioTitle') }}</text>
                    </view>
                    <text class="section-header__desc">{{ $t('discover.studioDesc') }}</text>
                </view>

                <!-- 工坊工具列表 -->
                <view class="studio-tools">
                    <!-- 工具 1: 主屏磨砂伴侣 -->
                    <view class="studio-tool-item" @click="openFrostedStudio">
                        <view class="tool-icon-box tool-icon-box--blur">
                            <mdi-icon path="/static/icons/blur.svg" size="24px" color="#ffffff"></mdi-icon>
                        </view>
                        <view class="tool-info">
                            <view class="tool-title-row">
                                <text class="tool-title">{{ $t('discover.frostedTitle') }}</text>
                                <text class="tool-tag">🔥 热门伴侣</text>
                            </view>
                            <text class="tool-desc">{{ $t('discover.frostedDesc') }}</text>
                        </view>
                        <uni-icons type="forward" size="16" color="var(--text-tertiary)"></uni-icons>
                    </view>
                </view>
            </view>

            <!-- 核心板块 3: 心境漫游流派 (Aesthetic Vibes) -->
            <view class="section-card vibes-card">
                <view class="section-header">
                    <view class="section-header__title-row">
                        <uni-icons type="paperplane-filled" size="18" color="#38bdf8"></uni-icons>
                        <text class="section-header__title">{{ $t('discover.vibesTitle') }}</text>
                    </view>
                    <text class="section-header__desc">{{ $t('discover.vibesDesc') }}</text>
                </view>

                <view class="vibes-grid">
                    <view v-for="(vibe, vIdx) in vibesList" :key="vIdx" class="vibe-chip" @click="goVibe(vibe.query)">
                        <mdi-icon :path="vibe.path" size="16px" color="var(--text-secondary)"></mdi-icon>
                        <text class="vibe-chip__name">#{{ vibe.name }}</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 磨砂制作弹窗组件挂载 -->
        <popup-frosted-maker ref="frostedMakerPopup" :picurl="studioPicUrl" @requireVip="onFrostedRequireVip" />

        <!-- 离线海报绘制 Canvas (固定隐藏在屏幕外) -->
        <canvas canvas-id="posterCanvas" id="posterCanvas" class="poster-canvas"></canvas>

        <!-- 全局自定义 TabBar -->
        <glass-tab-bar
            current-path="/pages/discover/discover"
            :theme="settingsStore.isDark ? 'dark' : 'light'"
        ></glass-tab-bar>
    </view>
</template>

<script setup>
import { ref, computed, nextTick, getCurrentInstance, onMounted } from 'vue';
import { onLoad, onUnload, onShow, onPageScroll } from '@dcloudio/uni-app';
import { apiGetActions, apiPostDiscoverStream, apiGetRandomRecommend } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { useUserStore } from '@/stores/user.js';
import { getStatusBarHeight, getTabBarHeight } from '@/utils/layout.js';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { saveImageToAlbum } from '@/utils/blur.js';
// #ifdef APP-PLUS
import { chooseSystemMedia } from '@/uni_modules/uni-chooseSystemImage';
// #endif

const { proxy } = getCurrentInstance();
const { t } = useI18n();
const userStore = useUserStore();
const settingsStore = useSettingsStore();

const isScrolled = ref(false);
onPageScroll((e) => {
    isScrolled.value = e.scrollTop > 8;
});

const statusBarHeight = ref(getStatusBarHeight() || 0);
const containerTopPadding = computed(() => statusBarHeight.value + 16);
const tabBarHeight = computed(() => getTabBarHeight() || 60);

// ── 模式与状态定义 ──
const sourceMode = ref('preset'); // 'preset' | 'favorite' | 'local'
const isThinking = ref(false);
const thinkingTime = ref(0);
let thinkingTimer = null;
const hasResult = ref(false);
const isDetailExpanded = ref(false);

const selectedId = ref('preset_forest');
const localImage = ref('');
const currentSelectedImg = ref('');
const currentPicUrl = ref('');

// ── 官方预设心境样张（解决新用户冷启动死白，即点即测） ──
const presetMoods = ref([
    {
        id: 'preset_forest',
        title: '静谧森林',
        mood: '治愈放空',
        tag: '秩序森系',
        picurl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1080&auto=format&fit=crop&q=80',
        smallPicurl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=480&auto=format&fit=crop&q=70',
        palette: ['#2D4A3E', '#8F9E8B', '#DCE4D8'],
    },
    {
        id: 'preset_cosmos',
        title: '深邃星野',
        mood: '孤独自由',
        tag: '深空漫游',
        picurl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1080&auto=format&fit=crop&q=80',
        smallPicurl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=480&auto=format&fit=crop&q=70',
        palette: ['#0F172A', '#38BDF8', '#818CF8'],
    },
    {
        id: 'preset_sunset',
        title: '暮色旷野',
        mood: '浪漫辽阔',
        tag: '暮光辽远',
        picurl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&auto=format&fit=crop&q=80',
        smallPicurl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=480&auto=format&fit=crop&q=70',
        palette: ['#E07A5F', '#F4A261', '#264653'],
    },
    {
        id: 'preset_cyber',
        title: '赛博霓虹',
        mood: '潮酷漫步',
        tag: '未来幻境',
        picurl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1080&auto=format&fit=crop&q=80',
        smallPicurl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=480&auto=format&fit=crop&q=70',
        palette: ['#EC4899', '#8B5CF6', '#1E1B4B'],
    },
    {
        id: 'preset_minimal',
        title: '纯白极简',
        mood: '留白冥想',
        tag: '纯净秩序',
        picurl: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=1080&auto=format&fit=crop&q=80',
        smallPicurl: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=480&auto=format&fit=crop&q=70',
        palette: ['#E2E8F0', '#94A3B8', '#334155'],
    },
]);

// ── 收藏夹数据 ──
const favoriteList = ref([]);
const favPageNum = ref(1);
const favNoMore = ref(false);
const favLoadingMore = ref(false);

// ── 心境漫游流派 ──
const vibesList = [
    { name: '极简治愈', path: '/static/icons/flower-poppy.svg', query: '治愈' },
    { name: '赛博漫步', path: '/static/icons/rocket.svg', query: '赛博' },
    { name: '电影质感', path: '/static/icons/movie-open.svg', query: '电影' },
    { name: '暗黑深邃', path: '/static/icons/weather-night.svg', query: '暗黑' },
    { name: '山海旷野', path: '/static/icons/bird.svg', query: '风景' },
    { name: '次元幻想', path: '/static/icons/cards.svg', query: '二次元' },
];

// ── 本我性格生成结果模型 ──
const activePersona = ref({
    code: '729',
    archetype: '静谧巡星者',
    title: '秩序与温柔的造梦家',
    quote: '在喧嚣的世界中，你始终保留着一片不被定义的澄澈避风港。',
    palette: ['#2D4A3E', '#8F9E8B', '#DCE4D8'],
    fullText: '',
    html: '',
});

// ── Markdown 标签样式 ──
const markdownTagStyle = {
    h1: 'font-weight: 700; font-size: 38rpx; margin: 36rpx 0 18rpx; line-height: 1.4; color: var(--text-primary);',
    h2: 'font-weight: 700; font-size: 34rpx; margin: 30rpx 0 16rpx; line-height: 1.4; color: var(--text-primary);',
    h3: 'font-weight: 700; font-size: 30rpx; margin: 24rpx 0 12rpx; line-height: 1.4; color: var(--text-primary);',
    p: 'margin: 0 0 16rpx; line-height: 1.7; font-size: 26rpx; color: var(--text-secondary);',
    ul: 'padding-left: 36rpx; margin: 0 0 16rpx; font-size: 26rpx; color: var(--text-secondary);',
    ol: 'padding-left: 36rpx; margin: 0 0 16rpx; font-size: 26rpx; color: var(--text-secondary);',
    li: 'margin-bottom: 8rpx; line-height: 1.6;',
    strong: 'font-weight: 700; color: var(--text-primary);',
};

// ── 工坊弹窗关联 ──
const frostedMakerPopup = ref(null);
const studioPicUrl = computed(() => currentPicUrl.value || presetMoods.value[0]?.picurl);

const openFrostedStudio = () => {
    frostedMakerPopup.value?.open();
};

const onFrostedRequireVip = () => {
    uni.showModal({
        title: t('common.tip'),
        content: '主屏磨砂伴侣为 VIP 专属特权，是否前往开通会员？',
        confirmText: t('common.confirm'),
        cancelText: t('common.cancel'),
        success: (res) => {
            if (res.confirm) {
                uni.navigateTo({ url: '/pages/member/payment' });
            }
        },
    });
};

const goVibe = (query) => {
    uni.navigateTo({
        url: `/pages/app/search?keyword=${encodeURIComponent(query)}`,
    });
};

// ── 模式切换 ──
const setSourceMode = (mode) => {
    if (mode === 'local' && !userStore.isVip) {
        uni.showModal({
            title: t('common.tip'),
            content: t('discover.localVipRequired'),
            confirmText: t('common.confirm'),
            cancelText: t('common.cancel'),
            success: (res) => {
                if (res.confirm) {
                    uni.navigateTo({ url: '/pages/member/payment' });
                }
            },
        });
        return;
    }
    sourceMode.value = mode;
};

// ── 收藏列表加载 ──
const getFavoriteList = async (isAppend = false) => {
    if (!userStore.isLoggedIn) return;
    if (isAppend) {
        if (favLoadingMore.value || favNoMore.value) return;
        favLoadingMore.value = true;
    } else {
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
        }
        const totalPages = Number(res?.pagination?.total_pages || 1);
        if (favPageNum.value >= totalPages) {
            favNoMore.value = true;
        }
    } catch (e) {
        if (!isAppend) favoriteList.value = [];
    } finally {
        favLoadingMore.value = false;
    }
};

const loadMoreFavorites = () => {
    if (favLoadingMore.value || favNoMore.value) return;
    favPageNum.value++;
    getFavoriteList(true);
};

const goFavorite = () => {
    if (!userStore.isLoggedIn) {
        uni.navigateTo({ url: '/pages/auth/signin' });
        return;
    }
    uni.navigateTo({ url: '/pages/app/favorite' });
};

// ── 选择图片并触发分析 ──
const onSelectPreset = (item) => {
    selectedId.value = item.id;
    currentSelectedImg.value = item.smallPicurl || item.picurl;
    currentPicUrl.value = item.picurl;
    if (item.palette) {
        activePersona.value.palette = item.palette;
    }
    startEgoAnalysis();
};

const onSelectFavorite = (item) => {
    selectedId.value = item.id;
    currentSelectedImg.value = item.smallPicurl || item.picurl;
    currentPicUrl.value = item.picurl;
    startEgoAnalysis();
};

const pickLocalImage = () => {
    if (!userStore.isVip) {
        uni.showModal({
            title: t('common.tip'),
            content: t('discover.localVipRequired'),
            success: (res) => {
                if (res.confirm) uni.navigateTo({ url: '/pages/member/payment' });
            },
        });
        return;
    }

    // #ifdef APP-PLUS
    const channel = plus.runtime.channel;
    if (channel === 'google') {
        chooseSystemMedia({
            count: 1,
            mediaType: ['image'],
            success: (res) => {
                localImage.value = res.filePaths?.[0] || '';
                currentSelectedImg.value = localImage.value;
                currentPicUrl.value = localImage.value;
                startEgoAnalysis();
            },
        });
        return;
    }
    // #endif

    uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album'],
        success: (res) => {
            localImage.value = res.tempFilePaths?.[0] || '';
            currentSelectedImg.value = localImage.value;
            currentPicUrl.value = localImage.value;
            startEgoAnalysis();
        },
    });
};

// ── AI 思考与分析流程 ──
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

const markdownToHtml = (md = '') => {
    let html = String(md || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    html = html.replace(/^###\s*(.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s*(.*)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s*(.*)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.split(/\n{2,}/).map(block => {
        block = block.trim();
        if (!block) return '';
        if (/^<(h[1-6]|ul|ol)/.test(block)) return block;
        return `<p>${block.replace(/\n/g, '<br/>')}</p>`;
    }).join('\n');
    return html;
};

// 智能提炼本我档案信息
const parsePersonaFromText = (rawText) => {
    const text = String(rawText || '').trim();
    if (!text) return;

    let archetype = '审美探索者';
    let quote = '在心之所向的视界中，映射出你独一无二的精神自留地。';

    // 智能抓取代号
    const archetypeMatch = text.match(/(?:代号|性格|画像|特质|原型|人格)[：:\s*]*([^\n，。]{2,12})/i);
    if (archetypeMatch && archetypeMatch[1]) {
        archetype = archetypeMatch[1].replace(/[#*✨🌿🌊⚡️\s]/g, '').trim();
    } else {
        // 根据预设或随机挑选有诗意的代号
        const titles = ['旷野漫步者', '深海巡航家', '极简秩序者', '浪漫造梦人', '微光捕手'];
        archetype = titles[Math.floor(Math.random() * titles.length)];
    }

    // 智能提取一句诗意洞察
    const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && l.length > 10);
    if (lines.length > 0) {
        quote = lines[0].replace(/^[*-•\d.]\s*/, '').replace(/[*_]/g, '');
        if (quote.length > 48) quote = quote.slice(0, 48) + '...';
    }

    activePersona.value = {
        code: Math.floor(100 + Math.random() * 900).toString(),
        archetype,
        title: `${archetype} · 本我映照`,
        quote,
        palette: activePersona.value.palette.length ? activePersona.value.palette : ['#38BDF8', '#818CF8', '#C084FC'],
        fullText: text,
        html: markdownToHtml(text),
    };
};

const startEgoAnalysis = async () => {
    if (isThinking.value) return;
    isThinking.value = true;
    hasResult.value = false;
    startThinkingTimer();

    try {
        let finalPicUrl = currentPicUrl.value;

        // 本地选图转 base64
        if (sourceMode.value === 'local' && finalPicUrl) {
            // #ifdef MP || APP-PLUS
            const fs = uni.getFileSystemManager();
            const base64Data = fs.readFileSync(finalPicUrl, 'base64');
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

        let accumulatedText = '';
        await apiPostDiscoverStream(
            {
                img_url: finalPicUrl,
                lang: uni.getStorageSync('lang') || uni.getLocale(),
            },
            {
                onMessage: (chunk) => {
                    accumulatedText += String(chunk || '');
                },
                onDone: () => {
                    stopThinkingTimer();
                    isThinking.value = false;
                    hasResult.value = true;
                    parsePersonaFromText(accumulatedText);
                },
            }
        );

        // 如果未进入流式回调但已结束
        if (!hasResult.value && accumulatedText) {
            stopThinkingTimer();
            isThinking.value = false;
            hasResult.value = true;
            parsePersonaFromText(accumulatedText);
        }
    } catch (e) {
        stopThinkingTimer();
        isThinking.value = false;
        hasResult.value = true;
        // 优雅的兜底结果，避免挫败感
        parsePersonaFromText('你拥有一颗对静谧与秩序抱有无限向往的心。在纷扰的世界中，你的目光所及始终是一片澄澈温润的天地。');
    }
};

const resetToPicker = () => {
    hasResult.value = false;
    isThinking.value = false;
};

// ── 一键生成并保存本我性格海报 ──
const generateAndSavePoster = () => {
    uni.showLoading({ title: t('discover.generatingPoster') });

    // 1. 获取壁纸本地临时文件
    uni.getImageInfo({
        src: currentSelectedImg.value,
        success: (imgRes) => {
            const ctx = uni.createCanvasContext('posterCanvas', proxy);
            const W = 750;
            const H = 1120;

            // 绘制渐变背景
            const isDark = settingsStore.isDark;
            const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
            if (isDark) {
                bgGrad.addColorStop(0, '#0f172a');
                bgGrad.addColorStop(1, '#020617');
            } else {
                bgGrad.addColorStop(0, '#f8fafc');
                bgGrad.addColorStop(1, '#e2e8f0');
            }
            ctx.setFillStyle(bgGrad);
            ctx.fillRect(0, 0, W, H);

            // 绘制顶部品牌文字
            ctx.setFillStyle(isDark ? '#e2e8f0' : '#1e293b');
            ctx.setFontSize(26);
            ctx.fillText('EGO WALLPAPERS · 本我档案', 50, 70);

            ctx.setFillStyle(isDark ? '#64748b' : '#94a3b8');
            ctx.setFontSize(20);
            ctx.fillText(`№ ${activePersona.value.code}`, W - 120, 70);

            // 绘制壁纸主图
            const imgW = 650;
            const imgH = 500;
            const imgX = 50;
            const imgY = 100;
            ctx.save();
            ctx.drawImage(imgRes.path, imgX, imgY, imgW, imgH);
            ctx.restore();

            // 绘制色盘
            const colors = activePersona.value.palette;
            colors.forEach((col, idx) => {
                ctx.beginPath();
                ctx.arc(80 + idx * 45, 640, 14, 0, Math.PI * 2);
                ctx.setFillStyle(col);
                ctx.fill();
            });

            // 绘制性格标签代号
            ctx.setFillStyle(isDark ? '#f43f5e' : '#e11d48');
            ctx.setFontSize(24);
            ctx.fillText(`# ${activePersona.value.archetype}`, 50, 710);

            // 绘制大标题
            ctx.setFillStyle(isDark ? '#f8fafc' : '#0f172a');
            ctx.setFontSize(38);
            ctx.fillText(activePersona.value.title, 50, 765);

            // 绘制金句引用
            ctx.setFillStyle(isDark ? '#cbd5e1' : '#334155');
            ctx.setFontSize(26);
            const quote = `“${activePersona.value.quote}”`;
            ctx.fillText(quote.slice(0, 24), 50, 830);
            if (quote.length > 24) {
                ctx.fillText(quote.slice(24), 50, 875);
            }

            // 绘制底部装饰线与标语
            ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(50, 970);
            ctx.lineTo(W - 50, 970);
            ctx.stroke();

            ctx.setFillStyle(isDark ? '#94a3b8' : '#64748b');
            ctx.setFontSize(22);
            ctx.fillText('探索壁纸，亦探索自我 · 本我壁纸 APP', 50, 1020);

            ctx.draw(false, () => {
                setTimeout(() => {
                    uni.canvasToTempFilePath({
                        canvasId: 'posterCanvas',
                        success: (fileRes) => {
                            uni.hideLoading();
                            saveImageToAlbum(fileRes.tempFilePath);
                            uni.showToast({
                                title: t('discover.posterSaved'),
                                icon: 'none',
                            });
                        },
                        fail: () => {
                            uni.hideLoading();
                            uni.showToast({ title: '保存海报失败', icon: 'none' });
                        },
                    }, proxy);
                }, 150);
            });
        },
        fail: () => {
            uni.hideLoading();
            uni.showToast({ title: '海报资源加载失败', icon: 'none' });
        },
    });
};

onMounted(() => {
    // 默认选用第一个样张
    if (presetMoods.value.length) {
        currentSelectedImg.value = presetMoods.value[0].smallPicurl;
        currentPicUrl.value = presetMoods.value[0].picurl;
    }
});

onShow(() => {
    if (userStore.isLoggedIn) {
        getFavoriteList();
    }
});

onUnload(() => {
    stopThinkingTimer();
});
</script>

<style lang="scss" scoped>
.discover-layout {
    position: relative;
    min-height: 100vh;
    background: var(--page-background);
    overflow-x: hidden;
}

/* ── 动态氛围背景光晕 ── */
.decorative-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
}

.bg-mesh {
    position: absolute;
    inset: 0;
    opacity: 0.15;
    background-image:
        linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
    background-size: 60rpx 60rpx;
    mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.8), transparent 90%);
}

.bg-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(120rpx);
    opacity: 0.28;
    pointer-events: none;
}

.bg-orb--1 {
    top: -100rpx;
    right: -80rpx;
    width: 500rpx;
    height: 500rpx;
    background: radial-gradient(circle, #f43f5e 0%, #fb7185 60%, transparent 80%);
}

.bg-orb--2 {
    top: 400rpx;
    left: -120rpx;
    width: 600rpx;
    height: 600rpx;
    background: radial-gradient(circle, #38bdf8 0%, #818cf8 60%, transparent 80%);
}

/* ── 主内容容器 ── */
.discover-container {
    position: relative;
    z-index: 1;
    padding-left: 20rpx;
    padding-right: 20rpx;
    display: flex;
    flex-direction: column;
    gap: 36rpx;
}

/* ── Hero 头部 ── */
.hero-section {
    padding-top: 10rpx;

    .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 8rpx;
        padding: 6rpx 18rpx;
        border-radius: 100rpx;
        background: rgba(217, 72, 125, 0.1);
        border: 1rpx solid rgba(217, 72, 125, 0.2);
        margin-bottom: 16rpx;

        &__text {
            font-size: 22rpx;
            font-weight: 700;
            color: #d9487d;
            letter-spacing: 0.5rpx;
        }
    }

    .hero-title {
        font-size: 56rpx;
        font-weight: 900;
        color: var(--text-primary);
        letter-spacing: -1.5rpx;
        line-height: 1.15;
        margin-bottom: 12rpx;
    }

    .hero-subtitle {
        font-size: 26rpx;
        color: var(--text-secondary);
        font-weight: 500;
    }
}

/* ── 通用板块卡片容器 ── */
.section-card {
    background: var(--panel-background);
    border: 1rpx solid var(--panel-border);
    border-radius: 36rpx;
    box-shadow: 0 12rpx 36rpx var(--shadow-color);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
}

.section-header {
    padding: 28rpx 28rpx 16rpx;

    &__title-row {
        display: flex;
        align-items: center;
        gap: 12rpx;
        margin-bottom: 6rpx;
    }

    &__title {
        font-size: 32rpx;
        font-weight: 700;
        color: var(--text-primary);
    }

    &__desc {
        font-size: 24rpx;
        color: var(--text-tertiary);
    }
}

/* ── 本我实验室主卡片 ── */
.ego-card {
    border: 1rpx solid rgba(217, 72, 125, 0.22);
    background: linear-gradient(175deg, var(--panel-background) 0%, rgba(217, 72, 125, 0.03) 100%);
    box-shadow: 0 16rpx 44rpx var(--shadow-color);

    &__header {
        padding: 30rpx 28rpx 20rpx;
    }

    &__title-row {
        display: flex;
        align-items: center;
        gap: 12rpx;
        margin-bottom: 8rpx;
    }

    &__title {
        font-size: 34rpx;
        font-weight: 800;
        color: var(--text-primary);
        letter-spacing: 0.5rpx;
    }

    &__desc {
        font-size: 24rpx;
        color: var(--text-secondary);
        line-height: 1.5;
    }
}

/* 选图模式切换 */
.source-nav {
    display: flex;
    gap: 16rpx;
    padding: 0 28rpx 24rpx;

    &__item {
        height: 54rpx;
        padding: 0 24rpx;
        border-radius: 100rpx;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8rpx;
        background: rgba(0, 0, 0, 0.04);
        border: 1rpx solid transparent;
        font-size: 24rpx;
        font-weight: 600;
        color: var(--text-secondary);
        transition: all 0.2s;

        .theme-dark & {
            background: rgba(255, 255, 255, 0.06);
        }

        &.is-active {
            background: #d9487d;
            color: #ffffff;
            box-shadow: 0 6rpx 16rpx rgba(217, 72, 125, 0.3);

            .vip-icon {
                color: #ffffff !important;
            }
        }
    }
}

/* 心境样张横滑展示 */
.pick-area {
    padding: 0 0 24rpx;

    .card-scroll {
        white-space: nowrap;
        width: 100%;

        &__row {
            display: flex;
            gap: 18rpx;
            padding: 0 28rpx;
        }
    }
}

.mood-card {
    position: relative;
    width: 200rpx;
    height: 330rpx;
    border-radius: 24rpx;
    overflow: hidden;
    flex-shrink: 0;
    border: 2rpx solid var(--panel-border);
    box-shadow: 0 8rpx 20rpx var(--shadow-color);
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;

    &:active {
        transform: scale(0.96);
    }

    &.is-selected {
        border-color: #d9487d;
        box-shadow: 0 0 0 4rpx rgba(217, 72, 125, 0.35), 0 12rpx 28rpx rgba(217, 72, 125, 0.25);
    }

    &__img {
        width: 100%;
        height: 100%;
        display: block;
    }

    &__overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 40rpx 14rpx 14rpx;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
        display: flex;
        flex-direction: column;
        gap: 4rpx;
    }

    &__tag {
        font-size: 20rpx;
        font-weight: 700;
        color: #ffffff;
    }

    &__mood {
        font-size: 18rpx;
        color: rgba(255, 255, 255, 0.75);
    }

    &--loading {
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        box-shadow: none;
    }
}

.empty-fav-card {
    margin: 0 28rpx;
    padding: 40rpx 20rpx;
    border-radius: 24rpx;
    background: rgba(0, 0, 0, 0.02);
    border: 1rpx dashed var(--panel-border);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;

    &__text {
        font-size: 24rpx;
        color: var(--text-tertiary);
    }

    &__btn {
        padding: 10rpx 28rpx;
        border-radius: 100rpx;
        background: #d9487d;
        color: #ffffff;
        font-size: 22rpx;
        font-weight: 600;
    }
}

/* 本地选图卡片 */
.pick-area--local {
    padding: 0 28rpx 24rpx;
}

.local-card-placeholder {
    height: 300rpx;
    border-radius: 24rpx;
    border: 2rpx dashed rgba(217, 72, 125, 0.35);
    background: rgba(217, 72, 125, 0.04);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10rpx;

    .upload-icon-circle {
        width: 76rpx;
        height: 76rpx;
        border-radius: 50%;
        background: rgba(217, 72, 125, 0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 6rpx;
    }

    .upload-title {
        font-size: 28rpx;
        font-weight: 700;
        color: var(--text-primary);
    }

    .upload-subtitle {
        font-size: 22rpx;
        color: var(--text-tertiary);
    }
}

.local-card-preview {
    position: relative;
    height: 340rpx;
    border-radius: 24rpx;
    overflow: hidden;
    box-shadow: 0 10rpx 24rpx var(--shadow-color);

    &__img {
        width: 100%;
        height: 100%;
        display: block;
    }

    &__hint {
        position: absolute;
        bottom: 16rpx;
        right: 16rpx;
        padding: 8rpx 20rpx;
        border-radius: 100rpx;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        gap: 8rpx;
        color: #ffffff;
        font-size: 22rpx;
    }
}

.ego-card__action-bar {
    padding: 16rpx 28rpx 24rpx;
    border-top: 1rpx solid var(--panel-border);
    display: flex;
    align-items: center;
    justify-content: center;

    .hint-text {
        display: flex;
        align-items: center;
        gap: 8rpx;
        font-size: 22rpx;
        color: var(--text-tertiary);
    }
}

/* ── 状态 B: 分析中态 (Thinking) ── */
.ego-stage--thinking {
    padding: 60rpx 36rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    .thinking-aura {
        position: relative;
        width: 240rpx;
        height: 340rpx;
        border-radius: 28rpx;
        overflow: hidden;
        margin-bottom: 36rpx;
        box-shadow: 0 20rpx 50rpx rgba(217, 72, 125, 0.35);

        &__img {
            width: 100%;
            height: 100%;
            display: block;
            filter: brightness(0.65) blur(2px);
        }

        &__glow {
            position: absolute;
            inset: -20rpx;
            background: radial-gradient(circle, rgba(217, 72, 125, 0.6) 0%, transparent 70%);
            animation: pulse-glow 2s infinite ease-in-out;
        }

        &__spinner {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }

    .thinking-title {
        font-size: 32rpx;
        font-weight: 800;
        color: var(--text-primary);
        margin-bottom: 8rpx;
    }

    .thinking-time {
        font-size: 24rpx;
        font-weight: 700;
        color: #d9487d;
        margin-bottom: 16rpx;
    }

    .thinking-quote {
        font-size: 24rpx;
        color: var(--text-tertiary);
        max-width: 520rpx;
        line-height: 1.6;
        font-style: italic;
    }
}

@keyframes pulse-glow {
    0%, 100% { opacity: 0.4; transform: scale(0.96); }
    50% { opacity: 0.8; transform: scale(1.04); }
}

/* ── 状态 C: 本我性格档案卡片 ── */
.ego-stage--result {
    padding: 24rpx;
}

.persona-card {
    border-radius: 28rpx;
    padding: 32rpx;
    margin-bottom: 24rpx;
    border: 1rpx solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.06);

    &.is-dark {
        background: rgba(18, 24, 38, 0.85);
        border-color: rgba(255, 255, 255, 0.08);
        box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.4);
    }

    &__top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24rpx;
    }

    &__brand {
        display: flex;
        flex-direction: column;

        .brand-en {
            font-size: 20rpx;
            font-weight: 800;
            letter-spacing: 1.5rpx;
            color: #d9487d;
        }

        .brand-cn {
            font-size: 26rpx;
            font-weight: 900;
            color: var(--text-primary);
        }
    }

    &__id {
        font-size: 24rpx;
        font-weight: 700;
        color: var(--text-tertiary);
        font-family: monospace;
    }

    &__cover {
        position: relative;
        height: 380rpx;
        border-radius: 20rpx;
        overflow: hidden;
        margin-bottom: 28rpx;

        .persona-cover__img {
            width: 100%;
            height: 100%;
            display: block;
        }

        .persona-palette {
            position: absolute;
            bottom: 16rpx;
            left: 16rpx;
            display: flex;
            gap: 12rpx;
            padding: 8rpx 16rpx;
            border-radius: 100rpx;
            background: rgba(0, 0, 0, 0.45);
            backdrop-filter: blur(6px);

            .palette-dot {
                width: 24rpx;
                height: 24rpx;
                border-radius: 50%;
                border: 1rpx solid rgba(255, 255, 255, 0.4);
            }
        }
    }

    &__body {
        display: flex;
        flex-direction: column;
        gap: 14rpx;

        .persona-tag-pill {
            align-self: flex-start;
            padding: 6rpx 18rpx;
            border-radius: 100rpx;
            background: rgba(217, 72, 125, 0.12);
            color: #d9487d;
            font-size: 22rpx;
            font-weight: 700;
        }

        .persona-title {
            font-size: 40rpx;
            font-weight: 900;
            color: var(--text-primary);
            letter-spacing: -0.5rpx;
        }

        .persona-quote {
            font-size: 28rpx;
            color: var(--text-secondary);
            line-height: 1.6;
            font-weight: 500;
            font-style: italic;
        }
    }

    .persona-detail {
        margin-top: 20rpx;
        padding-top: 20rpx;
        border-top: 1rpx solid var(--panel-border);

        &__header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;

            .detail-label {
                font-size: 24rpx;
                font-weight: 600;
                color: var(--text-tertiary);
            }
        }

        &__content {
            margin-top: 16rpx;
        }
    }
}

/* 档案卡片动作按钮组 */
.persona-actions {
    display: flex;
    gap: 16rpx;

    .action-btn {
        flex: 1;
        height: 76rpx;
        border-radius: 100rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12rpx;
        font-size: 26rpx;
        font-weight: 700;
        transition: transform 0.2s;

        &:active {
            transform: scale(0.97);
        }

        &--primary {
            background: #d9487d;
            color: #ffffff;
            box-shadow: 0 8rpx 20rpx rgba(217, 72, 125, 0.35);
        }

        &--secondary {
            background: var(--panel-background);
            border: 1rpx solid var(--panel-border);
            color: var(--text-primary);
        }
    }
}

/* ── 创意工坊工具列表 ── */
.studio-tools {
    padding: 0 28rpx 28rpx;
}

.studio-tool-item {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 24rpx;
    border-radius: 24rpx;
    background: rgba(0, 0, 0, 0.02);
    border: 1rpx solid var(--panel-border);
    transition: transform 0.2s, background 0.2s;

    .theme-dark & {
        background: rgba(255, 255, 255, 0.03);
    }

    &:active {
        transform: scale(0.98);
        background: rgba(0, 0, 0, 0.04);
    }

    .tool-icon-box {
        width: 80rpx;
        height: 80rpx;
        border-radius: 22rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &--blur {
            background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
            box-shadow: 0 8rpx 18rpx rgba(139, 92, 246, 0.35);
        }
    }

    .tool-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6rpx;

        .tool-title-row {
            display: flex;
            align-items: center;
            gap: 12rpx;

            .tool-title {
                font-size: 28rpx;
                font-weight: 700;
                color: var(--text-primary);
            }

            .tool-tag {
                padding: 2rpx 12rpx;
                border-radius: 8rpx;
                background: rgba(239, 68, 68, 0.1);
                color: #ef4444;
                font-size: 18rpx;
                font-weight: 700;
            }
        }

        .tool-desc {
            font-size: 22rpx;
            color: var(--text-tertiary);
            line-height: 1.4;
        }
    }
}

/* ── 心境流派胶囊 ── */
.vibes-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    padding: 0 28rpx 28rpx;
}

.vibe-chip {
    padding: 14rpx 26rpx;
    border-radius: 100rpx;
    background: rgba(0, 0, 0, 0.02);
    border: 1rpx solid var(--panel-border);
    display: inline-flex;
    align-items: center;
    gap: 10rpx;
    transition: transform 0.2s, border-color 0.2s;

    .theme-dark & {
        background: rgba(255, 255, 255, 0.03);
    }

    &:active {
        transform: scale(0.95);
        border-color: #38bdf8;
    }

    &__name {
        font-size: 24rpx;
        font-weight: 600;
        color: var(--text-primary);
    }
}

/* ── 离线 Canvas ── */
.poster-canvas {
    position: fixed;
    left: -9999px;
    top: -9999px;
    width: 750px;
    height: 1120px;
    pointer-events: none;
}
</style>
