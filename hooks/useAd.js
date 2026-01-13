// ifdef APP || MP     # 代表 APP平台 或 小程序平台，只有ifdef才有多个平台的或逻辑
import { downloadPic } from '@/common/core.js';
import { useUserStore } from '@/stores/user.js';

export const useAdIntersititial = () => {
    // #ifdef MP-360
    const userStore = useUserStore();

    const adOption = {
        // 1111111113 HBuilder基座的测试广告位
        // 1129226586 正式的广告位
        adpid: '1129226586'
    };

    let picurl = '';
    const interstitialAd = uni.createInterstitialAd(adOption);

    const createInterstitialAd = () => {
        // 广告实例创建成功后默认会执行一次 load，加载广告数据
        // 如果界面有 "显示广告" 按钮，需要先禁用掉，防止用户点击，等待广告数据加载成功后在放开
        // this.loading = true;

        interstitialAd.onLoad((e) => {
            // this.loading = false;
            // console.log('use ad-interstitial onload', e);
        });
        interstitialAd.onClose(() => {
            // 用户点击了关闭或返回键(仅Android有返回键)
            // console.log('use ad-interstitial onclose');
            downloadPic(picurl);
        });
        interstitialAd.onError((e) => {
            // this.loading = false;
            // console.log('use ad-interstitial onerror', e);
        });
    };

    const showInterstitialAd = (inputPicurl) => {
        // 如果用户是VIP或广告开关关闭，直接下载图片
        if (userStore.isVip || !userStore.showAd) {
            picurl = inputPicurl;
            return;
        }
        
        // 调用 interstitialAd.show()，如果数据正在加载中不会显示广告，加载成功后才显示
        // 在数据没有加载成功时，需要防止用户频繁点击显示广告
        // if (this.loading == true) {
        //     return
        // }
        // this.loading = true;
        interstitialAd.show().then(() => {
            // this.loading = false;
            picurl = inputPicurl;
        });
    };

    const destroyInterstitialAd = () => {
        // 页面关闭后销毁实例
        interstitialAd.destroy();
    };

    return {
        createInterstitialAd,
        showInterstitialAd,
        destroyInterstitialAd
    };
    // #endif

    // #ifndef MP-360
    return {
        createInterstitialAd: function () {},
        showInterstitialAd: function (inputPicurl) {downloadPic(inputPicurl);},
        destroyInterstitialAd: function () {}
    };
    // #endif
};

export const useAdRewardedVideo = () => {
    // #ifdef MP-360
    const userStore = useUserStore();

    const adOption = {
        // 1507000689 HBuilder基座的测试广告位
        // 1892019135 正式的广告位
        adpid: '1892019135',
        urlCallback: {
            // 服务器回调透传参数
            userId: 'uniapp-testuser',
            extra: 'uniapp-testdata'
        }
    };

    let picurl = '';
    const rewardedVideoAd = uni.createRewardedVideoAd(adOption);

    const createRewardedVideoAd = () => {
        // 广告实例创建成功后默认会执行一次 load，加载广告数据
        // 如果界面有 "显示广告" 按钮，需要先禁用掉，防止用户点击，等待广告数据加载成功后在放开
        // this.loading = true;

        rewardedVideoAd.onLoad((e) => {
            // this.loading = false;
            // console.log('use ad-rewarded-video onload', e);
            // 当激励视频被关闭时，默认预载下一条数据，加载完成时仍然触发 `onLoad` 事件
        });
        rewardedVideoAd.onClose((e) => {
            // 用户点击了关闭或返回键(仅Android有返回键)
            // console.log('use ad-rewarded-video onclose', e, picurl);

            // 用户点击了【关闭广告】按钮
            if (e.isEnded) {
                // 正常播放结束
                downloadPic(picurl);
            } else {
                // 播放中途退出
                uni.showToast({
                    title: 'Cannot download without watching the Ad completely.',
                    icon: 'none',
                    duration: 3000
                });
            }
        });
        rewardedVideoAd.onError((e) => {
            // this.loading = false;
            uni.showToast({
                title: 'Ad loading failed. Please try again later.',
                icon: 'none',
                duration: 3000
            });
            rewardedVideoAd.load(); // 加载失败，手动再次拉取广告
        });
    };

    const showRewardedVideoAd = (inputPicurl) => {
        // 如果用户是VIP或广告开关关闭，直接下载图片
        if (userStore.isVip || !userStore.showAd) {
            picurl = inputPicurl;
            return;
        }
        
        // 调用 interstitialAd.show()，如果数据正在加载中不会显示广告，加载成功后才显示
        // 在数据没有加载成功时，需要防止用户频繁点击显示广告
        // if (this.loading == true) {
        //     return
        // }
        // uni.showLoading({
        //     title: 'Loading...',
        //     mask: true
        // });

        rewardedVideoAd
            .show()
            .then(() => {
                picurl = inputPicurl;
            })
            .catch(() => {
                // show失败的话 重新load获取
                rewardedVideoAd
                    .load()
                    .then(() =>
                        rewardedVideoAd.show().then(() => {
                            picurl = inputPicurl;
                        })
                    )
                    .catch((err) => {
                        console.log('激励视频 广告显示失败！为了不影响用户体验，直接下载！');
                    });
            });

        // uni.hideLoading();
    };

    const destroyRewardedVideoAd = () => {
        // 页面关闭后销毁实例
        rewardedVideoAd.destroy();
    };

    return {
        createRewardedVideoAd,
        showRewardedVideoAd,
        destroyRewardedVideoAd
    };
    // #endif

    // #ifndef MP-360
    return {
        createRewardedVideoAd: function () {},
        showRewardedVideoAd: function (inputPicurl) {downloadPic(inputPicurl);},
        destroyRewardedVideoAd: function () {}
    };
    // #endif
};
