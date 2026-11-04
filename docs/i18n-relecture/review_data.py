# -*- coding: utf-8 -*-
"""Relecture linguistique : un avis par clé, dans l'ordre du parcours.

Chaque ligne : écran, clé, emplacement, type, gravité, avis, puis les propositions
(None = pas de changement) pour darija-latn, darija-arab et ar.
Les textes actuels ne sont pas recopiés ici : build_sheet.py les lit dans src/lib/i18n.
"""

G00 = "00 Bienvenue"
G01 = "01 Profil (4 questions)"
G01P = "01 Profil · écran Ton profil"
G01T = "01 ter Confiance"
G02 = "02 Accueil"
G03 = "03 Vocal"
G04 = "04 Compris"
G05 = "05 Plan de vol"
G06 = "06 Résultat"
G07 = "07 Forfait"
G08 = "08 Prêt à partir"
G09 = "09 Vérifie et continue"
G10 = "10 Dossier"
G10B = "10 bis Affiche"
GE = "Erreurs et états vides"
GM = "Mascotte (lecteur d'écran)"
GX = "Hors parcours (non affiché)"

SCREEN_ORDER = [G00, G01, G01P, G01T, G02, G03, G04, G05, G06, G07, G08, G09, G10, G10B, GE, GM, GX]

GRAVITY = {
    "A": "A · Sens",
    "B": "B · Cohérence",
    "C": "C · Orthographe",
    "OK": "OK",
}

ROWS = []


def R(screen, key, loc, typ, grav, avis, latn=None, arab=None, ar=None):
    ROWS.append(
        {
            "screen": screen,
            "key": key,
            "loc": loc,
            "type": typ,
            "grav": GRAVITY[grav],
            "avis": avis,
            "latn": latn,
            "arab": arab,
            "ar": ar,
        }
    )


SR = " (lu par le lecteur d'écran, invisible)"
XNOTE = "Non affichée aujourd'hui : relecture facultative."

# 00 Bienvenue ---------------------------------------------------------------
R(G00, "welcome.tagline", "En-tête, en italique gris à droite du logo BonSafar", "libellé", "OK",
  "OK. Signature, on n'y touche pas.")
R(G00, "welcome.language.change", "Bouton de langue en haut à droite" + SR, "libellé", "C",
  "Latin : « lgha » s'écrit « logha » partout ailleurs. Arabe classique : « حاليًا » avec le tanwin, comme les autres chaînes.",
  latn="Beddel logha, daba {language}", ar="تغيير اللغة، حاليًا {language}")
R(G00, "common.juryMode", "Feuille Langue : pastille en haut. Aussi pastille en haut de l'Accueil", "libellé", "B",
  "La version en lettres arabes est de l'arabe classique alors que la latine est en darija. Je l'aligne sur la latine.",
  arab="المود ديال اللجنة")
R(G00, "welcome.legal.terms", "Feuille Langue : lien souligné en bas, à gauche", "lien", "C",
  "Arabizi : « ou » pour le son long, majuscule comme les autres liens.", latn="Chourout")
R(G00, "welcome.legal.privacy", "Feuille Langue : lien souligné en bas, à droite", "lien", "C",
  "Arabizi plus lisible, majuscule.", latn="Lkhoususiya")
R(G00, "welcome.demo.label", "Titre de la démo animée" + SR, "libellé", "B",
  "« Dimo / ديمو » vient du français et parle peu à une dame de 52 ans. « Mithal » (exemple) dit clairement que ce n'est pas réel. Même mot proposé sur la carte d'embarquement (écran 10).",
  latn="Mithal", arab="مثال", ar="عرض توضيحي")
R(G00, "welcome.step1", "Gros titre de l'étape 1, mot surligné en jaune", "titre", "C",
  "OK sur le sens. Arabizi : « Goulha » (ou long), comme « Goul liya » à l'Accueil.",
  latn="Goulha b [[darija.]]")
R(G00, "welcome.demo.duration", "Durée affichée sur la note vocale de démo", "libellé", "OK", "OK.")
R(G00, "welcome.demo.transcript", "Bulle vocale bleue de démo (parole de l'utilisatrice, mots clés surlignés)", "libellé", "OK",
  "OK. C'est la parole de Fatima : elle reste en darija dans toutes les langues, y compris en arabe classique. Seul écart : la latine dit « nouss décembre » (français parlé), l'arabe « نص دجنبر ». Les deux sont réalistes, à toi de voir.")
R(G00, "welcome.step2", "Gros titre de l'étape 2, mot souligné en bleu", "titre", "A",
  "Risque de malentendu : « 3lina » veut aussi dire « c'est nous qui payons » (comme « lqahwa 3lina »), on peut lire « le voyage est offert ». « Khellih 3lina » (laisse-le nous) garde l'idée sans ambiguïté.",
  latn="[[Safar]] khellih 3lina.", arab="[[السفر]] خليه علينا.")
R(G00, "welcome.sub", "Ligne grise sous le titre de l'étape 2", "texte d'aide", "B",
  "Darija OK. Lettres arabes : « ڤيزا » (convention ڤ). Arabe classique : il manque « vérifiés ».",
  arab="الطيارة، الأوطيل، الڤيزا والباگاج، كلشي متحقق، بالثمن الحقيقي.",
  ar="الطيران والفندق والتأشيرة والأمتعة، كلها مُتحقَّق منها وبالسعر الحقيقي.")
R(G00, "welcome.demo.understood", "Étiquette en haut de la carte d'embarquement (point vert, petites capitales)", "statut", "OK", "OK.")
R(G00, "welcome.demo.city", "Nom de la ville en gros sur la carte d'embarquement", "libellé", "OK", "OK.")
R(G00, "welcome.demo.country", "Sous le nom de la ville, en gris", "libellé", "C",
  "Arabizi : se prononce « Torkiya ».", latn="Torkiya · 7 lyali")
R(G00, "welcome.demo.dates", "Dates en vert, à droite de la carte", "libellé", "OK",
  "OK. Format différent entre latin (flèche) et arabe (من ... حتى), mais les deux tiennent dans la carte.")
R(G00, "welcome.demo.when", "Sous les dates, en gris", "libellé", "OK", "OK.")
R(G00, "welcome.demo.adults", "Chip en bas de la carte (icône personnes)", "chip", "B",
  "Latin « 2 kbar », arabe « جوج كبار » : j'aligne la latine sur « Jouj kbar », plus naturel à lire.",
  latn="Jouj kbar")
R(G00, "welcome.demo.breakfast", "Chip en bas de la carte (icône tasse)", "chip", "OK", "OK.")
R(G00, "welcome.demo.visa", "Chip verte en bas de la carte (coche)", "chip", "C",
  "Convention ڤ en lettres arabes.", arab="بلا ڤيزا")
R(G00, "welcome.pitch", "Phrase en gras au-dessus du bouton Google", "sous-titre", "B",
  "Latin « Safrek jay » (ton voyage arrive) ne dit pas « prochain », l'arabe dit « الجاي ». J'aligne les deux sur « ljay ».",
  latn="Safrek ljay, wajed f d9i9a.", arab="سفرك الجاي، واجد ف دقيقة.")
R(G00, "welcome.google", "Bouton principal noir", "CTA ou bouton", "B",
  "La darija latine est en français et la darija arabe en arabe classique. « Kemmel b Google » est court et naturel. L'arabe classique garde la formule officielle de Google.",
  latn="Kemmel b Google", arab="كمّل ب Google")
R(G00, "welcome.free", "Ligne verte sous le bouton Google", "libellé", "B",
  "« carte bancaire » en français dans la darija. Lexique : « karta bankiya / كارطة بنكية ». Arabe classique : une virgule plutôt que « و ».",
  latn="Fabor, bla karta bankiya", arab="فابور، بلا كارطة بنكية", ar="مجاني، دون بطاقة بنكية")
R(G00, "welcome.guest", "Lien souligné à droite de la ligne verte", "lien", "B",
  "« kmmel » s'écrit « kemmel » ailleurs. « compte / كونط » : lexique « 7sab / حساب », clair pour tous.",
  latn="kemmel bla 7sab", arab="كمّل بلا حساب")

# 01 Profil (4 questions) ----------------------------------------------------
R(G01, "common.back", "Bouton flèche en haut à gauche, sur presque tous les écrans" + SR, "CTA ou bouton", "OK", "OK.")
R(G01, "onboarding.step", "Barre de progression en 4 segments" + SR, "libellé", "OK", "OK.")
R(G01, "common.skip", "Lien gris en haut à droite", "CTA ou bouton", "B",
  "« Tjawz » sonne arabe classique. En darija on dit « Fout » (passe). Même mot proposé pour le bouton du plan de vol.",
  latn="Fout", arab="فوت")
R(G01, "onboarding.language.ask", "Bulle de Safar, ligne en gras (question 1)", "message de Safar", "OK", "OK.")
R(G01, "onboarding.language.title", "Bulle de Safar, ligne grise sous la question 1", "message de Safar", "C",
  "Darija OK. Arabe classique plus naturel sous forme de vraie question.", ar="بأي لغة تفضّل أن نتحدث؟")
R(G01, "onboarding.language.groupLabel", "Titre de la feuille Langue, et nom du groupe de cartes" + SR, "libellé", "OK", "OK.")
R(G01, "onboarding.language.scriptLatin", "Carte Darija : après la phrase d'exemple", "libellé", "OK", "OK.")
R(G01, "onboarding.language.scriptArabic", "Carte Darija en lettres arabes : après la phrase d'exemple", "libellé", "OK", "OK.")
R(G01, "onboarding.language.note", "Ligne grise au-dessus du bouton Suivant (question 1)", "texte d'aide", "C",
  "Conventions : 9 pour ق (« t9der », « w9t »), « tbeddel », « lprofil ».",
  latn="T9der tbeddel hadchi w9t ma bghiti f lprofil dyalek.")
R(G01, "common.next", "Bouton principal noir en bas (questions 1 à 3)", "CTA ou bouton", "B",
  "« Taliya / التالية » est de l'arabe classique, et la version arabe est au féminin. « Kemmel » (continue) est le mot naturel.",
  latn="Kemmel", arab="كمّل")
R(G01, "common.finish", "Bouton principal noir à la question 4", "CTA ou bouton", "OK", "OK, « Salina » est parfait.")
R(G01, "onboarding.trip.title", "Bulle de Safar, ligne en gras (question 2)", "message de Safar", "A",
  "« Mnin katkhrej » se comprend « d'où tu sors ». Pour un voyage : « Mnin katsafer ».",
  latn="Mnin katsafer, w m3a men ?", arab="منين كتسافر، ومع من؟")
R(G01, "onboarding.trip.subtitle", "Bulle de Safar, ligne grise (question 2)", "message de Safar", "C",
  "Orthographe : « n3awedch », « nsewwlek ».", latn="Ma n3awedch nsewwlek had sou2al.")
R(G01, "onboarding.trip.airportLabel", "Titre au-dessus de la grille des aéroports", "libellé", "OK", "OK.")
R(G01, "airport.CMN", "Bouton de la grille des aéroports (avec le code CMN à droite)", "chip", "OK", "OK, « Casa » est ce que tout le monde dit.")
R(G01, "airport.RAK", "Bouton de la grille des aéroports", "chip", "OK", "OK.")
R(G01, "airport.RBA", "Bouton de la grille des aéroports", "chip", "OK", "OK.")
R(G01, "airport.TNG", "Bouton de la grille des aéroports", "chip", "OK", "OK.")
R(G01, "airport.FEZ", "Bouton de la grille des aéroports", "chip", "OK", "OK.")
R(G01, "airport.AGA", "Bouton de la grille des aéroports", "chip", "OK", "OK.")
R(G01, "airport.OUD", "Bouton de la grille des aéroports", "chip", "OK", "OK.")
R(G01, "onboarding.trip.companionsLabel", "Titre au-dessus des choix Solo, À deux, En famille, Entre amis", "libellé", "B",
  "« Katsafer » seul ne fait pas un titre. Arabe classique : « تسافر » seul non plus.",
  latn="M3a men katsafer", arab="مع من كتسافر", ar="رفاق السفر")
R(G01, "companions.solo", "Bouton de choix des voyageurs", "chip", "OK", "OK.")
R(G01, "companions.duo", "Bouton de choix des voyageurs", "chip", "B",
  "« Jouj » seul veut dire « deux ». « Bjouj » = à deux. Arabe classique : « ثنائي » sonne « duo », « لشخصين » est plus clair.",
  latn="Bjouj", arab="بجوج", ar="لشخصين")
R(G01, "companions.family", "Bouton de choix des voyageurs", "chip", "OK", "OK.")
R(G01, "companions.friends", "Bouton de choix des voyageurs", "chip", "OK", "OK.")
R(G01, "onboarding.trip.children", "Compteur d'enfants (si En famille), libellé en gras", "libellé", "B",
  "« Drari » veut aussi dire « les gars » à Casablanca. Lexique : « lwlad / الولاد », comme dans l'exemple de l'Accueil.",
  latn="Lwlad", arab="الولاد")
R(G01, "onboarding.trip.childrenLess", "Bouton moins du compteur d'enfants" + SR, "libellé", "B",
  "« Weld 9al » ne se dit pas. Verbe d'action : « Na99es weld ». Arabe classique : verbe aussi.",
  latn="Na99es weld", arab="نقّص ولد", ar="إنقاص طفل")
R(G01, "onboarding.trip.childrenMore", "Bouton plus du compteur d'enfants" + SR, "libellé", "B",
  "Même logique : « Zid weld ».", latn="Zid weld", arab="زيد ولد", ar="إضافة طفل")
R(G01, "onboarding.papers.title", "Bulle de Safar, ligne en gras (question 3)", "message de Safar", "C",
  "Convention 9 pour ق : « lwra9 ».", latn="Lwra9 dyalek")
R(G01, "onboarding.papers.subtitle", "Bulle de Safar, ligne grise (question 3)", "message de Safar", "C",
  "« n9terho » : ح s'écrit 7. Lettres arabes : « اللي », et « ديرهم » comme la latine « dirhom ».",
  latn="Bach n9ter7o 3lik ghir safariyat li t9der dirhom b s7i7.",
  arab="باش نقترحو عليك غير سفريات اللي تقدر ديرهم بصح.")
R(G01, "onboarding.papers.passportLabel", "Titre au-dessus des choix de passeport", "libellé", "C",
  "Lexique : « lpassport ».", latn="Lpassport dyalek")
R(G01, "passport.moroccan", "Bouton de choix du passeport", "chip", "OK", "OK.")
R(G01, "passport.french", "Bouton de choix du passeport", "chip", "B",
  "Lettres arabes en arabe classique (« فرنسي »). En darija : « فرانساوي ». Latin : un seul s.",
  latn="Fransawi", arab="فرانساوي")
R(G01, "passport.both", "Bouton de choix du passeport", "chip", "OK", "OK.")
R(G01, "passport.other", "Bouton de choix du passeport", "chip", "OK", "OK.")
R(G01, "onboarding.papers.schengen", "Interrupteur 1, ligne en gras (si pas de passeport français)", "libellé", "C",
  "Convention ڤ.", arab="ڤيزا شنگن صالحة")
R(G01, "onboarding.papers.schengenHint", "Interrupteur 1, ligne grise", "texte d'aide", "OK", "OK.")
R(G01, "onboarding.papers.passport6m", "Interrupteur 2, ligne en gras", "libellé", "C",
  "Lexique « lpassport », orthographe « chhour ».", latn="Lpassport sal7 kter men 6 chhour")
R(G01, "onboarding.papers.passport6mHint", "Interrupteur 2, ligne grise", "texte d'aide", "B",
  "« charikat » seul = des sociétés, je précise « tiyaran ». « katalbo » / « كيطلبو » : même forme des deux côtés.",
  latn="Bzaf dyal charikat tiyaran kaytelbo hadchi", arab="بزاف ديال شركات الطيران كيطلبو هادشي")
R(G01, "onboarding.papers.card", "Interrupteur 3, ligne en gras", "libellé", "C",
  "Lexique : « karta bankiya / كارطة بنكية ».", latn="Karta bankiya dawliya", arab="كارطة بنكية دولية")
R(G01, "onboarding.papers.cardHint", "Interrupteur 3, ligne grise", "texte d'aide", "C",
  "Darija OK. Arabe classique : pluriel, comme en français.", ar="للدفع لدى الشركاء")
R(G01, "onboarding.papers.note", "Encadré bleu sous les interrupteurs (si pas de visa Schengen)", "texte d'aide", "B",
  "Latin : il manque « d'abord », et « blayes » (endroits) ne dit pas la même chose que l'arabe « البلدان » (pays). « tatleb » s'écrit « tetleb ». Convention ڤ.",
  latn="Bla visa Schengen, kan9ter7 3lik f lwel lbouldan li t9der tmchi lihom bla visa, w nwerrik kifach tetleb Schengen.",
  arab="بلا ڤيزا شنگن، كنقترح عليك ف الأول البلدان اللي تقدر تمشي ليهم بلا ڤيزا، ونوريك كيفاش تطلب شنگن.")
R(G01, "onboarding.style.title", "Bulle de Safar, ligne en gras (question 4), et nom du groupe de cartes", "message de Safar", "C",
  "Darija OK (« style » est compris de tous). Arabe classique : « أسلوب سفرك » est plus clair.", ar="أسلوب سفرك")
R(G01, "onboarding.style.subtitle", "Bulle de Safar, ligne grise (question 4)", "message de Safar", "C",
  "Lettres arabes : « أوطيلات », « اللي ». Arabe classique : « الرحلات » peut vouloir dire « voyages », je précise les vols.",
  arab="باش نختار ليك أوطيلات وطيارات اللي كيعجبوك.", ar="لاختيار الفنادق ورحلات الطيران التي تناسبك.")
R(G01, "style.budget", "Carte de choix du style, titre", "chip", "B",
  "« Budget » est du français, et « بوجي » se lit mal. Lexique : « mizaniya / ميزانية ».",
  latn="Mizaniya sghira", arab="ميزانية صغيرة")
R(G01, "style.budget.hint", "Carte de choix du style, ligne grise", "texte d'aide", "C",
  "Lettres arabes : « أوطيلات ».", arab="أوطيلات 3 نجوم، أحسن ثمن")
R(G01, "style.comfort", "Carte de choix du style, titre", "chip", "OK", "OK, « konfor » se dit couramment.")
R(G01, "style.comfort.hint", "Carte de choix du style, ligne grise", "texte d'aide", "C",
  "Lettres arabes : « أوطيلات ».", arab="أوطيلات 4 نجوم، ف بلاصة مزيانة")
R(G01, "style.premium", "Carte de choix du style, titre", "chip", "B",
  "« Premium » est de l'anglais. En darija on dit « lux ».", latn="Lux", arab="لوكس")
R(G01, "style.premium.hint", "Carte de choix du style, ligne grise", "texte d'aide", "C",
  "Lettres arabes : « أوطيلات ».", arab="أوطيلات 5 نجوم، طيارات ديريكت")
R(G01, "onboarding.style.optionsLabel", "Titre au-dessus des interrupteurs d'options", "libellé", "B",
  "Latin « lkhiyarat », arabe « الاختيارات » : j'aligne sur « lkhtiyar » (comme « 3LACH HAD LKHTIYAR »).",
  latn="Lkhtiyarat")
R(G01, "prefs.direct_only", "Interrupteur d'option, ligne en gras", "libellé", "C",
  "Darija OK. Arabe classique : je précise les vols.", ar="رحلات طيران مباشرة فقط")
R(G01, "prefs.direct_only.hint", "Interrupteur d'option, ligne grise", "texte d'aide", "OK", "OK.")
R(G01, "prefs.breakfast", "Interrupteur d'option, ligne en gras", "libellé", "OK", "OK.")
R(G01, "prefs.breakfast.hint", "Interrupteur d'option, ligne grise", "texte d'aide", "C",
  "Article collé sans apostrophe, « أوطيل ».", latn="F lotel, kol sba7", arab="ف الأوطيل، كل صباح")
R(G01, "prefs.halal", "Interrupteur d'option, ligne en gras", "libellé", "B",
  "« Halal 9rib » ne dit pas ce qui est halal. « Makla 7lal » (nourriture halal), ح = 7.",
  latn="Makla 7lal 9riba", arab="ماكلة حلال قريبة")
R(G01, "prefs.halal.hint", "Interrupteur d'option, ligne grise", "texte d'aide", "C",
  "Article et « أوطيل ».", latn="Ristorat 9rab l lotel", arab="ريسطورات قراب للأوطيل")
R(G01, "prefs.accessibility", "Interrupteur d'option, ligne en gras", "libellé", "OK",
  "OK. « الولوجية » est le terme officiel au Maroc, et la ligne grise « mobilité réduite » lève le doute.")
R(G01, "prefs.accessibility.hint", "Interrupteur d'option, ligne grise", "texte d'aide", "OK", "OK.")
R(G01, "prefs.haptics", "Interrupteur Vibrations, ligne en gras", "libellé", "B",
  "Latin « Vibreur » (le mot du téléphone, très bien) mais arabe « الاهتزاز » (arabe classique). J'aligne.",
  latn="Lvibreur", arab="الڤيبرور")
R(G01, "prefs.haptics.hint", "Interrupteur Vibrations, ligne grise", "texte d'aide", "A",
  "« Rez9a » ne veut pas dire vibration (on entend « رزق »). Proposition simple avec « lmessa » (toucher). Arabe classique : « لمسة » colle mieux au geste.",
  latn="Vibreur khfif m3a kol lmessa", arab="ڤيبرور خفيف مع كل لمسة", ar="اهتزاز خفيف مع كل لمسة")

# 01 Profil, écran Ton profil -------------------------------------------------
R(G01P, "profile.open", "Bouton rond en haut à droite de l'Accueil (initiale)" + SR, "libellé", "C",
  "Article collé : « lprofil ».", latn="Lprofil dyalek")
R(G01P, "profile.title", "Titre de la barre du haut", "titre", "C", "Article collé : « lprofil ».", latn="Lprofil dyalek")
R(G01P, "profile.account", "Encart Compte, ligne en gras", "libellé", "OK", "OK.")
R(G01P, "profile.anonymous", "Encart Compte, ligne grise (sans connexion)", "texte d'aide", "B",
  "« b9a » = il est resté (passé). « ba9i » = il reste.", latn="Lprofil dyalek ba9i f had ttilifoun.")
R(G01P, "common.signedInAs", "Encart Compte, ligne grise (connecté)", "statut", "OK", "OK.")
R(G01P, "profile.keepWithGoogle", "Bouton secondaire de l'encart Compte (sans connexion)", "CTA ou bouton", "B",
  "« 7tafed b » est lourd. « Sjjel » (enregistre) est court et clair. Même tournure pour le bouton du Dossier.",
  latn="Sjjel lprofil b Google", arab="سجّل البروفيل ب Google")
R(G01P, "common.signOut", "Bouton secondaire de l'encart Compte (connecté)", "CTA ou bouton", "C",
  "Bouton : verbe d'action « Khrej ».", latn="Khrej", arab="خرج")
R(G01P, "profile.sectionLanguage", "Titre de section en petites capitales", "libellé", "OK", "OK.")
R(G01P, "profile.sectionTrip", "Titre de section en petites capitales", "libellé", "B",
  "« Lkhrouj » se comprend « la sortie ». La section contient l'aéroport et les voyageurs.",
  latn="Lmatar w li m3ak", arab="المطار واللي معاك", ar="مطار الانطلاق والمرافقون")
R(G01P, "profile.sectionPapers", "Titre de section en petites capitales", "libellé", "C", "Convention 9.", latn="Lwra9")
R(G01P, "profile.sectionStyle", "Titre de section en petites capitales", "libellé", "OK", "OK.")
R(G01P, "profile.restart", "Lien en bas de l'écran", "lien", "C",
  "Darija OK. Arabe classique : on refait les réponses, pas les questions.", ar="أعد الإجابة عن الأسئلة الأربعة")

# 01 ter Confiance ------------------------------------------------------------
R(G01T, "trust.title", "Feuille du bas : bulle de Safar, ligne en gras", "message de Safar", "OK", "OK.")
R(G01T, "trust.subtitle", "Bulle de Safar, ligne grise", "message de Safar", "C",
  "Lettres arabes : « اللي ».", arab="اللي كتشوف هو اللي غادي تخلص، بالدرهم.")
R(G01T, "trust.point.live", "Ligne 1 avec icône avion (début en gras)", "libellé", "A",
  "« direct » veut dire « vol sans escale » partout ailleurs dans l'app. Ici le sens est « en temps réel ». Même piège en arabe classique (« مباشرة »). Lexique « en direct » : « b taman dyal daba » / « بأسعار آنية ».",
  latn="**Tiyarat w otelat b taman dyal daba**, 3end chouraka m3roufin.",
  arab="**طيارات وأوطيلات بالثمن ديال دابا**، عند شركاء معروفين.",
  ar="**رحلات طيران وفنادق بأسعار آنية**، لدى شركاء معروفين.")
R(G01T, "trust.point.total", "Ligne 2 avec icône portefeuille", "libellé", "OK", "OK.")
R(G01T, "trust.point.partner", "Ligne 3 avec icône bouclier", "libellé", "C",
  "Convention 9 : « kay9iss ».", latn="**Katkhelles 3end charik.** BonSafar 3emmro ma kay9iss flousek.")
R(G01T, "trust.cta", "Bouton principal noir", "CTA ou bouton", "OK", "OK (maquette « Mfhoum »).")

# 02 Accueil ------------------------------------------------------------------
R(G02, "home.title", "Gros titre en haut (sans prénom)", "titre", "C",
  "Texte de la maquette, OK. Lettres arabes : pas d'espace avant « ! » et « ؟ ».", arab="سلام!\nفين بغيتي تسافر؟")
R(G02, "home.titleNamed", "Gros titre en haut (avec prénom)", "titre", "C",
  "Idem.", arab="سلام {name}!\nفين بغيتي تسافر؟")
R(G02, "home.subtitle", "Ligne grise sous le titre", "sous-titre", "C",
  "« bhal f WhatsApp » (comme sur). Lettres arabes : « قول » comme « قولها » de l'écran 00 (si tu préfères « گ », dis-le et je l'applique aux deux).",
  latn="Goul liya kolchi, bhal f WhatsApp.", arab="قول ليا كلشي، بحال ف واتساب.")
R(G02, "home.bubble", "Bulle de Safar à côté du micro, ligne en gras", "message de Safar", "C",
  "Darija OK (maquette). Arabe classique : le geste est un appui long.", ar="اضغط مطولًا وتحدث")
R(G02, "home.bubbleHint", "Bulle de Safar, ligne grise", "message de Safar", "C",
  "Articles et orthographe « fransawiya ».", latn="Kanfhem ddarija w lfransawiya.")
R(G02, "home.bubbleWrite", "Bulle de Safar, ligne en gras quand le clavier est ouvert", "message de Safar", "B",
  "« Ktebha liya » : on ne sait pas ce que « ha » désigne. Le français dit « ton voyage ».",
  latn="Kteb liya safar dyalek", arab="كتب ليا السفر ديالك", ar="اكتب لي رحلتك")
R(G02, "home.bubbleWriteHint", "Bulle de Safar, ligne grise quand le clavier est ouvert", "message de Safar", "C",
  "Orthographe et articles. « النگليزية » comme on le dit.",
  latn="Kan9ra ddarija, lfransawiya w lngliziya.", arab="كنقرا الدارجة، الفرنسية والنگليزية.")
R(G02, "home.micLabel", "Bouton micro noir au centre" + SR, "libellé", "B",
  "Le français dit « maintiens ». « Brek w hder » ne dit pas de garder le doigt appuyé.",
  latn="Khelli sb3ek m7tout w hder", arab="خلي صبعك محطوط وهضر", ar="اضغط مطولًا وتحدث")
R(G02, "home.holdLead", "Sous le micro, mot en gras au début de la ligne « Brek w hder · darija wla fransawiya »", "texte d'aide", "C",
  "Darija OK (maquette). Arabe classique : « مطولًا », comme la bulle.", ar="اضغط مطولًا")
R(G02, "home.holdRest", "Sous le micro, suite de la même ligne", "texte d'aide", "C",
  "Orthographe « fransawiya ». Arabe classique : « بالدارجة ».",
  latn="w hder · darija wla fransawiya", ar="للتحدث · بالدارجة أو الفرنسية")
R(G02, "home.ideasVisa", "Étiquette en petites capitales au-dessus des cartes idées (si toutes sans visa)", "libellé", "C",
  "Convention ڤ, arabe classique « بدون ».", arab="أفكار بلا ڤيزا ليك", ar="أفكار بدون تأشيرة لك")
R(G02, "home.ideasLabel", "Même étiquette (si une idée demande un visa), et nom de la zone" + SR, "libellé", "B",
  "Latin et arabe disent « idées de voyage », le français « idées pour toi ». J'aligne sur l'étiquette voisine.",
  latn="AFKAR LIK", arab="أفكار ليك")
R(G02, "home.muse", "Badge sur l'image de chaque carte idée", "libellé", "OK", "OK (nom du modèle).")
R(G02, "idea.istanbul.title", "Carte idée Istanbul, titre en gras", "titre", "OK", "OK.")
R(G02, "idea.istanbul.sub", "Carte idée Istanbul, ligne verte", "texte d'aide", "B",
  "Lettres arabes : « 4 س 40 د الطيارة » se lit mal (« د » = minutes ou « ديال » ?). Convention ڤ. Arabe classique plus fluide.",
  arab="بلا ڤيزا · 4 س 40 ف الطيارة", ar="بدون تأشيرة · رحلة 4 س 40 د")
R(G02, "idea.paris.title", "Carte idée Paris, titre en gras", "titre", "C",
  "Lettres arabes : il manque « ف ». Arabe classique : plus court pour la carte.",
  arab="باريس ف ويكاند", ar="باريس لعطلة نهاية الأسبوع")
R(G02, "idea.paris.sub", "Carte idée Paris, ligne grise (visa demandé)", "texte d'aide", "C",
  "Même logique que la carte Istanbul.", arab="3 س ف الطيارة · ڤيزا شنگن", ar="رحلة 3 س · تأشيرة شنغن")
R(G02, "idea.paris.subFree", "Carte idée Paris, ligne verte (Schengen déjà là)", "texte d'aide", "C",
  "Même logique.", arab="3 س ف الطيارة · بلا ڤيزا", ar="رحلة 3 س · بدون تأشيرة")
R(G02, "idea.omra.title", "Carte idée Omra, titre en gras", "titre", "OK", "OK.")
R(G02, "idea.omra.sub", "Carte idée Omra, ligne grise", "texte d'aide", "C", "Convention 9.", latn="Lwra9 khatwa b khatwa")
R(G02, "idea.tunis.title", "Carte idée Tunis, titre en gras", "titre", "OK", "OK.")
R(G02, "idea.tunis.sub", "Carte idée Tunis, ligne verte", "texte d'aide", "C", "Convention ڤ.", arab="بلا ڤيزا")
R(G02, "idea.barcelona.title", "Carte idée Barcelone, titre en gras", "titre", "C",
  "Lettres arabes : il manque « ف ».", arab="برشلونة ف ويكاند")
R(G02, "idea.barcelona.sub", "Carte idée Barcelone, ligne grise (visa demandé)", "texte d'aide", "C",
  "Convention ڤ.", arab="ڤيزا شنگن")
R(G02, "idea.barcelona.subFree", "Carte idée Barcelone, ligne verte", "texte d'aide", "C", "Convention ڤ.", arab="بلا ڤيزا")
R(G02, "home.writeLabel", "Champ texte en bas" + SR, "libellé", "OK", "OK.")
R(G02, "home.example.istanbul", "Exemples qui défilent dans le champ texte vide", "placeholder", "OK", "OK, très naturel.")
R(G02, "home.example.marrakech", "Exemples qui défilent dans le champ texte vide", "placeholder", "B",
  "Lettres arabes « ب بيسيين » ne suit pas la latine « fih lpisin ». J'aligne, et « ويكاند » comme ailleurs.",
  arab="ويكاند ف مراكش، أوطيل فيه البيسين")
R(G02, "home.example.visa", "Exemples qui défilent dans le champ texte vide", "placeholder", "C",
  "Convention ڤ.", arab="فين نمشي بلا ڤيزا هاد الصيف؟")
R(G02, "home.example.family", "Exemples qui défilent dans le champ texte vide", "placeholder", "OK", "OK.")
R(G02, "home.chip.istanbul", "Chips au-dessus du clavier (quand on écrit)", "chip", "OK", "OK.")
R(G02, "home.chip.visa", "Chips au-dessus du clavier", "chip", "C", "Convention ڤ.", arab="بلا ڤيزا هاد الصيف")
R(G02, "home.chip.marrakech", "Chips au-dessus du clavier", "chip", "C",
  "Lettres arabes « ويكاند ». Arabe classique : « عطلة » seul perd l'idée de week-end.",
  arab="ويكاند ف مراكش", ar="نهاية أسبوع في مراكش")
R(G02, "home.send", "Bouton envoyer du champ texte, et de la carte question de l'écran 04" + SR, "libellé", "OK", "OK.")

# 03 Vocal --------------------------------------------------------------------
R(G03, "voice.pill", "Pastille en haut avec point rouge", "statut", "OK", "OK.")
R(G03, "voice.paused", "Même pastille, en pause", "statut", "OK", "OK.")
R(G03, "voice.subtitle", "Ligne grise sous les mots", "message de Safar", "C",
  "Convention 9 : « w9tek ».", latn="Kansme3 lik. Khoud w9tek.")
R(G03, "voice.slideLock", "Au-dessus de la barre du bas, avec un cadenas", "texte d'aide", "B",
  "« tsedd » = fermer. Pour verrouiller : « t9fel ». Convention 9.",
  latn="Jerr l fou9 bach t9fel", arab="جرّ لفوق باش تقفل")
R(G03, "voice.locked", "Même place, une fois verrouillé", "statut", "B",
  "« Msdoud / tlaq chacha » donne « fermé, lâche l'écran ». Plus naturel : « verrouillé, tu peux enlever ton doigt ».",
  latn="M9foul: t9der t7iyed sb3ek", arab="مقفول: تقدر تحيد صبعك", ar="مُقفل: يمكنك رفع إصبعك")
R(G03, "voice.slideCancel", "Dans la barre du bas, à gauche du micro bleu", "texte d'aide", "C",
  "Latin OK. Lettres arabes : « للجهة » est vague, « للجنب » est naturel. L'écran est inversé en arabe : ne pas écrire « gauche ».",
  arab="جرّ للجنب باش تلغي")
R(G03, "voice.delete", "Bouton poubelle rouge (une fois verrouillé)" + SR, "libellé", "C",
  "Article collé, convention ڤ.", latn="Mse7 lvocal", arab="مسح الڤوكال")
R(G03, "voice.max", "Petit texte gris à droite du chrono", "libellé", "C",
  "Orthographe « 7tta ». Arabe classique : « حتى 1:00 » peut se lire « jusqu'à une heure ».",
  latn="7tta 1:00", ar="الحد الأقصى 1:00")
R(G03, "voice.pause", "Bouton pause (une fois verrouillé)" + SR, "libellé", "C", "Convention 9.", latn="W9ef")
R(G03, "voice.resume", "Même bouton, en pause" + SR, "libellé", "C",
  "Orthographe « kemmel ». Arabe classique : « استئناف ».", latn="Kemmel", ar="استئناف")
R(G03, "voice.send", "Bouton noir envoyer (une fois verrouillé)" + SR, "libellé", "C",
  "Article collé, convention ڤ.", latn="Sifet lvocal", arab="صيفط الڤوكال")

# 04 Compris ------------------------------------------------------------------
R(G04, "understood.title", "Titre en haut", "titre", "OK", "OK.")
R(G04, "understood.enToggle", "Interrupteur en haut à droite" + SR, "libellé", "C",
  "Il manque « b » en latin. « النگليزية ».", latn="B lngliziya f kolchi", arab="بالنگليزية ف كلشي")
R(G04, "understood.play", "Bouton lecture de la bulle vocale bleue" + SR, "libellé", "C",
  "Article collé, convention ڤ. Arabe classique : « الصوتية ».",
  latn="Sme3 lvocal", arab="سمع الڤوكال", ar="استمع إلى الرسالة الصوتية")
R(G04, "understood.pauseAudio", "Même bouton pendant la lecture" + SR, "libellé", "C",
  "Convention 9 et ڤ.", latn="W9ef lvocal", arab="وقف الڤوكال", ar="أوقف الرسالة الصوتية")
R(G04, "understood.transcribing", "Bulle de Safar pendant l'écriture (texte qui brille)", "message de Safar", "C",
  "Lettres arabes alignées sur la latine « klamek ».", arab="كنكتب كلامك…")
R(G04, "understood.thinking", "Bulle de Safar pendant la compréhension", "message de Safar", "OK", "OK.")
R(G04, "understood.safar", "Bulle de Safar content, quand tout est compris", "message de Safar", "OK", "OK.")
R(G04, "understood.originLead", "Encadré vert sous les chips, début en gras : « Départ de Casa (CMN) »", "libellé", "B",
  "« Khrouj mn » se comprend « sortie de ». Plus naturel : « Ghadi tsafer men ».",
  latn="Ghadi tsafer men {city}", arab="غادي تسافر من {city}")
R(G04, "understood.originTail", "Même encadré, suite de la phrase", "libellé", "B",
  "Latin « 7sab », arabe « على حساب » : j'aligne.", latn=", 3la 7sab lprofil dyalek.")
R(G04, "understood.noQuestion", "Même encadré, fin de la phrase", "message de Safar", "B",
  "« ntsqek » n'est pas compris partout (mot du Nord). « nsewwlek » est celui de Casa. Arabe classique plus naturel.",
  latn="Ma b9a walo nsewwlek 3lih.", arab="ما بقا والو نسولك عليه.", ar="لم يبق لديّ أي سؤال.")
R(G04, "understood.questionBadge", "Badge jaune sur la carte question", "statut", "OK", "OK.")
R(G04, "understood.answerPlaceholder", "Champ réponse de la carte question", "placeholder", "OK", "OK.")
R(G04, "understood.otherAnswer", "Bouton sous les réponses rapides de la carte question", "CTA ou bouton", "OK", "OK.")
R(G04, "chip.noDestination", "Chip blanche quand la ville manque", "chip", "C",
  "Darija OK. Arabe classique : « الوجهة للاختيار » est maladroit.", ar="اختر الوجهة")
R(G04, "chip.noDates", "Chip blanche quand les dates manquent", "chip", "C",
  "Darija OK. Arabe classique : même remarque.", ar="اختر التواريخ")
R(G04, "chip.dateRange", "Chip dates", "chip", "OK", "OK.")
R(G04, "chip.dateFrom", "Chip dates (sans date de retour)", "chip", "OK", "OK.")
R(G04, "chip.adults.one", "Chip voyageurs", "chip", "OK", "OK.")
R(G04, "chip.adults.other", "Chip voyageurs", "chip", "OK", "OK.")
R(G04, "chip.children.one", "Chip enfants", "chip", "OK", "OK.")
R(G04, "chip.children.other", "Chip enfants", "chip", "B",
  "Lexique « wlad / ولاد » (voir « Enfants » au profil).", latn="{count} wlad", arab="{count} ولاد")
R(G04, "chip.budget", "Chip budget", "chip", "OK", "OK.")
R(G04, "edit.destination", "Titre du tiroir quand on touche la chip ville", "titre", "OK", "OK.")
R(G04, "edit.cityPlaceholder", "Champ ville dans le tiroir", "placeholder", "OK", "OK.")
R(G04, "edit.dates", "Titre du tiroir dates", "titre", "OK", "OK.")
R(G04, "edit.depart", "Tiroir dates : libellé du champ aller", "libellé", "B",
  "Lettres arabes en arabe classique (« الذهاب »). En darija : « المشي », comme la latine.", arab="المشي")
R(G04, "edit.return", "Tiroir dates : libellé du champ retour", "libellé", "OK", "OK.")
R(G04, "edit.travellers", "Titre du tiroir voyageurs", "titre", "C", "Latin aligné sur l'arabe « المسافرين ».", latn="Lmsafrin")
R(G04, "edit.adults", "Tiroir voyageurs : compteur adultes", "libellé", "OK", "OK.")
R(G04, "edit.children", "Tiroir voyageurs : compteur enfants", "libellé", "B", "Lexique « lwlad ».", latn="Lwlad", arab="الولاد")
R(G04, "edit.budget", "Titre du tiroir budget, et champ", "titre", "B", "Lexique « mizaniya ».",
  latn="Lmizaniya b derham", arab="الميزانية بالدرهم")
R(G04, "edit.wish", "Titre du tiroir d'une envie (ex. piscine)", "titre", "C",
  "Latin aligné sur l'arabe « اللي بغيتي ».", latn="Li bghiti")
R(G04, "edit.less", "Bouton moins des compteurs du tiroir" + SR, "libellé", "B",
  "Verbe d'action, comme pour les enfants du profil.", latn="N9es", arab="نقّص")
R(G04, "edit.more", "Bouton plus des compteurs du tiroir" + SR, "libellé", "B", "Idem.", latn="Zid", arab="زيد")
R(G04, "common.save", "Bouton principal du tiroir d'édition", "CTA ou bouton", "OK", "OK.")
R(G04, "common.remove", "Bouton du tiroir d'une envie", "CTA ou bouton", "OK", "OK.")
R(G04, "understood.tapHint", "Ligne grise au-dessus du bouton principal", "texte d'aide", "B",
  "« Dghhet » (appuyer fort) : lexique « brek », déjà utilisé pour le micro.",
  latn="Brek 3la chi 7aja bach tbeddelha.", arab="برك على شي حاجة باش تبدلها.")
R(G04, "understood.go", "Bouton principal noir en bas", "CTA ou bouton", "C",
  "Texte de la maquette. Seule la convention 9 change la latine (« 9elleb »). À toi de trancher : la règle du projet dit de garder la maquette.",
  latn="Yallah, 9elleb !", arab="يالله، قلّب!")

# 05 Plan de vol --------------------------------------------------------------
R(G05, "plan.title", "Gros titre en haut, sur 2 lignes", "titre", "A",
  "« Safar kaywjjed safar dyalek » : le nom de la mascotte et le mot « voyage » se suivent, on ne sait plus qui est qui. Si le jeu de mots n'est pas voulu, voici une version claire.",
  latn="Safar kaywejjed lik\nkolchi", arab="سافار كيوجد ليك\nكلشي")
R(G05, "plan.skip", "Bouton gris en haut à droite (sauter l'animation)", "CTA ou bouton", "B",
  "Même mot que « Passer » du profil : « Fout ». Arabe classique : « تخطي » comme au profil.",
  latn="Fout", arab="فوت", ar="تخطي")
R(G05, "plan.replay", "Ligne orange en haut, seulement si c'est un enregistrement rejoué", "statut", "B",
  "Latin « replay » : OK (badge exigé par la règle d'honnêteté). Lettres arabes « إعادة » ne dit pas que c'est enregistré.",
  arab="مسجّل من قبل", ar="تسجيل سابق")
R(G05, "plan.captured", "Même ligne orange, suite : heure de capture des prix", "statut", "B",
  "« tcheddu » (attrapés) est flou. « Las3ar dyal {time} » (les prix de telle heure) est clair.",
  latn="Las3ar dyal {time}", arab="الأسعار ديال {time}", ar="أسعار مسجّلة {time}")
R(G05, "plan.step.flights", "Escale 1 de la route : titre en gras", "message de Safar", "C",
  "Texte de la maquette. Convention 9 : « Kan9elleb » (même question que « Yallah, qelleb »). Arabe classique : je précise les vols.",
  latn="Kan9elleb 3la ttiyarat", ar="أبحث عن رحلات الطيران")
R(G05, "plan.step.flights.hint", "Escale 1 : ligne grise sous le titre", "texte d'aide", "A",
  "« direct » = sans escale ailleurs dans l'app. Ici c'est « en temps réel ». Lexique : « daba / دابا / آنيًا ».",
  latn="Kiwi.com, daba", arab="Kiwi.com، دابا", ar="Kiwi.com، آنيًا")
R(G05, "plan.step.hotels", "Escale 2 : titre en gras", "message de Safar", "C",
  "Maquette « Kanqarn l'otelat ». Convention : « Kan9aren lotelat », « أوطيلات ».",
  latn="Kan9aren lotelat", arab="كنقارن الأوطيلات")
R(G05, "plan.step.hotels.hint", "Escale 2 : ligne grise", "texte d'aide", "A",
  "Même piège « direct ».", latn="trivago, daba", arab="trivago، دابا", ar="trivago، آنيًا")
R(G05, "plan.step.price_trends", "Escale 3 : titre en gras", "message de Safar", "C",
  "Maquette. Article collé.", latn="Kanchouf las3ar")
R(G05, "plan.step.price_trends.hint", "Escale 3 : ligne grise", "texte d'aide", "C",
  "Orthographe, « أوطيلات ».", latn="As3ar lotelat chher b chher", arab="أسعار الأوطيلات شهر بشهر")
R(G05, "plan.step.entry_requirements", "Escale 4 : titre en gras", "message de Safar", "B",
  "Latin « Kanverifi » (français), arabe « كنتحقق ». Lexique « t7e99e9 ». (Maquette : « Kanverifi l'wraq ».)",
  latn="Kant7e99e9 men lwra9")
R(G05, "plan.step.entry_requirements.hint", "Escale 4 : ligne grise", "texte d'aide", "OK", "OK.")
R(G05, "plan.step.package", "Escale 5 : titre en gras", "message de Safar", "C",
  "Maquette. Orthographe « kanwejjed », article collé.", latn="Kanwejjed lik lforfait")
R(G05, "plan.step.package.hint", "Escale 5 : ligne grise", "texte d'aide", "B",
  "Latin « m3a ba3d », arabe « مجموعين » : j'aligne, et « أوطيل ».",
  latn="Ttiyara, lotel w lwra9 m3a ba3d", arab="الطيارة، الأوطيل والوراق مع بعض")
R(G05, "plan.status.next", "Badge gris à droite d'une escale (à venir)", "statut", "OK", "OK.")
R(G05, "plan.status.running", "Badge bleu (en cours)", "statut", "C", "Orthographe « khddam ».", latn="KHDDAM")
R(G05, "plan.status.done", "Badge vert (terminé)", "statut", "B",
  "Latin « SALIT » (j'ai fini), arabe « سالى » (il a fini). Pour un statut : « SALA » (c'est fini).",
  latn="SALA", arab="سالا")
R(G05, "plan.status.error", "Badge orange (à vérifier)", "statut", "A",
  "« TCHUF / تشوف » veut dire « tu vas voir », pas « à vérifier ». Lexique : « khass tchouf ».",
  latn="KHASS TCHOUF", arab="خاص تشوف")
R(G05, "plan.flightsCount", "Badge vert de l'escale 1 quand les vols sont trouvés", "statut", "B",
  "Accord des nombres : au-delà de 10, la darija et l'arabe passent au singulier (« 15 tiyara », « 15 رحلة »). La forme « libellé : nombre » marche pour tous les nombres.",
  latn="TIYARAT: {count}", arab="طيارات: {count}", ar="رحلات: {count}")
R(G05, "plan.hotelsCount", "Badge vert de l'escale 2 quand les hôtels sont trouvés", "statut", "B",
  "Idem.", latn="OTELAT: {count}", arab="أوطيلات: {count}", ar="فنادق: {count}")
R(G05, "plan.direct", "Sous chaque vol de l'escale 1, et badge jaune de la fiche forfait (07)", "statut", "OK",
  "OK. C'est le seul sens de « direct » à garder dans l'app.")
R(G05, "plan.stops.one", "Sous un vol de l'escale 1, et badge jaune de la fiche forfait (07)", "statut", "OK", "OK.")
R(G05, "plan.stops.other", "Sous un vol de l'escale 1, et ligne retour de la fiche forfait (07)", "statut", "OK", "OK.")
R(G05, "plan.visa.title", "Encadré orange sous la route (si visa demandé)", "titre", "OK",
  "OK. La fin de la phrase vient des types de visa juste en dessous.")
R(G05, "visaKind.none", "Fin de l'encadré visa, et petite ligne de la tuile Visa (08)", "statut", "OK", "OK (rarement affiché).")
R(G05, "visaKind.schengen", "Fin de l'encadré visa, et tuile Visa (08)", "statut", "OK", "OK.")
R(G05, "visaKind.evisa", "Fin de l'encadré visa, et tuile Visa (08)", "statut", "B",
  "« khassha visa e-visa » répète « visa ». Proposition : visa « sur internet ».",
  latn="f linternet", arab="ف الأنترنيت", ar="إلكترونية")
R(G05, "visaKind.on_arrival", "Fin de l'encadré visa, et tuile Visa (08)", "statut", "C",
  "« 3end lwsoul » (à l'arrivée) est plus clair que « f lwsoul ».", latn="3end lwsoul", arab="عند الوصول")
R(G05, "visaKind.consular", "Fin de l'encadré visa, et tuile Visa (08)", "statut", "B",
  "« khassha visa consulat » ne se dit pas. « men l9onsoliya » (du consulat).",
  latn="men l9onsoliya", arab="من القنصلية")
R(G05, "visaKind.unknown", "Fin de l'encadré visa, et tuile Visa (08)", "statut", "A",
  "« visa tchuf » ne veut rien dire. Lexique « khass tchouf ».",
  latn="(khass tchouf)", arab="(خاص تشوف)", ar="(يجب التحقق)")
R(G05, "plan.visa.source", "Lien sous l'encadré visa : « Source · nom du site »", "lien", "OK", "OK.")
R(G05, "plan.alt.title", "Bandeau vert au-dessus de la 2e route (destination sans visa)", "titre", "B",
  "Latin « Blasa », arabe « وجهة » (arabe classique). Lexique « blasa / بلاصة », ڤ. Arabe classique : « بدون ».",
  arab="بلاصة بلا ڤيزا: {city}", ar="وجهة بدون تأشيرة: {city}")
R(G05, "plan.landed", "Ligne verte en bas de la route", "message de Safar", "C",
  "Article collé, pas d'espace avant « : » en arabe.",
  latn="Hbetna: lforfait dyalek wajed", arab="هبطنا: الفورفي ديالك واجد")
R(G05, "plan.replayLast", "Bouton secondaire du bloc d'erreur", "CTA ou bouton", "OK", "OK.")
R(G05, "plan.pricesNote", "Encadré gris en bas de la feuille (icône bouclier)", "texte d'aide", "C",
  "Darija OK (« direct » veut dire « directement », c'est juste ici). J'ajoute « jamais » partout.",
  latn="Las3ar jayin direct men **Kiwi.com** w **trivago**. Safar 3emmro ma kaykhtare3hom.",
  arab="الأسعار جايين ديريكت من **Kiwi.com** و**trivago**. سافار عمرو ما كيخترعهم.",
  ar="الأسعار تأتي مباشرة من **Kiwi.com** و**trivago**. سافار لا يخترعها أبدًا.")

# 06 Résultat -----------------------------------------------------------------
R(G06, "result.title", "Titre de la feuille blanche", "titre", "C", "Article collé.", latn="Lforfait dyalek")
R(G06, "result.subtitle", "Ligne grise sous le titre", "sous-titre", "A",
  "Lettres arabes : « هادا هو الفورفي ديالك · 3 خيارات » ne dit pas la même chose que la latine. J'aligne les deux sur « j'ai comparé pour toi ».",
  latn="9arent lik {count} d lkhtiyarat", arab="قارنت ليك {count} ديال الاختيارات")
R(G06, "result.share", "Bouton rond Partager en haut à droite" + SR, "libellé", "OK", "OK.")
R(G06, "result.recommended", "Badge vert sur la 1re offre", "statut", "C", "Convention 9.", latn="MO9TARA7")
R(G06, "result.direct", "Badge bleu", "statut", "OK", "OK.")
R(G06, "result.cheapest", "Badge orange", "statut", "A",
  "Lettres arabes « رخص » sans article peut se lire « رُخَص » (permis). « الأرخص » est sans ambiguïté.",
  latn="LERKHES", arab="الأرخص")
R(G06, "result.nightsLabel", "Sous le chiffre de nuits, à gauche de chaque offre", "libellé", "OK", "OK.")
R(G06, "result.landed", "Ligne en bas : « Atterri en 42 s · 5 étapes · Voir comment »", "statut", "C",
  "Darija OK. Arabe classique aligné sur « nous ».", ar="هبطنا خلال {time} · 5 خطوات")
R(G06, "result.how", "Lien bleu à la fin de cette ligne", "lien", "OK", "OK.")

# 07 Forfait ------------------------------------------------------------------
R(G07, "package.departIn", "Ligne verte sous le titre « Casablanca → Istanbul »", "statut", "B",
  "« Lmchi men daba 41 youm » est mal construit. « B9aw 41 youm l ssafar » (il reste 41 jours) est naturel. Nombre : de 3 à 10, on dirait « ayyam ».",
  latn="B9aw {days} youm l ssafar · {nights} lyali", arab="بقاو {days} يوم للسفر · {nights} ليالي")
R(G07, "package.departToday", "Même ligne, départ le jour même", "statut", "B",
  "« Ssafar lyoum » est plus naturel (« lyouma » se dit surtout au Nord).",
  latn="Ssafar lyoum · {nights} lyali", arab="السفر اليوم · {nights} ليالي")
R(G07, "package.departPast", "Même ligne, dates passées", "statut", "OK", "OK.")
R(G07, "notice.visa_needed", "Bandeau orange sous le titre", "statut", "B",
  "Latin « tlbt » (j'ai demandé), arabe « طلبتي » (tu as demandé). Convention ڤ.",
  latn="Khass visa l lmdina li tlebti.", arab="خاص ڤيزا للمدينة اللي طلبتي.")
R(G07, "notice.visa_free_alternative", "Bandeau orange sous le titre", "statut", "B",
  "Il manque le verbe. Lexique « blasa ».",
  latn="Had lforfait ghadi l blasa bla visa.", arab="هاد الفورفي غادي لبلاصة بلا ڤيزا.")
R(G07, "notice.passport_validity_check", "Bandeau orange sous le titre", "statut", "B",
  "Il manque « assez longtemps ».",
  latn="Chouf wach lpassport ghadi yb9a sal7 wa9t kafi men b3d ma twsel.",
  arab="شوف واش الباسبور غادي يبقى صالح وقت كافي من بعد ما توصل.")
R(G07, "notice.passengers_mismatch", "Bandeau orange sous le titre", "statut", "C",
  "Je précise « de personnes ».",
  latn="Taman ttiyara ma kayghettich nefs l3adad d nnas.", arab="ثمن الطيارة ما كيغطّيش نفس العدد ديال الناس.")
R(G07, "notice.hotel_filters_relaxed", "Bandeau orange sous le titre", "statut", "B",
  "« Filtres » est du français. Plus simple : « on a élargi la recherche ».",
  latn="Wesse3na lb7ath 3la lotel bach nl9aw bit.", arab="وسعنا البحث على الأوطيل باش نلقاو بيت.")
R(G07, "notice.guardrail_scrubbed", "Bandeau orange sous le titre", "statut", "OK", "OK.")
R(G07, "package.return", "Ligne retour sous la carte du vol, mot en gras", "libellé", "OK", "OK.")
R(G07, "package.reviews", "Carte hôtel, sous le nom : « 9,3 · 1 086 avis »", "libellé", "C", "Hamza : « ra2y ».", latn="{count} ra2y")
R(G07, "package.breakfastYes", "Carte hôtel, ligne 3", "libellé", "C",
  "Darija OK. Arabe classique : lexique « الفطور ».", ar="الفطور مشمول")
R(G07, "package.breakfastNo", "Carte hôtel, ligne 3", "libellé", "C", "Lexique « الفطور ».", ar="بدون فطور")
R(G07, "package.cancelYes", "Carte hôtel, suite de la ligne 3", "libellé", "B",
  "Latin « Tlghi bla flous », arabe « الإلغاء بلا فلوس » : j'aligne sur une phrase simple.",
  latn="T9der tlghi fabor", arab="تقدر تلغي فابور")
R(G07, "package.cancelNo", "Carte hôtel, suite de la ligne 3", "libellé", "B",
  "« Ma kaytraddch » est flou. On parle de l'argent : « on ne rend pas l'argent ».",
  latn="Ma kayrejj3ouch lflous", arab="ما كيرجعوش الفلوس")
R(G07, "package.before", "Titre en petites capitales au-dessus des 4 tuiles", "titre", "C",
  "« 9bel ma tsafer » est plus juste que « temchi » pour un voyage.", latn="9BEL MA TSAFER", arab="قبل ما تسافر")
R(G07, "package.why", "Titre de section en petites capitales", "titre", "OK", "OK.")
R(G07, "package.tip", "Titre bleu de la carte conseil (la carte avec le halo)", "titre", "B",
  "« NASIHAT » et « نصيحة سافار » sont de l'arabe classique. En darija : « nasi7a dyal Safar ».",
  latn="NASI7A DYAL SAFAR", arab="النصيحة ديال سافار")
R(G07, "package.tipFaster", "Carte conseil : « +167 € ≈ 1 804 DH pour 4 h 15 de moins »", "message de Safar", "B",
  "« 3la 4 h 15 9al » se comprend mal. « w trbe7 4 h 15 » (et tu gagnes 4 h 15) est clair. Les montants restent calculés par le code.",
  latn="{eur} ≈ {mad} w trbe7 {duration}", arab="{eur} ≈ {mad} وتربح {duration}", ar="{eur} ≈ {mad} لتوفير {duration}")
R(G07, "package.tipFasterMad", "Même carte, sans prix en euros", "message de Safar", "B",
  "Idem.", latn="{mad} w trbe7 {duration}", arab="{mad} وتربح {duration}", ar="{mad} لتوفير {duration}")
R(G07, "package.tipSlower", "Même carte, quand l'option est moins chère mais plus lente", "message de Safar", "B",
  "« 3la 3 h kter » : « w tzid 3 h f ttri9 » (et tu ajoutes 3 h de trajet).",
  latn="{eur} ≈ {mad} w tzid {duration} f ttri9", arab="{eur} ≈ {mad} وتزيد {duration} ف الطريق",
  ar="{eur} ≈ {mad} مقابل {duration} إضافية")
R(G07, "package.tipSlowerMad", "Même carte, sans prix en euros", "message de Safar", "B",
  "Idem.", latn="{mad} w tzid {duration} f ttri9", arab="{mad} وتزيد {duration} ف الطريق", ar="{mad} مقابل {duration} إضافية")
R(G07, "package.trends", "Titre du graphique des prix d'hôtel par mois", "titre", "C",
  "Aligné sur l'escale 3 (« chher b chher »).", latn="AS3AR LOTELAT CHHER B CHHER", arab="أسعار الأوطيلات شهر بشهر")
R(G07, "package.cheapestMonth", "Sous la barre verte du mois le moins cher (très petit)", "statut", "B",
  "Latin « Rkhis » (pas cher), arabe « رخص شهر ». Comme le badge du résultat : « Lerkhes / الأرخص ».",
  latn="Lerkhes", arab="الأرخص")
R(G07, "package.rejected", "Titre de section en petites capitales", "titre", "B",
  "« khellit » peut se lire « j'ai gardé ». « 7eyyedt » (j'ai écarté) est sans doute possible.",
  latn="LI 7EYYEDT", arab="اللي حيدت")
R(G07, "reject.too_many_stops", "Raison grise à droite d'une offre écartée", "statut", "OK", "OK.")
R(G07, "reject.too_long", "Raison grise à droite d'une offre écartée", "statut", "OK", "OK.")
R(G07, "reject.too_expensive", "Raison grise à droite d'une offre écartée", "statut", "OK", "OK.")
R(G07, "reject.low_rating", "Raison grise à droite d'une offre écartée", "statut", "B",
  "Latin « Note » (français), arabe « النقطة » : j'aligne.", latn="Nn9ta d3ifa")
R(G07, "reject.far_from_center", "Raison grise à droite d'une offre écartée", "statut", "B",
  "« lcentre » (français) et « المركز » (arabe classique). « wost lmdina » des deux côtés.",
  latn="B3id 3la wost lmdina", arab="بعيد على وسط المدينة", ar="بعيد عن وسط المدينة")
R(G07, "reject.no_breakfast", "Raison grise à droite d'une offre écartée", "statut", "C", "Lexique « الفطور ».", ar="بدون فطور")
R(G07, "reject.overnight_layover", "Raison grise à droite d'une offre écartée", "statut", "OK", "OK.")
R(G07, "reject.airport_change", "Raison grise à droite d'une offre écartée", "statut", "C", "Article.", latn="Tbdil lmatar")
R(G07, "reject.visa_needed", "Raison grise à droite d'une offre écartée", "statut", "C", "Convention ڤ.", arab="خاص ڤيزا")
R(G07, "reject.other", "Raison grise à droite d'une offre écartée", "statut", "B",
  "Même verbe que le titre de la section.", latn="T7iyyed", arab="تحيّد")
R(G07, "package.totalFor", "Barre du bas, petit texte gris au-dessus du prix", "libellé", "OK", "OK.")
R(G07, "package.totalOne", "Barre du bas, petit texte gris (1 voyageur)", "libellé", "A",
  "Latin « Lmejmo3, 1 » : il manque « personne ».", latn="Lmejmo3, chakhs wa7ed")
R(G07, "package.validate", "Bouton noir en bas à droite (l'avion décolle)", "CTA ou bouton", "B",
  "Maquette « Ana mwafeq », mais c'est au masculin : Fatima dirait « Ana mwafqa ». Neutre et naturel : « Wakha, yallah ». Arabe classique : verbe « أوافق ».",
  latn="Wakha, yallah", arab="واخا، يالله", ar="أوافق")
R(G07, "price.captured", "Infobulle du prix total, et détail du prix de l'écran 09", "statut", "B",
  "Même tournure que la ligne replay : « Taman dyal {time} ».",
  latn="Taman dyal {time}", arab="الثمن ديال {time}", ar="سُجّل السعر {time}")
R(G07, "price.fx", "Infobulle du prix total : taux et date", "libellé", "OK", "OK (calculé par le code).")
R(G07, "price.fxMad", "Détail du prix de l'écran 09 (offre déjà en dirhams)", "libellé", "C",
  "Latin « Deja » (français), arabe « من الأول » : j'aligne.", latn="B derham men lwel")

# 08 Prêt à partir ------------------------------------------------------------
R(G08, "ready.kickerNone", "En haut, à côté du point vert", "statut", "C",
  "« Wajed » seul est sec. « Wajed l ssafar ».", latn="Wajed l ssafar", arab="واجد للسفر")
R(G08, "ready.kickerOne", "En haut, à côté du point vert", "statut", "B",
  "« 1 haja tdir » est mal construit. « b9at 7aja wa7da » (il reste une chose).",
  latn="T9riban wajed: b9at 7aja wa7da", arab="تقريبا واجد: بقات حاجة وحدة", ar="تقريبًا جاهز: بقي أمر واحد")
R(G08, "ready.kickerMany", "En haut, à côté du point vert", "statut", "B",
  "Même logique.", latn="T9riban wajed: b9aw {count} d l7wayej", arab="تقريبا واجد: بقاو {count} ديال الحوايج",
  ar="تقريبًا جاهز: بقيت {count} أمور")
R(G08, "ready.heading", "Gros titre à côté de Safar", "titre", "B",
  "Ordre aligné sur la ligne du haut. Arabe classique « أوشكت على الجاهزية » est lourd.",
  latn="T9riban wajed !", arab="تقريبا واجد!", ar="تقريبًا جاهز!")
R(G08, "ready.lead", "Ligne grise sous le titre", "sous-titre", "B",
  "« mtchek » (français) et « پ » (lettre persane). Lexique « t7e99e9 », « الباسبور ».",
  latn="Hadchi li khassek l {city}, mt7e99e9 3la 7sab lpassport dyalek.",
  arab="هادشي اللي خاصك ل {city}، متحقق على حساب الباسبور ديالك.",
  ar="هذا ما تحتاجه للسفر إلى {city}، وقد تحققنا منه حسب جواز سفرك.")
R(G08, "package.visa", "Tuile Visa : titre (aussi dans « Avant de partir » de l'écran 07)", "libellé", "C", "Convention ڤ.", arab="ڤيزا")
R(G08, "package.visaFree", "Tuile Visa : statut vert", "statut", "OK", "OK.")
R(G08, "package.visaNeeded", "Tuile Visa : statut orange", "statut", "OK", "OK.")
R(G08, "ready.visaStay", "Tuile Visa : ligne grise", "texte d'aide", "C", "Orthographe « 7tta ».", latn="7tta {days} youm")
R(G08, "package.passport", "Tuile Passeport : titre", "libellé", "C",
  "Lexique « lpassport / الباسبور ».", latn="Lpassport", arab="الباسبور")
R(G08, "package.passportDays", "Tuile Passeport : statut vert", "statut", "C",
  "« MIN. » est une abréviation française.", latn="{days} YOUM 3LA L9ELL")
R(G08, "package.passportCheck", "Tuile Passeport : statut orange", "statut", "A",
  "Même problème que « TCHUF » du plan de vol.", latn="KHASS TCHOUF", arab="خاص تشوف")
R(G08, "ready.passportAfter", "Tuile Passeport : ligne grise", "texte d'aide", "C",
  "Plus naturel.", latn="Sal7 men b3d ma twsel", arab="صالح من بعد ما توصل")
R(G08, "package.baggage", "Tuile Bagage : titre", "libellé", "OK", "OK.")
R(G08, "package.bagCabin", "Tuile Bagage : statut orange", "statut", "OK", "OK.")
R(G08, "package.bagChecked", "Tuile Bagage : statut vert", "statut", "B",
  "« فاليزا » ici, « فاليزة » ailleurs : lexique « ڤاليزة ». « VALIZA » seul ne dit pas qu'elle est incluse.",
  latn="VALIZA DAKHLA", arab="ڤاليزة داخلة")
R(G08, "ready.bagAdd", "Tuile Bagage : ligne grise (action à faire)", "texte d'aide", "B",
  "« lpartenaire / لبارتنير » : lexique « charik / الشريك ».",
  latn="Zid valiza 3end charik", arab="زيد ڤاليزة عند الشريك")
R(G08, "ready.bagIn", "Tuile Bagage : ligne grise (valise incluse)", "texte d'aide", "B",
  "« soute » est un mot technique français. « valiza kbira » (grande valise) est clair. Arabe classique aligné sur le statut.",
  latn="Valiza kbira dakhla", arab="ڤاليزة كبيرة داخلة", ar="حقيبة مسجّلة مشمولة")
R(G08, "package.money", "Tuile Argent : titre", "libellé", "OK", "OK.")
R(G08, "package.moneyShare", "Tuile Argent : statut", "statut", "C",
  "Darija OK (« dotation » est le mot connu au Maroc). Arabe classique : je précise « السياحي ».",
  ar="{percent}% من المخصص السياحي")
R(G08, "ready.moneyOf", "Tuile Argent : ligne grise", "texte d'aide", "OK", "OK.")
R(G08, "ready.know", "Titre de la carte « Bon à savoir »", "titre", "OK", "OK.")
R(G08, "ready.knowLoading", "Dans la carte « Bon à savoir » pendant le chargement", "message de Safar", "C",
  "Il manque « encore » (mazal).", latn="Safar mazal kaychouf chi 7wayej", arab="سافار مازال كيشوف شي حوايج")
R(G08, "ready.sources", "Ligne grise sous la carte « Bon à savoir »", "texte d'aide", "A",
  "« Tverifa Muse Spark » se lit « Muse Spark a été vérifié ». C'est l'inverse.",
  latn="Muse Spark t7e99e9 men {count} d lmasader · {date}", arab="Muse Spark تحقق من {count} د المصادر · {date}")
R(G08, "ready.sourcesOne", "Ligne grise sous la carte (1 source)", "texte d'aide", "A",
  "Idem.", latn="Muse Spark t7e99e9 men masdar wa7ed · {date}", arab="Muse Spark تحقق من مصدر واحد · {date}")
R(G08, "ready.sourcesNone", "Ligne grise sous la carte (sans source)", "texte d'aide", "A",
  "Idem.", latn="Muse Spark t7e99e9 · {date}", arab="Muse Spark تحقق · {date}")
R(G08, "ready.continue", "Bouton noir en bas", "CTA ou bouton", "OK", "OK.")

# 09 Vérifie et continue ------------------------------------------------------
R(G09, "common.close", "Bouton X en haut à droite, et dans les tiroirs" + SR, "CTA ou bouton", "OK", "OK.")
R(G09, "check.title", "Gros titre", "titre", "OK", "OK.")
R(G09, "check.subtitle", "Ligne grise sous le titre", "sous-titre", "B",
  "« Chouf akhir merra » se comprend « regarde la dernière fois ». « Choufa lakhra » (un dernier coup d'œil).",
  latn="Choufa lakhra 9bel ma tkhelles 3end chouraka.", arab="شوفة لخرة قبل ما تخلص عند الشركاء.")
R(G09, "check.nights", "Carte récap : titre à côté de la vignette", "titre", "B",
  "« lilat » ici, « lyali » ailleurs. Lexique « lyali ».", latn="{city} · {count} lyali", arab="{city} · {count} ليالي")
R(G09, "check.nightsOne", "Carte récap : titre (1 nuit)", "titre", "C", "Orthographe.", latn="{city} · lila wa7da")
R(G09, "check.photo", "Crédit sous la vignette, et texte de l'image" + SR, "libellé", "OK", "OK.")
R(G09, "check.dates", "Ligne Dates : libellé en gras", "libellé", "OK", "OK.")
R(G09, "check.datesValue", "Ligne Dates : valeur grise", "libellé", "OK", "OK.")
R(G09, "check.travellers", "Ligne Voyageurs : libellé en gras", "libellé", "C", "Aligné sur l'arabe.", latn="Lmsafrin")
R(G09, "check.adults", "Ligne Voyageurs : valeur grise", "libellé", "C", "Orthographe « men ».", latn="{count} kbar, men {city}")
R(G09, "check.adultsOne", "Ligne Voyageurs : valeur grise (1 adulte)", "libellé", "C", "Orthographe « men ».",
  latn="Wa7ed kbir, men {city}")
R(G09, "check.party", "Ligne Voyageurs : valeur grise (avec enfants)", "libellé", "B", "Lexique « wlad ».",
  latn="{adults} kbar, {children} wlad, men {city}", arab="{adults} كبار، {children} ولاد، من {city}")
R(G09, "check.price", "Ligne Prix total : libellé en gras", "libellé", "OK", "OK.")
R(G09, "check.priceValue", "Ligne Prix total : valeur grise", "libellé", "C", "Articles et accord.",
  latn="{amount}, ttiyara w lotel dakhlin", arab="{amount}، الطيارة والأوطيل داخلين")
R(G09, "check.edit", "Bouton gris à droite des lignes Dates et Voyageurs", "CTA ou bouton", "OK", "OK.")
R(G09, "check.detail", "Bouton gris à droite de la ligne Prix total", "CTA ou bouton", "OK", "OK.")
R(G09, "check.hide", "Même bouton, une fois le détail ouvert", "CTA ou bouton", "OK", "OK.")
R(G09, "check.flight", "Détail du prix : « Vol · 7 600 DH »", "libellé", "C",
  "Articles. Arabe classique : « الطيران » pour ne pas confondre avec le voyage.",
  latn="Ttiyara", arab="الطيارة", ar="الطيران")
R(G09, "check.hotel", "Détail du prix : « Hôtel · 6 439 DH »", "libellé", "C", "Article, « أوطيل ».", latn="Lotel", arab="الأوطيل")
R(G09, "check.cancel", "Bas de la carte récap : libellé en gras", "libellé", "OK", "OK.")
R(G09, "check.cancelFree", "Bas de la carte récap : texte gris", "texte d'aide", "C",
  "« kol charika » (chaque compagnie), ح = 7, « fabor ».",
  latn="Lotel t9der tlghih fabor. Ttiyara 3la 7sab kol charika.", arab="الأوطيل تقدر تلغيه فابور. الطيارة على حساب كل شركة.")
R(G09, "check.cancelNo", "Bas de la carte récap : texte gris", "texte d'aide", "B",
  "« ma kaytrj3ch » (il ne revient pas) : on parle de l'argent.",
  latn="Lotel ma kayrejj3ouch fih lflous. Ttiyara 3la 7sab kol charika.",
  arab="الأوطيل ما كيرجعوش فيه الفلوس. الطيارة على حساب كل شركة.")
R(G09, "check.shield", "Encadré vert avec Safar", "texte d'aide", "C",
  "Orthographe (« 3end », « 3emmro », « kaychouf ») et lexique « lkarta ».",
  latn="Katkhelles 3end Kiwi.com w f site dyal lotel. BonSafar 3emmro ma kaychouf lkarta dyalek.",
  arab="كتخلص عند Kiwi.com وف السيت ديال الأوطيل. BonSafar عمرو ما كيشوف الكارطة ديالك.")
R(G09, "check.next", "Bouton noir en bas", "CTA ou bouton", "B",
  "Même mot que le bouton du profil : « Kemmel ».", latn="Kemmel", arab="كمّل")
R(G09, "check.payTitle", "Titre du tiroir de paiement", "titre", "C",
  "« Ghatkhalles » est une forme contractée : « ghadi tkhelles » comme ailleurs.",
  latn="Ghadi tkhelles 3end Kiwi.com w f site dyal lotel", arab="غادي تخلص عند Kiwi.com وف السيت ديال الأوطيل")
R(G09, "check.payBody", "Texte gris du tiroir de paiement", "texte d'aide", "B",
  "« kayhellou lpartenaire kima howa » est maladroit. « nichan » (directement) dit « tels quels ».",
  latn="BonSafar ma kayakhodch lflous. Lliens kay7ellou lik sites dyal chouraka nichan.",
  arab="BonSafar ما كياخدش الفلوس. الروابط كيحلّو ليك السيتات ديال الشركاء نيشان.")
R(G09, "check.openFlight", "Bouton gris du tiroir de paiement", "CTA ou bouton", "C", "ح = 7, article.",
  latn="7ell ttiyara f Kiwi.com")
R(G09, "check.openHotel", "Bouton gris du tiroir de paiement", "CTA ou bouton", "C", "ح = 7, article.",
  latn="7ell site dyal lotel", arab="حل السيت ديال الأوطيل")
R(G09, "check.booked", "Bouton noir du tiroir de paiement", "CTA ou bouton", "C",
  "ح = 7. « werrini ddossier » (montre-moi le dossier) est plus court.",
  latn="7jezt, werrini ddossier", arab="حجزت، وريني الدوسيي")

# 10 Dossier ------------------------------------------------------------------
R(G10, "file.kicker", "Petites capitales au-dessus du titre", "statut", "OK", "OK.")
R(G10, "file.title", "Gros titre", "titre", "OK", "OK. « trik slama », on n'y touche pas.")
R(G10, "file.titleNoName", "Gros titre (sans prénom)", "titre", "OK", "OK.")
R(G10, "file.demo", "Bande verte de la carte d'embarquement, à gauche", "libellé", "B",
  "« DIMO » : même remarque que la démo de l'écran 00. « BITAQAT » : convention 9.",
  latn="BITA9AT RRKOUB · MITHAL", arab="بطاقة الركوب · مثال")
R(G10, "file.date", "Carte d'embarquement : en-tête de champ", "libellé", "OK", "OK.")
R(G10, "file.depart", "Carte d'embarquement : en-tête de champ", "libellé", "OK", "OK.")
R(G10, "file.passengers", "Carte d'embarquement : en-tête de champ", "libellé", "C",
  "Aligné sur « Voyageurs ».", latn="LMSAFRIN", arab="المسافرين")
R(G10, "file.hotel", "Carte d'embarquement : en-tête de champ", "libellé", "C", "Article, « أوطيل ».", latn="LOTEL", arab="الأوطيل")
R(G10, "file.nights", "Carte d'embarquement : en-tête de champ", "libellé", "B", "Lexique « lyali ».", latn="LYALI", arab="ليالي")
R(G10, "file.qr", "À droite du QR code de démonstration", "texte d'aide", "A",
  "« Lkarta » veut dire carte bancaire dans le reste de l'app : on peut croire qu'on va recevoir une carte bancaire. Ici c'est la carte d'embarquement.",
  latn="QR dyal lmithal. Lbita9a l7a9i9iya dyal rrkoub katjik men charik men b3d ma tkhelles.",
  arab="QR ديال المثال. البطاقة الحقيقية ديال الركوب كاتجيك من الشريك من بعد ما تخلص.")
R(G10, "file.stamp", "Tampon rouge sur la carte d'embarquement" + " (et son texte lu par le lecteur d'écran)", "libellé", "OK",
  "OK, on n'y touche pas.")
R(G10, "file.return", "Liste du dossier : ligne Retour", "libellé", "OK", "OK.")
R(G10, "file.hotelRow", "Liste du dossier : ligne Hôtel", "libellé", "C", "Article, « أوطيل ».", latn="Lotel", arab="الأوطيل")
R(G10, "file.hotelValue", "Liste du dossier : valeur de la ligne Hôtel", "libellé", "B", "Lexique « lyali ».",
  latn="{count} lyali", arab="{count} ليالي")
R(G10, "file.hotelBreakfast", "Liste du dossier : valeur de la ligne Hôtel (avec petit déjeuner)", "libellé", "B",
  "« lilat » et « ftor » : « lyali », « ftour ».", latn="{count} lyali · ftour", arab="{count} ليالي · فطور")
R(G10, "file.readyRow", "Liste du dossier : ligne Prêt à partir", "libellé", "C", "Comme l'écran 08.",
  latn="Wajed l ssafar", arab="واجد للسفر")
R(G10, "file.readyValue", "Liste du dossier : valeur « 3 sur 4 »", "libellé", "OK", "OK.")
R(G10, "file.savedLocal", "Petite ligne grise au-dessus des boutons", "statut", "C",
  "Orthographe, « had ttilifoun ».", latn="Tsjjel f had ttilifoun.", arab="تسجّل ف هاد التيليفون.")
R(G10, "file.savedAccount", "Petite ligne grise au-dessus des boutons (connecté)", "statut", "C",
  "« compte » : lexique « 7sab ».", latn="Tsjjel f l7sab dyalek.", arab="تسجّل ف الحساب ديالك.")
R(G10, "file.copied", "Ajouté à la ligne grise après Partager (quand le téléphone n'a pas de menu de partage)", "toast", "B",
  "Latin « tcollih » (français), arabe « تلصقه » : j'aligne.", latn="Tnsekh. T9der tlse9o bach tcharko.",
  arab="تنسخ. تقدر تلصقو باش تشاركو.")
R(G10, "file.saveGoogle", "Bouton blanc (sans compte)", "CTA ou bouton", "B",
  "« had safari » : on attend « had ssafar ». Même tournure que le profil.",
  latn="Sjjel had ssafar b Google", arab="سجّل هاد السفر ب Google")
R(G10, "file.poster", "Bouton blanc bordé, à gauche", "CTA ou bouton", "C", "Article collé.", latn="Chouf lafiche")
R(G10, "file.share", "Bouton bleu, à droite", "CTA ou bouton", "OK", "OK.")
R(G10, "file.shareText", "Texte envoyé quand on partage (WhatsApp...)", "libellé", "C",
  "Orthographe « msawweb » comme sur l'affiche. Option : remplacer le tiret long par « · » (le français et l'anglais l'ont aussi, à changer de ton côté si tu valides).",
  latn="Trik slama · {city}, {dates}. {total}. Msawweb b BonSafar.",
  arab="trik slama · {city}، {dates}. {total}. مصاوب ب BonSafar.",
  ar="trik slama · {city}، {dates}. {total}. صُنع مع BonSafar.")

# 10 bis Affiche --------------------------------------------------------------
R(G10B, "poster.loading", "Texte gris pendant la création de l'affiche", "message de Safar", "C", "Article collé.",
  latn="Safar kayrsem lafiche dyalek")
R(G10B, "poster.bslama", "Étiquette noire en haut : « BSLAMA CASA »", "libellé", "OK", "OK.")
R(G10B, "poster.next", "2e étiquette noire en haut", "libellé", "C", "ح = 7, article.", latn="LM7ATTA JAYA: {city}")
R(G10B, "poster.made", "Petite mention grise sur la carte inclinée", "libellé", "OK", "OK.")
R(G10B, "poster.rihla", "Mot rouge sur la carte inclinée", "libellé", "OK", "OK.")
R(G10B, "poster.fallback", "Petite ligne grise sous l'affiche (affiche de secours)", "texte d'aide", "B",
  "Latin « mwajjda », arabe « مصاوبة » : j'aligne.", latn="msawba men 9bel b Muse Image")
R(G10B, "poster.share", "Bouton bleu sous l'affiche", "CTA ou bouton", "OK", "OK.")
R(G10B, "poster.retry", "Bouton noir sous l'affiche (si erreur)", "CTA ou bouton", "OK", "OK.")

# Erreurs et états vides ------------------------------------------------------
R(GE, "welcome.signInError", "00 Bienvenue sous le bouton Google, et écran Ton profil", "message d'erreur", "B",
  "« Google ma khddamch » accuse Google. Le sens est « la connexion avec Google ».",
  latn="Ddkhoul b Google ma khddamch daba.", arab="الدخول ب Google ما خدامش دابا.")
R(GE, "home.micDenied", "02 Accueil : encadré rouge au-dessus du champ texte", "message d'erreur", "OK",
  "OK. Petit écart accepté : « navigateur » en latin, « المتصفح » en arabe (chacun est le mot courant).")
R(GE, "home.micUnsupported", "02 Accueil : encadré rouge au-dessus du champ texte", "message d'erreur", "OK", "OK.")
R(GE, "home.tooShort", "02 Accueil (encadré rouge) et 04 Compris (bulle de Safar inquiet)", "message d'erreur", "B",
  "Latin « sbe3 » sans « ek » : il manque « ton doigt ».", latn="9sir bzaf. Khelli sb3ek m7tout mli katehder.")
R(GE, "understood.error", "04 Compris : bulle de Safar inquiet", "message d'erreur", "OK", "OK.")
R(GE, "understood.nothingHeard", "04 Compris : bulle de Safar inquiet", "message d'erreur", "C",
  "Orthographe (9, « men », « lmicro », « dyalek »).", latn="Ma sme3t walo. 9erreb men lmicro, wla kteb ttalab dyalek.")
R(GE, "understood.fallback", "04 Compris : petite ligne grise sous la bulle vocale", "message d'erreur", "B",
  "« jawda 9lila » est de l'arabe classique traduit mot à mot. Plus simple : « pas très bonne ».",
  latn="Ktaba i7tiyatiya, machi mzyana bzaf", arab="كتابة احتياطية، ماشي مزيانة بزاف")
R(GE, "understood.empty", "04 Compris ouvert sans voyage : texte au centre", "message d'erreur", "C",
  "Orthographe « walo ».", latn="Mazal walo hna.")
R(GE, "understood.backHome", "Lien sous les écrans vides 04 et 05, et bouton du bloc d'erreur 04", "lien", "OK", "OK.")
R(GE, "common.retry", "Bouton des blocs d'erreur (04, 05)", "CTA ou bouton", "OK", "OK.")
R(GE, "plan.empty", "05 Plan de vol ouvert sans demande : texte au centre", "message d'erreur", "C",
  "Lettres arabes : il manque « بعدا ». Latin : « Goul ».",
  latn="Goul l BonSafar b3da fin bghiti tmchi.", arab="قول لـ BonSafar بعدا فين بغيتي تمشي.")
R(GE, "plan.error.intent_incomplete", "05 Plan de vol : bloc d'erreur sous la route, avec Safar inquiet", "message d'erreur", "OK", "OK.")
R(GE, "plan.error.origin_missing", "05 Plan de vol : bloc d'erreur", "message d'erreur", "B",
  "Latin « ash matar », arabe « أي مطار » (arabe classique). « ina matar » des deux côtés, et « tsafer ».",
  latn="Ma 3reftch men ina matar ghadi tsafer.", arab="ما عرفتش من إينا مطار غادي تسافر.")
R(GE, "plan.error.timeout", "05 Plan de vol : bloc d'erreur", "message d'erreur", "A",
  "« Lqalb / القلب » se lit « le cœur », pas « la recherche ». Lexique « lb7ath / البحث ».",
  latn="Lb7ath tewwel bzaf. 3awed.", arab="البحث طوّل بزاف. عاود.")
R(GE, "plan.error.agent_invalid_output", "05 Plan de vol : bloc d'erreur", "message d'erreur", "C",
  "Article, convention 9.", latn="Lforfait rje3 na9es. 3awed.")
R(GE, "plan.error.agent_failed", "05 Plan de vol : bloc d'erreur", "message d'erreur", "A",
  "Même problème « lqalb ».", latn="Lb7ath w9ef. 3awed.", arab="البحث وقف. عاود.")
R(GE, "plan.error.replay_unavailable", "05 Plan de vol : bloc d'erreur", "message d'erreur", "OK", "OK.")
R(GE, "plan.error.interrupted", "05 Plan de vol : bloc d'erreur", "message d'erreur", "A",
  "Même problème « lqalb ».", latn="Lb7ath t9te3. 3awed.", arab="البحث تقطع. عاود.")
R(GE, "result.missing", "06 Résultat ouvert sans forfait : texte au centre", "message d'erreur", "C",
  "Article.", latn="Lforfait mazal ma wajedch.")
R(GE, "result.backToPlan", "Lien sous les écrans vides 06 à 10", "lien", "B",
  "Latin « plan » (français), arabe « الخطة » : j'aligne.", latn="Rje3 l lkhetta")
R(GE, "package.missing", "07 Forfait ouvert sans forfait : texte au centre", "message d'erreur", "C",
  "ح = 7. Arabe : il manque « بعدا ».", latn="7ell lforfait men nnatija b3da.", arab="حل الفورفي من النتيجة بعدا.")
R(GE, "ready.missing", "08 Prêt à partir ouvert trop tôt : texte au centre", "message d'erreur", "C",
  "« b3da » comme les autres messages.", latn="Kemmel lforfait b3da.", arab="كمّل الفورفي بعدا.")
R(GE, "ready.knowError", "08 : dans la carte « Bon à savoir »", "message d'erreur", "C",
  "Convention 9.", latn="Ma 9dernach njibo had lma3loumat.")
R(GE, "check.missing", "09 ouvert trop tôt : texte au centre", "message d'erreur", "C",
  "Comme l'écran 08.", latn="Kemmel lforfait b3da.", arab="كمّل الفورفي بعدا.")
R(GE, "check.linkMissing", "09 : tiroir de paiement, à la place d'un bouton", "message d'erreur", "B",
  "Lexique « charik / الشريك », « الرابط ».", latn="Had charik ma sifetch lien.", arab="هاد الشريك ما صيفطش الرابط.")
R(GE, "file.missing", "10 Dossier ouvert trop tôt : texte au centre", "message d'erreur", "C",
  "Article et négation.", latn="Ddossier mazal ma wajedch.", arab="الدوسيي مازال ما واجدش.")
R(GE, "poster.error", "10 bis : texte gris à la place de l'affiche", "message d'erreur", "C",
  "Phrase plus directe.", latn="Ma 9dernach nrsmo lafiche.", arab="ما قدرناش نرسمو الأفيش.")

# Mascotte (lecteur d'écran) --------------------------------------------------
R(GM, "safar.idle", "Mascotte Safar au repos" + SR, "libellé", "C",
  "« mbsem » ne se dit pas, « kaytbessem ».", latn="Safar mrta7, ghemmed 3inih w howa kaytbessem",
  arab="سافار مرتاح، غمّض عينيه وهو كيتبسم")
R(GM, "safar.listening", "Mascotte Safar qui écoute" + SR, "libellé", "B",
  "« kaykheffo » pour des ailes : je ne suis pas sûr, à toi de valider. Proposition avec « kaysfe9 b jnaw7o ».",
  latn="Safar kaytsennet, 3inih m7loulin, kaysfe9 b jnaw7o b zzerba",
  arab="سافار كيتسنّت، عينيه محلولين، كيصفق بجناوحو بالزربة")
R(GM, "safar.thinking", "Mascotte Safar qui réfléchit" + SR, "libellé", "C",
  "Orthographe (« fou9 », « rasso »). Arabe classique : « ينظر ».",
  latn="Safar kayfekker, chayef l fou9, w 3 d nn9at fou9 rasso", ar="سافار يفكر، ينظر إلى الأعلى، وثلاث نقاط فوق رأسه")
R(GM, "safar.found", "Mascotte Safar ravi" + SR, "libellé", "C", "ح = 7, convention 9.",
  latn="Safar fer7an, kayn99ez, fommo m7loul")
R(GM, "safar.oops", "Mascotte Safar embêté" + SR, "libellé", "B",
  "« mhemmnin » n'est pas clair, « mkemmchin » (froncés).",
  latn="Safar mt9elle9, 7wajbo mkemmchin w 9etra d l3er9", arab="سافار متقلّق، حواجبو مكمشين وقطرة د العرق")
R(GM, "safar.bye", "Mascotte Safar qui s'envole" + SR, "libellé", "OK", "OK.")

# Hors parcours (clés présentes mais pas affichées dans l'app) ---------------
R(GX, "common.other", "Aucun écran aujourd'hui", "libellé", "A",
  "À corriger même si la clé n'est pas affichée : « خرا » écrit en darija se lit comme une grossièreté, et « khra » en latin aussi. Écrire « أخرى / okhra ».",
  latn="Chi 7aja okhra", arab="شي حاجة أخرى")
R(GX, "common.cancel", "Aucun écran aujourd'hui", "CTA ou bouton", "OK", XNOTE + " OK.")
R(GX, "common.share", "Aucun écran aujourd'hui", "CTA ou bouton", "C", XNOTE + " « Charek » comme les autres boutons Partager.", latn="Charek")
R(GX, "common.loading", "Prévu pour les attentes de plus de 8 s (pas encore branché)", "statut", "OK", XNOTE + " OK.")
R(GX, "common.privacy", "Aucun écran aujourd'hui", "lien", "C", XNOTE + " Même orthographe que le lien de l'écran 00.", latn="Lkhoususiya")
R(GX, "common.terms", "Aucun écran aujourd'hui", "lien", "C", XNOTE + " Même orthographe que le lien de l'écran 00.", latn="Chourout")
R(GX, "common.signIn", "Page de développement seulement", "CTA ou bouton", "B", XNOTE + " Même proposition que le bouton Google de l'écran 00.",
  latn="Kemmel b Google", arab="كمّل ب Google")
R(GX, "common.signedOut", "Page de développement seulement", "statut", "OK", XNOTE + " OK.")
R(GX, "common.understood", "Page de développement seulement", "CTA ou bouton", "OK", XNOTE + " OK.")
R(GX, "onboarding.hello", "Aucun écran aujourd'hui", "message de Safar", "OK", XNOTE + " OK.")
R(GX, "onboarding.language.subtitle", "Aucun écran aujourd'hui", "message de Safar", "C", XNOTE + " Convention 9.",
  latn="T9der dima tkhelet, BonSafar kayfhem.")
R(GX, "onboarding.language.scriptLabel", "Aucun écran aujourd'hui", "libellé", "OK", XNOTE + " OK.")
R(GX, "home.micTitle", "Aucun écran aujourd'hui", "titre", "OK", XNOTE + " OK.")
R(GX, "home.micHint", "Aucun écran aujourd'hui", "texte d'aide", "C", XNOTE + " Orthographe « fransawiya ».",
  latn="Brek w hder, b ddarija wla b lfransawiya")
R(GX, "home.writePlaceholder", "Aucun écran aujourd'hui (remplacé par les exemples qui défilent)", "placeholder", "OK", XNOTE + " OK.")
R(GX, "voice.headerStatus", "Aucun écran aujourd'hui", "statut", "OK", XNOTE + " OK.")
R(GX, "voice.title", "Aucun écran aujourd'hui", "message de Safar", "OK", XNOTE + " OK.")
R(GX, "understood.editHint", "Aucun écran aujourd'hui", "texte d'aide", "OK", XNOTE + " OK.")
R(GX, "chip.nights", "Aucun écran aujourd'hui", "chip", "OK", XNOTE + " OK.")
R(GX, "plan.seePackage", "Aucun écran aujourd'hui", "CTA ou bouton", "C", XNOTE + " Article collé.", latn="Chouf lforfait")
R(GX, "package.perNight", "Aucun écran aujourd'hui", "libellé", "OK", XNOTE + " OK.")
R(GX, "ready.title", "Aucun écran aujourd'hui", "titre", "C", XNOTE + " Comme l'écran 08.", latn="Wajed l ssafar", arab="واجد للسفر")
R(GX, "ready.soon", "Aucun écran aujourd'hui", "texte d'aide", "OK", XNOTE + " OK.")
R(GX, "poster.back", "Aucun écran aujourd'hui", "CTA ou bouton", "C", XNOTE + " Article.", latn="Rje3 l ddossier")
R(GX, "search.title", "Ancien écran d'attente, redirigé vers le plan de vol", "message de Safar", "C", XNOTE + " Convention 9.",
  latn="Kan9elleb 3la safar dyalek")
R(GX, "search.soon", "Ancien écran d'attente, redirigé vers le plan de vol", "texte d'aide", "C",
  XNOTE + " Même piège « direct » (temps réel) que l'écran 01 ter.",
  latn="Ttiyarat w lotelat b taman dyal daba ghadi yjiw hna 9riban.",
  arab="الطيارات والأوطيلات بالثمن ديال دابا غادي يجيو هنا قريبا.")
