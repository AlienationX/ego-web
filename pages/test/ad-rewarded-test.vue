<template>
    <view class="page">
        <menu-bar>
            <template #title>Ad Rewarded</template>
        </menu-bar>

        <view class="content">
            <!-- #ifndef MP-WEIXIN -->
            <view class="ad-section">
                <view class="ad-label">ad-rewarded-video 基座广告 (1507000689)</view>
                <ad-rewarded-video
                    ref="adRewardedVideoBase"
                    adpid="1507000689"
                    :url-callback="urlCallback"
                    :preload="false"
                    :loadnext="false"
                    v-slot:default="{ loading, error }"
                    @load="onadloadBase"
                    @close="onadcloseBase"
                    @error="onaderrorBase"
                >
                    <button class="ad-button" :disabled="loading || baseError" :loading="loading" @click="showAdBase">
                        显示基座广告
                    </button>
                </ad-rewarded-video>
                <view class="ad-status">
                    <view v-if="baseLoading" class="status loading">加载中...</view>
                    <view v-else-if="baseError" class="status error">
                        <text class="error-label">错误:</text>
                        <text class="error-code">{{ baseError.code || 'UNKNOWN' }}</text>
                        <text class="error-msg">{{ baseError.message || baseError.errMsg || JSON.stringify(baseError) }}</text>
                    </view>
                    <view v-else-if="baseLoaded" class="status success">已就绪</view>
                </view>
            </view>

            <view class="ad-section">
                <view class="ad-label">ad-rewarded-video 正式广告 (1892019135)</view>
                <ad-rewarded-video
                    ref="adRewardedVideoProd"
                    adpid="1892019135"
                    :url-callback="urlCallback"
                    :preload="false"
                    :loadnext="false"
                    v-slot:default="{ loading, error }"
                    @load="onadloadProd"
                    @close="onadcloseProd"
                    @error="onaderrorProd"
                >
                    <button class="ad-button" :disabled="loading || prodError" :loading="loading" @click="showAdProd">
                        显示正式广告
                    </button>
                </ad-rewarded-video>
                <view class="ad-status">
                    <view v-if="prodLoading" class="status loading">加载中...</view>
                    <view v-else-if="prodError" class="status error">
                        <text class="error-label">错误:</text>
                        <text class="error-code">{{ prodError.code || 'UNKNOWN' }}</text>
                        <text class="error-msg">{{ prodError.message || prodError.errMsg || JSON.stringify(prodError) }}</text>
                    </view>
                    <view v-else-if="prodLoaded" class="status success">已就绪</view>
                </view>
            </view>
            <!-- #endif -->
        </view>
    </view>
</template>

<script>
// 1507000689
// 1892019135

export default {
    data() {
        return {
            urlCallback: {
                userId: 'testuser',
                extra: 'testdata',
            },
            baseLoading: false,
            baseError: null,
            baseLoaded: false,
            prodLoading: false,
            prodError: null,
            prodLoaded: false,
        };
    },
    methods: {
        showAdBase() {
            if (this.baseLoading || this.baseError) {
                return;
            }
            this.$refs.adRewardedVideoBase.show();
        },
        showAdProd() {
            if (this.prodLoading || this.prodError) {
                return;
            }
            this.$refs.adRewardedVideoProd.show();
        },
        onadloadBase(e) {
            this.baseLoading = false;
            this.baseError = null;
            this.baseLoaded = true;
            console.log('ad-rewarded基座广告加载成功', e);
        },
        onadcloseBase(e) {
            const detail = e.detail;
            if (detail && detail.isEnded) {
                console.log('ad-rewarded基座广告正常结束', e);
            } else {
                console.log('ad-rewarded基座广告中途关闭', e);
            }
            this.baseLoaded = false;
            this.baseLoading = true;
            this.$refs.adRewardedVideoBase.load();
        },
        onaderrorBase(e) {
            this.baseLoading = false;
            this.baseError = e;
            this.baseLoaded = false;
            console.error('ad-rewarded基座广告错误', e);
        },

        onadloadProd(e) {
            this.prodLoading = false;
            this.prodError = null;
            this.prodLoaded = true;
            console.log('ad-rewarded正式广告加载成功', e);
        },
        onadcloseProd(e) {
            const detail = e.detail;
            if (detail && detail.isEnded) {
                console.log('ad-rewarded正式广告正常结束', e);
            } else {
                console.log('ad-rewarded正式广告中途关闭', e);
            }
            this.prodLoaded = false;
            this.prodLoading = true;
            this.$refs.adRewardedVideoProd.load();
        },
        onaderrorProd(e) {
            this.prodLoading = false;
            this.prodError = e;
            this.prodLoaded = false;
            console.error('ad-rewarded正式广告错误', e);
        },
    },
};
</script>

<style scoped>
.page {
    min-height: 100vh;
}

.content {
    padding: 30rpx;
    display: flex;
    flex-direction: column;
    gap: 40rpx;
}

.ad-section {
    background: #f8f8f8;
    border-radius: 16rpx;
    padding: 24rpx;
}

.ad-label {
    font-size: 28rpx;
    color: #666;
    margin-bottom: 16rpx;
    font-weight: 500;
}

.ad-status {
    margin-top: 16rpx;
}

.status {
    font-size: 24rpx;
    padding: 12rpx 16rpx;
    border-radius: 8rpx;
}

.status.loading {
    background: #fff3cd;
    color: #856404;
}

.status.error {
    background: #f8d7da;
    color: #721c24;
    display: flex;
    flex-wrap: wrap;
    gap: 8rpx;
}

.status.success {
    background: #d4edda;
    color: #155724;
}

.error-label {
    font-weight: 600;
}

.error-code {
    background: #721c24;
    color: #fff;
    padding: 2rpx 8rpx;
    border-radius: 4rpx;
    font-size: 22rpx;
}

.error-msg {
    width: 100%;
    margin-top: 4rpx;
    word-break: break-all;
}

.ad-button {
    background: #333;
    color: #fff;
    border: none;
    border-radius: 8rpx;
    font-size: 28rpx;
    padding: 16rpx 32rpx;
    margin-top: 16rpx;
}

.ad-button[disabled] {
    background: #999;
    color: #e0e0e0;
}
</style>
