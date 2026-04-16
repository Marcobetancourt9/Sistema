import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Users, TrendingUp, Building2, Clock, ChefHat } from 'lucide-react';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#84cc16'];

interface Registro {
  id: string;
  nombre: string;
  idEmpleado: string;
  departamento: string;
  fechaHora: { seconds: number } | null;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 flex items-start gap-3 sm:gap-4 backdrop-blur-sm`}>
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} className="text-white sm:hidden" />
        <Icon size={22} className="text-white hidden sm:block" />
      </div>
      <div className="min-w-0">
        <p className="text-slate-400 text-xs sm:text-sm font-medium truncate">{label}</p>
        <p className="text-white text-xl sm:text-2xl font-bold mt-0.5 truncate">{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

/* Mobile card for each registro */
function RegistroCard({ r }: { r: Registro }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-white font-medium text-sm truncate">{r.nombre}</p>
        <span className="bg-blue-500/15 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full text-xs flex-shrink-0 ml-2">
          {r.departamento}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">ID: <span className="text-slate-300">{r.idEmpleado}</span></span>
        <span className="text-slate-500">
          {r.fechaHora
            ? new Date(r.fechaHora.seconds * 1000).toLocaleString('es-ES', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
              })
            : '—'}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener
  useEffect(() => {
    const q = query(collection(db, 'registros'), orderBy('fechaHora', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Registro[];
      setRegistros(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- Stats ---
  const totalHoy = useMemo(() => {
    const hoy = new Date();
    return registros.filter((r) => {
      if (!r.fechaHora) return false;
      const d = new Date(r.fechaHora.seconds * 1000);
      return d.toDateString() === hoy.toDateString();
    }).length;
  }, [registros]);

  // Registros por día de la semana
  const porDia = useMemo(() => {
    const counts: Record<string, number> = {};
    DIAS.forEach((d) => (counts[d] = 0));
    registros.forEach((r) => {
      if (!r.fechaHora) return;
      const d = new Date(r.fechaHora.seconds * 1000);
      counts[DIAS[d.getDay()]]++;
    });
    return DIAS.map((name) => ({ name, registros: counts[name] }));
  }, [registros]);

  // Registros por departamento
  const porDepto = useMemo(() => {
    const counts: Record<string, number> = {};
    registros.forEach((r) => {
      if (!r.departamento) return;
      counts[r.departamento] = (counts[r.departamento] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [registros]);

  const deptoMasFrecuente = porDepto[0]?.name ?? '—';

  // Último registro
  const ultimoRegistro = registros[0];
  const ultimaHora = ultimoRegistro?.fechaHora
    ? new Date(ultimoRegistro.fechaHora.seconds * 1000).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 sm:p-6 lg:p-8">

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
          <ChefHat size={18} className="text-blue-400 sm:hidden" />
          <ChefHat size={20} className="text-blue-400 hidden sm:block" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Reportes de Gestión</h1>
          <p className="text-slate-400 text-xs sm:text-sm">Datos en tiempo real desde Firebase</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">

          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              icon={Users}
              label="Total Registros"
              value={registros.length}
              color="bg-blue-600"
              sub="Histórico completo"
            />
            <StatCard
              icon={TrendingUp}
              label="Entradas Hoy"
              value={totalHoy}
              color="bg-emerald-600"
              sub={new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
            />
            <StatCard
              icon={Building2}
              label="Depto. más activo"
              value={deptoMasFrecuente}
              color="bg-violet-600"
              sub={`${porDepto[0]?.value ?? 0} registros`}
            />
            <StatCard
              icon={Clock}
              label="Último registro"
              value={ultimaHora}
              color="bg-amber-600"
              sub={ultimoRegistro?.nombre ?? '—'}
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">

            {/* Bar chart — registros por día */}
            <div className="xl:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
              <h2 className="text-white font-semibold mb-1 text-sm sm:text-base">Registros por día de la semana</h2>
              <p className="text-slate-400 text-xs mb-4 sm:mb-6">Total acumulado por cada día</p>
              <div className="h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porDia} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="registros" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Registros" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie chart — por departamento */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
              <h2 className="text-white font-semibold mb-1 text-sm sm:text-base">Por departamento</h2>
              <p className="text-slate-400 text-xs mb-4">Distribución de comensales</p>
              {porDepto.length === 0 ? (
                <div className="flex items-center justify-center h-48 sm:h-56 text-slate-500 text-sm">Sin datos aún</div>
              ) : (
                <div className="h-48 sm:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={porDepto}
                        cx="50%"
                        cy="45%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {porDepto.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend
                        iconType="circle"
                        iconSize={7}
                        formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 10 }}>{value}</span>}
                        wrapperStyle={{ fontSize: 10 }}
                      />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Recent registros — responsive */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10">
              <h2 className="text-white font-semibold text-sm sm:text-base">Últimas entradas</h2>
              <p className="text-slate-400 text-xs">Los registros más recientes del comedor</p>
            </div>

            {/* Mobile list view */}
            <div className="sm:hidden p-3 space-y-2">
              {registros.length === 0 ? (
                <div className="text-center text-slate-500 py-10 text-sm">
                  No hay registros todavía. ¡Registra el primer comensal!
                </div>
              ) : (
                registros.slice(0, 10).map((r) => (
                  <RegistroCard key={r.id} r={r} />
                ))
              )}
            </div>

            {/* Desktop table view */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-slate-400 font-medium px-6 py-3">Nombre</th>
                    <th className="text-left text-slate-400 font-medium px-6 py-3">ID Empleado</th>
                    <th className="text-left text-slate-400 font-medium px-6 py-3">Departamento</th>
                    <th className="text-left text-slate-400 font-medium px-6 py-3">Fecha y hora</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-slate-500 py-10">
                        No hay registros todavía. ¡Registra el primer comensal!
                      </td>
                    </tr>
                  )}
                  {registros.slice(0, 10).map((r) => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-3 text-white font-medium">{r.nombre}</td>
                      <td className="px-6 py-3 text-slate-300">{r.idEmpleado}</td>
                      <td className="px-6 py-3">
                        <span className="bg-blue-500/15 text-blue-300 border border-blue-500/20 px-2.5 py-0.5 rounded-full text-xs">
                          {r.departamento}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-slate-400">
                        {r.fechaHora
                          ? new Date(r.fechaHora.seconds * 1000).toLocaleString('es-ES', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}