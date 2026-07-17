<template>
    <view :class="['layout', settingsStore.isDark ? 'theme-dark' : 'theme-light']">
        <!-- Decorative Fixed Status Bar Background -->
        <view class="status-bar-bg" :style="{ height: `${statusBarHeight}px` }"></view>

        <!-- Custom Navigation Header -->
        <view class="nav-header" :style="{ paddingTop: `${statusBarHeight}px` }">
            <view class="back-btn" @click="goBack">
                <uni-icons type="back" size="22" :color="settingsStore.isDark ? '#f4f5f6' : '#18181b'"></uni-icons>
            </view>
            <view class="nav-right-box">
                <view class="premium-badge">
                    <mdi-icon path="/static/icons/crown-circle.svg" size="16px" color="#fbbf24"></mdi-icon>
                    <text class="premium-badge-text">VIP CLUB</text>
                </view>
            </view>
        </view>

        <view class="main-scroll">
            <view class="container">
                
                <!-- Minimal Hero Header -->
                <view class="hero-header">
                    <text class="hero-title">{{ t('membership.title') }}</text>
                    <text class="hero-subtitle">{{ t('membership.subtitle') }}</text>
                </view>

                <!-- Vertical Benefits List -->
                <view class="benefits-list">
                    <view class="benefit-row" v-for="(benefit, index) in benefits" :key="index">
                        <view class="benefit-icon-box">
                            <uni-icons type="checkmarkempty" size="18" color="#a855f7"></uni-icons>
                        </view>
                        <text class="benefit-text">{{ benefit.title }}</text>
                    </view>
                </view>

                <!-- Stacked Product Cards -->
                <view class="plans-container">
                    <view
                        class="plan-card"
                        v-for="(card, index) in membershipCards"
                        :key="index"
                        :class="{ 'is-selected': selectedCard === index, 'is-recommended': card.recommended }"
                        @click="selectCard(index)"
                    >
                        <view class="plan-info">
                            <text class="plan-title">{{ card.title }}</text>
                            <text class="plan-desc" v-if="card.savings">{{ card.savings }}</text>
                        </view>
                        <view class="plan-price-info">
                            <text class="plan-price">{{ card.currency === 'USD' ? '$' : '¥' }}{{ card.price }}</text>
                            <text class="plan-avg">{{ card.avgText }}</text>
                        </view>
                        <view class="recommend-pill" v-if="card.recommended">
                            <text>{{ t('membership.bestValue') }}</text>
                        </view>
                    </view>
                </view>

                <!-- Payment Methods (Clean Native-like List) -->
                <view class="payment-methods-list">
                    <view class="pm-title">{{ t('membership.payWith') }}</view>
                    <view 
                        class="pm-row" 
                        v-for="method in paymentMethods" 
                        :key="method.id"
                        @click="selectedPayment = method.id"
                    >
                        <view class="pm-icon-wrapper">
                            <image class="pm-icon" :src="method.iconSrc" mode="aspectFit"></image>
                        </view>
                        <text class="pm-name">{{ method.name }}</text>
                        <view class="pm-radio" :class="{ 'is-active': selectedPayment === method.id }">
                            <view class="radio-dot"></view>
                        </view>
                    </view>
                </view>
                
                <view class="bottom-spacer"></view>
            </view>
        </view>

        <!-- Sticky Bottom CTA -->
        <view class="sticky-footer">
            <button class="cta-btn" :disabled="selectedCard === null" @click="handlePurchase">
                <text>{{ t('membership.continue') }}</text>
            </button>
            <text class="footer-terms">{{ t('membership.terms') }}</text>
            <view class="safe-area-bottom"></view>
        </view>

        <!-- Custom Checkout Bottom Sheet (replaces uni.showModal confirmPaymentInfo) -->
        <uni-popup ref="checkoutPopup" type="bottom" :safe-area="true">
            <view class="checkout-sheet" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
                <view class="checkout-sheet__header">
                    <text class="checkout-sheet__title">{{ t('membership.checkoutTitle') }}</text>
                    <view class="checkout-sheet__close" @click="closeCheckout">
                        <uni-icons type="closeempty" size="20" :color="settingsStore.isDark ? '#a1a1aa' : '#71717a'"></uni-icons>
                    </view>
                </view>

                <view class="checkout-product-card">
                    <view class="cpc-left">
                        <view class="cpc-crown-box">
                            <mdi-icon path="/static/icons/crown-circle.svg" size="24" color="#fbbf24"></mdi-icon>
                        </view>
                        <view class="cpc-info">
                            <text class="cpc-title">{{ activeCard?.title }}</text>
                            <text class="cpc-desc">{{ activeCard?.savings || t('membership.purchaseTip') }}</text>
                        </view>
                    </view>
                    <view class="cpc-right">
                        <text class="cpc-price">{{ activeCard?.currency === 'USD' ? '$' : '¥' }}{{ activeCard?.price }}</text>
                    </view>
                </view>

                <view class="checkout-details-box">
                    <view class="checkout-detail-row">
                        <text class="cd-label">{{ t('membership.method') }}</text>
                        <view class="cd-value-box">
                            <image class="cd-icon" :src="activePaymentMethod?.iconSrc" mode="aspectFit"></image>
                            <text class="cd-value">{{ activePaymentMethod?.name }}</text>
                        </view>
                    </view>
                    
                    <view class="checkout-detail-divider"></view>
                    
                    <view class="checkout-detail-row is-total">
                        <text class="cd-label">{{ t('membership.total') }}</text>
                        <text class="cd-total-price">{{ activeCard?.currency === 'USD' ? '$' : '¥' }}{{ activeCard?.price }}</text>
                    </view>
                </view>

                <view class="security-badge">
                    <uni-icons type="locked" size="14" color="#10b981"></uni-icons>
                    <text class="security-text">{{ t('membership.secureConnection') }}</text>
                </view>

                <button class="checkout-pay-btn" @click="confirmAndExecutePayment">
                    <text>{{ t('membership.confirmPay') }}</text>
                </button>
            </view>
        </uni-popup>

        <!-- Custom Sandbox Dialog (replaces uni.showModal sandbox) -->
        <uni-popup ref="sandboxPopup" type="center" :mask-click="false">
            <view class="sandbox-dialog" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
                <view class="sandbox-dialog__icon">
                    <uni-icons type="info-filled" size="36" color="#10b981"></uni-icons>
                </view>
                <text class="sandbox-dialog__title">{{ t('membership.sandboxTitle') }}</text>
                <text class="sandbox-dialog__desc">
                    {{ tp('membership.sandboxMsg', { orderNo: mockOrderNo }) }}
                </text>
                <view class="sandbox-dialog__actions">
                    <button class="sdb-btn is-cancel" @click="cancelSandbox">
                        <text>{{ t('membership.cancel') }}</text>
                    </button>
                    <button class="sdb-btn is-confirm" @click="confirmSandboxPay">
                        <text>{{ t('membership.simulatePay') }}</text>
                    </button>
                </view>
            </view>
        </uni-popup>
    </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsStore } from "@/stores/settings.js";
import { useUserStore } from "@/stores/user.js";
import { apiGetPaymentProducts, apiAlipayOrder, apiGetOrderStatus, apiMockPay } from "@/api/payment.js";
import { getStatusBarHeight } from "@/utils/layout.js";
import { useTranslateParams } from "@/utils/i18n.js";

const { t, locale } = useI18n();
const { tp } = useTranslateParams();
const settingsStore = useSettingsStore();
const userStore = useUserStore();

const selectedCard = ref(0);
const rawProducts = ref([]);
const statusBarHeight = ref(getStatusBarHeight() || 0);

// Popups and mock states
const checkoutPopup = ref(null);
const sandboxPopup = ref(null);
const mockOrderNo = ref("");
const mockCard = ref(null);

const activeCard = computed(() => {
    if (selectedCard.value === null || !membershipCards.value.length) return null;
    return membershipCards.value[selectedCard.value];
});

const activePaymentMethod = computed(() => {
    return paymentMethods.value.find((m) => m.id === selectedPayment.value) || null;
});

const closeCheckout = () => {
    checkoutPopup.value?.close();
};

const openCheckout = () => {
    checkoutPopup.value?.open();
};

const cancelSandbox = () => {
    sandboxPopup.value?.close();
};

// Localized selector helper
const getLocalizedField = (obj, field) => {
    if (!obj) return "";
    const currentLocale = String(locale.value || "");
    if (currentLocale.startsWith("en")) {
        return obj[`${field}_en`] || obj[field];
    }
    return obj[field];
};

// 1. 极简特权列表 (使用 localized keys)
const benefits = computed(() => [
    { title: t('membership.benefit1') },
    { title: t('membership.benefit2') },
    { title: t('membership.benefit3') },
    { title: t('membership.benefit4') },
]);

// 2. 动态商品卡片数据
const membershipCards = computed(() => {
    return rawProducts.value.map((p) => {
        const avg = p.period_days > 0 ? (p.price / p.period_days).toFixed(2) : p.price;
        const curSym = p.currency === "USD" ? "$" : "¥";
        return {
            id: p.id,
            title: getLocalizedField(p, "name"),
            price: p.price,
            originalPrice: p.original_price,
            currency: p.currency,
            avgText: tp("membership.avgDayText", { symbol: curSym, price: avg }),
            savings: getLocalizedField(p, "description"),
            recommended: p.recommended,
        };
    });
});

const selectCard = (index) => {
    selectedCard.value = index;
};

// 3. 支付方式配置
const selectedPayment = ref("alipay");
const paymentMethods = computed(() => [
    { id: "alipay", name: t("membership.alipay") || "Alipay", iconSrc: "/static/icons/brands/alipay.svg" },
    { id: "wechat", name: t("membership.wechat") || "WeChat Pay", iconSrc: "/static/icons/brands/wxpay.svg" },
    { id: "paypal", name: t("membership.paypal") || "PayPal", iconSrc: "/static/icons/brands/paypal.svg" },
]);

// 4. 加载商品
const fetchProducts = async () => {
    try {
        const res = await apiGetPaymentProducts();
        if (res.code === 200 && res.data) {
            rawProducts.value = res.data;
            const recIndex = rawProducts.value.findIndex((p) => p.recommended);
            selectedCard.value = recIndex !== -1 ? recIndex : 0;
        }
    } catch (err) {
        console.error("Failed to load products:", err);
    }
};

const updateStatusBarStyle = () => {
    // #ifdef APP-PLUS || MP
    uni.setStatusBarStyle({
        style: settingsStore.isDark ? "light" : "dark"
    });
    // #endif
};

onMounted(() => {
    fetchProducts();
    updateStatusBarStyle();
});

watch(() => settingsStore.isDark, () => {
    updateStatusBarStyle();
});

// 5. 支付结果轮询
let pollTimer = null;

const onPaymentSuccess = () => {
    uni.hideLoading();
    uni.showToast({ title: t("membership.welcomeVip"), icon: "success" });
    userStore.getUserProfile && userStore.getUserProfile();
    setTimeout(() => uni.navigateBack(), 2000);
};

const pollOrderStatus = (orderNo, maxRetries = 8, interval = 2500) => {
    let retries = 0;
    clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
        try {
            const res = await apiGetOrderStatus(orderNo);
            const orderStatus = res?.data?.status;
            if (orderStatus === "paid") {
                clearInterval(pollTimer);
                onPaymentSuccess();
            } else if (orderStatus === "failed" || retries >= maxRetries) {
                clearInterval(pollTimer);
                uni.hideLoading();
                uni.showToast({ title: t("membership.payTimeout"), icon: "none" });
            }
        } catch (e) {
            console.error("Poll order status error:", e);
        }
        retries++;
    }, interval);
};

onUnmounted(() => clearInterval(pollTimer));

// 6. 支付入口 (打开自定义 Checkout 弹窗)
const handlePurchase = async () => {
    if (selectedCard.value === null || !membershipCards.value.length) return;
    openCheckout();
};

const confirmAndExecutePayment = async () => {
    const card = activeCard.value;
    if (!card) return;
    closeCheckout();
    
    uni.showLoading({ title: t("membership.creatingOrder") });

    try {
        if (selectedPayment.value === "alipay") {
            await handleAlipay(card, uni.getDeviceInfo().platform);
        } else {
            uni.hideLoading();
            uni.showToast({ title: t("membership.comingSoon"), icon: "none" });
        }
    } catch (err) {
        uni.hideLoading();
        console.error("Purchase error:", err);
        uni.showToast({ title: err.message || t("common.networkError"), icon: "none" });
    }
};

// 7. 支付宝支付
const handleAlipay = async (card, platform) => {
    const createRes = await apiAlipayOrder({ product_id: card.id, platform });

    if (!(createRes.code === 200 && createRes.data)) {
        throw new Error(createRes.message || t("membership.orderFailed"));
    }

    const { order_no, order_string } = createRes.data;

    // ── App 真实支付 ──────────────────
    // #ifdef APP-PLUS
    uni.hideLoading();
    uni.requestPayment({
        provider: "alipay",
        orderInfo: order_string,
        success: () => {
            uni.showLoading({ title: t("membership.verifying") });
            pollOrderStatus(order_no);
        },
        fail: (err) => {
            if (err.errMsg?.includes("cancel")) {
                uni.showToast({ title: t("membership.cancelPay"), icon: "none" });
            } else {
                uni.showToast({ title: t("membership.payFailed"), icon: "none" });
            }
        },
    });
    return;
    // #endif

    // ── 非 App 端：显示 Mock 自定义沙盒弹窗 ──
    uni.hideLoading();
    mockOrderNo.value = order_no;
    mockCard.value = card;
    sandboxPopup.value?.open();
};

const confirmSandboxPay = async () => {
    sandboxPopup.value?.close();
    uni.showLoading({ title: t("membership.simulating") });
    try {
        const mockPayRes = await apiMockPay(mockOrderNo.value);
        if (mockPayRes.code === 200) {
            onPaymentSuccess();
        } else {
            throw new Error(mockPayRes.message);
        }
    } catch (e) {
        uni.hideLoading();
        uni.showToast({ title: e.message || "Mock pay failed", icon: "none" });
    }
};

const goBack = () => {
    uni.navigateBack({
        fail: () => {
            uni.switchTab({ url: '/pages/app/index' });
        },
    });
};
</script>

<style lang="scss" scoped>
/* ================= 主题与 CSS 变量 ================= */
.theme-dark {
    --bg-main: var(--page-background);
    --card-bg: var(--page-background-secondary);
    --card-border: var(--panel-border);
    --text-color: var(--text-primary);
    --text-sub: var(--text-secondary);
    --btn-bg: linear-gradient(135deg, #6366f1, #a855f7);
    --btn-text: #ffffff;
    --radio-border: rgba(255, 255, 255, 0.2);
    --radio-active: #a855f7;
    --footer-bg: rgba(24, 24, 24, 0.88);
}

.theme-light {
    --bg-main: var(--page-background);
    --card-bg: var(--page-background-secondary);
    --card-border: var(--panel-border);
    --text-color: var(--text-primary);
    --text-sub: var(--text-secondary);
    --btn-bg: linear-gradient(135deg, #4f46e5, #9333ea);
    --btn-text: #ffffff;
    --radio-border: rgba(0, 0, 0, 0.12);
    --radio-active: #9333ea;
    --footer-bg: rgba(238, 241, 245, 0.88);
}

/* ================= 基础布局 ================= */
.layout {
    min-height: 100vh;
    background: var(--bg-main);
    color: var(--text-color);
    transition: background 0.3s, color 0.3s;
    display: flex;
    flex-direction: column;
}

.status-bar-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background: var(--bg-main);
    z-index: 100;
    pointer-events: none;
}

.nav-header {
    height: 100rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 40rpx;
    box-sizing: content-box;
    position: relative;
    z-index: 10;
    
    .back-btn {
        width: 72rpx;
        height: 72rpx;
        border-radius: 50%;
        background: var(--card-bg);
        border: 1rpx solid var(--card-border);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4rpx 10rpx var(--shadow-color);
        position: relative;
        z-index: 2;
        
        &:active {
            transform: scale(0.95);
            opacity: 0.9;
        }
    }

    .nav-title-box {
        position: absolute;
        left: 0;
        right: 0;
        text-align: center;
        pointer-events: none;
        
        .nav-title {
            font-size: 34rpx;
            font-weight: 800;
            color: var(--text-color);
        }
    }

    .nav-right-box {
        position: relative;
        z-index: 2;
        
        .premium-badge {
            display: flex;
            align-items: center;
            gap: 8rpx;
            padding: 8rpx 18rpx;
            border-radius: 100rpx;
            background: var(--card-bg);
            border: 1rpx solid var(--card-border);
            box-shadow: 0 4rpx 10rpx var(--shadow-color);
            
            .premium-badge-text {
                font-size: 20rpx;
                font-weight: 800;
                color: #fbbf24;
                letter-spacing: 0.5rpx;
            }
        }
    }
}

.main-scroll {
    flex: 1;
}

.container {
    padding: 0rpx 40rpx 40rpx;
}

/* ================= 极简头部 ================= */
.hero-header {
    margin: 30rpx 0 50rpx;
    
    .hero-title {
        font-size: 64rpx;
        font-weight: 800;
        line-height: 1.1;
        letter-spacing: -1rpx;
        color: var(--text-color);
        display: block;
        margin-bottom: 16rpx;
    }
    
    .hero-subtitle {
        font-size: 30rpx;
        color: var(--text-sub);
        line-height: 1.4;
        font-weight: 500;
        display: block;
    }
}

/* ================= 纵向特权列表 ================= */
.benefits-list {
    margin-bottom: 60rpx;
    
    .benefit-row {
        display: flex;
        align-items: center;
        gap: 24rpx;
        margin-bottom: 32rpx;
        
        .benefit-icon-box {
            width: 44rpx;
            height: 44rpx;
            border-radius: 50%;
            background: rgba(168, 85, 247, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .benefit-text {
            font-size: 32rpx;
            font-weight: 600;
            color: var(--text-color);
        }
    }
}

/* ================= 堆叠式卡片 ================= */
.plans-container {
    display: flex;
    flex-direction: column;
    gap: 24rpx;
    margin-bottom: 60rpx;
}

.plan-card {
    position: relative;
    padding: 36rpx 40rpx;
    border-radius: 32rpx;
    background: var(--card-bg);
    border: 4rpx solid var(--card-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 6rpx 16rpx var(--shadow-color);
    
    &.is-selected {
        border-color: var(--radio-active);
        background: rgba(168, 85, 247, 0.04);
        transform: scale(1.01);
    }
    
    .plan-info {
        display: flex;
        flex-direction: column;
        gap: 8rpx;
        
        .plan-title {
            font-size: 36rpx;
            font-weight: 700;
            color: var(--text-color);
        }
        
        .plan-desc {
            font-size: 24rpx;
            color: #10b981;
            font-weight: 600;
        }
    }
    
    .plan-price-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4rpx;
        
        .plan-price {
            font-size: 40rpx;
            font-weight: 800;
            color: var(--text-color);
        }
        
        .plan-avg {
            font-size: 24rpx;
            color: var(--text-sub);
            font-weight: 500;
        }
    }
    
    .recommend-pill {
        position: absolute;
        top: -18rpx;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        color: #78350f;
        padding: 6rpx 20rpx;
        border-radius: 999rpx;
        font-size: 20rpx;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1rpx;
        box-shadow: 0 4rpx 10rpx rgba(245, 158, 11, 0.2);
    }
}

/* ================= 支付方式 ================= */
.payment-methods-list {
    margin-bottom: 40rpx;
    
    .pm-title {
        font-size: 28rpx;
        font-weight: 700;
        color: var(--text-sub);
        margin-bottom: 24rpx;
        text-transform: uppercase;
        letter-spacing: 1rpx;
    }
    
    .pm-row {
        display: flex;
        align-items: center;
        padding: 32rpx 0;
        border-bottom: 1rpx solid var(--card-border);
        
        &:last-child {
            border-bottom: none;
        }
        
        .pm-icon-wrapper {
            width: 64rpx;
            height: 64rpx;
            border-radius: 16rpx;
            background: var(--card-bg);
            border: 1rpx solid var(--card-border);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 24rpx;
            
            .pm-icon {
                width: 44rpx;
                height: 44rpx;
            }
        }
        
        .pm-name {
            flex: 1;
            font-size: 32rpx;
            font-weight: 600;
            color: var(--text-color);
        }
        
        .pm-radio {
            width: 44rpx;
            height: 44rpx;
            border-radius: 50%;
            border: 4rpx solid var(--radio-border);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            
            &.is-active {
                border-color: var(--radio-active);
                
                .radio-dot {
                    width: 20rpx;
                    height: 20rpx;
                    background: var(--radio-active);
                    border-radius: 50%;
                }
            }
        }
    }
}

.bottom-spacer {
    height: 200rpx;
}

/* ================= 底部动作栏 ================= */
.sticky-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--footer-bg);
    backdrop-filter: blur(24rpx);
    padding: 32rpx 40rpx;
    border-top: 1px solid var(--card-border);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20rpx;
    z-index: 90;
    
    .cta-btn {
        width: 100%;
        height: 112rpx;
        border-radius: 999rpx;
        background: var(--btn-bg);
        color: var(--btn-text);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36rpx;
        font-weight: 800;
        border: none;
        margin: 0;
        box-shadow: 0 8rpx 20rpx rgba(147, 51, 234, 0.15);
        
        &:active {
            opacity: 0.9;
            transform: scale(0.98);
        }
        
        &[disabled] {
            opacity: 0.5;
        }
    }
    
    .footer-terms {
        font-size: 22rpx;
        color: var(--text-sub);
        font-weight: 500;
        text-align: center;
    }
}

/* ================= 自定义收银台底部弹窗 ================= */
.checkout-sheet {
    background: var(--card-bg);
    border-top-left-radius: 48rpx;
    border-top-right-radius: 48rpx;
    padding: 48rpx 40rpx 64rpx;
    border-top: 1rpx solid var(--card-border);
    box-shadow: 0 -12rpx 48rpx rgba(0, 0, 0, 0.08);

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 40rpx;
    }

    &__title {
        font-size: 36rpx;
        font-weight: 800;
        color: var(--text-color);
    }

    &__close {
        width: 56rpx;
        height: 56rpx;
        border-radius: 50%;
        background: var(--bg-main);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1rpx solid var(--card-border);

        &:active {
            transform: scale(0.9);
        }
    }
}

.checkout-product-card {
    background: var(--bg-main);
    padding: 32rpx;
    border-radius: 28rpx;
    border: 1rpx solid var(--card-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;

    .cpc-left {
        display: flex;
        align-items: center;
        gap: 20rpx;
    }

    .cpc-crown-box {
        width: 72rpx;
        height: 72rpx;
        border-radius: 20rpx;
        background: rgba(251, 191, 36, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .cpc-info {
        display: flex;
        flex-direction: column;
        gap: 4rpx;
    }

    .cpc-title {
        font-size: 30rpx;
        font-weight: 700;
        color: var(--text-color);
    }

    .cpc-desc {
        font-size: 22rpx;
        color: #10b981;
        font-weight: 600;
    }

    .cpc-price {
        font-size: 36rpx;
        font-weight: 800;
        color: var(--text-color);
    }
}

.checkout-details-box {
    background: var(--bg-main);
    border-radius: 28rpx;
    border: 1rpx solid var(--card-border);
    padding: 32rpx;
    margin-bottom: 40rpx;

    .checkout-detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .cd-label {
            font-size: 26rpx;
            color: var(--text-sub);
            font-weight: 500;
        }

        .cd-value-box {
            display: flex;
            align-items: center;
            gap: 12rpx;
        }

        .cd-icon {
            width: 32rpx;
            height: 32rpx;
        }

        .cd-value {
            font-size: 26rpx;
            color: var(--text-color);
            font-weight: 600;
        }

        &.is-total {
            .cd-label {
                font-size: 28rpx;
                color: var(--text-color);
                font-weight: 700;
            }

            .cd-total-price {
                font-size: 36rpx;
                color: var(--radio-active);
                font-weight: 800;
            }
        }
    }

    .checkout-detail-divider {
        height: 1rpx;
        background: var(--card-border);
        margin: 24rpx 0;
    }
}

.security-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    margin-bottom: 32rpx;

    .security-text {
        font-size: 22rpx;
        color: var(--text-sub);
        font-weight: 500;
    }
}

.checkout-pay-btn {
    width: 100%;
    height: 104rpx;
    border-radius: 999rpx;
    background: var(--btn-bg);
    color: var(--btn-text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
    font-weight: 800;
    border: none;
    box-shadow: 0 8rpx 20rpx rgba(147, 51, 234, 0.2);

    &:active {
        opacity: 0.9;
        transform: scale(0.98);
    }
}

/* ================= 自定义沙盒弹窗 ================= */
.sandbox-dialog {
    width: 80vw;
    max-width: 580rpx;
    background: var(--card-bg);
    border: 1rpx solid var(--card-border);
    border-radius: 40rpx;
    padding: 48rpx 36rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 24rpx 72rpx rgba(0, 0, 0, 0.15);

    &__icon {
        margin-bottom: 24rpx;
    }

    &__title {
        font-size: 34rpx;
        font-weight: 800;
        color: var(--text-color);
        margin-bottom: 16rpx;
        text-align: center;
    }

    &__desc {
        font-size: 26rpx;
        color: var(--text-sub);
        line-height: 1.5;
        text-align: center;
        margin-bottom: 40rpx;
        word-break: break-all;
    }

    &__actions {
        width: 100%;
        display: flex;
        gap: 20rpx;

        .sdb-btn {
            flex: 1;
            height: 88rpx;
            border-radius: 999rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28rpx;
            font-weight: 700;
            border: none;
            
            &.is-cancel {
                background: var(--bg-main);
                color: var(--text-sub);
                border: 1rpx solid var(--card-border);
            }

            &.is-confirm {
                background: #10b981;
                color: #ffffff;
            }

            &:active {
                opacity: 0.9;
                transform: scale(0.97);
            }
        }
    }
}
</style>
