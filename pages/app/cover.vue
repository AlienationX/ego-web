<template>
    <view class="edit-cover-page" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- #ifndef WEB -->
        <view class="status-bar-bg" :style="{ height: `${statusBarHeight}px` }"></view>
        <!-- #endif -->
        <view class="nav-container">
            <view class="status-holder" :style="{ height: `${statusBarHeight}px` }"></view>
            <view class="header" :style="{ height: `${titleBarHeight}px`, paddingRight: titlebarPaddingRight }">
                <view class="back-btn" @click="goBack">
                    <mdi-icon
                        path="/static/icons/arrow-left.svg"
                        size="18px"
                        :color="isDark ? '#e5e7eb' : '#374151'"
                    ></mdi-icon>
                </view>
                <text class="header-title">Cover Editor</text>
            </view>
        </view>

        <view class="edit-cover-wrap">
            <view class="editor-intro">
                <view class="editor-intro__title">分类封面编辑</view>
                <view class="editor-intro__desc">
                    先选择分类，再从该分类下的壁纸中挑一张作为封面。未点击保存前，只会影响当前编辑页内的预览效果。
                </view>
            </view>

            <view class="editor-panel">
                <view class="panel-title">1. 选择分类</view>
                <scroll-view scroll-x class="chip-scroll">
                    <view class="chip-row">
                        <view
                            v-for="item in classifyComputed"
                            :key="item.id"
                            class="chip"
                            :class="{ active: selectedClassifyId === item.id }"
                            @click="selectClassify(item.id)"
                        >
                            {{ item.name }}
                        </view>
                    </view>
                </scroll-view>
            </view>

            <view class="editor-panel" v-if="selectedClassify">
                <view class="panel-head">
                    <view>
                        <view class="panel-title">2. 选择封面图片</view>
                        <view class="panel-subtitle">{{ selectedClassify.name }}</view>
                    </view>
                    <button class="mini-btn" @click="reloadImages">刷新</button>
                </view>

                <view v-if="imageLoading" class="editor-loading">
                    <rotate-loading :size="80"></rotate-loading>
                </view>

                <view v-else-if="!classifyImages.length" class="editor-empty"> 当前分类下暂无可选图片 </view>

                <scroll-view v-else scroll-x class="image-scroll" :lower-threshold="80" @scrolltolower="loadMoreImages">
                    <view class="image-row">
                        <view
                            v-for="item in classifyImages"
                            :key="item.id"
                            class="image-card"
                            :class="{ active: draftCoverUrl === (item.mediumPicurl || item.picurl) }"
                            @click="selectCover(item)"
                        >
                            <image class="image-card__thumb" :src="item.smallPicurl || item.mediumPicurl || item.picurl" mode="aspectFill"></image>
                            <view class="image-card__meta">
                                <view class="image-card__id">#{{ item.id }}</view>
                                <view class="image-card__score">评分 {{ item.score ?? '--' }}</view>
                            </view>
                        </view>
                        <view v-if="loadingMore" class="image-card image-card--loading">
                            <rotate-loading :size="60"></rotate-loading>
                        </view>
                    </view>
                </scroll-view>
            </view>

            <view class="editor-panel" v-if="selectedClassify">
                <view class="panel-head">
                    <view>
                        <view class="panel-title">3. 预览页面效果</view>
                        <view class="panel-subtitle">切换查看 classify.vue 和 classify-time 风格</view>
                    </view>
                    <view class="filter-toggle">
                        <text class="filter-toggle__label">仅显示已启用</text>
                        <view class="switch" :class="{ on: filterEnabled }" @click.stop="filterEnabled = !filterEnabled">
                            <view class="switch-dot"></view>
                        </view>
                    </view>
                </view>

                <view class="preview-switch-wrap">
                    <view class="preview-switch">
                        <view
                            class="preview-switch__item"
                            :class="{ active: previewMode === 'grid' }"
                            @click="previewMode = 'grid'"
                        >
                            classify.vue
                        </view>
                        <view
                            class="preview-switch__item"
                            :class="{ active: previewMode === 'time' }"
                            @click="previewMode = 'time'"
                        >
                            classify-time
                        </view>
                    </view>
                </view>

                <view v-if="previewMode === 'grid'" class="preview-grid">
                    <view v-for="item in classifyPreviewList" :key="item.id" class="preview-grid__item">
                        <image class="preview-grid__image" :src="getPreviewCover(item)" mode="aspectFill"></image>
                        <view class="preview-grid__mask">
                            <text class="preview-grid__name">{{ item.name }}</text>
                        </view>
                    </view>
                </view>

                <view v-else class="preview-time">
                    <view v-for="item in classifyPreviewList" :key="item.id" class="preview-time__item">
                        <image class="preview-time__thumb" :src="getPreviewCover(item)" mode="aspectFill"></image>
                        <view class="preview-time__body">
                            <view class="preview-time__name">{{ item.name }}</view>
                            <view class="preview-time__desc">封面将以时间流卡片形式展示</view>
                        </view>
                        <uni-icons type="right" size="16" color="#7c8aa5"></uni-icons>
                    </view>
                </view>
            </view>

            <view class="editor-panel" v-if="selectedClassify">
                <view class="panel-title">4. 保存</view>
                <view class="save-bar">
                    <view class="save-bar__info">
                        <view class="save-bar__label">当前草稿</view>
                        <view class="save-bar__value">
                            {{ draftChanged ? '已选择新封面，待保存' : '未修改，保持当前封面' }}
                        </view>
                    </view>
                    <button class="save-btn" :disabled="!draftChanged || saving" @click="saveCover">
                        {{ saving ? '保存中...' : '保存封面' }}
                    </button>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { apiGetClassList, apiGetClassify, apiPostClassifyPicUrl } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { PICS_BASE_URL } from '@/common/config.js';
import { useSettingsStore } from '@/stores/settings.js';
import { getStatusBarHeight, getTitleBarHeight } from '@/utils/system.js';

const settingsStore = useSettingsStore();
const isDark = computed(() => settingsStore.isDark);
const statusBarHeight = ref(getStatusBarHeight() || 0);
const titleBarHeight = ref(getTitleBarHeight() || 44);

const titlebarPaddingRight = computed(() => {
    // #ifdef MP-WEIXIN
    const menuButtonInfo = uni.getMenuButtonBoundingClientRect ? uni.getMenuButtonBoundingClientRect() : null;
    if (menuButtonInfo) {
        const sysInfo = uni.getSystemInfoSync();
        return sysInfo.windowWidth - menuButtonInfo.left + 10 + 'px';
    }
    // #endif
    return '32rpx';
});

const goBack = () => {
    uni.navigateBack();
};

const classifyList = ref([]);
const selectedClassifyId = ref(null);
const classifyImages = ref([]);
const imagePageNum = ref(1);
const imageNoMore = ref(false);
const loadingMore = ref(false);
const draftCoverUrl = ref('');
const draftCoverPicUrl = ref('');
const originalCoverUrl = ref('');
const previewMode = ref('grid');
const imageLoading = ref(false);
const saving = ref(false);
const filterEnabled = ref(false);

const classifyComputed = computed(() => {
    let list = classifyList.value;
    if (filterEnabled.value) {
        list = list.filter((item) => item.enable === true);
    }
    return list.map((item) => ({
        ...item,
        name: uni.getLocale() === 'en' ? item.name_en : item.name,
    }));
});

const selectedClassify = computed(() => classifyComputed.value.find((item) => item.id === selectedClassifyId.value) || null);
const classifyPreviewList = computed(() => classifyComputed.value); // classifyComputed.value.slice(0, 8)
const draftChanged = computed(
    () => !!selectedClassify.value && !!draftCoverUrl.value && draftCoverUrl.value !== originalCoverUrl.value,
);

const getClassify = async () => {
    const res = await apiGetClassify({ pageSize: 30, enable: false });
    classifyList.value = (res.data || []).map((item) => handlePicUrl(item));
    if (classifyList.value.length && !selectedClassifyId.value) {
        await selectClassify(classifyList.value[0].id);
    }
};

const getClassifyImages = async (classifyId, isAppend = false) => {
    if (isAppend) {
        if (loadingMore.value || imageNoMore.value) return;
        loadingMore.value = true;
    } else {
        imageLoading.value = true;
        imagePageNum.value = 1;
        imageNoMore.value = false;
    }
    try {
        const res = await apiGetClassList({
            classify_id: classifyId,
            classify_enable: false,
            pageNum: imagePageNum.value,
            pageSize: 20,
        });
        const newData = (res.data || []).map((item) => handlePicUrl(item));
        if (isAppend) {
            classifyImages.value.push(...newData);
        } else {
            classifyImages.value = newData;
        }
        const totalPages = Number(res?.pagination?.total_pages || 1);
        if (imagePageNum.value >= totalPages) {
            imageNoMore.value = true;
        }
    } catch (error) {
        classifyImages.value = [];
    } finally {
        imageLoading.value = false;
        loadingMore.value = false;
    }
};

const selectClassify = async (classifyId) => {
    if (selectedClassifyId.value === classifyId && classifyImages.value.length) return;
    selectedClassifyId.value = classifyId;
    const current = classifyList.value.find((item) => item.id === classifyId);
    originalCoverUrl.value = current?.mediumPicurl || current?.picurl || '';
    draftCoverUrl.value = current?.mediumPicurl || current?.picurl || '';
    draftCoverPicUrl.value = current?.picurl || '';
    await getClassifyImages(classifyId);
};

const reloadImages = async () => {
    if (!selectedClassifyId.value) return;
    await getClassifyImages(selectedClassifyId.value);
};

const loadMoreImages = () => {
    if (!selectedClassifyId.value || loadingMore.value || imageNoMore.value) return;
    imagePageNum.value++;
    getClassifyImages(selectedClassifyId.value, true);
};

const selectCover = (item) => {
    draftCoverUrl.value = item.mediumPicurl || item.picurl;
    draftCoverPicUrl.value = item.picurl;
};

const getPreviewCover = (item) => {
    if (item.id === selectedClassifyId.value && draftCoverUrl.value) {
        return draftCoverUrl.value;
    }
    return item.mediumPicurl || item.picurl;
};

const saveCover = async () => {
    if (!selectedClassify.value || !draftChanged.value || saving.value) return;
    saving.value = true;
    try {
        const picurl = draftCoverPicUrl.value.replace(PICS_BASE_URL + '/', '');
        await apiPostClassifyPicUrl({ picurl }, selectedClassify.value.id);

        classifyList.value = classifyList.value.map((item) =>
            item.id === selectedClassify.value.id
                ? {
                      ...item,
                      picurl: draftCoverUrl.value,
                      smallPicurl: draftCoverUrl.value.replace('.jpg', '_small.webp'),
                  }
                : item,
        );
        originalCoverUrl.value = draftCoverUrl.value;
        uni.showToast({
            title: '保存成功',
            icon: 'none',
        });
    } catch (error) {
        uni.showToast({
            title: '保存失败',
            icon: 'none',
        });
    } finally {
        saving.value = false;
    }
};

getClassify();
</script>

<style lang="scss" scoped>
.edit-cover-page {
    min-height: 100vh;
    background: var(--page-background);
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

.nav-container {
    background-color: var(--page-background);
}

.status-holder {
    width: 100%;
    background-color: var(--page-background);
}

.header {
    position: relative;
    display: flex;
    align-items: center;
    padding: 0 32rpx;
    background-color: var(--page-background);
    box-sizing: border-box;

    .back-btn {
        width: 64rpx;
        height: 64rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 16rpx;
        background: var(--page-background-secondary);
        border: 1rpx solid var(--panel-border);
    }

    .header-title {
        flex: 1;
        margin-left: 24rpx;
        font-size: 32rpx;
        font-weight: 700;
        color: var(--text-primary);
    }
}

.edit-cover-wrap {
    padding: 30rpx;
}

.editor-intro {
    padding: 10rpx 4rpx 28rpx;
    margin-bottom: 18rpx;
    border-bottom: 1rpx solid var(--panel-border);
}

.editor-intro__title {
    font-size: 34rpx;
    font-weight: 700;
    color: var(--text-primary);
}

.editor-intro__desc {
    margin-top: 12rpx;
    font-size: 25rpx;
    line-height: 1.8;
    color: var(--text-secondary);
}

.editor-panel {
    padding: 24rpx 0;
    margin-bottom: 18rpx;
    border-bottom: 1rpx solid var(--panel-border);
}

.panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;

    & > view:first-child {
        flex: 1;
        min-width: 0;
    }
}

.filter-toggle {
    display: flex;
    align-items: center;
    gap: 12rpx;
    flex-shrink: 0;

    &__label {
        font-size: 22rpx;
        color: var(--text-secondary);
        white-space: nowrap;
    }
}

.switch {
    width: 88rpx;
    height: 52rpx;
    border-radius: 26rpx;
    background: var(--panel-border);
    position: relative;
    transition: background-color 0.2s ease;
    flex-shrink: 0;
}

.switch.on {
    background: #28b389;
}

.switch-dot {
    position: absolute;
    top: 6rpx;
    left: 6rpx;
    width: 40rpx;
    height: 40rpx;
    border-radius: 20rpx;
    background: var(--page-background-secondary);
    transition: left 0.2s ease;
}

.switch.on .switch-dot {
    left: 42rpx;
}

.panel-title {
    font-size: 28rpx;
    font-weight: 700;
    color: var(--text-primary);
}

.panel-subtitle {
    margin-top: 6rpx;
    font-size: 22rpx;
    color: var(--text-tertiary);
}

.mini-btn {
    height: 60rpx;
    padding: 0 24rpx;
    border-radius: 999rpx;
    border: 1rpx solid var(--panel-border);
    background: var(--page-background-secondary);
    color: var(--text-primary);
    font-size: 22rpx;
    font-weight: 600;
}

.mini-btn::after {
    border: none;
}

.chip-scroll,
.image-scroll {
    white-space: nowrap;
}

.chip-row,
.image-row {
    display: flex;
    gap: 14rpx;
}

.chip-row {
    justify-content: left;
    padding-top: 18rpx;
}

.chip {
    flex-shrink: 0;
    min-height: 64rpx;
    padding: 0 24rpx;
    border-radius: 999rpx;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
    font-weight: 600;
    color: var(--text-primary);
    background: var(--page-background-secondary);
    border: 1rpx solid var(--panel-border);
}

.chip.active {
    color: var(--page-background);
    background: var(--text-primary);
    border-color: var(--text-primary);
    box-shadow: 0 14rpx 30rpx var(--shadow-color);
}

.theme-dark .chip.active {
    color: #162033;
    background: #fff;
    border-color: #fff;
}

.editor-loading,
.editor-empty {
    min-height: 360rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    font-size: 24rpx;
}

.image-row {
    padding-top: 20rpx;
}

.image-card {
    width: 280rpx;
    flex-shrink: 0;
    // padding: 10rpx;
    border-radius: 20rpx;
    background: var(--page-background-secondary);
    border: 2rpx solid var(--panel-border);
}

.image-card.active {
    border-color: #28b389;
}

.image-card--loading {
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
}

.image-card__thumb {
    width: 100%;
    height: 480rpx;
    border-radius: 18rpx;
}

.image-card__meta {
    padding: 12rpx 8rpx 6rpx;
}

.image-card__id {
    font-size: 22rpx;
    color: var(--text-primary);
    font-weight: 700;
}

.image-card__score {
    margin-top: 4rpx;
    font-size: 20rpx;
    color: var(--text-secondary);
}

.preview-switch-wrap {
    display: flex;
    justify-content: center;
}

.preview-switch {
    margin-top: 18rpx;
    display: inline-flex;
    padding: 6rpx;
    border-radius: 999rpx;
    background: var(--page-background-secondary);
    border: 1rpx solid var(--panel-border);
    gap: 6rpx;
}

.preview-switch__item {
    min-width: 180rpx;
    height: 64rpx;
    padding: 0 20rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    font-size: 23rpx;
    font-weight: 600;
}

.preview-switch__item.active {
    background: var(--text-primary);
    color: var(--page-background);
    border: 1rpx solid var(--text-primary);
    box-shadow: 0 14rpx 30rpx var(--shadow-color);
}

.preview-grid {
    margin-top: 22rpx;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 160rpx;
    gap: 16rpx;

    // 7 个为一组循环：第 3、5 个跨 2 行
    .preview-grid__item:nth-child(7n + 3),
    .preview-grid__item:nth-child(7n + 5) {
        grid-row: span 2;
    }

    // 7 个为一组循环：第 7 个跨 2 列（占满整行）
    .preview-grid__item:nth-child(7n) {
        grid-column: 1 / -1;
    }

    // 最后一个元素如果是该组的第 1、3、5 个（左列），占满整行，取消跨行
    .preview-grid__item:last-child:nth-child(7n + 1),
    .preview-grid__item:last-child:nth-child(7n + 3),
    .preview-grid__item:last-child:nth-child(7n + 5) {
        grid-column: 1 / -1;
        grid-row: auto;
    }

    // 倒数第 2 个元素如果是跨 2 行的位置，取消跨行
    .preview-grid__item:nth-last-child(2):nth-child(7n + 3),
    .preview-grid__item:nth-last-child(2):nth-child(7n + 5) {
        grid-row: auto;
    }
}

.preview-grid__item {
    position: relative;
    border-radius: 18rpx;
    overflow: hidden;
}

.preview-grid__image {
    width: 100%;
    height: 100%;
}

.preview-grid__mask {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 18rpx;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.72) 100%);
}

.preview-grid__name {
    color: #fff;
    font-size: 26rpx;
    font-weight: 700;
}

.preview-time {
    margin-top: 22rpx;
    display: flex;
    flex-direction: column;
    gap: 14rpx;
}

.preview-time__item {
    padding: 14rpx;
    border-radius: 18rpx;
    background: var(--page-background-secondary);
    border: 1rpx solid var(--panel-border);
    display: flex;
    align-items: center;
    gap: 16rpx;
}

.preview-time__thumb {
    width: 140rpx;
    height: 94rpx;
    border-radius: 16rpx;
    flex-shrink: 0;
}

.preview-time__body {
    flex: 1;
    min-width: 0;
}

.preview-time__name {
    font-size: 26rpx;
    font-weight: 700;
    color: var(--text-primary);
}

.preview-time__desc {
    margin-top: 8rpx;
    font-size: 22rpx;
    color: var(--text-secondary);
}

.save-bar {
    margin-top: 18rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
}

.save-bar__info {
    flex: 1;
}

.save-bar__label {
    font-size: 22rpx;
    color: var(--text-secondary);
}

.save-bar__value {
    margin-top: 6rpx;
    font-size: 24rpx;
    color: var(--text-primary);
    font-weight: 600;
}

.save-btn {
    min-width: 220rpx;
    height: 76rpx;
    border-radius: 999rpx;
    border: 1rpx solid var(--text-primary);
    background: var(--text-primary);
    color: var(--page-background);
    font-size: 26rpx;
    font-weight: 700;
    box-shadow: 0 14rpx 30rpx var(--shadow-color);
}

.save-btn[disabled] {
    opacity: 0.45;
    border: 1rpx solid var(--text-tertiary);
}

.save-btn::after {
    border: none;
}
</style>
