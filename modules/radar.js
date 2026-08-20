// V4 Sourcing Intelligence - Radar module v1.0
export const radarPipeline = [
  "Source",
  "Connecteur",
  "Collecte",
  "Vérification",
  "Normalisation",
  "Analyse",
  "Score V4",
  "Comparaison",
  "Décision"
];

export function getDataStatus(){
  return ["vérifiée","fournie","importée","calculée","estimée","hypothèse","à confirmer"];
}
