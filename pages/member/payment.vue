<template>
    <view :class="['layout', settingsStore.isDark ? 'theme-dark' : 'theme-light']">
        <!-- 仅上半部分：紫蓝渐变 Header 卡片区 -->
        <view class="hero-gradient-header">
            <!-- 顶栏导航行（仅独立放返回按钮，防止挤压） -->
            <view class="header-nav-bar" :style="navBarBoxStyle">
                <view class="back-circle-btn" @click="goBack">
                    <uni-icons type="back" size="18" color="#ffffff"></uni-icons>
                </view>
            </view>

            <!-- 核心标题（右侧紧跟 VIP CLUB 胶囊） -->
            <view class="header-title-box">
                <view class="title-with-badge">
                    <mdi-icon path="/static/icons/crown-circle.svg" size="32px" color="#fbbf24"></mdi-icon>
                    <text class="main-title">{{ t('membership.title') }}</text>
                    <!-- <view class="header-badge">
                        <text class="badge-text">VIP CLUB</text>
                    </view> -->
                </view>
                <text class="sub-title">{{ t('membership.subtitle') }}</text>
            </view>

            <!-- 勾选特权列表 (上一版图标样式) -->
            <view class="header-benefits-list">
                <view class="benefit-item" v-for="(benefit, index) in benefits" :key="index">
                    <view class="benefit-icon-box">
                        <uni-icons type="checkmarkempty" size="14" color="#ffffff"></uni-icons>
                    </view>
                    <text class="benefit-text">{{ benefit.title }}</text>
                </view>
            </view>
        </view>

        <!-- 主内容区域（页面普通背景） -->
        <view class="main-content-body">
            <!-- 套餐卡片堆叠列表 (骨架屏加载状态) -->
            <view v-if="isLoading" class="plans-container">
                <view v-for="i in 4" :key="i" class="plan-card-skeleton">
                    <view class="skeleton-info">
                        <view class="skeleton-title"></view>
                        <view class="skeleton-desc"></view>
                    </view>
                    <view class="skeleton-price-box">
                        <view class="skeleton-price"></view>
                        <view class="skeleton-avg"></view>
                    </view>
                </view>
            </view>

            <!-- 套餐卡片堆叠列表 -->
            <view v-else-if="membershipCards.length" class="plans-container">
                <view class="plan-card" v-for="(card, index) in membershipCards" :key="index"
                    :class="{ 'is-selected': selectedCard === index, 'is-recommended': card.recommended }"
                    @click="selectCard(index)">
                    <!-- 仅在推荐商品上显示“推荐”胶囊标签 -->
                    <view class="recommend-pill" v-if="card.recommended">
                        <text>{{ t('membership.recommended') }}</text>
                    </view>

                    <view class="plan-info">
                        <text class="plan-title">{{ card.title }}</text>
                        <text class="plan-desc" v-if="card.savings">{{ card.savings }}</text>
                    </view>
                    <view class="plan-price-info">
                        <view class="price-val-box">
                            <text class="original-price-strike"
                                v-if="card.originalPrice && Number(card.originalPrice) > Number(card.price)">
                                {{ card.currency === 'USD' ? '$' : '¥' }}{{ card.originalPrice }}
                            </text>
                            <text class="plan-price">{{ card.currency === 'USD' ? '$' : '¥' }}{{ card.price }}</text>
                        </view>
                        <text class="plan-avg">{{ card.avgText }}</text>
                    </view>
                </view>
            </view>

            <!-- 保留现有的支付方式选择区域 -->
            <view class="payment-methods-section">
                <view class="pm-title">{{ t('membership.payWith') }}</view>
                <view class="pm-row" v-for="method in paymentMethods" :key="method.id"
                    @click="selectedPayment = method.id">
                    <view class="pm-icon-wrapper">
                        <image class="pm-icon" :src="method.iconSrc" mode="aspectFit"></image>
                    </view>
                    <text class="pm-name">{{ method.name }}</text>
                    <view class="pm-radio-check" :class="{ 'is-active': selectedPayment === method.id }">
                        <uni-icons v-if="selectedPayment === method.id" type="checkmarkempty" size="14"
                            color="#ffffff"></uni-icons>
                    </view>
                </view>
            </view>

            <!-- 体验码兑换入口 -->
            <view class="redeem-entry-section" @click="openRedeem">
                <view class="redeem-entry-content">
                    <mdi-icon path="/static/icons/credit-card-chip.svg" size="15px"
                        :color="settingsStore.isDark ? '#9d9bf8' : '#7573f6'"></mdi-icon>
                    <text class="redeem-entry-text">{{ t('membership.haveRedeemCode') }}</text>
                </view>
            </view>
        </view>

        <!-- 底部固定悬浮按钮 (醒目会员及用户协议提示) -->
        <view class="sticky-footer">
            <button class="cta-btn" :disabled="selectedCard === null" @click="handlePurchase">
                <text>{{ t('membership.continue') }}</text>
            </button>
            <view class="footer-terms">
                <text class="terms-prefix">{{ t('membership.termsPrefix') }}</text>
                <text class="terms-link" @click.stop="openAgreement('vip')">{{ t('membership.vipAgreement') }}</text>
                <text class="terms-and">{{ t('membership.and') }}</text>
                <text class="terms-link" @click.stop="openAgreement('user')">{{ t('membership.userAgreement') }}</text>
            </view>
            <view class="safe-area-bottom"></view>
        </view>

        <!-- Custom Checkout Bottom Sheet (replaces uni.showModal confirmPaymentInfo) -->
        <uni-popup ref="checkoutPopup" type="bottom" :safe-area="false">
            <view class="checkout-sheet" :class="settingsStore.isDark ? 'theme-dark' : 'theme-light'">
                <view class="checkout-sheet__header">
                    <text class="checkout-sheet__title">{{ t('membership.checkoutTitle') }}</text>
                    <view class="checkout-sheet__close" @click="closeCheckout">
                        <uni-icons type="closeempty" size="20" :color="settingsStore.isDark ? '#a1a1aa' : '#71717a'">
                        </uni-icons>
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
                        <text class="cpc-price">
                            {{ activeCard?.currency === 'USD' ? '$' : '¥' }}{{ activeCard?.price }}</text>
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
                        <text class="cd-total-price">
                            {{ activeCard?.currency === 'USD' ? '$' : '¥' }}{{ activeCard?.price }}</text>
                    </view>
                </view>

                <view class="security-badge">
                    <uni-icons type="locked" size="14" color="#10b981"></uni-icons>
                    <text class="security-text">{{ t('membership.secureConnection') }}</text>
                </view>

                <button class="checkout-pay-btn" @click="confirmAndExecutePayment">
                    <text>{{ t('membership.confirmPay') }}</text>
                </button>
                <view class="sheet-terms">
                    <text class="terms-prefix">{{ t('membership.termsPrefix') }}</text>
                    <text class="terms-link" @click.stop="openAgreement('vip')">{{ t('membership.vipAgreement') }}</text>
                    <text class="terms-and">{{ t('membership.and') }}</text>
                    <text class="terms-link" @click.stop="openAgreement('user')">{{ t('membership.userAgreement') }}</text>
                </view>
                <view class="safe-area-bottom"></view>
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

        <!-- 体验码兑换弹窗 -->
        <popup-redeem-code ref="redeemPopup" @success="onRedeemSuccess"></popup-redeem-code>
    </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsStore } from "@/stores/settings.js";
import { useUserStore } from "@/stores/user.js";
import { apiGetPaymentProducts, apiAlipayOrder, apiHuaweiOrder, apiGetOrderStatus, apiMockPay } from "@/api/payment.js";
import { getStatusBarHeight } from "@/utils/layout.js";
import { useTranslateParams } from "@/utils/i18n.js";
import { CHANNEL } from "@/common/config.js";
import { IS_DEVELOPMENT } from "@/utils/system.js";

const { t, locale } = useI18n();
const { tp } = useTranslateParams();
const settingsStore = useSettingsStore();
const userStore = useUserStore();

const selectedCard = ref(0);
const rawProducts = ref([]);
const statusBarHeight = ref(getStatusBarHeight() || 0);

// 动态计算适配微信小程序原生胶囊及各端状态栏对齐
const navBarBoxStyle = computed(() => {
    // #ifdef MP-WEIXIN
    if (uni.getMenuButtonBoundingClientRect) {
        const rect = uni.getMenuButtonBoundingClientRect();
        if (rect && rect.top) {
            return {
                paddingTop: `${rect.top}px`,
                height: `${rect.height}px`
            };
        }
    }
    // #endif
    return {
        paddingTop: `${statusBarHeight.value + 8}px`,
        height: '32px'
    };
});

// Popups and mock states
const checkoutPopup = ref(null);
const sandboxPopup = ref(null);
const redeemPopup = ref(null);
const mockOrderNo = ref("");
const mockCard = ref(null);

const activeCard = computed(() => {
    if (selectedCard.value === null || !membershipCards.value.length) return null;
    return membershipCards.value[selectedCard.value];
});

const activePaymentMethod = computed(() => {
    return paymentMethods.value.find((m) => m.id === selectedPayment.value) || null;
});

const openAgreement = (type) => {
    let url = 'user_agreement';
    if (type === 'vip') url = 'vip_agreement';
    else if (type === 'privacy') url = 'privacy_agreement';
    uni.navigateTo({
        url: `/pages/webview/webview?url=${url}`,
    });
};

const closeCheckout = () => {
    checkoutPopup.value?.close();
};

const openCheckout = () => {
    checkoutPopup.value?.open();
};

const cancelSandbox = () => {
    sandboxPopup.value?.close();
};

const openRedeem = () => {
    redeemPopup.value?.open();
};

const onRedeemSuccess = () => {
    userStore.getUserProfile();
    setTimeout(() => {
        uni.navigateBack();
    }, 1800);
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
    return rawProducts.value
        .filter((p) => {
            // 非开发者隐藏测试 / test 商品
            if (!userStore.isDeveloper) {
                if (p.name === '测试' || p.name_en === 'test') return false;
            }
            return true;
        })
        .map((p) => {
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
const isHarmonyOS = computed(() => (uni.getDeviceInfo().platform || "").toLowerCase() === "harmonyos");
const selectedPayment = ref(isHarmonyOS.value ? "huawei" : "alipay");

const paymentMethods = computed(() => {
    const list = [];
    if (isHarmonyOS.value) {
        list.push({ id: "huawei", name: t("membership.huawei") || "Huawei Pay", iconSrc: "/static/icons/brands/huawei.svg" });
    }
    if (!isHarmonyOS.value) {
        list.push({ id: "alipay", name: t("membership.alipay") || "Alipay", iconSrc: "/static/icons/brands/alipay.svg" });
    }
    return list.length ? list : [{ id: "huawei", name: t("membership.huawei") || "Huawei Pay", iconSrc: "/static/icons/brands/huawei.svg" }];
});

// 4. 加载商品
const isLoading = ref(true);
const fetchProducts = async () => {
    try {
        isLoading.value = true;
        const res = await apiGetPaymentProducts();
        if (res.code === 200 && res.data) {
            rawProducts.value = res.data;
            const recIndex = membershipCards.value.findIndex((p) => p.recommended);
            selectedCard.value = recIndex !== -1 ? recIndex : (membershipCards.value.length ? 0 : null);
        }
    } catch (err) {
        console.error("Failed to load products:", err);
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    fetchProducts();
});

// 5. 支付结果轮询
let pollTimer = null;

const onPaymentSuccess = () => {
    uni.hideLoading();
    uni.showToast({ title: t("membership.welcomeVip"), icon: "none" });
    userStore.getUserProfile();
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
    if (!userStore.isLoggedIn) {
        uni.navigateTo({ url: '/pages/auth/signin' });
        return;
    }
    if (selectedCard.value === null || !membershipCards.value.length) return;
    openCheckout();
};

const isSubmitting = ref(false);

const confirmAndExecutePayment = async () => {
    if (isSubmitting.value) return;
    const card = activeCard.value;
    if (!card) return;
    closeCheckout();

    isSubmitting.value = true;
    uni.showLoading({ title: t("membership.creatingOrder") });

    try {
        if (selectedPayment.value === "alipay") {
            await handleAlipay(card, uni.getDeviceInfo().platform);
        } else if (selectedPayment.value === "huawei") {
            await handleHuaweiPay(card, uni.getDeviceInfo().platform);
        } else {
            uni.hideLoading();
            uni.showToast({ title: t("membership.comingSoon"), icon: "none" });
        }
    } catch (err) {
        uni.hideLoading();
        console.error("Purchase error:", err);
        uni.showToast({ title: err.message || t("common.networkError"), icon: "none" });
    } finally {
        isSubmitting.value = false;
    }
};

// 7. 支付宝支付
const handleAlipay = async (card, platform) => {
    const createRes = await apiAlipayOrder({ product_id: card.id, channel: CHANNEL, platform });

    if (!(createRes.code === 200 && createRes.data)) {
        throw new Error(createRes.message || t("membership.orderFailed"));
    }

    const { order_no, order_string } = createRes.data;

    // ── App 真实支付 ──────────────────
    // #ifdef APP-PLUS
    uni.hideLoading();

    // 测试：获取可使用的服务提供商
    // uni.getProvider({
    //     service: 'payment',
    //     success: (res) => {
    //         console.log(res.provider); // 应包含 'alipay'
    //     }
    // });

    uni.requestPayment({
        provider: "alipay",
        orderInfo: order_string,
        success: () => {
            uni.showLoading({ title: t("membership.verifying") });
            pollOrderStatus(order_no);
        },
        fail: (err) => {
            // console.log("error:", err)
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

// 8. 华为应用内支付 (HMS IAP)
const handleHuaweiPay = async (card, platform) => {
    const createRes = await apiHuaweiOrder({ product_id: card.id, channel: CHANNEL, platform });
    console.log("createRes", createRes)
    if (!(createRes.code === 200 && createRes.data)) {
        throw new Error(createRes.message || t("membership.orderFailed"));
    }

    const { order_no, order_string, purchase_params } = createRes.data;

    // ── App 真实支付 ──────────────────
    // 鸿蒙支付必须在真机上测试，模拟器不支持。
    // #ifdef APP-HARMONY
    uni.hideLoading();

    uni.getProvider({
        service: 'payment',
        success: (res) => {
            console.log('当前支持的支付 provider:', res.providers);
            // 鸿蒙环境应返回 [ {id: "huawei", description: "华为"} ] 的数组
            // 检查是否支持华为支付
            const isHuaweiSupported = res.providers.some(p => p.id === 'huawei');
            if (isHuaweiSupported) {
                console.log("开始调用华为支付");
            }
        }
    });

    uni.requestPayment({
        provider: "huawei",
        orderInfo: order_string || purchase_params,
        success: (res) => {
            // console.log("华为支付成功", res);
            uni.showLoading({ title: t("membership.verifying") });
            pollOrderStatus(order_no);
        },
        fail: (err) => {
            // console.error("华为支付失败:", err);
            // if (err.errMsg?.includes("cancel")) {
            //     uni.showToast({ title: t("membership.cancelPay"), icon: "none" });
            // } else {
            //     uni.showToast({ title: t("membership.payFailed"), icon: "none" });
            // }
            uni.showToast({ title: err, icon: "none" });
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

/* ================= 基础布局 (轻柔莫兰迪薰衣草紫，清透空气感) ================= */
.layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding-bottom: 200rpx;
    transition: all 0.3s ease;

    &.theme-light {
        background: linear-gradient(180deg, #7573f6 0%, #908df9 20%, #b8b6fc 38%, #deddfe 56%, #f3f3fe 75%, #ffffff 100%);
        color: #0f172a;
    }

    &.theme-dark {
        background: linear-gradient(180deg, #5b53d6 0%, #463ebb 22%, #2a2578 45%, #161833 72%, #0f172a 100%);
        color: #f8fafc;
    }
}

/* ================= 顶级 Header 区域 (透明无缝融入) ================= */
.hero-gradient-header {
    background: transparent;
    padding: 0 40rpx 32rpx 40rpx;
    color: #ffffff;
}

.header-nav-bar {
    display: flex;
    align-items: center;
    box-sizing: content-box;

    .back-circle-btn {
        width: 64rpx;
        height: 64rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.18);
        backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &:active {
            opacity: 0.7;
        }
    }
}

.header-title-box {
    margin: 28rpx 0 24rpx;

    .title-with-badge {
        display: flex;
        align-items: center;
        gap: 14rpx;
        margin-bottom: 10rpx;

        .main-title {
            font-size: 40rpx;
            font-weight: 700;
            line-height: 1.2;
            letter-spacing: -0.3rpx;
        }

        .header-badge {
            display: inline-flex;
            align-items: center;
            gap: 6rpx;
            padding: 6rpx 18rpx;
            border-radius: 100rpx;
            background: rgba(255, 255, 255, 0.18);
            backdrop-filter: blur(12px);

            .badge-text {
                font-size: 32rpx;
                font-weight: 800;
                color: #fbbf24;
                letter-spacing: 1rpx;
            }
        }
    }

    .sub-title {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.85);
        font-weight: 500;
        display: block;
    }
}

.header-benefits-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;

    .benefit-item {
        display: flex;
        align-items: center;
        gap: 16rpx;

        .benefit-icon-box {
            width: 38rpx;
            height: 38rpx;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.22);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .benefit-text {
            font-size: 26rpx;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.95);
        }
    }
}

/* ================= 主内容体（常规页面背景） ================= */
.main-content-body {
    padding: 40rpx 40rpx 0 40rpx;
}

/* 套餐卡片堆叠列表 */
.plans-container {
    display: flex;
    flex-direction: column;
    gap: 28rpx;
    margin-bottom: 48rpx;
}

/* 骨架屏卡片样式 */
.plan-card-skeleton {
    position: relative;
    padding: 36rpx 40rpx;
    min-height: 140rpx;
    box-sizing: border-box;
    border-radius: 32rpx;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px);
    border: 4rpx solid rgba(255, 255, 255, 0.6);
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.03);

    .theme-dark & {
        background: rgba(30, 30, 36, 0.6);
        border-color: rgba(255, 255, 255, 0.06);
    }

    .skeleton-info {
        display: flex;
        flex-direction: column;
        gap: 16rpx;
        width: 45%;

        .skeleton-title {
            width: 100%;
            height: 36rpx;
            border-radius: 8rpx;
            background: linear-gradient(90deg,
                    rgba(200, 200, 200, 0.15) 25%,
                    rgba(200, 200, 200, 0.35) 50%,
                    rgba(200, 200, 200, 0.15) 75%);
            background-size: 200% 100%;
            animation: skeleton-shimmer 1.6s infinite linear;
        }

        .skeleton-desc {
            width: 70%;
            height: 24rpx;
            border-radius: 6rpx;
            background: linear-gradient(90deg,
                    rgba(200, 200, 200, 0.15) 25%,
                    rgba(200, 200, 200, 0.35) 50%,
                    rgba(200, 200, 200, 0.15) 75%);
            background-size: 200% 100%;
            animation: skeleton-shimmer 1.6s infinite linear;
        }
    }

    .skeleton-price-box {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 12rpx;
        width: 35%;

        .skeleton-price {
            width: 80%;
            height: 40rpx;
            border-radius: 8rpx;
            background: linear-gradient(90deg,
                    rgba(200, 200, 200, 0.15) 25%,
                    rgba(200, 200, 200, 0.35) 50%,
                    rgba(200, 200, 200, 0.15) 75%);
            background-size: 200% 100%;
            animation: skeleton-shimmer 1.6s infinite linear;
        }

        .skeleton-avg {
            width: 60%;
            height: 22rpx;
            border-radius: 6rpx;
            background: linear-gradient(90deg,
                    rgba(200, 200, 200, 0.15) 25%,
                    rgba(200, 200, 200, 0.35) 50%,
                    rgba(200, 200, 200, 0.15) 75%);
            background-size: 200% 100%;
            animation: skeleton-shimmer 1.6s infinite linear;
        }
    }
}

@keyframes skeleton-shimmer {
    0% {
        background-position: 200% 0;
    }

    100% {
        background-position: -200% 0;
    }
}

.plan-card {
    position: relative;
    padding: 36rpx 40rpx;
    border-radius: 32rpx;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(12px);
    border: 4rpx solid rgba(255, 255, 255, 0.8);
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.05);

    .theme-dark & {
        background: rgba(30, 30, 36, 0.85);
        border-color: rgba(255, 255, 255, 0.08);
    }

    &.is-selected {
        border-color: #6366f1;
        background: #ffffff;
        box-shadow: 0 14rpx 36rpx rgba(99, 102, 241, 0.25);
        transform: scale(1.01);

        .theme-dark & {
            background: #1e1b4b;
            border-color: #818cf8;
        }
    }

    .plan-info {
        display: flex;
        flex-direction: column;
        gap: 6rpx;

        .plan-title {
            font-size: 30rpx;
            font-weight: 700;
            color: var(--text-color);
        }

        .plan-desc {
            font-size: 22rpx;
            color: #64748b;
            font-weight: 500;

            .theme-dark & {
                color: #94a3b8;
            }
        }
    }

    .plan-price-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2rpx;

        .price-val-box {
            display: flex;
            align-items: baseline;
            gap: 10rpx;

            .original-price-strike {
                font-size: 22rpx;
                color: #94a3b8;
                text-decoration: line-through;
                font-weight: 500;
            }

            .plan-price {
                font-size: 34rpx;
                font-weight: 800;
                color: var(--text-color);
            }
        }

        .plan-avg {
            font-size: 22rpx;
            color: var(--text-sub);
            font-weight: 500;
        }
    }

    .recommend-pill {
        position: absolute;
        top: -18rpx;
        left: 32rpx;
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        color: #78350f;
        font-size: 20rpx;
        font-weight: 800;
        padding: 4rpx 20rpx;
        border-radius: 100rpx;
        box-shadow: 0 4rpx 10rpx rgba(245, 158, 11, 0.3);
    }
}

/* 支付方式选择列 */
.payment-methods-section {
    margin-bottom: 40rpx;

    .pm-title {
        font-size: 22rpx;
        font-weight: 700;
        color: var(--text-sub);
        text-transform: uppercase;
        letter-spacing: 1.5rpx;
        margin-bottom: 20rpx;
    }

    .pm-row {
        display: flex;
        align-items: center;
        padding: 22rpx 0;
        border-bottom: 1rpx solid var(--card-border);

        &:last-child {
            border-bottom: none;
        }

        .pm-icon-wrapper {
            width: 56rpx;
            height: 56rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 20rpx;

            .pm-icon {
                width: 40rpx;
                height: 40rpx;
            }
        }

        .pm-name {
            flex: 1;
            font-size: 28rpx;
            font-weight: 600;
            color: var(--text-color);
        }

        .pm-radio-check {
            width: 40rpx;
            height: 40rpx;
            border-radius: 50%;
            border: 3rpx solid var(--card-border);
            display: flex;
            align-items: center;
            justify-content: center;

            &.is-active {
                background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                border-color: #6366f1;
            }
        }
    }
}

/* 体验码兑换入口 */
.redeem-entry-section {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10rpx 0 40rpx 0;

    .redeem-entry-content {
        display: inline-flex;
        align-items: center;
        gap: 10rpx;
        padding: 12rpx 28rpx;
        border-radius: 40rpx;
        background: rgba(117, 115, 246, 0.08);
        border: 1rpx solid rgba(117, 115, 246, 0.18);
        transition: all 0.2s ease;

        .theme-dark & {
            background: rgba(117, 115, 246, 0.15);
            border-color: rgba(117, 115, 246, 0.3);
        }

        &:active {
            opacity: 0.8;
            transform: scale(0.98);
        }

        .redeem-entry-text {
            font-size: 24rpx;
            font-weight: 500;
            color: #7573f6;
            letter-spacing: 0.5rpx;

            .theme-dark & {
                color: #9d9bf8;
            }
        }
    }
}

/* 底部固定悬浮按钮 (已彻底删除随时取消文案) */
.sticky-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background: var(--bg-main);
    border-top: 1rpx solid var(--card-border);
    padding: 24rpx 40rpx 32rpx;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;
    z-index: 90;

    .cta-btn {
        width: 100%;
        height: 96rpx;
        border-radius: 100rpx;
        background: linear-gradient(135deg, #7573f6 0%, #635df0 100%);
        color: #ffffff;
        font-size: 28rpx;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        margin: 0;
        box-shadow: 0 10rpx 28rpx rgba(117, 115, 246, 0.35);

        &:active {
            opacity: 0.9;
            transform: scale(0.98);
        }

        &[disabled] {
            opacity: 0.5;
        }
    }
}

/* 协议通用样式（主页面底部与收银台弹窗共用） */
.footer-terms,
.sheet-terms {
    font-size: 22rpx;
    color: var(--text-sub);
    font-weight: 500;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 14rpx;
    line-height: 1.4;

    .terms-prefix,
    .terms-and {
        color: var(--text-sub);
    }

    .terms-link {
        color: #7573f6;
        font-weight: 600;
        padding: 4rpx 4rpx;

        &:active {
            opacity: 0.7;
        }
    }
}

/* ================= 自定义收银台底部弹窗 (全封闭覆盖底部安全区) ================= */
.checkout-sheet {
    background: var(--card-bg);
    border-top-left-radius: 48rpx;
    border-top-right-radius: 48rpx;
    padding: 44rpx 40rpx calc(40rpx + env(safe-area-inset-bottom));
    padding-bottom: calc(40rpx + constant(safe-area-inset-bottom));
    border-top: 1rpx solid var(--card-border);
    box-shadow: 0 -12rpx 48rpx rgba(0, 0, 0, 0.12);
    position: relative;
    z-index: 100;

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 36rpx;
    }

    &__title {
        font-size: 32rpx;
        font-weight: 700;
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
    padding: 28rpx;
    border-radius: 24rpx;
    border: 1rpx solid var(--card-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28rpx;

    .cpc-left {
        display: flex;
        align-items: center;
        gap: 18rpx;
    }

    .cpc-crown-box {
        width: 64rpx;
        height: 64rpx;
        border-radius: 18rpx;
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
        font-size: 28rpx;
        font-weight: 700;
        color: var(--text-color);
    }

    .cpc-desc {
        font-size: 22rpx;
        color: #10b981;
        font-weight: 600;
    }

    .cpc-price {
        font-size: 32rpx;
        font-weight: 800;
        color: var(--text-color);
    }
}

.checkout-details-box {
    background: var(--bg-main);
    border-radius: 24rpx;
    border: 1rpx solid var(--card-border);
    padding: 28rpx;
    margin-bottom: 32rpx;

    .checkout-detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .cd-label {
            font-size: 24rpx;
            color: var(--text-sub);
            font-weight: 500;
        }

        .cd-value-box {
            display: flex;
            align-items: center;
            gap: 10rpx;
        }

        .cd-icon {
            width: 32rpx;
            height: 32rpx;
        }

        .cd-value {
            font-size: 24rpx;
            color: var(--text-color);
            font-weight: 600;
        }

        &.is-total {
            .cd-label {
                font-size: 26rpx;
                color: var(--text-color);
                font-weight: 700;
            }

            .cd-total-price {
                font-size: 32rpx;
                color: var(--radio-active);
                font-weight: 800;
            }
        }
    }

    .checkout-detail-divider {
        height: 1rpx;
        background: var(--card-border);
        margin: 20rpx 0;
    }
}

.security-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    margin-bottom: 28rpx;

    .security-text {
        font-size: 22rpx;
        color: var(--text-sub);
        font-weight: 500;
    }
}

.checkout-pay-btn {
    width: 100%;
    height: 96rpx;
    border-radius: 999rpx;
    background: var(--btn-bg);
    color: var(--btn-text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    font-weight: 700;
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
