<template>
    <view class="avatar-tab" :class="[settingsStore.isDark ? 'theme-dark' : 'theme-light', { 'is-embedded': embedded }]">
        <scroll-view scroll-y class="avatar-scroll" :style="{ height: scrollHeight }" @scroll="handleScroll"
            @scrolltolower="onLoadMore" show-scrollbar="false">
            <!-- 嵌入模式下的顶部避让占位 -->
            <view v-if="embedded" :style="{ height: navBarHeight + 'px' }"></view>

            <view class="avatar-wrap">
                <!-- 顶部控制条：分类小标签与圆/方形态切换器 -->
                <view class="avatar-toolbar">
                    <scroll-view scroll-x class="avatar-categories" show-scrollbar="false">
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

                    <!-- 形态切换器（圆/方） -->
                    <view class="shape-toggle" @click="toggleShape">
                        <view class="shape-toggle__inner" :class="{ 'is-circle': avatarShape === 'circle' }">
                            <view class="shape-icon square-icon" :class="{ 'is-active': avatarShape === 'square' }">
                                <view class="icon-square"></view>
                            </view>
                            <view class="shape-icon circle-icon" :class="{ 'is-active': avatarShape === 'circle' }">
                                <view class="icon-circle"></view>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- 骨架屏加载态 -->
                <view v-if="isLoading && avatarList.length === 0" class="avatar-skeleton-grid">
                    <view v-for="i in 12" :key="i" class="skeleton-avatar-item"
                        :class="{ 'is-circle': avatarShape === 'circle' }"></view>
                </view>

                <!-- 空状态展示 -->
                <empty-state v-else-if="!isLoading && avatarList.length === 0" icon-path="/static/icons/account-circle.svg"
                    :title="t('avatar.empty')" :description="t('common.noResult')" />

                <!-- 3 列 1:1 头像网格 -->
                <view v-else class="avatar-grid" :class="{ 'shape-circle': avatarShape === 'circle' }">
                    <view v-for="(item, index) in avatarList" :key="item.id + '-' + index" class="avatar-card"
                        :class="{ 'is-circle': avatarShape === 'circle' }" @click="openPreview(item, index)">
                        <image class="avatar-img" :src="item.smallPicurl || item.picurl" mode="aspectFill" lazy-load
                            @load="item.loaded = true" :class="{ 'is-loaded': item.loaded }"></image>
                    </view>
                </view>

                <!-- 底部加载更多 / 结束提示 -->
                <view class="list-footer" v-if="avatarList.length > 0">
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
const avatarShape = ref('square'); // 'square' | 'circle'
const categoryList = ref([]);
const avatarList = ref([]);
const isLoading = ref(false);
const noMoreData = ref(false);
const pageNum = ref(1);
const pageSize = 18;

onMounted(() => {
    fetchCategories();
    fetchAvatars(true);
});

// 获取头像专属分类列表 (classify_type = 4)
const fetchCategories = async () => {
    try {
        const res = await apiGetClassify({ classify_type: 4, enable: true });
        if (res?.data && Array.isArray(res.data)) {
            categoryList.value = res.data;
        }
    } catch (e) {
        console.error('Failed to fetch avatar categories', e);
    }
};

// 获取头像壁纸列表
const fetchAvatars = async (isRefresh = false) => {
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
            classify_type: 4,
        };
        if (activeClassifyId.value > 0) {
            params.classify_id = activeClassifyId.value;
        }

        const res = await apiGetClassList(params);
        const rows = Array.isArray(res?.data) ? res.data : [];
        const formatted = rows.map((item) => ({
            ...handlePicUrl(item),
            loaded: false,
            classify_type: 4,
        }));

        if (isRefresh || pageNum.value === 1) {
            avatarList.value = formatted;
        } else {
            avatarList.value.push(...formatted);
        }

        if (rows.length < pageSize) {
            noMoreData.value = true;
        } else {
            pageNum.value++;
        }
    } catch (e) {
        console.error('Failed to fetch avatars', e);
    } finally {
        isLoading.value = false;
    }
};

const selectCategory = (id) => {
    if (activeClassifyId.value === id) return;
    activeClassifyId.value = id;
    fetchAvatars(true);
};

const toggleShape = () => {
    avatarShape.value = avatarShape.value === 'square' ? 'circle' : 'square';
    try {
        uni.vibrateShort?.();
    } catch (e) { }
};

const onLoadMore = () => {
    if (!isLoading.value && !noMoreData.value) {
        fetchAvatars(false);
    }
};

const handleScroll = (e) => {
    emit('scroll', e);
};

// 进入预览页
const openPreview = (item, index) => {
    // 缓存当前头像列表，供预览页左右滑动翻页
    uni.setStorageSync('previewList', avatarList.value);
    uni.setStorageSync('classList', avatarList.value);
    uni.navigateTo({
        url: `/pages/app/preview?id=${item.id}&classify_type=4&index=${index}`,
    });
};
</script>

<style lang="scss" scoped>
.avatar-tab {
    width: 100%;
    min-height: 100vh;
    background: var(--page-background, #f8fafc);

    &.theme-dark {
        background: var(--page-background, #0f172a);
    }
}

.avatar-scroll {
    width: 100%;
    box-sizing: border-box;
}

.avatar-wrap {
    padding: 16rpx 24rpx 140rpx;
    box-sizing: border-box;
}

.avatar-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    margin-bottom: 24rpx;
}

.avatar-categories {
    flex: 1;
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

.shape-toggle {
    flex-shrink: 0;
    padding: 6rpx;
    border-radius: 32rpx;
    background: #e2e8f0;
    cursor: pointer;

    .theme-dark & {
        background: #334155;
    }

    .shape-toggle__inner {
        position: relative;
        width: 108rpx;
        height: 52rpx;
        border-radius: 26rpx;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 6rpx;
        box-sizing: border-box;

        &::before {
            content: '';
            position: absolute;
            top: 4rpx;
            left: 4rpx;
            width: 44rpx;
            height: 44rpx;
            border-radius: 22rpx;
            background: #ffffff;
            box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
            transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);

            .theme-dark & {
                background: #1e293b;
            }
        }

        &.is-circle::before {
            transform: translateX(56rpx);
        }
    }

    .shape-icon {
        width: 44rpx;
        height: 44rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;

        .icon-square {
            width: 22rpx;
            height: 22rpx;
            border-radius: 6rpx;
            background: #64748b;

            .theme-dark & {
                background: #94a3b8;
            }
        }

        .icon-circle {
            width: 24rpx;
            height: 24rpx;
            border-radius: 50%;
            background: #64748b;

            .theme-dark & {
                background: #94a3b8;
            }
        }

        &.is-active {
            .icon-square,
            .icon-circle {
                background: #4f46e5;

                .theme-dark & {
                    background: #818cf8;
                }
            }
        }
    }
}

.avatar-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16rpx;
    width: 100%;
}

.avatar-card {
    position: relative;
    width: 100%;
    padding-bottom: 100%; // 1:1 正方形比例容器
    border-radius: 24rpx;
    overflow: hidden;
    background: #f1f5f9;
    box-shadow: 0 4rpx 14rpx rgba(0, 0, 0, 0.04);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;

    .theme-dark & {
        background: #1e293b;
    }

    &:active {
        transform: scale(0.96);
    }

    &.is-circle {
        border-radius: 50%;
    }

    .avatar-img {
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
}

.avatar-skeleton-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16rpx;
    width: 100%;

    .skeleton-avatar-item {
        width: 100%;
        padding-bottom: 100%;
        border-radius: 24rpx;
        background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 37%, #f1f5f9 63%);
        background-size: 400% 100%;
        animation: shimmer 1.4s ease infinite;

        .theme-dark & {
            background: linear-gradient(90deg, #1e293b 25%, #334155 37%, #1e293b 63%);
            background-size: 400% 100%;
        }

        &.is-circle {
            border-radius: 50%;
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
