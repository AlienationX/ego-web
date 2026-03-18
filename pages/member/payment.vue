<template>
    <view class="layout">
        <menu-bar>
            <template #title>{{ t('membership.title') }}</template>
        </menu-bar>

        <view class="container">
            <!-- 会员特权说明 -->
            <view class="benefits-section">
                <view class="benefits-title">{{ t('membership.benefits') }}</view>
                <view class="benefits-list">
                    <view class="benefit-item" v-for="(benefit, index) in benefits" :key="index">
                        <uni-icons :type="benefit.icon" size="24" color="#28B389"></uni-icons>
                        <text class="benefit-text">{{ benefit.text }}</text>
                    </view>
                </view>
            </view>

            <!-- 会员卡列表 -->
            <view class="membership-cards">
                <view 
                    class="membership-card" 
                    v-for="(card, index) in membershipCards" 
                    :key="index"
                    :class="{ 'recommended': card.recommended, 'selected': selectedCard === index }"
                    @click="selectCard(index)"
                >
                    <!-- 推荐标签 -->
                    <view class="recommend-badge" v-if="card.recommended">
                        {{ t('membership.recommended') }}
                    </view>

                    <!-- 卡片内容 -->
                    <view class="card-content">
                        <view class="card-title">{{ card.title }}</view>
                        <view class="card-price-wrapper">
                            <view class="card-price">
                                <text class="price-symbol">¥</text>
                                <text class="price-amount">{{ card.price }}</text>
                            </view>
                            <view class="card-original-price" v-if="card.originalPrice">
                                <text class="original-price-symbol">¥</text>
                                <text class="original-price-amount">{{ card.originalPrice }}</text>
                            </view>
                        </view>
                        <view class="card-period">{{ card.period }}</view>
                        <view class="card-savings" v-if="card.savings">
                            {{ card.savings }}
                        </view>
                    </view>

                    <!-- 选中标记 -->
                    <view class="selected-icon" v-if="selectedCard === index">
                        <uni-icons type="checkmarkempty" size="32" color="#fff"></uni-icons>
                    </view>
                </view>
            </view>

            <!-- 购买按钮 -->
            <view class="purchase-section">
                <button 
                    class="purchase-btn" 
                    :disabled="selectedCard === null"
                    @click="handlePurchase"
                >
                    {{ t('membership.purchase') }}
                </button>
                <view class="purchase-tip">{{ t('membership.purchaseTip') }}</view>
            </view>
        </view>
    </view>
</template>

<script setup>
    import { ref, computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    const { t } = useI18n();
    
    const selectedCard = ref(null);

    // 会员特权
    const benefits = computed(() => [
        {
            icon: 'vip-filled',
            text: t('membership.benefit1')
        },
        {
            icon: 'download-filled',
            text: t('membership.benefit2')
        },
        {
            icon: 'image-filled',
            text: t('membership.benefit3')
        },
        {
            icon: 'heart-filled',
            text: t('membership.benefit4')
        }
    ]);

    // 会员卡数据
    const membershipCards = computed(() => [
        {
            title: t('membership.monthly'),
            price: '12',
            originalPrice: '18',
            period: t('membership.monthlyPeriod'),
            savings: '节省¥6',
            recommended: false
        },
        {
            title: t('membership.quarterly'),
            price: '30',
            originalPrice: '45',
            period: t('membership.quarterlyPeriod'),
            savings: '节省¥15',
            recommended: true
        },
        {
            title: t('membership.yearly'),
            price: '88',
            originalPrice: '158',
            period: t('membership.yearlyPeriod'),
            savings: '节省¥70',
            recommended: false
        }
    ]);

    // 选择会员卡
    const selectCard = (index) => {
        selectedCard.value = index;
    };

    // 购买处理
    const handlePurchase = () => {
        if (selectedCard.value === null) {
            uni.showToast({
                title: t('membership.selectCardFirst'),
                icon: 'none'
            });
            return;
        }

        const card = membershipCards.value[selectedCard.value];
        
        uni.showModal({
            title: t('membership.confirmPurchase'),
            content: t('membership.confirmContent').replace('{title}', card.title).replace('{price}', card.price),
            success: (res) => {
                if (res.confirm) {
                    // 这里调用支付接口
                    uni.showLoading({
                        title: t('membership.processing')
                    });
                    
                    // 模拟支付流程
                    setTimeout(() => {
                        uni.hideLoading();
                        uni.showToast({
                            title: t('membership.purchaseSuccess'),
                            icon: 'success'
                        });
                        
                        // 支付成功后返回上一页
                        setTimeout(() => {
                            uni.navigateBack();
                        }, 1500);
                    }, 2000);
                }
            }
        });
    };
</script>

<style lang="scss" scoped>
    .layout {
        min-height: 100vh;
        background: #f5f5f5;
    }

    .container {
        padding: 30rpx;
    }

    .benefits-section {
        background: #fff;
        border-radius: 20rpx;
        padding: 40rpx 30rpx;
        margin-bottom: 40rpx;
    }

    .benefits-title {
        font-size: 36rpx;
        font-weight: 600;
        color: #333;
        margin-bottom: 32rpx;
        text-align: center;
    }

    .benefits-list {
        display: flex;
        flex-direction: column;
        gap: 24rpx;
    }

    .benefit-item {
        display: flex;
        align-items: center;
        gap: 20rpx;
    }

    .benefit-text {
        font-size: 28rpx;
        color: #666;
        flex: 1;
    }

    .membership-cards {
        display: flex;
        flex-direction: column;
        gap: 24rpx;
        margin-bottom: 40rpx;
    }

    .membership-card {
        position: relative;
        background: #fff;
        border-radius: 20rpx;
        padding: 40rpx 30rpx;
        border: 3rpx solid transparent;
        transition: all 0.3s;

        &.selected {
            border-color: $wp-theme-color;
            box-shadow: 0 8rpx 24rpx rgba($wp-theme-color, 0.2);
        }

        &.recommended {
            background: linear-gradient(135deg, rgba($wp-theme-color, 0.05) 0%, rgba($wp-theme-color, 0.02) 100%);
        }

        &:active {
            transform: scale(0.98);
        }
    }

    .recommend-badge {
        position: absolute;
        bottom: 20rpx;
        right: 20rpx;
        background: $wp-theme-color;
        color: #fff;
        font-size: 22rpx;
        padding: 8rpx 16rpx;
        border-radius: 20rpx;
        font-weight: 600;
        z-index: 1;
    }

    .card-content {
        position: relative;
        z-index: 1;
    }

    .card-title {
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
        margin-bottom: 20rpx;
    }

    .card-price-wrapper {
        display: flex;
        align-items: baseline;
        gap: 16rpx;
        margin-bottom: 12rpx;
    }

    .card-price {
        display: flex;
        align-items: baseline;
    }

    .price-symbol {
        font-size: 28rpx;
        color: $wp-theme-color;
        font-weight: 600;
    }

    .price-amount {
        font-size: 56rpx;
        color: $wp-theme-color;
        font-weight: 700;
        line-height: 1;
    }

    .card-original-price {
        display: flex;
        align-items: baseline;
    }

    .original-price-symbol {
        font-size: 24rpx;
        color: #999;
        font-weight: 400;
    }

    .original-price-amount {
        font-size: 32rpx;
        color: #999;
        font-weight: 400;
        text-decoration: line-through;
    }

    .card-period {
        font-size: 26rpx;
        color: #999;
        margin-bottom: 8rpx;
    }

    .card-savings {
        font-size: 24rpx;
        color: #ff6b6b;
        font-weight: 500;
    }

    .selected-icon {
        position: absolute;
        top: 20rpx;
        right: 20rpx;
        width: 56rpx;
        height: 56rpx;
        background: $wp-theme-color;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
    }

    .purchase-section {
        margin-top: 40rpx;
    }

    .purchase-btn {
        width: 100%;
        height: 96rpx;
        background: $wp-theme-color;
        color: #fff;
        font-size: 36rpx;
        font-weight: 600;
        border-radius: 48rpx;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;

        &:active {
            background: darken($wp-theme-color, 5%);
            transform: scale(0.98);
        }

        &[disabled] {
            background: #ccc;
            color: #999;
        }

        &::after {
            border: none;
        }
    }

    .purchase-tip {
        margin-top: 24rpx;
        text-align: center;
        font-size: 24rpx;
        color: #999;
        line-height: 1.6;
    }
</style>
