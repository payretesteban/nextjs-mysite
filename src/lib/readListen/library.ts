import type { LangCode, Level, ReadListenText, TopicId } from "./options";

/** A built-in text: one topic at one level, in all six languages, with sentences lined up by index. */
export interface LibraryEntry {
  topic: TopicId;
  level: Level;
  sentences: Record<LangCode, string[]>;
  /** For conversations: the two speakers; lines alternate between them. */
  speakers?: [string, string];
}

/**
 * Hand-checked texts used when the AI isn't available (no key, quota used up, errors) and for the
 * first text on the page. Three topics plus a conversation at every level; other topics fall back to one of these.
 */
export const LIBRARY: LibraryEntry[] = [
  // ——— At the market ———
  {
    topic: "market",
    level: "A1",
    sentences: {
      en: ["Ana goes to the market on Saturdays.", "She buys apples and bread.", "The market is small and lively."],
      es: ["Ana va al mercado los sábados.", "Compra manzanas y pan.", "El mercado es pequeño y animado."],
      fr: ["Ana va au marché le samedi.", "Elle achète des pommes et du pain.", "Le marché est petit et animé."],
      pt: ["Ana vai à feira aos sábados.", "Ela compra maçãs e pão.", "A feira é pequena e animada."],
      it: ["Ana va al mercato il sabato.", "Compra mele e pane.", "Il mercato è piccolo e vivace."],
      de: ["Ana geht samstags auf den Markt.", "Sie kauft Äpfel und Brot.", "Der Markt ist klein und lebendig."],
    },
  },
  {
    topic: "market",
    level: "A2",
    sentences: {
      en: [
        "Last Saturday, Ana went to the market with her brother.",
        "They bought fresh tomatoes, cheese and a big melon.",
        "The seller gave them a free lemon because they were friendly.",
      ],
      es: [
        "El sábado pasado, Ana fue al mercado con su hermano.",
        "Compraron tomates frescos, queso y un melón grande.",
        "El vendedor les regaló un limón porque fueron amables.",
      ],
      fr: [
        "Samedi dernier, Ana est allée au marché avec son frère.",
        "Ils ont acheté des tomates fraîches, du fromage et un gros melon.",
        "Le vendeur leur a offert un citron parce qu'ils étaient aimables.",
      ],
      pt: [
        "No sábado passado, Ana foi à feira com o irmão.",
        "Eles compraram tomates frescos, queijo e um melão grande.",
        "O vendedor deu um limão de presente para eles porque foram simpáticos.",
      ],
      it: [
        "Sabato scorso Ana è andata al mercato con suo fratello.",
        "Hanno comprato pomodori freschi, formaggio e un grande melone.",
        "Il venditore ha regalato loro un limone perché erano gentili.",
      ],
      de: [
        "Letzten Samstag ist Ana mit ihrem Bruder auf den Markt gegangen.",
        "Sie haben frische Tomaten, Käse und eine große Melone gekauft.",
        "Der Verkäufer hat ihnen eine Zitrone geschenkt, weil sie freundlich waren.",
      ],
    },
  },
  {
    topic: "market",
    level: "B1",
    sentences: {
      en: [
        "Ana prefers the market to the supermarket because she can talk to the people who grow the food.",
        "Every week she tries something she has never cooked before.",
        "Next month she is going to start a small blog with recipes based on what she finds.",
      ],
      es: [
        "Ana prefiere el mercado al supermercado porque puede hablar con las personas que cultivan los alimentos.",
        "Cada semana prueba algo que nunca ha cocinado.",
        "El mes que viene va a empezar un pequeño blog con recetas basadas en lo que encuentra.",
      ],
      fr: [
        "Ana préfère le marché au supermarché parce qu'elle peut parler avec les gens qui cultivent les produits.",
        "Chaque semaine, elle essaie quelque chose qu'elle n'a jamais cuisiné.",
        "Le mois prochain, elle va lancer un petit blog de recettes inspirées de ce qu'elle trouve.",
      ],
      pt: [
        "Ana prefere a feira ao supermercado porque pode conversar com as pessoas que cultivam os alimentos.",
        "Toda semana ela experimenta algo que nunca cozinhou.",
        "No mês que vem, ela vai começar um pequeno blog com receitas baseadas no que encontra.",
      ],
      it: [
        "Ana preferisce il mercato al supermercato perché può parlare con le persone che coltivano il cibo.",
        "Ogni settimana prova qualcosa che non ha mai cucinato.",
        "Il mese prossimo inizierà un piccolo blog con ricette basate su ciò che trova.",
      ],
      de: [
        "Ana geht lieber auf den Markt als in den Supermarkt, weil sie mit den Leuten sprechen kann, die das Essen anbauen.",
        "Jede Woche probiert sie etwas, das sie noch nie gekocht hat.",
        "Nächsten Monat will sie einen kleinen Blog mit Rezepten starten, die auf ihren Funden basieren.",
      ],
    },
  },
  {
    topic: "market",
    level: "B2",
    sentences: {
      en: [
        "Although the market is more expensive than the supermarket, Ana believes the quality makes up for the price.",
        "She has noticed that the stalls change with the seasons, which encourages her to cook in a more varied way.",
        "If more people shopped there, she argues, small farmers would have a better chance of surviving.",
      ],
      es: [
        "Aunque el mercado es más caro que el supermercado, Ana cree que la calidad compensa el precio.",
        "Se ha dado cuenta de que los puestos cambian con las estaciones, lo que la anima a cocinar de forma más variada.",
        "Según ella, si más gente comprara allí, los pequeños agricultores tendrían más posibilidades de sobrevivir.",
      ],
      fr: [
        "Bien que le marché soit plus cher que le supermarché, Ana pense que la qualité compense le prix.",
        "Elle a remarqué que les étals changent avec les saisons, ce qui l'encourage à cuisiner de façon plus variée.",
        "Selon elle, si davantage de gens y faisaient leurs courses, les petits producteurs auraient plus de chances de survivre.",
      ],
      pt: [
        "Embora a feira seja mais cara que o supermercado, Ana acredita que a qualidade compensa o preço.",
        "Ela percebeu que as barracas mudam com as estações, o que a incentiva a cozinhar de forma mais variada.",
        "Segundo ela, se mais pessoas comprassem ali, os pequenos agricultores teriam mais chances de sobreviver.",
      ],
      it: [
        "Anche se il mercato è più caro del supermercato, Ana pensa che la qualità valga il prezzo.",
        "Ha notato che le bancarelle cambiano con le stagioni, e questo la spinge a cucinare in modo più vario.",
        "Secondo lei, se più persone facessero la spesa lì, i piccoli agricoltori avrebbero più possibilità di sopravvivere.",
      ],
      de: [
        "Obwohl der Markt teurer ist als der Supermarkt, findet Ana, dass die Qualität den Preis wert ist.",
        "Sie hat bemerkt, dass sich die Stände mit den Jahreszeiten verändern, was sie dazu bringt, abwechslungsreicher zu kochen.",
        "Wenn mehr Leute dort einkaufen würden, meint sie, hätten kleine Bauern bessere Chancen zu überleben.",
      ],
    },
  },
  {
    topic: "market",
    level: "C1",
    sentences: {
      en: [
        "What draws Ana to the market is not merely the produce but the unhurried conversations that spring up between the stalls.",
        "Vendors who once greeted her with polite indifference now set aside the ripest figs for her, as if rewarding her loyalty.",
        "In an age of one-click deliveries, she sees these small exchanges as a quiet act of resistance.",
      ],
      es: [
        "Lo que atrae a Ana al mercado no son solo los productos, sino las conversaciones pausadas que surgen entre los puestos.",
        "Los vendedores que antes la saludaban con cortés indiferencia ahora le guardan los higos más maduros, como si premiaran su fidelidad.",
        "En una época de entregas con un solo clic, ella ve estos pequeños intercambios como un discreto acto de resistencia.",
      ],
      fr: [
        "Ce qui attire Ana au marché, ce ne sont pas seulement les produits, mais les conversations sans hâte qui naissent entre les étals.",
        "Les marchands qui l'accueillaient autrefois avec une indifférence polie lui mettent désormais de côté les figues les plus mûres, comme pour récompenser sa fidélité.",
        "À l'ère des livraisons en un clic, elle voit dans ces petits échanges un discret acte de résistance.",
      ],
      pt: [
        "O que atrai Ana à feira não são apenas os produtos, mas as conversas sem pressa que surgem entre as barracas.",
        "Os feirantes que antes a cumprimentavam com uma indiferença educada agora separam para ela os figos mais maduros, como se recompensassem sua fidelidade.",
        "Numa época de entregas com um clique, ela vê essas pequenas trocas como um discreto ato de resistência.",
      ],
      it: [
        "Ciò che attira Ana al mercato non sono soltanto i prodotti, ma le conversazioni senza fretta che nascono tra le bancarelle.",
        "I venditori che un tempo la salutavano con cortese indifferenza ora le mettono da parte i fichi più maturi, quasi a premiare la sua fedeltà.",
        "In un'epoca di consegne con un clic, lei considera questi piccoli scambi un silenzioso atto di resistenza.",
      ],
      de: [
        "Was Ana auf den Markt zieht, sind nicht nur die Waren, sondern die gemächlichen Gespräche, die sich zwischen den Ständen ergeben.",
        "Händler, die sie früher mit höflicher Gleichgültigkeit begrüßten, legen ihr heute die reifsten Feigen zurück, als wollten sie ihre Treue belohnen.",
        "In einer Zeit der Lieferungen per Mausklick sieht sie in diesen kleinen Begegnungen einen stillen Akt des Widerstands.",
      ],
    },
  },
  {
    topic: "market",
    level: "C2",
    sentences: {
      en: [
        "The market, with its cacophony of haggling and its unruly pyramids of fruit, is for Ana a living archive of the neighborhood.",
        "Beneath the ostensibly trivial ritual of weighing apricots lies an intricate web of trust, gossip and memory that no algorithm could replicate.",
        "She suspects that, were it ever to vanish, the district would lose not a shopping venue but a piece of its very identity.",
      ],
      es: [
        "El mercado, con su algarabía de regateos y sus desordenadas pirámides de fruta, es para Ana un archivo vivo del barrio.",
        "Bajo el ritual aparentemente trivial de pesar albaricoques se esconde un intrincado entramado de confianza, chismes y memoria que ningún algoritmo podría reproducir.",
        "Sospecha que, si algún día desapareciera, el barrio no perdería un lugar de compras, sino una parte de su propia identidad.",
      ],
      fr: [
        "Le marché, avec son brouhaha de marchandages et ses pyramides de fruits désordonnées, est pour Ana une archive vivante du quartier.",
        "Sous le rituel en apparence anodin de la pesée des abricots se cache un réseau complexe de confiance, de commérages et de souvenirs qu'aucun algorithme ne saurait reproduire.",
        "Elle soupçonne que, s'il venait à disparaître, le quartier ne perdrait pas un simple lieu d'achats, mais une part de son identité même.",
      ],
      pt: [
        "A feira, com sua algazarra de pechinchas e suas pirâmides desordenadas de frutas, é para Ana um arquivo vivo do bairro.",
        "Por trás do ritual aparentemente banal de pesar damascos esconde-se uma intrincada rede de confiança, fofocas e memória que nenhum algoritmo seria capaz de reproduzir.",
        "Ela desconfia que, se um dia desaparecesse, o bairro não perderia um lugar de compras, mas uma parte da sua própria identidade.",
      ],
      it: [
        "Il mercato, con il suo frastuono di contrattazioni e le sue disordinate piramidi di frutta, è per Ana un archivio vivente del quartiere.",
        "Dietro il rituale apparentemente banale della pesatura delle albicocche si cela un'intricata rete di fiducia, pettegolezzi e memoria che nessun algoritmo potrebbe riprodurre.",
        "Sospetta che, se un giorno scomparisse, il quartiere non perderebbe un luogo di acquisti, ma una parte della sua stessa identità.",
      ],
      de: [
        "Der Markt mit seinem Stimmengewirr aus Feilschen und seinen ungeordneten Obstpyramiden ist für Ana ein lebendiges Archiv des Viertels.",
        "Hinter dem scheinbar belanglosen Ritual, Aprikosen abzuwiegen, verbirgt sich ein feines Geflecht aus Vertrauen, Klatsch und Erinnerung, das kein Algorithmus nachbilden könnte.",
        "Sie ahnt, dass das Viertel, sollte er je verschwinden, nicht bloß einen Einkaufsort verlöre, sondern ein Stück seiner eigenen Identität.",
      ],
    },
  },

  // ——— Travel ———
  {
    topic: "travel",
    level: "A1",
    sentences: {
      en: ["Leo takes the train to the sea.", "The trip is two hours long.", "He looks at the fields and eats a sandwich."],
      es: ["Leo toma el tren para ir al mar.", "El viaje dura dos horas.", "Mira los campos y come un bocadillo."],
      fr: ["Leo prend le train pour aller à la mer.", "Le voyage dure deux heures.", "Il regarde les champs et mange un sandwich."],
      pt: ["Leo pega o trem para ir à praia.", "A viagem dura duas horas.", "Ele olha os campos e come um sanduíche."],
      it: ["Leo prende il treno per andare al mare.", "Il viaggio dura due ore.", "Guarda i campi e mangia un panino."],
      de: ["Leo fährt mit dem Zug ans Meer.", "Die Fahrt dauert zwei Stunden.", "Er schaut auf die Felder und isst ein belegtes Brot."],
    },
  },
  {
    topic: "travel",
    level: "A2",
    sentences: {
      en: [
        "Last summer, Leo visited a small town in the mountains.",
        "He stayed in a cheap hotel and walked a lot every day.",
        "On the last night, it rained, so he played cards with the hotel owner.",
      ],
      es: [
        "El verano pasado, Leo visitó un pueblo pequeño en las montañas.",
        "Se quedó en un hotel barato y caminó mucho todos los días.",
        "La última noche llovió, así que jugó a las cartas con el dueño del hotel.",
      ],
      fr: [
        "L'été dernier, Leo a visité un petit village dans les montagnes.",
        "Il a logé dans un hôtel bon marché et il a beaucoup marché tous les jours.",
        "La dernière nuit, il a plu, alors il a joué aux cartes avec le propriétaire de l'hôtel.",
      ],
      pt: [
        "No verão passado, Leo visitou uma cidadezinha nas montanhas.",
        "Ele ficou num hotel barato e caminhou muito todos os dias.",
        "Na última noite choveu, então ele jogou cartas com o dono do hotel.",
      ],
      it: [
        "L'estate scorsa Leo ha visitato un paesino in montagna.",
        "Ha dormito in un albergo economico e ha camminato molto ogni giorno.",
        "L'ultima sera ha piovuto, così ha giocato a carte con il proprietario dell'albergo.",
      ],
      de: [
        "Letzten Sommer hat Leo ein kleines Dorf in den Bergen besucht.",
        "Er hat in einem günstigen Hotel übernachtet und ist jeden Tag viel gewandert.",
        "Am letzten Abend hat es geregnet, also hat er mit dem Hotelbesitzer Karten gespielt.",
      ],
    },
  },
  {
    topic: "travel",
    level: "B1",
    sentences: {
      en: [
        "Leo has always wanted to travel without a detailed plan, so this year he finally tried it.",
        "When he arrived in Lisbon, he asked locals for advice instead of reading guidebooks.",
        "He is going to repeat the experience next year because he discovered places he would never have found online.",
      ],
      es: [
        "Leo siempre ha querido viajar sin un plan detallado, así que este año por fin lo intentó.",
        "Cuando llegó a Lisboa, pidió consejos a la gente del lugar en lugar de leer guías.",
        "Va a repetir la experiencia el año que viene porque descubrió lugares que nunca habría encontrado en internet.",
      ],
      fr: [
        "Leo a toujours voulu voyager sans plan précis, alors cette année il a enfin essayé.",
        "Quand il est arrivé à Lisbonne, il a demandé conseil aux habitants au lieu de lire des guides.",
        "Il va recommencer l'année prochaine, car il a découvert des endroits qu'il n'aurait jamais trouvés sur Internet.",
      ],
      pt: [
        "Leo sempre quis viajar sem um plano detalhado, então este ano ele finalmente tentou.",
        "Quando chegou a Lisboa, pediu conselhos aos moradores em vez de ler guias.",
        "Ele vai repetir a experiência no ano que vem, porque descobriu lugares que nunca teria encontrado na internet.",
      ],
      it: [
        "Leo ha sempre voluto viaggiare senza un piano preciso, così quest'anno finalmente ci ha provato.",
        "Quando è arrivato a Lisbona, ha chiesto consigli alla gente del posto invece di leggere le guide.",
        "Ripeterà l'esperienza l'anno prossimo, perché ha scoperto posti che non avrebbe mai trovato su internet.",
      ],
      de: [
        "Leo wollte schon immer ohne genauen Plan reisen, also hat er es dieses Jahr endlich ausprobiert.",
        "Als er in Lissabon ankam, fragte er Einheimische um Rat, anstatt Reiseführer zu lesen.",
        "Nächstes Jahr will er es wiederholen, weil er Orte entdeckt hat, die er im Internet nie gefunden hätte.",
      ],
    },
  },
  {
    topic: "travel",
    level: "B2",
    sentences: {
      en: [
        "Traveling slowly, Leo argues, allows you to understand a place rather than simply collect photos of it.",
        "On his latest trip, he spent a whole week in one village, which gave him time to learn a few phrases of the local dialect.",
        "Had he rushed from city to city, he admits, he would have missed the moments that made the journey memorable.",
      ],
      es: [
        "Viajar despacio, sostiene Leo, permite entender un lugar en vez de simplemente coleccionar fotos de él.",
        "En su último viaje pasó una semana entera en un solo pueblo, lo que le dio tiempo para aprender algunas frases del dialecto local.",
        "Reconoce que, si hubiera ido corriendo de ciudad en ciudad, se habría perdido los momentos que hicieron memorable el viaje.",
      ],
      fr: [
        "Voyager lentement, affirme Leo, permet de comprendre un lieu plutôt que de simplement en collectionner les photos.",
        "Lors de son dernier voyage, il a passé une semaine entière dans un seul village, ce qui lui a laissé le temps d'apprendre quelques phrases du dialecte local.",
        "Il admet que, s'il avait couru de ville en ville, il aurait manqué les moments qui ont rendu ce voyage mémorable.",
      ],
      pt: [
        "Viajar devagar, defende Leo, permite entender um lugar em vez de apenas colecionar fotos dele.",
        "Na última viagem, ele passou uma semana inteira numa única vila, o que lhe deu tempo de aprender algumas frases do dialeto local.",
        "Ele admite que, se tivesse corrido de cidade em cidade, teria perdido os momentos que tornaram a viagem inesquecível.",
      ],
      it: [
        "Viaggiare lentamente, sostiene Leo, permette di capire un luogo invece di collezionarne semplicemente le foto.",
        "Durante l'ultimo viaggio ha trascorso un'intera settimana in un solo paese, il che gli ha dato il tempo di imparare qualche frase del dialetto locale.",
        "Ammette che, se avesse corso da una città all'altra, si sarebbe perso i momenti che hanno reso il viaggio memorabile.",
      ],
      de: [
        "Langsames Reisen, meint Leo, hilft dabei, einen Ort zu verstehen, statt nur Fotos davon zu sammeln.",
        "Auf seiner letzten Reise verbrachte er eine ganze Woche in einem einzigen Dorf, was ihm Zeit gab, ein paar Sätze im örtlichen Dialekt zu lernen.",
        "Wäre er von Stadt zu Stadt gehetzt, gibt er zu, hätte er die Momente verpasst, die die Reise unvergesslich machten.",
      ],
    },
  },
  {
    topic: "travel",
    level: "C1",
    sentences: {
      en: [
        "It was on a delayed night train, of all places, that Leo realized how much he valued the unplanned parts of travel.",
        "Strangers who would ordinarily have ignored one another ended up sharing food, stories and, eventually, a surprisingly candid discussion about home.",
        "He has since come to regard inconvenience not as something to be avoided at all costs, but as an invitation to connect.",
      ],
      es: [
        "Fue precisamente en un tren nocturno con retraso donde Leo se dio cuenta de cuánto valoraba lo imprevisto de los viajes.",
        "Desconocidos que normalmente se habrían ignorado terminaron compartiendo comida, historias y, al final, una conversación sorprendentemente sincera sobre sus hogares.",
        "Desde entonces considera los contratiempos no como algo que haya que evitar a toda costa, sino como una invitación a conectar con los demás.",
      ],
      fr: [
        "C'est dans un train de nuit en retard, justement, que Leo a compris à quel point il tenait aux imprévus du voyage.",
        "Des inconnus qui, d'ordinaire, se seraient ignorés ont fini par partager de la nourriture, des histoires et même une discussion étonnamment franche sur leur chez-soi.",
        "Depuis, il voit les contretemps non comme une chose à éviter à tout prix, mais comme une invitation à aller vers les autres.",
      ],
      pt: [
        "Foi justamente num trem noturno atrasado que Leo percebeu o quanto valorizava o lado imprevisto das viagens.",
        "Desconhecidos que normalmente se ignorariam acabaram dividindo comida, histórias e, por fim, uma conversa surpreendentemente sincera sobre suas casas.",
        "Desde então, ele passou a ver os contratempos não como algo a evitar a qualquer custo, mas como um convite para se aproximar das pessoas.",
      ],
      it: [
        "È stato proprio su un treno notturno in ritardo che Leo ha capito quanto apprezzasse gli imprevisti del viaggio.",
        "Sconosciuti che di solito si sarebbero ignorati hanno finito per condividere cibo, storie e, alla fine, una conversazione sorprendentemente sincera sulle loro case.",
        "Da allora considera i disagi non come qualcosa da evitare a ogni costo, ma come un invito a entrare in contatto con gli altri.",
      ],
      de: [
        "Ausgerechnet in einem verspäteten Nachtzug wurde Leo klar, wie sehr er die ungeplanten Seiten des Reisens schätzt.",
        "Fremde, die sich sonst ignoriert hätten, teilten schließlich Essen, Geschichten und am Ende ein erstaunlich offenes Gespräch über ihr Zuhause.",
        "Seitdem sieht er Unannehmlichkeiten nicht als etwas, das um jeden Preis zu vermeiden ist, sondern als Einladung, Menschen näherzukommen.",
      ],
    },
  },
  {
    topic: "travel",
    level: "C2",
    sentences: {
      en: [
        "For Leo, the romance of travel has less to do with the destination than with the gradual unraveling of his own assumptions.",
        "Each unfamiliar custom, however baffling at first, chips away at the comfortable certainty that his way of living is the default.",
        "He returns home not so much transformed as unsettled, and he has learned to treasure that faint, lingering sense of dislocation.",
      ],
      es: [
        "Para Leo, el encanto de viajar tiene menos que ver con el destino que con el paulatino desmoronamiento de sus propias certezas.",
        "Cada costumbre desconocida, por desconcertante que resulte al principio, va erosionando la cómoda convicción de que su forma de vivir es la norma.",
        "Vuelve a casa no tanto transformado como inquieto, y ha aprendido a atesorar esa leve y persistente sensación de desarraigo.",
      ],
      fr: [
        "Pour Leo, le charme du voyage tient moins à la destination qu'au lent effritement de ses propres certitudes.",
        "Chaque coutume inconnue, aussi déroutante soit-elle au premier abord, entame la confortable conviction que sa manière de vivre est la norme.",
        "Il rentre chez lui moins transformé que troublé, et il a appris à chérir ce léger sentiment de dépaysement qui s'attarde.",
      ],
      pt: [
        "Para Leo, o encanto de viajar tem menos a ver com o destino do que com o lento desmoronar das suas próprias certezas.",
        "Cada costume desconhecido, por mais desconcertante que pareça de início, vai corroendo a confortável convicção de que o seu modo de vida é o padrão.",
        "Ele volta para casa não tanto transformado quanto inquieto, e aprendeu a valorizar essa leve e persistente sensação de deslocamento.",
      ],
      it: [
        "Per Leo, il fascino del viaggio ha meno a che fare con la meta che con il lento sgretolarsi delle sue stesse certezze.",
        "Ogni usanza sconosciuta, per quanto sconcertante all'inizio, intacca la comoda convinzione che il suo modo di vivere sia la norma.",
        "Torna a casa non tanto trasformato quanto inquieto, e ha imparato a custodire quel lieve, persistente senso di spaesamento.",
      ],
      de: [
        "Für Leo hat der Reiz des Reisens weniger mit dem Ziel zu tun als mit dem allmählichen Bröckeln seiner eigenen Gewissheiten.",
        "Jeder fremde Brauch, so verwirrend er zunächst auch sein mag, nagt an der bequemen Überzeugung, seine Lebensweise sei die selbstverständliche.",
        "Er kehrt nicht so sehr verwandelt als vielmehr verunsichert nach Hause zurück und hat gelernt, dieses leise, nachklingende Gefühl der Fremdheit zu schätzen.",
      ],
    },
  },

  // ——— Cooking ———
  {
    topic: "cooking",
    level: "A1",
    sentences: {
      en: ["Mia cooks pasta for dinner.", "She adds tomato sauce and cheese.", "Her family likes the food very much."],
      es: ["Mia cocina pasta para la cena.", "Añade salsa de tomate y queso.", "A su familia le gusta mucho la comida."],
      fr: ["Mia prépare des pâtes pour le dîner.", "Elle ajoute de la sauce tomate et du fromage.", "Sa famille aime beaucoup le repas."],
      pt: ["Mia faz macarrão para o jantar.", "Ela coloca molho de tomate e queijo.", "A família dela gosta muito da comida."],
      it: ["Mia cucina la pasta per cena.", "Aggiunge il sugo di pomodoro e il formaggio.", "Alla sua famiglia piace molto il piatto."],
      de: ["Mia kocht Nudeln zum Abendessen.", "Sie gibt Tomatensoße und Käse dazu.", "Ihre Familie mag das Essen sehr."],
    },
  },
  {
    topic: "cooking",
    level: "A2",
    sentences: {
      en: [
        "Yesterday, Mia made soup for the first time.",
        "She cut carrots, onions and potatoes, and then she cooked them slowly.",
        "The soup was a little salty, but her friends ate everything.",
      ],
      es: [
        "Ayer, Mia hizo sopa por primera vez.",
        "Cortó zanahorias, cebollas y patatas, y después las cocinó despacio.",
        "La sopa estaba un poco salada, pero sus amigos se lo comieron todo.",
      ],
      fr: [
        "Hier, Mia a fait une soupe pour la première fois.",
        "Elle a coupé des carottes, des oignons et des pommes de terre, puis elle les a fait cuire doucement.",
        "La soupe était un peu salée, mais ses amis ont tout mangé.",
      ],
      pt: [
        "Ontem, Mia fez sopa pela primeira vez.",
        "Ela cortou cenouras, cebolas e batatas e depois cozinhou tudo devagar.",
        "A sopa estava um pouco salgada, mas os amigos dela comeram tudo.",
      ],
      it: [
        "Ieri Mia ha preparato la minestra per la prima volta.",
        "Ha tagliato carote, cipolle e patate, e poi le ha cotte lentamente.",
        "La minestra era un po' salata, ma i suoi amici hanno mangiato tutto.",
      ],
      de: [
        "Gestern hat Mia zum ersten Mal Suppe gekocht.",
        "Sie hat Karotten, Zwiebeln und Kartoffeln geschnitten und sie dann langsam gekocht.",
        "Die Suppe war ein bisschen salzig, aber ihre Freunde haben alles aufgegessen.",
      ],
    },
  },
  {
    topic: "cooking",
    level: "B1",
    sentences: {
      en: [
        "Since she moved to a new apartment, Mia has been cooking more often at home.",
        "She usually follows recipes from her grandmother, but she likes to change a few ingredients.",
        "This weekend she is going to invite her neighbors and prepare a dish from her home country.",
      ],
      es: [
        "Desde que se mudó a un piso nuevo, Mia cocina en casa más a menudo.",
        "Normalmente sigue las recetas de su abuela, pero le gusta cambiar algunos ingredientes.",
        "Este fin de semana va a invitar a sus vecinos y preparar un plato de su país.",
      ],
      fr: [
        "Depuis qu'elle a emménagé dans un nouvel appartement, Mia cuisine plus souvent à la maison.",
        "Elle suit généralement les recettes de sa grand-mère, mais elle aime changer quelques ingrédients.",
        "Ce week-end, elle va inviter ses voisins et préparer un plat de son pays d'origine.",
      ],
      pt: [
        "Desde que se mudou para um apartamento novo, Mia cozinha em casa com mais frequência.",
        "Ela costuma seguir as receitas da avó, mas gosta de mudar alguns ingredientes.",
        "Neste fim de semana, ela vai convidar os vizinhos e preparar um prato do seu país.",
      ],
      it: [
        "Da quando si è trasferita in un nuovo appartamento, Mia cucina a casa più spesso.",
        "Di solito segue le ricette della nonna, ma le piace cambiare qualche ingrediente.",
        "Questo fine settimana inviterà i vicini e preparerà un piatto del suo paese.",
      ],
      de: [
        "Seit sie in eine neue Wohnung gezogen ist, kocht Mia öfter zu Hause.",
        "Normalerweise folgt sie den Rezepten ihrer Großmutter, aber sie ändert gern ein paar Zutaten.",
        "Dieses Wochenende will sie ihre Nachbarn einladen und ein Gericht aus ihrer Heimat zubereiten.",
      ],
    },
  },
  {
    topic: "cooking",
    level: "B2",
    sentences: {
      en: [
        "Mia has discovered that cooking is less about following instructions than about paying attention.",
        "She now tastes the sauce at every stage, adjusting the salt or acidity until the balance feels right.",
        "If she had known this earlier, she says, she would have saved herself years of disappointing dinners.",
      ],
      es: [
        "Mia ha descubierto que cocinar consiste menos en seguir instrucciones que en prestar atención.",
        "Ahora prueba la salsa en cada paso y ajusta la sal o la acidez hasta que el equilibrio le parece el adecuado.",
        "Dice que, si lo hubiera sabido antes, se habría ahorrado años de cenas decepcionantes.",
      ],
      fr: [
        "Mia a découvert que cuisiner consiste moins à suivre des instructions qu'à être attentive.",
        "Elle goûte désormais la sauce à chaque étape et ajuste le sel ou l'acidité jusqu'à trouver le bon équilibre.",
        "Si elle l'avait su plus tôt, dit-elle, elle se serait épargné des années de dîners décevants.",
      ],
      pt: [
        "Mia descobriu que cozinhar tem menos a ver com seguir instruções do que com prestar atenção.",
        "Agora ela prova o molho a cada etapa e ajusta o sal ou a acidez até o equilíbrio parecer certo.",
        "Ela diz que, se tivesse sabido disso antes, teria evitado anos de jantares decepcionantes.",
      ],
      it: [
        "Mia ha scoperto che cucinare non significa tanto seguire le istruzioni quanto fare attenzione.",
        "Ora assaggia il sugo a ogni passaggio e regola il sale o l'acidità finché l'equilibrio non le sembra giusto.",
        "Dice che, se l'avesse saputo prima, si sarebbe risparmiata anni di cene deludenti.",
      ],
      de: [
        "Mia hat herausgefunden, dass es beim Kochen weniger darum geht, Anweisungen zu befolgen, als aufmerksam zu sein.",
        "Inzwischen probiert sie die Soße bei jedem Schritt und passt Salz oder Säure an, bis das Gleichgewicht stimmt.",
        "Hätte sie das früher gewusst, sagt sie, wären ihr jahrelang enttäuschende Abendessen erspart geblieben.",
      ],
    },
  },
  {
    topic: "cooking",
    level: "C1",
    sentences: {
      en: [
        "For Mia, the kitchen has become a refuge from the relentless pace of her working week.",
        "The rhythmic chopping of vegetables and the slow reduction of a stock demand a kind of patience that her job rarely rewards.",
        "Guests often praise the food, yet what she values most is the unhurried hour spent preparing it.",
      ],
      es: [
        "Para Mia, la cocina se ha convertido en un refugio frente al ritmo implacable de su semana laboral.",
        "El picado rítmico de las verduras y la lenta reducción de un caldo exigen una paciencia que su trabajo rara vez recompensa.",
        "Los invitados suelen elogiar la comida, pero lo que ella más valora es la hora sin prisas que dedica a prepararla.",
      ],
      fr: [
        "Pour Mia, la cuisine est devenue un refuge face au rythme implacable de sa semaine de travail.",
        "Le découpage rythmé des légumes et la lente réduction d'un bouillon exigent une patience que son métier récompense rarement.",
        "Ses invités louent souvent les plats, mais ce qu'elle apprécie le plus, c'est l'heure paisible passée à les préparer.",
      ],
      pt: [
        "Para Mia, a cozinha virou um refúgio diante do ritmo implacável da sua semana de trabalho.",
        "O corte ritmado dos legumes e a lenta redução de um caldo exigem uma paciência que o seu trabalho raramente recompensa.",
        "Os convidados costumam elogiar a comida, mas o que ela mais valoriza é a hora sem pressa dedicada a prepará-la.",
      ],
      it: [
        "Per Mia la cucina è diventata un rifugio dal ritmo incalzante della sua settimana lavorativa.",
        "Il taglio ritmico delle verdure e la lenta riduzione di un brodo richiedono una pazienza che il suo lavoro raramente premia.",
        "Gli ospiti lodano spesso i piatti, ma ciò che lei apprezza di più è l'ora senza fretta trascorsa a prepararli.",
      ],
      de: [
        "Für Mia ist die Küche zu einem Rückzugsort vor dem unerbittlichen Tempo ihrer Arbeitswoche geworden.",
        "Das rhythmische Schneiden von Gemüse und das langsame Einkochen einer Brühe verlangen eine Geduld, die ihr Beruf selten belohnt.",
        "Gäste loben oft das Essen, doch am meisten schätzt sie die ruhige Stunde, die sie mit der Zubereitung verbringt.",
      ],
    },
  },
  {
    topic: "cooking",
    level: "C2",
    sentences: {
      en: [
        "Mia's cooking is a quiet dialogue with the past, each dish carrying the faint imprint of the hands that taught it to her.",
        "She resists the temptation to modernize her grandmother's stew, suspecting that its imperfections are precisely what lend it meaning.",
        "To eat at her table is to partake, however fleetingly, in a lineage of care that predates everyone seated around it.",
      ],
      es: [
        "La cocina de Mia es un diálogo silencioso con el pasado: cada plato lleva la leve huella de las manos que se lo enseñaron.",
        "Se resiste a la tentación de modernizar el guiso de su abuela, pues sospecha que son precisamente sus imperfecciones las que le dan sentido.",
        "Comer en su mesa es participar, aunque sea fugazmente, en un linaje de cuidados anterior a todos los que están sentados a su alrededor.",
      ],
      fr: [
        "La cuisine de Mia est un dialogue silencieux avec le passé, chaque plat portant la légère empreinte des mains qui le lui ont appris.",
        "Elle résiste à la tentation de moderniser le ragoût de sa grand-mère, soupçonnant que ce sont précisément ses imperfections qui lui donnent son sens.",
        "Manger à sa table, c'est prendre part, même fugacement, à une lignée d'attentions plus ancienne que tous ceux qui y sont assis.",
      ],
      pt: [
        "A cozinha de Mia é um diálogo silencioso com o passado, e cada prato carrega a leve marca das mãos que o ensinaram a ela.",
        "Ela resiste à tentação de modernizar o ensopado da avó, desconfiando que são justamente as suas imperfeições que lhe dão sentido.",
        "Comer à sua mesa é participar, ainda que por um instante, de uma linhagem de cuidado mais antiga do que todos os que estão sentados ao seu redor.",
      ],
      it: [
        "La cucina di Mia è un dialogo silenzioso con il passato: ogni piatto porta la lieve impronta delle mani che gliel'hanno insegnato.",
        "Resiste alla tentazione di modernizzare lo stufato della nonna, sospettando che siano proprio le sue imperfezioni a dargli significato.",
        "Mangiare alla sua tavola significa partecipare, anche solo per un attimo, a una stirpe di premure più antica di chiunque vi sieda intorno.",
      ],
      de: [
        "Mias Küche ist ein stiller Dialog mit der Vergangenheit, jedes Gericht trägt den leisen Abdruck der Hände, die es ihr beigebracht haben.",
        "Sie widersteht der Versuchung, den Eintopf ihrer Großmutter zu modernisieren, weil sie ahnt, dass gerade seine Unvollkommenheiten ihm Bedeutung verleihen.",
        "An ihrem Tisch zu essen heißt, wenn auch nur flüchtig, an einer Tradition der Fürsorge teilzuhaben, die älter ist als alle, die um ihn herum sitzen.",
      ],
    },
  },
  // ——— Conversation (Sara and Tom take turns, starting with Sara) ———
  {
    topic: "conversation",
    level: "A1",
    speakers: ["Sara", "Tom"],
    sentences: {
      en: ["Hi, Tom! How are you?", "I'm fine, thanks. And you?", "Very well. Do you want a coffee?", "Yes, please. With milk."],
      es: ["¡Hola, Tom! ¿Cómo estás?", "Bien, gracias. ¿Y tú?", "Muy bien. ¿Quieres un café?", "Sí, por favor. Con leche."],
      fr: ["Salut, Tom ! Comment ça va ?", "Ça va bien, merci. Et toi ?", "Très bien. Tu veux un café ?", "Oui, s'il te plaît. Avec du lait."],
      pt: ["Oi, Tom! Tudo bem?", "Tudo bem, obrigado. E você?", "Muito bem. Quer um café?", "Quero, por favor. Com leite."],
      it: ["Ciao, Tom! Come stai?", "Bene, grazie. E tu?", "Molto bene. Vuoi un caffè?", "Sì, grazie. Con il latte."],
      de: ["Hallo, Tom! Wie geht's dir?", "Gut, danke. Und dir?", "Sehr gut. Möchtest du einen Kaffee?", "Ja, gern. Mit Milch."],
    },
  },
  {
    topic: "conversation",
    level: "A2",
    speakers: ["Sara", "Tom"],
    sentences: {
      en: [
        "What did you do last weekend?",
        "I visited my parents and we cooked together.",
        "That sounds nice! What did you make?",
        "A big paella, but it was a bit salty.",
      ],
      es: [
        "¿Qué hiciste el fin de semana pasado?",
        "Visité a mis padres y cocinamos juntos.",
        "¡Qué bien! ¿Qué cocinaste?",
        "Una paella grande, pero estaba un poco salada.",
      ],
      fr: [
        "Qu'est-ce que tu as fait le week-end dernier ?",
        "J'ai rendu visite à mes parents et on a cuisiné ensemble.",
        "C'est sympa ! Qu'est-ce que tu as préparé ?",
        "Une grande paella, mais elle était un peu salée.",
      ],
      pt: [
        "O que você fez no fim de semana passado?",
        "Visitei meus pais e cozinhamos juntos.",
        "Que legal! O que você preparou?",
        "Uma paella grande, mas estava um pouco salgada.",
      ],
      it: [
        "Che cosa hai fatto lo scorso fine settimana?",
        "Sono andato dai miei genitori e abbiamo cucinato insieme.",
        "Che bello! Che cosa hai preparato?",
        "Una grande paella, ma era un po' salata.",
      ],
      de: [
        "Was hast du letztes Wochenende gemacht?",
        "Ich habe meine Eltern besucht und wir haben zusammen gekocht.",
        "Das klingt schön! Was hast du gekocht?",
        "Eine große Paella, aber sie war ein bisschen salzig.",
      ],
    },
  },
  {
    topic: "conversation",
    level: "B1",
    speakers: ["Sara", "Tom"],
    sentences: {
      en: [
        "Have you decided where you're going on vacation this year?",
        "Not yet, but I'm thinking about a hiking trip in the north.",
        "If you go, you should take good boots, because it rains a lot there.",
        "Good idea. Maybe you could come with me for a few days.",
      ],
      es: [
        "¿Ya has decidido adónde vas de vacaciones este año?",
        "Todavía no, pero estoy pensando en hacer senderismo en el norte.",
        "Si vas, deberías llevar unas buenas botas, porque allí llueve mucho.",
        "Buena idea. A lo mejor podrías venir conmigo unos días.",
      ],
      fr: [
        "Tu as décidé où tu pars en vacances cette année ?",
        "Pas encore, mais je pense faire une randonnée dans le nord.",
        "Si tu y vas, prends de bonnes chaussures de marche, parce qu'il pleut beaucoup là-bas.",
        "Bonne idée. Tu pourrais peut-être venir avec moi quelques jours.",
      ],
      pt: [
        "Você já decidiu para onde vai nas férias este ano?",
        "Ainda não, mas estou pensando em fazer uma trilha no norte.",
        "Se você for, deveria levar botas boas, porque lá chove muito.",
        "Boa ideia. Talvez você possa ir comigo por alguns dias.",
      ],
      it: [
        "Hai già deciso dove vai in vacanza quest'anno?",
        "Non ancora, ma sto pensando a un viaggio a piedi nel nord.",
        "Se ci vai, dovresti portare dei buoni scarponi, perché lì piove molto.",
        "Buona idea. Magari potresti venire con me per qualche giorno.",
      ],
      de: [
        "Hast du schon entschieden, wohin du dieses Jahr in den Urlaub fährst?",
        "Noch nicht, aber ich denke an eine Wanderreise im Norden.",
        "Wenn du fährst, solltest du gute Stiefel mitnehmen, weil es dort viel regnet.",
        "Gute Idee. Vielleicht könntest du ein paar Tage mitkommen.",
      ],
    },
  },
  {
    topic: "conversation",
    level: "B2",
    speakers: ["Sara", "Tom"],
    sentences: {
      en: [
        "I've been thinking about changing jobs, but I'm worried about leaving a stable position.",
        "That's understandable, although staying somewhere you're unhappy has its own risks.",
        "True. If I found something more creative, I think I'd feel much more motivated.",
        "Then why not start looking while you still have a job? There's no pressure that way.",
      ],
      es: [
        "Llevo un tiempo pensando en cambiar de trabajo, pero me preocupa dejar un puesto estable.",
        "Es comprensible, aunque quedarse en un sitio donde no eres feliz también tiene sus riesgos.",
        "Es verdad. Si encontrara algo más creativo, creo que me sentiría mucho más motivada.",
        "Entonces, ¿por qué no empiezas a buscar mientras todavía tienes trabajo? Así no hay presión.",
      ],
      fr: [
        "Je pense à changer de travail depuis un moment, mais j'ai peur de quitter un poste stable.",
        "C'est compréhensible, même si rester là où on n'est pas heureux comporte aussi des risques.",
        "C'est vrai. Si je trouvais quelque chose de plus créatif, je crois que je serais bien plus motivée.",
        "Alors pourquoi ne pas commencer à chercher pendant que tu as encore un emploi ? Comme ça, pas de pression.",
      ],
      pt: [
        "Ando pensando em mudar de emprego, mas tenho medo de deixar um cargo estável.",
        "É compreensível, embora ficar num lugar onde você não é feliz também tenha seus riscos.",
        "É verdade. Se eu encontrasse algo mais criativo, acho que me sentiria muito mais motivada.",
        "Então por que não começa a procurar enquanto ainda tem emprego? Assim não há pressão.",
      ],
      it: [
        "Da un po' penso di cambiare lavoro, ma ho paura di lasciare un posto stabile.",
        "È comprensibile, anche se restare in un posto dove non sei felice ha i suoi rischi.",
        "È vero. Se trovassi qualcosa di più creativo, credo che mi sentirei molto più motivata.",
        "Allora perché non inizi a cercare mentre hai ancora un lavoro? Così non c'è pressione.",
      ],
      de: [
        "Ich denke schon länger darüber nach, den Job zu wechseln, aber ich habe Angst, eine sichere Stelle aufzugeben.",
        "Das ist verständlich, obwohl es auch Risiken hat, dort zu bleiben, wo man unglücklich ist.",
        "Stimmt. Wenn ich etwas Kreativeres fände, wäre ich bestimmt viel motivierter.",
        "Warum fängst du dann nicht an zu suchen, solange du noch einen Job hast? So gibt es keinen Druck.",
      ],
    },
  },
  {
    topic: "conversation",
    level: "C1",
    speakers: ["Sara", "Tom"],
    sentences: {
      en: [
        "Did you read that article claiming remote work is quietly eroding team culture?",
        "I did, and while it raised some valid points, I felt it glossed over the benefits for people with long commutes.",
        "Fair enough, though I'd argue the spontaneous conversations you get in an office are hard to replicate online.",
        "Perhaps, but that's hardly a reason to insist everyone be at their desks five days a week.",
      ],
      es: [
        "¿Leíste ese artículo que afirma que el teletrabajo está erosionando poco a poco la cultura de equipo?",
        "Sí, y aunque planteaba algunos puntos válidos, me pareció que pasaba por alto las ventajas para quienes tienen trayectos largos.",
        "Es justo, aunque yo diría que las conversaciones espontáneas de una oficina son difíciles de reproducir en línea.",
        "Puede ser, pero eso no justifica exigir que todo el mundo esté en su mesa cinco días a la semana.",
      ],
      fr: [
        "Tu as lu cet article qui prétend que le télétravail érode peu à peu la culture d'équipe ?",
        "Oui, et même s'il soulevait des points pertinents, j'ai trouvé qu'il passait sous silence les avantages pour ceux qui ont de longs trajets.",
        "C'est juste, mais je dirais que les conversations spontanées d'un bureau sont difficiles à reproduire en ligne.",
        "Peut-être, mais ce n'est guère une raison pour exiger que tout le monde soit à son poste cinq jours par semaine.",
      ],
      pt: [
        "Você leu aquele artigo dizendo que o trabalho remoto está corroendo aos poucos a cultura das equipes?",
        "Li, e embora levantasse alguns pontos válidos, achei que ignorava as vantagens para quem faz longos trajetos.",
        "É justo, mas eu diria que as conversas espontâneas de um escritório são difíceis de reproduzir on-line.",
        "Talvez, mas isso não é motivo para exigir que todo mundo esteja na mesa cinco dias por semana.",
      ],
      it: [
        "Hai letto quell'articolo secondo cui il lavoro da remoto sta erodendo pian piano la cultura del team?",
        "Sì, e anche se sollevava alcuni punti validi, mi è sembrato che trascurasse i vantaggi per chi fa lunghi tragitti.",
        "Giusto, anche se direi che le conversazioni spontanee di un ufficio sono difficili da riprodurre online.",
        "Forse, ma non mi pare un buon motivo per pretendere che tutti stiano alla scrivania cinque giorni su cinque.",
      ],
      de: [
        "Hast du den Artikel gelesen, der behauptet, Homeoffice untergrabe schleichend die Teamkultur?",
        "Ja, und obwohl er einige berechtigte Punkte ansprach, fand ich, dass er die Vorteile für Leute mit langen Arbeitswegen unterschlug.",
        "Das stimmt, aber ich würde sagen, dass sich spontane Gespräche im Büro online kaum nachbilden lassen.",
        "Mag sein, aber das ist wohl kaum ein Grund, darauf zu bestehen, dass alle fünf Tage die Woche am Schreibtisch sitzen.",
      ],
    },
  },
  {
    topic: "conversation",
    level: "C2",
    speakers: ["Sara", "Tom"],
    sentences: {
      en: [
        "I can't help feeling that our obsession with productivity has made leisure itself feel like a task to be optimized.",
        "You're not wrong; even my holidays come with an itinerary so meticulous it borders on the absurd.",
        "Precisely, and the irony is that real rest seems to require a deliberate refusal to measure anything at all.",
        "Then perhaps idleness, far from being a vice, is the last act of rebellion we have left.",
      ],
      es: [
        "No puedo evitar pensar que nuestra obsesión por la productividad ha convertido el propio ocio en una tarea que hay que optimizar.",
        "No te falta razón; hasta mis vacaciones vienen con un itinerario tan minucioso que roza lo absurdo.",
        "Exacto, y lo irónico es que el verdadero descanso parece exigir una negativa deliberada a medir absolutamente nada.",
        "Entonces quizá la ociosidad, lejos de ser un vicio, sea el último acto de rebeldía que nos queda.",
      ],
      fr: [
        "Je ne peux m'empêcher de penser que notre obsession de la productivité a transformé les loisirs eux-mêmes en une tâche à optimiser.",
        "Tu n'as pas tort ; même mes vacances s'accompagnent d'un programme si minutieux qu'il frôle l'absurde.",
        "Justement, et l'ironie, c'est que le vrai repos semble exiger un refus délibéré de mesurer quoi que ce soit.",
        "Alors peut-être que l'oisiveté, loin d'être un vice, est le dernier acte de rébellion qui nous reste.",
      ],
      pt: [
        "Não consigo deixar de sentir que a nossa obsessão pela produtividade transformou o próprio lazer numa tarefa a ser otimizada.",
        "Você não está errada; até as minhas férias vêm com um roteiro tão minucioso que beira o absurdo.",
        "Exatamente, e a ironia é que o verdadeiro descanso parece exigir uma recusa deliberada de medir absolutamente nada.",
        "Então talvez o ócio, longe de ser um vício, seja o último ato de rebeldia que nos resta.",
      ],
      it: [
        "Non posso fare a meno di pensare che la nostra ossessione per la produttività abbia trasformato lo stesso tempo libero in un compito da ottimizzare.",
        "Non hai torto: persino le mie vacanze hanno un itinerario così meticoloso da sfiorare l'assurdo.",
        "Appunto, e l'ironia è che il vero riposo sembra richiedere un deliberato rifiuto di misurare alcunché.",
        "Allora forse l'ozio, lungi dall'essere un vizio, è l'ultimo atto di ribellione che ci resta.",
      ],
      de: [
        "Ich werde das Gefühl nicht los, dass unsere Besessenheit von Produktivität selbst die Freizeit zu einer Aufgabe gemacht hat, die optimiert werden muss.",
        "Da hast du nicht unrecht; sogar mein Urlaub kommt mit einem Reiseplan, der so akribisch ist, dass er ans Absurde grenzt.",
        "Genau, und die Ironie ist, dass echte Erholung offenbar die bewusste Weigerung verlangt, überhaupt irgendetwas zu messen.",
        "Dann ist Müßiggang vielleicht kein Laster, sondern der letzte Akt der Rebellion, der uns bleibt.",
      ],
    },
  },
];

/**
 * Picks a built-in text for two languages at a level. Uses the same topic when the library has it;
 * otherwise rotates through the other topics at that level using `variant`, so "New text" changes it.
 */
export function libraryText(learn: LangCode, know: LangCode, level: Level, topic: TopicId, variant = 0): ReadListenText {
  const atLevel = LIBRARY.filter((e) => e.level === level);
  const sameTopic = atLevel.find((e) => e.topic === topic);
  // With a matching topic, variant 0 shows it and later variants move on to the others
  const pool = sameTopic ? [sameTopic, ...atLevel.filter((e) => e !== sameTopic)] : atLevel;
  const entry = pool[variant % pool.length];
  return {
    topic: entry.topic,
    level,
    source: "library",
    sentences: { [learn]: entry.sentences[learn], [know]: entry.sentences[know] },
    ...(entry.speakers ? { speakers: entry.speakers } : {}),
  };
}
