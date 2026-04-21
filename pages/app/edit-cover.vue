<template>
    <view class="edit-cover-page">
        <menu-bar>
            <template #title>Cover Editor</template>
        </menu-bar>

        <scroll-view scroll-y class="edit-cover-scroll">
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

                    <scroll-view v-else scroll-x class="image-scroll">
                        <view class="image-row">
                            <view
                                v-for="item in classifyImages"
                                :key="item.id"
                                class="image-card"
                                :class="{ active: draftCoverUrl === item.picurl }"
                                @click="selectCover(item)"
                            >
                                <image
                                    class="image-card__thumb"
                                    :src="item.smallPicurl || item.picurl"
                                    mode="aspectFill"
                                ></image>
                                <view class="image-card__meta">
                                    <view class="image-card__id">#{{ item.id }}</view>
                                    <view class="image-card__score">评分 {{ item.score ?? '--' }}</view>
                                </view>
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
                    </view>

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

                    <view v-if="previewMode === 'grid'" class="preview-grid">
                        <view
                            v-for="(item, idx) in classifyPreviewList"
                            :key="item.id"
                            class="preview-grid__item"
                            :style="getPreviewGridStyle(idx)"
                        >
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
        </scroll-view>
    </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { apiGetClassList, apiGetClassify, apiPostClassifyPicUrl } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import { PICS_BASE_URL } from '@/common/config.js';

const classifyList = ref([]);
const selectedClassifyId = ref(null);
const classifyImages = ref([]);
const draftCoverUrl = ref('');
const originalCoverUrl = ref('');
const previewMode = ref('grid');
const imageLoading = ref(false);
const saving = ref(false);

const classifyComputed = computed(() =>
    classifyList.value.map((item) => ({
        ...item,
        name: uni.getLocale() === 'en' ? item.name_en : item.name,
    })),
);

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

const getClassifyImages = async (classifyId) => {
    imageLoading.value = true;
    try {
        const res = await apiGetClassList({
            classify_id: classifyId,
            classify_enable: false,
            pageSize: 30,
        });
        classifyImages.value = (res.data || []).map((item) => handlePicUrl(item));
    } catch (error) {
        classifyImages.value = [];
    } finally {
        imageLoading.value = false;
    }
};

const selectClassify = async (classifyId) => {
    if (selectedClassifyId.value === classifyId && classifyImages.value.length) return;
    selectedClassifyId.value = classifyId;
    const current = classifyList.value.find((item) => item.id === classifyId);
    originalCoverUrl.value = current?.picurl || '';
    draftCoverUrl.value = current?.picurl || '';
    await getClassifyImages(classifyId);
};

const reloadImages = async () => {
    if (!selectedClassifyId.value) return;
    await getClassifyImages(selectedClassifyId.value);
};

const selectCover = (item) => {
    draftCoverUrl.value = item.picurl;
};

const getPreviewCover = (item) => {
    if (item.id === selectedClassifyId.value && draftCoverUrl.value) {
        return draftCoverUrl.value;
    }
    return item.picurl;
};

const getPreviewGridStyle = (idx) => {
    if (idx === 0) return { gridColumn: '1', gridRow: '1' };
    if (idx === 1) return { gridColumn: '2', gridRow: '1' };
    if (idx === 2) return { gridColumn: '1', gridRow: '2 / span 2' };
    if (idx === 3) return { gridColumn: '2', gridRow: '2' };
    if (idx === 4) return { gridColumn: '2', gridRow: '3' };
    if (idx === 5) return { gridColumn: '1 / -1', gridRow: '4' };
    if (idx === 6) return { gridColumn: '1', gridRow: '5' };
    if (idx === 7) return { gridColumn: '2', gridRow: '5' };
    return {};
};

const saveCover = async () => {
    if (!selectedClassify.value || !draftChanged.value || saving.value) return;
    saving.value = true;
    try {
        const picurl = draftCoverUrl.value.replace(PICS_BASE_URL + '/', '');
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
    background: #f6f8fb;
}

.edit-cover-scroll {
    height: calc(100vh - 1rpx);
}

.edit-cover-wrap {
    padding: 20rpx 24rpx 40rpx;
}

.editor-intro {
    padding: 10rpx 4rpx 28rpx;
    margin-bottom: 18rpx;
    border-bottom: 1rpx solid #e5eaf2;
}

.editor-intro__title {
    font-size: 34rpx;
    font-weight: 700;
    color: #162033;
}

.editor-intro__desc {
    margin-top: 12rpx;
    font-size: 25rpx;
    line-height: 1.8;
    color: #6e7d96;
}

.editor-panel {
    padding: 24rpx 0 28rpx;
    margin-bottom: 18rpx;
    border-bottom: 1rpx solid #e5eaf2;
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

.panel-title {
    font-size: 28rpx;
    font-weight: 700;
    color: #162033;
}

.panel-subtitle {
    margin-top: 6rpx;
    font-size: 22rpx;
    color: #8090aa;
}

.mini-btn {
    height: 60rpx;
    padding: 0 24rpx;
    border-radius: 999rpx;
    border: none;
    background: rgba(40, 179, 137, 0.08);
    color: #179d76;
    font-size: 22rpx;
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
    padding-top: 18rpx;
}

.chip {
    flex-shrink: 0;
    height: 64rpx;
    padding: 0 24rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #eef3f8;
    color: #53627a;
    font-size: 24rpx;
    font-weight: 600;
}

.chip.active {
    background: linear-gradient(135deg, #28b389, #179d76);
    color: #fff;
}

.editor-loading,
.editor-empty {
    min-height: 220rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #8b97ac;
    font-size: 24rpx;
}

.image-row {
    padding-top: 20rpx;
}

.image-card {
    width: 220rpx;
    flex-shrink: 0;
    padding: 10rpx;
    border-radius: 20rpx;
    background: #f3f6fa;
    border: 2rpx solid #edf1f6;
}

.image-card.active {
    border-color: #28b389;
}

.image-card__thumb {
    width: 100%;
    height: 280rpx;
    border-radius: 18rpx;
}

.image-card__meta {
    padding: 12rpx 8rpx 6rpx;
}

.image-card__id {
    font-size: 22rpx;
    color: #18202a;
    font-weight: 700;
}

.image-card__score {
    margin-top: 4rpx;
    font-size: 20rpx;
    color: #7f8ca4;
}

.preview-switch {
    margin-top: 18rpx;
    display: inline-flex;
    padding: 8rpx;
    border-radius: 999rpx;
    background: #eef3f8;
    gap: 8rpx;
}

.preview-switch__item {
    min-width: 180rpx;
    height: 64rpx;
    padding: 0 20rpx;
    border-radius: 999rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #607089;
    font-size: 23rpx;
    font-weight: 700;
}

.preview-switch__item.active {
    background: #fff;
    color: #18202a;
    border: 1rpx solid #e7ebf2;
}

.preview-grid {
    margin-top: 22rpx;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: 160rpx;
    gap: 16rpx;
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
    background: #f3f6fa;
    border: 1rpx solid #edf1f6;
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
    color: #162033;
}

.preview-time__desc {
    margin-top: 8rpx;
    font-size: 22rpx;
    color: #7f8ca4;
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
    color: #7f8ca4;
}

.save-bar__value {
    margin-top: 6rpx;
    font-size: 24rpx;
    color: #162033;
    font-weight: 600;
}

.save-btn {
    min-width: 220rpx;
    height: 76rpx;
    border-radius: 999rpx;
    border: none;
    background: #28b389;
    color: #fff;
    font-size: 26rpx;
    font-weight: 700;
}

.save-btn[disabled] {
    opacity: 0.45;
}

.save-btn::after {
    border: none;
}
</style>
