import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Store, ShoppingCart, Package, BarChart3, Plus, Search, 
  Trash2, History, X, CreditCard, RefreshCw, TrendingUp, 
  FileText, ArrowUpRight, Camera, ChevronLeft, ChevronRight,
  Settings, Menu, Sparkles, MessageSquare, BrainCircuit, QrCode,
  Lock, User, Eye, EyeOff, LogOut
} from 'lucide-react';

// --- CẤU HÌNH HỆ THỐNG ---
const API_URL = "https://script.google.com/macros/s/AKfycbxqcjr7UtUKXYkB2uBkkc6Sy4NMXFfFtofOgohUQpJsvukmOqOHHIf1RKXGZpqBVxyZ/exec";
const GEMINI_API_KEY = ""; 

// CẤU HÌNH ĐĂNG NHẬP
const AUTH_CREDENTIALS = {
  username: "banhang",
  password: "Banhang@85"
};

// CẤU HÌNH VIETQR
const BANK_CONFIG = {
  bankId: "ICB", 
  accountNo: "123456789", 
  accountName: "NGUYEN VAN A"
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [activeTab, setActiveTab] = useState('pos');
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [aiInsight, setAiInsight] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerType, setScannerType] = useState('sell');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showCartMobile, setShowCartMobile] = useState(false);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', cost: '', stock: '', id: '' });

  // Kiểm tra đăng nhập khi khởi tạo
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('isLoggedIn');
    if (savedAuth === 'true') {
      setIsLoggedIn(true);
    }
    fetchData();
  }, []);

  // --- HÀM XỬ LÝ ĐĂNG NHẬP ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginForm.username === AUTH_CREDENTIALS.username && loginForm.password === AUTH_CREDENTIALS.password) {
      setIsLoggedIn(true);
      setLoginError('');
      sessionStorage.setItem('isLoggedIn', 'true');
    } else {
      setLoginError('Tài khoản hoặc mật khẩu không chính xác!');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('isLoggedIn');
    setLoginForm({ username: '', password: '' });
  };

  // --- TẢI THƯ VIỆN QUÉT MÃ VẠCH ---
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://unpkg.com/html5-qrcode";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body && document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  // --- LẤY DỮ LIỆU ---
  const fetchData = async () => {
    setIsSyncing(true);
    try {
      if (!API_URL) {
        setProducts([{ id: '893', name: 'Sản phẩm mẫu', price: 50000, cost: 30000, stock: 100 }]);
        setLoading(false);
        return;
      }
      const response = await fetch(API_URL);
      const data = await response.json();
      setProducts(data.products || []);
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error("Lỗi kết nối API:", error);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  const addToCart = (product) => {
    if (!product || product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || isSyncing || !API_URL) return;
    setIsSyncing(true);
    const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const payload = {
      action: 'addTransaction',
      transaction: {
        id: 'TX' + Date.now(),
        items: cart.map(i => `${i.name} (x${i.quantity})`).join(', '),
        total: total,
        totalCost: cart.reduce((s, i) => s + (i.cost * i.quantity), 0),
        timestamp: new Date().toISOString()
      },
      stockUpdates: cart.map(item => ({ id: item.id, newStock: item.stock - item.quantity }))
    };
    try {
      const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
      if (res.ok) { 
        setCart([]); 
        setShowCartMobile(false); 
        setShowPaymentQR(false); 
        fetchData(); 
      }
    } catch (e) { console.error(e); } finally { setIsSyncing(false); }
  };

  const totalAmount = useMemo(() => cart.reduce((s, i) => s + (i.price * i.quantity), 0), [cart]);
  const vietQrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-compact.png?amount=${totalAmount}&addInfo=THANHTOAN%20DONHANG&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(term) || p.id.toString().includes(term));
  }, [products, searchTerm]);

  // --- GIAO DIỆN ĐĂNG NHẬP ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-blue-600 rounded-[24px] shadow-xl shadow-blue-200 mb-4 animate-bounce">
              <Store className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">VinaPOS ✨</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Hệ thống quản lý thông minh</p>
          </div>

          <form onSubmit={handleLogin} className="bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Tài khoản</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type="text" 
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-sm"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-sm"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="bg-red-50 text-red-500 text-[10px] font-black uppercase text-center p-3 rounded-xl border border-red-100">
                  {loginError}
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Đăng nhập
              </button>
            </div>
          </form>

          <p className="text-center mt-8 text-slate-300 font-bold text-[10px] uppercase tracking-widest">
            Phiên bản 3.5.0 • Powered by AI
          </p>
        </div>
      </div>
    );
  }

  // --- GIAO DIỆN CHÍNH (ĐÃ ĐĂNG NHẬP) ---
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="text-center">
        <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">VinaPOS ✨ Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      
      {/* HEADER */}
      <header className="safe-top bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-black text-lg tracking-tight block leading-none">VinaPOS</span>
            <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">AI Powered</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => { setScannerType('sell'); setShowScanner(true); }} className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
            <Camera className="w-5 h-5" />
          </button>
          <button onClick={handleLogout} className="p-2.5 bg-red-50 rounded-xl text-red-500">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* SEARCH BAR */}
      <div className="px-4 py-2 bg-white border-b">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc mã vạch..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'pos' && (
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredProducts.map(p => (
              <div key={p.id} onClick={() => addToCart(p)} className={`bg-white p-3 rounded-3xl border border-slate-100 shadow-sm active:scale-95 transition-all ${p.stock <= 0 ? 'opacity-50 grayscale' : ''}`}>
                <div className="aspect-square bg-slate-50 rounded-2xl mb-3 flex items-center justify-center relative">
                  <Package className="w-8 h-8 text-slate-200" />
                  {p.stock < 5 && p.stock > 0 && <span className="absolute top-2 right-2 bg-amber-500 text-[8px] font-black text-white px-1.5 py-0.5 rounded-full">SẮP HẾT</span>}
                </div>
                <h3 className="font-bold text-xs line-clamp-2 h-8 leading-tight mb-2 px-1">{p.name}</h3>
                <div className="flex justify-between items-center px-1">
                  <span className="text-blue-600 font-black text-sm">{Number(p.price).toLocaleString()}đ</span>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-full">{p.stock}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ... (Các tab khác giữ nguyên logic) ... */}
        {activeTab === 'inventory' && (
          <div className="p-4 space-y-4">
             {/* Content Inventory */}
             {products.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-3xl border shadow-sm flex justify-between items-center">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center"><Package className="w-5 h-5 text-slate-300"/></div>
                  <div>
                    <p className="font-bold text-sm text-slate-800">{p.name}</p>
                    <p className="text-[9px] font-black text-blue-500 uppercase">{p.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm">{Number(p.price).toLocaleString()}đ</p>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.stock < 10 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>Tồn: {p.stock}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
           <div className="p-4 space-y-3">
             {transactions.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).map(t => (
               <div key={t.id} className="bg-white p-5 rounded-[28px] border shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">{t.id}</span>
                    <span className="text-[10px] font-bold text-slate-400">{new Date(t.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mb-4 truncate">{t.items}</p>
                  <div className="flex justify-between items-end">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Tổng đơn</div>
                    <div className="text-lg font-black text-slate-900">{Number(t.total).toLocaleString()}đ</div>
                  </div>
               </div>
             ))}
           </div>
        )}
      </main>

      {/* GIỎ HÀNG FLOATING */}
      {cart.length > 0 && activeTab === 'pos' && (
        <button onClick={() => setShowCartMobile(true)} className="fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-2xl animate-bounce z-40 border-4 border-white">
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-3 -right-3 bg-red-500 text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-black border-2 border-white">{cart.reduce((s,i) => s + i.quantity, 0)}</span>
          </div>
        </button>
      )}

      {/* BOTTOM NAV */}
      <nav className="bg-white border-t px-6 py-3 flex justify-between items-center sticky bottom-0 safe-bottom z-50">
        <NavBtn icon={ShoppingCart} label="Bán" active={activeTab === 'pos'} onClick={() => setActiveTab('pos')} />
        <NavBtn icon={Package} label="Kho" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
        <NavBtn icon={History} label="Lịch sử" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
      </nav>

      {/* MODAL QR THANH TOÁN (VIETQR) */}
      {showPaymentQR && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex flex-col justify-center p-6 items-center text-white">
          <div className="bg-white p-6 rounded-[40px] w-full max-w-sm text-slate-900 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg uppercase tracking-tight">QR Thanh Toán</h3>
              <button onClick={() => setShowPaymentQR(false)} className="p-2 bg-slate-100 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <div className="bg-slate-50 p-4 rounded-3xl mb-6 flex flex-col items-center">
              <img src={vietQrUrl} alt="VietQR" className="w-full aspect-square object-contain rounded-2xl mb-4 border-2 border-white shadow-sm" />
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase">Tổng tiền</p>
                <p className="text-3xl font-black text-blue-600">{totalAmount.toLocaleString()}đ</p>
              </div>
            </div>
            <button onClick={handleCheckout} className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3">
              {isSyncing ? <RefreshCw className="animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
              XÁC NHẬN ĐÃ NHẬN TIỀN
            </button>
          </div>
        </div>
      )}

      {/* MODAL GIỎ HÀNG */}
      {showCartMobile && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex flex-col justify-end">
          <div className="bg-white rounded-t-[40px] max-h-[85vh] flex flex-col p-8 animate-slide-up shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-2xl tracking-tighter">Giỏ hàng</h3>
              <button onClick={() => setShowCartMobile(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X className="w-5 h-5"/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-5 mb-8">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex-1 pr-4">
                    <p className="font-black text-sm text-slate-800 truncate">{item.name}</p>
                    <p className="text-xs font-bold text-blue-600">{item.price.toLocaleString()}đ</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-50 rounded-xl border border-slate-100">
                      <button onClick={() => addToCart(item)} className="px-3 py-2 text-blue-600 font-black">+</button>
                      <span className="px-1 py-2 font-black text-xs">{item.quantity}</span>
                      <button onClick={() => {
                        setCart(c => c.map(i => i.id === item.id ? {...i, quantity: Math.max(0, i.quantity - 1)} : i).filter(i => i.quantity > 0))
                      }} className="px-3 py-2 text-slate-400 font-black">-</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <span className="text-slate-400 font-black text-xs uppercase tracking-widest">Tổng cộng</span>
                <span className="text-3xl font-black text-blue-600">{totalAmount.toLocaleString()}đ</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleCheckout} className="bg-slate-100 text-slate-600 py-5 rounded-[24px] font-black text-xs">TIỀN MẶT</button>
                <button onClick={() => setShowPaymentQR(true)} className="bg-blue-600 text-white py-5 rounded-[24px] font-black text-xs flex items-center justify-center gap-2">
                  <QrCode className="w-4 h-4" /> CHUYỂN KHOẢN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 outline-none">
      <div className={`p-2.5 rounded-2xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg scale-110' : 'text-slate-300'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-blue-600' : 'text-slate-300'}`}>{label}</span>
    </button>
  );
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slide-up { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .safe-top { padding-top: env(safe-area-inset-top); }
  .safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
  ::-webkit-scrollbar { display: none; }
`;
document.head.appendChild(style);