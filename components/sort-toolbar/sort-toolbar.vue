<template>
    <view class="sort-toolbar" :class="[`is-${theme}`]">
        <scroll-view scroll-x class="sort-toolbar__chips" show-scrollbar="false">
            <view class="sort-toolbar__chips-inner">
                <view
                    v-for="item in chips"
                    :key="item.key"
                    class="sort-toolbar__chip"
                    :class="{ 'is-active': activeKey === item.key }"
                    @click="emit('query', item.key)"
                >
                    <text>{{ item.label }}</text>
                    <uni-icons
                        v-if="item.key === 'date' && activeKey === 'date'"
                        :type="dateAsc ? 'arrow-up' : 'arrow-down'"
                        size="13"
                        :color="theme === 'dark' ? '#dce8ff' : '#475569'"
                    ></uni-icons>
                </view>
            </view>
        </scroll-view>

        <view v-if="showLayoutActions" class="sort-toolbar__actions">
            <view class="sort-toolbar__action" @click="emit('toggle-column')">
                <image
                    class="sort-toolbar__action-icon"
                    v-if="column === 3"
                    src="/static/icons/numeric-3-box.svg"
                    mode="aspectFit"
                ></image>
                <image class="sort-toolbar__action-icon" v-else src="/static/icons/numeric-2-box.svg" mode="aspectFit"></image>
            </view>
            <view class="sort-toolbar__action" @click="emit('toggle-view')">
                <image
                    class="sort-toolbar__action-icon"
                    v-if="view === 'window'"
                    src="/static/icons/view-grid.svg"
                    mode="aspectFit"
                ></image>
                <image class="sort-toolbar__action-icon" v-else src="/static/icons/view-dashboard.svg" mode="aspectFit"></image>
            </view>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
    theme: {
        type: String,
        default: 'dark',
    },
    activeKey: {
        type: String,
        default: '',
    },
    dateAsc: {
        type: Boolean,
        default: false,
    },
    showLayoutActions: {
        type: Boolean,
        default: true,
    },
    column: {
        type: Number,
        default: 3,
    },
    view: {
        type: String,
        default: 'window',
    },
});

const emit = defineEmits(['query', 'toggle-column', 'toggle-view']);
const { t } = useI18n();

const chips = computed(() => [
    { key: 'recommend', label: t('common.recommend') },
    { key: 'score', label: t('common.score') },
    { key: 'views', label: t('common.views') },
    { key: 'downloads', label: t('common.downloads') },
    { key: 'date', label: props.activeKey === 'date' ? (props.dateAsc ? t('common.oldest') : t('common.latest')) : t('common.latest') },
]);
</script>

<style lang="scss" scoped>
.sort-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
}

.sort-toolbar__chips {
    flex: 1;
    white-space: nowrap;
}

.sort-toolbar__chips-inner {
    display: inline-flex;
    align-items: center;
    gap: 14rpx;
    padding-right: 16rpx;
}

.sort-toolbar__chip {
    min-height: 68rpx;
    padding: 0 26rpx;
    border-radius: 999rpx;
    display: inline-flex;
    align-items: center;
    gap: 8rpx;
    font-size: 24rpx;
    font-weight: 600;
}

.sort-toolbar__actions {
    display: flex;
    align-items: center;
    gap: 12rpx;
    flex-shrink: 0;
}

.sort-toolbar__action {
    width: 64rpx;
    height: 64rpx;
    border-radius: 18rpx;
    display: flex;
    align-items: center;
    justify-content: center;
}

.sort-toolbar__action-icon {
    width: 38rpx;
    height: 38rpx;
}

.sort-toolbar.is-dark {
    .sort-toolbar__chip {
        color: #c2cfdf;
        background: rgba(32, 40, 52, 0.92);
        border: 1rpx solid rgba(255, 255, 255, 0.05);
    }

    .sort-toolbar__chip.is-active {
        color: #f8fbff;
        background: #619aef;
        border-color: rgba(97, 154, 239, 0.24);
        box-shadow: 0 14rpx 30rpx rgba(97, 154, 239, 0.24);
    }

    .sort-toolbar__action {
        background: rgba(41, 52, 68, 0.96);
        border: 1rpx solid rgba(255, 255, 255, 0.08);
    }

    .sort-toolbar__action-icon {
        filter: brightness(0) saturate(100%) invert(94%) sepia(10%) saturate(473%) hue-rotate(183deg) brightness(103%)
            contrast(101%);
    }
}

.sort-toolbar.is-light {
    .sort-toolbar__chip {
        color: #475569;
        background: rgba(255, 255, 255, 0.92);
        border: 1rpx solid rgba(15, 23, 42, 0.08);
        box-shadow: 0 8rpx 18rpx rgba(148, 163, 184, 0.1);
    }

    .sort-toolbar__chip.is-active {
        color: #fff;
        background: #18202a;
        border-color: rgba(24, 32, 42, 0.2);
        box-shadow: 0 14rpx 30rpx rgba(24, 32, 42, 0.18);
    }

    .sort-toolbar__action {
        background: rgba(255, 255, 255, 0.92);
        border: 1rpx solid rgba(15, 23, 42, 0.08);
        box-shadow: 0 8rpx 18rpx rgba(148, 163, 184, 0.1);
    }

    .sort-toolbar__action-icon {
        filter: brightness(0) saturate(100%) invert(28%) sepia(15%) saturate(814%) hue-rotate(177deg) brightness(95%)
            contrast(90%);
    }
}
</style>
