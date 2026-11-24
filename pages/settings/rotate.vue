<template>
    <view class="layout" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
        <!-- 沉浸式顶部导航 -->
        <view class="nav-header" :style="{ paddingTop: statusBarHeight + 'px' }">
            <view class="nav-bar">
                <view class="back-btn" @click="handleBack">
                    <mdi-icon path="/static/icons/arrow-left.svg" size="20px"
                        :color="settingsStore.isDark ? '#e5e7eb' : '#1e293b'"></mdi-icon>
                </view>
                <text class="nav-title">{{ pageTitle }}</text>
                <view class="nav-placeholder"></view>
            </view>
        </view>

        <!-- 滚动配置主体 -->
        <scroll-view class="config-scroll" scroll-y :show-scrollbar="false">
            <view class="config-content">

                <!-- ════════════════════════════════════════════════════════════════
                     1. 鸿蒙系统端 (HarmonyOS NEXT 专属提示视图)
                ════════════════════════════════════════════════════════════════ -->
                <view v-if="currentPlatform === 'harmony'" class="platform-container harmony-view">
                    <view class="harmony-notice-card">
                        <view class="harmony-notice-header">
                            <view class="harmony-icon-circle">
                                <mdi-icon path="/static/icons/information-symbol.svg" size="24px" color="#ffffff"></mdi-icon>
                            </view>
                            <view class="harmony-notice-info">
                                <view class="harmony-title-row">
                                    <text class="harmony-notice-title">鸿蒙系统特别说明</text>
                                    <text class="harmony-tag">系统受限</text>
                                </view>
                                <text class="harmony-notice-desc">由于 HarmonyOS NEXT 纯血鸿蒙的安全机制与后台权限管控，第三方应用暂无权限静默更改系统壁纸。</text>
                            </view>
                        </view>

                        <view class="harmony-tips-box">
                            <view class="harmony-tip-row">
                                <text class="harmony-dot">•</text>
                                <text class="harmony-tip-text">建议在 Android 设备或支持快捷指令的 iOS 设备上登录同一账号体验后台自动轮播服务；</text>
                            </view>
                            <view class="harmony-tip-row">
                                <text class="harmony-dot">•</text>
                                <text class="harmony-tip-text">在当前鸿蒙设备上，您可将心仪壁纸一键保存至系统相册，通过系统相册自由设为桌面或锁屏壁纸。</text>
                            </view>
                        </view>

                        <view class="harmony-actions-box">
                            <button class="harmony-btn harmony-btn--primary" @click="goToExplore">
                                <mdi-icon path="/static/icons/image.svg" size="16px" color="#ffffff"></mdi-icon>
                                <text class="btn-text">浏览精选高清壁纸</text>
                            </button>
                            <button class="harmony-btn harmony-btn--secondary" @click="goToFavorite">
                                <mdi-icon path="/static/icons/view-carousel.svg" size="16px"
                                    :color="settingsStore.isDark ? '#cbd5e1' : '#475569'"></mdi-icon>
                                <text class="btn-text">管理我的收藏画板</text>
                            </button>
                        </view>
                    </view>
                </view>

                <!-- ════════════════════════════════════════════════════════════════
                     2. 微信小程序端 (MP-WEIXIN 专属提示视图)
                ════════════════════════════════════════════════════════════════ -->
                <view v-else-if="currentPlatform === 'weixin'" class="platform-container weixin-view">
                    <view class="mp-notice-card">
                        <view class="mp-notice-header">
                            <view class="mp-icon-circle">
                                <mdi-icon path="/static/icons/cellphone.svg" size="24px" color="#ffffff"></mdi-icon>
                            </view>
                            <view class="mp-notice-info">
                                <view class="mp-title-row">
                                    <text class="mp-notice-title">{{ t('autoWallpaper.mpNoticeTitle') }}</text>
                                    <text class="mp-recommend-badge">{{ t('autoWallpaper.mpNoticeTag') }}</text>
                                </view>
                                <text class="mp-notice-desc">{{ t('autoWallpaper.mpNoticeDesc') }}</text>
                            </view>
                        </view>

                        <view class="mp-notice-features">
                            <view class="feature-tag">
                                <mdi-icon path="/static/icons/check.svg" size="14px" color="#10b981"></mdi-icon>
                                <text class="feature-text">{{ t('autoWallpaper.mpFeatureAndroid') }}</text>
                            </view>
                            <view class="feature-tag">
                                <mdi-icon path="/static/icons/check.svg" size="14px" color="#10b981"></mdi-icon>
                                <text class="feature-text">{{ t('autoWallpaper.mpFeatureIos') }}</text>
                            </view>
                            <view class="feature-tag is-unsupported">
                                <mdi-icon path="/static/icons/close.svg" size="14px" color="#ef4444"></mdi-icon>
                                <text class="feature-text feature-unsupported">{{ t('autoWallpaper.mpFeatureHarmony') }}</text>
                            </view>
                        </view>

                        <view class="mp-notice-action" @click="handleDownloadAppTip">
                            <mdi-icon path="/static/icons/rocket.svg" size="16px" color="#ffffff"></mdi-icon>
                            <text class="mp-action-text">{{ t('autoWallpaper.mpNoticeBtn') }}</text>
                        </view>
                    </view>
                </view>

                <!-- ════════════════════════════════════════════════════════════════
                     3. iOS 客户端 (快捷指令自动化专属中心)
                ════════════════════════════════════════════════════════════════ -->
                <view v-else-if="currentPlatform === 'ios'" class="platform-container ios-view">
                    <!-- iOS 专属 Header 说明卡片 -->
                    <view class="ios-hero-banner">
                        <view class="banner-top-row">
                            <view class="apple-badge">
                                <mdi-icon path="/static/icons/brands/apple.svg" size="15px" color="#ffffff"></mdi-icon>
                                <text class="apple-badge-text">iOS 快捷指令自动化</text>
                            </view>
                            <view v-if="isPayEnabled" class="status-chip vip-chip" :class="{ 'is-vip': userStore.isVip }">
                                <mdi-icon path="/static/icons/crown-circle.svg" size="12px" color="#FBBF24"></mdi-icon>
                                <text class="chip-text">{{ userStore.isVip ? 'VIP 已生效' : 'VIP 专享' }}</text>
                            </view>
                            <view v-else class="status-chip free-chip">
                                <mdi-icon path="/static/icons/star.svg" size="12px" color="#6366f1"></mdi-icon>
                                <text class="chip-text">全员开放</text>
                            </view>
                        </view>
                        <text class="banner-sub">iOS 平台受系统安全限制，需配合系统自带【快捷指令】实现定时/充电/深浅外观自动换壁纸。</text>
                    </view>

                    <!-- 模式选择与专属 Feed 数据源 -->
                    <view class="mode-hub-card">
                        <view class="hub-header">
                            <text class="hub-title">1. 选择自动化壁纸源</text>
                            <text class="hub-sub">选择并生成你的专属 Feed 数据源</text>
                        </view>

                        <!-- 三段式模式切换 -->
                        <view class="mode-tabs">
                            <view class="mode-tab" :class="{ 'is-active': form.mode === 'bing' }" @click="selectMode('bing')">
                                <mdi-icon path="/static/icons/image.svg" size="15px"
                                    :color="form.mode === 'bing' ? '#ffffff' : (settingsStore.isDark ? '#94a3b8' : '#64748b')"></mdi-icon>
                                <text class="tab-label">每日必应</text>
                            </view>
                            <view class="mode-tab" :class="{ 'is-active': form.mode === 'theme' }" @click="selectMode('theme')">
                                <mdi-icon path="/static/icons/theme-light-dark.svg" size="15px"
                                    :color="form.mode === 'theme' ? '#ffffff' : (settingsStore.isDark ? '#94a3b8' : '#64748b')"></mdi-icon>
                                <text class="tab-label">深浅双色</text>
                            </view>
                            <view class="mode-tab" :class="{ 'is-active': form.mode === 'board' }" @click="selectMode('board')">
                                <mdi-icon path="/static/icons/view-carousel.svg" size="15px"
                                    :color="form.mode === 'board' ? '#ffffff' : (settingsStore.isDark ? '#94a3b8' : '#64748b')"></mdi-icon>
                                <text class="tab-label">画板轮播</text>
                            </view>
                        </view>

                        <!-- 深浅双色模式专属展台与 Feed -->
                        <view v-if="form.mode === 'theme'" class="mode-panel">
                            <view class="theme-intro-bar">
                                <mdi-icon path="/static/icons/information-symbol.svg" size="14px" color="#6366f1"></mdi-icon>
                                <text class="theme-intro-text">随 iPhone 系统深色/浅色外观无感自适应切换，媲美官方动态壁纸</text>
                            </view>

                            <view class="theme-wall-showcase">
                                <!-- 浅色卡槽 -->
                                <view class="wall-showcase-item" @click="openSlotActionSheet('light')">
                                    <view class="item-tag-row">
                                        <view class="tag-pill tag-pill--light">
                                            <mdi-icon path="/static/icons/weather-sunny.svg" size="13px" color="#f59e0b"></mdi-icon>
                                            <text class="tag-title">浅色壁纸</text>
                                        </view>
                                        <view v-if="form.light_wallpaper" class="action-btn-mini" @click.stop="clearSlot('light')">
                                            <mdi-icon path="/static/icons/close.svg" size="12px" color="#94a3b8"></mdi-icon>
                                        </view>
                                    </view>
                                    <view class="showcase-cover">
                                        <image v-if="form.light_wallpaper?.thumb || form.light_wallpaper?.url"
                                            class="cover-img"
                                            :src="form.light_wallpaper.thumb || form.light_wallpaper.url"
                                            mode="aspectFill"></image>
                                        <view v-else class="empty-cover">
                                            <view class="empty-icon-wrap">
                                                <mdi-icon path="/static/icons/plus.svg" size="18px" color="#94a3b8"></mdi-icon>
                                            </view>
                                            <text class="empty-text">设定浅色壁纸</text>
                                        </view>
                                    </view>
                                    <text class="item-label">{{ form.light_wallpaper?.title || '点击从画板/相册选取' }}</text>
                                </view>

                                <!-- 深色卡槽 -->
                                <view class="wall-showcase-item" @click="openSlotActionSheet('dark')">
                                    <view class="item-tag-row">
                                        <view class="tag-pill tag-pill--dark">
                                            <mdi-icon path="/static/icons/weather-night.svg" size="13px" color="#818cf8"></mdi-icon>
                                            <text class="tag-title">深色壁纸</text>
                                        </view>
                                        <view v-if="form.dark_wallpaper" class="action-btn-mini" @click.stop="clearSlot('dark')">
                                            <mdi-icon path="/static/icons/close.svg" size="12px" color="#94a3b8"></mdi-icon>
                                        </view>
                                    </view>
                                    <view class="showcase-cover">
                                        <image v-if="form.dark_wallpaper?.thumb || form.dark_wallpaper?.url"
                                            class="cover-img"
                                            :src="form.dark_wallpaper.thumb || form.dark_wallpaper.url"
                                            mode="aspectFill"></image>
                                        <view v-else class="empty-cover">
                                            <view class="empty-icon-wrap">
                                                <mdi-icon path="/static/icons/plus.svg" size="18px" color="#94a3b8"></mdi-icon>
                                            </view>
                                            <text class="empty-text">设定深色壁纸</text>
                                        </view>
                                    </view>
                                    <text class="item-label">{{ form.dark_wallpaper?.title || '点击从画板/相册选取' }}</text>
                                </view>
                            </view>

                            <!-- 深浅模式专属两条 Feed -->
                            <view class="feed-copy-group">
                                <view class="feed-item">
                                    <view class="feed-label-row">
                                        <mdi-icon path="/static/icons/weather-sunny.svg" size="13px" color="#f59e0b"></mdi-icon>
                                        <text class="feed-label">白天（浅色）壁纸 Feed 链接</text>
                                    </view>
                                    <view class="feed-bar">
                                        <text class="feed-url-text">{{ lightFeedUrl }}</text>
                                        <view class="copy-chip" @click="copyUrl(lightFeedUrl, '浅色壁纸 Feed 链接已复制')">复制链接</view>
                                    </view>
                                </view>

                                <view class="feed-item">
                                    <view class="feed-label-row">
                                        <mdi-icon path="/static/icons/weather-night.svg" size="13px" color="#818cf8"></mdi-icon>
                                        <text class="feed-label">夜晚（深色）壁纸 Feed 链接</text>
                                    </view>
                                    <view class="feed-bar">
                                        <text class="feed-url-text">{{ darkFeedUrl }}</text>
                                        <view class="copy-chip" @click="copyUrl(darkFeedUrl, '深色壁纸 Feed 链接已复制')">复制链接</view>
                                    </view>
                                </view>
                            </view>
                        </view>

                        <!-- 每日必应模式专属 Feed -->
                        <view v-else-if="form.mode === 'bing'" class="mode-panel">
                            <view class="bing-intro-box">
                                <view class="bing-icon-box">
                                    <mdi-icon path="/static/icons/image.svg" size="24px" color="#6366f1"></mdi-icon>
                                </view>
                                <view class="bing-intro-text">
                                    <text class="intro-title">{{ t('autoWallpaper.modeBingTitle') }}</text>
                                    <text class="intro-desc">每日 0 点自动同步微软最新高清摄影大作</text>
                                </view>
                            </view>

                            <view class="feed-copy-group">
                                <view class="feed-item">
                                    <view class="feed-label-row">
                                        <mdi-icon path="/static/icons/image.svg" size="13px" color="#6366f1"></mdi-icon>
                                        <text class="feed-label">必应每日壁纸 Feed 链接</text>
                                    </view>
                                    <view class="feed-bar">
                                        <text class="feed-url-text">{{ feedUrl }}</text>
                                        <view class="copy-chip" @click="copyUrl(feedUrl, 'Feed 链接已复制')">复制链接</view>
                                    </view>
                                </view>
                            </view>
                        </view>

                        <!-- 画板轮播模式专属 Feed -->
                        <view v-else-if="form.mode === 'board'" class="mode-panel">
                            <view class="panel-row" @click="openBoardPicker">
                                <view class="row-left">
                                    <text class="row-title">轮播画板</text>
                                    <text class="row-desc">从你的收藏画板中按策略轮播</text>
                                </view>
                                <view class="board-picker-trigger">
                                    <text class="trigger-text" :class="{ 'is-selected': selectedBoardName }">
                                        {{ selectedBoardName || t('autoWallpaper.pickBoardPlaceholder') }}
                                    </text>
                                    <mdi-icon path="/static/icons/chevron-right.svg" size="15px"
                                        :color="settingsStore.isDark ? '#94a3b8' : '#64748b'"></mdi-icon>
                                </view>
                            </view>

                            <view class="feed-copy-group">
                                <view class="feed-item">
                                    <view class="feed-label-row">
                                        <mdi-icon path="/static/icons/view-carousel.svg" size="13px" color="#6366f1"></mdi-icon>
                                        <text class="feed-label">画板轮播专属 Feed 链接</text>
                                    </view>
                                    <view class="feed-bar">
                                        <text class="feed-url-text">{{ feedUrl }}</text>
                                        <view class="copy-chip" @click="copyUrl(feedUrl, 'Feed 链接已复制')">复制链接</view>
                                    </view>
                                </view>
                            </view>
                        </view>

                        <!-- 保存配置与测试拉取操作条 -->
                        <view class="ios-actions-row">
                            <button class="ios-sub-btn" @click="handleTestRotate">
                                <mdi-icon path="/static/icons/refresh.svg" size="15px"
                                    :color="settingsStore.isDark ? '#cbd5e1' : '#334155'"></mdi-icon>
                                <text class="btn-text">测试壁纸拉取</text>
                            </button>
                            <button class="ios-main-btn" :disabled="saving" @click="handleSaveConfig">
                                <mdi-icon path="/static/icons/check.svg" size="15px" color="#ffffff"></mdi-icon>
                                <text class="btn-text">{{ saving ? t('common.saving') : '保存壁纸设定' }}</text>
                            </button>
                        </view>
                    </view>

                    <!-- iOS 快捷指令保姆级分步操作指南 -->
                    <view class="shortcuts-guide-card">
                        <view class="guide-header">
                            <view class="guide-title-row">
                                <text class="guide-title">2. 快捷指令自动化配置教程</text>
                                <text class="guide-badge">只需配置一次</text>
                            </view>
                            <text class="guide-desc">跟随以下 4 个简单步骤，即可在 iPhone 上实现全自动静默更换壁纸：</text>
                        </view>

                        <view class="guide-steps">
                            <!-- 步骤 1 -->
                            <view class="step-card">
                                <view class="step-num-pill">01</view>
                                <view class="step-content">
                                    <text class="step-title">打开系统「快捷指令」App</text>
                                    <text class="step-desc">打开 iPhone 自带的【快捷指令】应用，切换至底部中间的【自动化】标签，点击右上角【+】新增个人自动化。</text>
                                </view>
                            </view>

                            <!-- 步骤 2 -->
                            <view class="step-card">
                                <view class="step-num-pill">02</view>
                                <view class="step-content">
                                    <text class="step-title">设置触发时机</text>
                                    <view class="step-sub-box">
                                        <text class="sub-point"><text class="bold-text">深浅双色推荐：</text>选择【深色模式】，分别勾选“开启时”和“关闭时”创建两条自动化；</text>
                                        <text class="sub-point"><text class="bold-text">每日必应/画板：</text>选择【特定时间】（如每天 08:00）或【充电器连接时】。</text>
                                    </view>
                                </view>
                            </view>

                            <!-- 步骤 3 -->
                            <view class="step-card">
                                <view class="step-num-pill">03</view>
                                <view class="step-content">
                                    <text class="step-title">添加操作（动作序列）</text>
                                    <view class="action-flow">
                                        <view class="flow-item">
                                            <text class="flow-index">1</text>
                                            <text class="flow-text">添加操作【获取 URL 的内容】，粘贴上方复制的对应 Feed 链接；</text>
                                        </view>
                                        <view class="flow-item">
                                            <text class="flow-index">2</text>
                                            <text class="flow-text">添加操作【设定墙纸】，将照片设为上述 URL 内容，关闭“显示预览”，目标选择主屏幕或锁定屏幕。</text>
                                        </view>
                                    </view>
                                </view>
                            </view>

                            <!-- 步骤 4 -->
                            <view class="step-card">
                                <view class="step-num-pill">04</view>
                                <view class="step-content">
                                    <text class="step-title">关闭「运行前询问」实现静默更换</text>
                                    <text class="step-desc">将【运行前询问】开关关闭，勾选“不询问”，点击完成保存。此后到达指定时机系统将后台无感自动换上壁纸！</text>
                                </view>
                            </view>
                        </view>

                        <!-- 快捷跳转按钮 -->
                        <view class="open-shortcuts-action" @click="openShortcutsApp">
                            <mdi-icon path="/static/icons/rocket.svg" size="16px" color="#ffffff"></mdi-icon>
                            <text class="action-text">打开系统「快捷指令」App 立即设置</text>
                        </view>
                    </view>
                </view>

                <!-- ════════════════════════════════════════════════════════════════
                     4. Android 客户端 (原生自动更换设置中心)
                ════════════════════════════════════════════════════════════════ -->
                <view v-else class="platform-container android-view">
                    <!-- 1. 主控制卡片（Hero Card）：集成状态徽章 + 说明 + 开关 -->
                    <view class="hero-card" :class="{ 'is-active': form.enabled }">
                        <view class="hero-left">
                            <view class="hero-badge-row">
                                <text class="hero-title">{{ t('autoWallpaper.masterSwitchTitle') }}</text>
                                <view v-if="isPayEnabled" class="hero-badge vip-badge" :class="{ 'is-vip': userStore.isVip }"
                                    @click="!userStore.isVip && uni.navigateTo({ url: '/pages/member/payment' })">
                                    <mdi-icon path="/static/icons/crown-circle.svg" size="13px" color="#FBBF24"></mdi-icon>
                                    <text class="badge-text">{{ userStore.isVip ? 'VIP 已生效' : 'VIP 专享' }}</text>
                                </view>
                                <view v-else class="hero-badge free-badge">
                                    <mdi-icon path="/static/icons/star.svg" size="13px" color="#6366f1"></mdi-icon>
                                    <text class="badge-text">全员开放</text>
                                </view>
                            </view>
                            <text class="hero-desc">{{ t('autoWallpaper.masterSwitchDesc') }}</text>
                        </view>
                        <view class="hero-switch-wrap">
                            <switch :key="switchKey" :checked="form.enabled" color="#4F46E5" @change="onMasterSwitchChange" />
                        </view>
                    </view>

                    <!-- 2. 核心模式配置大卡片 (Mode Hub Card) -->
                    <view class="mode-hub-card" :class="{ 'is-disabled': !form.enabled }">
                        <!-- 模式分段选择器 (Segmented Tabs) -->
                        <view class="mode-tabs">
                            <view class="mode-tab" :class="{ 'is-active': form.mode === 'bing' }" @click="selectMode('bing')">
                                <mdi-icon path="/static/icons/image.svg" size="16px"
                                    :color="form.mode === 'bing' ? '#ffffff' : (settingsStore.isDark ? '#94a3b8' : '#64748b')"></mdi-icon>
                                <text class="tab-label">每日必应</text>
                            </view>
                            <view class="mode-tab" :class="{ 'is-active': form.mode === 'theme' }" @click="selectMode('theme')">
                                <mdi-icon path="/static/icons/theme-light-dark.svg" size="16px"
                                    :color="form.mode === 'theme' ? '#ffffff' : (settingsStore.isDark ? '#94a3b8' : '#64748b')"></mdi-icon>
                                <text class="tab-label">深浅双色</text>
                            </view>
                            <view class="mode-tab" :class="{ 'is-active': form.mode === 'board' }" @click="selectMode('board')">
                                <mdi-icon path="/static/icons/view-carousel.svg" size="16px"
                                    :color="form.mode === 'board' ? '#ffffff' : (settingsStore.isDark ? '#94a3b8' : '#64748b')"></mdi-icon>
                                <text class="tab-label">画板轮播</text>
                            </view>
                        </view>

                        <!-- Tab 1: 每日必应专属配置 -->
                        <view v-if="form.mode === 'bing'" class="mode-panel mode-panel--bing">
                            <view class="bing-intro-box">
                                <view class="bing-icon-box">
                                    <mdi-icon path="/static/icons/image.svg" size="26px" color="#6366f1"></mdi-icon>
                                </view>
                                <view class="bing-intro-text">
                                    <text class="intro-title">{{ t('autoWallpaper.modeBingTitle') }}</text>
                                    <text class="intro-desc">{{ t('autoWallpaper.modeBingDesc') }}</text>
                                </view>
                            </view>
                        </view>

                        <!-- Tab 2: 深浅双色自适应专属配置 -->
                        <view v-else-if="form.mode === 'theme'" class="mode-panel mode-panel--theme">
                            <view class="theme-intro-bar">
                                <mdi-icon path="/static/icons/information-symbol.svg" size="14px" color="#6366f1"></mdi-icon>
                                <text class="theme-intro-text">随系统深色/浅色外观自适应切换，超低耗电</text>
                            </view>

                            <!-- 深浅双卡槽展台 -->
                            <view class="theme-wall-showcase">
                                <!-- 浅色卡槽 -->
                                <view class="wall-showcase-item" @click="openSlotActionSheet('light')">
                                    <view class="item-tag-row">
                                        <view class="tag-pill tag-pill--light">
                                            <mdi-icon path="/static/icons/weather-sunny.svg" size="13px" color="#f59e0b"></mdi-icon>
                                            <text class="tag-title">浅色壁纸</text>
                                        </view>
                                        <view v-if="form.light_wallpaper" class="action-btn-mini" @click.stop="clearSlot('light')">
                                            <mdi-icon path="/static/icons/close.svg" size="12px" color="#94a3b8"></mdi-icon>
                                        </view>
                                    </view>

                                    <view class="showcase-cover">
                                        <image v-if="form.light_wallpaper?.thumb || form.light_wallpaper?.url"
                                            class="cover-img"
                                            :src="form.light_wallpaper.thumb || form.light_wallpaper.url"
                                            mode="aspectFill"></image>
                                        <view v-else class="empty-cover">
                                            <view class="empty-icon-wrap">
                                                <mdi-icon path="/static/icons/plus.svg" size="20px" color="#94a3b8"></mdi-icon>
                                            </view>
                                            <text class="empty-text">选择浅色壁纸</text>
                                            <text class="empty-sub">画板 / 相册</text>
                                        </view>
                                    </view>
                                    <text class="item-label">{{ form.light_wallpaper?.title || '点击设定浅色壁纸' }}</text>
                                </view>

                                <!-- 深色卡槽 -->
                                <view class="wall-showcase-item" @click="openSlotActionSheet('dark')">
                                    <view class="item-tag-row">
                                        <view class="tag-pill tag-pill--dark">
                                            <mdi-icon path="/static/icons/weather-night.svg" size="13px" color="#818cf8"></mdi-icon>
                                            <text class="tag-title">深色壁纸</text>
                                        </view>
                                        <view v-if="form.dark_wallpaper" class="action-btn-mini" @click.stop="clearSlot('dark')">
                                            <mdi-icon path="/static/icons/close.svg" size="12px" color="#94a3b8"></mdi-icon>
                                        </view>
                                    </view>

                                    <view class="showcase-cover">
                                        <image v-if="form.dark_wallpaper?.thumb || form.dark_wallpaper?.url"
                                            class="cover-img"
                                            :src="form.dark_wallpaper.thumb || form.dark_wallpaper.url"
                                            mode="aspectFill"></image>
                                        <view v-else class="empty-cover">
                                            <view class="empty-icon-wrap">
                                                <mdi-icon path="/static/icons/plus.svg" size="20px" color="#94a3b8"></mdi-icon>
                                            </view>
                                            <text class="empty-text">选择深色壁纸</text>
                                            <text class="empty-sub">画板 / 相册</text>
                                        </view>
                                    </view>
                                    <text class="item-label">{{ form.dark_wallpaper?.title || '点击设定深色壁纸' }}</text>
                                </view>
                            </view>
                        </view>

                        <!-- Tab 3: 自定义画板轮播专属配置 -->
                        <view v-else-if="form.mode === 'board'" class="mode-panel mode-panel--board">
                            <!-- 画板选择项 -->
                            <view class="panel-row" @click="openBoardPicker">
                                <view class="row-left">
                                    <text class="row-title">轮播画板</text>
                                    <text class="row-desc">从你的收藏画板中按策略定时更换</text>
                                </view>
                                <view class="row-right board-picker-trigger">
                                    <text class="trigger-text" :class="{ 'is-selected': selectedBoardName }">
                                        {{ selectedBoardName || t('autoWallpaper.pickBoardPlaceholder') }}
                                    </text>
                                    <mdi-icon path="/static/icons/chevron-right.svg" size="16px"
                                        :color="settingsStore.isDark ? '#94a3b8' : '#64748b'"></mdi-icon>
                                </view>
                            </view>

                            <!-- 轮播策略 -->
                            <view class="panel-sub-section">
                                <text class="sub-section-title">轮播策略</text>
                                <view class="compact-segmented">
                                    <view class="segmented-item" :class="{ 'is-active': form.strategy === 'random' }"
                                        @click="selectStrategy('random')">
                                        <text class="segmented-text">{{ t('autoWallpaper.strategyRandom') }}</text>
                                    </view>
                                    <view class="segmented-item" :class="{ 'is-active': form.strategy === 'sequential' }"
                                        @click="selectStrategy('sequential')">
                                        <text class="segmented-text">{{ t('autoWallpaper.strategySequential') }}</text>
                                    </view>
                                </view>
                            </view>

                            <!-- 切换频率 -->
                            <view class="panel-sub-section">
                                <text class="sub-section-title">切换频率</text>
                                <view class="compact-segmented">
                                    <view class="segmented-item" :class="{ 'is-active': form.frequency === 'daily' }"
                                        @click="selectFrequency('daily')">
                                        <text class="segmented-text">{{ t('autoWallpaper.freqDaily') }}</text>
                                    </view>
                                    <view class="segmented-item" :class="{ 'is-active': form.frequency === '12h' }"
                                        @click="selectFrequency('12h')">
                                        <text class="segmented-text">{{ t('autoWallpaper.freq12h') }}</text>
                                    </view>
                                    <view class="segmented-item" :class="{ 'is-active': form.frequency === '1h' }"
                                        @click="selectFrequency('1h')">
                                        <text class="segmented-text">{{ t('autoWallpaper.freq1h') }}</text>
                                    </view>
                                    <view class="segmented-item" :class="{ 'is-active': form.frequency === 'unlock' }"
                                        @click="selectFrequency('unlock')">
                                        <text class="segmented-text">{{ t('autoWallpaper.freqUnlock') }}</text>
                                    </view>
                                </view>
                            </view>
                        </view>
                    </view>

                    <!-- 3. 运行偏好分组卡片 (Preferences Card) -->
                    <view class="grouped-card" :class="{ 'is-disabled': !form.enabled }">
                        <!-- 行 1: 应用目标（通栏布局，彻底不换行） -->
                        <view class="group-target-section">
                            <view class="section-label-row">
                                <text class="row-title">{{ t('autoWallpaper.targetTitle') }}</text>
                                <text class="row-sub-hint">锁屏 / 桌面生效范围</text>
                            </view>
                            <view class="full-width-segmented">
                                <view class="segmented-pill" :class="{ 'is-active': form.target === 'lock' }"
                                    @click="selectTarget('lock')">
                                    <text class="pill-text">{{ t('autoWallpaper.targetLock') }}</text>
                                </view>
                                <view class="segmented-pill" :class="{ 'is-active': form.target === 'home' }"
                                    @click="selectTarget('home')">
                                    <text class="pill-text">{{ t('autoWallpaper.targetHome') }}</text>
                                </view>
                                <view class="segmented-pill" :class="{ 'is-active': form.target === 'both' }"
                                    @click="selectTarget('both')">
                                    <text class="pill-text">{{ t('autoWallpaper.targetBoth') }}</text>
                                </view>
                            </view>
                        </view>

                        <view class="group-divider"></view>

                        <!-- 行 2: 仅 Wi-Fi 下下载 -->
                        <view class="group-row">
                            <view class="row-left">
                                <text class="row-title">{{ t('autoWallpaper.wifiOnlyTitle') }}</text>
                                <text class="row-desc">{{ t('autoWallpaper.wifiOnlyDesc') }}</text>
                            </view>
                            <switch :checked="form.wifi_only" color="#4F46E5" @change="onWifiSwitchChange" />
                        </view>

                        <view class="group-divider"></view>

                        <!-- 行 3: 立即测试切换效果 -->
                        <view class="group-row group-row--clickable" @click="handleTestRotate">
                            <view class="row-left">
                                <text class="row-title">{{ isTesting ? t('autoWallpaper.testing') : '测试当前壁纸效果' }}</text>
                                <text class="row-desc">实时向 Feed 接口拉取一张壁纸并预览效果</text>
                            </view>
                            <view class="test-pill-btn">
                                <mdi-icon path="/static/icons/refresh.svg" size="14px" color="#ffffff"></mdi-icon>
                                <text class="test-pill-text">立即测试</text>
                            </view>
                        </view>
                    </view>

                    <!-- 底部保存按钮 -->
                    <view class="save-bar-wrap" :class="{ 'is-disabled': !form.enabled }">
                        <button class="save-glow-btn" :disabled="!form.enabled || saving" @click="handleSaveConfig">
                            <mdi-icon path="/static/icons/check.svg" size="18px" color="#ffffff"></mdi-icon>
                            <text class="save-glow-text">{{ saving ? t('common.saving') : t('common.saveSettings') }}</text>
                        </button>
                    </view>
                </view>

            </view>
        </scroll-view>

        <!-- 专属壁纸选择器 (仅限收藏/画板/相册) -->
        <popup-wallpaper-select ref="wallPicker" @selected="onWallpaperSelected" />

        <!-- 画板选择弹窗 -->
        <popup-board-select ref="boardPicker" @saved="onBoardSelected" />

        <!-- 轮播测试结果弹窗 -->
        <uni-popup ref="testPopup" type="center" :z-index="1000">
            <view class="test-dialog-card" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'" v-if="testResult">
                <view class="test-dialog-header">
                    <text class="test-dialog-title">{{ t('autoWallpaper.testResultTitle') }}</text>
                    <view class="close-btn" @click="testPopup?.close()">
                        <mdi-icon path="/static/icons/close.svg" size="18px"
                            :color="settingsStore.isDark ? '#94a3b8' : '#64748b'"></mdi-icon>
                    </view>
                </view>

                <view class="test-preview-img-box">
                    <image class="test-preview-img" :src="testResult.image_url" mode="aspectFill"></image>
                    <view class="test-tag mode-tag">
                        {{ testResult.mode === 'board' ? `画板: ${testResult.board_name || '已选画板'}` : (testResult.mode === 'theme' ? `自适应壁纸: ${testResult.theme === 'dark' ? '深色' : '浅色'}` : '每日必应') }}
                    </view>
                </view>

                <view class="test-details">
                    <text class="detail-title">{{ testResult.title || '超清壁纸' }}</text>
                    <text class="detail-sub">目标: {{ testResult.target === 'lock' ? '仅锁屏' : (testResult.target === 'home' ? '仅桌面' : '双屏') }} · 时间: {{ formatRotateTime(testResult.rotated_at) }}</text>
                </view>

                <!-- iOS 平台提供一键保存到系统相册，Android/其他平台提供一键设为系统壁纸 -->
                <button v-if="currentPlatform === 'ios'" class="apply-native-btn apply-native-btn--ios" @click="saveWallpaperToAlbum(testResult.image_url)">
                    <mdi-icon path="/static/icons/download.svg" size="16px" color="#ffffff"></mdi-icon>
                    <text class="btn-text">保存壁纸至系统相册</text>
                </button>
                <button v-else class="apply-native-btn" @click="applyWallpaperNative">
                    {{ t('autoWallpaper.applyToSystem') }}
                </button>
            </view>
        </uni-popup>

        <!-- 通用导航对话框 -->
        <popup-navigation-dialog ref="navDialog" :title="dialogState.title" :description="dialogState.description"
            :confirmText="dialogState.confirmText" :cancelText="dialogState.cancelText"
            :showCancel="dialogState.showCancel" @confirm="dialogState.onConfirm"
            @cancel="dialogState.onCancel"></popup-navigation-dialog>
    </view>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserStore } from '@/stores/user.js';
import { useAppStore } from '@/stores/app.js';
import { useI18n } from 'vue-i18n';
import { API_BASE_URL } from '@/common/config.js';
import { apiGetRotateConfig, apiSaveRotateConfig, apiGetRotateFeed } from '@/api/member.js';
import { apiGetBoards } from '@/api/wallpaper.js';
import { setWallpaper, startAutoRotate, stopAutoRotate } from '@/uni_modules/ego-wallpaper-manager';
import { setAndroidWallpaper } from '@/common/core.js';
import PopupBoardSelect from '@/components/popup-board-select/popup-board-select.vue';
import PopupWallpaperSelect from '@/components/popup-wallpaper-select/popup-wallpaper-select.vue';
import PopupNavigationDialog from '@/components/popup-navigation-dialog/popup-navigation-dialog.vue';

const settingsStore = useSettingsStore();
const userStore = useUserStore();
const appStore = useAppStore();
const { t } = useI18n();

// 平台环境判断：'android' | 'ios' | 'harmony' | 'weixin'
const currentPlatform = computed(() => {
    // #ifdef MP-WEIXIN
    return 'weixin';
    // #endif

    // #ifdef APP-HARMONY
    return 'harmony';
    // #endif

    // #ifdef APP-PLUS
    try {
        const sys = uni.getSystemInfoSync() || {};
        const p = (uni.getDeviceInfo()?.platform || sys.platform || '').toLowerCase();
        const osName = (sys.osName || '').toLowerCase();
        if (osName === 'harmonyos' || osName === 'harmony' || p === 'harmony') return 'harmony';
        if (p === 'ios' || osName === 'ios') return 'ios';
        if (p === 'android' || osName === 'android') return 'android';
    } catch (e) {}
    return 'android';
    // #endif

    // #ifdef H5
    try {
        const ua = navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    } catch (e) {}
    // #endif

    return 'android';
});

// 页面顶部标题根据端展示
const pageTitle = computed(() => {
    if (currentPlatform.value === 'ios') return '快捷指令自动更换壁纸';
    if (currentPlatform.value === 'harmony') return '自动更换壁纸说明';
    return t('autoWallpaper.pageTitle') || '自动更换壁纸';
});

// 支付与 VIP 权限判定：受 appStore.versionConfig?.pay_enabled 控制
const isPayEnabled = computed(() => appStore.versionConfig?.pay_enabled === true);

const statusBarHeight = ref(0);
const saving = ref(false);
const isTesting = ref(false);
const testPopup = ref(null);
const testResult = ref(null);
const boardPicker = ref(null);
const wallPicker = ref(null);
const boardsList = ref([]);
const switchKey = ref(0);

// 通用导航对话框控制
const navDialog = ref(null);
const dialogState = reactive({
    title: '',
    description: '',
    confirmText: '',
    cancelText: '',
    showCancel: true,
    onConfirm: () => { },
    onCancel: () => { },
});

const showNavDialog = (options) => {
    dialogState.title = options.title || t('common.tip');
    dialogState.description = options.content || options.description || '';
    dialogState.confirmText = options.confirmText || t('common.confirm');
    dialogState.cancelText = options.cancelText || t('common.cancel');
    dialogState.showCancel = options.showCancel !== false;
    dialogState.onConfirm = () => {
        navDialog.value?.close();
        if (typeof options.onConfirm === 'function') {
            options.onConfirm();
        }
    };
    dialogState.onCancel = () => {
        navDialog.value?.close();
        if (typeof options.onCancel === 'function') {
            options.onCancel();
        }
    };
    navDialog.value?.open();
};

const form = ref({
    enabled: false,
    mode: 'bing', // 'bing' | 'theme' | 'board'
    board: null,
    board_name: '',
    light_wallpaper: null, // { id, url, thumb, title, source }
    dark_wallpaper: null,  // { id, url, thumb, title, source }
    target: 'lock',
    frequency: 'daily',
    strategy: 'random',
    wifi_only: true,
    rotate_token: '',
});

const selectedBoardName = computed(() => {
    if (form.value.board_name) return form.value.board_name;
    const found = boardsList.value.find((b) => b.id === form.value.board);
    return found ? found.name : '';
});

const feedUrl = computed(() => {
    const base = API_BASE_URL.replace(/\/+$/, '');
    return `${base}/rotate/feed/?token=${form.value.rotate_token || ''}`;
});

const lightFeedUrl = computed(() => {
    return `${feedUrl.value}&theme=light`;
});

const darkFeedUrl = computed(() => {
    return `${feedUrl.value}&theme=dark`;
});

// 前端时区转换：后端统一返回标准 UTC 时间，由前端直接解析转换为用户手机本地时区时间展示
const formatRotateTime = (timeStr) => {
    if (!timeStr) return '';
    try {
        let utcIso = String(timeStr).trim();
        // 如果后端传的是 "YYYY-MM-DD HH:mm:ss" 纯 UTC 格式，补全为标准 ISO UTC 字符串
        if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(utcIso)) {
            utcIso = utcIso.replace(' ', 'T') + 'Z';
        } else if (!utcIso.endsWith('Z') && !utcIso.includes('+') && utcIso.includes('T')) {
            utcIso += 'Z';
        }
        const d = new Date(utcIso);
        if (!isNaN(d.getTime())) {
            const Y = d.getFullYear();
            const M = String(d.getMonth() + 1).padStart(2, '0');
            const D = String(d.getDate()).padStart(2, '0');
            const h = String(d.getHours()).padStart(2, '0');
            const m = String(d.getMinutes()).padStart(2, '0');
            const s = String(d.getSeconds()).padStart(2, '0');
            return `${Y}-${M}-${D} ${h}:${m}:${s}`;
        }
    } catch (e) {
        console.error('formatRotateTime error', e);
    }
    return timeStr;
};

onMounted(async () => {
    statusBarHeight.value = uni.getWindowInfo().statusBarHeight || 20;
    // 优先读取本地缓存兜底
    const localConfig = uni.getStorageSync('auto_rotate_config');
    if (localConfig) {
        Object.assign(form.value, localConfig);
    }
    if (userStore.isLoggedIn || userStore.userinfo?.id) {
        await Promise.all([loadConfig(), loadBoards()]);
    }
});

onShow(async () => {
    try {
        await Promise.all([
            appStore.fetchVersionConfig(),
            userStore.isLoggedIn ? userStore.setUserInfo() : Promise.resolve(),
        ]);
        // 用户登录成功回到页面后，自动同步拉取用户云端配置
        if (userStore.isLoggedIn || userStore.userinfo?.id) {
            await Promise.all([loadConfig(), loadBoards()]);
        }
    } catch (e) {
        console.warn('Refresh versionConfig or userInfo onShow failed', e);
    }

    // 后台改值重新校验与自动熔断（针对 Android 原生后台服务）
    if (isPayEnabled.value && form.value.enabled) {
        const isVipActive = userStore.isVip;
        let isExpired = false;
        const expireTime = userStore.userinfo?.profile?.vip_expire_time;
        if (expireTime) {
            const expireDate = new Date(
                typeof expireTime === 'string' && expireTime.includes(' ') && !expireTime.includes('T')
                    ? expireTime.replace(/-/g, '/')
                    : expireTime,
            );
            if (expireDate.getTime() < Date.now()) {
                isExpired = true;
            }
        }
        if (!isVipActive || isExpired) {
            form.value.enabled = false;
            switchKey.value++;
            uni.setStorageSync('auto_rotate_config', form.value);
            // #ifdef APP
            stopAutoRotate();
            // #endif
            uni.showToast({
                title: '会员权益已变更，自动更换壁纸已暂停',
                icon: 'none',
                duration: 3000,
            });
        }
    }
});

const loadConfig = async () => {
    if (!userStore.isLoggedIn && !userStore.userinfo?.id) return;
    try {
        const res = await apiGetRotateConfig();
        if (res?.data) {
            Object.assign(form.value, res.data);
            uni.setStorageSync('auto_rotate_config', form.value);

            // 会员到期处理
            if (isPayEnabled.value && !userStore.isVip && form.value.enabled) {
                form.value.enabled = false;
                switchKey.value++;
                uni.setStorageSync('auto_rotate_config', form.value);
                // #ifdef APP
                stopAutoRotate();
                // #endif
                uni.showToast({
                    title: '会员已到期，自动更换壁纸已暂停',
                    icon: 'none',
                    duration: 3000,
                });
            }
        }
    } catch (e) {
        console.error('Failed to load auto-rotate config', e);
    }
};

const loadBoards = async () => {
    if (!userStore.isLoggedIn && !userStore.userinfo?.id) return;
    try {
        const res = await apiGetBoards();
        if (res?.data && Array.isArray(res.data)) {
            boardsList.value = res.data;
        }
    } catch (e) {
        console.error('Failed to load boards', e);
    }
};

const handleBack = () => {
    uni.navigateBack();
};

const goToExplore = () => {
    uni.switchTab({ url: '/pages/app/classify' });
};

const goToFavorite = () => {
    uni.navigateTo({ url: '/pages/app/favorite' });
};

const resetSwitch = () => {
    form.value.enabled = false;
    switchKey.value++;
};

// 鉴权与 VIP 拦截检查
const checkAuthAndVip = (onCancelCallback) => {
    // 1. 任何平台保存与管理个人配置，均需先登录账号
    if (!userStore.isLoggedIn && !userStore.userinfo?.id) {
        showNavDialog({
            title: t('common.tip'),
            content: t('autoWallpaper.loginRequiredPrompt') || '使用自动壁纸功能需要先登录账号',
            confirmText: t('user.profile.login') || '去登录',
            cancelText: t('common.cancel'),
            onConfirm: () => {
                uni.navigateTo({ url: '/pages/auth/signin' });
            },
            onCancel: () => {
                if (typeof onCancelCallback === 'function') {
                    onCancelCallback();
                }
            },
        });
        return false;
    }

    // 2. 如果后台关闭了支付（pay_enabled === false），已登录用户全员免费无门槛使用！
    if (!isPayEnabled.value) {
        return true;
    }

    // 3. pay_enabled === true 时：校验 VIP 状态以及到期时间
    const isVipActive = userStore.isVip;
    let isExpired = false;
    const expireTime = userStore.userinfo?.profile?.vip_expire_time;
    if (expireTime) {
        const expireDate = new Date(
            typeof expireTime === 'string' && expireTime.includes(' ') && !expireTime.includes('T')
                ? expireTime.replace(/-/g, '/')
                : expireTime,
        );
        if (expireDate.getTime() < Date.now()) {
            isExpired = true;
        }
    }

    if (!isVipActive || isExpired) {
        showNavDialog({
            title: t('common.tip'),
            content: isExpired ? '您的 VIP 会员已到期，请续费后继续使用自动更换壁纸' : t('autoWallpaper.vipRequiredPrompt'),
            confirmText: t('membership.title') || '开通会员',
            cancelText: t('common.cancel'),
            onConfirm: () => {
                uni.navigateTo({ url: '/pages/member/payment' });
            },
            onCancel: () => {
                if (typeof onCancelCallback === 'function') {
                    onCancelCallback();
                }
            },
        });
        return false;
    }

    return true;
};

const onMasterSwitchChange = async (e) => {
    const nextVal = e.detail.value;
    if (nextVal) {
        const passed = checkAuthAndVip(() => {
            resetSwitch();
        });
        if (!passed) {
            resetSwitch();
            return;
        }
        if (form.value.mode === 'board' && !form.value.board) {
            uni.showToast({ title: '请先选择要轮播的画板', icon: 'none' });
            resetSwitch();
            return;
        }
        if (form.value.mode === 'theme' && (!form.value.light_wallpaper || !form.value.dark_wallpaper)) {
            uni.showToast({ title: '请先设置浅色壁纸和深色壁纸', icon: 'none' });
            resetSwitch();
            return;
        }
    }
    form.value.enabled = nextVal;
    await executeSaveConfig(false);
};

const onWifiSwitchChange = (e) => {
    form.value.wifi_only = e.detail.value;
};

const selectMode = (mode) => {
    form.value.mode = mode;
};

const selectTarget = (target) => {
    form.value.target = target;
};

const selectFrequency = (freq) => {
    form.value.frequency = freq;
};

const selectStrategy = (strat) => {
    form.value.strategy = strat;
};

const openBoardPicker = () => {
    const passed = checkAuthAndVip();
    if (!passed) return;
    boardPicker.value?.open();
};

const onBoardSelected = ({ board }) => {
    form.value.board = board.id;
    form.value.board_name = board.name;
};

// 深浅壁纸槽位选择与操作
const openSlotActionSheet = (slot) => {
    const passed = checkAuthAndVip();
    if (!passed) return;

    const itemList = ['从我的收藏 / 画板选取', '从手机相册选取'];
    if (form.value[slot === 'light' ? 'light_wallpaper' : 'dark_wallpaper']) {
        itemList.push('清除当前设定');
    }

    uni.showActionSheet({
        itemList,
        success: (res) => {
            if (res.tapIndex === 0) {
                wallPicker.value?.open(slot);
            } else if (res.tapIndex === 1) {
                pickFromAlbum(slot);
            } else if (res.tapIndex === 2) {
                clearSlot(slot);
            }
        },
    });
};

const pickFromAlbum = (slot) => {
    uni.chooseImage({
        count: 1,
        sourceType: ['album'],
        sizeType: ['original'],
        success: (res) => {
            const tempFilePath = res.tempFilePaths?.[0];
            if (tempFilePath) {
                onWallpaperSelected({
                    slot,
                    wallpaper: {
                        id: 'album_' + Date.now(),
                        url: tempFilePath,
                        thumb: tempFilePath,
                        title: '本地相册图片',
                        source: 'album',
                    },
                });
            }
        },
    });
};

const clearSlot = (slot) => {
    form.value[slot === 'light' ? 'light_wallpaper' : 'dark_wallpaper'] = null;
    uni.showToast({ title: '已清除', icon: 'none' });
};

const onWallpaperSelected = ({ slot, wallpaper }) => {
    form.value[slot === 'light' ? 'light_wallpaper' : 'dark_wallpaper'] = wallpaper;
    uni.showToast({ title: '已选定壁纸', icon: 'none' });
};

const copyUrl = (url, toastMsg = '链接已复制') => {
    uni.setClipboardData({
        data: url,
        success: () => {
            uni.showToast({ title: toastMsg, icon: 'none' });
        },
    });
};

// 打开 iOS 系统自带的快捷指令 App
const openShortcutsApp = () => {
    // #ifdef APP-PLUS
    plus.runtime.openURL('shortcuts://', () => {
        uni.showToast({ title: '未能打开快捷指令 App，请在桌面打开', icon: 'none' });
    });
    // #endif
    // #ifndef APP-PLUS
    uni.showToast({ title: '请在桌面打开「快捷指令」应用', icon: 'none' });
    // #endif
};

const handleDownloadAppTip = () => {
    uni.showModal({
        title: t('autoWallpaper.mpDownloadModalTitle'),
        content: t('autoWallpaper.mpDownloadModalContent'),
        showCancel: false,
        confirmText: t('common.confirm') || '我知道了',
    });
};

// 轮播测试拉取
const handleTestRotate = async () => {
    if (isTesting.value) return;
    isTesting.value = true;
    try {
        uni.showLoading({ title: t('autoWallpaper.testing') });

        // 若为深浅双色模式，本地模拟当前主题对应的测试结果
        if (form.value.mode === 'theme') {
            uni.hideLoading();
            const currentTheme = settingsStore.isDark ? 'dark' : 'light';
            const targetWall = currentTheme === 'dark' ? form.value.dark_wallpaper : form.value.light_wallpaper;
            if (!targetWall?.url) {
                uni.showToast({ title: `请先设置${currentTheme === 'dark' ? '深色' : '浅色'}壁纸`, icon: 'none' });
                return;
            }
            testResult.value = {
                image_url: targetWall.url,
                title: targetWall.title || (currentTheme === 'dark' ? '深色模式壁纸' : '浅色模式壁纸'),
                mode: 'theme',
                theme: currentTheme,
                target: form.value.target,
                rotated_at: new Date().toISOString(),
            };
            testPopup.value?.open();
            return;
        }

        const res = await apiGetRotateFeed({
            token: form.value.rotate_token || '',
            mode: form.value.mode || 'bing',
        });
        uni.hideLoading();
        if (res?.data) {
            testResult.value = res.data;
            testPopup.value?.open();
        } else {
            uni.showToast({ title: '拉取失败，请检查设置', icon: 'none' });
        }
    } catch (e) {
        uni.hideLoading();
        console.error('Test rotate failed:', e);
        const errMsg = e?.message || e?.error || e?.errMsg || '拉取失败，请检查网络';
        uni.showToast({ title: errMsg, icon: 'none' });
    } finally {
        isTesting.value = false;
    }
};

// iOS 端将测试壁纸保存至系统相册
const saveWallpaperToAlbum = (url) => {
    if (!url) return;
    uni.showLoading({ title: '正在下载壁纸...' });
    uni.downloadFile({
        url,
        success: (res) => {
            if (res.statusCode === 200) {
                uni.saveImageToPhotosAlbum({
                    filePath: res.tempFilePath,
                    success: () => {
                        uni.hideLoading();
                        uni.showToast({ title: '已保存至相册，可设为系统壁纸', icon: 'none' });
                        testPopup.value?.close();
                    },
                    fail: () => {
                        uni.hideLoading();
                        uni.showToast({ title: '保存失败，请检查相册访问权限', icon: 'none' });
                    },
                });
            } else {
                uni.hideLoading();
                uni.showToast({ title: '壁纸下载失败', icon: 'none' });
            }
        },
        fail: () => {
            uni.hideLoading();
            uni.showToast({ title: '壁纸下载失败，请检查网络', icon: 'none' });
        },
    });
};

// Android 原生设置壁纸
const applyWallpaperNative = () => {
    if (!testResult.value?.image_url) return;

    // #ifdef APP-PLUS
    const device = uni.getDeviceInfo();
    if (device.platform === 'android' || (typeof plus !== 'undefined' && plus.android)) {
        uni.showLoading({ title: '正在设置壁纸...' });
        const imgUrl = testResult.value.image_url;

        if (imgUrl.startsWith('file://') || imgUrl.startsWith('_doc/') || imgUrl.startsWith('/storage/')) {
            const localPath = plus.io.convertLocalFileSystemURL(imgUrl);
            setAndroidWallpaper(localPath, form.value.target || 'lock')
                .then(() => {
                    uni.hideLoading();
                    uni.showToast({ title: '壁纸设置成功！', icon: 'success' });
                    testPopup.value?.close();
                })
                .catch((err) => {
                    uni.hideLoading();
                    uni.showToast({ title: '设置壁纸失败: ' + (err?.message || err), icon: 'none' });
                });
            return;
        }

        uni.downloadFile({
            url: imgUrl,
            success: (downloadRes) => {
                if (downloadRes.statusCode === 200) {
                    const localPath = plus.io.convertLocalFileSystemURL(downloadRes.tempFilePath);
                    setAndroidWallpaper(localPath, form.value.target || 'lock')
                        .then(() => {
                            uni.hideLoading();
                            uni.showToast({ title: '壁纸设置成功！', icon: 'success' });
                            testPopup.value?.close();
                        })
                        .catch((err) => {
                            uni.hideLoading();
                            uni.showToast({ title: '设置壁纸失败: ' + (err?.message || err), icon: 'none' });
                        });
                } else {
                    uni.hideLoading();
                    uni.showToast({ title: '壁纸下载失败', icon: 'none' });
                }
            },
            fail: () => {
                uni.hideLoading();
                uni.showToast({ title: '壁纸下载失败，请检查网络', icon: 'none' });
            },
        });
        return;
    }
    // #endif

    uni.showToast({ title: '当前运行环境暂不支持直接调用系统壁纸 API', icon: 'none' });
};

const executeSaveConfig = async (showSuccessToast = true) => {
    const passed = checkAuthAndVip();
    if (!passed) return false;

    if (form.value.mode === 'board' && !form.value.board) {
        uni.showToast({ title: '请先选择要轮播的画板', icon: 'none' });
        return false;
    }
    if (form.value.mode === 'theme' && (!form.value.light_wallpaper || !form.value.dark_wallpaper)) {
        uni.showToast({ title: '请先设置浅色壁纸和深色壁纸', icon: 'none' });
        return false;
    }

    saving.value = true;
    try {
        const payload = {
            enabled: currentPlatform.value === 'ios' ? true : form.value.enabled,
            mode: form.value.mode,
            board_id: form.value.board,
            light_wallpaper: form.value.light_wallpaper,
            dark_wallpaper: form.value.dark_wallpaper,
            target: form.value.target,
            frequency: form.value.frequency,
            strategy: form.value.strategy,
            wifi_only: form.value.wifi_only,
        };

        const saveRes = await apiSaveRotateConfig(payload);
        if (saveRes?.data?.rotate_token) {
            form.value.rotate_token = saveRes.data.rotate_token;
        }

        uni.setStorageSync('auto_rotate_config', form.value);

        // #ifdef APP
        if (currentPlatform.value === 'android') {
            if (form.value.enabled) {
                startAutoRotate({
                    feedUrl: feedUrl.value,
                    frequency: form.value.frequency || 'unlock',
                    target: form.value.target || 'lock',
                    wifiOnly: form.value.wifi_only !== false,
                    mode: form.value.mode,
                    lightWallpaperUrl: form.value.light_wallpaper?.url || '',
                    darkWallpaperUrl: form.value.dark_wallpaper?.url || '',
                });
            } else {
                stopAutoRotate();
            }
        }
        // #endif

        if (showSuccessToast) {
            uni.showToast({ title: t('autoWallpaper.saveSuccess') || '壁纸配置保存成功', icon: 'none' });
        } else {
            uni.showToast({
                title: form.value.enabled ? '自动更换已开启' : '自动更换已关闭',
                icon: 'none',
            });
        }
        return true;
    } catch (e) {
        console.error('Failed to save auto-rotate config:', e);
        uni.setStorageSync('auto_rotate_config', form.value);
        const errMsg = e?.message || e?.error || e?.errMsg || t('autoWallpaper.saveFailed');
        uni.showToast({ title: errMsg, icon: 'none' });
        return false;
    } finally {
        saving.value = false;
    }
};

const handleSaveConfig = () => {
    executeSaveConfig(true);
};
</script>

<style lang="scss" scoped>
@import '@/common/styles/theme-variables.scss';

.layout {
    min-height: 100vh;
    background: var(--page-background);
    display: flex;
    flex-direction: column;
}

.nav-header {
    background: var(--page-background);
    border-bottom: none;
    position: sticky;
    top: 0;
    z-index: 100;
}

.nav-bar {
    height: 112rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30rpx;

    .back-btn {
        width: 60rpx;
        height: 60rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: opacity 0.2s ease;

        &:active {
            opacity: 0.7;
        }
    }

    .nav-title {
        font-size: 34rpx;
        font-weight: 700;
        color: var(--text-primary);
        flex: 1;
        text-align: center;
    }

    .nav-placeholder {
        width: 60rpx;
        height: 60rpx;
    }
}

.config-scroll {
    flex: 1;
    height: calc(100vh - 120rpx);
}

.config-content {
    padding: 24rpx;
    display: flex;
    flex-direction: column;
    gap: 24rpx;
    padding-bottom: 96rpx;
}

.platform-container {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
}

/* ════════════════════════════════════════════════════════════════
   1. 鸿蒙专属样式
════════════════════════════════════════════════════════════════ */
.harmony-notice-card {
    background: var(--panel-background, rgba(120, 120, 128, 0.06));
    border-radius: 28rpx;
    padding: 32rpx;
    display: flex;
    flex-direction: column;
    gap: 24rpx;
    box-shadow: 0 4rpx 16rpx var(--shadow-color);
    border-left: 8rpx solid #6366f1;

    .harmony-notice-header {
        display: flex;
        align-items: flex-start;
        gap: 20rpx;
    }

    .harmony-icon-circle {
        width: 72rpx;
        height: 72rpx;
        border-radius: 50%;
        background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .harmony-notice-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8rpx;
    }

    .harmony-title-row {
        display: flex;
        align-items: center;
        gap: 12rpx;
    }

    .harmony-notice-title {
        font-size: 30rpx;
        font-weight: 700;
        color: var(--text-primary);
    }

    .harmony-tag {
        font-size: 20rpx;
        font-weight: 600;
        color: #ef4444;
        background: rgba(239, 68, 68, 0.12);
        padding: 4rpx 14rpx;
        border-radius: 999rpx;
    }

    .harmony-notice-desc {
        font-size: 24rpx;
        line-height: 1.5;
        color: var(--text-tertiary);
    }

    .harmony-tips-box {
        display: flex;
        flex-direction: column;
        gap: 12rpx;
        background: var(--panel-background-strong, rgba(120, 120, 128, 0.08));
        padding: 20rpx 24rpx;
        border-radius: 20rpx;

        .harmony-tip-row {
            display: flex;
            align-items: flex-start;
            gap: 10rpx;

            .harmony-dot {
                color: #6366f1;
                font-weight: bold;
            }

            .harmony-tip-text {
                font-size: 23rpx;
                color: var(--text-secondary);
                line-height: 1.45;
            }
        }
    }

    .harmony-actions-box {
        display: flex;
        flex-direction: column;
        gap: 16rpx;
        margin-top: 8rpx;

        .harmony-btn {
            height: 80rpx;
            border-radius: 20rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12rpx;
            font-size: 26rpx;
            font-weight: 600;

            &--primary {
                background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
                color: #ffffff;
                box-shadow: 0 4rpx 14rpx rgba(79, 70, 229, 0.3);
            }

            &--secondary {
                background: var(--panel-background-strong, rgba(120, 120, 128, 0.12));
                color: var(--text-primary);
            }
        }
    }
}

/* ════════════════════════════════════════════════════════════════
   2. 微信小程序专属样式
════════════════════════════════════════════════════════════════ */
.mp-notice-card {
    background: var(--panel-background, rgba(120, 120, 128, 0.06));
    border-radius: 28rpx;
    padding: 30rpx;
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    box-shadow: 0 4rpx 16rpx var(--shadow-color);

    .mp-notice-header {
        display: flex;
        align-items: flex-start;
        gap: 20rpx;
    }

    .mp-icon-circle {
        width: 68rpx;
        height: 68rpx;
        border-radius: 50%;
        background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4rpx 12rpx rgba(79, 70, 229, 0.3);
    }

    .mp-notice-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8rpx;
    }

    .mp-title-row {
        display: flex;
        align-items: center;
        gap: 12rpx;
        flex-wrap: wrap;
    }

    .mp-notice-title {
        font-size: 28rpx;
        font-weight: 700;
        color: var(--text-primary);
    }

    .mp-recommend-badge {
        font-size: 20rpx;
        font-weight: 600;
        color: #b45309;
        background: #fef3c7;
        padding: 4rpx 14rpx;
        border-radius: 999rpx;

        .theme-dark & {
            color: #fbbf24;
            background: rgba(245, 158, 11, 0.18);
        }
    }

    .mp-notice-desc {
        font-size: 24rpx;
        line-height: 1.5;
        color: var(--text-tertiary);
    }

    .mp-notice-features {
        display: flex;
        flex-direction: column;
        gap: 10rpx;
        background: var(--panel-background-strong, rgba(120, 120, 128, 0.08));
        padding: 16rpx 20rpx;
        border-radius: 18rpx;

        .feature-tag {
            display: flex;
            align-items: center;
            gap: 12rpx;

            &.is-unsupported {
                opacity: 0.9;
            }
        }

        .feature-text {
            font-size: 22rpx;
            color: var(--text-secondary);
            font-weight: 500;

            &.feature-unsupported {
                color: var(--text-tertiary);
            }
        }
    }

    .mp-notice-action {
        height: 72rpx;
        background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
        border-radius: 20rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12rpx;
        box-shadow: 0 4rpx 14rpx rgba(79, 70, 229, 0.25);
        cursor: pointer;

        .mp-action-text {
            font-size: 26rpx;
            font-weight: 600;
            color: #ffffff;
        }
    }
}

/* ════════════════════════════════════════════════════════════════
   3. iOS 快捷指令专属样式
════════════════════════════════════════════════════════════════ */
.ios-hero-banner {
    background: var(--panel-background, rgba(120, 120, 128, 0.06));
    border-radius: 28rpx;
    padding: 28rpx 30rpx;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    box-shadow: 0 4rpx 16rpx var(--shadow-color);
    border-left: 8rpx solid #000000;

    .theme-dark & {
        border-left-color: #ffffff;
    }

    .banner-top-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .apple-badge {
        display: inline-flex;
        align-items: center;
        gap: 8rpx;
        background: #000000;
        color: #ffffff;
        padding: 6rpx 18rpx;
        border-radius: 999rpx;

        .apple-badge-text {
            font-size: 22rpx;
            font-weight: 700;
        }
    }

    .banner-sub {
        font-size: 22rpx;
        color: var(--text-tertiary);
        line-height: 1.45;
    }

    .status-chip {
        display: inline-flex;
        align-items: center;
        gap: 6rpx;
        padding: 4rpx 14rpx;
        border-radius: 999rpx;
        font-size: 20rpx;
        font-weight: 700;

        &.vip-chip {
            background: rgba(251, 191, 36, 0.15);
            color: #fbbf24;
        }

        &.free-chip {
            background: rgba(99, 102, 241, 0.12);
            color: #6366f1;
        }
    }
}

.hub-header {
    margin-bottom: 20rpx;
    display: flex;
    flex-direction: column;
    gap: 6rpx;

    .hub-title {
        font-size: 28rpx;
        font-weight: 700;
        color: var(--text-primary);
    }

    .hub-sub {
        font-size: 22rpx;
        color: var(--text-tertiary);
    }
}

.feed-copy-group {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    margin-top: 10rpx;

    .feed-item {
        display: flex;
        flex-direction: column;
        gap: 8rpx;

        .feed-label-row {
            display: flex;
            align-items: center;
            gap: 8rpx;

            .feed-label {
                font-size: 22rpx;
                font-weight: 600;
                color: var(--text-secondary);
            }
        }

        .feed-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14rpx 20rpx;
            background: var(--panel-background-strong, rgba(120, 120, 128, 0.12));
            border-radius: 16rpx;
            gap: 14rpx;

            .feed-url-text {
                font-size: 20rpx;
                color: var(--text-tertiary);
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                flex: 1;
            }

            .copy-chip {
                padding: 6rpx 20rpx;
                border-radius: 999rpx;
                background: #4f46e5;
                color: #ffffff;
                font-size: 20rpx;
                font-weight: 600;
                cursor: pointer;
                flex-shrink: 0;
            }
        }
    }
}

.ios-actions-row {
    display: flex;
    gap: 16rpx;
    margin-top: 24rpx;

    .ios-sub-btn {
        flex: 1;
        height: 76rpx;
        border-radius: 20rpx;
        background: var(--panel-background-strong, rgba(120, 120, 128, 0.12));
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8rpx;
        font-size: 25rpx;
        font-weight: 600;
        color: var(--text-primary);
    }

    .ios-main-btn {
        flex: 1.3;
        height: 76rpx;
        border-radius: 20rpx;
        background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8rpx;
        font-size: 25rpx;
        font-weight: 700;
        color: #ffffff;
        box-shadow: 0 4rpx 14rpx rgba(79, 70, 229, 0.3);
    }
}

.shortcuts-guide-card {
    background: var(--panel-background, rgba(120, 120, 128, 0.06));
    border-radius: 30rpx;
    padding: 30rpx;
    display: flex;
    flex-direction: column;
    gap: 24rpx;
    box-shadow: 0 6rpx 20rpx var(--shadow-color);

    .guide-header {
        display: flex;
        flex-direction: column;
        gap: 8rpx;

        .guide-title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;

            .guide-title {
                font-size: 28rpx;
                font-weight: 700;
                color: var(--text-primary);
            }

            .guide-badge {
                font-size: 20rpx;
                font-weight: 600;
                color: #10b981;
                background: rgba(16, 185, 129, 0.12);
                padding: 4rpx 14rpx;
                border-radius: 999rpx;
            }
        }

        .guide-desc {
            font-size: 22rpx;
            color: var(--text-tertiary);
            line-height: 1.45;
        }
    }

    .guide-steps {
        display: flex;
        flex-direction: column;
        gap: 16rpx;

        .step-card {
            display: flex;
            gap: 18rpx;
            padding: 20rpx;
            background: var(--panel-background-strong, rgba(120, 120, 128, 0.08));
            border-radius: 20rpx;

            .step-num-pill {
                width: 48rpx;
                height: 48rpx;
                border-radius: 14rpx;
                background: #4f46e5;
                color: #ffffff;
                font-size: 22rpx;
                font-weight: 800;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .step-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 8rpx;

                .step-title {
                    font-size: 26rpx;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .step-desc {
                    font-size: 22rpx;
                    color: var(--text-tertiary);
                    line-height: 1.45;
                }

                .step-sub-box {
                    display: flex;
                    flex-direction: column;
                    gap: 6rpx;
                    margin-top: 4rpx;

                    .sub-point {
                        font-size: 22rpx;
                        color: var(--text-secondary);
                        line-height: 1.4;

                        .bold-text {
                            font-weight: 700;
                            color: var(--text-primary);
                        }
                    }
                }

                .action-flow {
                    display: flex;
                    flex-direction: column;
                    gap: 8rpx;
                    margin-top: 6rpx;

                    .flow-item {
                        display: flex;
                        align-items: flex-start;
                        gap: 10rpx;

                        .flow-index {
                            width: 32rpx;
                            height: 32rpx;
                            border-radius: 50%;
                            background: rgba(99, 102, 241, 0.15);
                            color: #6366f1;
                            font-size: 20rpx;
                            font-weight: 700;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            flex-shrink: 0;
                            margin-top: 2rpx;
                        }

                        .flow-text {
                            font-size: 22rpx;
                            color: var(--text-secondary);
                            line-height: 1.45;
                        }
                    }
                }
            }
        }
    }

    .open-shortcuts-action {
        height: 80rpx;
        background: #000000;
        border-radius: 20rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12rpx;
        cursor: pointer;
        box-shadow: 0 4rpx 14rpx rgba(0, 0, 0, 0.2);

        .theme-dark & {
            background: #4f46e5;
            box-shadow: 0 4rpx 14rpx rgba(79, 70, 229, 0.35);
        }

        .action-text {
            font-size: 26rpx;
            font-weight: 700;
            color: #ffffff;
        }
    }
}

/* ════════════════════════════════════════════════════════════════
   4. Android 原生自动更换中心专属样式
════════════════════════════════════════════════════════════════ */
.hero-card {
    background: var(--panel-background, rgba(120, 120, 128, 0.06));
    border-radius: 30rpx;
    padding: 30rpx 32rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 6rpx 20rpx var(--shadow-color);
    border: 2rpx solid transparent;
    transition: all 0.25s ease;

    &.is-active {
        border-color: rgba(99, 102, 241, 0.3);
        background: linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%);
    }

    .hero-left {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8rpx;
        padding-right: 20rpx;
    }

    .hero-badge-row {
        display: flex;
        align-items: center;
        gap: 14rpx;
        flex-wrap: wrap;
    }

    .hero-title {
        font-size: 32rpx;
        font-weight: 800;
        color: var(--text-primary);
        letter-spacing: -0.5rpx;
    }

    .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 6rpx;
        padding: 4rpx 16rpx;
        border-radius: 999rpx;

        .badge-text {
            font-size: 20rpx;
            font-weight: 700;
        }

        &.vip-badge {
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
            color: #fbbf24;
            box-shadow: 0 2rpx 8rpx rgba(251, 191, 36, 0.2);

            &.is-vip {
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                color: #fef08a;
            }
        }

        &.free-badge {
            background: rgba(99, 102, 241, 0.12);
            color: #6366f1;
            border: 1rpx solid rgba(99, 102, 241, 0.25);
        }
    }

    .hero-desc {
        font-size: 22rpx;
        color: var(--text-tertiary);
        line-height: 1.4;
    }

    .hero-switch-wrap {
        flex-shrink: 0;
    }
}

.mode-hub-card {
    background: var(--panel-background, rgba(120, 120, 128, 0.06));
    border-radius: 30rpx;
    padding: 26rpx;
    box-shadow: 0 6rpx 20rpx var(--shadow-color);
    transition: opacity 0.2s ease;

    &.is-disabled {
        opacity: 0.42;
        pointer-events: none;
    }

    .mode-tabs {
        display: flex;
        background: var(--panel-background-strong, rgba(120, 120, 128, 0.12));
        border-radius: 20rpx;
        padding: 6rpx;
        gap: 8rpx;
        margin-bottom: 24rpx;

        .mode-tab {
            flex: 1;
            height: 72rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10rpx;
            border-radius: 16rpx;
            cursor: pointer;
            transition: all 0.22s ease;

            .tab-label {
                font-size: 25rpx;
                font-weight: 600;
                color: var(--text-secondary);
                transition: color 0.2s ease;
            }

            &.is-active {
                background: #4f46e5;
                box-shadow: 0 4rpx 14rpx rgba(79, 70, 229, 0.35);

                .tab-label {
                    color: #ffffff;
                    font-weight: 700;
                }
            }
        }
    }

    .mode-panel {
        display: flex;
        flex-direction: column;
        gap: 18rpx;
    }

    .bing-intro-box {
        display: flex;
        align-items: center;
        gap: 20rpx;
        padding: 24rpx;
        border-radius: 20rpx;
        background: var(--panel-background-strong, rgba(120, 120, 128, 0.08));

        .bing-icon-box {
            width: 76rpx;
            height: 76rpx;
            border-radius: 18rpx;
            background: rgba(99, 102, 241, 0.12);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .bing-intro-text {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 6rpx;

            .intro-title {
                font-size: 28rpx;
                font-weight: 700;
                color: var(--text-primary);
            }

            .intro-desc {
                font-size: 22rpx;
                color: var(--text-tertiary);
                line-height: 1.45;
            }
        }
    }

    .theme-intro-bar {
        display: flex;
        align-items: center;
        gap: 10rpx;
        padding: 12rpx 16rpx;
        border-radius: 14rpx;
        background: rgba(99, 102, 241, 0.08);

        .theme-intro-text {
            font-size: 22rpx;
            color: var(--text-secondary);
            font-weight: 500;
        }
    }

    .theme-wall-showcase {
        display: flex;
        gap: 20rpx;
        margin-top: 6rpx;

        .wall-showcase-item {
            flex: 1;
            background: var(--panel-background-strong, rgba(120, 120, 128, 0.08));
            border-radius: 22rpx;
            padding: 18rpx;
            display: flex;
            flex-direction: column;
            gap: 12rpx;
            cursor: pointer;
            transition: transform 0.18s ease;

            &:active {
                transform: scale(0.98);
            }

            .item-tag-row {
                display: flex;
                align-items: center;
                justify-content: space-between;

                .tag-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 6rpx;
                    padding: 4rpx 12rpx;
                    border-radius: 999rpx;

                    .tag-title {
                        font-size: 20rpx;
                        font-weight: 700;
                    }

                    &--light {
                        background: rgba(245, 158, 11, 0.15);
                        color: #f59e0b;
                    }

                    &--dark {
                        background: rgba(129, 140, 248, 0.15);
                        color: #818cf8;
                    }
                }

                .action-btn-mini {
                    width: 36rpx;
                    height: 36rpx;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            }

            .showcase-cover {
                width: 100%;
                aspect-ratio: 9 / 13;
                border-radius: 16rpx;
                overflow: hidden;
                background: rgba(0, 0, 0, 0.06);
                display: flex;
                align-items: center;
                justify-content: center;

                .cover-img {
                    width: 100%;
                    height: 100%;
                }

                .empty-cover {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8rpx;

                    .empty-icon-wrap {
                        width: 56rpx;
                        height: 56rpx;
                        border-radius: 50%;
                        background: var(--panel-background, rgba(120, 120, 128, 0.15));
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .empty-text {
                        font-size: 22rpx;
                        font-weight: 600;
                        color: var(--text-secondary);
                    }

                    .empty-sub {
                        font-size: 18rpx;
                        color: var(--text-tertiary);
                    }
                }
            }

            .item-label {
                font-size: 20rpx;
                color: var(--text-tertiary);
                text-align: center;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
        }
    }

    .panel-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16rpx 0;
        cursor: pointer;

        .row-left {
            display: flex;
            flex-direction: column;
            gap: 6rpx;

            .row-title {
                font-size: 28rpx;
                font-weight: 700;
                color: var(--text-primary);
            }

            .row-desc {
                font-size: 22rpx;
                color: var(--text-tertiary);
            }
        }

        .board-picker-trigger {
            display: flex;
            align-items: center;
            gap: 8rpx;
            background: var(--panel-background-strong, rgba(120, 120, 128, 0.12));
            padding: 10rpx 20rpx;
            border-radius: 999rpx;

            .trigger-text {
                font-size: 24rpx;
                color: var(--text-tertiary);

                &.is-selected {
                    color: #4f46e5;
                    font-weight: 700;

                    .theme-dark & {
                        color: #818cf8;
                    }
                }
            }
        }
    }

    .panel-sub-section {
        display: flex;
        flex-direction: column;
        gap: 12rpx;
        padding-top: 12rpx;

        .sub-section-title {
            font-size: 24rpx;
            font-weight: 600;
            color: var(--text-secondary);
        }
    }
}

.grouped-card {
    background: var(--panel-background, rgba(120, 120, 128, 0.06));
    border-radius: 30rpx;
    padding: 10rpx 28rpx;
    box-shadow: 0 6rpx 20rpx var(--shadow-color);
    transition: opacity 0.2s ease;

    &.is-disabled {
        opacity: 0.42;
        pointer-events: none;
    }

    /* 目标屏幕通栏分段选择器（绝不折行） */
    .group-target-section {
        display: flex;
        flex-direction: column;
        gap: 16rpx;
        padding: 22rpx 0 16rpx;

        .section-label-row {
            display: flex;
            align-items: center;
            justify-content: space-between;

            .row-title {
                font-size: 28rpx;
                font-weight: 700;
                color: var(--text-primary);
            }

            .row-sub-hint {
                font-size: 22rpx;
                color: var(--text-tertiary);
            }
        }

        .full-width-segmented {
            display: flex;
            width: 100%;
            background: var(--panel-background-strong, rgba(120, 120, 128, 0.12));
            border-radius: 18rpx;
            padding: 6rpx;
            gap: 8rpx;
            box-sizing: border-box;

            .segmented-pill {
                flex: 1;
                height: 64rpx;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 14rpx;
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;

                .pill-text {
                    font-size: 24rpx;
                    font-weight: 600;
                    color: var(--text-secondary);
                    white-space: nowrap;
                    word-break: keep-all;
                    transition: color 0.2s ease;
                }

                &.is-active {
                    background: #4f46e5;
                    box-shadow: 0 4rpx 12rpx rgba(79, 70, 229, 0.35);

                    .pill-text {
                        color: #ffffff;
                        font-weight: 700;
                    }
                }
            }
        }
    }

    .group-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24rpx 0;

        &--clickable {
            cursor: pointer;
        }

        .row-left {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 6rpx;
            padding-right: 16rpx;

            .row-title {
                font-size: 28rpx;
                font-weight: 700;
                color: var(--text-primary);
            }

            .row-desc {
                font-size: 22rpx;
                color: var(--text-tertiary);
            }
        }
    }

    .group-divider {
        height: 1rpx;
        background: var(--panel-border, rgba(120, 120, 128, 0.15));
    }

    .test-pill-btn {
        display: flex;
        align-items: center;
        gap: 8rpx;
        background: #4f46e5;
        padding: 10rpx 22rpx;
        border-radius: 999rpx;
        box-shadow: 0 4rpx 12rpx rgba(79, 70, 229, 0.28);
        cursor: pointer;

        .test-pill-text {
            font-size: 22rpx;
            font-weight: 600;
            color: #ffffff;
        }
    }
}

.compact-segmented {
    display: flex;
    background: var(--panel-background-strong, rgba(120, 120, 128, 0.12));
    border-radius: 16rpx;
    padding: 6rpx;
    gap: 6rpx;

    .segmented-item {
        flex: 1;
        height: 60rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12rpx;
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 0 16rpx;

        .segmented-text {
            font-size: 23rpx;
            font-weight: 600;
            color: var(--text-secondary);
            transition: color 0.2s ease;
        }

        &.is-active {
            background: #4f46e5;
            box-shadow: 0 2rpx 8rpx rgba(79, 70, 229, 0.3);

            .segmented-text {
                color: #ffffff;
                font-weight: 700;
            }
        }
    }
}

.save-bar-wrap {
    margin-top: 10rpx;

    &.is-disabled {
        opacity: 0.42;
        pointer-events: none;
    }

    .save-glow-btn {
        height: 88rpx;
        border-radius: 24rpx;
        background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12rpx;
        box-shadow: 0 8rpx 24rpx rgba(79, 70, 229, 0.35);
        cursor: pointer;
        transition: transform 0.15s ease, opacity 0.15s ease;

        &:active {
            opacity: 0.9;
            transform: scale(0.99);
        }

        .save-glow-text {
            font-size: 30rpx;
            font-weight: 700;
            color: #ffffff;
        }
    }
}

/* 测试弹窗卡片 */
.test-dialog-card {
    width: 620rpx;
    background: var(--surface-card, #ffffff);
    border-radius: 32rpx;
    padding: 32rpx;
    box-sizing: border-box;

    &.theme-dark {
        background: #1e2430;
    }

    .test-dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24rpx;

        .test-dialog-title {
            font-size: 30rpx;
            font-weight: 700;
            color: var(--text-primary);
        }

        .close-btn {
            width: 48rpx;
            height: 48rpx;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }

    .test-preview-img-box {
        width: 100%;
        height: 600rpx;
        border-radius: 20rpx;
        overflow: hidden;
        position: relative;
        background: rgba(0, 0, 0, 0.05);

        .test-preview-img {
            width: 100%;
            height: 100%;
        }

        .test-tag {
            position: absolute;
            top: 16rpx;
            left: 16rpx;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            color: #ffffff;
            font-size: 20rpx;
            font-weight: 600;
            padding: 6rpx 16rpx;
            border-radius: 999rpx;
        }
    }

    .test-details {
        margin: 20rpx 0 24rpx;
        display: flex;
        flex-direction: column;
        gap: 6rpx;

        .detail-title {
            font-size: 26rpx;
            font-weight: 700;
            color: var(--text-primary);
        }

        .detail-sub {
            font-size: 20rpx;
            color: var(--text-tertiary);
        }
    }

    .apply-native-btn {
        height: 80rpx;
        border-radius: 20rpx;
        background: #4f46e5;
        color: #ffffff;
        font-size: 26rpx;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10rpx;

        &--ios {
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
            box-shadow: 0 4rpx 14rpx rgba(2, 132, 199, 0.3);
        }
    }
}
</style>
