import { useState, useEffect } from 'react';
import { History, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { appelApi, formaterArgent } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function HistoriquePaie() {
  const { employe } = useAuth();
  const [historique, setHistorique] = useState([]);
  const [ligneOuverte, setLigneOuverte] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    if (employe?.est_admin) charger();
  }, [employe]);

  function charger() {
    setChargement(true);
    appelApi('/badgeuse/paie/historique')
      .then(setHistorique)
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }

  function formaterDateCourte(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function exporterCSV() {
    const entetes = ['Date de paiement', 'Depuis', "Jusqu'à", 'Montant total'];
    const echapper = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lignesCSV = historique.map((h) => [
      formaterDateCourte(h.date_paiement),
      formaterDateCourte(h.depuis),
      formaterDateCourte(h.jusqu_a),
      h.montant_total,
    ].map(echapper).join(';'));
    const contenu = [entetes.join(';'), ...lignesCSV].join('\n');
    const blob = new Blob(['\uFEFF' + contenu], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = `historique_paies_${new Date().toISOString().slice(0, 10)}.csv`;
    lien.click();
    URL.revokeObjectURL(url);
  }

  if (!employe?.est_admin) {
    return <p className="text-gray-400 text-sm">Cette page est réservée aux administrateurs.</p>;
  }

  if (chargement) return <p className="text-gray-400 text-sm">Chargement...</p>;
  if (erreur) return <p className="text-red-400 text-sm">{erreur}</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="text-gray-400 text-lg">
          Gestion / <span className="text-white font-semibold">Historique des paies</span>
        </div>
        {historique.length > 0 && (
          <button
            onClick={exporterCSV}
            className="flex items-center gap-2 bg-bg-card text-gray-300 text-sm font-semibold px-4 py-2.5 rounded-lg border border-white/10"
          >
            <Download size={16} />
            Exporter en CSV
          </button>
        )}
      </div>

      <div className="bg-bg-panel rounded-xl p-5">
        <div className="flex items-center gap-2 text-white font-semibold mb-4">
          <History size={18} className="text-accent-blue" />
          Toutes les paies effectuées
        </div>

        {historique.length === 0 ? (
          <p className="text-gray-500 text-sm py-10 text-center">
            Aucune paie enregistrée pour l'instant. Elle apparaîtra ici dès la première réinitialisation sur la page Paie.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {historique.map((h) => (
              <div key={h.id} className="bg-bg-card rounded-lg overflow-hidden">
                <button
                  onClick={() => setLigneOuverte(ligneOuverte === h.id ? null : h.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="text-sm text-gray-300">
                    <span className="text-white font-medium">{formaterDateCourte(h.date_paiement)}</span>
                    <span className="text-gray-500 ml-2">
                      (du {formaterDateCourte(h.depuis)} au {formaterDateCourte(h.jusqu_a)})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-accent-green font-semibold text-sm">{formaterArgent(h.montant_total)}</span>
                    {ligneOuverte === h.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </button>
                {ligneOuverte === h.id && (
                  <div className="px-4 pb-4">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500 uppercase border-b border-white/5">
                          <th className="text-left pb-2 font-medium">Employé</th>
                          <th className="text-right pb-2 font-medium">Commissions</th>
                          <th className="text-right pb-2 font-medium">Badgeuse</th>
                          <th className="text-right pb-2 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {h.employes.map((e) => (
                          <tr key={e.employe_id} className="border-b border-white/5 last:border-0">
                            <td className="py-2 text-white">{e.nom_affiche}</td>
                            <td className="py-2 text-right text-gray-300">{formaterArgent(e.montant_commissions)}</td>
                            <td className="py-2 text-right text-gray-300">{formaterArgent(e.montant_badgeuse)}</td>
                            <td className="py-2 text-right text-accent-green font-semibold">{formaterArgent(e.total_a_payer)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
