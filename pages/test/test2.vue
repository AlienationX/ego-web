<template>
    <view class="container">
        <view class="box">
            <image ref="imgRef" class="img" :src="url" mode="widthFix"></image>
        </view>
        <view v-if="imageSize">宽度: {{ imgRef.width }}px, 高度: {{ imgRef.height }}px</view>
        
    </view>
    
</template>

<script setup>
    import { ref, onMounted, onUnmounted, reactive, computed, nextTick } from 'vue';
    // https://wallpaper-kpze6c.s3.eu-north-1.amazonaws.com/pics/classify_4/1742264636709_5_small.webp
    // https://wallpaper-kpze6c.s3.eu-north-1.amazonaws.com/pics/classify_4/1742264636780_4_small.webp

    const items = ref([
        {src: "https://wallpaper-kpze6c.s3.eu-north-1.amazonaws.com/pics/classify_4/1742264636709_5_small.webp"},
        {src: "/static/images/pics/ad_pic1.jpg"},
        {src: "https://wallpaper-kpze6c.s3.eu-north-1.amazonaws.com/pics/classify_4/1742264636551_1_small.webp"},
        {src: "/static/images/pics/ad_pic2.jpg"},
        {src: "https://wallpaper-kpze6c.s3.eu-north-1.amazonaws.com/pics/classify_4/1726307754755_7_small.webp"},
        {src: "/static/images/logo_Obsidian_Dark.png"},
        {src: "https://wallpaper-kpze6c.s3.eu-north-1.amazonaws.com/pics/classify_1/1739092323417_2_small.webp"},
    ]);
    
    const url = ref('https://wallpaper-kpze6c.s3.eu-north-1.amazonaws.com/pics/classify_4/1742264636709_5_small.webp');
    const imageSize = ref({ width: 0, height: 0 });
    const imgRef = ref(null);

    function getImgSize(url) {
        const img = new Image();
        // img.crossOrigin = "anonymous";
        img.onload = async function () {
            console.log(img.width);
        };

        img.src = url;
    }

    onMounted(() => {
    
        
        getImgSize(url.value)
        
        nextTick(() => {
              const image = new Image();
              
              image.onload = async () => {
                const width = image.width;
                const height = image.height;
                console.log(`Image size: ${width}px x ${height}px`);
              };
              
              image.src = url.value;
            });
    });
</script>

<style lang="scss" scoped>
    .container {
        .box {
            width: 180rpx;
            
            .img {
                width: 160px;
            }
        }
    }
</style>
