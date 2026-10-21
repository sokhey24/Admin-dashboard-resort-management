import React, { useCallback } from 'react';
import { useDiningCheckout } from '../../hooks/useDiningCheckout.js';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { ROUTES } from '../../config/routes.js';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { FoodDetail } from './FoodDetail.jsx';
import { FoodRelated } from './FoodRelated.jsx';
import { CardlistSummaryOrder } from './CardlistSummaryOrder.jsx';
import { useDiningCart } from './useDiningCart.js';
import { useDiningMenu, useMenuItem } from '../../hooks/useDiningMenu.js';

/** Dish view page: FoodDetail + FoodRelated at `/dining/menu/:dishId` */
export const MenuDetailPage = () => {
  const { dishId } = useParams();
  const navigate = useNavigate();
  const { t, currency, addToast, user, bookings } = useApp();

  const {
    items: cartItems,
    addToCart,
    increment,
    decrement,
    removeItem,
    clearCart,
    total: cartTotal,
    totalCount,
  } = useDiningCart();

  const { dish, loading, error, notFound, reload } = useMenuItem(dishId);
  const { menuItems } = useDiningMenu();

  const handleAddToCart = useCallback(
    (target) => {
      const payload = target && typeof target === 'object'
        ? target
        : menuItems.find((item) => String(item.id) === String(target)) || dish;
      if (!payload?.id || payload.isAvailable === false) return;
      const added = addToCart(payload);
      if (added) {
        addToast?.(t('dining.addedToCart', 'Added to your order'), 'success');
      }
    },
    [addToCart, addToast, t, dish, menuItems]
  );

  const { checkoutLoading, handleCheckoutConfirm, activeBooking } = useDiningCheckout({
    cartItems,
    clearCart,
    addToast,
    t,
    user,
    bookings,
  });

  if (loading) {
    return (
      <div className="w-full bg-bg pb-24 pt-28 max-w-3xl mx-auto px-4">
        <p className="text-sm text-muted text-center py-16">{t('dining.menuLoading', 'Loading menu…')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-bg pb-24 pt-28 max-w-3xl mx-auto px-4">
        <ErrorState
          title={t('dining.menuLoadError', 'Unable to load menu')}
          message={error}
          onRetry={reload}
          retryText={t('common.tryAgain', 'Try again')}
        />
      </div>
    );
  }

  if (notFound || !dish) {
    return (
      <div className="w-full bg-bg pb-24 pt-28 max-w-3xl mx-auto px-4">
        <EmptyState
          title={t('dining.dishNotFoundTitle', 'Dish not found')}
          description={t('dining.dishNotFoundDesc', 'This menu item may have been removed or the link is incorrect.')}
        />
        <div className="text-center mt-8">
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.menuList)}>
            {t('dining.backToMenu', 'Back to menu')}
          </Button>
        </div>
      </div>
    );
  }

  if (!dish.isAvailable) {
    return (
      <div className="w-full bg-bg pb-24 pt-28 max-w-3xl mx-auto px-4">
        <EmptyState
          title={t('dining.dishUnavailableTitle', 'Dish unavailable')}
          description={t(
            'dining.dishUnavailableDesc',
            'This dish is currently unavailable. Please choose another item from the menu.'
          )}
        />
        <div className="text-center mt-8">
          <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.menuList)}>
            {t('dining.backToMenu', 'Back to menu')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-bg pb-24 relative">
      <CardlistSummaryOrder
        items={cartItems}
        currency={currency}
        t={t}
        onIncrement={increment}
        onDecrement={decrement}
        onRemove={removeItem}
        onCheckoutConfirm={handleCheckoutConfirm}
        onCartClear={clearCart}
        checkoutLoading={checkoutLoading}
        canChargeToRoom={Boolean(activeBooking)}
        total={cartTotal}
        totalCount={totalCount}
      />

      <div className="pt-24 sm:pt-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(ROUTES.dining)}
          className="inline-flex items-center gap-2 text-xs font-medium text-muted hover:text-primary transition-colors cursor-pointer mb-8"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          {t('dining.backToDining', 'Back to Dining')}
        </button>

        <FoodDetail
          dish={dish}
          t={t}
          currency={currency}
          headingAs="h1"
          onAddToCart={() => handleAddToCart(dish)}
          onViewMenu={() => navigate(ROUTES.menuList)}
        />

        <FoodRelated
          currentDish={dish}
          dishes={menuItems}
          currency={currency}
          t={t}
          onSelectDish={(id) => navigate(ROUTES.menuDetail(id))}
          onAddToCart={handleAddToCart}
        />
      </div>
    </div>
  );
};
