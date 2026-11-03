# Bloc 1 · Fondations (environ 1 h 30)

**Mode Cursor :** Agent, nouvelle conversation, le modèle le plus solide disponible.
**À joindre :** rien. Les docs sont dans le dépôt.
**But :** un socle propre et déployé, sans écran métier : thème, langues, vibrations, composants de base, connexion Google.

## Prompt à coller

```
Lis AGENTS.md, les règles de .cursor/rules/, docs/README.md, docs/parcours-et-interfaces.md (sections 0 à 5) et docs/meta-model-api.md.

Objectif du bloc 1 : les fondations de BonSafar, déployables sur Vercel ce soir. Aucun écran du parcours, aucune route /api pour l'instant.
Commence par un plan court (fichiers et ordre), puis exécute-le sans attendre ma validation, sauf si deux docs se contredisent.

1. Scaffolding
   Le dépôt contient déjà des fichiers (README.md, LICENSE, .gitignore, AGENTS.md, .cursor/, .cursorignore, .env.example, .env.local, docs/, design/), donc create-next-app refusera le dossier courant. Crée l'app dans un dossier temporaire puis rapatrie-la :
   npx create-next-app@latest .tmp-next --ts --tailwind --eslint --app --src-dir --turbopack --import-alias "@/*" --use-npm --yes
   Déplace tout le contenu de .tmp-next à la racine (sauf .git et README.md), fusionne son .gitignore avec l'existant (les fichiers .env* restent ignorés, sauf .env.example), garde notre LICENSE, puis supprime .tmp-next.
   Ensuite : npx shadcn@latest init (Tailwind v4, couleur de base neutre). N'ajoute des composants shadcn que s'ils servent vraiment.
   Dépendances : npm i motion @phosphor-icons/react @supabase/supabase-js @supabase/ssr openai @modelcontextprotocol/sdk zod ws
   et : npm i -D @types/ws

2. Thème
   Tokens du doc parcours section 2 dans @theme de src/app/globals.css, avec les noms de code de la colonne « Nom dans le code » (bg, card, ink, muted, line, fill, green, green-bright, green-soft, yellow, orange, orange-soft, red, red-soft, blue, blue-soft, violet, sea, land, sky, stamp-red, stamp-green), plus les rayons (sheet 32px, card 22px, button 16px) et l'ombre douce. Retire les couleurs de démo de create-next-app et du thème sombre : l'app est en thème clair uniquement. Body sur bg et ink.
   Polices via next/font/google : Geist, Geist_Mono, IBM_Plex_Sans_Arabic (400 et 600), exposées en --font-sans, --font-mono, --font-arabic.

3. src/lib/env.ts
   Validation zod des variables de .env.example. Séparer serveur et public (seules les NEXT_PUBLIC_* côté client). Une variable serveur manquante doit lever une erreur claire au moment où une route l'utilise, pas casser le build.

4. src/lib/i18n
   Dictionnaires en, fr, darija-latn, darija-arab, ar avec des clés en anglais. Jeu de départ : boutons communs et textes des écrans 0 à 2 repris des maquettes (design/maquettes/html). Hook useT(), provider qui lit la langue du profil (localStorage pour l'instant, défaut fr), ?jury=1 force en. dir="rtl" et police arabe pour darija-arab et ar. Repli sur en si une clé manque.

5. src/lib/haptics.ts
   Les 8 motifs du doc parcours section 4, désactivables, au plus une vibration par seconde sauf en mode « flight plan ». Chaque vibration émet un événement écouté par un composant HapticRing (anneau de 24 px qui pulse 200 ms) : c'est le jumeau visuel pour la vidéo. Sans navigator.vibrate (iPhone, desktop), seul l'anneau s'affiche.

6. Composants de base dans src/components/bs/
   Button (primaire noir 56 px, secondaire, lien ; appui scale 0.97), Chip, Card, Sheet (feuille qui monte en 500 ms, ease [0.32, 0.72, 0, 1]), IconCircle (icône Phosphor fill dans un cercle teinté de 36 à 48 px), StatusBadge (Geist Mono), SplitFlap (A4), Clouds (A9), PlaneRoute (squelette de A3 : 5 escales, avion qui descend vers la prop activeStep, traînée bleue, coche verte à l'arrivée). Tous respectent prefers-reduced-motion. Valeurs de mouvement : doc parcours section 3.

7. Layouts
   MobileFrame (390 px, centré sur desktop avec un fond neutre) et JuryFrame (1440 px : téléphone à gauche, panneau « Under the hood » à droite, vide pour l'instant).

8. Supabase (Next.js 16)
   src/lib/supabase/client.ts (createBrowserClient avec NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) et server.ts (createServerClient avec getAll/setAll).
   src/proxy.ts (fonction exportée proxy, pas de middleware.ts) qui rafraîchit la session avec getUser() et exclut les assets statiques.
   src/app/auth/callback/route.ts : exchangeCodeForSession, puis redirection vers la page demandée.
   Un bouton « Continue with Google » (signInWithOAuth, provider google, redirectTo `${origin}/auth/callback`) et un bouton de déconnexion.
   supabase/schema.sql : tables profiles, trips et usage du doc parcours section 5, RLS (chacun ses lignes pour profiles et trips, usage écrit seulement côté serveur), trigger qui crée la ligne profiles à l'inscription avec first_name depuis les métadonnées Google, bucket Storage public « posters ».

9. Pages
   / : page d'attente propre en anglais (logo avion, « BonSafar », « trik slama », lien vers /dev/kit).
   /dev/kit : tous les composants, un bouton par vibration, le sélecteur des 5 langues, le bouton Google et l'état de session.
   /privacy et /terms : courtes, en anglais (pas d'audio stocké, seulement des transcriptions ; aucune donnée de paiement ; données hébergées par Supabase en Europe ; paiement chez les partenaires ; contact via le dépôt GitHub). Google les demande pour une app publiée, et elles rassurent le jury.

10. README.md en anglais, minimal : nom, pitch d'une ligne, « Live demo: coming soon », stack, lancer en local avec .env.example. Le README complet viendra au bloc 5.

11. Vérification
    npm run lint et npm run build sans erreur. Un commit par grande étape, messages conventional commits en anglais. Termine par la liste des fichiers créés et ce que je dois tester à la main, en français.
```

## Fini quand

- `npm run build` passe en local.
- `/dev/kit` s'affiche sur http://localhost:3000/dev/kit, les vibrations marchent sur ton Android (ou l'anneau sur ordinateur).
- La connexion Google marche en local, puis sur le lien Vercel (étapes ci-dessous).

## Après le bloc (à la main, 15 min)

1. Pousser le code : `git push`.
2. Créer le projet Vercel : https://vercel.com/new, importer `soufianeomari1/bonsafar`, framework Next.js détecté automatiquement.
3. Avant de cliquer sur Deploy, ouvrir **Environment Variables** et coller tout le contenu de ton `.env.local` d'un coup (Vercel découpe les lignes tout seul). Remplacer `NEXT_PUBLIC_SITE_URL` par `https://bonsafar.com`.
4. Deploy, puis noter l'URL Vercel (du type `bonsafar.vercel.app` ou `bonsafar-xxxx.vercel.app`).
5. Rattacher le domaine : dans le projet Vercel, **Settings > Domains**, ajouter `bonsafar.com` et `www.bonsafar.com`.
6. Ajouter l'URL Vercel dans Supabase : https://supabase.com/dashboard/project/zilxslwiwuqivcyplnat/auth/url-configuration, bouton **Add URL**, valeur `https://<ton-url-vercel>/**`.
7. Tester la connexion Google sur https://bonsafar.com/dev/kit en navigation privée.
