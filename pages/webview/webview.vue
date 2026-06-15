<template>
    <view class="layout" :class="isDark ? 'theme-dark' : 'theme-light'">

        <!-- ── 小程序端：mp-html 渲染完整 HTML（支持 <style>）── -->
        <!-- #ifdef MP -->
        <!-- 加载中 -->
        <view v-if="loading" class="mp-loading">
            <rotate-loading></rotate-loading>
        </view>
        <!-- 加载失败 -->
        <view v-else-if="loadError" class="mp-error">
            <text class="mp-error__text">内容加载失败，请检查网络后重试</text>
            <view class="mp-error__btn" @click="fetchHtmlContent">重新加载</view>
        </view>
        <!-- mp-html：tag-style 注入协议页样式，弥补 <style> 标签被忽略的问题 -->
        <mp-html
            v-else
            :content="htmlContent"
            :tag-style="parsedTagStyle"
            :container-style="'font-family:PingFang SC,Microsoft YaHei,Arial,sans-serif;line-height:1.8;color:#f8f9fa;padding:20px;'"
            scroll-table
        ></mp-html>
        <!-- #endif -->

        <!-- ── 非小程序端：web-view 加载远程 HTML ── -->
        <!-- #ifndef MP -->
        <web-view :src="webviewUrl" @message="handleMessage" class="webview"></web-view>
        <!-- #endif -->

    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { PICS_BASE_URL } from '@/common/config.js';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const isDark = computed(() => settingsStore.isDark);

const docType = ref('');
const webviewUrl = ref('');

// 小程序端状态
const loading = ref(true);
const loadError = ref(false);
const htmlContent = ref('');
const parsedTagStyle = ref({});  // 从 HTML <style> 动态解析

/**
 * 把 CSS 字符串解析成 mp-html tag-style 对象
 * 只处理纯标签选择器（h1/h2/p/ul/li 等），忽略类/ID/伪类选择器
 */
const parseCssToTagStyle = (css) => {
    const result = {};
    const ruleReg = /([a-zA-Z][a-zA-Z0-9,\s]*?)\s*\{([^}]*)\}/g;
    let match;
    while ((match = ruleReg.exec(css)) !== null) {
        const declarations = match[2].trim();
        for (const selector of match[1].split(',').map(s => s.trim())) {
            if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(selector)) {
                result[selector] = (result[selector] ? result[selector] + ';' : '') + declarations;
            }
        }
    }
    return result;
};

const pageTitle = computed(() => {
    if (docType.value === 'privacy') return t('about.privacy');
    if (docType.value === 'agreement') return t('about.agreement');
    return t('common.title');
});

const handleMessage = (e) => {
    console.log('Webview message:', e.detail);
};

// 小程序端拉取完整 HTML，直接传给 mp-html
const fetchHtmlContent = () => {
    // #ifndef MP
    return;
    // #endif

    if (!webviewUrl.value) return;
    loading.value = true;
    loadError.value = false;

    uni.request({
        url: webviewUrl.value,
        method: 'GET',
        dataType: 'text',
        responseType: 'text',
        success: (res) => {
            if (res.statusCode === 200 && res.data) {
                let html = String(res.data);
                // 提取 <style> 内容，解析为 tag-style 对象传给 mp-html
                const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
                if (styleMatch) {
                    parsedTagStyle.value = parseCssToTagStyle(styleMatch[1]);
                }
                // 去掉 <style> 块（mp-html 会忽略，提前移除更干净）
                html = html.replace(/<style[\s\S]*?<\/style>/gi, '');
                // 去掉固定背景色，避免深色模式出现白块
                html = html.replace(
                    /background-color\s*:\s*#(?:f8f9fa|fff|ffffff)\b/gi,
                    'background-color: transparent'
                );
                htmlContent.value = html;
            } else {
                loadError.value = true;
            }
        },
        fail: () => {
            loadError.value = true;
        },
        complete: () => {
            loading.value = false;
        },
    });
};

onLoad((options) => {
    if (!options.url) return;

    const decodedUrl = decodeURIComponent(options.url);

    if (decodedUrl.includes('privacy_agreement')) {
        docType.value = 'privacy';
        webviewUrl.value = `${PICS_BASE_URL}/privacy_agreement.html`;
    } else if (decodedUrl.includes('user_agreement')) {
        docType.value = 'agreement';
        webviewUrl.value = `${PICS_BASE_URL}/user_agreement.html`;
    }

    uni.setNavigationBarTitle({ title: pageTitle.value });
    fetchHtmlContent();
});
</script>

<style lang="scss" scoped>
.layout {
    min-height: 100vh;
    background: var(--page-background);
}

// ── 非小程序端 ──
.webview {
    width: 100%;
    height: 100vh;
}

// ── 小程序端加载状态 ──
.mp-loading {
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mp-error {
    min-height: 60vh;
    padding: 80rpx 48rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 40rpx;
}

.mp-error__text {
    font-size: 28rpx;
    color: var(--text-secondary);
    text-align: center;
    line-height: 1.7;
}

.mp-error__btn {
    padding: 20rpx 60rpx;
    border-radius: 999rpx;
    background: var(--text-primary);
    color: var(--page-background);
    font-size: 28rpx;
    font-weight: 600;

    &:active {
        opacity: 0.8;
        transform: scale(0.97);
    }
}
</style>
