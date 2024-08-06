const bad_words = [
    "ancuk", "ancok", "ajig", "anjay", "anjing", "anying", "anjir", "asu", "asyu",
    "babangus", "babi", "bacol", "bacot", "bagong", "bajingan", "balegug", "banci",
    "bangke", "bangsat", "bedebah", "bedegong", "bego", "belegug", "beloon", "bencong",
    "bloon", "blo'on", "bodoh", "boloho", "buduk", "budug", "celeng", "cibai", "cibay",
    "cocot", "cocote", "cok", "cokil", "colai", "colay", "coli", "colmek", "conge",
    "congean", "congek", "congor", "cuk", "cukima", "cukimai", "cukimay", "dancok",
    "entot", "entotan", "ewe", "ewean", "gelo", "genjik", "germo", "gigolo", "goblo",
    "goblog", "goblok", "hencet", "henceut", "heunceut", "homo", "idiot", "itil",
    "jancuk", "jancok", "jablay", "jalang", "jembut", "jiancok", "jilmek", "jurig",
    "kacung", "kampang", "kampret", "kampungan", "kehed", "kenthu", "kentot", "kentu",
    "keparat", "kimak", "kintil", "kirik", "kunyuk", "kurap", "konti", "kontol",
    "kopet", "koplok", "lacur", "lebok", "lonte", "maho", "meki", "memek", "monyet",
    "ndas", "ndasmu", "ngehe", "ngentot", "nggateli", "nyepong", "ngewe", "ngocok",
    "pante", "pantek", "patek", "pathek", "peju", "pejuh", "pecun", "pecundang",
    "pelacur", "pelakor", "peler", "pepek", "puki", "pukima", "pukimae", "pukimak",
    "pukimay", "sampah", "sepong", "sial", "sialan", "silit", "sinting", "sontoloyo",
    "tai", "taik", "tempek", "tempik", "tete", "tetek", "tiembokne", "titit", "toket",
    "tolol", "ublag", "udik", "wingkeng", "busuk", "jelek", "down", "bego", "bajingan",
    "brengsek", "brengs*k", "bodoh", "gila", "kampungan", "kasar", "kurang ajar",
    "anjing", "bangsat", "tai", "sial", "sialan", "kampret", "setan", "iblis",
    "goblok", "tolol", "idiot", "jancuk", "jancok", "jayus", "babi", "asu", "anjir",
    "nyet", "brengsek", "brengs*k", "kontol", "memek", "pepek", "ngentot", "colmek",
    "ngocok", "jembut", "bencong", "banci", "homo", "lesbi", "kafir", "dungu", "dodol",
    "gila", "gembel", "hina", "hina", "hina", "anjing", "bajingan", "brengsek",
    "brengs*k", "culun", "dodol", "dodok", "gembel", "hina", "hina", "hina", "jahil",
    "jayus", "kafir", "kampungan", "kasar", "kurang ajar", "lebay", "manja", "mesum",
    "najis", "najong", "najong", "najong", "nista", "pelit", "pemalas", "pembohong",
    "pembohong", "pembohong", "penipu", "penipu", "penipu", "pengemis", "pengemis",
    "pengemis", "perek", "pervert", "sampah", "sarap", "sinting", "sinting", "sinting",
    "sinting", "sinting", "sinting", "sok tahu", "tembam", "tengik", "terkutuk",
    "terkutuk", "tolol", "udik", "udik", "udik", "udik"
];

function containsBadWord(text: string) {
    const pattern = new RegExp(bad_words.join('|'), 'gi');
    return pattern.test(text);
}

export default containsBadWord;