import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Users, TrendingUp, Building2, Clock, ChefHat, Download, Trash2, X } from 'lucide-react';

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

  // States for deleting Database
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDownloadCSV = () => {
    const encabezados = ['Nombre', 'ID Empleado', 'Departamento', 'Fecha', 'Hora'];
    
    const filas = registros.map(r => {
      let fecha = '—';
      let hora = '—';
      if (r.fechaHora) {
        const d = new Date(r.fechaHora.seconds * 1000);
        fecha = d.toLocaleDateString('es-ES');
        hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      }
      return `"${r.nombre}";"${r.idEmpleado}";"${r.departamento}";"${fecha}";"${hora}"`;
    });

    const BOM = '\uFEFF';
    const contenidoCsv = BOM + [encabezados.join(';'), ...filas].join('\n');
    
    const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.href = url;
    element.setAttribute('download', `Registros_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}.csv`);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDeleteDB = async () => {
    if (password !== 'admin123') {
      setDeleteError('Contraseña incorrecta');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');
    try {
      const promises = registros.map(r => deleteDoc(doc(db, 'registros', r.id)));
      await Promise.all(promises);
      setShowModal(false);
      setPassword('');
    } catch (error) {
      console.error("Error al borrar la base de datos:", error);
      setDeleteError('Ocurrió un error al borrar los datos');
    } finally {
      setIsDeleting(false);
    }
  };

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

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
        <button
          onClick={handleDownloadCSV}
          className="w-14 h-14 bg-emerald-600 hover:bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20 text-white flex items-center justify-center transition-all active:scale-95 hover:-translate-y-1"
          title="Descargar Excel/CSV"
        >
          <Download size={22} />
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="w-14 h-14 bg-rose-600 hover:bg-rose-500 rounded-2xl shadow-lg shadow-rose-500/20 text-white flex items-center justify-center transition-all active:scale-95 hover:-translate-y-1"
          title="Borrar Base de Datos"
        >
          <Trash2 size={22} />
        </button>
      </div>

      {/* Delete Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity"
             onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl w-full max-w-sm shadow-2xl relative transform transition-all">
            <button 
              onClick={() => {
                setShowModal(false);
                setPassword('');
                setDeleteError('');
              }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 mb-4 text-rose-500">
              <div className="bg-rose-500/20 p-2.5 rounded-xl border border-rose-500/20">
                <Trash2 size={24} />
              </div>
              <h2 className="text-xl font-bold text-white">Borrar Datos</h2>
            </div>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              ¿Estás seguro que deseas borrar todos los registros? Esta acción <strong className="text-rose-400">no se puede deshacer</strong>. Por favor ingresa la contraseña maestra para confirmar.
            </p>
            <input 
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 transition-all mb-2 placeholder:text-slate-600"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && password) handleDeleteDB();
              }}
            />
            {deleteError && (
              <p className="text-rose-500 text-xs font-medium pl-1">{deleteError}</p>
            )}
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setPassword('');
                  setDeleteError('');
                }}
                className="px-5 py-2.5 text-slate-300 hover:bg-slate-800 rounded-xl transition-colors font-medium text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteDB}
                disabled={isDeleting || !password}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-xl transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Borrando...
                  </>
                ) : (
                  'Borrar Todo'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}