import { apiRequest } from './apiClient';

// ---- Catalog (read-only) ----
export const getPackages = () => apiRequest('/billing/packages');
export const getPlans = () => apiRequest('/billing/plans');

// ---- Self-service ----
export const getMyBilling = () => apiRequest('/billing/me');

export const startPackageCheckout = (payload) =>
  apiRequest('/billing/checkout/package', { method: 'POST', body: payload });

export const startPlanCheckout = (payload) =>
  apiRequest('/billing/checkout/plan', { method: 'POST', body: payload });

export const openBillingPortal = (returnUrl) => {
  const qs = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
  return apiRequest(`/billing/portal${qs}`, { method: 'POST' });
};

export const cancelMySubscription = () =>
  apiRequest('/billing/subscription/cancel', { method: 'POST' });

// ---- Admin ----
export const getBillingAnalytics = ({ from, to } = {}) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return apiRequest(`/billing/admin/analytics${qs ? `?${qs}` : ''}`);
};

export const createPackage = (payload) =>
  apiRequest('/billing/admin/packages', { method: 'POST', body: payload });

export const updatePackage = (id, payload) =>
  apiRequest(`/billing/admin/packages/${id}`, { method: 'PATCH', body: payload });

export const deletePackage = (id) =>
  apiRequest(`/billing/admin/packages/${id}`, { method: 'DELETE' });

export const createPlan = (payload) =>
  apiRequest('/billing/admin/plans', { method: 'POST', body: payload });

export const updatePlan = (id, payload) =>
  apiRequest(`/billing/admin/plans/${id}`, { method: 'PATCH', body: payload });

export const deletePlan = (id) =>
  apiRequest(`/billing/admin/plans/${id}`, { method: 'DELETE' });

// ---- Helpers ----
export const formatMoney = (cents, currency = 'USD') => {
  if (cents === null || cents === undefined || Number.isNaN(Number(cents))) return '—';
  const value = Number(cents) / 100;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
};

export const formatMoneyDecimal = (decimalString, currency = 'USD') => {
  if (decimalString === null || decimalString === undefined) return '—';
  const value = Number(decimalString);
  if (Number.isNaN(value)) return '—';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
};
