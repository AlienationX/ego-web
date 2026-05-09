<template>
    <view class="layout">
        <page-header :title="$t('user.profile.myDownload')"></page-header>

        <view class="content-wrapper">
            <tabbed-pics-view
                :show-header="false"
                :tabs="tabs"
                api-type="actions"
            ></tabbed-pics-view>
        </view>
    </view>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const tabs = computed(() => [
    {
        label: t('user.profile.myDownload'),
        query: {
            action_type: 'download',
        },
    },
]);
</script>

<style lang="scss" scoped>
.layout {
    background: #0b1017;
    min-height: 100vh;

    .content-wrapper {
        height: calc(100vh - 100rpx);
    }
}
</style>
