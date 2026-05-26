import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-sm">
            CL
          </div>
          <span className="font-semibold text-lg">Casa Lis POS</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-slate-300 hover:text-white transition-colors">
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
          >
            Comenzar gratis
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
          Tu negocio, tu control
        </h1>
        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
          El punto de venta diseñado para dueños de negocios que quieren crecer.
          Gestiona ventas, inventario y empleados desde cualquier lugar.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-lg font-semibold transition-colors"
          >
            Crear mi cuenta gratis
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 border border-slate-600 hover:border-slate-400 rounded-xl text-lg font-medium transition-colors"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
        {[
          { title: 'Ventas rápidas', desc: 'Procesa ventas en segundos con un POS intuitivo y rápido.' },
          { title: 'Inventario inteligente', desc: 'Control de stock en tiempo real con alertas automáticas.' },
          { title: 'Equipos ilimitados', desc: 'Añade todos los empleados que necesites sin complicaciones.' },
        ].map((f) => (
          <div key={f.title} className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-slate-400 text-sm">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Planes simples</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'Free', price: '€0', features: ['2 empleados', '100 productos', '500 ventas/mes'] },
            { name: 'Pro', price: '€29/mes', features: ['10 empleados', '1,000 productos', '10,000 ventas/mes', 'EmailJS tickets'] },
            { name: 'Enterprise', price: '€99/mes', features: ['Ilimitado', 'Prioridad support', 'API access'] },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`p-6 rounded-xl border ${
                plan.name === 'Pro'
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-700/50 bg-slate-800/30'
              }`}
            >
              <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
              <p className="text-2xl font-bold mb-4">{plan.price}</p>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <footer className="border-t border-slate-700/50 py-8 text-center text-sm text-slate-500">
        Casa Lis POS &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
