<template>
    <!-- <view :class="['container', { 'waterfall-mode': isWaterfall }]" ref="containerRef"> -->
    <view class="container" ref="containerRef">
        <view class="layout" :style="styles.layout">
            <template v-for="(item, idx) in images" :key="item.id">
                <navigator class="box" :style="[styles.box, isWaterfall ? item.position : '']" :url="`/pages/preview/preview?id=${item.id}`">
                    <image :class="['img', { loaded: item.loaded, shadow: item.loaded }]" :style="styles.img" :src="item.smallPicurl" :mode="imageMode" lazy-load></image>
                    <view :class="['lock', { loaded: item.loaded }]" :style="styles.lock">
                        <uni-icons v-if="item.is_locked && item.loaded" type="locked-filled" :size="lockedSize" color="#F9E9B5"></uni-icons>
                    </view>

                    <!-- <view class="card-content" v-if="isWaterfall">
                    <text class="title">{{ item.description }}</text>
                    <view class="score">
                        <uni-icons type="star-filled" size="18" color="#f7cc5b"></uni-icons>
                        <text class="star">{{ item.score }}</text>
                    </view>
                </view> -->
                </navigator>

                <!-- TODO 每12个图片后插入广告，但是不显示，存在bug -->
                <!-- <view v-if="(idx + 1) % 12 === 0" class="ad-row">
                    <custom-ad-banner></custom-ad-banner>
                </view> -->
            </template>
        </view>
    </view>
</template>

<script setup>
    import { ref, reactive, watch, computed, onMounted, toRef, toRefs } from 'vue';
    import { onLoad, onUnload, onReady } from '@dcloudio/uni-app';
    import { useSettingsStore } from '@/stores/settings.js';
    const settingsStore = useSettingsStore();

    const props = defineProps({
        classList: {
            type: Array,
            default: () => [
                {
                    id: '0',
                    smallPicurl: '/common/images/logo_Obsidian_Light_Raw.png',
                    description: '默认描述',
                    score: 0
                }
            ]
        }
    });

    const images = ref([]);

    // const { classList } = toRefs(props)
    // const classList = toRef(props, 'classList');

    // const extendItem = (item) => {
    //     return {
    //         ...item,
    //         width: 0,
    //         height: 0,
    //         position: {},
    //         loaded: false
    //     };
    // };

    // 监听原始数据变化
    watch(
        () => props.classList,
        (newVal, oldVal) => {
            // console.log('watch classList >>>>>>>>', newVal, oldVal);

            // 如果newVal是undefined或null，则还未初始化则返回
            // if (!oldVal) { console.log("1"); return};

            // 父组件的 onQuery 的 init(sortord, [...pendingList.value]) 导致 classList 被重新赋值，会触发一次watch
            if (JSON.stringify(newVal) === JSON.stringify(oldVal)) return;

            if (newVal.length <= oldVal.length) {
                // 点击推荐、评分等标签，数据全部替换的处理
                updateLayout();
                const addVal = newVal.map((item) => reactive(JSON.parse(JSON.stringify(item)))); // 深拷贝，props是只读不建议直接修改
                loadImages(addVal);
                images.value = addVal;
            } else {
                // 下拉新增数据的处理
                const listIds = new Set(oldVal.map((item) => item.id));
                const addVal = newVal.filter((item) => !listIds.has(item.id)).map((item) => reactive(JSON.parse(JSON.stringify(item))));
                // addVal.map((item) => updatePositionSync(item));
                // addVal.forEach((item) => updatePositionSync(item));
                loadImages(addVal);
                images.value.push(...addVal);
            }

            // console.log('watch images object >>>>>>>>', JSON.parse(JSON.stringify(images.value)));
            // console.log('watch images ref >>>>>>>>', images.value);
        }
        // { immediate: true } // 初始化时立即执行
    );

    // 监控列数变化，重新计算layout和position
    watch(
        () => settingsStore.options.column,
        (newVal) => {
            if (newVal === 3) {
                waterfallLayout.columnCount = 3;
                gap.value = 10;
            } else {
                waterfallLayout.columnCount = 2;
                gap.value = 15;
            }

            updateLayout();
            images.value.map((item) => {
                updatePostion(item);
            });
        }
        // { deep: true }
    );

    // 瀑布流计算
    const imageMode = ref('');
    const containerRef = ref(null);
    const lockedSize = ref(18);

    const waterfallLayout = reactive({
        width: 0,
        height: 0,
        columnCount: 3,
        columnWidth: 0,
        columnHeights: []
    });
    const gap = ref(10); // 元素间距

    const isWaterfall = computed(() => settingsStore.options.view !== 'window');

    // discarded 策略模式实现组合逻辑
    const strategies = {
        window2: () => {
            // do something
        },
        window3: () => {},
        waterfall2: () => {},
        waterfall3: () => {},
        default: () => {
            // 默认处理逻辑
            console.log('输入错误');
        }
    };

    // discarded 输入策略模式key，执行处理逻辑
    const handleConditions = (view, column) => {
        const key = `${view}${column}`;
        if (strategies[key]) {
            strategies[key]();
        }
    };

    const styles = computed(() => {
        // return handleConditions(settingsStore.options.view, settingsStore.options.column)

        const stylesObj = {};
        // 这里返回有大括号，所以上面直接使用即可，:style="styles.layout"

        if (settingsStore.options.view === 'window') {
            imageMode.value = 'aspectFill';

            stylesObj.layout = {
                display: 'grid',
                gridTemplateColumns: `repeat(${waterfallLayout.columnCount}, 1fr)`,
                gap: `${gap.value}px`,
                padding: `${gap.value}px`,
                transition: 'grid-template-columns 0.8s ease' // 过度动画，使布局变化更加平滑
            };
            stylesObj.box = {
                height: settingsStore.options.column === 3 ? '480rpx' : '560rpx',
                position: 'relative'
            };
        } else {
            imageMode.value = 'widthFix';

            stylesObj.layout = {
                position: 'relative',
                height: `${waterfallLayout.height}px`,
                padding: `${gap.value}px`
            };
            stylesObj.box = {
                position: 'absolute'
            };
        }

        let borderRadius, lockDistance, boxShadow;
        if (settingsStore.options.column === 3) {
            lockedSize.value = 18;
            waterfallLayout.columnCount = 3;
            borderRadius = '24rpx';
            lockDistance = '6rpx';
            boxShadow = '0 0 8rpx rgba(0, 0, 0, 0.85)';
        } else {
            lockedSize.value = 22;
            waterfallLayout.columnCount = 2;
            borderRadius = '42rpx';
            lockDistance = '12rpx';
            boxShadow = '0 0 12rpx rgba(0, 0, 0, 0.85)';
        }

        stylesObj.boxShadow = boxShadow;
        stylesObj.box = {
            ...stylesObj.box,
            borderRadius: borderRadius,
            transition: 'all 0.5s ease'
        };
        stylesObj.img = {
            borderRadius: borderRadius
        };
        stylesObj.lock = {
            top: lockDistance,
            right: lockDistance
        };

        return stylesObj;
    });

    const updateLayout = () => {
        // #ifdef WEB
        const containerWidth = containerRef.value.$el.clientWidth;
        // #endif
        // #ifndef WEB
        const { screenWidth: containerWidth } = uni.getSystemInfoSync();
        // #endif

        // console.log('containerWidth', containerWidth);

        // layout如果没有边距就是 (waterfallLayout.columnCount - 1) * gap.value
        // layout如果存在边距就是 (waterfallLayout.columnCount + 1) * gap.value ，前后都需要所以是增加2
        waterfallLayout.columnWidth = (containerWidth - (waterfallLayout.columnCount + 1) * gap.value) / waterfallLayout.columnCount;
        waterfallLayout.columnHeights = new Array(waterfallLayout.columnCount).fill(0);

        // console.log('layout', waterfallLayout.columnCount, gap.value, waterfallLayout.columnWidth, waterfallLayout.columnHeights);
    };

    // discarded
    // 绑定 uniapp image 的 onload 异步函数 图片加载完成后更新布局
    const updateSize = (e, id) => {
        // 获取图片的原始尺寸，页可以使用img.onload获取设置
        // console.log('e', e);
        console.log('------', 'id', id);

        const width = e.detail.width;
        const height = e.detail.height;

        const item = images.value.find((item) => item.id === id);
        item.width = width;
        item.height = height;

        updatePostion(item);
    };

    const updatePostion = (item) => {
        const scaledHeight = (item.height * waterfallLayout.columnWidth) / item.width;
        const minHeight = Math.min(...waterfallLayout.columnHeights);
        const colIndex = waterfallLayout.columnHeights.indexOf(minHeight);

        item.position = {
            width: `${waterfallLayout.columnWidth}px`,
            height: `${scaledHeight}px`,
            left: `${colIndex * (waterfallLayout.columnWidth + gap.value) + gap.value}px`,
            top: `${waterfallLayout.columnHeights[colIndex] + gap.value}px`
        };
        // console.log('updatePosition', item, item.position);

        waterfallLayout.columnHeights[colIndex] += scaledHeight + gap.value;
        waterfallLayout.height = Math.max(...waterfallLayout.columnHeights); // 设置绝对布局layout的高度，没有高度无法撑起布局
    };

    // discarded
    async function updatePositions() {
        const promises = images.value.map(
            (item) =>
                new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        item.width = img.naturalWidth;
                        item.height = img.naturalHeight;
                        resolve({
                            msg: item.id
                        });
                    };
                    img.src = item.smallPicurl;
                })
        );

        // 等待所有异步操作执行完毕，再顺序计算所有position，每次都计算耗费性能，且图片同时出现瀑布流效果不好
        const results = await Promise.all(promises);
        results.forEach((item) => {
            console.log(item);
        });
        images.value.map((item) => {
            updatePostion(item);
        });
    }

    function loadImage(item) {
        return new Promise((resolve, reject) => {
            // const img = new Image();
            // img.onload = () => {
            //     item.width = img.naturalWidth;
            //     item.height = img.naturalHeight;
            //     resolve({
            //         msg: item.id
            //     });
            // };
            // img.onerror = function () {
            //     reject(new Error('Failed to load image: ' + url)); // 图片加载失败时，抛出错误
            // };
            // img.src = item.smallPicurl; // 设置图片的 URL

            uni.getImageInfo({
                src: item.smallPicurl, // 微信小程序 开发者工具 不支持webp文件格式？使用picurl就不报错
                success: (res) => {
                    item.width = res.width;
                    item.height = res.height;
                    item.loaded = true;
                    resolve({
                        msg: item.id
                    });
                },
                fail: (err) => {
                    // 获取失败
                    reject(err);
                }
            });
        });
    }

    async function loadImages(addItems) {
        // map和forEach为同步方法，无法按照顺序执行 await ，为了保证顺序必须使用 for 循环
        for (const item of addItems) {
            try {
                const msg = await loadImage(item); // 等待图片加载完成
                updatePostion(item);
                // console.log(msg, item.position);
            } catch (error) {
                console.error(error);
            }
        }
    }

    onMounted(() => {
        updateLayout();
    });

    //  // 窗口变化监听
    //  const resizeObserver = new ResizeObserver(() => {
    //      if (isWaterfall.value) calculateLayout();
    //  });

    // // 根据屏幕宽度调整列数
    // const updateColumnCount = () => {
    //   const screenWidth = uni.getSystemInfoSync().screenWidth
    //   if (screenWidth > 750) { // rpx 750 相当于屏幕宽度
    //     waterfallLayout.columnCount = 3
    //   } else {
    //     waterfallLayout.columnCount = 2
    //   }
    // }

    //  onMounted(() => {
    //      if (isWaterfall.value) calculateLayout();
    //      resizeObserver.observe(containerRef.value);
    //  });

    //  onUnmounted(() => {
    //      resizeObserver.disconnect();
    //  });

    // discarded 布局切换，对外暴露
    const toggleLayout = () => {
        isWaterfall.value = !settingsStore.options.view === 'window';
        if (isWaterfall.value) {
            nextTick(() => calculateLayout());
        }
    };

    // 暴露属性给父组件
    defineExpose({
        toggleLayout
    });
</script>

<style lang="scss" scoped>
    .container {
        .layout {
            .box {
                .img {
                    width: 100%;
                    height: 100%;
                    display: block;
                    // object-fit: cover;
                    opacity: 0;
                    transform: scale(0.85);
                    transition: opacity 0.5s ease 0.2s, transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s;

                    &:hover {
                        transform: scale(1.02);
                    }
                }

                .shadow {
                    box-shadow: v-bind('styles.boxShadow');
                }

                .lock {
                    position: absolute;
                    // top: v-bind('styles.lock.top');
                    // right: v-bind('styles.lock.right');
                    opacity: 0;
                    transform: scale(0.85);
                    transition: opacity 0.5s ease 0.4s, transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.4s;
                }

                .loaded {
                    opacity: 1;
                    transform: scale(1);
                }

                .card-content {
                    // padding: 10rpx 8rpx 8rpx 8rpx;

                    position: absolute;
                    bottom: 5rpx;
                    left: 5rpx;

                    .title {
                        font-size: 24rpx;
                        // color: #333;
                        color: whitesmoke;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }

                    .score {
                        .star {
                            color: #28b389;
                            font-size: 30rpx;
                            font-weight: bold;
                            margin-top: 6rpx;
                        }
                    }
                }
            }

            .ad-row {
                grid-column: 1 / -1;
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
            }
        }
    }
</style>
