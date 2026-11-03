# BonSafar : plan de dev Cursor en 5 blocs (v2, 3 nov. 2026, 17:00)

Objectif : un parcours qui marche vraiment et qui est beau, en ligne sur bonsafar.com, avant le 4 nov. à 18:00 heure de Paris.

Ce qui change en v2 : le bloc 0 est fait, les règles Cursor sont dans `.cursor/rules/` et `AGENTS.md`, les prompts à jour sont dans `docs/prompts/`, la stack passe à Next.js 16 et aux nouvelles clés Supabase, la transcription se fait en temps réel.

---

## 1. Comment on travaille avec Cursor

1. Le dépôt contient dès le départ : `AGENTS.md`, `.cursor/rules/*.mdc`, `.cursor/commands/fin-de-bloc.md`, `.cursorignore`, `.env.example`, `docs/` et `design/maquettes/`.
2. Un bloc = une nouvelle conversation Cursor en mode Agent = un ou plusieurs commits. On teste le bloc sur le lien Vercel avant de lancer le suivant.
3. On colle le prompt du bloc depuis `docs/prompts/bloc-N.md`, et on glisse dans la conversation les PNG des écrans concernés (`design/maquettes/png`). Cursor lit les images. Le HTML de la même planche sert pour les valeurs exactes.
4. En fin de bloc, on tape `/fin-de-bloc` : Cursor vérifie lint, build, secrets et écarts avec les maquettes, puis liste ce qu'il faut tester.
5. Si Cursor dévie, on ne réexplique pas tout : on le renvoie vers la section du doc concernée et la planche.

## 2. Bloc 0 : prérequis (fait le 3 nov.)

| # | Quoi | État |
|---|---|---|
| 1 | Domaine bonsafar.com | Acheté chez Vercel |
| 2 | Clé Meta Model API, identifiants des modèles | Testée, identifiants dans `meta-model-api.md` |
| 3 | Dépôt public `soufianeomari1/bonsafar` | Créé (README, LICENSE MIT, .gitignore Node) |
| 4 | Projet Supabase `zilxslwiwuqivcyplnat` | Créé, clés publishable et secret récupérées |
| 5 | Google OAuth | App en production, client Web créé |
| 6 | Google dans Supabase | Activé, URL autorisées saisies |
| 7 | Projet Vercel | À créer à la fin du bloc 1 (premier push du code) |
| 8 | Taux EUR/MAD | 11,0044 au 2 nov. 2026 |
| 9 | Notes vocales du jury | À enregistrer le 4 nov. au matin, avec accord écrit |

Variables d'environnement (`.env.local` et Vercel) :

```
META_API_KEY=
META_API_BASE_URL=https://api.meta.ai/v1
MODEL_TRANSCRIBE=muse-voice-transcribe-1.0
MODEL_SPARK=muse-spark-1.3
MODEL_SPARK_AUDIO=muse-spark-1.3
MODEL_WONDER=muse-wonder-1.0
MODEL_IMAGE=muse-image-1.0
NEXT_PUBLIC_SUPABASE_URL=https://zilxslwiwuqivcyplnat.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
KIWI_MCP_URL=https://mcp.kiwi.com
TRIVAGO_MCP_URL=https://mcp.trivago.com/mcp
EUR_MAD_RATE=11.0044
EUR_MAD_DATE=2026-11-02
DOTATION_MAD=100000
SPEND_LIMIT_USD=120
JURY_REPLAY_AFTER_MS=20000
NEXT_PUBLIC_SITE_URL=https://bonsafar.com
```

## 3. Les 5 blocs

| Bloc | Contenu | Durée | Prompt |
|---|---|---|---|
| 1 | Fondations : Next.js 16, tokens, i18n, haptique, composants, Supabase, déploiement | 1 h 30 | `prompts/bloc-1.md` |
| 2 | Connexion, profil, voix (transcription temps réel) et compréhension | 3 h | `prompts/bloc-2.md` |
| 3 | L'agent, les vraies données, le forfait, le panneau Under the hood | 3 h 30 | `prompts/bloc-3.md` |
| 4 | Prêt à partir, validation, dossier et affiche | 2 h 30 | `prompts/bloc-4.md` |
| 5 | Mode jury, replay, garde-fous, README | 2 h 30 | `prompts/bloc-5.md` |

Chaque fichier de prompt contient : les planches à joindre, le prompt complet, le critère « fini quand » et les gestes manuels d'après bloc.

## 4. Planning (heure de Paris)

| Quand | Quoi |
|---|---|
| Mar. 3 nov., 17:30 à 19:00 | Bloc 1, puis projet Vercel et domaine |
| 19:00 à 22:00 | Bloc 2 |
| 22:00 à 01:30 | Bloc 3 |
| Mer. 4 nov., 08:00 | Nouveau taux Bank Al-Maghrib, enregistrement des 3 notes vocales |
| 08:15 à 10:30 | Bloc 4 |
| 10:30 à 13:00 | Bloc 5, runs de replay enregistrés |
| 13:00 à 15:30 | Vidéo de 3 min en anglais |
| 15:30 à 17:00 | README, vérifications, post sur X |
| 17:00 à 18:00 | Soumission et marge |

## 5. Ce qu'on coupe si on prend du retard (dans cet ordre)

1. Les barres de prix par mois (on garde le conseil malin).
2. La connexion Google : on garde « Continuer sans compte » et le profil local.
3. L'affiche Muse Image en direct : une illustration préparée à l'avance par Muse Image, marquée comme telle.
4. Le scénario 3 du jury.
5. L'affichage des mots en direct pendant la transcription (on garde la transcription finale).

On ne coupe jamais : la voix en darija, les vrais prix, le plan de vol, le panneau Under the hood, le replay.
