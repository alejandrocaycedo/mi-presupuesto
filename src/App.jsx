import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, query, 
  addDoc, deleteDoc, updateDoc 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from 'firebase/auth';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { 
  Wallet, TrendingUp, TrendingDown, Plus, X, Save, 
  Home, ShoppingCart, Car, HeartPulse, CreditCard, 
  Zap, ArrowUpRight, ArrowDownRight, PiggyBank,
  ShieldCheck, AlertCircle, Target, List,
  Calendar as CalendarIcon, PlusCircle, Users, User,
  Landmark, Activity, Trash2, Cloud, Info, Shield,
  Siren, Sprout, Banknote, Percent, Building, AlertTriangle
} from 'lucide-react';

// Configuración de Firebase
 const firebaseConfig = {
    apiKey: "AIzaSyCofeKD4i3XMNJ_9e4jfMwYxz7_sHWAw2w",
    authDomain: "tablero-famililar.firebaseapp.com",
    projectId: "tablero-famililar",
    storageBucket: "tablero-famililar.firebasestorage.app",
    messagingSenderId: "1030309404301",
    appId: "1:1030309404301:web:83e360430c6f8ad597ccc4",
    measurementId: "G-40FX8VM2JY"
  };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Sub-componente para las barras de progreso por categoría
const CategoryProgress = ({ label, budget, actual, icon, color }) => {
  const percent = budget > 0 ? (actual / budget) * 100 : 0;
  const isOver = actual > budget;
  const formatCurrencyLocal = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-2 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${color} bg-opacity-10 ${color.replace('text-', 'bg-')}`}>{icon}</div>
          <span className="text-xs font-bold text-slate-700">{label}</span>
        </div>
        <span className="text-xs font-black">{formatCurrencyLocal(actual)}</span>
      </div>
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-700 ${isOver ? 'bg-red-500' : 'bg-blue-600'}`} 
          style={{ width: `${Math.min(percent, 100)}%` }}
        ></div>
      </div>
      <div className="flex justify-between items-center">
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Plan: {formatCurrencyLocal(budget)}</p>
        {isOver && <span className="text-[9px] text-red-500 font-black">EXCEDIDO</span>}
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('Feb 2026');
  const [loading, setLoading] = useState(true);

  // Modales
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Formularios
  const [expenseForm, setExpenseForm] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    category: 'alimentacion', 
    responsible: 'Familia', 
    description: '', 
    amount: '',
    source: 'presupuesto' 
  });
  
  const [budgetForm, setBudgetForm] = useState({ 
    month: '', incAlejo: 2500000, incRosalba: 2500000, 
    vivienda: 1000000, servicios: 400000, administracion: 150000, alimentacion: 800000, 
    transporte: 200000, salud: 150000, deudas: 250000, planilla: 200000, otros: 0,
    limitCap: 3000000 // Meta por defecto
  });

  const [accountForm, setAccountForm] = useState({ name: '', balance: '', bank: '', type: 'ahorro' });

  // 1. Autenticación
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Sincronización en tiempo real
  useEffect(() => {
    if (!user) return;

    const qBudgets = collection(db, 'artifacts', appId, 'public', 'data', 'budgets');
    const unsubBudgets = onSnapshot(qBudgets, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBudgets(data.length ? data : [{
        month: 'Feb 2026',
        limitCap: 3000000,
        income: { alejandro: 2500000, rosalba: 2500000 },
        limits: { vivienda: 900000, servicios: 400000, administracion: 150000, alimentacion: 700000, transporte: 200000, salud: 150000, deudas: 250000, planilla: 200000, otros: 50000 }
      }]);
    });

    const qTrans = collection(db, 'artifacts', appId, 'public', 'data', 'transactions');
    const unsubTrans = onSnapshot(qTrans, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qAccs = collection(db, 'artifacts', appId, 'public', 'data', 'accounts');
    const unsubAccs = onSnapshot(qAccs, (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    setLoading(false);
    return () => { unsubBudgets(); unsubTrans(); unsubAccs(); };
  }, [user]);

  // --- LÓGICA DE NEGOCIO ---
  const currentBudget = useMemo(() => budgets.find(b => b.month === selectedMonth) || budgets[0] || {}, [selectedMonth, budgets]);
  const monthLimitCap = Number(currentBudget.limitCap) || 3000000;

  const totalIncome = useMemo(() => {
    if (!currentBudget.income) return 0;
    return (Number(currentBudget.income.alejandro) || 0) + (Number(currentBudget.income.rosalba) || 0);
  }, [currentBudget]);

  const budgetSpent = useMemo(() => {
    return transactions
      .filter(t => t.source === 'presupuesto' || !t.source)
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const savingsSpent = useMemo(() => transactions.filter(t => t.source === 'ahorro').reduce((acc, t) => acc + (Number(t.amount) || 0), 0), [transactions]);
  const imprevistosSpent = useMemo(() => transactions.filter(t => t.source === 'imprevistos').reduce((acc, t) => acc + (Number(t.amount) || 0), 0), [transactions]);

  const consolidatedByCat = useMemo(() => {
    const summary = { vivienda: 0, servicios: 0, administracion: 0, alimentacion: 0, transporte: 0, salud: 0, deudas: 0, planilla: 0, otros: 0 };
    transactions.filter(t => t.source === 'presupuesto' || !t.source).forEach(t => { 
      if (summary[t.category] !== undefined) summary[t.category] += (Number(t.amount) || 0); 
    });
    return summary;
  }, [transactions]);

  const effectiveBudget = totalIncome > monthLimitCap ? monthLimitCap : totalIncome;
  const monthlySurplus = totalIncome > monthLimitCap ? (totalIncome - monthLimitCap) : 0;
  
  const savingsAllocation = monthlySurplus * 0.7;
  const imprevistosAllocation = monthlySurplus * 0.3;

  const patrimonyData = useMemo(() => {
    const baseSavings = accounts.filter(a => a.type === 'ahorro').reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);
    const baseImprevistos = accounts.filter(a => a.type === 'imprevistos').reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);
    
    const currentAhorro = baseSavings + savingsAllocation - savingsSpent;
    const currentImprevistos = baseImprevistos + imprevistosAllocation - imprevistosSpent;
    
    return { 
      total: currentAhorro + currentImprevistos, 
      ahorro: currentAhorro, 
      imprevistos: currentImprevistos 
    };
  }, [accounts, savingsAllocation, imprevistosAllocation, savingsSpent, imprevistosSpent]);

  const expensesByPerson = useMemo(() => {
    const data = { 'Familia': 0, 'Alejandro': 0, 'Rosalba': 0, 'Paula': 0 };
    transactions.forEach(t => { if (data[t.responsible] !== undefined) data[t.responsible] += (Number(t.amount) || 0); });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  // Validación de presupuesto en el formulario
  const currentBudgetSum = useMemo(() => {
    return ['vivienda', 'servicios', 'administracion', 'alimentacion', 'transporte', 'deudas', 'planilla', 'salud', 'otros']
      .reduce((acc, cat) => acc + (parseFloat(budgetForm[cat]) || 0), 0);
  }, [budgetForm]);

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  // Acciones Firebase
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!user) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), {
      ...expenseForm, 
      amount: parseFloat(expenseForm.amount) || 0, 
      createdAt: new Date(),
      monthRef: selectedMonth
    });
    setShowExpenseModal(false);
    setExpenseForm({ ...expenseForm, description: '', amount: '' });
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!user) return;
    const newB = {
      month: budgetForm.month,
      limitCap: parseFloat(budgetForm.limitCap) || 3000000,
      income: { alejandro: parseFloat(budgetForm.incAlejo), rosalba: parseFloat(budgetForm.incRosalba) },
      limits: {
        vivienda: parseFloat(budgetForm.vivienda), servicios: parseFloat(budgetForm.servicios),
        administracion: parseFloat(budgetForm.administracion),
        alimentacion: parseFloat(budgetForm.alimentacion), transporte: parseFloat(budgetForm.transporte),
        salud: parseFloat(budgetForm.salud), deudas: parseFloat(budgetForm.deudas), 
        planilla: parseFloat(budgetForm.planilla), otros: parseFloat(budgetForm.otros)
      }
    };
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'budgets', newB.month), newB);
    setSelectedMonth(newB.month);
    setShowBudgetModal(false);
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!user) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'accounts'), {
      ...accountForm, balance: parseFloat(accountForm.balance) || 0
    });
    setShowAccountModal(false);
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-blue-600">Sincronizando Inteligencia Financiera...</div>;

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 font-sans pb-20">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg"><Activity size={22} /></div>
            <div>
              <h1 className="text-xl font-black tracking-tight italic">Tablero Maestro Familiar</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Alejandro & Rosalba • Control Profesional</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 overflow-x-auto">
              {budgets.map(b => (
                <button key={b.month} onClick={() => setSelectedMonth(b.month)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedMonth === b.month ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{b.month}</button>
              ))}
            </div>
            <button onClick={() => setShowBudgetModal(true)} className="p-2.5 bg-slate-900 text-white rounded-full hover:scale-105 active:scale-95 transition-all"><Plus size={20} /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-6">
        
        {/* Fila 1: Resumen General con Regla de Oro */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><TrendingUp size={12} className="text-green-500" /> Ingresos Totales</p>
            <h3 className="text-2xl font-black text-slate-800">{formatCurrency(totalIncome)}</h3>
            <div className="flex gap-2 mt-1">
              <span className="text-[9px] font-bold text-blue-500">Alejo: {formatCurrency(currentBudget.income?.alejandro || 0)}</span>
              <span className="text-[9px] font-bold text-indigo-500">Rosa: {formatCurrency(currentBudget.income?.rosalba || 0)}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-indigo-100 shadow-sm">
            <p className="text-[10px] font-black text-indigo-400 uppercase mb-1 flex items-center gap-1"><Target size={12} /> Presupuesto {selectedMonth}</p>
            <h3 className="text-2xl font-black text-indigo-600">{formatCurrency(effectiveBudget)}</h3>
            <p className="text-[9px] text-indigo-400 font-bold mt-1 tracking-tighter uppercase">Límite Definido: {formatCurrency(monthLimitCap)}</p>
          </div>

          <div className="bg-blue-600 p-5 rounded-3xl text-white shadow-lg shadow-blue-200">
            <p className="text-[10px] font-bold opacity-80 uppercase mb-1 flex items-center gap-1"><Percent size={12} /> Inversión (70%)</p>
            <h3 className="text-2xl font-black">{formatCurrency(savingsAllocation)}</h3>
            <p className="text-[9px] font-bold opacity-70 italic tracking-tighter">Ahorro del excedente</p>
          </div>

          <div className="bg-red-600 p-5 rounded-3xl text-white shadow-lg shadow-red-200">
            <p className="text-[10px] font-bold opacity-80 uppercase mb-1 flex items-center gap-1"><Siren size={12} /> Imprevistos (30%)</p>
            <h3 className="text-2xl font-black">{formatCurrency(imprevistosAllocation)}</h3>
            <p className="text-[9px] font-bold opacity-70 italic tracking-tighter">Reserva de emergencia</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Columna Izquierda */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Patrimonio Neto Dinámico */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-xl md:col-span-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Patrimonio Neto</p>
                    <h4 className="text-2xl font-black text-emerald-400">{formatCurrency(patrimonyData.total)}</h4>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-2">Cuentas + Fondos Mensuales</p>
               </div>
               <div className="bg-white p-6 rounded-[2.5rem] border border-blue-100 flex items-center justify-between md:col-span-1">
                  <div>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">Fondo Ahorro</span>
                    <h4 className="text-xl font-black text-slate-800">{formatCurrency(patrimonyData.ahorro)}</h4>
                  </div>
                  <Sprout className="text-blue-500 opacity-20" size={30} />
               </div>
               <div className="bg-white p-6 rounded-[2.5rem] border border-red-100 flex items-center justify-between md:col-span-1">
                  <div>
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest block">Fondo Emergencia</span>
                    <h4 className="text-xl font-black text-slate-800">{formatCurrency(patrimonyData.imprevistos)}</h4>
                  </div>
                  <Siren className="text-red-500 opacity-20" size={30} />
               </div>
            </div>

            {/* Gráfico Alivio Codensa */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h2 className="text-lg font-black flex items-center gap-2 mb-6 text-indigo-600"><TrendingDown size={20} /> Proyección de Alivio (Cuotas Codensa)</h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[{m:'Feb', t:4140729}, {m:'Mar', t:1450000}, {m:'Abr', t:1400000}, {m:'May', t:1350000}, {m:'Jun', t:480000}]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Area type="monotone" dataKey="t" stroke="#4f46e5" strokeWidth={4} fill="#4f46e51a" dot={{ r: 4, fill: '#4f46e5' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Control de Rubros Mensuales */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black flex items-center gap-2 text-slate-800"><Target size={20} /> Ejecución Mensual (Tope {formatCurrency(monthLimitCap)})</h2>
                <div className="text-right">
                  <span className={`text-sm font-black ${budgetSpent > effectiveBudget ? 'text-red-600' : 'text-indigo-600'}`}>
                    Real: {formatCurrency(budgetSpent)} / Límite: {formatCurrency(effectiveBudget)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(currentBudget.limits || {}).map(cat => (
                  <CategoryProgress 
                    key={cat}
                    label={cat === 'planilla' ? 'Seguridad Social' : cat === 'administracion' ? 'Administración' : cat.charAt(0).toUpperCase() + cat.slice(1)} 
                    budget={currentBudget.limits[cat]} 
                    actual={consolidatedByCat[cat]} 
                    icon={
                      cat === 'alimentacion' ? <ShoppingCart size={16}/> : 
                      cat === 'vivienda' ? <Home size={16}/> : 
                      cat === 'planilla' ? <Shield size={16}/> : 
                      cat === 'administracion' ? <Building size={16}/> : <CreditCard size={16}/>
                    } 
                    color={cat === 'planilla' || cat === 'administracion' ? 'text-blue-500' : 'text-indigo-600'} 
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Columna Derecha */}
          <div className="lg:col-span-4 space-y-6">
            {/* Diario de Movimientos */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-[700px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm"><List size={18} className="text-indigo-600" /> Diario de Gastos</h3>
                <button onClick={() => setShowExpenseModal(true)} className="bg-indigo-600 text-white p-2 rounded-xl shadow-md hover:bg-indigo-700 transition-all"><PlusCircle size={18}/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {transactions.sort((a,b) => new Date(b.date) - new Date(a.date)).map(t => (
                  <div key={t.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${t.source === 'ahorro' ? 'bg-blue-100 text-blue-600' : t.source === 'imprevistos' ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'}`}>
                        {t.source === 'ahorro' ? <Sprout size={14}/> : t.source === 'imprevistos' ? <Siren size={14}/> : <Banknote size={14}/>}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[8px] font-black text-slate-400 px-1.5 py-0.5 bg-white rounded border border-slate-100">{t.date?.split('-')[2] || '??'}</span>
                          <span className="text-[8px] font-bold text-indigo-500 uppercase">{t.responsible}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 line-clamp-1">{t.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <p className="text-xs font-black text-slate-900">{formatCurrency(t.amount)}</p>
                      <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', t.id))} className="text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Patrimonio en Cuentas */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm"><Landmark size={18} className="text-indigo-600" /> Cuentas</h3>
                <button onClick={() => setShowAccountModal(true)} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-full transition-all"><Plus size={16}/></button>
              </div>
              <div className="space-y-2">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-600">{acc.name}</span>
                    <span className="text-xs font-black text-slate-900">{formatCurrency(acc.balance)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modales */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95">
            <h3 className="font-black text-xl mb-6 tracking-tight">Registrar Gasto</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="p-4 bg-slate-100 rounded-2xl font-bold text-xs" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} required />
                <select className="p-4 bg-slate-100 rounded-2xl font-bold text-xs" value={expenseForm.responsible} onChange={e => setExpenseForm({...expenseForm, responsible: e.target.value})}>
                  <option value="Familia">Familia</option><option value="Alejandro">Alejandro</option><option value="Rosalba">Rosalba</option><option value="Paula">Paula</option>
                </select>
              </div>
              <select className="w-full p-4 bg-slate-100 rounded-2xl font-bold text-xs" value={expenseForm.source} onChange={e => setExpenseForm({...expenseForm, source: e.target.value})}>
                <option value="presupuesto">💳 Presupuesto (Tope 3M)</option>
                <option value="ahorro">💰 Fondo Ahorro/Inversión</option>
                <option value="imprevistos">🚨 Fondo Imprevistos</option>
              </select>
              <select className="w-full p-4 bg-slate-100 rounded-2xl font-bold text-xs" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                <option value="alimentacion">Alimentación</option>
                <option value="vivienda">Vivienda</option>
                <option value="administracion">Administración</option>
                <option value="servicios">Servicios</option>
                <option value="transporte">Transporte</option>
                <option value="deudas">Deudas</option>
                <option value="planilla">Planilla</option>
                <option value="salud">Salud</option>
                <option value="otros">Otros</option>
              </select>
              <input type="text" placeholder="Concepto" className="w-full p-4 bg-slate-100 rounded-2xl font-bold text-sm" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} required />
              <input type="number" placeholder="Valor ($)" className="w-full p-4 bg-slate-100 rounded-2xl font-black text-xl text-indigo-600" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} required />
              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black shadow-lg">GUARDAR MOVIMIENTO</button>
              <button type="button" onClick={() => setShowExpenseModal(false)} className="w-full text-slate-400 font-bold text-xs">Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {showBudgetModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-black text-xl italic tracking-tight">Planificación del Mes</h3>
              <div className={`p-3 rounded-2xl flex items-center gap-2 ${currentBudgetSum > budgetForm.limitCap ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {currentBudgetSum > budgetForm.limitCap ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
                <span className="text-xs font-black">Plan: {formatCurrency(currentBudgetSum)}</span>
              </div>
            </div>
            
            <form onSubmit={handleSaveBudget} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Nombre Mes</label>
                  <input type="text" placeholder="Mar 2026" className="w-full p-4 bg-slate-100 rounded-2xl font-bold border-none" value={budgetForm.month} onChange={e => setBudgetForm({...budgetForm, month: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest text-indigo-600">Límite Gasto (Meta 3M)</label>
                  <input type="number" className="w-full p-4 bg-indigo-50 rounded-2xl font-black text-indigo-600 border-none" value={budgetForm.limitCap} onChange={e => setBudgetForm({...budgetForm, limitCap: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">Ingresos Combinados</label>
                  <div className="grid grid-cols-2 gap-1">
                    <input type="number" placeholder="Alejo" className="p-4 bg-slate-100 rounded-2xl font-bold text-xs" value={budgetForm.incAlejo} onChange={e => setBudgetForm({...budgetForm, incAlejo: e.target.value})} />
                    <input type="number" placeholder="Rosa" className="p-4 bg-slate-100 rounded-2xl font-bold text-xs" value={budgetForm.incRosalba} onChange={e => setBudgetForm({...budgetForm, incRosalba: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase text-center mb-4 tracking-widest">Asignación por Rubros</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['vivienda', 'servicios', 'administracion', 'alimentacion', 'transporte', 'deudas', 'planilla', 'salud', 'otros'].map(cat => (
                    <div key={cat} className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">{cat === 'planilla' ? 'S. Social' : cat === 'administracion' ? 'Administración' : cat}</label>
                      <input type="number" placeholder="0.00" className={`p-3 bg-white rounded-xl border ${currentBudgetSum > budgetForm.limitCap ? 'border-red-100' : 'border-slate-100'} w-full text-sm font-bold`} value={budgetForm[cat]} onChange={e => setBudgetForm({...budgetForm, [cat]: e.target.value})} />
                    </div>
                  ))}
                </div>
                {currentBudgetSum > budgetForm.limitCap && (
                  <p className="text-[10px] text-red-500 font-bold text-center mt-4 uppercase">⚠️ Tu plan supera el límite de {formatCurrency(budgetForm.limitCap)}</p>
                )}
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black hover:bg-black transition-all shadow-xl active:scale-95">CONFIRMAR PLAN DEL MES</button>
              <button type="button" onClick={() => setShowBudgetModal(false)} className="w-full text-slate-400 font-bold text-xs">Cerrar</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cuentas */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95">
            <h3 className="font-black text-xl mb-6">Vincular Cuenta</h3>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <input type="text" placeholder="Nombre (Ej: Cuenta Ahorros)" className="w-full p-4 bg-slate-100 rounded-2xl font-bold" value={accountForm.name} onChange={e => setAccountForm({...accountForm, name: e.target.value})} required />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Banco" className="p-4 bg-slate-100 rounded-2xl font-bold text-xs" value={accountForm.bank} onChange={e => setAccountForm({...accountForm, bank: e.target.value})} required />
                <select className="p-4 bg-slate-100 rounded-2xl font-bold text-xs" value={accountForm.type} onChange={e => setAccountForm({...accountForm, type: e.target.value})}>
                  <option value="ahorro">Ahorro / Inversión</option>
                  <option value="imprevistos">Fondo Imprevistos</option>
                </select>
              </div>
              <input type="number" placeholder="Saldo Actual ($)" className="w-full p-4 bg-slate-100 rounded-2xl font-black text-xl text-emerald-600" value={accountForm.balance} onChange={e => setAccountForm({...accountForm, balance: e.target.value})} required />
              <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black">REGISTRAR CUENTA</button>
              <button type="button" onClick={() => setShowAccountModal(false)} className="w-full text-slate-400 font-bold text-xs mt-2">Cancelar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
