<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <menu-bar class="menubar" :show-border="false" :show-toggle-menu="false">
            <!-- <template #title>{{ props.name }}</template> -->
            <template #title>{{ $t('index.notice') }}</template>
            <template #menuBtn></template>
        </menu-bar>

        <view class="container">
            <view class="loadingLayout" v-if="Object.keys(detail).length === 0">
                <uni-load-more status="loading"></uni-load-more>
            </view>

            <view class="title">
                <view class="tag" v-if="detail.select">
                    <uni-tag :text="isEn ? 'Top' : '置顶'" type="error" inverted></uni-tag>
                </view>
                <view class="font">
                    {{ isEn && detail.title_en ? detail.title_en : detail.title }}
                </view>
            </view>

            <view class="info">
                <view class="item">
                    <!-- {{ detail.author }} -->
                    {{ $t('common.admin') }}
                </view>
                <view class="item">
                    <uni-dateformat :date="detail.publish_date" format="yyyy/MM/dd"></uni-dateformat>
                </view>
            </view>

            <view class="content">
                <!-- 内置组件，可以显示html格式 -->
                <rich-text :nodes="isEn && detail.content_en ? detail.content_en : detail.content"></rich-text>

                <!-- 安装第三方组件 mp-html -->
                <!-- <mp-html :content="isEn && detail.content_en ? detail.content_en : detail.content"></mp-html> -->
            </view>

            <view class="count" v-if="detail.view_count">{{ isEn ? 'Views' : '阅读' }} {{ detail.view_count }}</view>
        </view>
    </view>
</template>

<script setup>
import { ref, toRefs, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { onLoad } from '@dcloudio/uni-app';
import { apiGetNotice } from '@/api/wallpaper.js';
import { useSettingsStore } from '@/stores/settings.js';

const { locale } = useI18n();
const settingsStore = useSettingsStore();
const isEn = computed(() => locale.value === 'en');

// UniApp 会将 URL 中的参数自动注入到 props
const props = defineProps({
    id: String, // 公告id
    name: String, // 公告title
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
            title: name.value,
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
    background-color: var(--page-background);
    min-height: 100vh;

    .container {
        padding: 12rpx 30rpx;

        .title {
            font-size: 40rpx;
            color: var(--text-primary);
            line-height: 1.6em;
            display: flex;
            align-items: center;

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
            padding-top: 18rpx;
            display: flex;
            align-items: center;
            color: var(--text-tertiary);
            font-size: 28rpx;

            .item {
                padding-right: 20rpx;
            }
        }

        .content {
            padding: 30rpx 0;
            color: var(--text-secondary);
        }

        .count {
            color: var(--text-tertiary);
            font-size: 28rpx;
        }
    }
}
</style>
