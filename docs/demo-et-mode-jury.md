# BonSafar : démo et mode jury (3 nov. 2026)

Le jury parle anglais, juge la vidéo, le code et le produit en ligne, et ne passera que quelques minutes sur BonSafar. Tout ce document sert un seul but : qu'en 60 secondes il voie que ça marche vraiment, en live, sur les modèles Meta, et que c'est utile.

Les textes destinés au jury sont en anglais. Les notes pour Soufiane sont en français.

---

## 1. Les 3 messages que le jury doit retenir

| Message | Critère servi | Preuve à l'écran |
|---|---|---|
| **« Ça résout un vrai problème, pour de vrais gens. »** | Impact | 619,827 demandes Schengen et 19.2 % de refus au Maroc en 2025 ; Fatima, sa vraie voix, sa vraie question. |
| **« Les modèles Meta font tout le travail intelligent. »** | Usage des outils Meta | Panneau Under the hood : Muse Voice Transcribe, Muse Spark, Muse Wonder, Muse Image, avec latence et coût de chaque appel. |
| **« C'est solide, et on peut lui faire confiance. »** | Profondeur technique, qualité de la démo | Prix réels Kiwi.com et trivago, garde-fou prix, darija comprise alors qu'elle n'est pas une langue officielle du modèle, replay honnête. |

---

## 2. Le parcours du jury, seconde par seconde

1. **0 s** : il ouvre `bonsafar.com/?jury=1` (lien en tête du README et de la soumission). Il tombe sur la planche Jury, en anglais.
2. **5 s** : il lit le titre et les 3 chiffres, voit la carte « You are playing Fatima ».
3. **10 s** : il clique sur « Run live » du scénario 1. La note vocale de Fatima se joue, sous-titrée en anglais.
4. **15 s** : « What BonSafar understood » : les mots clés de la darija volent dans les chips, traduction anglaise dessous.
5. **20 à 40 s** : le plan de vol, avec à droite le panneau Under the hood qui se remplit en direct.
6. **40 à 50 s** : le forfait, un prix en dirhams, le conseil malin, les 4 tuiles « Before you go ».
7. **50 à 60 s** : le dossier imprimé, le tampon, puis la carte de fin : temps total, coût, modèles, heure de capture des prix.
8. **Ensuite** : la carte de fin propose le scénario 2 (Paris) et « Record your own ».

Pas de connexion, pas de profil à remplir : Fatima est pré-remplie. « See her 30-second onboarding » montre les 4 étapes en accéléré pour ceux qui veulent voir.

---

## 3. Les 3 scénarios

Notes vocales réelles, 10 à 20 secondes chacune, enregistrées par 2 personnes de l'entourage avec leur accord écrit (à mentionner dans le README). Les fichiers vont dans `public/jury/` en WAV PCM 16 bits mono 24 kHz (format attendu par Muse Voice Transcribe), avec leur transcription de référence.

### Scénario 1 · Istanbul in December · NO VISA NEEDED
- **Darija (exemple à dire naturellement) :** « Bghit nsafer l'Istanbul m3a rajli f nouss décembre, chi semaine, budget 15 000 dh, bghina otel mzyan b ftour. »
- **English:** I want to go to Istanbul with my husband in mid-December, about a week, budget 15,000 dh, a good hotel with breakfast.
- **Ce qu'on attend :** pas de question (le profil connaît CMN), 3 options réelles, un forfait recommandé autour de 14 000 DH (chiffres du 3 nov., à recapturer le 4 au taux du jour), conseil malin « direct pour quelques centaines de dirhams de plus », visa pas besoin.
- **Ce que ça prouve :** le parcours complet de bout en bout.

### Scénario 2 · Paris for a weekend · SCHENGEN VISA NEEDED
- **Darija :** « Bghit nmchi Paris weekend m3a bnti, f janvier. »
- **English:** I want to go to Paris for a weekend with my daughter, in January.
- **Ce qu'on attend :** BonSafar dit d'abord que Fatima n'a pas de visa Schengen, explique quoi préparer avec la source officielle (France-Visas, via Muse Spark et la recherche web), puis propose un voyage sans visa à la place, avec de vrais prix.
- **Ce que ça prouve :** le profil change la réponse, l'agent conseille au lieu de seulement chercher.

### Scénario 3 · A sea trip, no details · ASKS 1 QUESTION
- **Darija :** « Bghit chi blasa fiha lb7er f l'été, ana w rajli. »
- **English:** Somewhere by the sea this summer, me and my husband.
- **Ce qu'on attend :** une seule question, avec des réponses rapides (le budget et la durée), puis des propositions sans visa pour Fatima.
- **Ce que ça prouve :** l'agent ne devine pas, il demande une seule fois et au bon moment.

### Record your own
Bouton secondaire : le jury parle en darija, en français ou en anglais. Même pipeline, même panneau.

---

## 4. Robustesse : ce qui ne doit jamais casser

| Risque | Parade |
|---|---|
| L'API est lente pendant le jugement | Au-delà de 20 s ou en cas d'erreur, bascule sur le run réel enregistré du scénario, badge **replay** et heure de capture des prix affichés. Jamais de faux live. |
| Les crédits fondent | Compteur de dépense ; au-delà de 120 $, mode replay seul. 10 runs par IP et par heure. |
| Le micro est refusé ou absent sur l'ordinateur du jury | Les 3 scénarios utilisent des fichiers audio, pas le micro. |
| Un prix a changé depuis la vidéo | L'écran affiche la source et l'heure de capture. La vidéo dit « live prices », pas un montant garanti. |
| Le navigateur du jury est en anglais et sans compte | Le mode jury force l'anglais et n'exige aucune connexion. |
| Animation trop lente pour un jury pressé | Bouton « Skip » discret en haut du plan de vol, et `prefers-reduced-motion` respecté. |

À faire le 4 nov. au matin : enregistrer un run réussi par scénario (il sert au replay) et vérifier les 3 scénarios en navigation privée, sur ordinateur et sur Android.

---

## 5. La vidéo de 3 minutes (en anglais)

Format : 1920 × 1080, voix off en anglais, la darija sous-titrée en anglais. On filme surtout la planche Jury et le cadre desktop, et quelques plans du téléphone pour les vibrations (avec leur jumeau visuel).

| Temps | À l'écran | Voix off (anglais) |
|---|---|---|
| 0:00 à 0:15 | Carte ancienne, un trait de Tanger vers l'est, puis le téléphone de Fatima | "In 1325, Ibn Battuta left Tangier and travelled for nearly thirty years. Seven centuries later, Fatima, from Casablanca, still pays an agency to book one week in Istanbul." |
| 0:15 à 0:35 | Les 3 chiffres de la planche Jury | "In 2025, Moroccans filed 619,827 Schengen visa applications. Nearly one in five was refused. Visas, payment cards, baggage rules: one mistake costs money and months. So people who could travel on their own still go through an agency. And they don't talk to it in English. They talk in darija." |
| 0:35 à 0:45 | Logo, écran d'accueil, radar vocal | "In Morocco, when you leave on a trip, people say 'trik slama'. In French, 'bon voyage'. BonSafar is both: a travel agency in your pocket, built on Meta's Muse models." |
| 0:45 à 1:05 | La note vocale de Fatima, puis les chips qui volent | "Fatima just talks. Muse Voice Transcribe turns her voice into text, live. Darija isn't on its official language list, so we bias it toward Arabic and French and let Muse Spark rebuild the meaning. No question about where she flies from: her profile already says Casablanca." |
| 1:05 à 1:30 | Le plan de vol et le panneau Under the hood | "Muse Wonder plans the trip and calls live tools: flights from Kiwi.com, hotels and monthly prices from trivago. Every step, every model, its latency and its cost, live on the right." |
| 1:30 à 1:50 | Le forfait, le prix en tableau des départs, le conseil malin, les 4 tuiles | "One price, in dirhams. The model never writes a price: it only picks offer IDs, and our code reads the real ones. Then the advice a good agent gives: the direct flight costs a bit more and saves four hours. And before she goes: no visa needed, passport rules, a cabin bag only, and the share of her yearly travel allowance." |
| 1:50 à 2:10 | Le scénario Paris | "Now Paris. Fatima has no Schengen visa, so BonSafar says it first, shows what to prepare from the official source, and offers a trip she can take without one." |
| 2:10 à 2:30 | La carte imprimée, le tampon, l'affiche Muse Image | "She pays on the partner's site. BonSafar never sees her card. What she keeps is her travel file, and a poster made by Muse Image to share with the family." |
| 2:30 à 2:48 | Schéma d'architecture, carte de fin avec le coût mesuré | "Four Meta models, [N] calls, about [cost] per trip, and prices you can check." |
| 2:48 à 3:00 | Le domaine, la France en ligne de mire | "Morocco first, then France, and every traveller who would rather just say where they want to go. BonSafar. Trik slama." |

Les montants exacts de la voix off (écart du vol direct, coût par voyage) se remplissent le 4 nov. avec les chiffres du run enregistré.

Rien n'existait avant l'événement : BonSafar est parti de zéro pendant l'événement, on le dit dans le README.

---

## 6. Le post sur X (prix Most Viral)

Extrait de 45 s : la note vocale de Fatima, les chips qui volent, l'avion du plan de vol, le prix qui tourne, la carte imprimée et le tampon.

Texte (en anglais, mentions et hashtag officiels à vérifier dans #announcements avant de poster) :

```
Most travel AI speaks English. Fatima speaks darija.

BonSafar: send a voice note in Moroccan darija, get a real trip back. Live flights and hotels, one price in dirhams, visa checked before you go.

Built in a few days on Meta's Muse models.

Try the 60-second demo: bonsafar.com/?jury=1
```

Puis soumettre le lien du post sur la plateforme. L'engagement compte jusqu'au 8 nov. au soir : relayer le post auprès de la communauté marocaine et de la diaspora.

---

## 7. Modèle de README (en anglais)

```md
# BonSafar

A travel agency in your pocket, that understands Moroccan darija.
"Bon" (French) + "safar" (travel, in darija): the way Moroccans say "trik slama", have a safe trip.
Meta Global AI Developer Hackathon · Indie track · Theme: Build for Your World

**Live demo for judges:** https://bonsafar.com/?jury=1 (no login, 60 seconds)
**Video (3 min):** [link]

## The problem
In 2025, Moroccans filed 619,827 Schengen visa applications and 19.2% were refused (European Commission data, released May 28, 2026). Many people who can afford to travel still go through an agency, afraid of making a costly mistake. And they speak darija, a language most voice and travel tools don't officially support.

## What BonSafar does
1. You send a voice note in darija, French or Arabic.
2. BonSafar shows what it understood, and asks at most one question.
3. An agent searches live flights and hotels and builds one package, with one price in dirhams.
4. It checks what you need before you go: visa, passport, baggage, money.
5. You pay on the partner's site, and keep a travel file and a poster.

## Built with Meta models
| Model | Role |
|---|---|
| Muse Voice Transcribe 1.0 | Darija voice notes to text over the realtime API (biased toward Arabic and French) |
| Muse Spark 1.3 | Strict JSON intent, English translation, entry requirements with web search |
| Muse Wonder 1.0 | Agentic planning with tool calls, final choice and explanation |
| Muse Image 1.0 | Text-free travel poster |

## Live data and the price guardrail
Flights come from the official Kiwi.com MCP server, hotels and monthly price trends from the official trivago MCP server. Prices are stored server-side. The models only handle offer IDs and can never write a price; any amount in model output is rejected. Euros are converted to dirhams with the Bank Al-Maghrib reference rate, and the rate date is shown.

## Under the hood
Every step is logged with its model, latency and cost, and shown live in the judges' view. If the API is slow, a real recorded run is replayed and clearly labeled "replay".

## Run locally
[steps, env vars from .env.example]

## Privacy
No audio is stored, only transcripts. No payment data ever reaches BonSafar. Voice notes in the demo were recorded with the speakers' consent.

## External services
Kiwi.com MCP, trivago MCP, Supabase (auth and database), Vercel (hosting). No non-Meta AI model is used.

## Built during the event
Everything in this repository was built from scratch during the hackathon (Oct 27 to Nov 4, 2026).

## Team
Soufiane Omari (solo)
```

---

## 8. Vérification avant de soumettre

- [ ] Dépôt public, aucune clé dans l'historique Git, `.env.example` sans secret.
- [ ] `bonsafar.com/?jury=1` testé en navigation privée sur ordinateur et sur Android.
- [ ] Les 3 scénarios passent en live, et le replay marche en coupant le réseau.
- [ ] Vidéo de 3 min maximum, en anglais, lien ouvert à tous.
- [ ] Thème cité : Build for Your World. Nom du contributeur renseigné.
- [ ] Accords des voix enregistrées gardés.
- [ ] Post X publié et son lien soumis.
- [ ] Soumission avant le 4 nov. à 18:00 heure de Paris (limite officielle : 5 nov. à 03:00).
