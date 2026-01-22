<template>
    <view class="layout">
        <menu-bar>
            <template #title>{{ $t('user.profile.myDownload') }}</template>
        </menu-bar>

        <view class="content-wrapper">
            <view v-if="downloadList.length === 0 && !isRunning" class="empty-state">
                <!-- <image src="/common/images/pics/empty.svg" mode="aspectFit" class="empty-image"></image> -->
                <text class="empty-text">{{ $t('download.empty') }}</text>
                <button class="go-browse-btn" @click="goBrowse">{{ $t('download.goBrowse') }}</button>
            </view>

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
    import { apiGetClassList } from '@/api/wallpaper.js';
    import { handlePicUrl } from '@/utils/common.js';
    import { getNavBarHeight } from '@/utils/system.js';

    const backToTopRef = ref(null);
    const isRunning = ref(false);
    const noData = ref(false);
    const downloadList = ref([]);

    const queryParams = ref({
        pageNum: 1,
        pageSize: 12,
        action_type: 'download'
    });

    const getDownloadList = async () => {
        try {
            if (queryParams.value.pageNum === 1) {
                uni.showLoading();
            }
            isRunning.value = true;

            let res = await apiGetClassList(queryParams.value);
            let fullData = res.data.map((item) => handlePicUrl(item));

            if (queryParams.value.pageNum === 1) {
                downloadList.value = fullData;
            } else {
                downloadList.value.push(...fullData);
            }

            if (queryParams.value.pageSize > res.data.length) noData.value = true;

            uni.setStorageSync('wallList', downloadList.value);
        } finally {
            uni.hideLoading();
            isRunning.value = false;
        }
    };

    const goBrowse = () => {
        uni.switchTab({
            url: '/pages/index/index'
        });
    };

    const init = () => {
        queryParams.value = {
            pageNum: 1,
            pageSize: 12,
            action_type: 'download'
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
        background-color: #f5f5f5;
        min-height: 100vh;

        .content-wrapper {
            padding-top: 20rpx;
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 200rpx 0;

            .empty-image {
                width: 400rpx;
                height: 400rpx;
                margin-bottom: 40rpx;
                opacity: 0.5;
            }

            .empty-text {
                font-size: 32rpx;
                color: #999;
                margin-bottom: 60rpx;
            }

            .go-browse-btn {
                width: 300rpx;
                height: 80rpx;
                background: linear-gradient(135deg, $wp-theme-color 0%, darken($wp-theme-color, 8%) 100%);
                color: #fff;
                font-size: 32rpx;
                border-radius: 40rpx;
                border: none;
                display: flex;
                align-items: center;
                justify-content: center;

                &::after {
                    border: none;
                }

                &:active {
                    transform: scale(0.95);
                    opacity: 0.9;
                }
            }
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
