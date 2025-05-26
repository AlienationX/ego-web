<template>
    <view class="layout">
        <custom-waterfalls-flow :value="classList" imageKey="smallPicurl" :column="columnCount" :columnSpace="1"
            @imageClick="onImageClick">

            <!-- #ifdef MP-WEIXIN -->
            <template v-for="(item, index) in classList" :key="item._key">
                <view v-if="!item.isAd" class="card" :slot="'slot' + index">
                    <view class="card-content">
                        <text class="title">{{ item.description }}</text>
                        <view class="score">
                            <uni-icons type="star-filled" size="18" color="#f7cc5b"</uni-icons>
                            <text class="price">{{ item.score }}</text>
                        </view>
                    </view>
                </view>
                <view v-else class="card ad-card" :slot="'slot' + index">
                    <custom-ad-banner></custom-ad-banner>
                    <!-- <text>广告位</text> -->
                </view>
            </template>
            <!-- #endif -->

            <!-- #ifndef MP-WEIXIN -->
            <template v-slot:default="item">
                <view v-if="!item.isAd" class="card">
                    <view class="card-content">
                        <text class="title">{{ item.description }}</text>
                        <view class="score">
                            <uni-icons type="star-filled" size="18" color="#f7cc5b"</uni-icons>
                            <text class="price">{{ item.score }}</text>
                        </view>
                    </view>
                </view>
                <view v-else class="card ad-card">
                    <custom-ad-banner></custom-ad-banner>
                    <!-- <text>广告位</text> -->
                </view>
            </template>
            <!-- #endif -->

        </custom-waterfalls-flow>
    </view>
</template>

<script setup>
    import {
        ref,
        computed,
        onMounted
    } from 'vue'

    const props = defineProps({
        classList: {
            type: Array,
            default: () => []
        }
    })

    // 生成带广告的列表
    const listWithAds = computed(() => {
        const arr = []
        let adCount = 0
        props.classList.forEach((item, idx) => {
            arr.push({
                ...item,
                _key: String(item.id)
            })
            if ((idx + 1) % 12 === 0) {
                adCount++
                arr.push({
                    isAd: true,
                    _key: 'ad-' + adCount
                })
            }
        })
        return arr
    })

    const onImageClick = (item) => {
        if (!item.isAd) {
            uni.navigateTo({
                url: `/pages/preview/preview?id=${item.id}`
            })
        }
    }

    // 动态计算列值
    const columnCount = ref(3)
    const calcColumn = () => {
        let width = uni.getSystemInfoSync().windowWidth
        if (width >= 1440) {
            columnCount.value = 6
        } else if (width >= 1080) {
            columnCount.value = 5
        } else if (width >= 720) {
            columnCount.value = 4
        } else {
            columnCount.value = 3
        }
    }

    onMounted(() => {
        calcColumn()
        if (typeof window !== 'undefined') {
            // 增加监听窗口大小变化事件，resize触发计算列值函数
            window.addEventListener('resize', calcColumn)
        }
    })
</script>

<style lang="scss" scoped>
    .layout {
        padding: 10rpx;

        .card {
            position: relative;
            margin-bottom: 4rpx;
            background: #fff;
            border-radius: 10rpx;
            overflow: hidden;
            box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
            display: flex;
            flex-direction: column;

            /* 让 custom-waterfalls-flow 渲染的图片也有圆角 */
            ::v-deep image {
                border-radius: 10rpx !important;
                display: block;
                width: 100%;
            }

            .card-content {
                padding: 10rpx 8rpx 8rpx 8rpx;

                .title {
                    font-size: 24rpx;
                    color: #333;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .price {
                    color: #28b389;
                    font-size: 30rpx;
                    font-weight: bold;
                    margin-top: 6rpx;
                }
            }
        }

        .ad-card {
            min-height: 120rpx;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #fff;
            border-radius: 10rpx;
            box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
            margin-bottom: 4rpx;
            /* 保证和图片卡片宽度一致 */
        }
    }
</style>