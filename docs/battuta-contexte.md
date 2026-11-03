# BonSafar : contexte du projet (Meta Global AI Developer Hackathon)

Version 3, mise à jour le 3 novembre 2026 à 17:00 heure de Paris, après le bloc 0. Source de vérité du projet. Sources : mails des organisateurs, FAQ officielle du Discord, recherches et décisions prises avec Claude.

Le projet s'appelait **Battuta** jusqu'au 3 nov. Il s'appelle désormais **BonSafar**. Ce fichier garde son nom `battuta-contexte.md` pour ne pas casser les références.

---

## 1. Le projet

- **Nom : BonSafar.** Domaine **bonsafar.com acheté le 3 nov.** chez Vercel. Les URL restent en minuscules (bonsafar.com), la marque s'écrit BonSafar.
- **L'histoire du nom :** quand un Marocain part en voyage, on lui dit « trik slama », bon voyage. BonSafar, c'est la même chose dite à moitié en français (« bon ») et à moitié en darija (« safar », le voyage, que l'on retrouve aussi en arabe, en turc et en persan). Le nom porte les deux pays du projet : le Maroc d'aujourd'hui et la France de demain. Ibn Battuta, parti de Tanger en 1325, reste l'accroche d'ouverture de la vidéo.
- **Pitch :** l'agence de voyage dans ta poche, qui comprend la darija. Tu expliques ton voyage à voix haute, BonSafar cherche les vrais vols et hôtels, te donne un seul prix en dirhams, vérifie visa, passeport, bagage et argent, puis te remet un dossier de voyage et une affiche souvenir.
- **Constat de départ :** beaucoup de Marocains qui peuvent voyager passent encore par une agence, par peur de se tromper (visa, carte, réservation).
- **Version retenue :** version B « Agence ». Maquettes V1 validées le 3 nov.
- **Participant :** Soufiane, en solo, track Indie Developer.
- **Thème du hackathon visé :** Build for Your World.

## 2. Calendrier

- Building period : du 27 oct. au 4 nov.
- **Deadline de soumission : 4 nov. à 21:00 heure de New York, soit le 5 nov. à 03:00 heure de Paris. Aucun retard accepté.**
- Objectif interne : soumettre le 4 nov. avant 18:00 heure de Paris.
- Jugement : du 5 au 8 nov. Finales et cérémonie : 9 nov. à 18:00 heure de Paris. Vote communautaire : annoncé le 16 nov.
- État au 3 nov. à 17:00 : bloc 0 terminé (voir section 17). Le développement commence avec le bloc 1 dans Cursor.

## 3. Règles officielles (FAQ Discord)

- **Filtre éliminatoire :** coller à un thème ET utiliser vraiment la Meta Model API et/ou les modèles open-weight de Meta.
- **Notation, 4 critères à poids égal :** impact, usage des outils Meta AI, profondeur technique et exécution, qualité de la démo.
- Le jury évalue **la vidéo, le code et le produit en ligne**.
- Soumission : une seule par équipe, avec une vidéo démo de 3 minutes, un dépôt **public** et le nom de chaque contributeur. Il faut vérifier que les liens marchent.
- Toute personne qui participe à la création du projet doit être un participant accepté. Les personnes qui prêtent leur voix aux notes de démo fournissent des données, pas du code ni du design : accord écrit et mention dans le README.
- Si on réutilise un projet existant : un dépôt neuf et une phrase au début de la vidéo. Pour BonSafar, on part de zéro.
- **Projets à éviter :** conseil médical par IA, santé mentale, détection de maladies de peau, RAG basique, simple analyse d'images, chatbot éducatif générique, tri de candidatures, coach nutrition, analyse de personnalité, sport, politique, guerre. BonSafar n'est concerné par aucun.
- Disqualification en cas de violation légale, éthique ou de règles de plateforme, ou d'usage de code, de données ou d'assets sans permission. Pour BonSafar : pas de scraping, données seulement via les MCP officiels Kiwi.com et trivago, icônes et polices sous licence libre, voix enregistrées avec accord écrit.
- Les 5 meilleurs projets de chaque track vont en finale.

## 4. Prix

- **Track Indie :** 150 k$, 100 k$, 75 k$, 50 k$, 25 k$.
- **Bonus visés :**
  - **Best Agentic Use-Case (5 k$)** : Muse Wonder qui planifie et appelle les outils.
  - **Most Viral Project (20 k$)** : poster la démo sur X, puis soumettre le lien du post. L'engagement compte jusqu'au 8 nov. au soir.
- Autres bonus : Best Build on Meta Open Weight Models (10 k$), Community Vote (10 k$), Best Creative Build (5 k$).

## 5. Crédits et facturation

- 150 $ de crédits Meta Model API, à réclamer avant le 4 nov. 21:00 heure de New York (formulaire avec le même e-mail que la candidature et le Team ID).
- Une carte bancaire est obligatoire pour faire des appels API, et l'étape des **informations business** dans Billing doit être remplie.
- **Une alerte Spend Limit n'arrête pas forcément la facturation.** Garde-fou dans l'app : au-delà de 120 $ (`SPEND_LIMIT_USD`), le mode jury passe en replay seul.
- **Ne jamais poster de clé API ni de détails de carte sur Discord, ni dans le dépôt.**

## 6. Aide et canaux

- Canal général du Discord : questions générales, en taguant @CV.
- **#office-hours** : support de l'équipe Meta en semaine, de 16:00 à 17:00 heure de Paris.
- #announcements : mises à jour officielles (mentions et hashtag pour le post X).
- Page de l'événement : https://cerebralvalley.ai/e/meta-ai-developer-hackathon

## 7. Modèles Meta et leur rôle dans BonSafar

Identifiants vérifiés le 3 nov. avec notre clé (`GET /v1/models`). Détails et points à confirmer dans `meta-model-api.md`.

| Modèle | Identifiant | Rôle |
|---|---|---|
| **Muse Voice Transcribe** | `muse-voice-transcribe-1.0` | Note vocale vers texte, en temps réel par WebSocket côté serveur. La darija n'est pas une langue officielle : on oriente vers l'arabe et le français, et Muse Spark retrouve le sens. |
| **Muse Spark** | `muse-spark-1.3` | Compréhension en JSON strict (chips, question unique, traduction anglaise), conditions d'entrée avec recherche web, « Bon à savoir ». Effort de raisonnement au minimum pour la compréhension. Sert aussi de plan B audio. Jamais la variante « contributor ». |
| **Muse Wonder** | `muse-wonder-1.0` | Planification agentique : appelle les outils de données, choisit le forfait, explique pourquoi, trouve le conseil malin. 4 $ par million de tokens en entrée, 20 $ en sortie. |
| **Muse Image** | `muse-image-1.0` | Illustrations des idées et affiche souvenir, sans texte. 0,01 $ par image. |

- La Meta Model API est **compatible avec le format OpenAI** (`https://api.meta.ai/v1`), donc le SDK `openai` suffit, en passant la clé explicitement.
- Pas de voix de sortie dans la V1 : aucun modèle Meta ne fait parler l'agent, et on n'ajoute pas de service externe d'IA.

## 8. Les données réelles

- **Vols :** MCP officiel Kiwi.com (`https://mcp.kiwi.com`), outil `search-flight`, prix en euros uniquement. Couverture vérifiée au départ de Casablanca et Marrakech.
- **Hôtels et tendances :** MCP officiel trivago (`https://mcp.trivago.com/mcp`), prix en dirhams avec le pays MA, tendances de prix par mois.
- Le serveur de BonSafar est le client MCP et expose ces outils à Muse Wonder comme des fonctions.
- **Garde-fou prix :** les modèles ne manipulent que des identifiants d'offres. Le code range les prix dans un store côté serveur, convertit les euros en dirhams au taux de référence Bank Al-Maghrib (saisi à la main) et calcule totaux et écarts. Tout montant dans un texte de modèle est rejeté.
- **Taux de référence :** 1 € = 11,0044 DH au 2 nov. 2026 (dernier publié le 3 nov. à 17:00). Les maquettes utilisaient 10,80 à titre indicatif.
- **Données de démo capturées le 3 nov.** (Casablanca vers Istanbul, 2 adultes, du mar. 15 au mar. 22 déc. 2026, au taux indicatif 10,80) :
  - recommandé 708 € : AT972 09:15 CMN, escale à Madrid, PC1102, arrivée SAW 21:10 ; retour PC651 ;
  - direct Turkish 875 € : TK618 15:45, arrivée IST 23:25 ;
  - le moins cher 673 €, 2 escales ;
  - hôtel Hampton by Hilton Istanbul Şişli, 9,3 sur 1 086 avis, 6 439 DH les 7 nuits avec petit déjeuner, non remboursable ;
  - totaux 14 085 DH (recommandé), 15 889 DH (direct), 13 707 DH (le moins cher) ; conseil malin « +167 € ≈ 1 804 DH pour 4 h 15 de moins ».
  - Ces chiffres sont à recapturer le 4 nov. au taux du jour pour le replay et la vidéo.
- **Visa Turquie pour les Marocains :** pas de visa pour du tourisme jusqu'à 90 jours ; passeport valide 150 jours après l'arrivée selon DémarchesMaroc (6 mois selon EntryBrief). Muse Spark revérifie en direct sur la source officielle.
- **Chiffre d'impact :** 619,827 demandes de visa Schengen au Maroc en 2025, 19,2 % de refus, 5e pays au monde (Commission européenne, données publiées le 28 mai 2026).

## 9. Stack retenue

| Brique | Rôle |
|---|---|
| Next.js 16 (App Router, `src/`, Turbopack, `proxy.ts`), React 19.2, TypeScript, Tailwind v4, shadcn/ui | Application web, mobile d'abord |
| Motion (`motion/react`) | Animations A1 à A9 |
| Phosphor Icons (MIT) | Icônes, poids fill et bold |
| Geist, Geist Mono, IBM Plex Sans Arabic (OFL) | Typographies |
| `openai` (SDK) | Client de la Meta Model API |
| `ws` | WebSocket serveur vers Muse Voice Transcribe |
| `@modelcontextprotocol/sdk` | Client MCP vers Kiwi.com et trivago |
| Supabase (`@supabase/ssr`, clés publishable et secret) | Base de données (profils, voyages, compteur de dépense), connexion Google, stockage des affiches |
| Vercel | Hébergement et domaine bonsafar.com |
| GitHub (`soufianeomari1/bonsafar`, public, licence MIT) | Dépôt |
| Cursor | Outil de développement de Soufiane |

## 10. À qui on parle (à vérifier à chaque étape)

| Public | Langue de l'interface | Langue de l'agent |
|---|---|---|
| Voyageur marocain | Celle de son profil (français par défaut, darija, العربية, English) | Darija en lettres latines ou arabes, ou la langue du profil |
| **Jury (anglophone)** | **Anglais partout** : mode jury, desktop, panneau Under the hood, vidéo, README, code | Darija visible avec la **traduction anglaise juste en dessous** |
| Communauté X | Anglais | Darija sous-titrée en anglais |
| Marché français (après) | Français | Français |

Détails dans `parcours-et-interfaces.md`, section 0.

## 11. Le parcours V1

0. Bienvenue et connexion (Google ou sans compte, pastille Mode jury).
1. Profil en 4 étapes, 30 secondes : langue ; ville de départ et avec qui ; papiers (passeport, visa Schengen, passeport valide plus de 6 mois, carte internationale) ; style et préférences. Puis la carte de confiance.
2. Accueil avec le radar vocal et des idées filtrées par le profil.
3. Note vocale façon WhatsApp.
4. « BonSafar a compris » : les mots deviennent des chips, au plus une question, jamais sur ce que le profil sait.
5. Plan de vol de l'agent : l'avion descend d'étape en étape.
6. Résultat : la carte qui vole, 3 options.
7. Fiche forfait façon Flighty : un prix, avant de partir, pourquoi, conseil malin.
8. Prêt à partir : Visa, Passeport, Bagage, Argent.
9. Vérifie et continue, puis paiement chez le partenaire.
10. Dossier avec la carte d'embarquement imprimée et le tampon, puis l'affiche Muse Image.

Le profil personnalise : la question de départ, la vérification visa, les idées sans visa, les passagers, le niveau d'hôtel, la devise. Stocké dans Supabase (ou sur le téléphone sans compte). On ne stocke jamais l'audio.

## 12. Le mode jury (ce qui fera gagner)

- `bonsafar.com/?jury=1`, en anglais, sans connexion, persona Fatima (52 ans, Casablanca, passeport marocain, pas de visa Schengen, avec son mari, style Confort).
- 3 vraies notes vocales en darija avec traduction anglaise : Istanbul (pas de visa), Paris (Schengen nécessaire, le profil change la réponse), la mer sans détails (une seule question). Plus « Record your own ».
- Panneau Under the hood en direct : modèle, latence et coût de chaque étape.
- Replay honnête si l'API dépasse 20 s, badge visible ; garde-fou de dépense à 120 $.
- Détails, script de la vidéo, post X et modèle de README dans `demo-et-mode-jury.md`.

## 13. Plan de dev

5 blocs Cursor : fondations ; connexion, profil, voix et compréhension ; agent et vraies données ; prêt à partir, dossier et affiche ; mode jury et démo. Détails dans `plan-de-dev.md`, prompts dans `prompts/`.

## 14. Livrables du 4 nov.

- **README en anglais** (modèle prêt) : problème, démo, modèles Meta et leur rôle, garde-fou prix, services externes déclarés, confidentialité, lancement en local, thème.
- **Vidéo de 3 minutes en anglais**, darija sous-titrée (script prêt).
- **Vérification finale :** dépôt public sans clé, lien testé en navigation privée, vidéo ouverte à tous, thème cité, contributeur renseigné.
- **Post sur X** avec l'extrait de 45 s, lien soumis sur la plateforme.

## 15. Après le hackathon

- **France :** même produit en français pour un marché que Soufiane connaît très bien, sur bonsafar.com.
- Intégration WhatsApp, réservation directe avec les partenaires, offres type « Voyage Pirates » à l'ère de l'IA.

## 16. Les documents du projet

| Document | Contenu |
|---|---|
| `battuta-contexte.md` | Ce fichier, la source de vérité |
| `meta-model-api.md` | Faits vérifiés sur la Meta Model API |
| `parcours-et-interfaces.md` | Publics et langues, tokens, animations, haptique, chaque écran |
| `plan-de-dev.md` | Les 5 blocs, planning, coupes |
| `demo-et-mode-jury.md` | Parcours du jury, scénarios, robustesse, vidéo, post X, README |
| `prompts/bloc-1.md` à `bloc-5.md` | Les prompts Cursor de chaque bloc |
| `design/maquettes/` | Les 16 maquettes (PNG et HTML) |

## 17. Journal des décisions du 3 nov. (bloc 0)

- **Domaine** bonsafar.com acheté chez Vercel, à rattacher au projet Vercel après le premier déploiement.
- **Dépôt** public https://github.com/soufianeomari1/bonsafar, licence MIT, `.gitignore` Node.
- **Supabase** : projet `zilxslwiwuqivcyplnat` (région Europe), URL `https://zilxslwiwuqivcyplnat.supabase.co`. Clés au nouveau format : `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` et `SUPABASE_SECRET_KEY`.
- **Google OAuth** : projet Google Cloud `bonsafar`, app **en production** (pas de logo, scopes de base), redirection `https://zilxslwiwuqivcyplnat.supabase.co/auth/v1/callback`. Fournisseur Google activé dans Supabase, Site URL `https://bonsafar.com`, redirections autorisées pour localhost:3000, bonsafar.com et www.bonsafar.com. L'URL Vercel sera ajoutée après le premier déploiement.
- **Meta Model API** : clé testée, appel réel réussi sur `muse-spark-1.3`. Identifiants des modèles en section 7.
- **Transcription** : Muse Voice Transcribe est en temps réel uniquement (WebSocket). On transcrit côté serveur et on renvoie les mots au fil de l'eau : c'est aussi un plus pour la démo.
- **Taux** : 11,0044 au 2 nov. 2026.
- **Office hours** : pas de question posée, on avance avec les consignes connues.
- **Stack** : Next.js 16 (`proxy.ts` à la place de `middleware.ts`), règles Cursor dans `.cursor/rules/` et `AGENTS.md`, en anglais car le dépôt est public et lu par le jury.
