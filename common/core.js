import { t } from '@/utils/i18n.js';

export const downloadPic = (picurl) => {
    uni.showLoading({
        title: t('common.downloading'),
        mask: true,
    });

    uni.getImageInfo({
        src: picurl,
        success: (res) => {
            uni.saveImageToPhotosAlbum({
                filePath: res.path,
                success: () => {
                    uni.showToast({
                        title: t('common.saveSuccessful'),
                        icon: 'none',
                    });
                },
                fail: (err) => {
                    if (err.errMsg === 'saveImageToPhotosAlbum:fail cancel') {
                        uni.showToast({
                            title: t('common.saveFailed'),
                            icon: 'none',
                        });
                        return;
                    }
                    uni.showModal({
                        title: t('common.authTip'),
                        content: t('common.authContent'),
                        success: (modalRes) => {
                            if (modalRes.confirm) {
                                uni.openSetting({
                                    success: (setting) => {
                                        if (setting.authSetting['scope.writePhotosAlbum']) {
                                            uni.showToast({
                                                title: t('common.authSuccess'),
                                                icon: 'none',
                                            });
                                        } else {
                                            uni.showToast({
                                                title: t('common.authFailed'),
                                                icon: 'none',
                                            });
                                        }
                                    },
                                });
                            }
                        },
                    });
                },
            });
        },
        complete: () => {
            uni.hideLoading();
        },
    });
};


/**
 * Android 原生设置壁纸函数 (基于 Native.js)
 *
 * 流程：
 *  1. BitmapFactory.decodeFile 解码图片
 *  2. 计算 cover 缩放比，将图片缩放到屏幕分辨率（避免壁纸不适应屏幕尺寸）
 *  3. 通过 WallpaperManager.setBitmap 设置，区分桌面/锁屏（API 24+）
 *
 * @param {string} localFilePath Android native 绝对路径（来自 plus.io.convertLocalFileSystemURL）
 * @param {'system' | 'lock' | 'both'} target 设置目标
 */
export function setAndroidWallpaper(localFilePath, target = 'both') {
    return new Promise((resolve, reject) => {
        // #ifdef APP-PLUS
        if (uni.getSystemInfoSync().platform !== 'android') {
            return reject(new Error('仅支持 Android 平台'));
        }

        try {
            const mainActivity = plus.android.runtimeMainActivity();

            const WallpaperManager = plus.android.importClass('android.app.WallpaperManager');
            const BitmapFactory    = plus.android.importClass('android.graphics.BitmapFactory');

            const wallpaperManager = WallpaperManager.getInstance(mainActivity);

            // Step 1: 解码原始图片 Bitmap
            const bitmap = BitmapFactory.decodeFile(localFilePath);
            if (!bitmap) {
                return reject(new Error('图片文件解码失败，路径: ' + localFilePath));
            }

            // Step 2: 获取屏幕分辨率
            const sysInfo = uni.getSystemInfoSync();
            const targetW = Math.round((sysInfo.screenWidth  || 360) * (sysInfo.pixelRatio || 2));
            const targetH = Math.round((sysInfo.screenHeight || 720) * (sysInfo.pixelRatio || 2));

            // Step 3: 获取原图尺寸，计算 cover 中心裁剪矩形作为 visibleCropHint
            // 不创建新 Bitmap 避免 int 类型反射问题，由系统将裁剪区域渲染到屏幕
            let cropHint = null;
            try {
                const Rect = plus.android.importClass('android.graphics.Rect');
                const srcW = plus.android.invoke(bitmap, 'getWidth')  | 0;
                const srcH = plus.android.invoke(bitmap, 'getHeight') | 0;

                console.log('[wallpaper] src=' + srcW + 'x' + srcH + ', screen=' + targetW + 'x' + targetH);

                if (srcW > 0 && srcH > 0) {
                    const srcAspect = srcW / srcH;
                    const dstAspect = targetW / targetH;

                    let cropX, cropY, cropW, cropH;
                    if (srcAspect > dstAspect) {
                        // 图片比屏幕宽：裁剪两侧，保留全高
                        cropH = srcH;
                        cropW = Math.round(srcH * dstAspect);
                        cropX = Math.round((srcW - cropW) / 2);
                        cropY = 0;
                    } else {
                        // 图片比屏幕高：裁剪上下，保留全宽
                        cropW = srcW;
                        cropH = Math.round(srcW / dstAspect);
                        cropX = 0;
                        cropY = Math.round((srcH - cropH) / 2);
                    }

                    // 安全边界检查
                    cropX = Math.max(0, Math.min(cropX, srcW - 1));
                    cropY = Math.max(0, Math.min(cropY, srcH - 1));
                    cropW = Math.max(1, Math.min(cropW, srcW - cropX));
                    cropH = Math.max(1, Math.min(cropH, srcH - cropY));

                    cropHint = plus.android.newObject('android.graphics.Rect', cropX, cropY, cropX + cropW, cropY + cropH);
                    console.log('[wallpaper] cropHint: ' + cropX + ',' + cropY + ' -> ' + (cropX + cropW) + ',' + (cropY + cropH));
                }
            } catch (rectErr) {
                console.warn('[wallpaper] cropHint 创建失败，使用 null（全图）:', rectErr);
            }

            // Step 4: 提示壁纸服务期望尺寸
            try {
                plus.android.invoke(wallpaperManager, 'suggestDesiredDimensions', targetW, targetH);
            } catch (e) { /* 非致命，忽略 */ }

            // Step 5: 确定 Android SDK 版本与 flag 并调用 setBitmap
            const sysStr  = sysInfo.system || '';
            const sysVer  = parseFloat(sysStr.replace(/Android\s*/i, '')) || 0;
            const isApi24 = sysVer >= 7.0;

            let which = 3;
            if (target === 'system') which = 1;
            else if (target === 'lock') which = 2;

            console.log('[wallpaper] sysVer=' + sysVer + ', which=' + which + ', target=' + target);

            if (isApi24) {
                // setBitmap(Bitmap bitmap, Rect visibleCropHint, boolean allowBackup, int which)
                plus.android.invoke(wallpaperManager, 'setBitmap', bitmap, cropHint, true, which);
            } else {
                plus.android.invoke(wallpaperManager, 'setBitmap', bitmap);
            }

            // 不调用 bitmap.recycle()：setBitmap 异步 Binder 传输期间回收会导致崩溃！
            console.log('[wallpaper] setBitmap success');
            resolve(true);
        } catch (e) {
            console.error('[wallpaper] setAndroidWallpaper error:', e.message || e);
            reject(e);
        }
        // #endif

        // #ifndef APP-PLUS
        reject(new Error('非 App 环境'));
        // #endif
    });
}
