// ifdef APP-PLUS || MP     # 代表 APP平台 或 小程序平台，只有ifdef才有多个平台的或逻辑

export const useAdIntersititial = () => {
    // #ifdef APP-PLUS
    const adOption = {
        // 1111111113 HBuilder基座的测试广告位
        // 1129226586 正式的广告位
        adpid: '1129226586'
    };

    const interstitialAd = uni.createInterstitialAd(adOption);

    const createInterstitialAd = () => {
        // 广告实例创建成功后默认会执行一次 load，加载广告数据
        // 如果界面有 "显示广告" 按钮，需要先禁用掉，防止用户点击，等待广告数据加载成功后在放开
        // this.loading = true;

        interstitialAd.onLoad((e) => {
            // this.loading = false;
            console.log('use ad-interstitial onload', e);
        });
        interstitialAd.onClose(() => {
            // 用户点击了关闭或返回键(仅Android有返回键)
            console.log('use ad-interstitial onclose');
        });
        interstitialAd.onError((e) => {
            // this.loading = false;
            console.log('use ad-interstitial onerror', e);
        });
    };

    const showInterstitialAd = () => {
        // 调用 interstitialAd.show()，如果数据正在加载中不会显示广告，加载成功后才显示
        // 在数据没有加载成功时，需要防止用户频繁点击显示广告
        // if (this.loading == true) {
        //     return
        // }
        // this.loading = true;
        interstitialAd.show().then(() => {
            // this.loading = false;
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

    // #ifndef APP-PLUS
    return {
        createInterstitialAd: function () {},
        showInterstitialAd: function () {},
        destroyInterstitialAd: function () {}
    };
    // #endif
};

export const useAdRewardedVideo = () => {
    // #ifdef APP-PLUS
    const adOption = {
        // 1507000689 HBuilder基座的测试广告位
        // 1892019135 正式的广告位
        adpid: '1892019135',
        urlCallback: {
            // 服务器回调透传参数
            userId: 'testuser',
            extra: 'testdata'
        }
    };

    const rewardedVideolAd = uni.createRewardedVideoAd(adOption);

    const createRewardedVideoAd = () => {
        // 广告实例创建成功后默认会执行一次 load，加载广告数据
        // 如果界面有 "显示广告" 按钮，需要先禁用掉，防止用户点击，等待广告数据加载成功后在放开
        // this.loading = true;

        rewardedVideolAd.onLoad((e) => {
            // this.loading = false;
            console.log('use ad-rewarded-video onload', e);
            // 当激励视频被关闭时，默认预载下一条数据，加载完成时仍然触发 `onLoad` 事件
        });
        rewardedVideolAd.onClose((e) => {
            // 用户点击了关闭或返回键(仅Android有返回键)
            console.log('use ad-rewarded-video onclose', e);

            const detail = e.detail;
            // 用户点击了【关闭广告】按钮
            if (detail && detail.isEnded) {
                // 正常播放结束
                console.log('use ad-rewarded-video onclose: success' + detail.isEnded, e);
            } else {
                // 播放中途退出
                console.log('use ad-rewarded-video onclose: abort' + detail.isEnded, e);
            }
        });
        rewardedVideolAd.onError((e) => {
            // this.loading = false;
            console.log('use ad-rewarded-video onerror', e);
            rewardedVideolAd.load(); // 加载失败，手动再次拉取广告
        });
    };

    const showRewardedVideoAd = () => {
        // 调用 interstitialAd.show()，如果数据正在加载中不会显示广告，加载成功后才显示
        // 在数据没有加载成功时，需要防止用户频繁点击显示广告
        // if (this.loading == true) {
        //     return
        // }
        // this.loading = true;
        rewardedVideolAd.show().then(() => {
            // this.loading = false;
        });
    };

    const destroyRewardedVideoAd = () => {
        // 页面关闭后销毁实例
        rewardedVideolAd.destroy();
    };

    return {
        createRewardedVideoAd,
        showRewardedVideoAd,
        destroyRewardedVideoAd
    };
    // #endif
    
    // #ifndef APP-PLUS
    return {
        createRewardedVideoAd: function () {},
        showRewardedVideoAd: function () {},
        destroyRewardedVideoAd: function () {}
    };
    // #endif
};
