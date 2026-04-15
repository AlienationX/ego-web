<template>
    <view :class="['layout', isDark ? 'theme-dark' : 'theme-light']">
        <!-- 1. 沉浸式导航栏 -->
        <menu-bar class="nav-bar">
            <template #title>{{ t('membership.title') }}</template>
        </menu-bar>

        <scroll-view scroll-y class="main-scroll" :show-scrollbar="false">
            <view class="container">
                <!-- 2. 会员身份头部状态 & 数据背书 -->
                <view class="vip-header">
                    <view class="vip-bg-mesh"></view>
                    <view class="vip-bg-glow"></view>
                    <view class="user-status">
                        <view class="avatar-box">
                            <image class="avatar" :src="userStore.userinfo?.profile?.avatar || '/static/images/pics/default_avatar.svg'" mode="aspectFill"></image>
                            <view class="vip-badge" v-if="userStore.isVip">VIP</view>
                        </view>
                        <view class="info">
                            <view class="welcome">
                                {{ userStore.userinfo?.profile?.nickname || '尊敬的用户' }}
                            </view>
                            <view class="sub-welcome">
                                {{ userStore.isVip ? '您的会员有效期至 ' + userStore.vipExpireTime : '开通超级会员，尊享百万无水印原图' }}
                            </view>
                        </view>
                    </view>
                    
                    <!-- 营销数据背书 -->
                    <view class="stats-bar">
                        <view class="stat-item">
                            <text class="num">100W+</text>
                            <text class="label">高清原图</text>
                        </view>
                        <view class="stat-divider"></view>
                        <view class="stat-item">
                            <text class="num">50W+</text>
                            <text class="label">尊贵VIP</text>
                        </view>
                        <view class="stat-divider"></view>
                        <view class="stat-item">
                            <text class="num">每日</text>
                            <text class="label">持续更新</text>
                        </view>
                    </view>
                </view>

                <!-- 营销横幅：限时秒杀 -->
                <view class="promo-banner" v-if="!userStore.isVip">
                    <view class="promo-left">
                        <uni-icons type="fire-filled" size="18" color="#ff4d4f"></uni-icons>
                        <text class="promo-text">限时狂欢，低至 <text class="highlight">¥0.24</text>/天</text>
                    </view>
                    <view class="promo-right">
                        <text class="countdown-label">距结束</text>
                        <view class="time-block">12</view>
                        <text class="time-colon">:</text>
                        <view class="time-block">45</view>
                        <text class="time-colon">:</text>
                        <view class="time-block">00</view>
                    </view>
                </view>

                <!-- 3. 会员套餐选择器 (横向滑动对比布局) -->
                <view class="section-title">
                    <text class="title-text">精选套餐</text>
                    <text class="sub-title-text">解锁全部特权</text>
                </view>
                <scroll-view scroll-x class="cards-scroll-view" :show-scrollbar="false">
                    <view class="cards-container">
                        <view 
                            class="membership-card" 
                            v-for="(card, index) in membershipCards" 
                            :key="index"
                            :class="{ 'recommended': card.recommended, 'selected': selectedCard === index }"
                            @click="selectCard(index)"
                        >
                            <!-- 扫光推荐标签 -->
                            <view class="recommend-tag" v-if="card.recommended">
                                <uni-icons type="vip" size="12" color="#78350f"></uni-icons>
                                <text class="tag-text">{{ t('membership.recommended') }}</text>
                                <view class="shimmer"></view>
                            </view>

                            <!-- 已选中水印 -->
                            <view class="selected-watermark" v-if="selectedCard === index">已选</view>

                            <view class="card-title">{{ card.title }}</view>
                            
                            <view class="price-box">
                                <text class="unit">¥</text>
                                <text class="amount">{{ card.price }}</text>
                            </view>
                            
                            <view class="old-price" v-if="card.originalPrice">
                                原价 ¥{{ card.originalPrice }}
                            </view>

                            <view class="divide-line"></view>

                            <view class="avg-price-text">折合 {{ card.avgText }}</view>
                            
                            <view class="savings-badge" v-if="card.savings">
                                {{ card.savings }}
                            </view>

                            <!-- 选中光环和边框 -->
                            <view class="selected-aura" v-if="selectedCard === index"></view>
                            <view class="selected-tick" v-if="selectedCard === index">
                                <uni-icons type="checkmarkempty" size="14" color="#fff"></uni-icons>
                            </view>
                        </view>
                    </view>
                </scroll-view>

                <!-- 4. 特权金钻矩阵 -->
                <view class="section-title" style="margin-top: 20rpx;">
                    <text class="title-text">超级特权</text>
                    <text class="sub-title-text">VIP专属 畅享极致体验</text>
                </view>
                <view class="benefits-grid">
                    <view class="benefit-card" v-for="(benefit, index) in benefits" :key="index">
                        <view class="benefit-icon">
                            <mdi-icon :path="benefit.iconPath" size="32px" :color="isDark ? '#f8fbff' : '#619aef'"></mdi-icon>
                        </view>
                        <view class="benefit-content">
                            <view class="b-title">{{ benefit.title }}</view>
                            <view class="b-desc">{{ benefit.text }}</view>
                        </view>
                    </view>
                </view>

                <!-- 5. 信任背书与支付决策区 -->
                <view class="trust-container">
                    <view class="trust-title">
                        <view class="line"></view>
                        <text>安全支付保障</text>
                        <view class="line"></view>
                    </view>
                    <view class="trust-icons">
                        <view class="t-item"><uni-icons type="checkbox-filled" size="16" color="#34d399"></uni-icons><text>官方认证</text></view>
                        <view class="t-item"><uni-icons type="checkbox-filled" size="16" color="#34d399"></uni-icons><text>隐私保护</text></view>
                        <view class="t-item"><uni-icons type="checkbox-filled" size="16" color="#34d399"></uni-icons><text>售后无忧</text></view>
                    </view>
                </view>

                <!-- 底部填充，避免被浮动购买按钮遮挡 -->
                <view style="height: 140rpx;"></view>
            </view>
        </scroll-view>

        <!-- 悬浮购买区域 -->
        <view class="purchase-footer">
            <view class="agreement-tip">
                开通即视为同意 <text class="link">《会员服务协议》</text>
            </view>
            <view class="purchase-action">
                <view class="amount-display">
                    <text class="lbl">合计:</text>
                    <text class="val">¥{{ currentCardPrice }}</text>
                </view>
                <button 
                    class="purchase-btn" 
                    :disabled="selectedCard === null"
                    @click="handlePurchase"
                >
                    <view class="btn-inner">
                        <text class="btn-text">立即开通</text>
                    </view>
                    <view class="btn-glow"></view>
                </button>
            </view>
            <view class="safe-area-bottom"></view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSettingsStore } from '@/stores/settings.js';
import { useUserStore } from '@/stores/user.js';

const { t } = useI18n();
const settingsStore = useSettingsStore();
const userStore = useUserStore();

const isDark = computed(() => settingsStore.options.theme === 'dark');
const selectedCard = ref(1); // 默认选中推荐项(季卡)

const currentCardPrice = computed(() => {
    if (selectedCard.value === null) return '0.00';
    return membershipCards.value[selectedCard.value].price;
});

// 1. 会员特权升级（增加更丰满的文案）
const benefits = computed(() => [
    {
        iconPath: '/static/icons/download.svg',
        title: '无限下载',
        text: '突破限制，尽情保存原画级高清壁纸'
    },
    {
        iconPath: '/static/icons/image.svg',
        title: '4K原图',
        text: '解锁最高分辨率，纤毫毕现的视觉盛宴'
    },
    {
        iconPath: '/static/icons/crown-circle.svg',
        title: '尊贵标识',
        text: '点亮专属红名与皇冠，彰显VIP身份'
    },
    {
        iconPath: '/static/icons/heart.svg',
        title: '免除广告',
        text: '纯净沉浸浏览，告别一切弹窗与干扰'
    }
]);

// 2. 营销化会员套餐数据
const membershipCards = computed(() => [
    {
        title: t('membership.monthly'),
        price: '12',
        originalPrice: '18',
        avgText: '¥0.40/天',
        period: t('membership.monthlyPeriod'),
        savings: '限时 6.6 折',
        recommended: false
    },
    {
        title: t('membership.quarterly'),
        price: '30',
        originalPrice: '45',
        avgText: '¥10.00/月',
        period: t('membership.quarterlyPeriod'),
        savings: '热销超 80%',
        recommended: true
    },
    {
        title: t('membership.yearly'),
        price: '88',
        originalPrice: '158',
        avgText: '¥0.24/天',
        period: t('membership.yearlyPeriod'),
        savings: '买一年送三个月',
        recommended: false
    }
]);

const selectCard = (index) => {
    selectedCard.value = index;
};

const handlePurchase = () => {
    if (selectedCard.value === null) return;
    const card = membershipCards.value[selectedCard.value];
    
    uni.showModal({
        title: '安全收银台',
        content: `正在为您开通 ${card.title}，需支付 ¥${card.price}`,
        confirmColor: '#619aef',
        cancelColor: '#94a3b8',
        confirmText: '确认支付',
        cancelText: '再想想',
        success: (res) => {
            if (res.confirm) {
                uni.showLoading({ title: '安全连接中...' });
                setTimeout(() => {
                    uni.hideLoading();
                    uni.showToast({ title: '支付成功！欢迎加入VIP', icon: 'success' });
                    setTimeout(() => uni.navigateBack(), 2000);
                }, 1800);
            }
        }
    });
};
</script>

<style lang="scss" scoped>
/* ================= 主题变量 ================= */
.theme-dark {
    --bg-main: #0b1017;
    --bg-mesh: radial-gradient(circle at top right, rgba(97, 154, 239, 0.12), transparent 45%);
    --card-bg: rgba(255, 255, 255, 0.04);
    --card-border: rgba(255, 255, 255, 0.08);
    --text-primary: #f8fbff;
    --text-subtitle: #94a3b8;
    --text-highlight: #619aef;
    --item-bg: rgba(255, 255, 255, 0.03);
    --footer-bg: rgba(11, 16, 23, 0.95);
    --footer-border: rgba(255, 255, 255, 0.06);
}

.theme-light {
    --bg-main: #f8fafc;
    --bg-mesh: radial-gradient(circle at top right, rgba(97, 154, 239, 0.08), transparent 45%);
    --card-bg: #ffffff;
    --card-border: rgba(148, 163, 184, 0.2);
    --text-primary: #0f172a;
    --text-subtitle: #64748b;
    --text-highlight: #3b82f6;
    --item-bg: #f1f5f9;
    --footer-bg: rgba(255, 255, 255, 0.98);
    --footer-border: rgba(148, 163, 184, 0.15);
}

/* ================= 基础重置 ================= */
.layout {
    min-height: 100vh;
    background: var(--bg-main);
    color: var(--text-primary);
    transition: all 0.4s ease;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
}

.main-scroll {
    flex: 1;
    height: 0;
}

.container {
    padding: 0 32rpx;
    background: var(--bg-mesh);
}

/* ================= 头部光环与信息 ================= */
.vip-header {
    position: relative;
    padding: 50rpx 40rpx;
    background: linear-gradient(135deg, #2a3a5a, #131d2e);
    border-radius: 42rpx;
    margin: 20rpx 0 40rpx;
    overflow: hidden;
    box-shadow: 0 20rpx 40rpx -10rpx rgba(0, 0, 0, 0.3);

    .vip-bg-mesh {
        position: absolute; inset: 0; opacity: 0.15;
        background-image: radial-gradient(circle at 20px 20px, white 1px, transparent 0);
        background-size: 40px 40px;
    }
    
    .vip-bg-glow {
        position: absolute; top: -50%; right: -20%;
        width: 300rpx; height: 300rpx; border-radius: 50%;
        background: radial-gradient(circle, rgba(97,154,239,0.4) 0%, transparent 70%);
    }

    .user-status {
        position: relative; z-index: 1; display: flex; align-items: center; gap: 24rpx;

        .avatar-box {
            position: relative;
            .avatar {
                width: 100rpx; height: 100rpx; border-radius: 999rpx;
                border: 4rpx solid rgba(255, 255, 255, 0.2);
            }
            .vip-badge {
                position: absolute; bottom: -4rpx; right: -8rpx;
                background: linear-gradient(to right, #f59e0b, #fbbf24);
                color: #78350f; font-size: 18rpx; font-weight: 900; 
                padding: 2rpx 12rpx; border-radius: 10rpx; border: 2rpx solid #131d2e;
                font-style: italic; box-shadow: 0 4rpx 8rpx rgba(0,0,0,0.2);
            }
        }

        .welcome { font-size: 34rpx; font-weight: 800; color: #fff; text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.3); }
        .sub-welcome { font-size: 24rpx; color: rgba(255, 255, 255, 0.8); margin-top: 8rpx; }
    }
    
    .stats-bar {
        position: relative; z-index: 1; margin-top: 40rpx; padding-top: 30rpx;
        border-top: 1rpx solid rgba(255,255,255,0.1);
        display: flex; justify-content: space-around; align-items: center;
        
        .stat-item {
            display: flex; flex-direction: column; align-items: center; gap: 4rpx;
            .num { color: #facc15; font-size: 32rpx; font-weight: 800; }
            .label { color: rgba(255,255,255,0.7); font-size: 20rpx; font-weight: 500; }
        }
        .stat-divider { width: 1rpx; height: 30rpx; background: rgba(255,255,255,0.1); }
    }
}

/* ================= 营销横幅 ================= */
.promo-banner {
    display: flex; justify-content: space-between; align-items: center;
    background: linear-gradient(90deg, rgba(239, 68, 68, 0.1), rgba(245, 158, 11, 0.05));
    border: 1rpx solid rgba(239, 68, 68, 0.2); border-radius: 20rpx;
    padding: 20rpx 24rpx; margin-bottom: 30rpx;
    background-color: var(--card-bg);
    backdrop-filter: blur(8rpx);
    
    .promo-left { 
        display: flex; align-items: center; gap: 8rpx; 
        .promo-text { font-size: 26rpx; color: var(--text-primary); font-weight: 600; }
        .highlight { color: #ef4444; font-size: 28rpx; font-weight: 800; }
    }
    .promo-right {
        display: flex; align-items: center; gap: 6rpx;
        .countdown-label { font-size: 22rpx; color: #f59e0b; margin-right: 4rpx; }
        .time-block { 
            background: #ef4444; color: #fff; font-size: 20rpx; font-weight: 700;
            padding: 4rpx 8rpx; border-radius: 6rpx; line-height: 1;
        }
        .time-colon { color: #ef4444; font-size: 20rpx; font-weight: 700; }
    }
}

/* ================= 标题复用 ================= */
.section-title {
    display: flex; align-items: baseline; gap: 16rpx; margin-bottom: 30rpx;
    .title-text { font-size: 36rpx; font-weight: 900; }
    .sub-title-text { font-size: 24rpx; color: var(--text-subtitle); font-weight: 500; }
}

/* ================= 横向滑动套餐 ================= */
.cards-scroll-view {
    width: auto; margin: 0 -32rpx;
    .cards-container { padding: 10rpx 32rpx 40rpx; display: flex; gap: 24rpx; }
}

.membership-card {
    position: relative; flex-shrink: 0; width: 250rpx; padding: 40rpx 24rpx 30rpx;
    background: var(--card-bg); border: 4rpx solid var(--card-border); border-radius: 36rpx;
    display: flex; flex-direction: column; align-items: center; text-align: center;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    backdrop-filter: blur(16rpx); overflow: hidden; // for watermark

    &.selected {
        border-color: #3b82f6; transform: translateY(-10rpx); background: rgba(59,130,246,0.03);
        .selected-aura {
            position: absolute; inset: -4rpx; border-radius: 36rpx;
            box-shadow: 0 0 24rpx rgba(59, 130, 246, 0.3); pointer-events: none;
        }
    }

    &.recommended {
        border-color: #fbbf24;
        background: linear-gradient(180deg, var(--card-bg), rgba(251, 191, 36, 0.08));
        &.selected {
            border-color: #f59e0b;
            .selected-aura { box-shadow: 0 0 24rpx rgba(245, 158, 11, 0.3); }
            .selected-tick { background: #f59e0b; border-color: #f59e0b; }
        }
    }

    .recommend-tag {
        position: absolute; top: -2rpx; left: -2rpx;
        background: linear-gradient(to right, #facc15, #fbbf24); 
        color: #78350f; font-size: 18rpx; font-weight: 900; 
        padding: 6rpx 16rpx; border-radius: 36rpx 0 16rpx 0;
        display: flex; align-items: center; gap: 4rpx;
        z-index: 5; overflow: hidden;
        
        .shimmer {
            position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
            transform: skewX(-20deg); animation: tag-shimmer 2.5s infinite running;
        }
    }
    
    .selected-watermark {
        position: absolute; right: -20rpx; top: 50%; transform: rotate(15deg);
        font-size: 100rpx; font-weight: 900; opacity: 0.03; color: var(--text-primary);
        pointer-events: none; user-select: none;
    }

    .card-title { font-size: 32rpx; font-weight: 800; margin-bottom: 24rpx; color: var(--text-primary); }
    
    .price-box {
        display: flex; align-items: baseline; gap: 4rpx; color: #ef4444; margin-bottom: 12rpx;
        .unit { font-size: 26rpx; font-weight: 800; }
        .amount { font-size: 56rpx; font-weight: 900; line-height: 1; letter-spacing: -2rpx; }
    }

    .old-price { font-size: 22rpx; color: var(--text-subtitle); text-decoration: line-through; margin-bottom: 16rpx; }
    
    .divide-line { width: 60%; height: 2rpx; background: var(--card-border); margin-bottom: 16rpx; }

    .avg-price-text { font-size: 24rpx; color: var(--text-highlight); font-weight: 600; margin-bottom: 14rpx; }
    
    .savings-badge {
        font-size: 20rpx; color: #fff; background: #ef4444;
        padding: 6rpx 14rpx; border-radius: 999rpx; font-weight: 700;
        box-shadow: 0 4rpx 10rpx rgba(239, 68, 68, 0.3);
    }
    
    .selected-tick {
        position: absolute; bottom: 0; right: 0;
        width: 44rpx; height: 44rpx; background: #3b82f6;
        border-radius: 16rpx 0 36rpx 0; display: flex; align-items: center; justify-content: center;
        border: 4rpx solid var(--bg-main); border-bottom: none; border-right: none;
    }
}

/* ================= 特权矩阵 ================= */
.benefits-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 24rpx; margin-bottom: 60rpx;

    .benefit-card {
        padding: 32rpx 24rpx; background: var(--card-bg); border: 2rpx solid var(--card-border);
        border-radius: 36rpx; display: flex; flex-direction: column; align-items: flex-start; gap: 20rpx;
        backdrop-filter: blur(12rpx); box-shadow: 0 8rpx 20rpx rgba(0,0,0,0.02);

        .benefit-icon {
            width: 80rpx; height: 80rpx; border-radius: 24rpx;
            background: linear-gradient(135deg, rgba(97, 154, 239, 0.2), rgba(59, 130, 246, 0.05));
            display: flex; align-items: center; justify-content: center;
        }
        .b-title { font-size: 30rpx; font-weight: 800; color: var(--text-primary); }
        .b-desc { font-size: 22rpx; color: var(--text-subtitle); line-height: 1.5; }
    }
}

/* ================= 信任背书区 ================= */
.trust-container {
    padding: 0 40rpx; margin-bottom: 20rpx;
    .trust-title {
        display: flex; align-items: center; justify-content: center; gap: 20rpx; margin-bottom: 24rpx;
        .line { height: 1rpx; width: 60rpx; background: var(--card-border); }
        text { font-size: 22rpx; color: var(--text-subtitle); font-weight: 500; letter-spacing: 2rpx; }
    }
    .trust-icons {
        display: flex; justify-content: space-between;
        .t-item { 
            display: flex; align-items: center; gap: 8rpx; 
            text { font-size: 22rpx; color: var(--text-subtitle); }
        }
    }
}

/* ================= 底部悬浮购买栏 ================= */
.purchase-footer {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 100;
    padding: 24rpx 32rpx; background: var(--footer-bg); backdrop-filter: blur(30rpx);
    border-top: 2rpx solid var(--footer-border); display: flex; flex-direction: column; gap: 16rpx;
    box-shadow: 0 -10rpx 40rpx rgba(0, 0, 0, 0.05);

    .agreement-tip {
        text-align: center; font-size: 22rpx; color: var(--text-subtitle);
        .link { color: var(--text-highlight); font-weight: 600; }
    }

    .purchase-action {
        display: flex; align-items: center; justify-content: space-between; gap: 24rpx;
        
        .amount-display {
            display: flex; align-items: baseline; gap: 12rpx;
            .lbl { font-size: 28rpx; color: var(--text-primary); font-weight: 600; }
            .val { font-size: 48rpx; font-weight: 900; color: #ef4444; }
        }

        .purchase-btn {
            flex: 1; height: 100rpx; border-radius: 50rpx; margin: 0;
            background: linear-gradient(90deg, #3b82f6, #619aef);
            border: none; position: relative; overflow: hidden;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 16rpx 32rpx -8rpx rgba(59, 130, 246, 0.5);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

            .btn-inner { position: relative; z-index: 10; display: flex; align-items: center; }
            .btn-text { color: #fff; font-size: 32rpx; font-weight: 800; letter-spacing: 2rpx; }
            .btn-glow {
                position: absolute; inset: 0; background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 60%);
                opacity: 0; transition: opacity 0.3s;
            }

            &[disabled] { opacity: 0.5; filter: grayscale(0.5); box-shadow: none; transform: scale(1); }
            &:active:not([disabled]) { transform: scale(0.96); box-shadow: 0 8rpx 16rpx -6rpx rgba(59, 130, 246, 0.4); }
        }
    }
}

.safe-area-bottom { height: env(safe-area-inset-bottom); width: 100%; }

@keyframes tag-shimmer {
    0% { left: -150%; }
    40% { left: 150%; }
    100% { left: 150%; }
}
</style>
