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
    "gila", "gembel", "hina", "jahil", "jayus", "kafir", "kampungan", "kasar",
    "kurang ajar", "lebay", "manja", "mesum", "najis", "najong", "nista", "pelit",
    "pemalas", "pembohong", "penipu", "pengemis", "perek", "pervert", "sampah",
    "sarap", "sok tahu", "tembam", "tengik", "terkutuk"
];

const uniqueBadWords = Array.from(new Set(bad_words.map(word => word.toLowerCase())));

function replaceBadWords(text: string) {
    let replacedText = text;
    uniqueBadWords.forEach(word => {
        const pattern = new RegExp(`\\b${word}\\w*`, 'gi');
        replacedText = replacedText.replace(pattern, match => {
            return '*'.repeat(match.length);
        });
    });
    return replacedText;
}

function containsBadWord(text: string) {
    const pattern = new RegExp(`\\b(${uniqueBadWords.join('|')})\\w*`, 'gi');
    const matches = text.match(pattern);

    return {
        contains: !!matches,
        badWords: matches ? Array.from(new Set(matches.map(word => word.toLowerCase()))) : [],
        cleanedText: replaceBadWords(text)
    };
}

export default containsBadWord;