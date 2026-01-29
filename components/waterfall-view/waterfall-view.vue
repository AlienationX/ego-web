<template>
    <!-- 布局容器 -->
    <view class="container" ref="containerRef">

        <view class="box" :style="item.position" v-for="item in images" :key="item.id">
            <image class="img" :src="item.smallPicurl" @load="(e) => updateLayout(e, item.id)" mode="widthFix"></image>
            
            <!-- <view class="card-content">
                <text class="title">{{ item.description }}</text>
                <view class="score">
                    <uni-icons type="star-filled" size="18" color="#f7cc5b"></uni-icons>
                    <text class="price">{{ item.score }}</text>
                </view>
            </view> -->
        </view>
    </view>
</template>

<script setup>
    import { ref, onMounted, onUnmounted, nextTick, watch, computed, getCurrentInstance } from 'vue';
    import { onLoad, onUnload, onReady } from '@dcloudio/uni-app';
    import { useSettingsStore } from '@/stores/settings.js';
    const settingsStore = useSettingsStore();

    const props = defineProps({
        classList: {
            type: Array,
            default: () => [
                {
                    id: '0',
                    smallPicurl: '/static/images/logo_Obsidian_Light_Raw.png',
                    description: '默认描述',
                    score: 0
                }
            ]
        }
    });
    
    const images = ref([]);
    
    // 计算扩展后的数据
    const extendItems = (items) => {
      return items.map(item => ({
        ...item,
        width: 0,
        height: 0,
        position: {}
      }))
    }
    
    // 监听原始数据变化
    watch(() => props.classList, (newItems, oldItems) => {
      console.log('原始数据变化，更新扩展项', newItems, oldItems)
      const listIds = new Set(oldItems.map(item => item.id))
      const addItems = newItems.filter(item => !listIds.has(item.id))
      images.value = [...oldItems, ...addItems]
    }, { deep: true })
    
    // watch(() => props.classList, (newItems) => {
    //   console.log('原始数据变化，更新扩展项', newItems)
    //   images.value = extendItems(newItems)
    // }, { deep: true })

    console.log("images >>>", images.value);

    const containerRef = ref(null);
    const containerWidth = ref(0);
    const columnCount = ref(3);
    const columnHeights = ref(new Array(columnCount.value).fill(0));
    const gap = 10; // 元素间距

    // 组件中不支持onReady，onReady是页面Page的生命周期函数，组件只能使用onMounted
    onMounted(() => {
        console.log('onMount...');

        // #ifdef MP
        const query = uni.createSelectorQuery().in(getCurrentInstance());
        console.log(query);
        query
            .select('#containerRef')
            .boundingClientRect((res) => {
                if (res) {
                    containerWidth.value = res.width;
                    console.log('容器宽度:', res.width);
                } else {
                    console.log('容器宽度: error');
                }
            })
            .exec();
        // #endif

        // #ifndef MP
        // view好像必须使用 $el 才能获取到宽度
        containerWidth.value = containerRef.value.$el.clientWidth;
        // #endif
    });

    const columnWidth = computed(() => {
        // if (settingsStore.options.column === 3) {
            
        // }else {
            
        // }
        return (containerWidth.value - (columnCount.value - 1) * gap) / columnCount.value;
    });

    const updateLayout = (e, id) => {
        // 获取图片的原始尺寸，页可以使用img.onload获取设置
        console.log('e', e);
        console.log('index', id);

        const width = e.detail.width;
        const height = e.detail.height;
        console.log(width, height, columnWidth.value);

        const scaledHeight = (height * columnWidth.value) / width;
        const minHeight = Math.min(...columnHeights.value);
        const colIndex = columnHeights.value.indexOf(minHeight);
        console.log(scaledHeight, minHeight, colIndex);

        const item = images.value.find((item) => item.id === id);
        item.width = width;
        item.height = height;
        item.position = {
            width: `${columnWidth.value}px`,
            height: `${scaledHeight}px`,
            left: `${colIndex * (columnWidth.value + gap)}px`,
            top: `${columnHeights.value[colIndex]}px`
        };
        console.log(item);
        console.log(columnHeights.value);

        columnHeights.value[colIndex] += scaledHeight + gap;

        console.log(images.value);
        console.log(columnHeights.value);
    };

    // // 5. 窗口变化监听
    // // #ifndef MP
    // const resizeObserver = new ResizeObserver(() => {
    //     calculateLayout();
    // });

    // onMounted(() => {
    //     // calculateLayout();
    //     resizeObserver.observe(containerRef.value);
    // });

    // onUnmounted(() => {
    //     resizeObserver.disconnect();
    // });
    // // #endif

    // onMounted(() => {
    //     nextTick(() => calculateLayout());

    // });
</script>

<style lang="scss" scoped>
    .container {
        // margin: 20px;
        position: relative;
        // min-height: 100vh;
        // width: 500px;

        .box {
            position: absolute;
            transition: all 0.3s ease;

            .img {
                width: 100%;
                height: 100%;
                // display: block;
            }
            
            .card-content {
            //     padding: 10rpx 8rpx 8rpx 8rpx;
            
                .title {
                    font-size: 24rpx;
                    color: #333;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            
                .price {
                    color: $wp-theme-color;
                    font-size: 30rpx;
                    font-weight: bold;
                    margin-top: 6rpx;
                }
            }
        }
    }
</style>
