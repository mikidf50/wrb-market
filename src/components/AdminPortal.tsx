import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  Trash2,
  AlertCircle,
  FileCheck,
  Eye,
  Plus,
  Minus,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Database,
  ExternalLink,
  X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { OrderStatus } from '../types';
import { ethiopianLocations } from '../data/locations';

interface AdminPortalProps {
  onReturnToMarketplace: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onReturnToMarketplace }) => {
  const { t, localize } = useLanguage();
  const { user, isAdmin, isLoading, signIn, signOut, refreshUserProfile } = useAuth();
  const {
    products,
    deleteProduct,
    updateProductQuantity,
    orders,
    updateOrderStatus,
    verifyPaymentReceipt,
  } = useMarketplace();

  // Admin Portal State
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'database'>('overview');
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  // Login form state for /admin
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redirect countdown for unauthorized ordinary users
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  // If ordinary user visits /admin, initiate access denial and redirect countdown
  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      setRedirectCountdown(3);
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            onReturnToMarketplace();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLoading, user, isAdmin, onReturnToMarketplace]);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    const res = await signIn(loginEmail.trim(), loginPassword);
    setIsSubmitting(false);

    if (!res.success) {
      setLoginError(res.error || 'Failed to authenticate. Please verify credentials.');
      return;
    }

    // Refresh profile from Supabase to ensure fresh database role
    const fresh = await refreshUserProfile();
    if (!fresh || fresh.role !== 'admin') {
      setLoginError(
        `Access Denied: The account "${loginEmail}" was authenticated, but does not possess the 'admin' role in the database. Only authorized administrator accounts are permitted.`
      );
    }
  };

  const handleRefreshRole = async () => {
    setIsRefreshing(true);
    await refreshUserProfile();
    setIsRefreshing(false);
  };

  // Case 1: Checking authentication status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">
            Verifying administrator authorization...
          </p>
        </div>
      </div>
    );
  }

  // Case 2: Not logged in — Show Restricted Administrator Sign In Portal
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto font-black shadow-lg shadow-amber-400/20">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Mela Market Administration
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Restricted Portal (<code className="text-amber-400 font-mono">/admin</code>). Only authorized administrators may log in.
            </p>
          </div>

          {/* Error Message */}
          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Authorization Failed</p>
                <p className="text-[11px] leading-relaxed text-rose-300">{loginError}</p>
              </div>
            </div>
          )}

          {/* Secure Login Form */}
          <form onSubmit={handleAdminSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Administrator Email *
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:border-amber-400 focus:outline-hidden transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Password *
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:border-amber-400 focus:outline-hidden transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-98 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In as Administrator'}</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </form>

          {/* Return to public site */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <button
              type="button"
              onClick={onReturnToMarketplace}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Marketplace</span>
            </button>
            <span className="text-[11px] text-slate-500 font-mono">RBAC Enforced</span>
          </div>

        </div>
      </div>
    );
  }

  // Case 3: Logged in, but NOT an administrator — Deny Access and Redirect
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100">
        <div className="w-full max-w-md bg-slate-900 border border-rose-900/60 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto animate-pulse">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-rose-300">
              403 Forbidden — Access Denied
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              The account <strong className="text-white">{user.email}</strong> is authenticated as role <span className="font-mono text-amber-400 font-bold">"{user.role}"</span>, which does not have administrator privileges.
            </p>
            <p className="text-xs text-slate-400">
              Ordinary accounts are strictly prohibited from accessing <code className="text-amber-400">/admin</code>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            <span>Redirecting to public marketplace in {redirectCountdown ?? 3} seconds...</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onReturnToMarketplace}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Return to Website Now
            </button>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                onReturnToMarketplace();
              }}
              className="py-2.5 px-4 rounded-xl bg-rose-900/60 hover:bg-rose-900 text-rose-200 font-bold text-xs cursor-pointer transition-colors"
            >
              Sign Out
            </button>
          </div>

          {/* Re-check if recently granted role */}
          <div className="pt-2 text-[11px] text-slate-500">
            <span>Were you just granted the admin role in Supabase? </span>
            <button
              type="button"
              onClick={handleRefreshRole}
              disabled={isRefreshing}
              className="text-amber-400 hover:underline cursor-pointer font-bold inline-flex items-center gap-1"
            >
              {isRefreshing ? 'Rechecking...' : 'Recheck Database Role'}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Case 4: Logged in AND Verified Administrator — Full Authorized Admin Dashboard
  const totalListings = products.length;
  const activeOrders = orders.filter((o) => o.status === 'Pending').length;
  const verifiedSellersCount = new Set(
    products.filter((p) => p.sellerIsVerified).map((p) => p.sellerId)
  ).size;
  const totalVolume = orders.reduce((sum, ord) => sum + ord.totalAmount, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      
      {/* Top Admin Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm sm:text-base text-white">MELA MARKET</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                ADMIN
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Signed in as: <strong className="text-white">{user.name}</strong> (<span className="text-amber-300 font-mono">{user.email}</span>)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefreshRole}
            disabled={isRefreshing}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            title="Recheck database permissions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            onClick={onReturnToMarketplace}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
            <span>Go to Storefront</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              await signOut();
              onReturnToMarketplace();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Admin Tabs */}
      <div className="bg-slate-950/60 border-b border-slate-800 px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-3.5 font-bold text-xs sm:text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {t('admin.tab.overview')}
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 px-3.5 font-bold text-xs sm:text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {t('admin.tab.products')} ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 px-3.5 font-bold text-xs sm:text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {t('admin.tab.orders')} ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`py-3 px-3.5 font-bold text-xs sm:text-sm border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'database'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span>Database Role Setup</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">

        {/* TAB 1: OVERVIEW & STATS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-bold">{t('admin.stats.listings')}</span>
                  <Package className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-3xl font-black text-white">{totalListings}</p>
                <span className="text-[11px] text-emerald-400">Live active listings</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-bold">{t('admin.stats.orders')}</span>
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-3xl font-black text-white">{activeOrders}</p>
                <span className="text-[11px] text-amber-400">Pending customer orders</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-bold">{t('admin.stats.sellers')}</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-3xl font-black text-white">{verifiedSellersCount}</p>
                <span className="text-[11px] text-blue-400">Verified merchants</span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-bold">{t('admin.stats.revenue')}</span>
                  <DollarSign className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-3xl font-black text-white">{totalVolume.toLocaleString()} ETB</p>
                <span className="text-[11px] text-purple-400">Total gross order volume</span>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700">
              <h3 className="font-black text-sm text-white mb-3">Recent Orders Activity</h3>
              <div className="space-y-2.5">
                {orders.slice(0, 5).map((ord) => (
                  <div key={ord.id} className="p-3.5 bg-slate-800 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between text-xs gap-2">
                    <div>
                      <span className="font-extrabold text-amber-300">{ord.id}</span>
                      <span className="text-slate-300 ml-2">by {ord.customerName} ({ord.customerPhone})</span>
                      <span className="text-slate-500 ml-2">[{ord.region}{ord.woreda ? ` / ${ord.woreda}` : ''}]</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-emerald-400">{ord.totalAmount.toLocaleString()} ETB</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        {ord.status}
                      </span>
                      {ord.paymentReceipt && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.paymentReceipt.verified
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {ord.paymentReceipt.verified ? 'Receipt Verified ✓' : 'Receipt Pending'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-white">All Marketplace Listings ({products.length})</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800 text-slate-400 uppercase font-semibold">
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Location (Region/Zone/Woreda)</th>
                    <th className="py-2.5 px-3">Seller</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3">Stock Qty</th>
                    <th className="py-2.5 px-3">Condition</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {products.map((prod) => {
                    const regionObj = ethiopianLocations.find((r) => r.id === prod.region);
                    const regName = regionObj ? localize(regionObj.name) : prod.region;
                    const znObj = regionObj?.zones.find((z) => z.id === prod.zone);
                    const znName = znObj ? localize(znObj.name) : prod.zone;
                    const wrObj = znObj?.woredas?.find((w) => w.id === prod.woreda);
                    const wrName = wrObj ? localize(wrObj.name) : prod.woreda;
                    const locStr = wrName ? `${wrName}, ${znName || regName}` : znName ? `${znName}, ${regName}` : regName;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="py-3 px-3 flex items-center gap-2.5">
                          <img
                            src={prod.images[0] || ''}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover bg-slate-700 shrink-0"
                          />
                          <span className="font-bold text-white max-w-[180px] truncate">
                            {localize(prod.title)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">{prod.categoryId}</td>
                        <td className="py-3 px-3 text-slate-300 max-w-[150px] truncate" title={locStr}>
                          {locStr}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-200">{prod.sellerName}</p>
                          <p className="text-[10px] text-slate-400">{prod.sellerPhone}</p>
                        </td>
                        <td className="py-3 px-3 font-black text-emerald-400">
                          {prod.price.toLocaleString()} ETB
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1 border border-slate-600 rounded-lg p-0.5 w-fit bg-slate-800">
                            <button
                              type="button"
                              onClick={() => updateProductQuantity(prod.id, (prod.quantity ?? 1) - 1)}
                              className="w-5 h-5 rounded hover:bg-slate-700 flex items-center justify-center text-slate-300"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center font-black text-white">
                              {prod.quantity ?? 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateProductQuantity(prod.id, (prod.quantity ?? 1) + 1)}
                              className="w-5 h-5 rounded hover:bg-slate-700 flex items-center justify-center text-slate-300"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-200">
                            {prod.condition === 'Brand New' ? 'አዲስ (Brand New)' : 'ያገለገለ (Used)'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this listing?')) {
                                deleteProduct(prod.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-900/50 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS MANAGEMENT & RECEIPT VERIFICATION */}
        {activeTab === 'orders' && (
          <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-4">
            <h3 className="font-black text-sm text-white">Order Tracking & Receipt Verification ({orders.length})</h3>

            <div className="space-y-3.5">
              {orders.map((ord) => (
                <div key={ord.id} className="p-4 rounded-2xl border border-slate-700 bg-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-700">
                    <div>
                      <span className="font-black text-sm text-amber-300">{ord.id}</span>
                      <span className="text-xs text-slate-400 ml-2">{ord.orderDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300">Status:</span>
                      <select
                        value={ord.status}
                        onChange={(e) => updateOrderStatus(ord.id, e.target.value as OrderStatus)}
                        className="px-2.5 py-1 rounded-lg border border-slate-600 font-bold text-xs bg-slate-900 text-white cursor-pointer"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="font-bold text-white">Customer: {ord.customerName}</p>
                      <p className="text-slate-300">Phone: <a href={`tel:${ord.customerPhone}`} className="text-emerald-400 underline">{ord.customerPhone}</a></p>
                      <p className="text-slate-400">Address: {ord.deliveryAddress}</p>
                      {ord.woreda && <p className="text-slate-400">Woreda: {ord.woreda} ({ord.zone}, {ord.region})</p>}
                    </div>
                    <div className="sm:text-right">
                      <p className="text-slate-400">Total Amount:</p>
                      <p className="text-base font-black text-emerald-400">
                        {ord.totalAmount.toLocaleString()} ETB
                      </p>
                      {ord.notes && (
                        <p className="text-[11px] text-amber-300/80 italic mt-1">Note: "{ord.notes}"</p>
                      )}
                    </div>
                  </div>

                  {/* Payment Receipt Verification Box */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-xs text-white">Payment Receipt Screenshot:</span>
                        {ord.paymentReceipt ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ord.paymentReceipt.verified
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {ord.paymentReceipt.verified ? 'Verified by Admin ✓' : 'Pending Verification (Not Verified)'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">No screenshot uploaded yet</span>
                        )}
                      </div>

                      {ord.paymentReceipt && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewReceiptUrl(ord.paymentReceipt!.receiptUrl)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-600 hover:border-amber-400 text-xs font-semibold text-slate-200 flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Full Image</span>
                          </button>

                          {ord.paymentReceipt.verified ? (
                            <button
                              type="button"
                              onClick={() => verifyPaymentReceipt(ord.id, false)}
                              className="px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-bold hover:bg-rose-900 cursor-pointer"
                            >
                              Revoke Verification
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => verifyPaymentReceipt(ord.id, true)}
                              className="px-3 py-1 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-600 cursor-pointer shadow-xs"
                            >
                              Verify Payment (ክፍያ አረጋግጥ)
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {ord.paymentReceipt && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center gap-3 text-xs">
                        <img
                          src={ord.paymentReceipt.receiptUrl}
                          alt="Receipt"
                          onClick={() => setPreviewReceiptUrl(ord.paymentReceipt!.receiptUrl)}
                          className="w-14 h-14 rounded-lg object-cover border border-slate-700 cursor-pointer hover:opacity-80"
                        />
                        <div className="text-[11px] text-slate-300">
                          <p><strong>Payment Method:</strong> {ord.paymentReceipt.paymentMethod || 'Telebirr'}</p>
                          {ord.paymentReceipt.transactionRef && (
                            <p><strong>Transaction Ref:</strong> <span className="font-mono text-amber-300">{ord.paymentReceipt.transactionRef}</span></p>
                          )}
                          <p className="text-slate-500">Uploaded at: {ord.paymentReceipt.uploadedAt}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DATABASE SETUP & ROLE GRANT INSTRUCTIONS */}
        {activeTab === 'database' && (
          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-white">Database-Side Role Authorization Setup</h3>
                <p className="text-xs text-slate-400">
                  How administrator authorization is granted and strictly validated on the database level.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                SQL Command: Grant Administrator Privileges to Account
              </h4>
              <p className="text-xs text-slate-300">
                Execute this SQL command in your Supabase SQL Editor to grant administrator access to your specific email:
              </p>
              <pre className="p-3 rounded-lg bg-black/60 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800">
{`-- Grant Admin Role in Supabase Database
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'mikiaelebrhane21@gmail.com';

-- Verify the update succeeded
SELECT id, name, email, role, created_at 
FROM public.profiles 
WHERE email = 'mikiaelebrhane21@gmail.com';`}
              </pre>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <h4 className="font-bold text-white">Security Guarantees:</h4>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                <li><strong className="text-white">Zero Public Exposure:</strong> The Admin Dashboard has no links or entry points in public navigation, headers, footers, or mobile drawers.</li>
                <li><strong className="text-white">Direct URL Only:</strong> Accessible strictly by visiting <code className="text-amber-400">/admin</code> directly.</li>
                <li><strong className="text-white">Hardened Database Authorization:</strong> Ordinary user accounts are verified on the database level via Supabase Auth and RLS. Unauthorized users attempting to visit <code className="text-amber-400">/admin</code> are automatically denied and redirected to the home page.</li>
                <li><strong className="text-white">No Public Promotion:</strong> Ordinary registration never creates administrators. Only explicit database-side role assignment grants admin rights.</li>
              </ul>
            </div>
          </div>
        )}

      </main>

      {/* Full-Screen Receipt Preview Modal */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden p-3 flex flex-col">
            <div className="flex justify-between items-center px-2 py-1.5 border-b border-slate-800 mb-2">
              <span className="font-bold text-xs text-amber-300">Payment Receipt Full Preview</span>
              <button
                onClick={() => setPreviewReceiptUrl(null)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-auto flex items-center justify-center bg-black rounded-lg p-2">
              <img src={previewReceiptUrl} alt="Receipt Full" className="max-w-full max-h-[75vh] object-contain" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
