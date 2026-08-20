/**
 * V4 Sourcing Intelligence — Navigation Core v1
 * UI navigation map.
 */

export const V4_SECTIONS = [
  { id: 'radar', label: 'Radar', description: 'Sources et signaux marché' },
  { id: 'products', label: 'Produits', description: 'Opportunités analysées' },
  { id: 'suppliers', label: 'Fournisseurs', description: 'Analyse sourcing' },
  { id: 'decisions', label: 'Décisions', description: 'Résultats du moteur V4' },
  { id: 'history', label: 'Historique', description: 'Traçabilité des analyses' },
];

export function getNavigation() {
  return V4_SECTIONS;
}
