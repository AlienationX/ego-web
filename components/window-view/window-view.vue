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
</script>

<style lang="scss" scoped>
    .layout {
        .list {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20rpx;
            padding: 20rpx;

            .item {
                height: 440rpx;
                border-radius: 24rpx;
                // x 偏移量 | y 偏移量 | 阴影模糊半径 | 阴影颜色 */
                // box-shadow: 0 8px 24rpx rgba(0,0,0,0.15);
                box-shadow: 0 0 8rpx rgba(0, 0, 0, 0.85);

                .img {
                    width: 100%;
                    height: 100%;
                    display: block;
                    border-radius: 24rpx;
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
