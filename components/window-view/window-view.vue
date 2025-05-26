<template>
    <view class="layout">
        <view class="list">
            <template v-for="(item, idx) in classList" :key="item.id">

                <navigator :url="`/pages/preview/preview?id=${item.id}`" class="item">
                    <image :src="item.smallPicurl" mode="aspectFill"></image>
                </navigator>
                <!-- 每12个图片后插入广告 -->
                <view v-if="(idx + 1) % 12 === 0" class="ad-row">
                    <custom-ad-banner></custom-ad-banner>
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

                image {
                    width: 100%;
                    height: 100%;
                    display: block;
                    border-radius: 10rpx;
                }
            }

            .ad-row {
                grid-column: 1 / -1;
                margin: 10rpx 0;
                display: flex;
                justify-content: center;
            }
        }

    }
</style>