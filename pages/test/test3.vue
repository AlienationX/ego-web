<template>
    <!-- <div class="container"> -->

    <!-- 布局容器 -->
    <div ref="containerRef" :class="['layout-container', { 'waterfall-mode': isWaterfall }]">
        <div v-for="(item, index) in images" :key="index" :style="isWaterfall ? item.position : ''" class="image-item">
            <img :src="item.url" @load="updateLayout(index)" :class="{ 'grid-img': !isWaterfall }" />
        </div>
    </div>
    <!-- </div> -->
</template>

<script setup>
    import { ref, onMounted, onUnmounted, nextTick } from 'vue';

    // 1. 图片数据（20张不同尺寸图片）
    // const images = ref(
    //   Array.from({ length: 20 }, (_, i) => ({
    //     url: `https://picsum.photos/${200 + i * 50}/${300 - i * 10}?random=${i}`,
    //     width: 200 + i * 50,
    //     height: 300 - i * 10,
    //     position: {}
    //   }))
    // );

    const images = ref([]);

    const items = ref([
        { url: 'https://wallpaper-kpze6c.s3.eu-north-1.amazonaws.com/pics/classify_4/1742264636709_5_small.webp' },
        { url: '/common/images/pics/ad_pic1.jpg' },
        { url: 'https://wallpaper-kpze6c.s3.eu-north-1.amazonaws.com/pics/classify_4/1742264636551_1_small.webp' },
        { url: '/common/images/pics/ad_pic2.jpg' },
        { url: 'https://wallpaper-kpze6c.s3.eu-north-1.amazonaws.com/pics/classify_4/1726307754755_7_small.webp' },
        { url: '/common/images/logo_Obsidian_Dark.png' },
        { url: 'https://wallpaper-kpze6c.s3.eu-north-1.amazonaws.com/pics/classify_1/1739092323417_2_small.webp' }
    ]);

    images.value = items.value.map((item) => {
        let obj = {
            ...item,
            width: 0,
            height: 0,
            position: {}
        };
        return obj;
    });

    // 2. 布局状态
    const isWaterfall = ref(true);
    const containerRef = ref(null);
    const columnHeights = ref([]);
    const gap = 10; // 元素间距

    // 3. 瀑布流核心算法
    const calculateLayout = () => {
        const containerWidth = containerRef.value.clientWidth;
        const minColWidth = 200; // 最小列宽
        const columnCount = Math.floor(containerWidth / minColWidth);
        const colWidth = (containerWidth - (columnCount - 1) * gap) / columnCount;
        console.log(containerWidth, minColWidth, columnCount, colWidth);

        columnHeights.value = new Array(columnCount).fill(0);

        images.value.forEach((item, index) => {
            const scaledHeight = (item.height * colWidth) / item.width;
            const minHeight = Math.min(...columnHeights.value);
            const colIndex = columnHeights.value.indexOf(minHeight);

            images.value[index].position = {
                width: `${colWidth}px`,
                height: `${scaledHeight}px`,
                left: `${colIndex * (colWidth + gap)}px`,
                top: `${columnHeights.value[colIndex]}px`
            };

            columnHeights.value[colIndex] += scaledHeight + gap;
        });

        console.log(images.value);
        console.log(columnHeights.value);
    };

    // 4. 图片加载完成后更新布局
    const updateLayout = (index) => {
        // 获取图片的原始尺寸，页可以使用img.onload获取设置
        const img = containerRef.value.children[index].querySelector('img');
        images.value[index].width = img.naturalWidth;
        images.value[index].height = img.naturalHeight;
        calculateLayout();
    };

    // 5. 窗口变化监听
    const resizeObserver = new ResizeObserver(() => {
        calculateLayout();
    });

    onMounted(() => {
        calculateLayout();
        resizeObserver.observe(containerRef.value);
    });

    onUnmounted(() => {
        resizeObserver.disconnect();
    });
</script>

<style scoped>
    /* 基础布局容器 */
    .layout-container {
        margin: 20px;
        position: relative;
        min-height: 100vh;
    }

    /* Grid布局模式 */
    .layout-container:not(.waterfall-mode) {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
    }

    /* 瀑布流模式 */
    .waterfall-mode .image-item {
        position: absolute;
        transition: all 0.3s ease;
    }

    /* 图片通用样式 */
    img {
        width: 100%;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    /* Grid布局图片高度控制 */
    .grid-img {
        height: 200px;
        object-fit: contain;
    }

    /* 切换按钮 */
    .toggle-btn {
        padding: 12px 24px;
        background: #42b883;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin: 20px;
    }
</style>
