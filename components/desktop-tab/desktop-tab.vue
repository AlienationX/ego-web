<template>
    <view class="desktop-tab" :class="[settingsStore.isDark ? 'theme-dark' : 'theme-light', { 'is-embedded': embedded }]">
        <scroll-view scroll-y class="desktop-scroll" :style="{ height: scrollHeight }" @scroll="handleScroll"
            @scrolltolower="onLoadMore" show-scrollbar="false">
            <!-- 嵌入模式下的顶部避让占位 -->
            <view v-if="embedded" :style="{ height: navBarHeight + 'px' }"></view>

            <view class="desktop-wrap">
                <!-- 顶部控制条：横屏分类小标签 -->
                <view class="desktop-toolbar">
                    <scroll-view scroll-x class="desktop-categories" show-scrollbar="false">
                        <view class="categories-inner">
                            <view class="category-pill" :class="{ 'is-active': activeClassifyId === 0 }"
                                @click="selectCategory(0)">
                                <text>{{ t('common.recommend') }}</text>
                            </view>
                            <view v-for="cat in categoryList" :key="cat.id" class="category-pill"
                                :class="{ 'is-active': activeClassifyId === cat.id }" @click="selectCategory(cat.id)">
                                <text>{{ cat.name }}</text>
                            </view>
                        </view>
                    </scroll-view>
                </view>

                <!-- 骨架屏加载态 -->
                <view v-if="isLoading && desktopList.length === 0" class="desktop-skeleton-list">
                    <view v-for="i in 4" :key="i" class="skeleton-desktop-card"></view>
                </view>

                <!-- 空状态展示 -->
                <empty-state v-else-if="!isLoading && desktopList.length === 0" icon-path="/static/icons/monitor.svg"
                    :title="t('desktop.empty')" :description="t('common.noResult')" />

                <!-- 16:9 宽屏大卡片流 -->
                <view v-else class="desktop-cards">
                    <view v-for="(item, index) in desktopList" :key="item.id + '-' + index" class="desktop-card"
                        @click="openPreview(item, index)">
                        <view class="desktop-cover-box">
                            <image class="desktop-img" :src="item.smallPicurl || item.picurl" mode="aspectFill" lazy-load
                                @load="item.loaded = true" :class="{ 'is-loaded': item.loaded }"></image>

                            <!-- 4K / 8K 分辨率角标 -->
                            <view class="resolution-badge">
                                <text class="res-tag">{{ (item.width && item.width >= 5000) ? t('desktop.resolution8k') : t('desktop.resolution4k') }}</text>
                            </view>

                            <!-- 宽屏长宽比微标签 -->
                            <view class="aspect-badge">
                                <mdi-icon path="/static/icons/aspect-ratio.svg" size="12px" color="#ffffff"></mdi-icon>
                                <text class="aspect-text">16:9 桌面</text>
                            </view>
                        </view>

                        <view class="desktop-meta" v-if="item.title || item.name || item.description">
                            <text class="desktop-title">{{ item.title || item.name || item.description }}</text>
                            <view class="desktop-info-row">
                                <text class="desktop-views" v-if="item.views">{{ item.views }} 次浏览</text>
                                <view class="mac-win-icons">
                                    <mdi-icon path="/static/icons/brands/apple.svg" size="14px"
                                        :color="settingsStore.isDark ? '#94a3b8' : '#64748b'"></mdi-icon>
                                    <mdi-icon path="/static/icons/brands/microsoft-windows.svg" size="14px"
                                        :color="settingsStore.isDark ? '#94a3b8' : '#64748b'"></mdi-icon>
                                </view>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- 底部加载更多 / 结束提示 -->
                <view class="list-footer" v-if="desktopList.length > 0">
                    <view class="loading-more" v-if="isLoading">
                        <uni-icons type="spinner-cycle" size="18"
                            :color="settingsStore.isDark ? '#9ca3af' : '#64748b'"></uni-icons>
                        <text class="footer-text">{{ t('common.loading') }}</text>
                    </view>
                    <text class="no-more-text" v-else-if="noMoreData">{{ t('common.noMore') }}</text>
                </view>
            </view>
        </scroll-view>
    </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { apiGetClassList, apiGetClassify } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';
import EmptyState from '@/components/empty-state/empty-state.vue';

const props = defineProps({
    embedded: {
        type: Boolean,
        default: false,
    },
    navBarHeight: {
        type: Number,
        default: 0,
    },
});

const emit = defineEmits(['scroll']);

const { t } = useI18n();
const settingsStore = useSettingsStore();

const scrollHeight = computed(() => (props.embedded ? '100vh' : 'calc(100vh - 50px)'));

// 状态管理
const activeClassifyId = ref(0);
const categoryList = ref([]);
const desktopList = ref([]);
const isLoading = ref(false);
const noMoreData = ref(false);
const pageNum = ref(1);
const pageSize = 12;

onMounted(() => {
    fetchCategories();
    fetchDesktopWalls(true);
});

// 获取电脑壁纸分类列表 (classify_type = 2)
const fetchCategories = async () => {
    try {
        const res = await apiGetClassify({ classify_type: 2, enable: true });
        if (res?.data && Array.isArray(res.data)) {
            categoryList.value = res.data;
        }
    } catch (e) {
        console.error('Failed to fetch desktop categories', e);
    }
};

// 获取电脑横屏壁纸列表
const fetchDesktopWalls = async (isRefresh = false) => {
    if (isLoading.value) return;
    if (!isRefresh && noMoreData.value) return;

    if (isRefresh) {
        pageNum.value = 1;
        noMoreData.value = false;
    }

    isLoading.value = true;
    try {
        const params = {
            pageNum: pageNum.value,
            pageSize,
            classify_type: 2,
        };
        if (activeClassifyId.value > 0) {
            params.classify_id = activeClassifyId.value;
        }

        const res = await apiGetClassList(params);
        const rows = Array.isArray(res?.data) ? res.data : [];
        const formatted = rows.map((item) => ({
            ...handlePicUrl(item),
            loaded: false,
            classify_type: 2,
        }));

        if (isRefresh || pageNum.value === 1) {
            desktopList.value = formatted;
        } else {
            desktopList.value.push(...formatted);
        }

        if (rows.length < pageSize) {
            noMoreData.value = true;
        } else {
            pageNum.value++;
        }
    } catch (e) {
        console.error('Failed to fetch desktop walls', e);
    } finally {
        isLoading.value = false;
    }
};

const selectCategory = (id) => {
    if (activeClassifyId.value === id) return;
    activeClassifyId.value = id;
    fetchDesktopWalls(true);
};

const onLoadMore = () => {
    if (!isLoading.value && !noMoreData.value) {
        fetchDesktopWalls(false);
    }
};

const handleScroll = (e) => {
    emit('scroll', e);
};

// 进入预览页
const openPreview = (item, index) => {
    uni.setStorageSync('previewList', desktopList.value);
    uni.setStorageSync('classList', desktopList.value);
    uni.navigateTo({
        url: `/pages/app/preview?id=${item.id}&classify_type=2&index=${index}`,
    });
};
</script>

<style lang="scss" scoped>
.desktop-tab {
    width: 100%;
    min-height: 100vh;
    background: var(--page-background, #f8fafc);

    &.theme-dark {
        background: var(--page-background, #0f172a);
    }
}

.desktop-scroll {
    width: 100%;
    box-sizing: border-box;
}

.desktop-wrap {
    padding: 16rpx 24rpx 140rpx;
    box-sizing: border-box;
}

.desktop-toolbar {
    margin-bottom: 24rpx;
}

.desktop-categories {
    width: 100%;
    white-space: nowrap;
    overflow: hidden;

    .categories-inner {
        display: inline-flex;
        align-items: center;
        gap: 12rpx;
    }

    .category-pill {
        padding: 10rpx 24rpx;
        border-radius: 30rpx;
        background: #f1f5f9;
        font-size: 24rpx;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s ease;

        .theme-dark & {
            background: #1e293b;
            color: #94a3b8;
        }

        &.is-active {
            background: #4f46e5;
            color: #ffffff;
            box-shadow: 0 4rpx 12rpx rgba(79, 70, 229, 0.25);

            .theme-dark & {
                background: #6366f1;
                color: #ffffff;
            }
        }
    }
}

.desktop-cards {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

.desktop-card {
    border-radius: 28rpx;
    background: #ffffff;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease;

    .theme-dark & {
        background: #1e293b;
        box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.2);
    }

    &:active {
        transform: scale(0.985);
    }

    .desktop-cover-box {
        position: relative;
        width: 100%;
        padding-bottom: 56.25%; // 16:9 比例 (9 / 16 = 56.25%)
        background: #0f172a;
        overflow: hidden;

        .desktop-img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: block;
            opacity: 0;
            transition: opacity 0.3s ease;

            &.is-loaded {
                opacity: 1;
            }
        }

        .resolution-badge {
            position: absolute;
            top: 16rpx;
            left: 16rpx;
            padding: 4rpx 14rpx;
            border-radius: 12rpx;
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(8px);
            border: 1rpx solid rgba(255, 255, 255, 0.2);

            .res-tag {
                font-size: 20rpx;
                font-weight: 800;
                color: #38bdf8;
                letter-spacing: 0.5rpx;
            }
        }

        .aspect-badge {
            position: absolute;
            bottom: 16rpx;
            right: 16rpx;
            display: inline-flex;
            align-items: center;
            gap: 6rpx;
            padding: 4rpx 12rpx;
            border-radius: 10rpx;
            background: rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(6px);

            .aspect-text {
                font-size: 18rpx;
                font-weight: 600;
                color: #ffffff;
            }
        }
    }

    .desktop-meta {
        padding: 20rpx 24rpx;
        display: flex;
        flex-direction: column;
        gap: 8rpx;

        .desktop-title {
            font-size: 28rpx;
            font-weight: 700;
            color: #0f172a;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            .theme-dark & {
                color: #f8fafc;
            }
        }

        .desktop-info-row {
            display: flex;
            align-items: center;
            justify-content: space-between;

            .desktop-views {
                font-size: 22rpx;
                color: #94a3b8;
            }

            .mac-win-icons {
                display: flex;
                align-items: center;
                gap: 10rpx;
            }
        }
    }
}

.desktop-skeleton-list {
    display: flex;
    flex-direction: column;
    gap: 24rpx;

    .skeleton-desktop-card {
        width: 100%;
        padding-bottom: 56.25%;
        border-radius: 28rpx;
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%);
        background-size: 400% 100%;
        animation: shimmer 1.4s ease infinite;

        .theme-dark & {
            background: linear-gradient(90deg, #1e293b 25%, #334155 37%, #1e293b 63%);
            background-size: 400% 100%;
        }
    }
}

@keyframes shimmer {
    0% {
        background-position: 100% 50%;
    }

    100% {
        background-position: 0 50%;
    }
}

.list-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 36rpx 0;

    .loading-more {
        display: flex;
        align-items: center;
        gap: 12rpx;
    }

    .footer-text,
    .no-more-text {
        font-size: 24rpx;
        color: #94a3b8;
    }
}
</style>
