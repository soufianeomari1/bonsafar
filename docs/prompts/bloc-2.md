# Bloc 2 · Connexion, profil, voix et compréhension (environ 3 h)

**Mode Cursor :** Agent, nouvelle conversation.
**À joindre (glisser les PNG) :** `design/maquettes/png/00-Connexion.png`, `01a-Onboarding.png`, `01b-Profil.png`, `01c-Confiance.png`, `02-Main.png`, `03-Vocal.png`, `04-Compris.png`.
**But :** de l'écran d'accueil jusqu'à « BonSafar a compris », avec une vraie voix en darija transcrite par Muse.

## Prompt à coller

```
Lis AGENTS.md, .cursor/rules/, docs/parcours-et-interfaces.md (sections 0, 2 à 6 pour les écrans 0 à 4) et docs/meta-model-api.md (surtout Muse Voice Transcribe).
Les PNG joints sont les écrans à reproduire. Pour les valeurs exactes (tailles, couleurs, espacements, textes), lis le HTML de la même planche dans design/maquettes/html.
Commence par un plan court, puis exécute-le.

1. Écran 0 Connexion : Google via Supabase ou « Continuer sans compte ». Sélecteur de langue, pastille « Mode jury » qui mène à /?jury=1 (la page jury viendra au bloc 5 : pour l'instant un placeholder en anglais).

2. Profil en 4 étapes (doc parcours section 5) puis carte de confiance. Type Profile en zod. Hook useProfile : Supabase (table profiles) si connecté, sinon localStorage, avec migration à la connexion. Écran « Ton profil » modifiable. Vibration select à chaque choix, success à la fin.

3. Écran 2 Accueil : radar vocal A1 (volume réel via AnalyserNode pendant l'enregistrement, animation calme au repos), 3 cartes d'idées filtrées par le profil (images statiques dans public/ideas pour l'instant, marquées comme provisoires), champ « ou écris ici » en repli.

4. Écran 3 Vocal : appui long sur le micro, glisser à gauche pour annuler, glisser vers le haut pour verrouiller, 60 s maximum, vibrations start, lock, cancel. Enregistrement avec MediaRecorder (webm/opus, repli mp4 pour iOS), puis conversion dans le navigateur en WAV PCM 16 bits mono 24 kHz (AudioContext + OfflineAudioContext pour rééchantillonner). Si le micro est refusé : vibration warn, message clair, champ texte.

5. POST /api/transcribe (runtime nodejs, maxDuration 60)
   Reçoit le WAV (multipart ou corps binaire). Muse Voice Transcribe est en temps réel uniquement : ouvre côté serveur une WebSocket vers wss://api.meta.ai/v1/asr/realtime avec la clé (paquet ws, en-tête Authorization Bearer), modèle MODEL_TRANSCRIBE. Lis d'abord la doc officielle https://dev.meta.ai/docs/speech-to-text et https://dev.meta.ai/docs/api-reference/voice/realtime pour le protocole exact (message de configuration, format des trames, événements). Ne devine rien : si un point manque, dis-le moi et regarde l'implémentation de référence MetaSTTService de Pipecat.
   Réglages : multilingue orienté arabe et français (la darija n'est pas une langue officielle), mots clés d'aide : Istanbul, Paris, Marrakech, Casablanca, dirham, décembre, janvier.
   Envoie les trames PCM, renvoie au navigateur les mots partiels au fil de l'eau en SSE, puis la transcription finale { text, latency_ms, audio_seconds, cost_usd } (coût : 0,18 $ par heure d'audio). Ferme proprement la session.
   Repli si la WebSocket échoue : MODEL_SPARK_AUDIO avec l'audio en entrée (qualité réduite), et un événement qui le signale.
   Ne stocke jamais l'audio, ni sur disque, ni dans Supabase, ni dans les logs.

6. src/lib/ai/ (socle réutilisé par les blocs suivants)
   client.ts : client OpenAI pointé sur META_API_BASE_URL avec apiKey explicite.
   pricing.ts : tarifs de docs/meta-model-api.md.
   events.ts : journal de run { t, step, model, latency_ms, tokens_in, tokens_out, cost_usd, replay }, les tokens de raisonnement comptent en sortie.
   call.ts : wrapper qui mesure, compte, journalise, applique un timeout et une relance.

7. POST /api/intent : Muse Spark (MODEL_SPARK), JSON strict par JSON schema dans response_format quand c'est supporté, validé par zod. Effort de raisonnement au plus bas qui garde une bonne qualité (vérifie le nom exact du paramètre dans la doc). Objectif : moins de 5 s.
   Le prompt système reçoit le profil et la date du jour (pour résoudre « nouss décembre », « f janvier », « l'été »).
   Schéma : destination { city, country, iata } | null, origin_iata (celui du profil par défaut), depart_date, return_date, nights, adults, children, budget_mad | null, wishes[], keywords[] (sous-chaînes exactes de la transcription, pour l'animation A2), translation_en, question (null, ou { darija, fr, en, options[] }).
   Règles : au plus une question, seulement si une info indispensable manque (destination, ou dates trop floues pour chercher), jamais sur ce que le profil sait déjà (départ, voyageurs, papiers). Aucun montant inventé : budget_mad uniquement s'il est dit.

8. Écran 4 BonSafar a compris : bulle bleue avec lecteur et transcription, mots clés surlignés qui volent dans les chips (A2, layoutId partagé), chips modifiables au toucher, traduction anglaise sous la bulle en mode jury, carte « 1 QUESTION » avec réponses rapides si besoin, bouton « Yallah, qelleb ! » (il mène à un placeholder pour l'instant).

9. Page /dev/voice : enregistrer, voir les mots arriver, la transcription finale, le JSON d'intention et les événements du journal (latence, tokens, coût). C'est mon banc de test.

10. Vérification : npm run lint et npm run build, puis la liste des fichiers et les tests à faire à la main, en français.
```

## Fini quand

- Sur `/dev/voice`, la phrase « Bghit nsafer l'Istanbul m3a rajli f nouss décembre, chi semaine, budget 15 000 dh, bghina otel mzyan b ftour » donne : Istanbul, 15 au 22 déc., 2 adultes, 15 000 DH, petit déjeuner.
- Aucune question sur le départ quand le profil dit CMN. Une seule question pour « Bghit chi blasa fiha lb7er f l'été, ana w rajli ».
- Compréhension en moins de 5 s, le journal affiche de vrais coûts.
- Tout marche sur Android Chrome depuis le lien Vercel.

## Après le bloc

1. `/fin-de-bloc` dans Cursor, puis commit et `git push` (Vercel redéploie tout seul).
2. Tester sur ton téléphone : https://bonsafar.com/dev/voice
