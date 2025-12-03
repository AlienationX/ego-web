export const downloadPic = (picurl) => {
    // 多语言的t不能在js中直接使用，只能在vue文件的setup方法中使用。这里只能当作参数传递进来使用
    uni.showLoading({
        title: '下载中...',
        mask: true
    });

    uni.getImageInfo({
        src: picurl,
        success: (res) => {
            uni.saveImageToPhotosAlbum({
                filePath: res.path,
                success: (res) => {
                    uni.showToast({
                        title: '保存成功，请到相册查看',
                        icon: 'none'
                    });
                },
                fail: (err) => {
                    if (err.errMsg == 'saveImageToPhotosAlbum:fail cancel') {
                        uni.showToast({
                            title: '保存失败，请重新点击下载',
                            icon: 'none'
                        });
                        return;
                    }
                    uni.showModal({
                        title: '授权提示',
                        content: '需要授权保存相册',
                        success: (res) => {
                            if (res.confirm) {
                                uni.openSetting({
                                    success: (setting) => {
                                        console.log(setting);
                                        if (setting.authSetting['scope.writePhotosAlbum']) {
                                            uni.showToast({
                                                title: '获取授权成功',
                                                icon: 'none'
                                            });
                                        } else {
                                            uni.showToast({
                                                title: '获取权限失败',
                                                icon: 'none'
                                            });
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
            });
        },
        complete: () => {
            uni.hideLoading();
        }
    });
};
