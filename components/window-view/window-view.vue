<template>
    <view class="layout">
        <view class="list">
            <template v-for="(item, idx) in classList" :key="item.id">

                <navigator :url="`/pages/preview/preview?id=${item.id}`" class="item">
                    <image :src="item.smallPicurl" mode="aspectFill" class="img"></image>
                </navigator>
                
                <!-- 每12个图片后插入广告 -->
                <view v-if="(idx + 1) % 12 === 0" class="ad-row">
                    <custom-ad-banner></custom-ad-banner>
                    <!-- <image :src="item.smallPicurl" mode="aspectFill" class="img"></image> -->
                    <!-- view class="ad-view">
                        <ad :adpid="1760125998"></ad>
                    </view> -->
                </view>

            </template>
        </view>
    </view>
</template>

<script setup>
    const props = defineProps({
        classList: {
            type: Array,
            default: () => ([{
                id: "0",
                smallPicurl: "/common/images/logo_Obsidian_Light_Raw.png",
                description: "默认描述",
                score: 0
            }])
        }
    })
    
    // import {ref, nextTick} from "vue";
    // import {onLoad} from "@dcloudio/uni-app";
    
    // const adBannerRef=ref(null);
    
    // onLoad(() => {
    //     // 等待 DOM 渲染完成
    //     nextTick(() => {
    //         const height = adBannerRef.value.offsetHeight; // 获取高度（单位：px）
    //         console.log("div 高度:", height);
    //     });
    // });
</script>

<style lang="scss" scoped>
    .layout {

        .list {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10rpx;
            padding: 10rpx;

            .item {
                height: 440rpx;

                .img {
                    width: 100%;
                    height: 100%;
                    display: block;
                    border-radius: 10rpx;
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