import { useI18n } from 'vue-i18n';

export const downloadPic = (picurl) => {
    // 在函数内调用 useI18n()，确保运行在 Vue 上下文
    const { t } = useI18n();

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
