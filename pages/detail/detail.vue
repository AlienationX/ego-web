<template>
    <view class="layout">
        <view class="preview-section" v-if="currentInfo">
            <swiper circular :current="currentIndex" @change="swiperChange">
                <swiper-item v-for="(item, index) in classList" :key="item.id">
                    <image v-if="readImgs.includes(index)" @click="maskChange" :src="item.picurl" mode="aspectFill"></image>
                </swiper-item>
            </swiper>

            <view class="mask" v-if="maskState">
                <view class="goBack" :style="{ top: getGoBackButtonTop() + 'px' }" @click="goBack">
                    <uni-icons type="back" color="#fff" size="20"></uni-icons>
                </view>
                <view class="count">{{ currentIndex + 1 }} / {{ classList.length }}</view>
                <view class="time">
                    {{ new Date().getHours().toString().padStart(2, '0') }}:{{ new Date().getMinutes().toString().padStart(2, '0') }}
                </view>
                <view class="date">
                    {{ (new Date().getMonth() + 1).toString().padStart(2, '0') }}/{{ new Date().getDate().toString().padStart(2, '0') }}
                </view>
                <view class="footer">
                    <view class="box" @click="openInfo">
                        <uni-icons type="info-filled" size="28"></uni-icons>
                        <view class="text">{{ $t('common.information') }}</view>
                    </view>
                    <view class="box" @click="openScore">
                        <uni-icons type="star-filled" size="28"></uni-icons>
                        <view class="text">{{ currentInfo.score }}</view>
                    </view>
                    <view class="box" @click="clickDownload">
                        <uni-icons v-if="currentInfo.is_locked" type="locked-filled" size="28"></uni-icons>
                        <uni-icons v-else type="download-filled" size="28"></uni-icons>
                        <view class="text">{{ $t('common.download') }}</view>
                    </view>
                    <view class="box" @click="scrollToComments">
                        <uni-icons type="chat-filled" size="28"></uni-icons>
                        <view class="text">{{ comments.length }}</view>
                    </view>
                </view>
            </view>
        </view>

        <scroll-view scroll-y class="detail-section" scroll-with-animation :scroll-into-view="scrollToCommentId">
            <view class="comments-section" id="comments">
                <view class="section-header">
                    <view class="header-title">
                        <uni-icons type="chat-filled" size="20" color="#28b389"></uni-icons>
                        <text>{{ $t('detail.comments') }} ({{ comments.length }})</text>
                    </view>
                    <button class="write-comment-btn" @click="openCommentPopup">{{ $t('detail.writeComment') }}</button>
                </view>

                <view v-if="comments.length === 0 && !isCommentsLoading" class="empty-comments">
                    <text class="empty-text">{{ $t('detail.noComments') }}</text>
                </view>

                <view class="comment-list" v-else>
                    <view class="comment-item" v-for="comment in comments" :key="comment.id">
                        <view class="comment-avatar">
                            <image :src="comment.avatar || '/common/images/pics/default_avatar.svg'" mode="aspectFill"></image>
                        </view>
                        <view class="comment-content">
                            <view class="comment-header">
                                <text class="comment-user">{{ comment.username }}</text>
                                <text class="comment-time">{{ formatCommentTime(comment.created_at) }}</text>
                            </view>
                            <text class="comment-text">{{ comment.content }}</text>
                            <view class="comment-actions">
                                <view class="action-item" @click="likeComment(comment)">
                                    <uni-icons :type="comment.is_liked ? 'heart-filled' : 'heart'" 
                                              :color="comment.is_liked ? '#ff6b9d' : '#999'" 
                                              size="16"></uni-icons>
                                    <text :class="{ liked: comment.is_liked }">{{ comment.likes || 0 }}</text>
                                </view>
                                <view class="action-item" @click="replyComment(comment)">
                                    <uni-icons type="chatbubble" color="#999" size="16"></uni-icons>
                                    <text>{{ $t('detail.reply') }}</text>
                                </view>
                            </view>
                        </view>
                    </view>
                </view>

                <view class="loadingLayout" v-show="isCommentsLoading">
                    <uni-load-more status="loading"></uni-load-more>
                </view>
            </view>

            <view class="related-section">
                <view class="section-header">
                    <view class="header-title">
                        <uni-icons type="image-filled" size="20" color="#28b389"></uni-icons>
                        <text>{{ $t('detail.related') }}</text>
                    </view>
                </view>
                <pics-view :classList="relatedWallpapers" :col="3" v-if="relatedWallpapers.length"></pics-view>
            </view>

            <view class="safe-area-inset-bottom"></view>
        </scroll-view>

        <uni-popup ref="infoPopup" type="bottom" :safe-area="false">
            <view class="infoPopup">
                <view class="popHeader">
                    <view></view>
                    <view class="title">{{ $t('preview.wallpaperInfo') }}</view>
                    <view class="close">
                        <uni-icons type="closeempty" size="18" color="#999" @click="closeInfo"></uni-icons>
                    </view>
                </view>
                <scroll-view scroll-y>
                    <view class="content">
                        <view class="row">
                            <view class="label">{{ $t('preview.wallpaperId') }}</view>
                            <view class="value" selectable>{{ currentInfo.id }}</view>
                        </view>
                        <view class="row" v-if="currentInfo.classify_name">
                            <view class="label">{{ $t('preview.category') }}</view>
                            <view class="value classify">{{ currentInfo.classify_name }}</view>
                        </view>
                        <view class="row" v-if="currentInfo.publisher">
                            <view class="label">{{ $t('preview.publisher') }}</view>
                            <view class="value classify">{{ currentInfo.publisher }}</view>
                        </view>
                        <view class="row">
                            <view class="label">{{ $t('preview.score') }}</view>
                            <view class="value rateBox">
                                <uni-rate readonly touchable :value="currentInfo.score"></uni-rate>
                                <text class="score">{{ currentInfo.score }}</text>
                            </view>
                        </view>
                        <view class="row" v-if="currentInfo.description">
                            <view class="label">{{ $t('preview.description') }}</view>
                            <view class="value" selectable>{{ currentInfo.description }}</view>
                        </view>
                        <view class="row">
                            <view class="label">{{ $t('preview.tags') }}</view>
                            <view class="value tabs">
                                <view class="tab" v-for="tab in currentInfo.tabs_list" :key="tab">
                                    {{ tab }}
                                </view>
                            </view>
                        </view>
                        <view class="copyright">{{ $t('message.copyrightStatement') }}</view>
                    </view>
                </scroll-view>
            </view>
        </uni-popup>

        <uni-popup ref="commentPopup" type="bottom" :safe-area="false">
            <view class="commentPopup">
                <view class="popHeader">
                    <view class="close" @click="closeCommentPopup">
                        <uni-icons type="closeempty" size="18" color="#999"></uni-icons>
                    </view>
                    <view class="title">{{ $t('detail.writeComment') }}</view>
                    <view class="submit" @click="submitComment">
                        <text class="submit-text">{{ $t('common.submit') }}</text>
                    </view>
                </view>
                <view class="comment-input-wrapper">
                    <textarea 
                        v-model="commentText" 
                        class="comment-input" 
                        :placeholder="$t('detail.commentPlaceholder')"
                        :maxlength="200"
                        auto-height
                    ></textarea>
                    <view class="char-count">{{ commentText.length }}/200</view>
                </view>
            </view>
        </uni-popup>
    </view>
</template>

<script setup>
    import { ref, computed } from 'vue';
    import { onLoad, onUnload } from '@dcloudio/uni-app';
    import { apiGetClassList, apiPostIncrementViews, apiPostIncrementDownloads, apiGetDetail, apiPostComment, apiGetComments } from '@/api/wallpaper.js';
    import { getGoBackButtonTop, getStatusBarHeight, getTitleBarHeight } from '@/utils/system.js';
    import { useUserStore } from '@/stores/user.js';

    const userStore = useUserStore();

    const infoPopup = ref(null);
    const commentPopup = ref(null);
    const maskState = ref(true);
    const currentIndex = ref(0);
    const classList = ref([]);
    const readImgs = ref([]);
    const currentInfo = computed(() => classList.value[currentIndex.value] || {});
    const comments = ref([]);
    const isCommentsLoading = ref(false);
    const commentText = ref('');
    const relatedWallpapers = ref([]);
    const scrollToCommentId = ref('');

    const openInfo = () => {
        infoPopup.value.open();
    };

    const closeInfo = () => {
        infoPopup.value.close();
    };

    const openCommentPopup = () => {
        if (!userStore.userinfo.id) {
            uni.showModal({
                title: $t('common.tip'),
                content: $t('detail.loginRequired'),
                success: (res) => {
                    if (res.confirm) {
                        uni.navigateTo({ url: '/pages/login/login' });
                    }
                }
            });
            return;
        }
        commentPopup.value.open();
    };

    const closeCommentPopup = () => {
        commentPopup.value.close();
        commentText.value = '';
    };

    const openScore = () => {
        if (!userStore.userinfo.id) {
            uni.showModal({
                title: $t('common.tip'),
                content: $t('detail.loginRequired'),
                success: (res) => {
                    if (res.confirm) {
                        uni.navigateTo({ url: '/pages/login/login' });
                    }
                }
            });
            return;
        }
    };

    const maskChange = () => {
        maskState.value = !maskState.value;
    };

    const swiperChange = (e) => {
        currentIndex.value = e.detail.current;
        if (!readImgs.value.includes(currentIndex.value)) {
            readImgs.value.push(currentIndex.value);
        }
        apiPostIncrementViews(currentInfo.value.id);
        getComments();
        getRelatedWallpapers();
    };

    const clickDownload = async () => {
        if (currentInfo.value.is_locked) {
            uni.showModal({
                title: $t('common.tip'),
                content: $t('detail.vipRequired'),
                showCancel: false
            });
            return;
        }

        uni.showLoading({ title: $t('common.downloading') });

        try {
            uni.downloadFile({
                url: currentInfo.value.picurl,
                success: (res) => {
                    if (res.statusCode === 200) {
                        uni.saveImageToPhotosAlbum({
                            filePath: res.tempFilePath,
                            success: () => {
                                uni.showToast({ title: $t('common.downloadSuccess'), icon: 'success' });
                                apiPostIncrementDownloads(currentInfo.value.id);
                                userStore.downloadCntAdd();
                            },
                            fail: () => {
                                uni.showToast({ title: $t('common.saveFailed'), icon: 'none' });
                            }
                        });
                    }
                },
                fail: () => {
                    uni.showToast({ title: $t('common.downloadFailed'), icon: 'none' });
                },
                complete: () => {
                    uni.hideLoading();
                }
            });
        } catch (error) {
            uni.hideLoading();
            uni.showToast({ title: $t('common.downloadFailed'), icon: 'none' });
        }
    };

    const getComments = async () => {
        try {
            isCommentsLoading.value = true;
            let res = await apiGetComments({ wallpaper_id: currentInfo.value.id });
            comments.value = res.data || [];
        } catch (error) {
            comments.value = [];
        } finally {
            isCommentsLoading.value = false;
        }
    };

    const getRelatedWallpapers = async () => {
        try {
            let res = await apiGetClassList({
                classify_id: currentInfo.value.classify_id,
                pageNum: 1,
                pageSize: 6
            });
            relatedWallpapers.value = res.data.filter(item => item.id !== currentInfo.value.id).slice(0, 6);
        } catch (error) {
            relatedWallpapers.value = [];
        }
    };

    const submitComment = async () => {
        if (!commentText.value.trim()) {
            uni.showToast({ title: $t('detail.commentEmpty'), icon: 'none' });
            return;
        }

        try {
            uni.showLoading({ title: $t('common.submitting') });
            await apiPostComment({
                wallpaper_id: currentInfo.value.id,
                content: commentText.value.trim()
            });

            uni.showToast({ title: $t('common.submitSuccess'), icon: 'success' });
            closeCommentPopup();
            getComments();
        } catch (error) {
            uni.showToast({ title: $t('common.submitFailed'), icon: 'none' });
        } finally {
            uni.hideLoading();
        }
    };

    const likeComment = async (comment) => {
        if (!userStore.userinfo.id) {
            uni.showModal({
                title: $t('common.tip'),
                content: $t('detail.loginRequired'),
                success: (res) => {
                    if (res.confirm) {
                        uni.navigateTo({ url: '/pages/login/login' });
                    }
                }
            });
            return;
        }

        comment.is_liked = !comment.is_liked;
        comment.likes = comment.is_liked ? (comment.likes || 0) + 1 : Math.max(0, (comment.likes || 0) - 1);
    };

    const replyComment = (comment) => {
        if (!userStore.userinfo.id) {
            uni.showModal({
                title: $t('common.tip'),
                content: $t('detail.loginRequired'),
                success: (res) => {
                    if (res.confirm) {
                        uni.navigateTo({ url: '/pages/login/login' });
                    }
                }
            });
            return;
        }

        commentText.value = `@${comment.username} `;
        openCommentPopup();
    };

    const formatCommentTime = (time) => {
        if (!time) return '';
        const date = new Date(time);
        const now = new Date();
        const diff = now - date;

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return $t('rating.justNow');
        if (minutes < 60) return `${minutes}${$t('rating.minutesAgo')}`;
        if (hours < 24) return `${hours}${$t('rating.hoursAgo')}`;
        if (days < 7) return `${days}${$t('rating.daysAgo')}`;

        return date.toLocaleDateString();
    };

    const scrollToComments = () => {
        maskState.value = false;
        scrollToCommentId.value = 'comments';
    };

    const goBack = () => {
        uni.navigateBack();
    };

    onLoad((e) => {
        const id = parseInt(e.id);
        if (!id) {
            uni.navigateBack();
            return;
        }

        classList.value = uni.getStorageSync('wallList') || [];
        currentIndex.value = classList.value.findIndex(item => item.id === id);
        if (currentIndex.value === -1) currentIndex.value = 0;
        readImgs.value = [currentIndex.value];

        getComments();
        getRelatedWallpapers();
    });

    onUnload(() => {
        uni.removeStorageSync('wallList');
    });
</script>

<style lang="scss" scoped>
    .layout {
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: #000;

        .preview-section {
            flex: 0 0 auto;
            height: 60vh;
            position: relative;

            swiper {
                width: 100%;
                height: 100%;

                swiper-item {
                    width: 100%;
                    height: 100%;

                    image {
                        width: 100%;
                        height: 100%;
                    }
                }
            }

            .mask {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, rgba(0,0,0,0.3) 100%);

                .goBack {
                    width: 80rpx;
                    height: 80rpx;
                    background: rgba(0,0,0,0.3);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: absolute;
                    left: 30rpx;
                    backdrop-filter: blur(10rpx);
                }

                .count {
                    position: absolute;
                    top: calc(var(--status-bar-height) + 30rpx);
                    right: 30rpx;
                    color: #fff;
                    font-size: 32rpx;
                    text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.5);
                }

                .time {
                    position: absolute;
                    top: calc(var(--status-bar-height) + 30rpx);
                    left: 50%;
                    transform: translateX(-50%);
                    color: #fff;
                    font-size: 36rpx;
                    font-weight: 600;
                    text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.5);
                }

                .date {
                    position: absolute;
                    top: calc(var(--status-bar-height) + 80rpx);
                    left: 50%;
                    transform: translateX(-50%);
                    color: #fff;
                    font-size: 24rpx;
                    text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.5);
                }

                .footer {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 120rpx;
                    display: flex;
                    justify-content: space-around;
                    align-items: center;
                    padding-bottom: env(safe-area-inset-bottom);

                    .box {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        color: #fff;

                        .text {
                            font-size: 24rpx;
                            margin-top: 6rpx;
                            text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.5);
                        }
                    }
                }
            }
        }

        .detail-section {
            flex: 1;
            background: #f5f5f5;

            .comments-section {
                background: #fff;
                margin-bottom: 20rpx;
                padding: 30rpx;

                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30rpx;

                    .header-title {
                        display: flex;
                        align-items: center;
                        gap: 12rpx;
                        font-size: 32rpx;
                        font-weight: 600;
                        color: #333;
                    }

                    .write-comment-btn {
                        padding: 12rpx 32rpx;
                        background: $wp-theme-color;
                        color: #fff;
                        font-size: 28rpx;
                        border-radius: 32rpx;
                        border: none;

                        &::after {
                            border: none;
                        }
                    }
                }

                .empty-comments {
                    text-align: center;
                    padding: 80rpx 0;

                    .empty-text {
                        font-size: 28rpx;
                        color: #999;
                    }
                }

                .comment-list {
                    .comment-item {
                        display: flex;
                        padding: 24rpx 0;
                        border-bottom: 1rpx solid #f0f0f0;

                        &:last-child {
                            border-bottom: none;
                        }

                        .comment-avatar {
                            width: 72rpx;
                            height: 72rpx;
                            border-radius: 50%;
                            overflow: hidden;
                            margin-right: 20rpx;
                            flex-shrink: 0;

                            image {
                                width: 100%;
                                height: 100%;
                            }
                        }

                        .comment-content {
                            flex: 1;
                            overflow: hidden;

                            .comment-header {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                margin-bottom: 12rpx;

                                .comment-user {
                                    font-size: 28rpx;
                                    color: #333;
                                    font-weight: 500;
                                }

                                .comment-time {
                                    font-size: 24rpx;
                                    color: #999;
                                }
                            }

                            .comment-text {
                                font-size: 28rpx;
                                color: #666;
                                line-height: 1.6;
                                margin-bottom: 16rpx;
                                display: -webkit-box;
                                -webkit-box-orient: vertical;
                                -webkit-line-clamp: 3;
                                overflow: hidden;
                            }

                            .comment-actions {
                                display: flex;
                                gap: 40rpx;

                                .action-item {
                                    display: flex;
                                    align-items: center;
                                    gap: 8rpx;
                                    font-size: 24rpx;
                                    color: #999;

                                    &.liked {
                                        color: #ff6b9d;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            .related-section {
                background: #fff;
                padding: 30rpx;
                margin-bottom: 20rpx;

                .section-header {
                    margin-bottom: 20rpx;

                    .header-title {
                        display: flex;
                        align-items: center;
                        gap: 12rpx;
                        font-size: 32rpx;
                        font-weight: 600;
                        color: #333;
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
    }

    .infoPopup, .commentPopup {
        background: #fff;
        border-radius: 30rpx 30rpx 0 0;
        overflow: hidden;

        .popHeader {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 30rpx;
            border-bottom: 1rpx solid #f0f0f0;

            .title {
                font-size: 32rpx;
                font-weight: 600;
                color: #333;
            }

            .close, .submit {
                width: 60rpx;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .submit {
                .submit-text {
                    color: $wp-theme-color;
                    font-size: 28rpx;
                }
            }
        }

        .content {
            padding: 30rpx;

            .row {
                display: flex;
                padding: 20rpx 0;
                border-bottom: 1rpx solid #f5f5f5;

                &:last-child {
                    border-bottom: none;
                }

                .label {
                    width: 160rpx;
                    color: #666;
                    font-size: 28rpx;
                }

                .value {
                    flex: 1;
                    color: #333;
                    font-size: 28rpx;
                    word-break: break-all;

                    &.classify {
                        color: $wp-theme-color;
                    }

                    &.rateBox {
                        display: flex;
                        align-items: center;
                        gap: 12rpx;

                        .score {
                            color: #ffc107;
                            font-size: 32rpx;
                            font-weight: 600;
                        }
                    }

                    &.tabs {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 12rpx;

                        .tab {
                            padding: 8rpx 20rpx;
                            background: #f0f0f0;
                            color: #666;
                            font-size: 24rpx;
                            border-radius: 20rpx;
                        }
                    }
                }
            }

            .copyright {
                margin-top: 30rpx;
                padding: 20rpx;
                background: #f9f9f9;
                border-radius: 12rpx;
                font-size: 24rpx;
                color: #999;
                line-height: 1.6;
            }
        }

        .comment-input-wrapper {
            padding: 30rpx;
            position: relative;

            .comment-input {
                width: 100%;
                min-height: 200rpx;
                padding: 20rpx;
                background: #f9f9f9;
                border-radius: 16rpx;
                font-size: 28rpx;
                line-height: 1.6;
                color: #333;
            }

            .char-count {
                position: absolute;
                bottom: 40rpx;
                right: 50rpx;
                font-size: 24rpx;
                color: #999;
            }
        }
    }
</style>
