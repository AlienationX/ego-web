// ifdef APP || MP     # 代表 APP平台 或 小程序平台，只有ifdef才有多个平台的或逻辑
import { downloadPic } from '@/common/core.js';
import { useUserStore } from '@/stores/user.js';

export const useAdIntersititial = () => {
    // #ifdef APP
    const userStore = useUserStore();

    const adOption = {
        // 1111111113 HBuilder基座的测试广告位
        // 1129226586 正式的广告位
        adpid: '1129226586'
    };

    const shouldBypassAd = () => userStore.isVip || !userStore.showAd;
    const safeDownload = (url) => {
        if (url) downloadPic(url);
    };

    let interstitialAd = null;
    let initialized = false;
    let loadingPromise = null;
    let isShowing = false;
    let pendingDestroy = false;
    let pendingPicurl = '';

    const ensureInterstitialAd = () => {
        if (interstitialAd) return interstitialAd;
        interstitialAd = uni.createInterstitialAd(adOption);
        return interstitialAd;
    };

    const clearPending = () => {
        pendingPicurl = '';
        isShowing = false;
    };

    const tryDestroyIfNeeded = () => {
        if (!pendingDestroy || isShowing || !interstitialAd) return;
        interstitialAd.destroy();
        interstitialAd = null;
        initialized = false;
        loadingPromise = null;
        pendingDestroy = false;
    };

    const preloadInterstitial = () => {
        if (!interstitialAd || loadingPromise) return loadingPromise;
        loadingPromise = interstitialAd.load().catch(() => {}).finally(() => {
            loadingPromise = null;
        });
        return loadingPromise;
    };

    const createInterstitialAd = () => {
        const ad = ensureInterstitialAd();
        if (initialized) {
            preloadInterstitial();
            return;
        }

        initialized = true;
        ad.onLoad(() => {
            // 广告加载成功，不需要额外处理
        });
        ad.onClose(() => {
            // 用户关闭广告后继续业务流程
            safeDownload(pendingPicurl);
            clearPending();
            preloadInterstitial();
            tryDestroyIfNeeded();
        });
        ad.onError(() => {
            // 广告异常时回退，不阻塞主流程
            safeDownload(pendingPicurl);
            clearPending();
            preloadInterstitial();
            tryDestroyIfNeeded();
        });

        preloadInterstitial();
    };

    const showInterstitialAd = (inputPicurl) => {
        // 如果用户是VIP或广告开关关闭，直接下载图片
        if (shouldBypassAd()) {
            safeDownload(inputPicurl);
            return;
        }

        createInterstitialAd();
        if (isShowing) {
            uni.showToast({
                title: 'Ad is showing. Please wait.',
                icon: 'none'
            });
            return;
        }

        pendingPicurl = inputPicurl || '';
        isShowing = true;

        interstitialAd
            .show()
            .catch(() =>
                interstitialAd.load().then(() => {
                    return interstitialAd.show();
                })
            )
            .catch(() => {
                // show失败回退直接下载
                safeDownload(pendingPicurl);
                clearPending();
                tryDestroyIfNeeded();
            });
    };

    const destroyInterstitialAd = () => {
        // 页面关闭后销毁实例。若正在展示，延迟到close/error后销毁，避免中断流程
        pendingDestroy = true;
        tryDestroyIfNeeded();
    };

    return {
        createInterstitialAd,
        showInterstitialAd,
        destroyInterstitialAd
    };
    // #endif

    // #ifndef APP
    return {
        createInterstitialAd: function () {},
        showInterstitialAd: function (inputPicurl) {downloadPic(inputPicurl);},
        destroyInterstitialAd: function () {}
    };
    // #endif
};

export const useAdRewardedVideo = () => {
    // #ifdef APP
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

    const shouldBypassAd = () => userStore.isVip || !userStore.showAd;
    const safeDownload = (url) => {
        if (url) downloadPic(url);
    };

    let rewardedVideoAd = null;
    let initialized = false;
    let loadingPromise = null;
    let isShowing = false;
    let pendingDestroy = false;
    let pendingPicurl = '';

    const ensureRewardedAd = () => {
        if (rewardedVideoAd) return rewardedVideoAd;
        rewardedVideoAd = uni.createRewardedVideoAd(adOption);
        return rewardedVideoAd;
    };

    const clearPending = () => {
        pendingPicurl = '';
        isShowing = false;
    };

    const tryDestroyIfNeeded = () => {
        if (!pendingDestroy || isShowing || !rewardedVideoAd) return;
        rewardedVideoAd.destroy();
        rewardedVideoAd = null;
        initialized = false;
        loadingPromise = null;
        pendingDestroy = false;
    };

    const preloadRewarded = () => {
        if (!rewardedVideoAd || loadingPromise) return loadingPromise;
        loadingPromise = rewardedVideoAd.load().catch(() => {}).finally(() => {
            loadingPromise = null;
        });
        return loadingPromise;
    };

    const createRewardedVideoAd = () => {
        const ad = ensureRewardedAd();
        if (initialized) {
            preloadRewarded();
            return;
        }

        initialized = true;
        ad.onLoad(() => {
            // 广告加载成功，不需要额外处理
        });
        ad.onClose((e) => {
            // 用户点击了【关闭广告】按钮
            if (e?.isEnded) {
                // 正常播放结束
                safeDownload(pendingPicurl);
            } else {
                // 播放中途退出
                uni.showToast({
                    title: 'Cannot download without watching the Ad completely.',
                    icon: 'none',
                    duration: 3000
                });
            }
            clearPending();
            preloadRewarded();
            tryDestroyIfNeeded();
        });
        ad.onError(() => {
            // 广告异常时回退，不阻塞主流程
            uni.showToast({
                title: 'Ad loading failed. Download directly.',
                icon: 'none',
                duration: 2500
            });
            safeDownload(pendingPicurl);
            clearPending();
            preloadRewarded();
            tryDestroyIfNeeded();
        });

        preloadRewarded();
    };

    const showRewardedVideoAd = (inputPicurl) => {
        // 如果用户是VIP或广告开关关闭，直接下载图片
        if (shouldBypassAd()) {
            safeDownload(inputPicurl);
            return;
        }

        createRewardedVideoAd();
        if (isShowing) {
            uni.showToast({
                title: 'Ad is showing. Please wait.',
                icon: 'none'
            });
            return;
        }

        pendingPicurl = inputPicurl || '';
        isShowing = true;

        rewardedVideoAd
            .show()
            .catch(() => {
                // show失败的话 重新load获取
                rewardedVideoAd
                    .load()
                    .then(() => rewardedVideoAd.show())
                    .catch(() => {
                        // 再次失败直接回退，防止卡住下载流程
                        safeDownload(pendingPicurl);
                        clearPending();
                        tryDestroyIfNeeded();
                    });
            });
    };

    const destroyRewardedVideoAd = () => {
        // 页面关闭后销毁实例。若正在展示，延迟到close/error后销毁，避免中断流程
        pendingDestroy = true;
        tryDestroyIfNeeded();
    };

    return {
        createRewardedVideoAd,
        showRewardedVideoAd,
        destroyRewardedVideoAd
    };
    // #endif

    // #ifndef APP
    return {
        createRewardedVideoAd: function () {},
        showRewardedVideoAd: function (inputPicurl) {downloadPic(inputPicurl);},
        destroyRewardedVideoAd: function () {}
    };
    // #endif
};
