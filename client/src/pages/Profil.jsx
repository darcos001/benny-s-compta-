import { useState, useEffect } from 'react';
import { UserCircle, DollarSign, Wrench, TrendingUp, AlertTriangle, RotateCcw } from 'lucide-react';
import CarteStat from '../components/CarteStat.jsx';
import { appelApi, formaterArgent } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profil() {
  const { employe, deconnecter } = useAuth();
  const [stats, setStats] = useState(null);
  const [modaleResetOuverte, setModaleResetOuverte] = useState(false);
  const [textConfirmation, setTextConfirmation] = useState('');
  const [resetEnCours, setResetEnCours] = useState(false);
  const [erreurReset, setErreurReset] = useState('');

  useEffect(() => {
    appelApi(`/interventions/stats/employe/${employe.id}`).then(setStats);
  }, [employe.id]);

  async function confirmerReset() {
    setResetEnCours(true);
    setErreurReset('');
    try {
      await appelApi('/admin/reset', {
        method: 'POST',
        body: JSON.stringify({ confirmation: textConfirmation }),
      });
      await deconnecter();
      window.location.reload();
    } catch (e) {
      setErreurReset(e.message);
      setResetEnCours(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-gray-400 text-lg">
        Gestion / <span className="text-white font-semibold">Mon profil</span>
      </div>

      <div className="bg-bg-panel rounded-xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-bg-card flex items-center justify-center text-accent-blue">
          <UserCircle size={36} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{employe.nom_affiche}</h2>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-md"
              style={{ backgroundColor: `${employe.grade?.couleur}22`, color: employe.grade?.couleur }}
            >
              {employe.grade?.nom?.toUpperCase()}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-bg-card text-gray-300">
              {employe.grade?.commission_pourcentage}% COMMISSION
            </span>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <CarteStat
            icone={Wrench}
            couleur="#3b82f6"
            titre="Interventions réalisées"
            valeur={stats.interventions_count}
          />
          {employe.est_admin && (
            <CarteStat
              icone={DollarSign}
              couleur="#f59e0b"
              titre="Chiffre d'affaires généré"
              valeur={formaterArgent(stats.total_genere)}
            />
          )}
          <CarteStat
            icone={TrendingUp}
            couleur="#22c55e"
            titre="Commissions perçues"
            valeur={formaterArgent(stats.total_commission)}
          />
        </div>
      )}

      {employe.est_admin && (
        <div className="bg-bg-panel rounded-xl p-6 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400 font-semibold mb-2">
            <AlertTriangle size={18} />
            Zone dangereuse
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Réinitialise entièrement le site : toutes les réparations, customs, employés, dépenses,
            l'historique de paie et le catalogue seront définitivement supprimés. Seul le compte
            admin par défaut sera recréé.
          </p>
          <button
            onClick={() => setModaleResetOuverte(true)}
            className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/30 font-semibold text-sm px-4 py-2.5 rounded-lg hover:bg-red-500/20"
          >
            <RotateCcw size={16} />
            Réinitialiser le site
          </button>
        </div>
      )}

      {modaleResetOuverte && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-bg-panel rounded-xl w-full max-w-md p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-red-400 font-semibold text-lg">
              <AlertTriangle size={20} />
              Confirmer la réinitialisation
            </div>
            <p className="text-gray-400 text-sm">
              Cette action est <span className="text-red-400 font-semibold">irréversible</span>. Tape{' '}
              <span className="font-mono text-white">RESET</span> ci-dessous pour confirmer.
            </p>
            <input
              type="text"
              value={textConfirmation}
              onChange={(e) => setTextConfirmation(e.target.value)}
              placeholder="RESET"
              className="bg-bg-card border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50"
            />
            {erreurReset && <p className="text-red-400 text-sm">{erreurReset}</p>}
            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => {
                  setModaleResetOuverte(false);
                  setTextConfirmation('');
                  setErreurReset('');
                }}
                className="text-gray-400 hover:text-white text-sm font-semibold px-4 py-2.5"
              >
                Annuler
              </button>
              <button
                onClick={confirmerReset}
                disabled={textConfirmation !== 'RESET' || resetEnCours}
                className="bg-red-500 text-white font-semibold text-sm px-4 py-2.5 rounded-lg disabled:opacity-40"
              >
                {resetEnCours ? 'Réinitialisation...' : 'Confirmer la réinitialisation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
