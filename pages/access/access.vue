<template>

    <view class="layout">
        <view class="header">

            <!-- <view class="statusBar" :style="{height: getStatusBarHeight() + 'px'}"></view>
            <view class="titleBar" :style="{height: getTitleBarHeight() + 'px'}">
                Access-Key获取
            </view> -->

            <view class="title">
                多种获取Access-Key的方式
            </view>
            <view class="subtitle">
                按需选择适合自己的方式
            </view>
        </view>

        <uni-collapse ref="collapseRef" accordion>

            <uni-collapse-item :open="true" title="观看广告获取或增加使用次数"
                thumb="https://qiniu-web-assets.dcloud.net.cn/unidoc/zh/unicloudlogo.png">
                <view class="content">
                    <view class="text1">
                        <uni-icons type="list" size="18"></uni-icons>
                        使用说明：
                    </view>
                    <view class="text2">
                        在输入框中输入自己的用户名，点击按钮观看广告，观看完广告后会增加使用次数，连续观看广告可以累计使用次数。
                    </view>
                    <view class="text3">Access-Key：</view>
                    <input placeholder="请输入您的用户名" @input="onKeyInput" />
                    <view class="text4" v-show="firstData.times">次数：<text>{{firstData.times}}</text></view>
                    <view class="text5" v-show="firstData.validDate">有效期至：<text>{{firstData.validDate}}</text></view>
                    <button @click="onTimes">点击观看广告，增加使用次数</button>
                </view>
            </uni-collapse-item>

            <uni-collapse-item title="观看广告增加key的有效日期"
                thumb="https://qiniu-web-assets.dcloud.net.cn/unidoc/zh/unicloudlogo.png">
                <view class="content">
                    <view class="text1">
                        <uni-icons type="list" size="18"></uni-icons>
                        使用说明：
                    </view>
                    <view class="text2">
                        在输入框中输入自己的用户名，点击按钮观看广告，即可延长key的有效日期，最多延长7天。
                    </view>
                    <view class="text3">Access-Key：</view>
                    <input placeholder="请输入您的用户名" @input="onKeyInput" />
                    <view class="text4" v-show="secondData.times">次数：<text>{{secondData.times}}</text></view>
                    <view class="text5" v-show="secondData.validDate">有效期至：<text>{{secondData.validDate}}</text></view>
                    <button @click="onValidDate">点击观看广告，增加key的有效日期</button>
                </view>
            </uni-collapse-item>

        </uni-collapse>

        <!-- 广告位 -->
    </view>

</template>

<script setup>
    import {
        ref,
        nextTick
    } from 'vue';
    import {
        getStatusBarHeight,
        getTitleBarHeight
    } from '@/utils/system.js';

    const collapseRef = ref(null);
    const inputValue = ref("");
    const firstData = ref({})
    const secondData = ref({})

    const onKeyInput = (e) => {
        inputValue.value = e.detail.value;
    }


    const onTimes = async (e) => {
        if (inputValue.value.trim() === "") {
            uni.showToast({
                title: '请输入您的用户名',
                icon: "none"
            })
            firstData.value = {}

        } else {
            // console.log(e);
            console.log(inputValue.value);
            // TODO request data

            firstData.value = {
                "times": 2,
                "validDate": "2025-05-01 23:59:59"
            }
        }

        // 需要手动resize 更新组件高度
        await nextTick(); // 等待 DOM 更新
        collapseRef.value.resize(); // 调用组件方法
    }

    const onValidDate = async (e) => {
        if (inputValue.value.trim() === "") {
            uni.showToast({
                title: '请输入您的用户名',
                icon: "none"
            })
            secondData.value = {}

        } else {
            console.log(e);
            console.log(inputValue.value);
            secondData.value = {
                "times": 2,
                "validDate": "2025-05-01 23:59:59"
            }
        }

        // 需要手动resize 更新组件高度
        await nextTick(); // 等待 DOM 更新
        collapseRef.value.resize(); // 调用组件方法
        // await nextTick(() => { collapseRef.value.resize(); })
    }
</script>

<style lang="scss" scoped>
    .layout {
        box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

        .header {
            background-color: #0078d4;
            /* 微软蓝 */


            .titleBar {
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32rpx;
                color: white;
                text-align: center;
            }

            .title {
                font-size: 48rpx;
                font-weight: bold;
                color: #EEEEEE;
                padding-top: 30rpx;
                text-align: center;
            }

            .subtitle {
                font-size: 32rpx;
                font-weight: bold;
                color: #FFBA08;
                padding: 30rpx;
                text-align: center;
            }
        }


        .content {
            background-color: #f3f2f1;
            /* 微软浅灰 */
            padding: 30rpx;
            border: 2rpx solid #e1dfdd;

            .text1 {
                margin-bottom: 20rpx;
                color: #323130;
                /* 微软深灰 */
                font-size: 32rpx;
                font-weight: 600;
            }

            .text2 {
                margin-bottom: 30rpx;
                color: #605e5c;
                /* 微软次要文字颜色 */
                font-size: 28rpx;
            }

            .text3,
            .text4,
            .text5 {
                margin-bottom: 20rpx;
                font-size: 28rpx;
                font-weight: 600;
            }

            .text3 {
                color: #D84315;
            }

            text {
                margin-bottom: 20rpx;
                color: #D84315;
                font-size: 28rpx;
                font-weight: 600;
            }

            input {
                margin-bottom: 30rpx;
                padding: 20rpx;
                border: 1rpx solid #c8c6c4;
                /* 微软浅灰边框 */
                border-radius: 8rpx;
                font-size: 28rpx;
                background-color: #ffffff;
                color: #323130;

                &:focus {
                    border-color: #2196F3;
                    box-shadow: 0 0 8px rgba(33, 150, 243, 0.5);
                    transform: translateY(-1px);
                    /* 轻微上移增强反馈 */
                }
            }

            button {
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #0078d4;
                /* 微软蓝 */
                height: 88rpx;
                color: white;
                border: none;
                padding: 20rpx 40rpx;
                border-radius: 8rpx;
                font-size: 32rpx;
                font-weight: bold;
                cursor: pointer;
                transition: background-color 0.3s ease, transform 0.2s ease;
                box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.2);

                &:hover {
                    background-color: #005a9e;
                    /* 微软深蓝 */
                }

                &:active {
                    transform: scale(0.98);
                }

                i {
                    margin-right: 16rpx;
                    font-size: 32rpx;
                }
            }
        }
    }
</style>