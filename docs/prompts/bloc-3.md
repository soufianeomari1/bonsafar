# Bloc 3 · L'agent et les vraies données (environ 3 h 30, le cœur)

**Mode Cursor :** Agent, nouvelle conversation. Si ton Cursor propose un mode Plan, utilise-le pour ce bloc : la conception compte plus que la vitesse.
**À joindre (glisser les PNG) :** `design/maquettes/png/05-Agent.png`, `06-Resultat.png`, `07-Forfait.png`, `J2-Desktop.png`.
**But :** de « Yallah, qelleb ! » jusqu'à la fiche forfait, avec de vrais vols, de vrais hôtels, un vrai prix, et le panneau Under the hood qui se remplit en direct.

## Prompt à coller

```
Lis AGENTS.md, .cursor/rules/ (surtout 30-meta-ai-agent-prices.mdc), docs/meta-model-api.md, docs/parcours-et-interfaces.md (écrans 5 à 7 et J2) et docs/battuta-contexte.md section 8.
Les PNG joints sont les écrans à reproduire, le HTML de chaque planche donne les valeurs exactes.
Fais d'abord un plan (architecture de l'agent, fichiers, ordre), puis exécute-le.

1. src/lib/mcp/
   Clients MCP (StreamableHTTPClientTransport du SDK @modelcontextprotocol/sdk) vers KIWI_MCP_URL et TRIVAGO_MCP_URL, connexion paresseuse et réutilisée. Appelle listTools et écris le résultat dans docs/mcp-tools.json (je veux le voir). Ne devine aucun nom ni schéma.
   Outils vus le 3 nov. : search-flight (Kiwi), trivago-accommodation-radius-search, trivago-accommodation-search, trivago-destination-price-trends.
   Wrappers typés : searchFlights, searchHotels (radius search autour des coordonnées de la ville), priceTrends. trivago : pays MA, devise MAD, langue selon le profil.

2. src/lib/prices/
   store.ts : chaque offre normalisée en { id (F1, H1...), kind, price, currency, source, fetched_at, deeplink, attrs }. Kiwi renvoie des euros : conversion en dirhams par le code avec EUR_MAD_RATE, on garde les deux montants et la date du taux.
   totals.ts : totaux par forfait (vols x passagers selon ce que renvoie Kiwi, plus hôtel), écarts entre options (ex. « +X € ≈ Y DH pour 4 h 15 de moins »), tout en code.
   guardrail.ts : rejette tout texte de modèle qui contient un montant d'argent, et journalise un événement « price guardrail » (passed ou blocked).

3. POST /api/agent en SSE (runtime nodejs, maxDuration 60)
   5 étapes visibles : vols, hôtels, prix du mois, visa et papiers, forfait. Chaque étape émet start, progress (ex. les 3 premières lignes de vols) et done.
   Muse Wonder (MODEL_WONDER) pilote par function calling avec 4 outils : search_flights, search_hotels, price_trends, check_entry_requirements. Les outils renvoient des identifiants d'offres et des attributs, pas des montants à recopier.
   Pour la vitesse : lance vols, hôtels et prix du mois en parallèle dès que l'intention est connue, et laisse Wonder décider à partir des résultats (on vise moins de 25 s au total).
   check_entry_requirements : Muse Spark avec la recherche web (vérifie dans la doc comment l'activer) et le passeport du profil. Retourne { visa_needed, max_stay_days, passport_validity_days, notes_bilingual, sources[{ title, url, date }] }. Pour Fatima (passeport marocain, pas de Schengen) : Turquie sans visa, France avec visa Schengen.
   Sortie finale de Wonder en JSON strict validé par zod, sans aucun prix : { recommended { flight_id, hotel_id }, alternatives [{ label: "direct" | "cheapest", flight_id, hotel_id }], why[3] (bilingue darija et en), smart_tip { kind, compare_flight_id }, rejected[] }. Le validateur passe sur tous les textes.
   Si le visa est nécessaire (cas Paris) : l'agent le dit d'abord, résume quoi préparer avec la source, puis propose une destination sans visa avec de vrais prix.

4. Journal et panneau
   Chaque appel de modèle et chaque appel d'outil écrit un événement dans le journal du run (src/lib/ai/events.ts, déjà en place). Le panneau Under the hood (JuryFrame, planche J2) lit ces événements : 3 compteurs en SplitFlap (temps écoulé, coût IA, nombre d'appels de modèles), barre empilée par modèle (Voice Transcribe vert, Spark bleu, Wonder violet, outils de données jaune), journal horodaté (heure, étape, modèle ou outil, latence, coût), ligne « Price guardrail ». Tout est mesuré, rien n'est estimé.

5. Écrans
   Écran 5 Plan de vol : PlaneRoute (A3) piloté par les événements SSE, lignes de vols qui arrivent en direct, libellés darija et français (anglais et darija en mode jury), vibration tick à chaque escale, success à l'atterrissage. Bouton « Skip » discret.
   Écran 6 Résultat : carte stylisée avec l'arc et l'avion (A5), 3 options (recommandée, directe, la moins chère), passage en fiche par layoutId (A6).
   Écran 7 Fiche forfait : gabarit de la planche 07, 4 tuiles Avant de partir, pourquoi ce choix, conseil malin avec halo, barres de prix par mois, ce que j'ai écarté, prix total en SplitFlap (A4), bouton « Ana mwafeq · Je valide » avec l'avion qui décolle (A7). Chaque montant affiché vient du store et montre sa source au toucher.

6. Runs enregistrés
   Chaque run réussi est enregistré en JSON (intention, événements, offres, prix, heure de capture) dans data/runs/ en local et dans une table ou un bucket Supabase en production (choisis le plus simple et dis-moi lequel). Ils serviront au replay du bloc 5.

7. Page /dev/agent : lancer l'agent sur une intention JSON collée à la main, voir le flux SSE brut, le store de prix et le panneau.

8. Vérification : npm run lint et npm run build, puis fichiers et tests à la main, en français.
```

## Fini quand

- Le scénario Istanbul renvoie de vraies offres Kiwi.com et trivago, en moins de 25 s.
- Chaque total affiché est égal à la somme des prix du store, convertie au taux saisi.
- Les 3 options s'affichent, le conseil malin compare vraiment le direct et le recommandé.
- Le panneau montre de vraies latences et de vrais coûts.
- Le scénario Paris renvoie « visa nécessaire » pour Fatima et propose une destination sans visa.

## Plan de repli

Si un MCP ne répond pas depuis Vercel : charger le dernier run enregistré pour ce trajet, avec le badge « replay » et l'heure de capture affichés.

## Après le bloc

`/fin-de-bloc`, commit, `git push`, puis tester https://bonsafar.com/dev/agent
