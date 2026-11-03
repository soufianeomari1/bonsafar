# Bloc 4 · Prêt à partir, validation, dossier et affiche (environ 2 h 30)

**Mode Cursor :** Agent, nouvelle conversation.
**À joindre (glisser les PNG) :** `design/maquettes/png/08-Checklist.png`, `09-Valider.png`, `10-Dossier.png`, `10b-Rihla.png`.
**But :** finir le parcours de bout en bout : la checklist, la validation, le dossier imprimé et l'affiche à partager.

## Prompt à coller

```
Lis AGENTS.md, .cursor/rules/, docs/parcours-et-interfaces.md (écrans 8 à 10 bis) et docs/meta-model-api.md (Muse Image).
Les PNG joints sont les écrans à reproduire, le HTML de chaque planche donne les valeurs exactes.
Commence par un plan court, puis exécute-le.

1. Écran 8 Prêt à partir
   4 tuiles calculées par le code : Visa et Passeport depuis check_entry_requirements et le profil ; Bagage depuis les attributs de l'offre de vol (bagage cabine seul ou soute) ; Argent = part de DOTATION_MAD utilisée par personne, calculée avec le total du store.
   « Bon à savoir » généré par Muse Spark (décalage horaire, prises, monnaie, météo du mois), bilingue, sans aucun prix (passe par le guardrail).
   Ligne de sources avec leur date. Statuts en SplitFlap (A4), une vibration tick par tuile.
   C'est ici qu'on lance la génération de l'affiche en arrière-plan (point 4).

2. Écran 9 Vérifie w kemmel
   Récap avec vignette, Dates, Voyageurs, Prix total avec « Détail » (lignes du store, source et heure) et « Modifier » qui ramène aux chips de l'écran 4. Conditions d'annulation de l'offre. Ligne bouclier « BonSafar ne voit jamais ta carte bancaire ».
   Puis feuille « Tu vas payer chez Kiwi.com et sur le site de l'hôtel » avec les liens partenaires (deeplink du store), ouverts dans un nouvel onglet. Aucun paiement dans l'app.

3. Écran 10 Dossier
   Carte d'embarquement imprimée (A8) avec QR marqué « démo », tampon rouge et vert, liste du dossier (retour, hôtel, prêt à partir). Sauvegarde dans la table trips (prix figés avec source et heure).
   Sans compte : bouton « Garde ce voyage avec Google », qui migre le voyage après la connexion.

4. Écran 10 bis Affiche
   Muse Image (MODEL_IMAGE) : illustration sans aucun texte de la destination à l'heure dorée, format vertical. Vérifie dans la doc l'endpoint et le format de sortie. Stockage dans le bucket Supabase « posters ».
   Les étiquettes (« BSLAMA CASA », « NEXT : ISTANBUL »), la carte d'embarquement inclinée, « رحلة » et « MADE WITH BONSAFAR » sont posées par-dessus en HTML, puis export en image 9:16 (html-to-image ou équivalent sous licence MIT).
   Partage via Web Share API, repli téléchargement. Skeleton 9:16 avec nuages pendant la génération.

5. Vérification : npm run lint et npm run build, puis fichiers et tests à la main, en français.
```

## Fini quand

- Le parcours complet, de la voix jusqu'à l'affiche, marche sur https://bonsafar.com depuis ton Android.
- Le voyage se retrouve après déconnexion puis reconnexion.

## Plan de repli

Si Muse Image est trop lente : une illustration générée à l'avance par Muse Image pour Istanbul, stockée dans `public/posters/`, et marquée « pre-generated with Muse Image ».

## Après le bloc

`/fin-de-bloc`, commit, `git push`.
