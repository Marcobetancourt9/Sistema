import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { UserPlus, CheckCircle, Loader2, ChefHat } from 'lucide-react';

const DEPARTAMENTOS = [
  'Recursos Humanos',
  'Tecnología',
  'Operaciones',
  'Ventas',
  'Finanzas',
  'Marketing',
  'Logística',
];

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function Registro() {
  const [formData, setFormData] = useState({
    nombre: '',
    idEmpleado: '',
    departamento: '',
  });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departamento || formData.departamento === '') {
      setErrorMsg('Por favor selecciona un departamento.');
      return;
    }
    setErrorMsg('');
    setStatus('loading');
    try {
      await addDoc(collection(db, 'registros'), {
        ...formData,
        fechaHora: serverTimestamp(),
      });
      setStatus('success');
      setFormData({ nombre: '', idEmpleado: '', departamento: '' });
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al guardar. Intenta de nuevo.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-400/30 mb-4">
            <ChefHat size={32} className="text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Registro de Comensales</h1>
          <p className="text-slate-400 mt-1 text-sm">Registra la entrada al comedor</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle size={36} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">¡Registro exitoso!</h2>
              <p className="text-slate-400 text-sm">La entrada fue guardada en la base de datos.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Nombre Completo
                </label>
                <input
                  name="nombre"
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-white/10 border border-white/15 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* ID Empleado */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  ID de Empleado
                </label>
                <input
                  name="idEmpleado"
                  type="text"
                  required
                  value={formData.idEmpleado}
                  onChange={handleChange}
                  placeholder="Ej. EMP-0042"
                  className="w-full bg-white/10 border border-white/15 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Departamento */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Departamento
                </label>
                <select
                  name="departamento"
                  required
                  value={formData.departamento}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-white/15 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none cursor-pointer"
                >
                  <option value="" disabled>Seleccionar departamento...</option>
                  {DEPARTAMENTOS.map((dep) => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>

              {/* Error message */}
              {(status === 'error' || errorMsg) && (
                <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                  {errorMsg || 'Ocurrió un error. Intenta de nuevo.'}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/40 mt-2"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Registrar Entrada
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}