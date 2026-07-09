// ifdef APP || MP     # 代表 APP平台 或 小程序平台，只有ifdef才有多个平台的或逻辑
import { downloadPic } from '@/common/core.js';
import { useUserStore } from '@/stores/user.js';

export const useAdIntersititial = () => {
    // #ifdef APP-PLUS
    const userStore = useUserStore();

    const adOption = {
        // 1111111113 HBuilder基座的测试广告位
        // 1129226586 正式的广告位
        adpid: '1129226586',
    };

    const shouldBypassAd = () => userStore.isVip || !userStore.showAd;
    const safeDownload = (url) => {
        if (url) downloadPic(url);
    };
    const adminToast = (options) => {
        // 只有管理员才能看到提示
        if (!userStore.isAdmin) return;
        uni.showToast(options);
    };

    let interstitialAd = null;
    let initialized = false;
    let loadingPromise = null;
    let isShowing = false;
    let pendingDestroy = false;
    let pendingPicurl = '';
    let pendingOnSuccess = null; // 广告关闭后的业务回调
    let pendingOnFallback = null; // 广告异常时的回退回调

    const ensureInterstitialAd = () => {
        if (interstitialAd) return interstitialAd;
        interstitialAd = uni.createInterstitialAd(adOption);
        return interstitialAd;
    };

    const clearPending = () => {
        pendingPicurl = '';
        pendingOnSuccess = null;
        pendingOnFallback = null;
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
        loadingPromise = interstitialAd
            .load()
            .catch(() => {})
            .finally(() => {
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
            // 用户关闭广告后执行业务回调（下载等）
            if (pendingOnSuccess) {
                pendingOnSuccess(pendingPicurl);
            } else {
                safeDownload(pendingPicurl);
            }
            clearPending();
            preloadInterstitial();
            tryDestroyIfNeeded();
        });
        ad.onError(() => {
            // 广告异常时回退，不阻塞主流程
            if (pendingOnFallback) {
                pendingOnFallback(pendingPicurl);
            } else {
                safeDownload(pendingPicurl);
            }
            clearPending();
            preloadInterstitial();
            tryDestroyIfNeeded();
        });

        preloadInterstitial();
    };

    /**
     * 展示插屏广告，关闭后自动下载或执行业务回调
     * @param {string} inputPicurl 待下载的图片地址
     * @param {object} options 可选配置
     * @param {Function} options.onSuccess 广告关闭后的业务回调（如增加下载计数）
     * @param {Function} options.onFallback 广告异常时的回退回调（直接执行下载+业务）
     */
    const showInterstitialAd = (inputPicurl, options = {}) => {
        const { onSuccess, onFallback } = options;

        // 如果用户是VIP或广告开关关闭，直接下载图片并执行业务回调
        if (shouldBypassAd()) {
            if (onFallback) {
                onFallback(inputPicurl);
            } else {
                safeDownload(inputPicurl);
            }
            return;
        }

        createInterstitialAd();
        if (isShowing) {
            adminToast({
                title: 'Ad is showing. Please wait.',
                icon: 'none',
            });
            return;
        }

        pendingPicurl = inputPicurl || '';
        pendingOnSuccess = onSuccess || null;
        pendingOnFallback = onFallback || null;
        isShowing = true;

        interstitialAd.show().catch(() => {
            // show 失败直接回退，不再重试（避免重试导致广告二次展示）
            if (pendingOnFallback) {
                pendingOnFallback(pendingPicurl);
            } else {
                safeDownload(pendingPicurl);
            }
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
        destroyInterstitialAd,
    };
    // #endif

    // #ifdef MP || WEB || APP-HARMONY
    return {
        createInterstitialAd: function () {},
        showInterstitialAd: function (inputPicurl, options = {}) {
            const cb = options.onFallback || options.onSuccess;
            if (cb) {
                cb(inputPicurl);
            } else {
                downloadPic(inputPicurl);
            }
        },
        destroyInterstitialAd: function () {},
    };
    // #endif
};

export const useAdRewardedVideo = () => {
    // #ifdef APP-PLUS
    const userStore = useUserStore();

    const adOption = {
        // 1507000689 HBuilder基座的测试广告位
        // 1892019135 正式的广告位
        adpid: '1892019135',
        urlCallback: {
            // 服务器回调透传参数
            userId: 'uniapp-testuser',
            extra: 'uniapp-testdata',
        },
    };

    const shouldBypassAd = () => userStore.isVip || !userStore.showAd;
    const safeDownload = (url) => {
        if (url) downloadPic(url);
    };
    const adminToast = (options) => {
        // 只有管理员才能看到提示
        if (!userStore.isAdmin) return;
        uni.showToast(options);
    };

    let rewardedVideoAd = null;
    let initialized = false;
    let loadingPromise = null;
    let isShowing = false;
    let pendingDestroy = false;
    let pendingPicurl = '';
    let pendingOnSuccess = null; // 业务回调：广告看完后执行
    let pendingOnFallback = null; // 业务回调：广告异常回退时执行

    const ensureRewardedAd = () => {
        if (rewardedVideoAd) return rewardedVideoAd;
        rewardedVideoAd = uni.createRewardedVideoAd(adOption);
        return rewardedVideoAd;
    };

    const clearPending = () => {
        pendingPicurl = '';
        pendingOnSuccess = null;
        pendingOnFallback = null;
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
        loadingPromise = rewardedVideoAd
            .load()
            .catch(() => {})
            .finally(() => {
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
                // 正常播放结束，优先执行业务回调
                if (pendingOnSuccess) {
                    pendingOnSuccess(pendingPicurl);
                } else {
                    safeDownload(pendingPicurl);
                }
            } else {
                // 播放中途退出
                adminToast({
                    title: 'Cannot download without watching the Ad completely.',
                    icon: 'none',
                    duration: 3000,
                });
            }
            clearPending();
            preloadRewarded();
            tryDestroyIfNeeded();
        });
        ad.onError(() => {
            // 广告异常时回退，不阻塞主流程
            adminToast({
                title: 'Ad loading failed. Download directly.',
                icon: 'none',
                duration: 2500,
            });
            if (pendingOnFallback) {
                pendingOnFallback(pendingPicurl);
            } else {
                safeDownload(pendingPicurl);
            }
            clearPending();
            tryDestroyIfNeeded();
        });

        preloadRewarded();
    };

    /**
     * 展示激励视频广告
     * @param {string} inputPicurl 待下载的图片地址
     * @param {object} options 可选配置
     * @param {Function} options.onSuccess 广告看完后的业务回调（如发放能量再下载）
     * @param {Function} options.onFallback 广告无法展示时的回退回调（直接下载）
     */
    const showRewardedVideoAd = (inputPicurl, options = {}) => {
        const { onSuccess, onFallback } = options;

        // 如果用户是VIP或广告开关关闭，直接执行回退回调或下载
        if (shouldBypassAd()) {
            if (onFallback) {
                onFallback(inputPicurl);
            } else {
                safeDownload(inputPicurl);
            }
            return;
        }

        createRewardedVideoAd();
        if (isShowing) {
            adminToast({
                title: 'Ad is showing. Please wait.',
                icon: 'none',
            });
            return;
        }

        pendingPicurl = inputPicurl || '';
        pendingOnSuccess = onSuccess || null;
        pendingOnFallback = onFallback || null;
        isShowing = true;

        rewardedVideoAd.show().catch(() => {
            // show 失败直接回退，不再重试
            if (pendingOnFallback) {
                pendingOnFallback(pendingPicurl);
            } else {
                safeDownload(pendingPicurl);
            }
            clearPending();
            tryDestroyIfNeeded();
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
        destroyRewardedVideoAd,
    };
    // #endif

    // #ifdef MP || WEB || APP-HARMONY
    return {
        createRewardedVideoAd: function () {},
        showRewardedVideoAd: function (inputPicurl, options = {}) {
            if (options.onFallback) {
                options.onFallback(inputPicurl);
            } else {
                downloadPic(inputPicurl);
            }
        },
        destroyRewardedVideoAd: function () {},
    };
    // #endif
};
