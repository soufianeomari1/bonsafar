# BonSafar : parcours complet et interfaces (v3, 3 nov. 2026)

Document de référence pour les prompts Cursor. Il remplace « Battuta, parcours et interfaces » (v2).

Ce qui change en v3 :
- le nom : **BonSafar** (ancien nom de travail : Battuta), « bon voyage » en français et en darija, dans l'esprit de « trik slama » ;
- une matrice « à qui on parle » qui fixe la langue de chaque écran ;
- la connexion et le profil en 4 questions ;
- le mode jury et le desktop entièrement en anglais ;
- la numérotation des écrans, alignée sur les maquettes.

Maquettes : 16 planches dans `design/maquettes/png` (rendu) et `design/maquettes/html` (valeurs exactes).

Sources des données affichées :
- Recherches réelles Kiwi.com et trivago du 3 nov. : Casablanca vers Istanbul, 2 adultes, du 15 au 22 déc. 2026.
- Conditions d'entrée en Turquie pour les Marocains : EntryBrief (revu le 2 août 2026) et DémarchesMaroc (mis à jour le 6 sept. 2024). Elles sont à confirmer en direct par Muse sur la source officielle.
- Visas Schengen au Maroc en 2025 : données de la Commission européenne publiées le 28 mai 2026.

---

## 0. À qui on parle (à relire avant chaque écran)

| Public | Où il nous voit | Langue de l'interface | Langue de l'agent | Ce qu'il doit ressentir |
|---|---|---|---|---|
| **Voyageur marocain** (utilisateur final) | App mobile, bonsafar.com | Celle choisie à l'étape 1 du profil (français par défaut, darija, العربية, English) | Darija en lettres latines ou arabes selon le profil, ou la langue du profil | « Je parle comme d'habitude, on s'occupe de tout, le prix est vrai. » |
| **Jury** (anglophone) | `bonsafar.com/?jury=1` sur desktop, vidéo, GitHub | **Anglais partout** (boutons, titres, panneau Under the hood) | La darija reste visible car c'est la preuve, avec **la traduction anglaise juste en dessous** | « Ça marche vraiment, en live, sur les modèles Meta, et c'est utile. » |
| **Communauté X** (prix Most Viral) | Post X, extrait de 45 s, affiche | Anglais avec sous-titres | Darija sous-titrée en anglais | « Je veux le partager. » |
| **README et code** | GitHub | Anglais | Sans objet | « C'est propre, honnête et réutilisable. » |
| **Marché français** (après le hackathon) | bonsafar.com | Français | Français | « L'agence de voyage dans ma poche. » |

Règles qui en découlent :
1. Aucune chaîne en dur : tout passe par `i18n` (fichiers `en`, `fr`, `darija-latn`, `darija-arab`, `ar`).
2. En mode jury, chaque message de l'agent est produit en double par Muse Spark : `{ "darija": "...", "en": "..." }`.
3. Les maquettes mobiles sont en français et en darija (public final). Les planches Jury et Desktop sont en anglais (public jury).

---

## 1. Les principes

| # | Principe | Vient de | Traduction BonSafar |
|---|---|---|---|
| 1 | Clair, calme, une info dominante par bloc | Flighty | Fond gris très clair, cartes blanches, horaires énormes en vert, badges jaunes. |
| 2 | La carte en haut, une feuille blanche en bas | Flighty | Résultat et fiche : carte du trajet en fond, feuille arrondie qui monte. |
| 3 | Le geste vocal connu de tous | WhatsApp | Appui long, glisser pour annuler, glisser vers le haut pour verrouiller. |
| 4 | Ce qu'il te faut, avant tout le reste | Flighty (statut aéroport), Airbnb (« À savoir ») | 4 tuiles : Visa, Passeport, Bagage, Argent, avec un mot de statut en couleur. |
| 5 | Une seule carte « IA » par écran porte un halo | Flighty (retard prédit) | Le conseil malin, et rien d'autre. |
| 6 | Le prix final dès le départ, vérifier avant de payer | Airbnb | Un prix total en dirhams, récap avec « Modifier », paiement chez le partenaire. |
| 7 | Les animations racontent le voyage | Proposition BonSafar | L'avion qui parcourt les étapes, le tableau des départs, la carte d'embarquement imprimée. |
| 8 | On ne redemande jamais ce que le profil sait déjà | Proposition BonSafar | Ville de départ, voyageurs, papiers et style pré-remplissent les chips. |

---

## 2. Design tokens

### Couleurs

| Token | Nom dans le code | Valeur | Usage |
|---|---|---|---|
| `fond` | `bg` | `#F2F2F7` | Fond des écrans, derrière les cartes |
| `carte` | `card` | `#FFFFFF` | Cartes et feuilles |
| `encre` | `ink` | `#0B0B0F` | Texte principal, boutons principaux (fond noir, texte blanc) |
| `gris` | `muted` | `#6B6B76` | Texte secondaire, libellés en petites capitales |
| `ligne` | `line` | `#E5E5EA` | Séparateurs, bordures |
| `remplissage` | `fill` | `#EFEFF4` | Pastilles, boutons secondaires |
| `vert` | `green` | `#15803D` | Horaires, statut « ok », texte sur blanc |
| `vert-vif` | `green-bright` | `#22C55E` | Points d'état, coches pleines, interrupteurs actifs |
| `vert-doux` | `green-soft` | `#E8F7EE` | Fond des tuiles « ok » |
| `jaune` | `yellow` | `#FFC800` | Badges façon porte d'embarquement, texte noir dessus |
| `orange` | `orange` / `orange-soft` | `#B45309` / fond `#FFF4E0` | Statut « à faire » |
| `rouge` | `red` / `red-soft` | `#DC2626` / fond `#FEECEC` | Blocage réel uniquement |
| `bleu` | `blue` / `blue-soft` | `#0A6CFF` / fond `#EAF2FF` | Liens, trajet, avion, étape en cours, bouton Partager |
| `violet` | `violet` | `#A855F7` | Muse Wonder dans le panneau Under the hood |
| `mer` / `terre` | `sea` / `land` | `#D4E8F6` / `#EEF1E6` | Carte stylisée |
| `ciel` | `sky` | dégradé `#DCEBFF` vers blanc | En-tête de l'accueil, de la connexion et du mode jury |

Touche marocaine, une seule : le tampon du dossier, rouge `#C1272D` (`stamp-red`) avec l'étoile verte `#006233` (`stamp-green`).

### Typographies (licence SIL OFL)

- **Geist** pour toute l'interface. Titres 26 à 36 px en gras, corps 17 px, libellés 12 px en petites capitales espacées et gris.
- **Gros chiffres** : horaires et prix en Geist 700, 36 à 44 px, `tabular-nums`.
- **Geist Mono** : carte d'embarquement, badges de statut, panneau Under the hood.
- **IBM Plex Sans Arabic** : tout texte arabe, interligne 1,6.

### Icônes : Phosphor Icons (licence MIT)

- Paquet `@phosphor-icons/react`.
- Poids « fill » pour les objets et statuts, dans un cercle teinté de 36 à 48 px, comme les icônes colorées de Flighty et d'Airbnb.
- Poids « bold » pour l'interface (retour, fermer, partager).
- Icônes utilisées : Airplane, AirplaneTilt, AirplaneTakeoff, AirplaneLanding, Microphone, Play, Pause, Trash, PaperPlaneRight, LockSimple, MapPin, CalendarBlank, Users, Wallet, Coffee, Bed, SuitcaseRolling, IdentificationCard, IdentificationBadge, CheckCircle, SealCheck, WarningCircle, Info, ShieldCheck, CreditCard, Sparkle, Clock, Star, CloudSun, CurrencyCircleDollar, Ticket, Translate, Plug, Stamp, GoogleLogo, UserCircle, X, CaretLeft, Export.

### Formes

- Rayons : 32 px pour les feuilles, 22 px pour les cartes, 14 à 16 px pour les boutons, 999 px pour les pastilles.
- Cibles tactiles de 44 px minimum, boutons principaux de 56 px.
- Ombres très douces : `0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.06)`.

---

## 3. Le mouvement

| Usage | Valeur Motion |
|---|---|
| Courbe par défaut | `ease: [0.23, 1, 0.32, 1]` |
| Spring par défaut | `{ type: "spring", duration: 0.5, bounce: 0.15 }` |
| Feuilles et tiroirs | 500 ms, `ease: [0.32, 0.72, 0, 1]` |
| Entrée d'un élément | `opacity 0 → 1`, `y 8 → 0`, `scale 0.96 → 1` |
| Cascade | 50 à 60 ms |
| Appui sur un bouton | `scale 0.97` en 100 ms, relâche en 200 ms |
| `prefers-reduced-motion` | fondus de 200 ms seulement |

### Les 9 animations signature

| # | Nom | Où | Ce qui se passe | Comment le faire |
|---|---|---|---|---|
| A1 | **Radar vocal** | Accueil, vocal | Pas d'orbe. Autour du micro, des cercles s'échappent comme un radar de tour de contrôle, plus forts quand la voix monte, avec un balayage lent. | 3 cercles en `scale 1 → 2.2` et `opacity .5 → 0`, cadence pilotée par le volume (`AnalyserNode`), un secteur conique qui tourne en 3 s. |
| A2 | **Les mots deviennent des chips** | BonSafar a compris | Dans la transcription, les mots clés se surlignent en bleu, se détachent de la phrase et volent se ranger dans les chips. | Chaque mot clé est un `motion.span` avec un `layoutId` partagé avec sa chip ; surlignage par `background-size` de 0 à 100 %. |
| A3 | **Le plan de vol de l'agent** | L'agent au travail | Les 5 étapes sont les escales d'une route verticale. Un avion moderne descend d'escale en escale, la traînée derrière lui devient bleue, chaque escale « atterrit » en vert avec une coche et une vibration. | Avion en `position: absolute` animé en `y` (spring 0.6 / 0.2) vers l'escale active ; trait bleu dont la hauteur suit l'avion ; à l'arrivée : coche dessinée (`pathLength`) et vibration `tick`. |
| A4 | **Le tableau des départs** | Prix, compteurs, statuts | Les chiffres et les mots de statut tournent comme les palettes d'un tableau d'aéroport avant de s'arrêter sur la bonne valeur. | Chaque caractère dans une tuile, `rotateX 90 → 0` avec 30 ms de décalage ; 2 ou 3 caractères intermédiaires au hasard. Une seule vibration `tick` à la fin. |
| A5 | **La carte qui vole** | Résultat | L'arc Casablanca vers Istanbul se dessine, l'avion suit l'arc, la carte zoome sur Istanbul à l'arrivée. | `pathLength` sur l'arc ; avion en CSS `offset-path` + `offset-distance 0 → 100 %` en 1,6 s, `offset-anchor: center` ; zoom `scale 1 → 2` à la fin. |
| A6 | **La carte devient fiche** | Résultat vers fiche | La carte du forfait s'agrandit en fiche plein écran pendant que la carte du fond zoome (vidéo Flighty). | `layoutId` sur le conteneur, le titre et le prix. |
| A7 | **Le décollage** | « Je valide » | L'icône avion du bouton décolle en diagonale et sort du bouton, qui se transforme en feuille de confirmation. | Avion : `x 0 → 40`, `y 0 → -30`, `rotate -20`, `opacity → 0` en 450 ms ; bouton : `layoutId` vers la feuille. |
| A8 | **La carte d'embarquement imprimée** | Dossier | La carte sort d'une fente comme à une borne d'aéroport, avec un léger tremblement, puis le tampon marocain tombe dessus. | Carte : `y -100 % → 0` en 900 ms par à-coups (4 paliers) ; tampon : `scale 1.4 → 1`, `rotate -20 → -12`, spring 0.4 / 0.4, anneau d'encre qui s'étale ; vibration `success`. |
| A9 | **Les nuages** | Chargements, connexion, mode jury | Pendant une attente, de petits nuages blancs défilent lentement en parallaxe derrière l'en-tête. | 3 nuages SVG, `x` en boucle de 20 à 60 s selon la profondeur. |

Les animations A3, A4 et A8 sont les trois moments à mettre en avant dans la vidéo.

---

## 4. L'haptique

Android Chrome supporte `navigator.vibrate`. Sur iPhone, astuce à tester : l'interrupteur natif `<input type="checkbox" switch>` d'iOS 18 vibre au basculement. Pour la vidéo, chaque vibration a un jumeau visuel : un anneau de 24 px qui pulse 200 ms.

| Nom | Motif | Moments |
|---|---|---|
| `tap` | `8` | appui bouton ou chip, vocal envoyé, carte retournée |
| `select` | `12` | réponse à la question, choix dans le profil, « Prendre le direct » |
| `start` | `20` | appui sur le micro |
| `lock` | `[10, 40, 10]` | vocal verrouillé |
| `cancel` | `[25, 50, 25]` | vocal annulé |
| `tick` | `6` | chaque escale de l'avion, chaque tuile « ok », fin d'un tableau des départs |
| `success` | `[15, 70, 30]` | atterrissage du forfait, tampon posé, profil terminé |
| `warn` | `[40, 60, 40]` | micro refusé, échec réseau |

Jamais plus d'une vibration par seconde hors du plan de vol, désactivable dans le profil.

---

## 5. Connexion et profil

### Objectif
Savoir à qui on parle en **30 secondes**, sans formulaire. Chaque question sert à quelque chose de visible dans le voyage. Tout est modifiable plus tard dans « Ton profil ».

### 0 · Bienvenue et connexion (planche 00-Connexion)
- Sélecteur de langue en haut (FR, Darija, عربي, EN) et pastille « Mode jury ».
- Logo avion noir, « BonSafar » suivi de « trik slama » en gris italique, titre « L'agence de voyage dans ta poche. »
- 3 promesses avec icônes : parle en darija, en français ou en arabe ; vols et hôtels en direct, un seul prix en dirhams ; visa, bagage et argent vérifiés avant de partir.
- Bouton blanc bordé « Continuer avec Google » (Supabase Auth, prénom pré-rempli).
- Lien souligné « Continuer sans compte » : le profil reste sur le téléphone. On propose de l'enregistrer avec Google au moment du dossier.
- Ligne grise : « Ensuite, 4 questions en 30 secondes pour adapter tes voyages. »

### 1 · Profil en 4 étapes (planches 01a-Onboarding et 01b-Profil)
Une question par écran, bouton noir « Suivant », lien « Passer », barre de progression en 4 segments, vibration `select` à chaque choix.

| Étape | Question | Choix | À quoi ça sert |
|---|---|---|---|
| 1 | Langue (« Tu préfères qu'on parle en... ») | Darija (lettres latines ou arabes), Français, العربية, English | Langue de l'interface et de l'agent |
| 2 | D'où tu pars, et avec qui ? | Aéroport habituel : CMN, RAK, RBA, TNG, FEZ, AGA, OUD. Voyageurs : Solo, À deux, Famille (nombre d'enfants), Amis | Origine Kiwi pré-remplie, nombre de passagers et de chambres, question de départ jamais posée |
| 3 | Tes papiers (planche Profil) | Passeport : Marocain, Français, Les deux, Autre. Interrupteurs : visa Schengen valide, passeport valide plus de 6 mois, carte bancaire internationale | Vérification visa personnalisée, idées sans visa en premier, alerte paiement |
| 4 | Ton style | Petit budget, Confort, Premium. Options : vols directs seulement, petit déjeuner inclus, halal à proximité, accessibilité, vibrations | Filtre hôtels (3, 4 ou 5 étoiles), escales tolérées, préférences de l'hôtel |

Puis la **carte de confiance** (planche 01c-Confiance, écran 1 ter) : « Le vrai prix, tout de suite. », 3 lignes (vols et hôtels en direct, un seul prix tout compris, tu paies chez le partenaire), bouton noir « Mfhoum · J'ai compris », vibration `success`.

### Ce que le profil change dans le voyage
- **Ville de départ** : la question « Mnin ghadi tkhrjo ? » disparaît. La maquette Compris montre le cas sans profil.
- **Passeport et Schengen** : la tuile Visa et le cas Paris (« il te faut un visa Schengen, voici quoi préparer, et voici 2 destinations sans visa »).
- **Voyageurs** : passagers adultes et enfants pour Kiwi, chambres pour trivago.
- **Style** : nombre d'étoiles, 0 ou 1 escale tolérée.
- **Passeport marocain** : prix en dirhams et dotation touristique. **Passeport français** : prix en euros.
- **Idées de l'accueil** : filtrées sur les pays accessibles avec les papiers déclarés.

### Données (Supabase)
- Table `profiles` : `id` (= utilisateur auth), `first_name`, `ui_lang`, `darija_script`, `home_airport`, `companions`, `children_count`, `passport_country`, `has_schengen`, `passport_6m`, `intl_card`, `travel_style`, `prefs` (jsonb), `haptics`, `created_at`.
- Table `trips` : `id`, `user_id`, `transcript`, `intent` (jsonb), `package` (jsonb : identifiants d'offres, prix figés avec source et heure), `status`, `poster_url`, `created_at`.
- Table `usage` : `id`, `created_at`, `run_id`, `ip_hash`, `step`, `model`, `tokens_in`, `tokens_out`, `cost_usd` (compteur de dépense et limite par IP, écrite uniquement par le serveur).
- On ne stocke **jamais l'audio**, seulement la transcription. Les affiches vont dans le bucket Storage `posters`.
- Règles RLS : chacun lit et écrit uniquement ses lignes.
- Sans compte : même objet en `localStorage`, migré à la connexion.

---

## 6. Les écrans du voyage

Persona de démo : Fatima, 52 ans, Casablanca, passeport marocain, pas de visa Schengen, part avec son mari, style Confort. Taux indicatif des maquettes : 1 € = 10,80 DH. Dans l'app, on utilise le taux de référence Bank Al-Maghrib saisi dans `EUR_MAD_RATE` (11,0044 au 2 nov. 2026), avec sa date affichée.

### 2 · Accueil (planche 02-Main)
- En-tête : « BonSafar » en gras, « بون سفر » en gris, pastille « Mode jury ».
- Titre 32 px gras : « Salam ! Fin bghiti tsafer ? », sous-titre gris.
- Au centre, le **radar vocal** (A1) autour d'un bouton micro noir de 84 px ; « Brek w hder · Appuie et parle ».
- 3 cartes d'idées façon Airbnb (image Muse Image, titre, sous-titre « Sans visa · 4 h 40 de vol »), filtrées par le profil.
- Champ « ou écris ici » en bas.

### 3 · Vocal (planche 03-Vocal)
Radar vocal en grand, onde noire qui se dessine, barre du bas façon WhatsApp verrouillé : poubelle rouge, Pause, envoyer noir. Vibrations `start`, `lock`, `cancel`.

### 4 · BonSafar a compris (planche 04-Compris)
Bulle de l'utilisateur bleue (texte blanc) avec lecteur et transcription ; mots clés soulignés qui partent en chips (A2) ; traduction anglaise sous la bulle en mode jury. Chips blanches avec icône colorée : MapPin Istanbul, CalendarBlank 15 au 22 déc., Users 2 adultes, Wallet 15 000 DH, Coffee petit déjeuner. **Une seule question**, uniquement si une info indispensable manque (sur une carte avec badge jaune « 1 QUESTION » et des réponses rapides). Bouton noir « Yallah, qelleb ! ».

### 5 · L'agent au travail (planche 05-Agent, plan de vol, A3)
Feuille blanche, route verticale avec 5 escales :
1. Kanqelleb 3la tiyarat · Je cherche les vols · TERMINÉ · 15 vols
2. Kanqarn l'otelat · Je compare les hôtels · EN COURS
3. Kanchouf l'as3ar · Je regarde les prix du mois
4. Kanverifi l'wraq · Je vérifie visa et papiers
5. Kanwjjed lik l'forfait · Je prépare ton forfait

Statuts en badges façon tableau des départs (vert TERMINÉ, bleu EN COURS, gris À VENIR). Sous l'escale 1, 3 lignes de vols façon Flighty (code compagnie en badge, horaires, prix). Fin : « Atterrissage : ton forfait est prêt », vibration `success`. En mode jury, les libellés passent en anglais et la darija reste en sous-ligne.

### 6 · Résultat (planche 06-Resultat, A5, A6)
Carte claire en haut avec l'arc bleu et l'avion, pastille « IST Istanbul » façon Flighty. Feuille blanche « Ton forfait » : ligne recommandée (7 nuits, CMN 09:15 → SAW 21:10, 14 085 DH, badge vert « Recommandé ») puis « Direct Turkish 15 889 DH » et « Le moins cher 13 707 DH, 2 escales ».

### 7 · Fiche forfait (planche 07-Forfait, le gabarit Flighty)
- Libellé gris « AT972 + PC1102 · MAR. 15 DÉC. », titre « Casablanca → Istanbul », ligne verte « Départ dans 42 jours ».
- Horaires géants en vert, badges jaunes (« 1 escale MAD »), ligne grise « 8 h 55 · 3 350 km ».
- Retour en une ligne.
- Hôtel : Hampton by Hilton Istanbul Şişli, 9,3 (1 086 avis), petit déjeuner inclus, non remboursable, 6 439 DH.
- **Avant de partir** (4 tuiles) : Visa PAS BESOIN · Passeport 150 JOURS MIN. · Bagage PETIT SAC SEUL · Argent 7 % DE TA DOTATION.
- Pourquoi ce choix (3 lignes avec icônes), conseil malin avec halo (« +167 € ≈ 1 804 DH pour 4 h 15 de moins »), prix des hôtels par mois (barres bleues, décembre le moins cher), ce que j'ai écarté.
- Barre du bas : prix en tableau des départs (A4) et bouton noir « Ana mwafeq · Je valide » avec l'avion qui décolle (A7).

### 8 · Prêt à partir (planche 08-Checklist)
- En-tête : point vert et « Presque prêt : 1 chose à faire ».
- 4 grandes tuiles en grille 2 × 2 :
  - **Visa** : PAS BESOIN, jusqu'à 90 jours (vert). Calculé avec le passeport du profil.
  - **Passeport** : valide au moins 150 jours après l'arrivée (vert si le profil le confirme, sinon orange).
  - **Bagage** : PETIT SAC SEUL, valise à ajouter chez le partenaire (orange, action).
  - **Argent** : 7 % de ta dotation 2026 de 100 000 DH (vert).
- « Bon à savoir » : décalage horaire +2 h, les prises marocaines entrent, monnaie livre turque, météo de décembre (donnée par Muse).
- Ligne de source : « Vérifié par Muse sur 2 sources · 3 nov. ».
- Les mots de statut arrivent en tableau des départs (A4), une vibration `tick` par tuile.

### 9 · Vérifie w kemmel (planche 09-Valider)
Feuille Airbnb : récap avec vignette, lignes Dates, Voyageurs, Prix total avec « Modifier » ou « Détail », annulation, ligne bouclier « BonSafar ne voit jamais ta carte bancaire », bouton noir « Suivant », puis feuille « Tu vas payer chez Kiwi.com et sur le site de l'hôtel ».

### 10 · Dossier de voyage (planche 10-Dossier, A8)
Titre « Trik slama, Fatima ! ». Fond clair, fente d'impression en haut, carte d'embarquement façon Flighty (bloc vert « CMN → SAW » en gros, détails en Geist Mono, QR marqué « démo »), tampon marocain rouge et vert, liste du dossier (retour, hôtel, prêt à partir), boutons « Voir l'affiche » et « Partager » (bleu). Sans compte : « Garde ce voyage avec Google ».

### 10 bis · Affiche Rihla (planche 10b-Rihla, story 9:16)
Illustration Muse Image sans texte (Istanbul à l'heure dorée), étiquettes noires façon story Flighty « BSLAMA CASA » / « NEXT : ISTANBUL », carte d'embarquement inclinée « CMN → SAW » avec « رحلة » et « MADE WITH BONSAFAR ».

---

## 7. Mode jury et desktop (tout en anglais)

Le détail du déroulé et le script de la vidéo sont dans `demo-et-mode-jury.md`.

### J · Judges' demo (planche J1-Jury, 1440 × 900)
- En-tête : logo, badge « JUDGES' DEMO · 60 SECONDS », liens « Watch the 3-min video », GitHub, README.
- Titre : « A travel agency in your pocket, that understands Moroccan darija. »
- 3 chiffres : 619,827 demandes de visa Schengen au Maroc en 2025, 19.2 % refusées, 5e pays au monde (Commission européenne, données publiées le 28 mai 2026).
- Carte persona « You are playing Fatima, 52, from Casablanca » avec « See her 30-second onboarding ».
- 3 scénarios avec une vraie note vocale en darija, sa traduction anglaise, un badge de statut et un bouton « Run live » :
  1. Istanbul in December · NO VISA NEEDED (le parcours heureux) ;
  2. Paris for a weekend · SCHENGEN VISA NEEDED (le profil change la réponse) ;
  3. A sea trip, no details · ASKS 1 QUESTION (l'agent ne devine pas, il demande).
- « Or record your own, in darija, French or English ».
- Bandeau guidé 1 à 5 : Voice note in darija, What BonSafar understood, Live flight plan, One package one price, Ready-to-go travel file.
- Pied de page de transparence : modèles utilisés, prix seulement de Kiwi.com et trivago, badge « replay » si l'enregistrement prend le relais.

### J2 · Desktop avec Under the hood (planche J2-Desktop)
- En-tête : scénario en cours et étapes 1 à 5 en pastilles (noir fait, bleu en cours, blanc à venir).
- Téléphone à gauche avec le plan de vol : libellés anglais, darija en sous-ligne italique grise.
- Panneau blanc « Under the hood » à droite : 3 compteurs en tableau des départs (temps écoulé, coût IA, appels de modèles), barre empilée par modèle (Voice Transcribe vert, Spark bleu, Wonder violet, outils de données jaune), journal horodaté (heure, étape, modèle ou outil, latence, coût), ligne « Price guardrail », interrupteur « English subtitles ».
- Toutes les valeurs sont mesurées en direct. Un rejeu est marqué « replay ».

---

## 8. Chargements et erreurs

| Situation | On montre |
|---|---|
| Moins de 1 s | Rien, ou l'appui visuel |
| 1 à 3 s | Libellé de l'étape en shimmer |
| 3 à 8 s | Avion en route, sous-ligne en direct, résultats partiels |
| Plus de 8 s | Nuages (A9) et « Chwiya w nkemmel · Encore un instant », bouton Stop |
| Échec d'API | Une relance, puis « je réessaie », puis le cache ou le replay |
| Mode jury, plus de 20 s | Bascule sur l'enregistrement réel du scénario, badge « replay », heure de capture des prix |
| Affiche en génération | Skeleton 9:16 avec nuages, lancée pendant l'écran « Prêt à partir » |

---

## 9. Correspondance écrans, planches et blocs Cursor

| Écran | Planche (design/maquettes/png) | Bloc Cursor |
|---|---|---|
| 0 Bienvenue et connexion | 00-Connexion | 2 |
| 1 Profil (4 étapes) | 01a-Onboarding, 01b-Profil | 2 |
| 1 ter Carte de confiance | 01c-Confiance | 2 |
| 2 Accueil | 02-Main | 2 |
| 3 Vocal | 03-Vocal | 2 |
| 4 BonSafar a compris | 04-Compris | 2 |
| 5 Plan de vol | 05-Agent | 3 |
| 6 Résultat | 06-Resultat | 3 |
| 7 Fiche forfait | 07-Forfait | 3 |
| 8 Prêt à partir | 08-Checklist | 4 |
| 9 Vérifie w kemmel | 09-Valider | 4 |
| 10 Dossier | 10-Dossier | 4 |
| 10 bis Affiche | 10b-Rihla | 4 |
| J Judges' demo | J1-Jury | 5 |
| J2 Under the hood | J2-Desktop | 3 (panneau) et 5 (cadre jury) |
