# Prompt Cursor : appliquer les corrections de langue

À coller dans Cursor une fois `docs/i18n-relecture/corrections/*.json` générés par `apply_validations.py`.

---

Applique les corrections de langue validées par Soufiane, et rien d'autre.

Entrées : `docs/i18n-relecture/corrections/darija-latn.json`, `darija-arab.json` et `ar.json`. Chaque fichier contient seulement les clés à modifier, avec leur nouvelle valeur exacte.

1. Pour chaque clé de `darija-latn.json`, remplace sa valeur dans `src/lib/i18n/darija-latn.ts`. Même chose pour `darija-arab.json` dans `src/lib/i18n/darija-arab.ts` et pour `ar.json` dans `src/lib/i18n/ar.ts`.
2. Copie chaque valeur telle quelle : mêmes lettres, même ponctuation, mêmes variables `{…}`, mêmes marqueurs `[[ ]]` et `** **`. Un `\n` du JSON reste `\n` dans la chaîne TypeScript. Garde les guillemets doubles et la mise en forme de la ligne (une valeur sur la ligne suivante reste sur la ligne suivante).
3. Ne touche à rien d'autre : pas `fr.ts` ni `en.ts`, pas les autres clés, pas l'ordre, pas les commentaires, pas les composants. Ne change jamais « BonSafar » ni « trik slama ».
4. Si une clé du JSON n'existe pas dans le dictionnaire, ne l'ajoute pas : signale-la.
5. Lance `npm run i18n:review`, puis `npm run lint` et `npm run build`. Les deux derniers doivent passer sans erreur.
6. Termine par : le nombre de clés modifiées par fichier, les clés signalées, et le résultat des trois commandes. Commit : `fix(i18n): native review of darija and Arabic strings`.
