<template>
    <view class="layout">
        <page-header :title="$t('user.profile.myDownload')"></page-header>

        <view class="content-wrapper">
            <empty-state
                v-if="downloadList.length === 0 && !isRunning"
                icon-path="/static/icons/download.svg"
                :title="$t('download.empty')"
                :action-text="$t('download.goBrowse')"
                @action="goBrowse"
            ></empty-state>

            <view v-else>
                <pics-view :classList="downloadList"></pics-view>

                <view class="loadingLayout" v-show="noData || isRunning">
                    <uni-load-more :status="noData ? 'noMore' : 'loading'"></uni-load-more>
                </view>
            </view>

            <back-to-top ref="backToTopRef"></back-to-top>

            <view class="safe-area-inset-bottom"></view>
        </view>
    </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad, onUnload, onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app';
import { apiGetActions } from '@/api/wallpaper.js';
import { handlePicUrl } from '@/utils/common.js';

const backToTopRef = ref(null);
const isRunning = ref(false);
const noData = ref(false);
const downloadList = ref([]);

const queryParams = ref({
    pageNum: 1,
    pageSize: 12,
    action_type: 'download',
});

const getDownloadList = async () => {
    try {
        if (queryParams.value.pageNum === 1) {
            uni.showLoading();
        }
        isRunning.value = true;

        let res = await apiGetActions(queryParams.value);
        let fullData = res.data.map((item) => handlePicUrl(item));

        if (queryParams.value.pageNum === 1) {
            downloadList.value = fullData;
        } else {
            downloadList.value.push(...fullData);
        }

        if (queryParams.value.pageNum >= res.pagination.total_pages) noData.value = true;

        uni.setStorageSync('wallList', downloadList.value);
    } finally {
        uni.hideLoading();
        isRunning.value = false;
    }
};

const goBrowse = () => {
    uni.switchTab({
        url: '/pages/app/index',
    });
};

const init = () => {
    queryParams.value = {
        pageNum: 1,
        pageSize: 12,
        action_type: 'download',
    };
    noData.value = false;
    downloadList.value = [];
};

onLoad(() => {
    getDownloadList();
});

onUnload(() => {
    uni.removeStorageSync('wallList');
});

onReachBottom(() => {
    if (noData.value || isRunning.value) return;
    queryParams.value.pageNum++;
    getDownloadList();
});

onPullDownRefresh(() => {
    init();
    getDownloadList().finally(() => {
        uni.stopPullDownRefresh();
    });
});
</script>

<style lang="scss" scoped>
.layout {
    background: linear-gradient(180deg, #f8fafc 0%, #f2f6fb 100%);
    min-height: 100vh;

    .content-wrapper {
        padding-top: 20rpx;
    }

    .loadingLayout {
        padding: 30rpx 0;
    }

    .safe-area-inset-bottom {
        height: constant(safe-area-inset-bottom);
        height: env(safe-area-inset-bottom);
    }
}
</style>
