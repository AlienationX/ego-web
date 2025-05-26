<template>
    <view class="layout">
        <view class="loadingLayout" v-if="Object.keys(detail).length === 0">
            <uni-load-more status="loading"></uni-load-more>
        </view>
        
        <view class="title">
            <view class="tag" v-if="detail.select">
                <uni-tag text="置顶" type="error" inverted></uni-tag>
            </view>
            <view class="font">
                {{detail.title}}
            </view>
        </view>
        <view class="info">
            <view class="item">
                {{detail.author}}
            </view>
            <view class="item">
                <uni-dateformat :date="detail.publish_date" format="yyyy/MM/dd"></uni-dateformat>
            </view>
        </view>

        <view class="content">

            <!-- 内置组件，可以显示html格式 -->
            <rich-text :nodes="detail.content"></rich-text>

            <!-- 安装第三方组件 mp-html -->
            <!-- <mp-html :content="detail.content"></mp-html> -->
        </view>

        <view class="count" v-if="detail.view_count">
            阅读 {{detail.view_count}}
        </view>
    </view>
</template>

<script setup>
    import {
        ref
    } from "vue";
    import {
        apiGetNotice,
        apiGetNoticeDetail
    } from "@/api/wallpaper.js";
    import {
        onLoad
    } from "@dcloudio/uni-app";

    const detail = ref({})

    const getNoticeDetail = async () => {
        let res = await apiGetNoticeDetail({}, noticeid)
        detail.value = res.data;

        // 如果title存在，则设置navigation bar title
        if (name !== undefined) {
            uni.setNavigationBarTitle({
                title: name
            })
        }
    }

    let noticeid;
    let name;
    onLoad((e) => {
        // console.log(e);
        noticeid = parseInt(e.id)
        name = e.name
        getNoticeDetail()
    })
</script>

<style lang="scss" scoped>
    .layout {
        padding: 30rpx;

        .title {
            font-size: 40rpx;
            color: #111;
            line-height: 1.6em;
            padding-bottom: 30rpx;
            display: flex;

            .tag {
                transform: scale(0.8);
                transform-origin: left center;
                flex-shrink: 0;
            }

            .font {
                padding-left: 6rpx;
            }
        }

        .info {
            display: flex;
            align-items: center;
            color: #999;
            font-size: 28rpx;

            .item {
                padding-right: 20rpx;
            }
        }

        .content {
            padding: 50rpx 0;
        }

        .count {
            color: #999;
            font-size: 28rpx;
        }
    }
</style>