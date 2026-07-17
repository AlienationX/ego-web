<template>
    <view :class="['layout', settingsStore.isDark ? 'theme-dark' : 'theme-light']">
        <!-- Minimal Nav Bar -->
        <menu-bar class="nav-bar">
            <!-- No title, keep it clean -->
        </menu-bar>

        <view class="main-scroll">
            <view class="container">
                
                <!-- Minimal Hero Header -->
                <view class="hero-header">
                    <text class="hero-title">{{ t('membership.title') || (locale === 'en' ? 'Get EGO Premium' : '获取 EGO 高级版') }}</text>
                    <text class="hero-subtitle">{{ locale === 'en' ? 'Unlock all premium features and elevate your experience.' : '解锁所有高级功能，提升您的专属体验。' }}</text>
                </view>

                <!-- Vertical Benefits List -->
                <view class="benefits-list">
                    <view class="benefit-row" v-for="(benefit, index) in benefits" :key="index">
                        <uni-icons type="checkmarkempty" size="22" :color="settingsStore.isDark ? '#fff' : '#0f172a'"></uni-icons>
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
                            <text>{{ locale === 'en' ? 'Best Value' : '最受欢迎' }}</text>
                        </view>
                    </view>
                </view>

                <!-- Payment Methods (Clean Native-like List) -->
                <view class="payment-methods-list">
                    <view class="pm-title">{{ locale === 'en' ? 'Pay with' : '选择支付方式' }}</view>
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
                <text>{{ locale === 'en' ? 'Continue' : '继续' }}</text>
            </button>
            <text class="footer-terms">{{ locale === 'en' ? 'Cancel anytime. Terms and Privacy apply.' : '随时可取消。开通即视为同意会员及隐私协议。' }}</text>
            <view class="safe-area-bottom"></view>
        </view>
    </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsStore } from "@/stores/settings.js";
import { useUserStore } from "@/stores/user.js";
import { apiGetPaymentProducts, apiAlipayOrder, apiGetOrderStatus, apiMockPay } from "@/api/payment.js";

const { t, locale } = useI18n();
const settingsStore = useSettingsStore();
const userStore = useUserStore();

const selectedCard = ref(0);
const rawProducts = ref([]);

// ── 1. 特权列表 ──────────────────────────────────────────────
const benefits = computed(() => [
    { title: locale.value === "en" ? "Unlimited 4K Downloads" : "无限次下载 4K 高清壁纸" },
    { title: locale.value === "en" ? "Exclusive Pro Wallpapers" : "解锁所有专属高级壁纸" },
    { title: locale.value === "en" ? "Ad-free Experience" : "无广告纯净浏览体验" },
    { title: locale.value === "en" ? "Premium VIP Badge" : "尊贵 VIP 专属身份标识" },
]);

// ── 2. 动态商品卡片 ────────────────────────────────────────
const membershipCards = computed(() => {
    return rawProducts.value.map((p) => {
        const avg = p.period_days > 0 ? (p.price / p.period_days).toFixed(2) : p.price;
        const curSym = p.currency === "USD" ? "$" : "¥";
        return {
            id: p.id,
            title: locale.value === "en" ? p.name_en : p.name,
            price: p.price,
            originalPrice: p.original_price,
            currency: p.currency,
            avgText: locale.value === "en" ? `${curSym}${avg}/day` : `折合 ${curSym}${avg}/天`,
            savings: locale.value === "en" ? p.description_en : p.description,
            recommended: p.recommended,
        };
    });
});

const selectCard = (index) => {
    selectedCard.value = index;
};

// ── 3. 支付方式 ────────────────────────────────────────────
const selectedPayment = ref("alipay");
const paymentMethods = computed(() => [
    { id: "alipay", name: t("membership.alipay") || "Alipay", iconSrc: "/static/icons/brands/alipay.svg" },
    { id: "wechat", name: t("membership.wechat") || "WeChat Pay", iconSrc: "/static/icons/brands/wxpay.svg" },
    { id: "paypal", name: t("membership.paypal") || "PayPal", iconSrc: "/static/icons/brands/paypal.svg" },
]);

// ── 4. 加载商品 ────────────────────────────────────────────
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

onMounted(() => {
    fetchProducts();
});

// ── 5. 支付结果轮询 ────────────────────────────────────────
let pollTimer = null;

const onPaymentSuccess = () => {
    uni.hideLoading();
    uni.showToast({ title: locale.value === "en" ? "Welcome to VIP 🎉" : "支付成功！欢迎加入VIP 🎉", icon: "success" });
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
                uni.showToast({ title: locale.value === "en" ? "Payment failed or timed out" : "支付失败或超时，请重试", icon: "none" });
            }
        } catch (e) {
            console.error("Poll order status error:", e);
        }
        retries++;
    }, interval);
};

onUnmounted(() => clearInterval(pollTimer));

// ── 6. 支付入口 ────────────────────────────────────────────
const handlePurchase = async () => {
    if (selectedCard.value === null || !membershipCards.value.length) return;
    const card = membershipCards.value[selectedCard.value];
    const methodName = paymentMethods.value.find((m) => m.id === selectedPayment.value)?.name || "Unknown";

    uni.showModal({
        title: locale.value === "en" ? "Checkout" : "安全收银台",
        content: t("membership.confirmPaymentInfo", { title: card.title, price: card.price, method: methodName }),
        confirmColor: settingsStore.isDark ? "#fff" : "#000",
        cancelColor: "#94a3b8",
        confirmText: locale.value === "en" ? "Confirm" : "确认支付",
        cancelText: locale.value === "en" ? "Cancel" : "再想想",
        success: async (modalRes) => {
            if (!modalRes.confirm) return;

            uni.showLoading({ title: locale.value === "en" ? "Creating order..." : "创建订单中..." });

            try {
                if (selectedPayment.value === "alipay") {
                    await handleAlipay(card, uni.getDeviceInfo().platform);
                } else {
                    uni.hideLoading();
                    uni.showToast({ title: locale.value === "en" ? "Coming soon" : "该支付方式暂未开放", icon: "none" });
                }
            } catch (err) {
                uni.hideLoading();
                console.error("Purchase error:", err);
                uni.showToast({ title: err.message || (locale.value === "en" ? "Request failed" : "请求失败"), icon: "none" });
            }
        },
    });
};

// ── 7. 支付宝支付 ────────────────────────────────────────
const handleAlipay = async (card, platform) => {
    const createRes = await apiAlipayOrder({ product_id: card.id, platform });

    if (!(createRes.code === 200 && createRes.data)) {
        throw new Error(createRes.message || (locale.value === "en" ? "Order creation failed" : "下单失败"));
    }

    const { order_no, order_string } = createRes.data;

    // ── App 真实支付 ──────────────────
    // #ifdef APP-PLUS
    uni.hideLoading();
    uni.requestPayment({
        provider: "alipay",
        orderInfo: order_string,
        success: () => {
            // 支付宝客户端返回成功后轮询后端确认（避免客户端伪造）
            uni.showLoading({ title: locale.value === "en" ? "Verifying..." : "确认支付中..." });
            pollOrderStatus(order_no);
        },
        fail: (err) => {
            if (err.errMsg?.includes("cancel")) {
                uni.showToast({ title: locale.value === "en" ? "Payment cancelled" : "已取消支付", icon: "none" });
            } else {
                uni.showToast({ title: locale.value === "en" ? "Payment failed" : "支付失败，请重试", icon: "none" });
            }
        },
    });
    return;
    // #endif

    // ── 非 App 端：显示 Mock 沙盒弹窗（用于 H5 / 小程序开发调试）──
    uni.hideLoading();
    uni.showModal({
        title: locale.value === "en" ? "Sandbox Mode" : "测试沙盒环境",
        content:
            locale.value === "en"
                ? `Order: ${order_no}\nSimulate successful payment?`
                : `订单号：${order_no}\n是否模拟支付成功？`,
        confirmColor: "#10b981",
        confirmText: locale.value === "en" ? "Simulate Pay" : "模拟付款",
        cancelText: locale.value === "en" ? "Cancel" : "取消",
        success: async (mockRes) => {
            if (mockRes.confirm) {
                uni.showLoading({ title: locale.value === "en" ? "Simulating..." : "模拟付款中..." });
                try {
                    const mockPayRes = await apiMockPay(order_no);
                    if (mockPayRes.code === 200) {
                        onPaymentSuccess();
                    } else {
                        throw new Error(mockPayRes.message);
                    }
                } catch (e) {
                    uni.hideLoading();
                    uni.showToast({ title: e.message || "Mock pay failed", icon: "none" });
                }
            }
        },
    });
};


</script>

<style lang="scss" scoped>
/* ================= 极简主题变量 ================= */
.theme-dark {
    --bg-main: #000000;
    --card-bg: #1c1c1e;
    --card-border: #2c2c2e;
    --text-primary: #ffffff;
    --text-subtitle: #8e8e93;
    --item-bg: #1c1c1e;
    --btn-bg: #ffffff;
    --btn-text: #000000;
    --radio-border: #3a3a3c;
    --radio-active: #ffffff;
    --footer-bg: rgba(0, 0, 0, 0.85);
}

.theme-light {
    --bg-main: #ffffff;
    --card-bg: #f2f2f7;
    --card-border: #e5e5ea;
    --text-primary: #000000;
    --text-subtitle: #8e8e93;
    --item-bg: #f2f2f7;
    --btn-bg: #000000;
    --btn-text: #ffffff;
    --radio-border: #c7c7cc;
    --radio-active: #000000;
    --footer-bg: rgba(255, 255, 255, 0.85);
}

/* ================= 基础布局 ================= */
.layout {
    min-height: 100vh;
    background: var(--bg-main);
    color: var(--text-primary);
    transition: background 0.3s, color 0.3s;
    display: flex;
    flex-direction: column;
}

.main-scroll {
    flex: 1;
}

.container {
    padding: 20rpx 40rpx;
}

/* ================= 极简头部 ================= */
.hero-header {
    margin: 40rpx 0 60rpx;
    
    .hero-title {
        font-size: 64rpx;
        font-weight: 800;
        line-height: 1.1;
        letter-spacing: -1rpx;
        color: var(--text-primary);
        display: block;
        margin-bottom: 16rpx;
    }
    
    .hero-subtitle {
        font-size: 30rpx;
        color: var(--text-subtitle);
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
        
        .benefit-text {
            font-size: 32rpx;
            font-weight: 600;
            color: var(--text-primary);
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
    border: 4rpx solid transparent;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.2s ease;
    
    &.is-selected {
        border-color: var(--text-primary);
        background: var(--bg-main);
    }
    
    .plan-info {
        display: flex;
        flex-direction: column;
        gap: 8rpx;
        
        .plan-title {
            font-size: 36rpx;
            font-weight: 700;
            color: var(--text-primary);
        }
        
        .plan-desc {
            font-size: 24rpx;
            color: #10b981; /* success green */
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
            color: var(--text-primary);
        }
        
        .plan-avg {
            font-size: 24rpx;
            color: var(--text-subtitle);
            font-weight: 500;
        }
    }
    
    .recommend-pill {
        position: absolute;
        top: -18rpx;
        left: 50%;
        transform: translateX(-50%);
        background: var(--text-primary);
        color: var(--bg-main);
        padding: 6rpx 20rpx;
        border-radius: 999rpx;
        font-size: 20rpx;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1rpx;
    }
}

/* ================= 支付方式 ================= */
.payment-methods-list {
    margin-bottom: 40rpx;
    
    .pm-title {
        font-size: 28rpx;
        font-weight: 700;
        color: var(--text-subtitle);
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
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 24rpx;
            
            .pm-icon {
                width: 40rpx;
                height: 40rpx;
            }
        }
        
        .pm-name {
            flex: 1;
            font-size: 32rpx;
            font-weight: 600;
            color: var(--text-primary);
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
    z-index: 100;
    
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
        
        &:active {
            opacity: 0.8;
            transform: scale(0.98);
        }
        
        &[disabled] {
            opacity: 0.5;
        }
    }
    
    .footer-terms {
        font-size: 22rpx;
        color: var(--text-subtitle);
        font-weight: 500;
        text-align: center;
    }
}
</style>
