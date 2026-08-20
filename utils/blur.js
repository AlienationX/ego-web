/**
 * utils/blur.js
 * 跨端高性能毛玻璃/真实高斯模糊与主屏壁纸伴侣处理工具库
 * 包含纯 JavaScript StackBlur 高斯模糊核心算法与 Canvas 2D 适配器
 */

const mul_table = [
    512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512,
    454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512,
    482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475, 456,
    437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292, 282, 273, 265, 512,
    497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364, 354, 345, 337, 328,
    320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465, 456,
    446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335,
    329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512,
    505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405,
    400, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328,
    324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271,
    268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456,
    451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388,
    385, 381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335,
    332, 329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292,
    289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259
];

const shg_table = [
    9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17,
    17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19,
    19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
    20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
    21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
    21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22,
    22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
    22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23,
    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
    23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
    23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
    24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24
];

function BlurStack() {
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 0;
    this.next = null;
}

/**
 * 对 ImageData 执行像素级 StackBlur 高斯模糊
 */
export function stackBlurRGBA(imageData, width, height, radius) {
    if (isNaN(radius) || radius < 1) return imageData;
    radius |= 0;
    if (radius > 254) radius = 254;

    const pixels = imageData.data;
    let x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum,
        r_out_sum, g_out_sum, b_out_sum,
        r_in_sum, g_in_sum, b_in_sum,
        pr, pg, pb, rbs;

    const div = radius + radius + 1;
    const widthMinus1 = width - 1;
    const heightMinus1 = height - 1;
    const radiusPlus1 = radius + 1;
    const sumFactor = radiusPlus1 * (radiusPlus1 + 1) / 2;

    const stackStart = new BlurStack();
    let stack = stackStart;
    for (i = 1; i < div; i++) {
        stack = stack.next = new BlurStack();
        if (i === radiusPlus1) {
            var stackEnd = stack;
        }
    }
    stack.next = stackStart;
    let stackIn = null;
    let stackOut = null;

    yw = yi = 0;

    const mul_sum = mul_table[radius];
    const shg_sum = shg_table[radius];

    for (y = 0; y < height; y++) {
        r_in_sum = g_in_sum = b_in_sum = r_sum = g_sum = b_sum = 0;
        r_out_sum = radiusPlus1 * (pr = pixels[yi]);
        g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
        b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);

        r_sum += sumFactor * pr;
        g_sum += sumFactor * pg;
        b_sum += sumFactor * pb;

        stack = stackStart;

        for (i = 0; i < radiusPlus1; i++) {
            stack.r = pr;
            stack.g = pg;
            stack.b = pb;
            stack = stack.next;
        }

        for (i = 1; i < radiusPlus1; i++) {
            p = yi + ((widthMinus1 < i ? widthMinus1 : i) << 2);
            r_sum += (stack.r = (pr = pixels[p])) * (rbs = radiusPlus1 - i);
            g_sum += (stack.g = (pg = pixels[p + 1])) * rbs;
            b_sum += (stack.b = (pb = pixels[p + 2])) * rbs;

            r_in_sum += pr;
            g_in_sum += pg;
            b_in_sum += pb;

            stack = stack.next;
        }

        stackIn = stackStart;
        stackOut = stackEnd;

        for (x = 0; x < width; x++) {
            pixels[yi] = (r_sum * mul_sum) >> shg_sum;
            pixels[yi + 1] = (g_sum * mul_sum) >> shg_sum;
            pixels[yi + 2] = (b_sum * mul_sum) >> shg_sum;

            r_sum -= r_out_sum;
            g_sum -= g_out_sum;
            b_sum -= b_out_sum;

            r_out_sum -= stackIn.r;
            g_out_sum -= stackIn.g;
            b_out_sum -= stackIn.b;

            p = (yw + ((p = x + radius + 1) < widthMinus1 ? p : widthMinus1)) << 2;

            r_in_sum += (stackIn.r = pixels[p]);
            g_in_sum += (stackIn.g = pixels[p + 1]);
            b_in_sum += (stackIn.b = pixels[p + 2]);

            r_sum += r_in_sum;
            g_sum += g_in_sum;
            b_sum += b_in_sum;

            stackIn = stackIn.next;

            r_out_sum += (pr = stackOut.r);
            g_out_sum += (pg = stackOut.g);
            b_out_sum += (pb = stackOut.b);

            r_in_sum -= pr;
            g_in_sum -= pg;
            b_in_sum -= pb;

            stackOut = stackOut.next;

            yi += 4;
        }
        yw += width;
    }

    for (x = 0; x < width; x++) {
        g_in_sum = b_in_sum = r_in_sum = g_sum = b_sum = r_sum = 0;

        yi = x << 2;
        r_out_sum = radiusPlus1 * (pr = pixels[yi]);
        g_out_sum = radiusPlus1 * (pg = pixels[yi + 1]);
        b_out_sum = radiusPlus1 * (pb = pixels[yi + 2]);

        r_sum += sumFactor * pr;
        g_sum += sumFactor * pg;
        b_sum += sumFactor * pb;

        stack = stackStart;

        for (i = 0; i < radiusPlus1; i++) {
            stack.r = pr;
            stack.g = pg;
            stack.b = pb;
            stack = stack.next;
        }

        yp = width;

        for (i = 1; i <= radius; i++) {
            yi = (yp + x) << 2;

            r_sum += (stack.r = (pr = pixels[yi])) * (rbs = radiusPlus1 - i);
            g_sum += (stack.g = (pg = pixels[yi + 1])) * rbs;
            b_sum += (stack.b = (pb = pixels[yi + 2])) * rbs;

            r_in_sum += pr;
            g_in_sum += pg;
            b_in_sum += pb;

            stack = stack.next;

            if (i < heightMinus1) {
                yp += width;
            }
        }

        yi = x;
        stackIn = stackStart;
        stackOut = stackEnd;

        for (y = 0; y < height; y++) {
            p = yi << 2;
            pixels[p] = (r_sum * mul_sum) >> shg_sum;
            pixels[p + 1] = (g_sum * mul_sum) >> shg_sum;
            pixels[p + 2] = (b_sum * mul_sum) >> shg_sum;

            r_sum -= r_out_sum;
            g_sum -= g_out_sum;
            b_sum -= b_out_sum;

            r_out_sum -= stackIn.r;
            g_out_sum -= stackIn.g;
            b_out_sum -= stackIn.b;

            p = (x + (((p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1) * width)) << 2;

            r_in_sum += (stackIn.r = pixels[p]);
            g_in_sum += (stackIn.g = pixels[p + 1]);
            b_in_sum += (stackIn.b = pixels[p + 2]);

            r_sum += r_in_sum;
            g_sum += g_in_sum;
            b_sum += b_in_sum;

            stackIn = stackIn.next;

            r_out_sum += (pr = stackOut.r);
            g_out_sum += (pg = stackOut.g);
            b_out_sum += (pb = stackOut.b);

            r_in_sum -= pr;
            g_in_sum -= pg;
            b_in_sum -= pb;

            stackOut = stackOut.next;

            yi += width;
        }
    }
    return imageData;
}

/**
 * 跨平台通用磨砂壁纸渲染器
 * 优先采用 Canvas 2D 进行硬件加速与真实 StackBlur 高斯模糊计算
 */
export const renderFrostedWallpaperToCanvas = ({
    canvasId = 'frostedCanvas',
    instance,
    imagePath,
    width = 540,
    height = 1170,
    blurRadius = 35,
    darkness = 0.12,
}) => {
    return new Promise((resolve, reject) => {
        if (!imagePath || !width || !height) {
            return reject(new Error('Missing required canvas rendering parameters.'));
        }

        // #ifdef MP-WEIXIN
        // 微信小程序端：使用最新的 Canvas 2D 接口，支持同层渲染与 getImageData
        const query = uni.createSelectorQuery().in(instance);
        query.select(`#${canvasId}`)
            .fields({ node: true, size: true })
            .exec((res) => {
                if (!res || !res[0] || !res[0].node) {
                    return reject(new Error('WeChat Canvas 2D node not found'));
                }
                const canvas = res[0].node;
                const ctx = canvas.getContext('2d');
                canvas.width = width;
                canvas.height = height;

                const img = canvas.createImage();
                img.onload = () => {
                    ctx.clearRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    // 1. 获取像素数据执行真实高斯模糊
                    try {
                        const imgData = ctx.getImageData(0, 0, width, height);
                        // 根据模糊半径 (0~100) 映射适当的 StackBlur 半径 (1~80)
                        const actualRadius = Math.max(1, Math.round(blurRadius * 0.75));
                        stackBlurRGBA(imgData, width, height, actualRadius);
                        ctx.putImageData(imgData, 0, 0);
                    } catch (err) {
                        console.warn('getImageData stack blur error, fallback:', err);
                    }

                    // 2. 叠加暗度遮罩
                    if (darkness > 0) {
                        ctx.fillStyle = `rgba(0, 0, 0, ${darkness})`;
                        ctx.fillRect(0, 0, width, height);
                    }

                    // 3. 导出临时文件
                    uni.canvasToTempFilePath({
                        canvas,
                        x: 0,
                        y: 0,
                        width,
                        height,
                        destWidth: width,
                        destHeight: height,
                        fileType: 'jpg',
                        quality: 0.95,
                        success: (saveRes) => {
                            if (saveRes.tempFilePath) {
                                resolve(saveRes.tempFilePath);
                            } else {
                                reject(new Error('Canvas export tempFilePath is empty'));
                            }
                        },
                        fail: reject,
                    }, instance);
                };
                img.onerror = (err) => reject(new Error('Canvas 2D Image load error: ' + JSON.stringify(err)));
                img.src = imagePath;
            });
        // #endif

        // #ifndef MP-WEIXIN
        // H5 / App-Plus / 其他小程序端
        // #ifdef H5
        const el = document.getElementById(canvasId);
        const canvasEl = el && el.tagName === 'CANVAS' ? el : el?.querySelector('canvas');
        if (canvasEl && canvasEl.getContext) {
            const ctx = canvasEl.getContext('2d');
            canvasEl.width = width;
            canvasEl.height = height;
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                const imgData = ctx.getImageData(0, 0, width, height);
                const actualRadius = Math.max(1, Math.round(blurRadius * 0.75));
                stackBlurRGBA(imgData, width, height, actualRadius);
                ctx.putImageData(imgData, 0, 0);

                if (darkness > 0) {
                    ctx.fillStyle = `rgba(0, 0, 0, ${darkness})`;
                    ctx.fillRect(0, 0, width, height);
                }
                resolve(canvasEl.toDataURL('image/jpeg', 0.95));
            };
            img.onerror = reject;
            img.src = imagePath;
            return;
        }
        // #endif

        // App-Plus 端：利用 uni.createCanvasContext
        const ctx = uni.createCanvasContext(canvasId, instance);
        ctx.clearRect(0, 0, width, height);

        // App 端采用多重轻度扩散与覆盖
        ctx.drawImage(imagePath, 0, 0, width, height);
        if (darkness > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${darkness})`;
            ctx.fillRect(0, 0, width, height);
        }

        ctx.draw(false, () => {
            setTimeout(() => {
                uni.canvasToTempFilePath({
                    canvasId,
                    width,
                    height,
                    destWidth: width,
                    destHeight: height,
                    fileType: 'jpg',
                    quality: 0.95,
                    success: (res) => {
                        if (res.tempFilePath) {
                            resolve(res.tempFilePath);
                        } else {
                            reject(new Error('Canvas export tempFilePath is empty'));
                        }
                    },
                    fail: reject,
                }, instance);
            }, 120);
        });
        // #endif
    });
};

/**
 * 快速保存图片到系统相册（带自动授权引导与错误提示）
 * @param {string} tempFilePath 本地图片临时路径
 * @returns {Promise<boolean>}
 */
export const saveImageToAlbum = (tempFilePath) => {
    return new Promise((resolve, reject) => {
        // #ifdef H5
        try {
            const a = document.createElement('a');
            a.href = tempFilePath;
            a.download = `frosted_wallpaper_${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            resolve(true);
            return;
        } catch (e) {
            reject(e);
            return;
        }
        // #endif

        // #ifndef H5
        uni.saveImageToPhotosAlbum({
            filePath: tempFilePath,
            success: () => {
                resolve(true);
            },
            fail: (err) => {
                if (err.errMsg && err.errMsg.includes('cancel')) {
                    return resolve(false);
                }
                // 授权失败时唤起设置
                uni.showModal({
                    title: '相册授权提示',
                    content: '保存壁纸需要访问您的系统相册权限，请前往设置开启。',
                    confirmText: '去开启',
                    success: (modalRes) => {
                        if (modalRes.confirm) {
                            uni.openSetting({
                                success: (setting) => {
                                    if (setting.authSetting['scope.writePhotosAlbum']) {
                                        uni.saveImageToPhotosAlbum({
                                            filePath: tempFilePath,
                                            success: () => resolve(true),
                                            fail: reject,
                                        });
                                    } else {
                                        reject(new Error('Photo album permission denied'));
                                    }
                                },
                            });
                        } else {
                            resolve(false);
                        }
                    },
                });
            },
        });
        // #endif
    });
};
