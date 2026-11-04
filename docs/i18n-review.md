# Relecture des langues

Généré par `npm run i18n:review` à partir de `src/lib/i18n/*.ts`. Ne pas éditer à la main : corrige les dictionnaires, puis relance le script.

- 452 clés, 5 langues. 102 clés ont au moins une chaîne marquée TODO à relire (darija ou arabe).
- « (EN) » : clé affichée en anglais pour tout le monde (Under the hood, page jury) ou nom de langue dans sa propre langue (sélecteur).
- Exceptions voulues : le nom BonSafar, la signature « trik slama », les marques (Kiwi.com, trivago, Google, Muse Spark, Muse Image), le symbole DH, et la transcription de démonstration (parole de l'utilisatrice).
- En mode jury (`?jury=1`), l'écran reste en anglais avec la darija en dessous : ce n'est pas un mélange.

## Clés manquantes

Aucune : chaque clé existe dans les 5 dictionnaires.

## Chaînes mixtes détectées automatiquement

Aucune chaîne mixte détectée.

## Toutes les clés

| clé | écran | emplacement | type | fr | en | ar | darija-latn | darija-arab | à relire |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `common.next` | Partagé | next | CTA | Suivant | Next | التالي | Taliya | التالية | ☐ |
| `common.skip` | Partagé | skip | CTA | Passer | Skip | تخطي | Tjawz | تجاوز | ☐ |
| `common.back` | Partagé | back | CTA | Retour | Back | رجوع | Rje3 | رجع | ☐ |
| `common.close` | Partagé | close | CTA | Fermer | Close | إغلاق | Sedd | سد | ☐ |
| `common.cancel` | Partagé | cancel | CTA | Annuler | Cancel | إلغاء | Lghi | لغي | ☐ |
| `common.retry` | Partagé | retry | CTA | Réessayer | Try again | إعادة المحاولة | 3awed | عاود | ☐ |
| `common.share` | Partagé | share | CTA | Partager | Share | مشاركة | Chareki | شارك | ☐ |
| `common.understood` | Partagé | understood | CTA | J'ai compris | Got it | فهمت | Mfhoum | مفهوم | ☐ |
| `common.juryMode` | Partagé | jury mode | libellé | Mode jury | Judges' mode | وضع لجنة التحكيم | Mod dyal lajna | وضع لجنة التحكيم | ☑ darija-latn |
| `common.signIn` | Partagé | sign in | CTA | Continuer avec Google | Continue with Google | المتابعة باستخدام Google | Continuer avec Google | المتابعة باستخدام Google | ☑ darija-latn, darija-arab |
| `common.signOut` | Partagé | sign out | CTA | Se déconnecter | Sign out | تسجيل الخروج | Khrouj | خروج | ☐ |
| `common.signedInAs` | Partagé | signed in as | statut | Connecté en tant que {name} | Signed in as {name} | مسجل الدخول باسم {name} | Dakhel b {name} | داخل بـ {name} | ☐ |
| `common.signedOut` | Partagé | signed out | statut | Pas connecté | Not signed in | غير مسجل الدخول | Machi dakhel | ماشي داخل | ☐ |
| `common.loading` | Partagé | loading | statut | Encore un instant | One more moment | لحظة من فضلك | Chwiya w nkemmel | شوية ونكمل | ☐ |
| `common.finish` | Partagé | finish | CTA | Terminer | Done | إنهاء | Salina | سالينا | ☐ |
| `common.save` | Partagé | save | CTA | Valider | Save | حفظ | Sjjel | سجل | ☐ |
| `common.remove` | Partagé | remove | CTA | Retirer | Remove | حذف | 7eyyed | حيد | ☐ |
| `common.other` | Partagé | other | libellé | Autre | Other | شيء آخر | Chi 7aja khra | شي حاجة خرا | ☐ |
| `common.privacy` | Partagé | privacy | libellé | Confidentialité | Privacy | الخصوصية | Lkhossossiya | الخصوصية | ☑ darija-latn |
| `common.terms` | Partagé | terms | libellé | Conditions | Terms | الشروط | Churut | الشروط | ☑ darija-latn |
| `welcome.tagline` | 00 Bienvenue | tagline | libellé | trik slama | trik slama | trik slama | trik slama | trik slama | ☐ |
| `welcome.step1` | 00 Bienvenue | step1 | libellé | Dis-le en [[darija.]] | Say it in [[darija.]] | قُلها [[بالدارجة.]] | Golha b [[darija.]] | قولها [[بالدارجة.]] | ☑ ar, darija-latn, darija-arab |
| `welcome.step2` | 00 Bienvenue | step2 | libellé | On s'occupe du [[voyage.]] | We handle the [[trip.]] | ونحن نتكفّل [[بالرحلة.]] | [[Safar]] 3lina. | [[السفر]] علينا. | ☑ ar, darija-latn, darija-arab |
| `welcome.sub` | 00 Bienvenue | sub | aide | Vols, hôtel, visa et bagages vérifiés, au vrai prix. | Flights, hotel, visa and bags checked, at the real price. | الطيران والفندق والتأشيرة والأمتعة، بالسعر الحقيقي. | Tiyara, otel, visa w lbagaj, kolchi mt7a99e9, b taman l7a9i9i. | الطيارة، الأوطيل، الفيزا والباگاج، كلشي متحقق، بالثمن الحقيقي. | ☑ ar, darija-latn, darija-arab |
| `welcome.pitch` | 00 Bienvenue | pitch | libellé | Ton prochain voyage, prêt en 1 minute. | Your next trip, ready in 1 minute. | رحلتك القادمة جاهزة في دقيقة واحدة. | Safrek jay wajed f d9i9a. | سفرك الجاي واجد فدقيقة. | ☑ ar, darija-latn, darija-arab |
| `welcome.google` | 00 Bienvenue | google | CTA | Continuer avec Google | Continue with Google | المتابعة باستخدام Google | Continuer avec Google | المتابعة باستخدام Google | ☑ ar, darija-arab |
| `welcome.free` | 00 Bienvenue | free | libellé | Gratuit, sans carte bancaire | Free, no card needed | مجاني ودون بطاقة بنكية | Fabor, bla carte bancaire | فابور، بلا كارط بنكية | ☑ ar, darija-latn, darija-arab |
| `welcome.guest` | 00 Bienvenue | guest | CTA | continuer sans compte | continue without an account | المتابعة دون حساب | kmmel bla compte | كمّل بلا كونط | ☑ ar, darija-latn, darija-arab |
| `welcome.signInError` | 00 Bienvenue | sign in error | erreur | La connexion Google n'est pas disponible pour l'instant. | Google sign-in is not available right now. | تسجيل الدخول عبر Google غير متاح حاليًا. | Google ma khddamch daba. | Google ما خدامش دابا. | ☑ ar, darija-latn, darija-arab |
| `welcome.language.change` | 00 Bienvenue | language · change | libellé | Changer de langue, actuellement {language} | Change language, currently {language} | تغيير اللغة، حاليا {language} | Beddel lgha, daba {language} | بدل اللغة، دابا {language} | ☑ ar, darija-latn, darija-arab |
| `welcome.legal.terms` | 00 Bienvenue | legal · terms | libellé | Conditions | Terms | الشروط | churut | الشروط | ☑ ar, darija-latn, darija-arab |
| `welcome.legal.privacy` | 00 Bienvenue | legal · privacy | libellé | Confidentialité | Privacy | الخصوصية | lkhossossiya | الخصوصية | ☑ ar, darija-latn, darija-arab |
| `welcome.demo.label` | 00 Bienvenue | demo · label | libellé | Démonstration | Demo | عرض | Dimo | ديمو | ☑ ar, darija-latn, darija-arab |
| `welcome.demo.duration` | 00 Bienvenue | demo · duration | libellé | 0:07 | 0:07 | 0:07 | 0:07 | 0:07 | ☐ |
| `welcome.demo.transcript` | 00 Bienvenue | demo · transcript | libellé | « Bghit nsafer l'[[Istanbul]] m3a rajli f [[nouss décembre]]… » | « Bghit nsafer l'[[Istanbul]] m3a rajli f [[nouss décembre]]… » | « بغيت نسافر لـ[[إسطنبول]] مع راجلي ف[[نص دجنبر]]… » | « Bghit nsafer l'[[Istanbul]] m3a rajli f [[nouss décembre]]… » | « بغيت نسافر لـ[[إسطنبول]] مع راجلي ف[[نص دجنبر]]… » | ☑ ar, darija-latn, darija-arab |
| `welcome.demo.understood` | 00 Bienvenue | demo · understood | libellé | BONSAFAR A COMPRIS | BONSAFAR UNDERSTOOD | BONSAFAR فهم طلبك | BONSAFAR FHEM | BONSAFAR فهم | ☑ ar, darija-latn, darija-arab |
| `welcome.demo.city` | 00 Bienvenue | demo · city | chip | Istanbul | Istanbul | إسطنبول | Istanbul | إسطنبول | ☑ ar, darija-arab |
| `welcome.demo.country` | 00 Bienvenue | demo · country | chip | Turquie · 7 nuits | Turkey · 7 nights | تركيا · 7 ليالٍ | Turkia · 7 lyali | تركيا · 7 ليالي | ☑ ar, darija-latn, darija-arab |
| `welcome.demo.dates` | 00 Bienvenue | demo · dates | chip | 15 → 22 déc. | Dec 15 → 22 | من 15 إلى 22 ديسمبر | 15 → 22 dujanbir | من 15 حتى 22 دجنبر | ☑ ar, darija-latn, darija-arab |
| `welcome.demo.when` | 00 Bienvenue | demo · when | chip | mi-décembre | mid-December | منتصف ديسمبر | nouss dujanbir | نص دجنبر | ☑ ar, darija-latn, darija-arab |
| `welcome.demo.adults` | 00 Bienvenue | demo · adults | chip | 2 adultes | 2 adults | شخصان بالغان | 2 kbar | جوج كبار | ☑ ar, darija-latn, darija-arab |
| `welcome.demo.breakfast` | 00 Bienvenue | demo · breakfast | chip | Petit déj | Breakfast | فطور | Ftour | فطور | ☑ ar, darija-latn, darija-arab |
| `welcome.demo.visa` | 00 Bienvenue | demo · visa | chip | Sans visa | No visa | بدون تأشيرة | Bla visa | بلا فيزا | ☑ ar, darija-latn, darija-arab |
| `onboarding.step` | 01 Profil (4 étapes) | step | libellé | Étape {current} sur {total} | Step {current} of {total} | الخطوة {current} من {total} | Khatwa {current} men {total} | خطوة {current} من {total} | ☐ |
| `onboarding.hello` | 01 Profil (4 étapes) | hello | message de Safar | Salut {name} | Hi {name} | مرحبا {name} | Salam {name} | سلام {name} | ☐ |
| `onboarding.language.ask` | 01 Profil (4 étapes) | language · ask | message de Safar | Salut ! Bienvenue sur BonSafar. | Hi! Welcome to BonSafar. | مرحبًا! أهلًا بك في BonSafar. | Salam ! Mr7ba bik f BonSafar. | سلام! مرحبا بيك ف BonSafar. | ☑ ar, darija-latn, darija-arab |
| `onboarding.language.note` | 01 Profil (4 étapes) | language · note | aide | Tu pourras changer ça à tout moment dans ton profil. | You can change this any time in your profile. | يمكنك تغيير هذا في أي وقت من ملفك. | Tqder tbddel hadchi weqt ma bghiti f profil dyalek. | تقدر تبدل هادشي وقت ما بغيتي ف البروفيل ديالك. | ☑ darija-latn |
| `onboarding.language.title` | 01 Profil (4 étapes) | language · title | titre | Tu préfères qu'on parle en… | You'd rather we speak… | تفضل أن نتحدث بـ… | Bghiti nhedro b… | بغيتي نهضرو بـ… | ☐ |
| `onboarding.language.subtitle` | 01 Profil (4 étapes) | language · subtitle | titre | Tu peux toujours mélanger, BonSafar comprend. | You can always mix, BonSafar understands. | يمكنك دائمًا المزج، BonSafar يفهم. | Tqder dima tkhellet, BonSafar kayfhem. | تقدر ديما تخلط، BonSafar كيفهم. | ☐ |
| `onboarding.language.groupLabel` | 01 Profil (4 étapes) | language · group label | libellé (aria) | Langue | Language | اللغة | Logha | اللغة | ☐ |
| `onboarding.language.scriptLabel` | 01 Profil (4 étapes) | language · script label | libellé (aria) | Écrire la darija en | Write darija in | اكتب الدارجة بـ | Kteb darija b | كتب الدارجة بـ | ☐ |
| `onboarding.language.scriptLatin` | 01 Profil (4 étapes) | language · script latin | libellé | lettres latines | Latin letters | حروف لاتينية | 7rouf latiniya | حروف لاتينية | ☐ |
| `onboarding.language.scriptArabic` | 01 Profil (4 étapes) | language · script arabic | libellé | lettres arabes | Arabic letters | حروف عربية | 7rouf 3arbiya | حروف عربية | ☑ darija-latn |
| `onboarding.trip.title` | 01 Profil (4 étapes) | trip · title | titre | D'où tu pars, et avec qui ? | Where do you leave from, and with whom? | من أين تنطلق، ومع من؟ | Mnin katkhrej, w m3a men ? | منين كتخرج، ومع من؟ | ☐ |
| `onboarding.trip.subtitle` | 01 Profil (4 étapes) | trip · subtitle | titre | Je ne te reposerai plus la question. | I will never ask you again. | لن أسألك هذا السؤال مرة أخرى. | Ma n3awdch nsewlek had sou2al. | ما نعاودش نسولك هاد السؤال. | ☐ |
| `onboarding.trip.airportLabel` | 01 Profil (4 étapes) | trip · airport label | libellé (aria) | Ton aéroport | Your airport | مطارك | Lmatar dyalek | المطار ديالك | ☑ darija-latn |
| `onboarding.trip.companionsLabel` | 01 Profil (4 étapes) | trip · companions label | libellé (aria) | Tu voyages | You travel | تسافر | Katsafer | كتسافر | ☐ |
| `onboarding.trip.children` | 01 Profil (4 étapes) | trip · children | libellé | Enfants | Children | الأطفال | Drari | الدراري | ☐ |
| `onboarding.trip.childrenLess` | 01 Profil (4 étapes) | trip · children less | libellé (aria) | Un enfant de moins | One child less | طفل أقل | Weld 9al | ولد قل | ☐ |
| `onboarding.trip.childrenMore` | 01 Profil (4 étapes) | trip · children more | libellé (aria) | Un enfant de plus | One child more | طفل إضافي | Weld kter | ولد كتر | ☐ |
| `onboarding.papers.title` | 01 Profil (4 étapes) | papers · title | titre | Tes papiers | Your papers | وثائقك | L wraq dyalek | الوراق ديالك | ☐ |
| `onboarding.papers.subtitle` | 01 Profil (4 étapes) | papers · subtitle | titre | Pour te proposer des voyages que tu peux vraiment faire. | So we only suggest trips you can really take. | حتى نقترح عليك رحلات يمكنك القيام بها فعلًا. | Bach n9terho 3lik ghir safariyat li t9der dirhom b s7i7. | باش نقترحو عليك غير سفريات لي تقدر تديرهم بصح. | ☐ |
| `onboarding.papers.passportLabel` | 01 Profil (4 étapes) | papers · passport label | libellé (aria) | Ton passeport | Your passport | جواز سفرك | Passport dyalek | الباسبور ديالك | ☐ |
| `onboarding.papers.schengen` | 01 Profil (4 étapes) | papers · schengen | libellé | Visa Schengen valide | Valid Schengen visa | تأشيرة شنغن سارية | Visa Schengen sal7a | فيزا شنگن صالحة | ☐ |
| `onboarding.papers.schengenHint` | 01 Profil (4 étapes) | papers · schengen hint | aide | Ouvre la France, l'Espagne, l'Italie… | Opens France, Spain, Italy and more | تفتح فرنسا وإسبانيا وإيطاليا… | Katfta7 Fransa, Sbanya, Italya… | كتفتح فرنسا، سبانيا، إيطاليا… | ☐ |
| `onboarding.papers.passport6m` | 01 Profil (4 étapes) | papers · passport6m | libellé | Passeport valide plus de 6 mois | Passport valid over 6 months | جواز سفر صالح أكثر من 6 أشهر | Passport sal7 kter men 6 chhor | الباسبور صالح كتر من 6 شهور | ☐ |
| `onboarding.papers.passport6mHint` | 01 Profil (4 étapes) | papers · passport6m hint | aide | Demandé par beaucoup de compagnies | Required by many airlines | تطلبه كثير من شركات الطيران | Bzzaf d charikat katalbo hadchi | بزاف ديال الشركات كيطلبو هادشي | ☐ |
| `onboarding.papers.card` | 01 Profil (4 étapes) | papers · card | libellé | Carte bancaire internationale | International bank card | بطاقة بنكية دولية | Lkarta bankiya dawliya | كارط بنكية دولية | ☑ darija-latn |
| `onboarding.papers.cardHint` | 01 Profil (4 étapes) | papers · card hint | aide | Pour payer chez les partenaires | To pay on the partner's site | للدفع لدى الشريك | Bach tkhelles 3end charik | باش تخلص عند الشريك | ☐ |
| `onboarding.papers.note` | 01 Profil (4 étapes) | papers · note | aide | Sans visa Schengen, je te propose d'abord les pays où tu peux partir sans visa, et je t'explique comment demander le Schengen. | Without a Schengen visa I show you visa-free countries first, and explain how to apply for the Schengen. | بدون تأشيرة شنغن، أقترح عليك أولًا الوجهات التي لا تحتاج تأشيرة، وأشرح لك كيفية طلب شنغن. | Bla visa Schengen, kan9terh 3lik l'blayes li tqder tmchi lihom bla visa, w nwerrik kifach tatleb Schengen. | بلا فيزا شنگن، كنقترح عليك أول البلدان لي تقدر تمشي ليهم بلا فيزا، ونوريك كيفاش تطلب شنگن. | ☐ |
| `onboarding.style.title` | 01 Profil (4 étapes) | style · title | titre | Ton style | Your style | أسلوبك | Style dyalek | الستيل ديالك | ☐ |
| `onboarding.style.subtitle` | 01 Profil (4 étapes) | style · subtitle | titre | Pour choisir les hôtels et les vols qui te ressemblent. | To pick hotels and flights that suit you. | لاختيار الفنادق والرحلات التي تناسبك. | Bach nkhtar lik otelat w tiyarat li kay3jbouk. | باش نختار ليك أوتيلات وطيارات لي كيعجبوك. | ☐ |
| `onboarding.style.optionsLabel` | 01 Profil (4 étapes) | style · options label | libellé (aria) | Options | Options | الخيارات | Lkhiyarat | الاختيارات | ☑ darija-latn |
| `passport.moroccan` | 01 Profil (4 étapes) | moroccan | chip | Marocain | Moroccan | مغربي | Maghribi | مغربي | ☐ |
| `passport.french` | 01 Profil (4 étapes) | french | chip | Français | French | فرنسي | Franssawi | فرنسي | ☐ |
| `passport.both` | 01 Profil (4 étapes) | both | chip | Les deux | Both | كلاهما | Bjouj | بجوج | ☐ |
| `passport.other` | 01 Profil (4 étapes) | other | chip | Autre | Other | آخر | Akhor | آخر | ☐ |
| `companions.solo` | 01 Profil (4 étapes) | solo | chip | Solo | Solo | وحدي | Bou7di | بوحدي | ☐ |
| `companions.duo` | 01 Profil (4 étapes) | duo | chip | À deux | As a couple | ثنائي | Jouj | جوج | ☑ ar |
| `companions.family` | 01 Profil (4 étapes) | family | chip | En famille | Family | مع العائلة | M3a l3a2ila | مع العائلة | ☐ |
| `companions.friends` | 01 Profil (4 étapes) | friends | chip | Entre amis | Friends | مع الأصدقاء | M3a s7abi | مع صحابي | ☐ |
| `airport.CMN` | 01 Profil (4 étapes) | cmn | chip | Casablanca | Casablanca | الدار البيضاء | Casa | كازا | ☐ |
| `airport.RAK` | 01 Profil (4 étapes) | rak | chip | Marrakech | Marrakech | مراكش | Marrakech | مراكش | ☐ |
| `airport.RBA` | 01 Profil (4 étapes) | rba | chip | Rabat | Rabat | الرباط | Rbat | الرباط | ☐ |
| `airport.TNG` | 01 Profil (4 étapes) | tng | chip | Tanger | Tangier | طنجة | Tanja | طنجة | ☐ |
| `airport.FEZ` | 01 Profil (4 étapes) | fez | chip | Fès | Fes | فاس | Fas | فاس | ☐ |
| `airport.AGA` | 01 Profil (4 étapes) | aga | chip | Agadir | Agadir | أكادير | Agadir | أكادير | ☐ |
| `airport.OUD` | 01 Profil (4 étapes) | oud | chip | Oujda | Oujda | وجدة | Wejda | وجدة | ☐ |
| `style.budget` | 01 Profil (4 étapes) | budget | chip | Petit budget | Small budget | ميزانية محدودة | Budget sghir | بوجي صغير | ☐ |
| `style.budget.hint` | 01 Profil (4 étapes) | budget · hint | aide | Hôtels 3 étoiles, le meilleur prix | 3-star hotels, the best price | فنادق 3 نجوم، أفضل سعر | Otelat 3 njoum, a7san taman | أوتيلات 3 نجوم، أحسن ثمن | ☐ |
| `style.comfort` | 01 Profil (4 étapes) | comfort | chip | Confort | Comfort | راحة | Konfor | كونفور | ☑ darija-latn |
| `style.comfort.hint` | 01 Profil (4 étapes) | comfort · hint | aide | Hôtels 4 étoiles, bien placés | 4-star hotels, well placed | فنادق 4 نجوم، موقع جيد | Otelat 4 njoum, f blasa mzyana | أوتيلات 4 نجوم، ف بلاصة مزيانة | ☐ |
| `style.premium` | 01 Profil (4 étapes) | premium | chip | Premium | Premium | فاخر | Premium | بريميوم | ☐ |
| `style.premium.hint` | 01 Profil (4 étapes) | premium · hint | aide | Hôtels 5 étoiles, vols directs | 5-star hotels, direct flights | فنادق 5 نجوم، رحلات مباشرة | Otelat 5 njoum, tiyarat direct | أوتيلات 5 نجوم، طيارات ديريكت | ☐ |
| `prefs.direct_only` | 01 Profil (4 étapes) | direct_only | libellé | Vols directs seulement | Direct flights only | رحلات مباشرة فقط | Ghir tiyarat direct | غير طيارات ديريكت | ☐ |
| `prefs.direct_only.hint` | 01 Profil (4 étapes) | direct_only · hint | aide | Sans escale | No stopover | بدون توقف | Bla escale | بلا إسكال | ☐ |
| `prefs.breakfast` | 01 Profil (4 étapes) | breakfast | libellé | Petit déjeuner inclus | Breakfast included | الفطور مشمول | Ftour dakhel | الفطور داخل | ☐ |
| `prefs.breakfast.hint` | 01 Profil (4 étapes) | breakfast · hint | aide | À l'hôtel, chaque matin | At the hotel, every morning | في الفندق، كل صباح | F l'otel, kol sba7 | ف الأوتيل، كل صباح | ☐ |
| `prefs.halal` | 01 Profil (4 étapes) | halal | libellé | Halal à proximité | Halal food nearby | طعام حلال قريب | Halal 9rib | حلال قريب | ☐ |
| `prefs.halal.hint` | 01 Profil (4 étapes) | halal · hint | aide | Des restaurants près de l'hôtel | Restaurants close to the hotel | مطاعم قريبة من الفندق | Ristorat 9rab l'otel | ريسطورات قراب للأوتيل | ☑ darija-latn |
| `prefs.accessibility` | 01 Profil (4 étapes) | accessibility | libellé | Accessibilité | Accessibility | إمكانية الوصول | Lwoulouj | الولوجية | ☑ darija-latn |
| `prefs.accessibility.hint` | 01 Profil (4 étapes) | accessibility · hint | aide | Mobilité réduite | Reduced mobility | حركة محدودة | 7araka m7douda | حركة محدودة | ☑ darija-latn |
| `prefs.haptics` | 01 Profil (4 étapes) | haptics | libellé | Vibrations | Vibrations | الاهتزاز | Vibreur | الاهتزاز | ☑ darija-latn |
| `prefs.haptics.hint` | 01 Profil (4 étapes) | haptics · hint | aide | Un petit retour à chaque geste | A small buzz on each gesture | اهتزاز خفيف مع كل حركة | Rez9a sghira m3a kol 7araka | رزقة صغيرة مع كل حركة | ☐ |
| `trust.title` | 01 ter Confiance | title | titre | Le vrai prix, tout de suite. | The real price, right away. | السعر الحقيقي، فورًا. | Taman l7a9i9i, daba. | الثمن الحقيقي، دابا. | ☐ |
| `trust.subtitle` | 01 ter Confiance | subtitle | titre | Ce que tu vois est ce que tu paies, en dirhams. | What you see is what you pay, in dirhams. | ما تراه هو ما تدفعه، بالدرهم. | Li katchouf howa li ghadi tkhelles, b derham. | لي كتشوف هو لي غادي تخلص، بالدرهم. | ☐ |
| `trust.point.live` | 01 ter Confiance | point · live | libellé | **Vols et hôtels en direct**, chez des partenaires connus. | **Live flights and hotels**, from partners you know. | **رحلات وفنادق مباشرة**، لدى شركاء معروفين. | **Tiyarat w otelat direct**, 3end chorakae m3roufin. | **طيارات وأوتيلات ديريكت**، عند شركاء معروفين. | ☐ |
| `trust.point.total` | 01 ter Confiance | point · total | libellé | **Un seul prix total**, tout compris, sans surprise. | **One total price**, everything included, no surprise. | **سعر إجمالي واحد**، شامل، بلا مفاجآت. | **Taman wa7ed kamel**, kolchi dakhel, bla mofaja2at. | **ثمن واحد كامل**، كلشي داخل، بلا مفاجآت. | ☐ |
| `trust.point.partner` | 01 ter Confiance | point · partner | libellé | **Tu paies chez le partenaire.** BonSafar ne touche jamais ton argent. | **You pay on the partner's site.** BonSafar never touches your money. | **تدفع لدى الشريك.** BonSafar لا يلمس أموالك أبدًا. | **Katkhelles 3end charik.** BonSafar 3emmro ma kayqiss flousek. | **كتخلص عند الشريك.** BonSafar عمرو ما كيقيس فلوسك. | ☐ |
| `trust.cta` | 01 ter Confiance | cta | CTA | J'ai compris | Got it | فهمت | Mfhoum | مفهوم | ☐ |
| `profile.title` | Profil | title | titre | Ton profil | Your profile | ملفك الشخصي | Profil dyalek | البروفيل ديالك | ☐ |
| `profile.open` | Profil | open | libellé (aria) | Ton profil | Your profile | ملفك الشخصي | Profil dyalek | البروفيل ديالك | ☐ |
| `profile.account` | Profil | account | libellé | Compte | Account | الحساب | L7sab | الحساب | ☑ darija-latn |
| `profile.anonymous` | Profil | anonymous | libellé | Ton profil reste sur ce téléphone. | Your profile stays on this phone. | ملفك محفوظ على هذا الهاتف فقط. | Profil dyalek b9a f had tilifoun. | البروفيل ديالك باقي ف هاد التيليفون. | ☐ |
| `profile.keepWithGoogle` | Profil | keep with google | CTA | Garder mon profil avec Google | Keep my profile with Google | احفظ ملفي مع Google | 7tafed b profil m3a Google | حافظ على البروفيل مع Google | ☐ |
| `profile.sectionLanguage` | Profil | section language | libellé | Langue | Language | اللغة | Logha | اللغة | ☐ |
| `profile.sectionTrip` | Profil | section trip | libellé | Départ et voyageurs | Departure and travellers | الانطلاق والمسافرون | Lkhrouj w li m3ak | الخروج واللي معاك | ☐ |
| `profile.sectionPapers` | Profil | section papers | libellé | Papiers | Papers | الوثائق | L wraq | الوراق | ☐ |
| `profile.sectionStyle` | Profil | section style | libellé | Style | Style | الأسلوب | Style | الستيل | ☐ |
| `profile.restart` | Profil | restart | CTA | Refaire les 4 questions | Answer the 4 questions again | أعد الأسئلة الأربعة | 3awed l 4 as2ila | عاود الأسئلة الأربعة | ☐ |
| `home.title` | 02 Accueil | title | titre | Salut !<br>Où veux-tu partir ? | Hi!<br>Where do you want to travel? | مرحبًا!<br>إلى أين تريد السفر؟ | Salam !<br>Fin bghiti tsafer ? | سلام !<br>فين بغيتي تسافر ؟ | ☑ ar |
| `home.titleNamed` | 02 Accueil | title named | titre | Salut {name} !<br>Où veux-tu partir ? | Hi {name}!<br>Where do you want to travel? | مرحبًا {name}!<br>إلى أين تريد السفر؟ | Salam {name} !<br>Fin bghiti tsafer ? | سلام {name} !<br>فين بغيتي تسافر ؟ | ☑ ar, darija-arab |
| `home.subtitle` | 02 Accueil | subtitle | titre | Dis-moi tout, comme sur WhatsApp. | Tell me everything, like on WhatsApp. | قل لي كل شيء، كما على واتساب. | Goul liya kolchi, bhal WhatsApp. | گول ليا كلشي، بحال واتساب. | ☑ darija-latn |
| `home.micLabel` | 02 Accueil | mic label | libellé (aria) | Maintiens pour parler | Press and hold to speak | اضغط مع الاستمرار وتحدث | Brek w hder | برك وهضر | ☐ |
| `home.micTitle` | 02 Accueil | mic title | titre | Appuie et parle | Press and speak | اضغط وتحدث | Brek w hder | برك وهضر | ☐ |
| `home.micHint` | 02 Accueil | mic hint | aide | Appuie et parle, en darija ou en français | Press and speak, in darija or in French | اضغط وتحدث، بالدارجة أو بالفرنسية | Brek w hder, b darija wla b franssawiya | برك وهضر، بالدارجة ولا بالفرنسية | ☐ |
| `home.bubble` | 02 Accueil | bubble | message de Safar | Appuie et parle | Press and speak | اضغط وتحدث | Brek w hder | برك وهضر | ☑ ar |
| `home.bubbleHint` | 02 Accueil | bubble hint | message de Safar | Je comprends la darija et le français. | I understand darija and French. | أفهم الدارجة والفرنسية. | Kanfhem darija w franssawiya. | كنفهم الدارجة والفرنسية. | ☑ ar, darija-latn, darija-arab |
| `home.ideasVisa` | 02 Accueil | ideas visa | libellé | IDÉES SANS VISA POUR TOI | VISA-FREE IDEAS FOR YOU | أفكار بلا تأشيرة لك | AFKAR BLA VISA LIK | أفكار بلا فيزا ليك | ☐ |
| `home.ideasLabel` | 02 Accueil | ideas label | libellé (aria) | IDÉES POUR TOI | IDEAS FOR YOU | أفكار لك | AFKAR DYAL SAFAR | أفكار ديال السفر | ☐ |
| `home.muse` | 02 Accueil | muse | libellé | MUSE IMAGE | MUSE IMAGE | MUSE IMAGE | MUSE IMAGE | MUSE IMAGE | ☐ |
| `home.writeLabel` | 02 Accueil | write label | libellé (aria) | Écris ta demande | Write your request | اكتب طلبك | Kteb talab dyalek | كتب الطلب ديالك | ☐ |
| `home.writePlaceholder` | 02 Accueil | write placeholder | aide | ou écris ici… | or write here… | أو اكتب هنا… | wla kteb hna… | ولا كتب هنا… | ☐ |
| `home.send` | 02 Accueil | send | libellé (aria) | Envoyer | Send | إرسال | Sifet | صيفط | ☐ |
| `home.example.istanbul` | 02 Accueil | example · istanbul | aide | Istanbul avec mon mari en décembre, une semaine environ | Istanbul with my husband in December, about a week | إسطنبول مع زوجي في ديسمبر، حوالي أسبوع | Istanbul m3a rajli f dujanbir, chi simana | إسطنبول مع راجلي ف دجنبر، شي سيمانة | ☑ darija-latn |
| `home.example.marrakech` | 02 Accueil | example · marrakech | aide | Un week-end à Marrakech, un hôtel avec piscine | A weekend in Marrakech, a hotel with a pool | عطلة نهاية أسبوع في مراكش، فندق بمسبح | Wikand f Marrakech, otel fih lpisin | ويكند ف مراكش، أوطيل ب بيسيين | ☑ darija-latn |
| `home.example.visa` | 02 Accueil | example · visa | aide | Où partir sans visa cet été ? | Where can I go with no visa this summer? | أين أسافر بلا تأشيرة هذا الصيف؟ | Fin nmchi bla visa had sif ? | فين نمشي بلا فيزا هاد الصيف؟ | ☑ darija-latn |
| `home.example.family` | 02 Accueil | example · family | aide | Je veux voyager avec les enfants pendant les vacances | I want to travel with the kids over the holidays | أريد السفر مع الأطفال في العطلة | Bghit nsafer m3a lwlad f l3otla | بغيت نسافر مع الولاد ف العطلة | ☑ darija-latn |
| `home.chip.istanbul` | 02 Accueil | chip · istanbul | chip | Istanbul en décembre | Istanbul in December | إسطنبول في ديسمبر | Istanbul f dujanbir | إسطنبول ف دجنبر | ☑ darija-latn |
| `home.chip.visa` | 02 Accueil | chip · visa | chip | Sans visa cet été | No visa this summer | بدون تأشيرة هذا الصيف | Bla visa had sif | بلا فيزا هاد الصيف | ☑ darija-latn |
| `home.chip.marrakech` | 02 Accueil | chip · marrakech | chip | Un week-end à Marrakech | A weekend in Marrakech | عطلة في مراكش | Wikand f Marrakech | ويكند ف مراكش | ☑ darija-latn |
| `home.bubbleWrite` | 02 Accueil | bubble write | message de Safar | Écris-moi ton voyage | Write me your trip | اكتبها لي | Ktebha liya | كتبها ليا | ☐ |
| `home.bubbleWriteHint` | 02 Accueil | bubble write hint | message de Safar | Je lis la darija, le français et l'anglais. | I read darija, French and English. | أقرأ الدارجة والفرنسية والإنجليزية. | Kanqra darija, franssawiya w ngliziya. | كنقرا الدارجة، الفرنسية والإنجليزية. | ☑ ar, darija-latn, darija-arab |
| `home.holdLead` | 02 Accueil | hold lead | aide | Maintiens | Press and hold | اضغط باستمرار | Brek | برك | ☐ |
| `home.holdRest` | 02 Accueil | hold rest | aide | pour parler · darija ou français | to speak · darija or French | للتحدث · الدارجة أو الفرنسية | w hder · darija wla franssawiya | وهضر · الدارجة ولا الفرنسية | ☑ darija-latn |
| `home.micDenied` | 02 Accueil | mic denied | erreur | Le micro est bloqué. Autorise-le dans les réglages du navigateur, ou écris ta demande ci-dessous. | The microphone is blocked. Allow it in your browser settings, or write your request below. | الميكروفون محظور. اسمح به في إعدادات المتصفح، أو اكتب طلبك أدناه. | Lmicro msdoud. 7ellou f i3dadat dyal navigateur, wla kteb talab dyalek lta7t. | الميكرو مسدود. حلو ف إعدادات المتصفح، ولا كتب الطلب ديالك لتحت. | ☑ darija-latn |
| `home.micUnsupported` | 02 Accueil | mic unsupported | erreur | Ce navigateur ne peut pas enregistrer. Écris ta demande ci-dessous. | This browser cannot record. Write your request below. | هذا المتصفح لا يستطيع التسجيل. اكتب طلبك أدناه. | Had navigateur ma kaysjjelch. Kteb talab dyalek lta7t. | هاد المتصفح ما كيسجلش. كتب الطلب ديالك لتحت. | ☐ |
| `home.tooShort` | 02 Accueil | too short | erreur | Trop court. Garde le doigt appuyé pendant que tu parles. | Too short. Keep your finger on the button while you speak. | قصير جدًا. أبقِ إصبعك على الزر أثناء الكلام. | 9sir bzzaf. Khelli sbe3 m7tout mli kathder. | قصير بزاف. خلي صبعك محطوط ملي كتهضر. | ☐ |
| `idea.istanbul.title` | 02 Accueil | istanbul · title | chip | Istanbul en décembre | Istanbul in December | إسطنبول في ديسمبر | Istanbul f dujanbir | إسطنبول ف دجنبر | ☑ darija-latn |
| `idea.istanbul.sub` | 02 Accueil | istanbul · sub | chip | Sans visa · 4 h 40 de vol | No visa · 4 h 40 flight | بدون تأشيرة · 4 س 40 د طيران | Bla visa · 4 h 40 d tiyara | بلا فيزا · 4 س 40 د الطيارة | ☐ |
| `idea.paris.title` | 02 Accueil | paris · title | chip | Paris un week-end | Paris for a weekend | باريس في عطلة نهاية الأسبوع | Paris f wikand | باريس ويكاند | ☑ darija-latn |
| `idea.paris.sub` | 02 Accueil | paris · sub | chip | 3 h de vol · visa Schengen | 3 h flight · Schengen visa | 3 س طيران · تأشيرة شنغن | 3 h d tiyara · visa Schengen | 3 س د الطيارة · فيزا شنگن | ☐ |
| `idea.paris.subFree` | 02 Accueil | paris · sub free | chip | 3 h de vol · sans visa | 3 h flight · no visa | 3 س طيران · بدون تأشيرة | 3 h d tiyara · bla visa | 3 س د الطيارة · بلا فيزا | ☐ |
| `idea.omra.title` | 02 Accueil | omra · title | chip | Omra | Umrah | العمرة | L3omra | العمرة | ☐ |
| `idea.omra.sub` | 02 Accueil | omra · sub | chip | Formalités pas à pas | Formalities step by step | الإجراءات خطوة بخطوة | Lwraq khatwa b khatwa | الوراق خطوة بخطوة | ☐ |
| `idea.tunis.title` | 02 Accueil | tunis · title | chip | Tunis au printemps | Tunis in spring | تونس في الربيع | Tounes f rbi3 | تونس ف الربيع | ☐ |
| `idea.tunis.sub` | 02 Accueil | tunis · sub | chip | Sans visa | No visa | بدون تأشيرة | Bla visa | بلا فيزا | ☐ |
| `idea.barcelona.title` | 02 Accueil | barcelona · title | chip | Barcelone un week-end | Barcelona for a weekend | برشلونة في عطلة نهاية الأسبوع | Barcelona f wikand | برشلونة ويكاند | ☑ darija-latn |
| `idea.barcelona.sub` | 02 Accueil | barcelona · sub | chip | Visa Schengen | Schengen visa | تأشيرة شنغن | Visa Schengen | فيزا شنگن | ☐ |
| `idea.barcelona.subFree` | 02 Accueil | barcelona · sub free | chip | Sans visa | No visa | بدون تأشيرة | Bla visa | بلا فيزا | ☐ |
| `voice.pill` | 03 Vocal | pill | message de Safar | Safar t'écoute | Safar is listening | سافار يستمع إليك | Safar kaysme3 lik | سافار كيسمع ليك | ☑ ar, darija-latn, darija-arab |
| `voice.max` | 03 Vocal | max | libellé | max 1:00 | max 1:00 | حتى 1:00 | 7ta 1:00 | حتى 1:00 | ☑ ar, darija-latn, darija-arab |
| `voice.headerStatus` | 03 Vocal | header status | statut | à l'écoute… | listening… | يستمع إليك… | kaysme3 lik… | كيسمع ليك… | ☐ |
| `voice.title` | 03 Vocal | title | message de Safar | Je t'écoute… | Listening… | أستمع إليك… | Kansme3 lik… | كنسمع ليك… | ☐ |
| `voice.subtitle` | 03 Vocal | subtitle | message de Safar | Je t'écoute. Prends ton temps. | I'm listening. Take your time. | أنا أستمع. خذ وقتك. | Kansme3 lik. Khoud wqtek. | كنسمع ليك. خود وقتك. | ☐ |
| `voice.locked` | 03 Vocal | locked | libellé | Verrouillé : tu peux lâcher l'écran | Locked: you can let go of the screen | مقفل: يمكنك ترك الشاشة | Msdoud: tqder tlaq chacha | مسدود: تقدر تطلق الشاشة | ☑ darija-latn |
| `voice.slideCancel` | 03 Vocal | slide cancel | libellé | Glisse à gauche pour annuler | Slide left to cancel | اسحب جانبًا للإلغاء | Jerr l lisser bach tlghi | جر للجهة باش تلغي | ☐ |
| `voice.slideLock` | 03 Vocal | slide lock | libellé | Glisse vers le haut pour verrouiller | Slide up to lock | اسحب للأعلى للقفل | Jerr l fo9 bach tsedd | جر لفوق باش تسد | ☐ |
| `voice.pause` | 03 Vocal | pause | libellé | Pause | Pause | إيقاف مؤقت | Wqef | وقف | ☐ |
| `voice.resume` | 03 Vocal | resume | libellé | Reprendre | Resume | متابعة | Kmel | كمل | ☐ |
| `voice.paused` | 03 Vocal | paused | statut | En pause | Paused | متوقف | Wa9ef | واقف | ☐ |
| `voice.delete` | 03 Vocal | delete | libellé (aria) | Supprimer le vocal | Delete the voice note | حذف الرسالة الصوتية | Mse7 l vocal | مسح الفوكال | ☐ |
| `voice.send` | 03 Vocal | send | libellé (aria) | Envoyer le vocal | Send the voice note | إرسال الرسالة الصوتية | Sifet l vocal | صيفط الفوكال | ☐ |
| `understood.title` | 04 Compris | title | titre | BonSafar a compris | BonSafar understood | BonSafar فهم | BonSafar fhem | BonSafar فهم | ☐ |
| `understood.safar` | 04 Compris | safar | message de Safar | Compris ! Voilà ce que j'ai retenu : | Got it! Here is what I understood: | حسنًا! هذا ما فهمته: | Mfhoum ! Hadchi li fhemt : | مفهوم! هادشي اللي فهمت: | ☑ ar |
| `understood.originLead` | 04 Compris | origin lead | libellé | Départ de {city} | Leaving from {city} | المغادرة من {city} | Khrouj mn {city} | الخروج من {city} | ☐ |
| `understood.originTail` | 04 Compris | origin tail | libellé | , d'après ton profil. | , from your profile. | ، حسب ملفك. | , 7sab profil dyalek. | ، على حساب البروفيل ديالك. | ☐ |
| `understood.noQuestion` | 04 Compris | no question | message de Safar | Aucune question à te poser. | Nothing left to ask you. | لا سؤال آخر. | Walo ma bqa ntsqek. | والو ما بقا نتسقّك. | ☐ |
| `understood.tapHint` | 04 Compris | tap hint | aide | Touche une info pour la corriger. | Tap a detail to correct it. | المس معلومة لتصحيحها. | Dghhet 3la chi 7aja bach tbeddelha. | دغّط على شي حاجة باش تبدلها. | ☐ |
| `understood.editHint` | 04 Compris | edit hint | aide | touche pour modifier | tap to edit | المس للتعديل | brek bach tbeddel | برك باش تبدل | ☐ |
| `understood.enToggle` | 04 Compris | en toggle | libellé | EN partout | EN everywhere | بالإنجليزية في كل مكان | Ngliziya f kolchi | بالإنجليزية ف كلشي | ☑ ar, darija-latn, darija-arab |
| `understood.transcribing` | 04 Compris | transcribing | message de Safar | J'écris tes mots… | Writing down your words… | أكتب كلامك… | Kanktb klamek… | كنكتب الكلام ديالك… | ☐ |
| `understood.thinking` | 04 Compris | thinking | message de Safar | Je comprends ton voyage… | Understanding your trip… | أفهم رحلتك… | Kanfhem safar dyalek… | كنفهم السفر ديالك… | ☐ |
| `understood.questionBadge` | 04 Compris | question badge | statut | 1 QUESTION | 1 QUESTION | سؤال واحد | 1 SOU2AL | 1 سؤال | ☐ |
| `understood.otherAnswer` | 04 Compris | other answer | CTA | Autre réponse | Other answer | جواب آخر | Jawab akhor | جواب آخر | ☐ |
| `understood.answerPlaceholder` | 04 Compris | answer placeholder | aide | Écris ta réponse… | Write your answer… | اكتب جوابك… | Kteb jawab dyalek… | كتب الجواب ديالك… | ☐ |
| `understood.go` | 04 Compris | go | CTA | Allez, on cherche ! | Go, search! | هيا، ابحث! | Yallah, qelleb ! | يالله، قلب ! | ☑ ar |
| `understood.error` | 04 Compris | error | erreur | Je n'ai pas réussi à comprendre cette fois. Réessaie, ou écris ta demande. | I couldn't understand this time. Try again, or write your request. | لم أفهم هذه المرة. أعد المحاولة، أو اكتب طلبك. | Ma fhemtch had lmerra. 3awed, wla kteb talab dyalek. | ما فهمتش هاد المرة. عاود، ولا كتب الطلب ديالك. | ☐ |
| `understood.nothingHeard` | 04 Compris | nothing heard | erreur | Je n'ai rien entendu. Parle plus près du micro, ou écris ta demande. | I didn't hear anything. Speak closer to the microphone, or type your request. | لم أسمع شيئًا. اقترب من الميكروفون، أو اكتب طلبك. | Ma sme3t walou. Qerreb mn l-micro, wla kteb talab dyalk. | ما سمعت والو. قرّب من الميكرو، ولا كتب الطلب ديالك. | ☐ |
| `understood.fallback` | 04 Compris | fallback | erreur | Transcription de secours, qualité réduite | Backup transcription, lower quality | تفريغ احتياطي، جودة أقل | Ktaba dyal l7tiyat, jawda 9lila | كتابة احتياطية، جودة قليلة | ☑ darija-latn, darija-arab |
| `understood.play` | 04 Compris | play | libellé (aria) | Écouter le vocal | Play the voice note | استمع إلى الرسالة | Sme3 l vocal | سمع الفوكال | ☐ |
| `understood.pauseAudio` | 04 Compris | pause audio | libellé (aria) | Mettre le vocal en pause | Pause the voice note | أوقف الرسالة | Wqef l vocal | وقف الفوكال | ☐ |
| `understood.empty` | 04 Compris | empty | libellé | Rien ici pour l'instant. | Nothing here yet. | لا شيء هنا بعد. | Mazal walou hna. | مازال والو هنا. | ☐ |
| `understood.backHome` | 04 Compris | back home | CTA | Retour à l'accueil | Back to home | العودة إلى الرئيسية | Rje3 l lbdya | رجع للبداية | ☐ |
| `chip.adults.one` | 04 Compris | adults · one | chip | 1 adulte | 1 adult | بالغ واحد | 1 kbir | 1 كبير | ☐ |
| `chip.adults.other` | 04 Compris | adults · other | chip | {count} adultes | {count} adults | {count} بالغين | {count} kbar | {count} كبار | ☐ |
| `chip.children.one` | 04 Compris | children · one | chip | 1 enfant | 1 child | طفل واحد | 1 weld | 1 ولد | ☐ |
| `chip.children.other` | 04 Compris | children · other | chip | {count} enfants | {count} children | {count} أطفال | {count} drari | {count} دراري | ☐ |
| `chip.dateRange` | 04 Compris | date range | chip | {from} au {to} | {from} to {to} | من {from} إلى {to} | {from} l {to} | {from} لـ {to} | ☐ |
| `chip.dateFrom` | 04 Compris | date from | chip | À partir du {date} | From {date} | ابتداءً من {date} | Men {date} | من {date} | ☐ |
| `chip.nights` | 04 Compris | nights | chip | {count} nuits | {count} nights | {count} ليالٍ | {count} lyali | {count} ليالي | ☐ |
| `chip.noDates` | 04 Compris | no dates | chip | Dates à choisir | Dates to choose | التواريخ للاختيار | Khtar tawarikh | ختار التواريخ | ☐ |
| `chip.noDestination` | 04 Compris | no destination | chip | Destination à choisir | Destination to choose | الوجهة للاختيار | Khtar blasa | ختار البلاصة | ☐ |
| `chip.budget` | 04 Compris | budget | chip | {amount} DH | {amount} DH | {amount} درهم | {amount} DH | {amount} درهم | ☐ |
| `edit.destination` | 04 Compris | destination | libellé | Destination | Destination | الوجهة | Blasa | البلاصة | ☐ |
| `edit.cityPlaceholder` | 04 Compris | city placeholder | aide | Ville | City | المدينة | Mdina | المدينة | ☐ |
| `edit.dates` | 04 Compris | dates | libellé | Dates | Dates | التواريخ | Tawarikh | التواريخ | ☐ |
| `edit.depart` | 04 Compris | depart | libellé | Aller | Departure | الذهاب | Lmchi | الذهاب | ☐ |
| `edit.return` | 04 Compris | return | libellé | Retour | Return | العودة | Rjou3 | الرجوع | ☐ |
| `edit.travellers` | 04 Compris | travellers | libellé | Voyageurs | Travellers | المسافرون | Li msafrin | المسافرين | ☐ |
| `edit.adults` | 04 Compris | adults | libellé | Adultes | Adults | البالغون | Kbar | الكبار | ☐ |
| `edit.children` | 04 Compris | children | libellé | Enfants | Children | الأطفال | Drari | الدراري | ☐ |
| `edit.budget` | 04 Compris | budget | libellé | Budget en dirhams | Budget in dirhams | الميزانية بالدرهم | Budget b derham | البوجي بالدرهم | ☐ |
| `edit.wish` | 04 Compris | wish | libellé | Envie | Wish | الرغبة | Bghiti | اللي بغيتي | ☐ |
| `edit.less` | 04 Compris | less | libellé (aria) | Moins | Less | أقل | 9al | قل | ☐ |
| `edit.more` | 04 Compris | more | libellé (aria) | Plus | More | أكثر | Kter | كتر | ☐ |
| `search.title` | Recherche (attente) | title | message de Safar | Je cherche ton voyage | I'm searching your trip | أبحث عن رحلتك | Kanqelleb 3la safar dyalek | كنقلب على السفر ديالك | ☐ |
| `search.soon` | Recherche (attente) | soon | aide | Les vols et les hôtels en direct arrivent ici très bientôt. | Live flights and hotels arrive here very soon. | الرحلات والفنادق المباشرة ستصل هنا قريبًا. | Tiyarat w otelat direct ghadi yjiw hna 9riban. | الطيارات والأوتيلات ديريكت غادي يجيو هنا قريبا. | ☐ |
| `plan.skip` | 05 Plan de vol | skip | CTA | Passer | Skip | تجاوز | Tjawz | تجاوز | ☑ darija-latn, darija-arab |
| `plan.title` | 05 Plan de vol | title | message de Safar | Safar prépare<br>ton voyage | Safar is preparing<br>your trip | سافار يجهّز<br>رحلتك | Safar kaywjjed<br>safar dyalek | سافار كيوجد<br>السفر ديالك | ☐ |
| `plan.replay` | 05 Plan de vol | replay | statut | replay | replay | إعادة عرض | replay | إعادة | ☑ ar, darija-arab |
| `plan.captured` | 05 Plan de vol | captured | statut | Prix capturés {time} | Prices captured {time} | الأسعار التُقطت {time} | L'as3ar tcheddu {time} | الأسعار تشدّو {time} | ☐ |
| `plan.pricesNote` | 05 Plan de vol | prices note | aide | Les prix viennent en direct de **Kiwi.com** et **trivago**. Safar ne les invente jamais. | Prices come live from **Kiwi.com** and **trivago**. Safar never invents them. | الأسعار تأتي مباشرة من **Kiwi.com** و**trivago**. سافار لا يخترعها. | L'as3ar jayin direct men **Kiwi.com** w **trivago**. Safar ma kaykhtare3homch. | الأسعار جايين ديريكت من **Kiwi.com** و**trivago**. سافار ما كيخترعهمش. | ☑ ar, darija-arab |
| `plan.step.flights` | 05 Plan de vol | step · flights | message de Safar | Je cherche les vols | Searching flights | أبحث عن الرحلات | Kanqelleb 3la tiyarat | كنقلب على الطيارات | ☑ ar, darija-latn, darija-arab |
| `plan.step.flights.hint` | 05 Plan de vol | step · flights · hint | aide | Kiwi.com, en direct | Live on Kiwi.com | Kiwi.com، مباشرة | Kiwi.com, direct | Kiwi.com، ديريكت | ☑ ar, darija-latn, darija-arab |
| `plan.step.hotels` | 05 Plan de vol | step · hotels | message de Safar | Je compare les hôtels | Comparing hotels | أقارن الفنادق | Kanqarn l'otelat | كنقارن الأوتيلات | ☑ ar, darija-latn, darija-arab |
| `plan.step.hotels.hint` | 05 Plan de vol | step · hotels · hint | aide | trivago, en direct | Live on trivago | trivago، مباشرة | trivago, direct | trivago، ديريكت | ☑ ar, darija-latn, darija-arab |
| `plan.step.price_trends` | 05 Plan de vol | step · price_trends | message de Safar | Je regarde les prix du mois | Checking monthly prices | أراجع أسعار الشهر | Kanchouf l'as3ar | كنشوف الأسعار | ☑ ar, darija-latn, darija-arab |
| `plan.step.price_trends.hint` | 05 Plan de vol | step · price_trends · hint | aide | Prix des hôtels mois par mois | Hotel prices month by month | أسعار الفنادق شهرًا بشهر | As3ar l'otelat chhar b chhar | أسعار الأوتيلات شهر بشهر | ☑ ar, darija-latn, darija-arab |
| `plan.step.entry_requirements` | 05 Plan de vol | step · entry_requirements | message de Safar | Je vérifie visa et papiers | Checking visa and papers | أتحقق من التأشيرة والوثائق | Kanverifi l'wraq | كنتحقق من الوراق | ☑ ar, darija-latn, darija-arab |
| `plan.step.entry_requirements.hint` | 05 Plan de vol | step · entry_requirements · hint | aide | Sources officielles | Official sources | مصادر رسمية | Masader rasmiya | مصادر رسمية | ☑ ar, darija-latn, darija-arab |
| `plan.step.package` | 05 Plan de vol | step · package | message de Safar | Je prépare ton forfait | Building your package | أجهّز باقتك | Kanwjjed lik l'forfait | كنوجد ليك الفورفي | ☑ ar, darija-latn, darija-arab |
| `plan.step.package.hint` | 05 Plan de vol | step · package · hint | aide | Vol, hôtel et papiers ensemble | Flight, hotel and papers together | الرحلة والفندق والوثائق معًا | Tiyara, otel w lwraq m3a ba3d | الطيارة، الأوتيل والوراق مجموعين | ☑ ar, darija-latn, darija-arab |
| `plan.status.next` | 05 Plan de vol | status · next | CTA | À VENIR | NEXT | لاحقًا | JAY | جاي | ☐ |
| `plan.status.running` | 05 Plan de vol | status · running | statut | EN COURS | IN PROGRESS | جارٍ | KHDAM | خدام | ☐ |
| `plan.status.done` | 05 Plan de vol | status · done | statut | TERMINÉ | DONE | تم | SALIT | سالى | ☐ |
| `plan.status.error` | 05 Plan de vol | status · error | erreur | À VÉRIFIER | TO CHECK | للتحقق | TCHUF | تشوف | ☐ |
| `plan.flightsCount` | 05 Plan de vol | flights count | statut | {count} VOLS | {count} FLIGHTS | {count} رحلات | {count} TIYARAT | {count} طيارات | ☐ |
| `plan.hotelsCount` | 05 Plan de vol | hotels count | statut | {count} HÔTELS | {count} HOTELS | {count} فنادق | {count} OTELAT | {count} أوتيلات | ☐ |
| `plan.direct` | 05 Plan de vol | direct | statut | direct | direct | مباشر | direct | ديريكت | ☐ |
| `plan.stops.one` | 05 Plan de vol | stops · one | libellé | 1 escale | 1 stop | توقف واحد | 1 escale | إسكال واحدة | ☐ |
| `plan.stops.other` | 05 Plan de vol | stops · other | libellé | {count} escales | {count} stops | {count} توقفات | {count} escales | {count} إسكالات | ☐ |
| `plan.visa.title` | 05 Plan de vol | visa · title | titre | {city} demande un visa {kind} | {city} needs a {kind} visa | {city} تحتاج تأشيرة {kind} | {city} khassha visa {kind} | {city} خاصها فيزا {kind} | ☐ |
| `plan.visa.source` | 05 Plan de vol | visa · source | libellé | Source | Source | المصدر | Lmasdar | المصدر | ☐ |
| `plan.alt.title` | 05 Plan de vol | alt · title | titre | Destination sans visa : {city} | Visa-free destination: {city} | وجهة بلا تأشيرة: {city} | Blasa bla visa : {city} | وجهة بلا فيزا : {city} | ☑ darija-latn |
| `plan.landed` | 05 Plan de vol | landed | message de Safar | Atterrissage : ton forfait est prêt | Landed: your package is ready | تم الهبوط: باقتك جاهزة | Hbetna : l'forfait dyalek wajed | هبطنا : الفورفي ديالك واجد | ☐ |
| `plan.seePackage` | 05 Plan de vol | see package | CTA | Voir le forfait | See the package | عرض الباقة | Chouf l'forfait | شوف الفورفي | ☐ |
| `plan.replayLast` | 05 Plan de vol | replay last | CTA | Voir le dernier voyage enregistré | See the last saved trip | عرض آخر رحلة محفوظة | Chouf akhir safar msajjal | شوف آخر سفر مسجّل | ☐ |
| `plan.empty` | 05 Plan de vol | empty | libellé | Dis d'abord à BonSafar où tu veux aller. | Tell BonSafar where you want to go first. | أخبر BonSafar أولًا إلى أين تريد السفر. | Qol l BonSafar fin bghiti temchi b3da. | قول لـ BonSafar فين بغيتي تمشي. | ☑ ar, darija-arab |
| `plan.error.intent_incomplete` | 05 Plan de vol | error · intent_incomplete | erreur | Il manque encore la destination ou les dates. | A destination and both dates are still missing. | ما زالت الوجهة أو التواريخ ناقصة. | Baqi khassna lmdina wla tawarikh. | باقي خاصنا المدينة ولا التواريخ. | ☐ |
| `plan.error.origin_missing` | 05 Plan de vol | error · origin_missing | erreur | Je ne sais pas de quel aéroport tu pars. | I don't know which airport you leave from. | لا أعرف من أي مطار تنطلق. | Ma 3reftch men ash matar ghadi tkhrj. | ما عرفتش من أي مطار غادي تخرج. | ☐ |
| `plan.error.timeout` | 05 Plan de vol | error · timeout | erreur | La recherche a pris trop de temps. Réessaie. | This search took too long. Try again. | استغرق البحث وقتًا طويلًا. أعد المحاولة. | Lqalb tewwel bzzaf. 3awed. | القلب طوّل بزاف. عاود. | ☐ |
| `plan.error.agent_invalid_output` | 05 Plan de vol | error · agent_invalid_output | erreur | Le forfait est revenu incomplet. Réessaie. | The package came back incomplete. Try again. | عادت الباقة ناقصة. أعد المحاولة. | L'forfait rje3 naqes. 3awed. | الفورفي رجع ناقص. عاود. | ☐ |
| `plan.error.agent_failed` | 05 Plan de vol | error · agent_failed | erreur | La recherche s'est arrêtée. Réessaie. | The search stopped. Try again. | توقف البحث. أعد المحاولة. | Lqalb wqef. 3awed. | القلب وقف. عاود. | ☐ |
| `plan.error.replay_unavailable` | 05 Plan de vol | error · replay_unavailable | erreur | Aucun voyage enregistré à rejouer. | No saved trip to replay yet. | لا توجد رحلة محفوظة لإعادتها. | Ma kaynch safar msajjal. | ما كاينش سفر مسجّل. | ☐ |
| `plan.error.interrupted` | 05 Plan de vol | error · interrupted | erreur | La recherche a été interrompue. Réessaie. | The search was interrupted. Try again. | انقطع البحث. أعد المحاولة. | Lqalb tqte3. 3awed. | القلب تقطع. عاود. | ☐ |
| `result.title` | 06 Résultat | title | titre | Ton forfait | Your package | باقتك | L'forfait dyalek | الفورفي ديالك | ☐ |
| `result.subtitle` | 06 Résultat | subtitle | titre | {count} options comparées pour toi | {count} options compared for you | قارنّا {count} خيارات من أجلك | {count} d lkhiyarat qarnthom lik | هادا هو الفورفي ديالك · {count} خيارات | ☑ ar, darija-latn |
| `result.recommended` | 06 Résultat | recommended | statut | RECOMMANDÉ | RECOMMENDED | موصى به | MQTARA7 | مقترح | ☐ |
| `result.direct` | 06 Résultat | direct | statut | DIRECT | DIRECT | مباشر | DIRECT | ديريكت | ☐ |
| `result.cheapest` | 06 Résultat | cheapest | statut | LE MOINS CHER | CHEAPEST | الأرخص | RKHES | رخص | ☐ |
| `result.nightsLabel` | 06 Résultat | nights label | libellé (aria) | NUITS | NIGHTS | ليالٍ | LYALI | ليالي | ☐ |
| `result.share` | 06 Résultat | share | CTA | Partager | Share | مشاركة | Charek | شارك | ☐ |
| `result.landed` | 06 Résultat | landed | libellé | Atterri en {time} · 5 étapes | Landed in {time} · 5 steps | هبط خلال {time} · 5 خطوات | Hbetna f {time} · 5 khatwat | هبطنا ف {time} · 5 خطوات | ☐ |
| `result.how` | 06 Résultat | how | CTA | Voir comment | See how | شاهد كيف | Chouf kifach | شوف كيفاش | ☐ |
| `result.missing` | 06 Résultat | missing | erreur | Le forfait n'est pas encore prêt. | The package is not ready yet. | الباقة ليست جاهزة بعد. | L'forfait mazal ma wajedch. | الفورفي مازال ما واجدش. | ☐ |
| `result.backToPlan` | 06 Résultat | back to plan | CTA | Retour au plan de vol | Back to the flight plan | العودة إلى خطة الرحلة | Rje3 l plan | رجع للخطة | ☐ |
| `package.departIn` | 07 Forfait | depart in | libellé | Départ dans {days} jours · {nights} nuits | Leaving in {days} days · {nights} nights | المغادرة بعد {days} يومًا · {nights} ليالٍ | Lmchi men daba {days} youm · {nights} lyali | المشي من دابا {days} يوم · {nights} ليالي | ☐ |
| `package.departToday` | 07 Forfait | depart today | libellé | Départ aujourd'hui · {nights} nuits | Leaving today · {nights} nights | المغادرة اليوم · {nights} ليالٍ | Lmchi lyoma · {nights} lyali | المشي اليوم · {nights} ليالي | ☐ |
| `package.departPast` | 07 Forfait | depart past | libellé | Ces dates sont passées · {nights} nuits | These dates have passed · {nights} nights | هذه التواريخ مضت · {nights} ليالٍ | Had tawarikh dazou · {nights} lyali | هاد التواريخ دازو · {nights} ليالي | ☐ |
| `package.before` | 07 Forfait | before | titre | AVANT DE PARTIR | BEFORE YOU GO | قبل المغادرة | QBEL MA TEMCHI | قبل ما تمشي | ☐ |
| `package.visa` | 07 Forfait | visa | libellé | Visa | Visa | التأشيرة | Visa | فيزا | ☐ |
| `package.visaFree` | 07 Forfait | visa free | statut | PAS BESOIN | NOT NEEDED | غير مطلوبة | MA KHASSHACH | ما خاصهاش | ☐ |
| `package.visaNeeded` | 07 Forfait | visa needed | statut | NÉCESSAIRE | NEEDED | مطلوبة | KHASSHA | خاصها | ☐ |
| `package.passport` | 07 Forfait | passport | libellé | Passeport | Passport | جواز السفر | Passeport | باسبور | ☐ |
| `package.passportDays` | 07 Forfait | passport days | statut | {days} JOURS MIN. | {days} DAYS MIN. | {days} يومًا على الأقل | {days} YOUM MIN. | {days} يوم على الأقل | ☐ |
| `package.passportCheck` | 07 Forfait | passport check | statut | À VÉRIFIER | CHECK | للتحقق | TCHUF | تشوف | ☐ |
| `package.baggage` | 07 Forfait | baggage | libellé | Bagage | Baggage | الأمتعة | Bagaj | باگاج | ☐ |
| `package.bagCabin` | 07 Forfait | bag cabin | statut | PETIT SAC SEUL | CABIN BAG ONLY | حقيبة المقصورة فقط | GHIR SAC SGHIR | غير الساك الصغير | ☐ |
| `package.bagChecked` | 07 Forfait | bag checked | statut | BAGAGE EN SOUTE | CHECKED BAG | حقيبة مسجّلة | VALIZA | فاليزا | ☐ |
| `package.money` | 07 Forfait | money | libellé | Argent | Money | المال | Flous | فلوس | ☐ |
| `package.moneyShare` | 07 Forfait | money share | statut | {percent} % DOTATION | {percent}% ALLOWANCE | {percent}% من المخصص | {percent} % DOTATION | {percent} % من الدوتاسيون | ☐ |
| `package.why` | 07 Forfait | why | titre | POURQUOI CE CHOIX | WHY THIS CHOICE | لماذا هذا الاختيار | 3LACH HAD LKHTIYAR | علاش هاد الاختيار | ☐ |
| `package.tip` | 07 Forfait | tip | titre | LE CONSEIL DE SAFAR | SAFAR'S TIP | نصيحة سافار | NASIHAT SAFAR | نصيحة سافار | ☑ ar, darija-arab |
| `package.tipFaster` | 07 Forfait | tip faster | libellé | {eur} ≈ {mad} pour {duration} de moins | {eur} ≈ {mad} for {duration} less | {eur} ≈ {mad} مقابل {duration} أقل | {eur} ≈ {mad} 3la {duration} 9al | {eur} ≈ {mad} على {duration} قل | ☑ ar, darija-latn, darija-arab |
| `package.tipFasterMad` | 07 Forfait | tip faster mad | libellé | {mad} pour {duration} de moins | {mad} for {duration} less | {mad} مقابل {duration} أقل | {mad} 3la {duration} 9al | {mad} على {duration} قل | ☐ |
| `package.tipSlower` | 07 Forfait | tip slower | libellé | {eur} ≈ {mad} pour {duration} de plus | {eur} ≈ {mad} for {duration} more | {eur} ≈ {mad} مقابل {duration} أكثر | {eur} ≈ {mad} 3la {duration} kter | {eur} ≈ {mad} على {duration} كتر | ☑ ar, darija-latn, darija-arab |
| `package.tipSlowerMad` | 07 Forfait | tip slower mad | libellé | {mad} pour {duration} de plus | {mad} for {duration} more | {mad} مقابل {duration} أكثر | {mad} 3la {duration} kter | {mad} على {duration} كتر | ☐ |
| `package.trends` | 07 Forfait | trends | titre | PRIX DES HÔTELS PAR MOIS | HOTEL PRICES BY MONTH | أسعار الفنادق حسب الشهر | AS3AR L'OTELAT B CHEHR | أسعار الأوتيلات بالشهر | ☐ |
| `package.cheapestMonth` | 07 Forfait | cheapest month | statut | Le moins cher | Cheapest | الأرخص | Rkhis | رخص شهر | ☐ |
| `package.rejected` | 07 Forfait | rejected | titre | CE QUE J'AI ÉCARTÉ | WHAT I SET ASIDE | ما استبعدته | LI KHLLIT | اللي خليت | ☐ |
| `package.return` | 07 Forfait | return | libellé | Retour | Return | العودة | Rjou3 | الرجوع | ☐ |
| `package.reviews` | 07 Forfait | reviews | libellé | {count} avis | {count} reviews | {count} تقييم | {count} ray | {count} رأي | ☐ |
| `package.breakfastYes` | 07 Forfait | breakfast yes | libellé | Petit déjeuner inclus | Breakfast included | الإفطار مشمول | Ftour dakhel | الفطور داخل | ☐ |
| `package.breakfastNo` | 07 Forfait | breakfast no | libellé | Petit déjeuner non inclus | Breakfast not included | بدون إفطار | Bla ftour | بلا فطور | ☐ |
| `package.cancelYes` | 07 Forfait | cancel yes | libellé | Annulation gratuite | Free cancellation | إلغاء مجاني | Tlghi bla flous | الإلغاء بلا فلوس | ☑ darija-latn |
| `package.cancelNo` | 07 Forfait | cancel no | libellé | Non remboursable | Non-refundable | غير قابل للاسترداد | Ma kaytraddch | ما كيترادش | ☐ |
| `package.totalFor` | 07 Forfait | total for | libellé | Total, {count} personnes | Total, {count} people | المجموع، {count} أشخاص | Lmejmo3, {count} d nass | المجموع، {count} د الناس | ☐ |
| `package.totalOne` | 07 Forfait | total one | libellé | Total, 1 personne | Total, 1 person | المجموع، شخص واحد | Lmejmo3, 1 | المجموع، شخص واحد | ☐ |
| `package.validate` | 07 Forfait | validate | CTA | Je valide | I confirm | أنا موافق | Ana mwafeq | أنا موافق | ☐ |
| `package.missing` | 07 Forfait | missing | erreur | Ouvre d'abord un forfait depuis le résultat. | Open a package from the result first. | افتح باقة من النتيجة أولًا. | Hell l'forfait men nnatija b3da. | حل الفورفي من النتيجة. | ☐ |
| `package.perNight` | 07 Forfait | per night | libellé | par nuit | per night | لليلة | l lila | لليلة | ☐ |
| `notice.visa_needed` | 07 Forfait | visa_needed | statut | Un visa est nécessaire pour la ville demandée. | A visa is required for the city you asked for. | التأشيرة مطلوبة للمدينة التي طلبتها. | Khass visa l lmdina li tlbt. | خاص فيزا للمدينة اللي طلبتي. | ☐ |
| `notice.visa_free_alternative` | 07 Forfait | visa_free_alternative | statut | Ce forfait part vers une destination sans visa. | This package goes to a visa-free destination instead. | هذه الباقة تتجه إلى وجهة بلا تأشيرة. | Had l'forfait l mdina bla visa. | هاد الفورفي لمدينة بلا فيزا. | ☐ |
| `notice.passport_validity_check` | 07 Forfait | passport_validity_check | statut | Vérifie que le passeport reste valide assez longtemps après l'arrivée. | Check that the passport stays valid long enough after arrival. | تحقق أن الجواز يبقى صالحًا بعد الوصول. | Chouf l passeport ybqa salih b3d lwsoul. | شوف الباسبور يبقى صالح بعد الوصول. | ☐ |
| `notice.passengers_mismatch` | 07 Forfait | passengers_mismatch | statut | Le prix du vol ne couvre pas le même nombre de voyageurs. | The flight price does not cover the same number of travellers. | سعر الرحلة لا يغطي نفس عدد المسافرين. | Taman ttiyara ma kayghttich nfs l3adad. | ثمن الطيارة ما كيغطّيش نفس العدد. | ☐ |
| `notice.hotel_filters_relaxed` | 07 Forfait | hotel_filters_relaxed | statut | Les filtres hôtel ont été élargis pour trouver une chambre. | Hotel filters were relaxed to find a room. | تم توسيع فلاتر الفندق لإيجاد غرفة. | Filtres d l'hotel twes3ou bach nlqaw bit. | فلاتر الأوتيل توسّعات باش نلقاو بيت. | ☐ |
| `notice.guardrail_scrubbed` | 07 Forfait | guardrail_scrubbed | statut | Une phrase du modèle qui contenait un prix a été retirée. | A model sentence that contained a price was removed. | أُزيلت جملة من النموذج كانت تحتوي سعرًا. | Jmla kan fiha taman tna77at. | جملة كان فيها ثمن تنحّات. | ☐ |
| `reject.too_many_stops` | 07 Forfait | too_many_stops | statut | Trop d'escales | Too many stops | توقفات كثيرة | Bzzaf d lescalat | بزاف د الإسكالات | ☐ |
| `reject.too_long` | 07 Forfait | too_long | statut | Trajet trop long | Travel time too long | المدة طويلة | Triq twila | الطريق طويلة | ☐ |
| `reject.too_expensive` | 07 Forfait | too_expensive | statut | Trop cher | Too expensive | غالٍ جدًا | Ghali | غالي | ☐ |
| `reject.low_rating` | 07 Forfait | low_rating | statut | Note trop basse | Rating too low | تقييم منخفض | Note d3ifa | النقطة ضعيفة | ☐ |
| `reject.far_from_center` | 07 Forfait | far_from_center | statut | Loin du centre | Far from the centre | بعيد عن الوسط | B3id 3la lcentre | بعيد على المركز | ☐ |
| `reject.no_breakfast` | 07 Forfait | no_breakfast | statut | Sans petit déjeuner | No breakfast | بدون إفطار | Bla ftour | بلا فطور | ☐ |
| `reject.overnight_layover` | 07 Forfait | overnight_layover | statut | Escale de nuit | Overnight layover | توقف ليلي | Escale d lil | إسكال ديال الليل | ☐ |
| `reject.airport_change` | 07 Forfait | airport_change | statut | Changement d'aéroport | Airport change | تغيير المطار | Tbdil d matar | تبديل المطار | ☐ |
| `reject.visa_needed` | 07 Forfait | visa_needed | statut | Visa nécessaire | Visa required | التأشيرة مطلوبة | Khass visa | خاص فيزا | ☐ |
| `reject.other` | 07 Forfait | other | statut | Écarté | Set aside | استُبعد | Tkhlla | تخلى | ☐ |
| `visaKind.none` | 07 Forfait | none | statut | aucun | none | لا شيء | walo | والو | ☐ |
| `visaKind.schengen` | 07 Forfait | schengen | statut | Schengen | Schengen | شنغن | Schengen | شنغن | ☐ |
| `visaKind.evisa` | 07 Forfait | evisa | statut | e-visa | e-visa | تأشيرة إلكترونية | e-visa | فيزا إلكترونية | ☐ |
| `visaKind.on_arrival` | 07 Forfait | on_arrival | statut | à l'arrivée | on arrival | عند الوصول | f lwsoul | فالوصول | ☐ |
| `visaKind.consular` | 07 Forfait | consular | statut | consulaire | consular | قنصلية | consulat | القنصلية | ☐ |
| `visaKind.unknown` | 07 Forfait | unknown | statut | à vérifier | to check | للتحقق | tchuf | تشوف | ☐ |
| `price.captured` | 07 Forfait | captured | statut | Capturé {time} | Captured {time} | التُقط {time} | Ttched {time} | تشد {time} | ☐ |
| `price.fx` | 07 Forfait | fx | libellé | 1 € = {rate} DH · {date} | 1 € = {rate} DH · {date} | 1 € = {rate} DH · {date} | 1 € = {rate} DH · {date} | 1 € = {rate} DH · {date} | ☐ |
| `price.fxMad` | 07 Forfait | fx mad | libellé | Déjà en dirhams | Already in dirhams | بالدرهم أصلًا | Deja b derham | بالدرهم من الأول | ☐ |
| `ready.title` | 08 Prêt à partir | title | titre | Prêt à partir | Ready to go | جاهز للانطلاق | Wajed | واجد | ☐ |
| `ready.soon` | 08 Prêt à partir | soon | aide | La checklist arrive à l'étape suivante. | The checklist arrives in the next step. | قائمة التحقق تصل في الخطوة التالية. | Llista jayya f lkhutwa jaya. | الليستة جاية فالخطوة الجاية. | ☐ |
| `ready.kickerNone` | 08 Prêt à partir | kicker none | statut | Prêt à partir | Ready to go | جاهز للانطلاق | Wajed | واجد | ☑ darija-latn, darija-arab |
| `ready.kickerOne` | 08 Prêt à partir | kicker one | statut | Presque prêt : 1 chose à faire | Almost ready: 1 thing to do | شبه جاهز: شيء واحد للقيام به | Tqriban wajed : 1 haja tdir | تقريبا واجد : حاجة وحدة دير | ☐ |
| `ready.kickerMany` | 08 Prêt à partir | kicker many | statut | Presque prêt : {count} choses à faire | Almost ready: {count} things to do | شبه جاهز: {count} أشياء للقيام بها | Tqriban wajed : {count} d hwayej tdir | تقريبا واجد : {count} ديال الحوايج دير | ☐ |
| `ready.heading` | 08 Prêt à partir | heading | titre | Presque prêt ! | Almost ready! | أوشكت على الجاهزية! | Wajed tqriban ! | واجد تقريبا ! | ☐ |
| `ready.lead` | 08 Prêt à partir | lead | aide | Voilà ce qu'il te faut pour {city}, vérifié pour ton passeport. | Here is what you need for {city}, checked for your passport. | هذا ما تحتاجه لـ {city}، وقد تحققنا منه لجواز سفرك. | Hada li khassek l {city}, mtchek 3la passeport dyalek. | هادا اللي خاصك ل {city}، متشيك على الباسپور ديالك. | ☐ |
| `ready.visaStay` | 08 Prêt à partir | visa stay | libellé | Jusqu'à {days} jours | Up to {days} days | حتى {days} يومًا | Hettaa {days} youm | حتى {days} يوم | ☐ |
| `ready.passportAfter` | 08 Prêt à partir | passport after | libellé | Valide après l'arrivée | Valid after you arrive | صالح بعد الوصول | Salih men b3d lwsoul | صالح من بعد الوصول | ☐ |
| `ready.bagAdd` | 08 Prêt à partir | bag add | libellé | Ajoute une valise chez le partenaire | Add a suitcase with the partner | أضف حقيبة لدى الشريك | Zid valiza 3nd lpartenaire | زيد فاليزة عند لبارتنير | ☐ |
| `ready.bagIn` | 08 Prêt à partir | bag in | libellé | Valise en soute incluse | Checked bag included | حقيبة الشحن مشمولة | Valiza f soute dakhl | فاليزة فالسوت داخلة | ☐ |
| `ready.moneyOf` | 08 Prêt à partir | money of | libellé | De ta dotation 2026 | Of your 2026 allowance | من مخصصك لسنة 2026 | Men dotation dyalek 2026 | من الدوتاسيون ديالك 2026 | ☐ |
| `ready.know` | 08 Prêt à partir | know | titre | BON À SAVOIR | GOOD TO KNOW | مفيد أن تعرف | MEZYAN T3REF | مزيان تعرف | ☐ |
| `ready.knowLoading` | 08 Prêt à partir | know loading | message de Safar | Safar vérifie encore deux trois choses | Safar is checking a few practical things | سافار يتحقق من بعض الأمور العملية | Safar kaychouf chi hwayej | سافار كيشوف شي حوايج | ☐ |
| `ready.knowError` | 08 Prêt à partir | know error | erreur | Bon à savoir n'a pas pu être chargé. | Good to know could not be loaded. | تعذر تحميل المعلومات. | Ma tqdrnach njibo had lm3lumat. | ما قدرناش نجيبو هاد المعلومات. | ☐ |
| `ready.sources` | 08 Prêt à partir | sources | aide | Vérifié par Muse Spark sur {count} sources · {date} | Checked by Muse Spark on {count} sources · {date} | تحقق Muse Spark من {count} مصادر · {date} | Tverifa Muse Spark 3la {count} d masader · {date} | تڤيريفا Muse Spark على {count} د المصادر · {date} | ☐ |
| `ready.sourcesOne` | 08 Prêt à partir | sources one | aide | Vérifié par Muse Spark sur 1 source · {date} | Checked by Muse Spark on 1 source · {date} | تحقق Muse Spark من مصدر واحد · {date} | Tverifa Muse Spark 3la masdar wa7ed · {date} | تڤيريفا Muse Spark على مصدر واحد · {date} | ☐ |
| `ready.sourcesNone` | 08 Prêt à partir | sources none | aide | Vérifié par Muse Spark · {date} | Checked by Muse Spark · {date} | تحقق Muse Spark · {date} | Tverifa Muse Spark · {date} | تڤيريفا Muse Spark · {date} | ☐ |
| `ready.continue` | 08 Prêt à partir | continue | CTA | Continuer | Continue | متابعة | Kemmel | كمّل | ☑ ar, darija-latn, darija-arab |
| `ready.missing` | 08 Prêt à partir | missing | erreur | Termine d'abord le forfait. | Finish the package first. | أنهِ الباقة أولًا. | Kemmel lforfait lwlan. | كمّل الفورفي اللول. | ☐ |
| `check.title` | 09 Vérifie et continue | title | titre | Vérifie et continue | Check and continue | راجع وأكمل | Chouf w kemmel | شوف وكمّل | ☑ darija-latn, darija-arab |
| `check.subtitle` | 09 Vérifie et continue | subtitle | titre | Un dernier coup d'œil avant de payer chez les partenaires. | One last look before you pay on the partners' sites. | نظرة أخيرة قبل الدفع لدى الشركاء. | Chouf akhir merra qbel ma tkhelles 3end chorakae. | شوف آخر مرة قبل ما تخلص عند الشركاء. | ☑ ar, darija-latn, darija-arab |
| `check.nights` | 09 Vérifie et continue | nights | libellé | {city} · {count} nuits | {city} · {count} nights | {city} · {count} ليالٍ | {city} · {count} lilat | {city} · {count} ليلات | ☐ |
| `check.nightsOne` | 09 Vérifie et continue | nights one | libellé | {city} · 1 nuit | {city} · 1 night | {city} · ليلة واحدة | {city} · lila wehda | {city} · ليلة وحدة | ☐ |
| `check.photo` | 09 Vérifie et continue | photo | libellé | Photo · Kiwi.com | Photo · Kiwi.com | صورة · Kiwi.com | Tswira · Kiwi.com | صورة · Kiwi.com | ☑ ar, darija-latn, darija-arab |
| `check.dates` | 09 Vérifie et continue | dates | libellé | Dates | Dates | التواريخ | Tawarikh | التواريخ | ☑ darija-latn |
| `check.datesValue` | 09 Vérifie et continue | dates value | libellé | Du {from} au {to} | {from} to {to} | من {from} إلى {to} | Men {from} l {to} | من {from} ل {to} | ☐ |
| `check.travellers` | 09 Vérifie et continue | travellers | libellé | Voyageurs | Travellers | المسافرون | Li msafrin | المسافرين | ☑ darija-latn |
| `check.adults` | 09 Vérifie et continue | adults | libellé | {count} adultes, départ {city} | {count} adults, from {city} | {count} بالغين، من {city} | {count} kbar, mn {city} | {count} كبار، من {city} | ☐ |
| `check.adultsOne` | 09 Vérifie et continue | adults one | libellé | 1 adulte, départ {city} | 1 adult, from {city} | بالغ واحد، من {city} | Wa7ed kbir, mn {city} | واحد كبير، من {city} | ☐ |
| `check.party` | 09 Vérifie et continue | party | libellé | {adults} adultes, {children} enfants, départ {city} | {adults} adults, {children} children, from {city} | {adults} بالغين، {children} أطفال، من {city} | {adults} kbar, {children} drari, mn {city} | {adults} كبار، {children} دراري، من {city} | ☐ |
| `check.price` | 09 Vérifie et continue | price | libellé | Prix total | Total price | السعر الإجمالي | Taman kamel | الثمن كامل | ☐ |
| `check.priceValue` | 09 Vérifie et continue | price value | libellé | {amount}, vols et hôtel compris | {amount}, flights and hotel included | {amount}، الرحلات والفندق مشمولان | {amount}, tiyara w otel dakhl | {amount}، طيارة و أوطيل داخل | ☐ |
| `check.edit` | 09 Vérifie et continue | edit | CTA | Modifier | Edit | تعديل | Beddel | بدّل | ☐ |
| `check.detail` | 09 Vérifie et continue | detail | CTA | Détail | Detail | التفاصيل | Tafsil | التفاصيل | ☐ |
| `check.hide` | 09 Vérifie et continue | hide | CTA | Masquer | Hide | إخفاء | Khbi | خبي | ☐ |
| `check.cancel` | 09 Vérifie et continue | cancel | CTA | Annulation | Cancellation | الإلغاء | Lilgha2 | الإلغاء | ☑ darija-latn |
| `check.cancelFree` | 09 Vérifie et continue | cancel free | libellé | Hôtel annulable gratuitement. Vols selon chaque compagnie. | Hotel: free cancellation. Flights follow each airline. | الفندق قابل للإلغاء مجانًا. الرحلات حسب كل شركة. | Otel tqder telghih bla flous. Tiyarat 3la hsab charika. | الأوطيل تقدر تلغي بلا فلوس. الطيارات على حساب الشركة. | ☐ |
| `check.cancelNo` | 09 Vérifie et continue | cancel no | libellé | Hôtel non remboursable. Vols selon chaque compagnie. | Hotel non-refundable. Flights follow each airline. | الفندق غير قابل للاسترداد. الرحلات حسب كل شركة. | Otel ma kaytrj3ch. Tiyarat 3la hsab charika. | الأوطيل ما كيرجعش. الطيارات على حساب الشركة. | ☐ |
| `check.shield` | 09 Vérifie et continue | shield | aide | Tu paies chez Kiwi.com et sur le site de l'hôtel. BonSafar ne voit jamais ta carte. | You pay on Kiwi.com and on the hotel's site. BonSafar never sees your card. | تدفع على Kiwi.com وعلى موقع الفندق. BonSafar لا يرى بطاقتك أبدًا. | Katkhalles 3nd Kiwi.com w f site d otel. BonSafar 3omro ma ychouf lcarte dyalek. | كتخلص عند Kiwi.com و فسيت الأوطيل. BonSafar عمره ما يشوف الكارطة ديالك. | ☐ |
| `check.next` | 09 Vérifie et continue | next | CTA | Suivant | Next | التالي | Taliya | التالي | ☐ |
| `check.payTitle` | 09 Vérifie et continue | pay title | titre | Tu vas payer chez Kiwi.com et sur le site de l'hôtel | You will pay on Kiwi.com and on the hotel's site | ستدفع على Kiwi.com وعلى موقع الفندق | Ghatkhalles 3nd Kiwi.com w f site d otel | غتخلص عند Kiwi.com و فسيت الأوطيل | ☐ |
| `check.payBody` | 09 Vérifie et continue | pay body | aide | BonSafar n'encaisse rien. Les liens ouvrent les partenaires, tels quels. | BonSafar does not take payment. The links open the partners, unchanged. | BonSafar لا يقبض أي مبلغ. الروابط تفتح مواقع الشركاء كما هي. | BonSafar ma kayakhodch lflous. Lliens kayhellou lpartenaire kima howa. | BonSafar ما كياخدش الفلوس. الليانات كايحلّو لبارتنير كيما هو. | ☐ |
| `check.openFlight` | 09 Vérifie et continue | open flight | CTA | Ouvrir le vol sur Kiwi.com | Open the flight on Kiwi.com | افتح الرحلة على Kiwi.com | Hell tiyara f Kiwi.com | حل الطيارة ف Kiwi.com | ☐ |
| `check.openHotel` | 09 Vérifie et continue | open hotel | CTA | Ouvrir le site de l'hôtel | Open the hotel's site | افتح موقع الفندق | Hell site d otel | حل سيت الأوطيل | ☐ |
| `check.linkMissing` | 09 Vérifie et continue | link missing | erreur | Ce partenaire n'a pas renvoyé de lien. | This partner did not return a link. | هذا الشريك لم يُرجع رابطًا. | Had lpartenaire ma siftch lien. | هاد لبارتنير ما صيفطش ليان. | ☐ |
| `check.booked` | 09 Vérifie et continue | booked | CTA | J'ai réservé, voir mon dossier | I've booked, see my file | حجزت، أرني ملفي | Hjezt, chouf dossier dyali | حجزت، شوف الدوسيي ديالي | ☐ |
| `check.flight` | 09 Vérifie et continue | flight | libellé | Vol | Flight | الرحلة | Tiyara | طيارة | ☐ |
| `check.hotel` | 09 Vérifie et continue | hotel | libellé | Hôtel | Hotel | الفندق | Otel | أوطيل | ☐ |
| `check.missing` | 09 Vérifie et continue | missing | erreur | Termine d'abord le forfait. | Finish the package first. | أنهِ الباقة أولًا. | Kemmel lforfait lwlan. | كمّل الفورفي اللول. | ☐ |
| `file.kicker` | 10 Dossier | kicker | statut | TON DOSSIER EST PRÊT | YOUR FILE IS READY | ملفك جاهز | DOSSIER DYALEK WAJED | الدوسيي ديالك واجد | ☐ |
| `file.title` | 10 Dossier | title | titre | Bon voyage, {name} ! | Safe travels, {name}! | رحلة سعيدة، {name}! | Trik slama, {name} ! | طريق السلامة، {name}! | ☑ ar, darija-arab |
| `file.titleNoName` | 10 Dossier | title no name | titre | Bon voyage ! | Safe travels! | رحلة سعيدة! | Trik slama ! | طريق السلامة! | ☑ ar, darija-arab |
| `file.demo` | 10 Dossier | demo | libellé | CARTE D'EMBARQUEMENT · DÉMO | BOARDING PASS · DEMO | بطاقة صعود · عرض تجريبي | BITAQAT RKOUB · DIMO | بطاقة الركوب · ديمو | ☑ ar, darija-latn, darija-arab |
| `file.date` | 10 Dossier | date | titre | DATE | DATE | التاريخ | TARIKH | التاريخ | ☐ |
| `file.depart` | 10 Dossier | depart | titre | DÉPART | DEPARTURE | المغادرة | MCHI | المشي | ☐ |
| `file.passengers` | 10 Dossier | passengers | titre | PASSAGERS | PASSENGERS | المسافرون | NAS | الناس | ☐ |
| `file.hotel` | 10 Dossier | hotel | titre | HÔTEL | HOTEL | الفندق | OTEL | أوطيل | ☐ |
| `file.nights` | 10 Dossier | nights | titre | NUITS | NIGHTS | الليالي | LILAT | ليلات | ☐ |
| `file.qr` | 10 Dossier | qr | aide | QR de démonstration. Ta vraie carte arrive du partenaire après le paiement. | Demo QR code. Your real pass arrives from the partner after you pay. | رمز تجريبي. بطاقتك الحقيقية تصل من الشريك بعد الدفع. | QR dyal dimo. Lkarta l7a9i9iya katji men charik men b3d lkhlas. | QR ديال الديمو. الكارطة الحقيقية كاتجي من لبارتنير من بعد الخلاص. | ☑ darija-latn |
| `file.stamp` | 10 Dossier | stamp | libellé | TRIK SLAMA | TRIK SLAMA | TRIK SLAMA | TRIK SLAMA | TRIK SLAMA | ☐ |
| `file.return` | 10 Dossier | return | libellé | Retour | Return | العودة | Rjou3 | الرجوع | ☐ |
| `file.hotelRow` | 10 Dossier | hotel row | libellé | Hôtel | Hotel | الفندق | Otel | أوطيل | ☐ |
| `file.hotelValue` | 10 Dossier | hotel value | libellé | {count} nuits | {count} nights | {count} ليالٍ | {count} lilat | {count} ليلات | ☐ |
| `file.hotelBreakfast` | 10 Dossier | hotel breakfast | libellé | {count} nuits · petit déjeuner | {count} nights · breakfast | {count} ليالٍ · إفطار | {count} lilat · ftor | {count} ليلات · فطور | ☐ |
| `file.readyRow` | 10 Dossier | ready row | libellé | Prêt à partir | Ready to go | جاهز للانطلاق | Wajed | واجد | ☐ |
| `file.readyValue` | 10 Dossier | ready value | libellé | {ok} sur 4 | {ok} of 4 | {ok} من 4 | {ok} men 4 | {ok} من 4 | ☐ |
| `file.poster` | 10 Dossier | poster | CTA | Voir l'affiche | See the poster | عرض الملصق | Chouf l'affiche | شوف الأفيش | ☐ |
| `file.share` | 10 Dossier | share | CTA | Partager | Share | مشاركة | Charek | شارك | ☐ |
| `file.shareText` | 10 Dossier | share text | libellé | Trik slama — {city}, {dates}. {total}. Fait avec BonSafar. | Trik slama — {city}, {dates}. {total}. Made with BonSafar. | trik slama — {city}، {dates}. {total}. صُنع مع BonSafar. | Trik slama — {city}, {dates}. {total}. Mswweb b BonSafar. | trik slama — {city}، {dates}. {total}. مصاوب ب BonSafar. | ☑ ar, darija-arab |
| `file.saveGoogle` | 10 Dossier | save google | CTA | Garde ce voyage avec Google | Keep this trip with Google | احفظ هذه الرحلة مع Google | Khlli had safari m3a Google | خلي هاد السفري مع Google | ☐ |
| `file.savedLocal` | 10 Dossier | saved local | statut | Enregistré sur ce téléphone. | Saved on this phone. | حُفظ على هذا الهاتف. | Ttsjjel f telefon. | تسجّل فالتليفون. | ☐ |
| `file.savedAccount` | 10 Dossier | saved account | statut | Enregistré dans ton compte. | Saved to your account. | حُفظ في حسابك. | Ttsjjel f compte dyalek. | تسجّل فالحساب ديالك. | ☐ |
| `file.missing` | 10 Dossier | missing | erreur | Le dossier n'est pas encore prêt. | The file is not ready yet. | الملف ليس جاهزًا بعد. | Dossier mazal ma wajed. | الدوسيي مازال ما واجد. | ☐ |
| `file.copied` | 10 Dossier | copied | statut | Copié. Tu peux le coller pour le partager. | Copied. You can paste it to share. | تم النسخ. يمكنك لصقه للمشاركة. | Ttnsekh. Tqder tcollih bach tcharkou. | تنسخ. تقدر تلصقه باش تشاركو. | ☐ |
| `poster.bslama` | 10 bis Affiche | bslama | libellé | AU REVOIR {city} | GOODBYE {city} | وداعًا {city} | BSLAMA {city} | بسلامة {city} | ☑ ar, darija-arab |
| `poster.next` | 10 bis Affiche | next | CTA | PROCHAINE ESCALE : {city} | NEXT: {city} | المحطة التالية: {city} | MHATTA JAYA : {city} | المحطة الجاية: {city} | ☑ ar, darija-latn, darija-arab |
| `poster.made` | 10 bis Affiche | made | libellé | FAIT AVEC BONSAFAR | MADE WITH BONSAFAR | صُنع مع BonSafar | MSAWWEB B BONSAFAR | مصاوب ب BonSafar | ☑ ar, darija-latn, darija-arab |
| `poster.rihla` | 10 bis Affiche | rihla | libellé | VOYAGE | JOURNEY | رحلة | RI7LA | رحلة | ☑ darija-latn |
| `poster.loading` | 10 bis Affiche | loading | message de Safar | Safar peint ton affiche | Safar is painting your poster | سافار يرسم ملصقك | Safar kayrsem l'affiche dyalek | سافار كيرسم الأفيش ديالك | ☐ |
| `poster.fallback` | 10 bis Affiche | fallback | erreur | pré-générée avec Muse Image | pre-generated with Muse Image | مُعدّ مسبقًا باستخدام Muse Image | mwajjda men qbel b Muse Image | مصاوبة من قبل ب Muse Image | ☑ ar, darija-latn, darija-arab |
| `poster.share` | 10 bis Affiche | share | CTA | Partager | Share | مشاركة | Charek | شارك | ☐ |
| `poster.error` | 10 bis Affiche | error | erreur | L'affiche n'a pas pu être générée. | The poster could not be generated. | تعذر إنشاء الملصق. | L'affiche ma tqdrnach nrsmuha. | الأفيش ما قدرناش نرسموها. | ☐ |
| `poster.retry` | 10 bis Affiche | retry | CTA | Réessayer | Try again | أعد المحاولة | 3awed | عاود | ☐ |
| `poster.back` | 10 bis Affiche | back | CTA | Retour au dossier | Back to the file | العودة إلى الملف | Rje3 l dossier | رجع للدوسيي | ☐ |
| `hood.title` | Under the hood (jury, EN) | title | titre | (EN) | Under the hood | (EN) | (EN) | (EN) | ☐ |
| `hood.subtitle` | Under the hood (jury, EN) | subtitle | titre | (EN) | Every step, the Meta model that ran it, its time and its cost. Live. | (EN) | (EN) | (EN) | ☐ |
| `hood.elapsed` | Under the hood (jury, EN) | elapsed | libellé | (EN) | ELAPSED | (EN) | (EN) | (EN) | ☐ |
| `hood.cost` | Under the hood (jury, EN) | cost | libellé | (EN) | AI COST | (EN) | (EN) | (EN) | ☐ |
| `hood.calls` | Under the hood (jury, EN) | calls | libellé | (EN) | MODEL CALLS | (EN) | (EN) | (EN) | ☐ |
| `hood.transcribe` | Under the hood (jury, EN) | transcribe | libellé | (EN) | Muse Voice Transcribe | (EN) | (EN) | (EN) | ☐ |
| `hood.spark` | Under the hood (jury, EN) | spark | libellé | (EN) | Muse Spark | (EN) | (EN) | (EN) | ☐ |
| `hood.wonder` | Under the hood (jury, EN) | wonder | libellé | (EN) | Muse Wonder | (EN) | (EN) | (EN) | ☐ |
| `hood.tools` | Under the hood (jury, EN) | tools | libellé | (EN) | Live data tools: Kiwi.com, trivago | (EN) | (EN) | (EN) | ☐ |
| `hood.time` | Under the hood (jury, EN) | time | libellé | (EN) | TIME | (EN) | (EN) | (EN) | ☐ |
| `hood.step` | Under the hood (jury, EN) | step | libellé | (EN) | STEP | (EN) | (EN) | (EN) | ☐ |
| `hood.model` | Under the hood (jury, EN) | model | libellé | (EN) | MODEL OR TOOL | (EN) | (EN) | (EN) | ☐ |
| `hood.latency` | Under the hood (jury, EN) | latency | libellé | (EN) | LATENCY | (EN) | (EN) | (EN) | ☐ |
| `hood.costCol` | Under the hood (jury, EN) | cost col | libellé | (EN) | COST | (EN) | (EN) | (EN) | ☐ |
| `hood.guardrail` | Under the hood (jury, EN) | guardrail | libellé | (EN) | Price guardrail. | (EN) | (EN) | (EN) | ☐ |
| `hood.guardrailBody` | Under the hood (jury, EN) | guardrail body | libellé | (EN) | {passed} passed, {blocked} blocked. Prices are read server-side from Kiwi.com and trivago. Models only handle offer IDs and can never write a price. | (EN) | (EN) | (EN) | ☐ |
| `hood.recorded` | Under the hood (jury, EN) | recorded | libellé | (EN) | recorded live: {time}, {cost} | (EN) | (EN) | (EN) | ☐ |
| `hood.subtitles` | Under the hood (jury, EN) | subtitles | titre | (EN) | English subtitles | (EN) | (EN) | (EN) | ☐ |
| `hood.empty` | Under the hood (jury, EN) | empty | libellé | (EN) | Events appear here as soon as a call finishes. | (EN) | (EN) | (EN) | ☐ |
| `jury.badge` | Page jury (EN) | badge | libellé | (EN) | JUDGES' DEMO · 60 SECONDS | (EN) | (EN) | (EN) | ☐ |
| `jury.title` | Page jury (EN) | title | titre | (EN) | A travel agency in your pocket, that understands Moroccan darija. | (EN) | (EN) | (EN) | ☐ |
| `jury.soon` | Page jury (EN) | soon | aide | (EN) | The guided 60-second demo opens here soon. Meanwhile, try the traveller app or the voice test bench. | (EN) | (EN) | (EN) | ☐ |
| `jury.tryApp` | Page jury (EN) | try app | libellé | (EN) | Try the traveller app | (EN) | (EN) | (EN) | ☐ |
| `jury.voiceBench` | Page jury (EN) | voice bench | libellé | (EN) | Open the voice test bench | (EN) | (EN) | (EN) | ☐ |
| `lang.darija-latn` | Sélecteur de langue | darija-latn | chip | (EN) | Darija | (EN) | (EN) | (EN) | ☐ |
| `lang.darija-arab` | Sélecteur de langue | darija-arab | chip | (EN) | Darija | (EN) | (EN) | (EN) | ☐ |
| `lang.fr` | Sélecteur de langue | fr | chip | (EN) | Français | (EN) | (EN) | (EN) | ☐ |
| `lang.ar` | Sélecteur de langue | ar | chip | (EN) | العربية | (EN) | (EN) | (EN) | ☐ |
| `lang.en` | Sélecteur de langue | en | chip | (EN) | English | (EN) | (EN) | (EN) | ☐ |
| `lang.sample.darija-latn` | Sélecteur de langue | sample · darija-latn | chip | (EN) | Salam, labas ? | (EN) | (EN) | (EN) | ☐ |
| `lang.sample.darija-arab` | Sélecteur de langue | sample · darija-arab | chip | (EN) | سلام، لاباس؟ | (EN) | (EN) | (EN) | ☐ |
| `lang.sample.fr` | Sélecteur de langue | sample · fr | chip | (EN) | Bonjour, ça va ? | (EN) | (EN) | (EN) | ☐ |
| `lang.sample.ar` | Sélecteur de langue | sample · ar | chip | (EN) | مرحبا، كيف حالك؟ | (EN) | (EN) | (EN) | ☐ |
| `lang.sample.en` | Sélecteur de langue | sample · en | chip | (EN) | Hi, how are you? | (EN) | (EN) | (EN) | ☐ |
| `safar.idle` | Mascotte (lecteur d'écran) | idle | libellé (aria) | Safar au repos, les yeux plissés de bonheur | Safar resting, eyes closed in a smile | سافار مرتاح، عيناه مغمضتان بابتسامة | Safar mrtah, 3inih mseddin w howa mbsem | سافار مرتاح، عينيه مسدودين وهو مبسم | ☐ |
| `safar.listening` | Mascotte (lecteur d'écran) | listening | libellé (aria) | Safar qui écoute, les yeux grands ouverts, les ailes qui battent vite | Safar listening, eyes wide open, wings flapping fast | سافار يستمع، عيناه مفتوحتان وجناحاه يخفقان بسرعة | Safar kaytsnet, 3inih mehloulin, jnaho kaykheffo bzerba | سافار كيتسنّت، عينيه محلولين، جناحو كيخفّو بزربة | ☐ |
| `safar.thinking` | Mascotte (lecteur d'écran) | thinking | libellé (aria) | Safar qui réfléchit, le regard vers le haut, trois points au-dessus de lui | Safar thinking, looking up, three dots above him | سافار يفكر، ناظر إلى الأعلى، وثلاث نقاط فوق رأسه | Safar kayfker, chayef lfoq, 3 noqat foq raso | سافار كيفكّر، شايف لفوق، ثلاثة د النقاط فوق راسو | ☐ |
| `safar.found` | Mascotte (lecteur d'écran) | found | libellé (aria) | Safar ravi, qui saute de joie, la bouche grande ouverte | Safar delighted, jumping for joy, mouth wide open | سافار مسرور، يقفز فرحًا وفمه مفتوح | Safar ferhan, kaynqqez, fommo mehloul | سافار فرحان، كينقّز، فمو محلول | ☐ |
| `safar.oops` | Mascotte (lecteur d'écran) | oops | libellé (aria) | Safar embêté, sourcils inquiets et goutte de sueur | Safar worried, furrowed brows and a drop of sweat | سافار قلق، حاجباه مشدودان وقطرة عرق | Safar mqelleq, hwaejebo mhemmnin w qetra d l3erq | سافار مقلّق، حواجبو مهمّمين وقطرة د العرق | ☐ |
| `safar.bye` | Mascotte (lecteur d'écran) | bye | libellé (aria) | Safar qui fait un clin d'œil et s'envole : trik slama | Safar winking and flying off: trik slama | سافار يغمز ويطير: trik slama | Safar kayghmez b 3ino w kaytir: trik slama | سافار كيغمز بعينو وكيطير: trik slama | ☑ ar, darija-arab |
