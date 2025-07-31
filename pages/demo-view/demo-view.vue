<template>
    <div class="container">
        <!-- 切换按钮 -->
        <button @click="toggleLayout" class="toggle-btn">
            {{ isWaterfall ? '切换为Grid布局' : '切换为瀑布流' }}
        </button>

        <!-- 布局容器 -->
        <div ref="containerRef" :class="['layout-container', { 'waterfall-mode': isWaterfall }]">
            <div v-for="(item, index) in images" :key="index" :style="isWaterfall ? item.position : ''" class="image-item">
                <img :src="item.url" @load="isWaterfall && updateLayout(index)" :class="{ 'grid-img': !isWaterfall }" />
            </div>
        </div>
    </div>
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

    for (let i = 0; i < 30; i++) {
        let width = 200 + Math.floor(Math.random() * 10) * 50;
        let height = 300 - Math.floor(Math.random() * 10) * 20;
        let obj = {
            url: `https://picsum.photos/${width}/${height}?random=${i}`,
            width: width,
            height: height,
            position: {}
        };
        images.value.push(obj); // 将对象添加到数组中
    }

    // 2. 布局状态
    const isWaterfall = ref(false);
    const containerRef = ref(null);
    const columnHeights = ref([]);
    const gap = 10; // 元素间距

    // 3. 瀑布流核心算法
    const calculateLayout = () => {
        const containerWidth = containerRef.value.clientWidth;
        const minColWidth = 200; // 最小列宽
        const columnCount = Math.floor(containerWidth / minColWidth);
        const colWidth = (containerWidth - (columnCount - 1) * gap) / columnCount;

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
    };

    // 4. 图片加载完成后更新布局
    const updateLayout = (index) => {
        const img = containerRef.value.children[index].querySelector('img');
        images.value[index].width = img.naturalWidth;
        images.value[index].height = img.naturalHeight;
        calculateLayout();
    };

    // 5. 窗口变化监听
    const resizeObserver = new ResizeObserver(() => {
        if (isWaterfall.value) calculateLayout();
    });

    // 6. 布局切换
    const toggleLayout = () => {
        isWaterfall.value = !isWaterfall.value;
        if (isWaterfall.value) {
            nextTick(() => calculateLayout());
        }
    };

    onMounted(() => {
        if (isWaterfall.value) calculateLayout();
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
