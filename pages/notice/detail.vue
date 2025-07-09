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
                {{ detail.title }}
            </view>
        </view>
        <view class="info">
            <view class="item">
                {{ detail.author }}
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

        <view class="count" v-if="detail.view_count">阅读 {{ detail.view_count }}</view>
    </view>
</template>

<script setup>
    import { ref, toRefs } from 'vue';
    import { apiGetNotice } from '@/api/wallpaper.js';
    import { onLoad } from '@dcloudio/uni-app';

    // UniApp 会将 URL 中的参数自动注入到 props
    const props = defineProps({
        id: String, // 公告id
        name: String // 公告title
    });

    // const { id:noticeId, name:noticeName } = toRefs(props);
    const { id, name } = toRefs(props);

    const detail = ref({});

    const getNoticeDetail = async () => {
        let res = await apiGetNotice({}, id.value);
        detail.value = res.data;

        // 如果title存在，则设置navigation bar title
        if (name.value !== undefined) {
            uni.setNavigationBarTitle({
                title: name.value
            });
        }
    };

    // let noticeId;
    // let noticeName;
    onLoad((e) => {
        // console.log(e);
        // noticeId = parseInt(e.id);
        // noticeName = e.name;
        getNoticeDetail();
    });
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
