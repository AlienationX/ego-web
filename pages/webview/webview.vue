<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">

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
        <!-- mp-html：tag-style 采用 CSS 变量自适应，实现与 notice 一致的 Light/Dark 主题秒切 -->
        <mp-html
            v-else
            :content="htmlContent"
            :tag-style="effectiveTagStyle"
            container-style="font-family:PingFang SC,Microsoft YaHei,Arial,sans-serif;line-height:1.8;color:var(--text-primary);padding:20px 24px;"
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

const docType = ref('');
const webviewUrl = ref('');

// 小程序端状态
const loading = ref(true);
const loadError = ref(false);
const htmlContent = ref('');
const parsedTagStyle = ref({});  // 从 HTML <style> 动态解析

/**
 * 把 CSS 字符串解析成 mp-html tag-style 对象
 * 剥离 @media 块，防止外部写死样式干扰 CSS 变量系统
 */
const parseCssToTagStyle = (css) => {
    const result = {};
    const cleanCss = css.replace(/@[^{]*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, '');
    const ruleReg = /([a-zA-Z][a-zA-Z0-9,\s]*?)\s*\{([^}]*)\}/g;
    let match;
    while ((match = ruleReg.exec(cleanCss)) !== null) {
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

// 使用 CSS 变量 (var(--text-primary)) 统领全局调色，完美跟随页面切换 Light/Dark 模式
const effectiveTagStyle = computed(() => {
    const base = { ...parsedTagStyle.value };

    return {
        ...base,
        body: 'color: var(--text-primary); background-color: transparent;',
        h1: 'color: var(--text-primary); text-align: center; border-bottom: 1rpx solid var(--panel-border); font-size: 24px; font-weight: 700; margin: 20px 0 16px; padding-bottom: 16px;',
        h2: 'color: var(--text-primary); font-size: 20px; font-weight: 700; margin: 28px 0 16px; line-height: 1.4;',
        h3: 'color: var(--text-primary); font-size: 17px; font-weight: 600; margin: 22px 0 12px; line-height: 1.4;',
        p: 'color: var(--text-primary); font-size: 15px; line-height: 1.8; margin-bottom: 16px; opacity: 0.92;',
        li: 'color: var(--text-primary); font-size: 15px; line-height: 1.8; margin-bottom: 8px; opacity: 0.92;',
        ul: 'padding-left: 20px; margin-left: 0; margin-bottom: 16px;',
        ol: 'padding-left: 20px; margin-left: 0; margin-bottom: 16px;',
        '.note': 'color: var(--text-secondary); background-color: var(--panel-background); border-left: 4px solid #e74c3c; padding: 12px 16px; margin: 20px 0; border-radius: 0 8px 8px 0;',
        '.date': 'color: var(--text-tertiary); text-align: right; margin-bottom: 24px; font-size: 14px;'
    };
});

const handleMessage = (e) => {
    console.log('Webview message:', e.detail);
};

// 小程序端拉取完整 HTML，传给 mp-html 动态渲染
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
                // 彻底去掉 HTML 写死的背景色，保证继承外层主题背景
                html = html.replace(
                    /background-color\s*:\s*#(?:f8f9fa|fff|ffffff|181818)\b/gi,
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
