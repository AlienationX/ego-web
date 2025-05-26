<template>
    <view class="container">
        <!-- 瀑布流组件 -->
        <vue-waterfall-easy :imgsArr="classList" :gap="16" :width="imgWidth" :maxCols="3">
            <!-- 自定义图片容器 -->
            <template v-slot:img="slotProps">
                <view class="img-box">
                    <image :src="slotProps.value.smallPicurl" mode="widthFix" :style="{ width: imgWidth + 'px' }"/>
                    <view class="info">
                        <text class="title">{{ slotProps.value.description }}</text>
                        <text class="price">¥{{ slotProps.value.score }}</text>
                    </view>
                </view>
            </template>

        </vue-waterfall-easy>
    </view>
</template>

<script setup>
    defineProps({
        classList: {
            type: Object,
            // 对象的默认值必须使用方法定义
            default () {
                return {
                    id: "0",
                    smallPicurl: "/common/images/logo_Obsidian_Light_Raw.png",
                }
            }
        }
    })

    import {
        ref,
        onMounted,
        computed
    } from 'vue'
    import vueWaterfallEasy from 'vue-waterfall-easy'

    // 响应式布局配置
    const cols = computed(() => uni.getSystemInfoSync().windowWidth > 768 ? 3 : 2)

    const screenWidth = ref(375) // 屏幕宽度（默认375）

    // 计算图片宽度（适配不同屏幕）
    const imgWidth = computed(() => {
        const gap = 16 // 间隔
        return (screenWidth.value - gap * 2) / 3
    })

    const onclick = (id) => {
        uni.navigateTo({
            url: `/pages/preview/preview?id=${id}`
        })
    }
</script>

<style lang="scss" scoped>
    .container {
        padding: 20rpx;
        box-sizing: border-box;
        
        .img-box {
            background: #fff;
            border-radius: 12rpx;
            overflow: hidden;
            box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
        
            image {
                display: block;
                background: #f5f5f5;
            }
        
            .info {
                padding: 20rpx;
        
                .title {
                    font-size: 28rpx;
                    color: #333;
                    display: block;
                    margin-bottom: 10rpx;
                    //   @include text-ellipsis(2);
                }
        
                .price {
                    font-size: 32rpx;
                    color: #e4393c;
                    font-weight: bold;
                }
            }
        }
    }

    
</style>