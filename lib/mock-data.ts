// Shared types + constants, seed data for Firestore (scripts/seed.mjs), and the mock AI-insights data.
// All 36 states/UTs and their districts. Source: github.com/KTBsomen/Indian-state-district-json (MIT).
import INDIA from "./india-districts.json" with { type: "json" };

export type Category = "Water" | "Roads" | "Health" | "Education" | "Electricity" | "Sanitation";
export type Status = "Submitted" | "Under Review" | "Action Planned" | "Resolved";

export const CATEGORIES: Category[] = ["Water", "Roads", "Health", "Education", "Electricity", "Sanitation"];
export const STATUSES: Status[] = ["Submitted", "Under Review", "Action Planned", "Resolved"];
export const INDIA_DISTRICTS: Record<string, string[]> = INDIA;
export const STATES = Object.keys(INDIA_DISTRICTS);
/** Districts of a known state, else undefined. Own-key check so "constructor" etc. aren't treated as states. */
export const districtsOf = (state: unknown) => (typeof state === "string" && Object.hasOwn(INDIA_DISTRICTS, state) ? INDIA_DISTRICTS[state] : undefined);

// totalRequests / resolved are sample figures (the landing page labels them); states, districts are real counts.
export const STATS = {
  totalRequests: 12480,
  states: STATES.length,
  districts: Object.values(INDIA_DISTRICTS).flat().length,
  resolved: 1240,
  languages: 22,
};

// Localised text for the citizen-facing side.
export type Localized = { en: string; hi: string; mr: string };

export interface TimelineEntry {
  status: Status;
  date: string; // ISO
  note: Localized | string;
}

/** Firestore requests/{id} as the client sees it (createdAt normalised to `date`). Written only by the server. */
export interface Req {
  id: string;
  uid: string; // citizen who raised it ("seed" for demo data)
  text: string; // original, in the citizen's language
  language: string;
  summary: Localized;
  translation?: Localized;
  category: Category;
  urgency: number;
  urgencyReason?: string;
  department?: string;
  sentiment?: string;
  state: string;
  district: string;
  place: string; // city / village
  lat?: number;
  lng?: number;
  photoUrl?: string | null;
  status: Status;
  date: string; // ISO
  timeline?: TimelineEntry[];
  citizen?: string;
  contact?: string; // masked
  announcementId?: string;
}

/** Seed request shape; scripts/seed.mjs converts it to a Req. */
export interface SeedRequest {
  id: string;
  summary: string;
  summaryLocal?: Omit<Localized, "en">;
  original: string;
  lang: string;
  category: Category;
  state: string;
  district: string;
  place: string;
  urgency: 1 | 2 | 3 | 4 | 5;
  urgencyReason: string;
  status: Status;
  date: string; // ISO
  citizen: string;
  contact: string; // masked
  department: string;
  sentiment: string;
  timeline?: TimelineEntry[];
  announcementId?: string;
}

const NOTES: Record<string, Omit<Localized, "en">> = {
  "Received via voice (Marathi).": { hi: "आवाज़ के माध्यम से प्राप्त (मराठी)।", mr: "आवाजाद्वारे प्राप्त (मराठी)." },
  "Linked to cluster ‘Water shortage in Beed villages’. Site inspection scheduled by Gram Sevak.": {
    hi: "'बीड के गांवों में पानी की कमी' समूह से जोड़ा गया। ग्राम सेवक द्वारा स्थल निरीक्षण निर्धारित।",
    mr: "'बीडमधील गावांतील पाणीटंचाई' गटाशी जोडले. ग्रामसेवकाकडून स्थळ पाहणी नियोजित.",
  },
  "Received via text (Marathi) with 2 photos.": { hi: "टेक्स्ट (मराठी) और 2 फ़ोटो के साथ प्राप्त।", mr: "मजकूर (मराठी) व २ फोटोंसह प्राप्त." },
  "PWD junior engineer verified 14 potholes over 6 km.": {
    hi: "PWD कनिष्ठ अभियंता ने 6 किमी में 14 गड्ढों की पुष्टि की।",
    mr: "सार्वजनिक बांधकाम विभागाच्या कनिष्ठ अभियंत्यांनी ६ किमीमध्ये १४ खड्ड्यांची पडताळणी केली.",
  },
  "Resurfacing sanctioned under district road fund. Work to begin after monsoon (Oct 2026).": {
    hi: "जिला सड़क निधि से पुनर्सतहीकरण स्वीकृत। मानसून के बाद (अक्टूबर 2026) काम शुरू होगा।",
    mr: "जिल्हा रस्ते निधीतून डांबरीकरण मंजूर. पावसाळ्यानंतर (ऑक्टोबर २०२६) काम सुरू होईल.",
  },
  "MSEDCL section office confirmed transformer failure.": { hi: "MSEDCL अनुभाग कार्यालय ने ट्रांसफार्मर खराबी की पुष्टि की।", mr: "महावितरण शाखा कार्यालयाने रोहित्र बिघाडाची खात्री केली." },
  "New 100 kVA transformer allotted.": { hi: "नया 100 kVA ट्रांसफार्मर आवंटित।", mr: "नवीन १०० kVA रोहित्र मंजूर." },
  "Transformer installed and supply restored.": { hi: "ट्रांसफार्मर लगाया गया और बिजली बहाल हुई।", mr: "रोहित्र बसवले व वीजपुरवठा पूर्ववत झाला." },
};
const N = (en: string): Localized => ({ en, ...NOTES[en] });

// Seed data. uid "seed" = not owned by any real citizen; officials still see them.
export const REQUESTS: SeedRequest[] = [
  {
    id: "JV-1001", lang: "Marathi", category: "Water", state: "Maharashtra", district: "Beed", place: "Wadgaon", urgency: 4, status: "Under Review", date: "2026-09-12",
    original: "आमच्या वडगाव गावातील हातपंप तीन आठवड्यांपासून बंद आहे. लोकांना पाण्यासाठी २ किलोमीटर चालत जावे लागते. कृपया लवकर दुरुस्ती करा.",
    summary: "Handpump in Wadgaon village broken for 3 weeks; residents walking 2 km for water.",
    summaryLocal: { hi: "वडगांव गांव का हैंडपंप 3 हफ्तों से खराब है; लोग पानी के लिए 2 किमी पैदल चल रहे हैं।", mr: "वडगाव गावातील हातपंप ३ आठवड्यांपासून बंद आहे; पाण्यासाठी लोक २ किमी चालत आहेत." },
    urgencyReason: "Sole drinking-water source down for 21 days; 2 km daily walk affects women and elderly.",
    citizen: "Ramesh Patil", contact: "+91 98XXX XX412", department: "Water Supply & Sanitation Dept.", sentiment: "Frustrated",
    timeline: [
      { status: "Submitted", date: "2026-09-12", note: N("Received via voice (Marathi).") },
      { status: "Under Review", date: "2026-09-14", note: N("Linked to cluster ‘Water shortage in Beed villages’. Site inspection scheduled by Gram Sevak.") },
    ],
  },
  {
    id: "JV-1002", lang: "Marathi", category: "Water", state: "Maharashtra", district: "Beed", place: "Pimpalner", urgency: 5, status: "Action Planned", date: "2026-09-10",
    original: "पिंपळनेर गावात टँकर दहा दिवसांपासून आलेला नाही. विहिरी कोरड्या पडल्या आहेत.",
    summary: "No water tanker in Pimpalner for 10 days; wells have dried up.",
    urgencyReason: "No alternate source; all wells dry. Health risk within days.",
    citizen: "Sunita Jadhav", contact: "+91 97XXX XX208", department: "Water Supply & Sanitation Dept.", sentiment: "Distressed",
  },
  {
    id: "JV-1003", lang: "Hindi", category: "Water", state: "Maharashtra", district: "Beed", place: "Beed", urgency: 4, status: "Submitted", date: "2026-09-25",
    original: "हमारे मोहल्ले में पिछले दो हफ्तों से नल में पानी नहीं आ रहा है। बच्चों और बुजुर्गों को बहुत परेशानी हो रही है।",
    summary: "No tap water in neighbourhood for two weeks; children and elderly affected.",
    urgencyReason: "Two-week outage affecting vulnerable groups.",
    citizen: "Mohammed Shaikh", contact: "+91 99XXX XX731", department: "Water Supply & Sanitation Dept.", sentiment: "Concerned",
  },
  {
    id: "JV-1004", lang: "Marathi", category: "Roads", state: "Maharashtra", district: "Beed", place: "Wadgaon", urgency: 3, status: "Action Planned", date: "2026-08-28",
    original: "वडगाव ते केज रस्त्यावर मोठे खड्डे पडले आहेत. पावसात दुचाकी अपघात होत आहेत.",
    summary: "Large potholes on Wadgaon-Kaij road causing two-wheeler accidents in rain.",
    summaryLocal: { hi: "वडगांव-केज सड़क पर बड़े गड्ढे; बारिश में दोपहिया दुर्घटनाएं हो रही हैं।", mr: "वडगाव-केज रस्त्यावर मोठे खड्डे; पावसात दुचाकी अपघात होत आहेत." },
    urgencyReason: "Accidents reported, but road remains passable.",
    citizen: "Ramesh Patil", contact: "+91 98XXX XX412", department: "Public Works Dept. (PWD)", sentiment: "Frustrated",
    timeline: [
      { status: "Submitted", date: "2026-08-28", note: N("Received via text (Marathi) with 2 photos.") },
      { status: "Under Review", date: "2026-09-02", note: N("PWD junior engineer verified 14 potholes over 6 km.") },
      { status: "Action Planned", date: "2026-09-15", note: N("Resurfacing sanctioned under district road fund. Work to begin after monsoon (Oct 2026).") },
    ],
  },
  {
    id: "JV-1005", lang: "Tamil", category: "Health", state: "Tamil Nadu", district: "Chennai", place: "Tondiarpet", urgency: 4, status: "Under Review", date: "2026-09-18",
    original: "எங்கள் பகுதியில் உள்ள ஆரம்ப சுகாதார நிலையத்தில் மருத்துவர் வாரத்திற்கு இரண்டு நாள் மட்டுமே வருகிறார்.",
    summary: "Doctor visits the local primary health centre only two days a week.",
    urgencyReason: "Chronic gap in primary care for ~8,000 residents.",
    citizen: "Karthik Subramanian", contact: "+91 90XXX XX115", department: "Public Health Dept.", sentiment: "Concerned",
  },
  {
    id: "JV-1006", lang: "Bengali", category: "Sanitation", state: "West Bengal", district: "Kolkata", place: "Tiljala", urgency: 3, status: "Submitted", date: "2026-09-27",
    original: "আমাদের বস্তিতে গত এক সপ্তাহ ধরে আবর্জনা তোলা হয়নি। দুর্গন্ধে থাকা যাচ্ছে না।",
    summary: "Garbage not collected in settlement for a week; unbearable stench.",
    urgencyReason: "Disease risk rising; one-week backlog.",
    citizen: "Ananya Das", contact: "+91 88XXX XX903", department: "Municipal Solid Waste Cell", sentiment: "Frustrated",
  },
  {
    id: "JV-1007", lang: "English", category: "Electricity", state: "Maharashtra", district: "Nagpur", place: "Hingna", urgency: 4, status: "Under Review", date: "2026-09-20",
    original: "Frequent power cuts of 6-8 hours daily in Hingna MIDC area. Small businesses are suffering and workers are being sent home.",
    summary: "Daily 6-8 hour power cuts in Hingna MIDC; small businesses losing work.",
    urgencyReason: "Livelihood impact on ~300 small units.",
    citizen: "Rahul Deshmukh", contact: "+91 98XXX XX660", department: "MSEDCL (Power Distribution)", sentiment: "Frustrated",
  },
  {
    id: "JV-1008", lang: "Marathi", category: "Water", state: "Maharashtra", district: "Latur", place: "Latur", urgency: 5, status: "Under Review", date: "2026-09-16",
    original: "लातूर शहरात आठवड्यातून एकदाच पाणी येते. पाणी साठवण्यासाठी कुटुंबांना पैसे खर्च करावे लागतात.",
    summary: "Water supplied only once a week in Latur city; families paying to store water.",
    urgencyReason: "City-wide shortage; recurrent drought district.",
    citizen: "Kavita Bansode", contact: "+91 94XXX XX377", department: "Water Supply & Sanitation Dept.", sentiment: "Distressed",
  },
  {
    id: "JV-1009", lang: "Marathi", category: "Health", state: "Maharashtra", district: "Beed", place: "Wadgaon", urgency: 4, status: "Submitted", date: "2026-09-26",
    original: "आमच्या गावातील आरोग्य केंद्रात सर्पदंशावरील औषध उपलब्ध नाही. जवळचे रुग्णालय ४० किमी दूर आहे.",
    summary: "No anti-snake-venom at village health centre; nearest hospital 40 km away.",
    summaryLocal: { hi: "गांव के स्वास्थ्य केंद्र में सांप के काटने की दवा नहीं; नज़दीकी अस्पताल 40 किमी दूर।", mr: "गावातील आरोग्य केंद्रात सर्पदंशावरील औषध नाही; जवळचे रुग्णालय ४० किमी दूर." },
    urgencyReason: "Life-threatening gap during monsoon snakebite season.",
    citizen: "Ramesh Patil", contact: "+91 98XXX XX412", department: "Public Health Dept.", sentiment: "Concerned",
    timeline: [{ status: "Submitted", date: "2026-09-26", note: N("Received via voice (Marathi).") }],
  },
  {
    id: "JV-1010", lang: "Hindi", category: "Roads", state: "Maharashtra", district: "Chhatrapati Sambhajinagar", place: "Chhatrapati Sambhajinagar", urgency: 2, status: "Resolved", date: "2026-08-05",
    original: "पैठण रोड पर गड्ढों की वजह से रोज़ ट्रैफिक जाम होता है।",
    summary: "Potholes on Paithan Road cause daily traffic jams.",
    urgencyReason: "Inconvenience; no safety incidents reported.",
    citizen: "Pooja Verma", contact: "+91 70XXX XX524", department: "Public Works Dept. (PWD)", sentiment: "Neutral",
  },
  {
    id: "JV-1011", lang: "Marathi", category: "Education", state: "Maharashtra", district: "Gadchiroli", place: "Bhamragad", urgency: 4, status: "Action Planned", date: "2026-09-02",
    original: "आमच्या आदिवासी पाड्यातील शाळेला फक्त एक शिक्षक आहे आणि इमारतीचे छप्पर गळते.",
    summary: "Tribal hamlet school has one teacher and a leaking roof.",
    urgencyReason: "Safety risk to 64 children; high-vulnerability tribal block.",
    citizen: "Lata Madavi", contact: "+91 93XXX XX082", department: "School Education Dept.", sentiment: "Concerned",
  },
  {
    id: "JV-1012", lang: "Hindi", category: "Water", state: "Maharashtra", district: "Dharashiv", place: "Naldurg", urgency: 4, status: "Under Review", date: "2026-09-19",
    original: "गांव का बोरवेल सूख गया है, टैंकर हफ्ते में सिर्फ एक बार आता है।",
    summary: "Village borewell dried up; tanker comes only once a week.",
    urgencyReason: "Insufficient supply for ~1,200 residents.",
    citizen: "Vikas Pawar", contact: "+91 96XXX XX940", department: "Water Supply & Sanitation Dept.", sentiment: "Distressed",
  },
  {
    id: "JV-1013", lang: "English", category: "Sanitation", state: "Maharashtra", district: "Thane", place: "Kalwa", urgency: 3, status: "Submitted", date: "2026-09-28",
    original: "Open drain near Kalwa station is overflowing and mosquitoes are breeding. Dengue cases reported in our building.",
    summary: "Overflowing open drain near Kalwa station; dengue cases reported.",
    urgencyReason: "Vector-borne disease cases already reported.",
    citizen: "Neha Iyer", contact: "+91 98XXX XX181", department: "Municipal Solid Waste Cell", sentiment: "Concerned",
  },
  {
    id: "JV-1014", lang: "Marathi", category: "Electricity", state: "Maharashtra", district: "Nashik", place: "Niphad", urgency: 3, status: "Resolved", date: "2026-07-30",
    original: "शेतीसाठी वीजपुरवठा फक्त रात्री मिळतो. शेतकऱ्यांना दिवसा वीज द्यावी.",
    summary: "Farm power supply only at night; farmers request daytime supply.",
    urgencyReason: "Farmer safety at night; seasonal crop impact.",
    citizen: "Sanjay Kale", contact: "+91 95XXX XX613", department: "MSEDCL (Power Distribution)", sentiment: "Neutral",
  },
  {
    id: "JV-1015", lang: "Tamil", category: "Water", state: "Tamil Nadu", district: "Madurai", place: "Anaiyur", urgency: 3, status: "Submitted", date: "2026-09-29",
    original: "எங்கள் குடியிருப்பில் வரும் குடிநீர் கலங்கலாக உள்ளது, குழந்தைகளுக்கு வயிற்றுப்போக்கு ஏற்படுகிறது.",
    summary: "Drinking water is turbid; children getting diarrhoea.",
    urgencyReason: "Water-quality issue with health symptoms.",
    citizen: "Meena Rajan", contact: "+91 91XXX XX350", department: "Water Supply & Sanitation Dept.", sentiment: "Concerned",
  },
  {
    id: "JV-1016", lang: "Bengali", category: "Health", state: "West Bengal", district: "Howrah", place: "Howrah", urgency: 5, status: "Under Review", date: "2026-09-21",
    original: "সরকারি হাসপাতালে ডায়ালাইসিসের জন্য তিন সপ্তাহ অপেক্ষা করতে হচ্ছে।",
    summary: "Three-week wait for dialysis at the government hospital.",
    urgencyReason: "Delayed dialysis is life-threatening.",
    citizen: "Sourav Ghosh", contact: "+91 89XXX XX472", department: "Public Health Dept.", sentiment: "Distressed",
  },
  {
    id: "JV-1017", lang: "Hindi", category: "Electricity", state: "Maharashtra", district: "Nagpur", place: "Kamptee", urgency: 4, status: "Action Planned", date: "2026-09-14",
    original: "हमारे इलाके में ट्रांसफार्मर बार-बार जल जाता है, तीन दिन से बिजली नहीं है।",
    summary: "Transformer keeps burning out; no power for three days.",
    urgencyReason: "Repeated outage; 3 days without power.",
    citizen: "Imran Qureshi", contact: "+91 97XXX XX826", department: "MSEDCL (Power Distribution)", sentiment: "Frustrated",
  },
  {
    id: "JV-1018", lang: "Marathi", category: "Roads", state: "Maharashtra", district: "Solapur", place: "Mohol", urgency: 4, status: "Under Review", date: "2026-09-17",
    original: "पावसामुळे मोहोळ-पंढरपूर रस्ता वाहून गेला आहे. एसटी बस सेवा बंद आहे.",
    summary: "Mohol-Pandharpur road washed away by rain; state bus service halted.",
    urgencyReason: "Villages cut off from market and hospital access.",
    citizen: "Ganesh Mane", contact: "+91 92XXX XX157", department: "Public Works Dept. (PWD)", sentiment: "Distressed",
  },
  {
    id: "JV-1019", lang: "English", category: "Education", state: "Maharashtra", district: "Pune", place: "Mulshi", urgency: 3, status: "Submitted", date: "2026-09-24",
    original: "The Zilla Parishad school in Mulshi has no working toilets for girls. Attendance of older girls has dropped.",
    summary: "ZP school in Mulshi has no working girls’ toilets; attendance dropping.",
    urgencyReason: "Direct impact on girls’ attendance.",
    citizen: "Aditi Kulkarni", contact: "+91 98XXX XX294", department: "School Education Dept.", sentiment: "Concerned",
  },
  {
    id: "JV-1020", lang: "Marathi", category: "Water", state: "Maharashtra", district: "Beed", place: "Dharur", urgency: 5, status: "Submitted", date: "2026-09-29",
    original: "धारूर तालुक्यातील तीन गावांना पिण्याचे पाणी नाही. जनावरे मरत आहेत.",
    summary: "Three villages in Dharur taluka without drinking water; livestock dying.",
    urgencyReason: "Multi-village shortage with livestock deaths.",
    citizen: "Dnyaneshwar Shinde", contact: "+91 90XXX XX768", department: "Water Supply & Sanitation Dept.", sentiment: "Distressed",
  },
  {
    id: "JV-0982", lang: "Marathi", category: "Electricity", state: "Maharashtra", district: "Beed", place: "Wadgaon", urgency: 4, status: "Resolved", date: "2026-08-02",
    original: "गावातील रोहित्र जळाल्यामुळे दहा दिवसांपासून वीज नाही.",
    summary: "Village transformer burnt out; no electricity for 10 days.",
    summaryLocal: { hi: "गांव का ट्रांसफार्मर जल गया; 10 दिनों से बिजली नहीं।", mr: "गावातील रोहित्र जळाले; १० दिवसांपासून वीज नाही." },
    urgencyReason: "Prolonged outage affecting whole village.",
    citizen: "Ramesh Patil", contact: "+91 98XXX XX412", department: "MSEDCL (Power Distribution)", sentiment: "Frustrated",
    announcementId: "A-03",
    timeline: [
      { status: "Submitted", date: "2026-08-02", note: N("Received via voice (Marathi).") },
      { status: "Under Review", date: "2026-08-03", note: N("MSEDCL section office confirmed transformer failure.") },
      { status: "Action Planned", date: "2026-08-06", note: N("New 100 kVA transformer allotted.") },
      { status: "Resolved", date: "2026-08-11", note: N("Transformer installed and supply restored.") },
    ],
  },
];


export interface Announcement {
  id: string;
  title: Localized;
  body: Localized;
  state: string;
  district: string;
  place?: string;
  category: Category;
  date: string; // ISO
  addressed: number;
  linkedRequestIds?: string[];
  createdBy?: string;
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "A-01", state: "Maharashtra", district: "Beed", place: "Dharur", category: "Water", date: "2026-09-20", addressed: 42,
    title: {
      en: "Emergency water tankers deployed to 18 Beed villages",
      hi: "बीड के 18 गांवों में आपातकालीन पानी के टैंकर तैनात",
      mr: "बीडमधील १८ गावांना आपत्कालीन पाण्याचे टँकर",
    },
    body: {
      en: "Following 42 citizen requests, the district has deployed daily tankers to 18 villages in Beed and Dharur talukas. Handpump repairs begin 25 Sep.",
      hi: "42 नागरिक अनुरोधों के बाद, ज़िले ने बीड और धारूर तालुकों के 18 गांवों में रोज़ाना टैंकर शुरू किए हैं। हैंडपंप की मरम्मत 25 सितंबर से शुरू होगी।",
      mr: "४२ नागरिकांच्या विनंत्यांनंतर, जिल्ह्याने बीड व धारूर तालुक्यातील १८ गावांना दररोज टँकर सुरू केले आहेत. हातपंप दुरुस्ती २५ सप्टेंबरपासून सुरू.",
    },
  },
  {
    id: "A-02", state: "Maharashtra", district: "Beed", place: "Wadgaon", category: "Roads", date: "2026-09-15", addressed: 31,
    title: {
      en: "Wadgaon-Kaij road resurfacing sanctioned",
      hi: "वडगांव-केज सड़क के पुनर्सतहीकरण को मंजूरी",
      mr: "वडगाव-केज रस्त्याच्या डांबरीकरणास मंजुरी",
    },
    body: {
      en: "₹3.1 Cr sanctioned for resurfacing 6 km of the Wadgaon-Kaij road. Work begins after the monsoon, in October 2026.",
      hi: "वडगांव-केज सड़क के 6 किमी हिस्से के लिए ₹3.1 करोड़ स्वीकृत। मानसून के बाद अक्टूबर 2026 में काम शुरू होगा।",
      mr: "वडगाव-केज रस्त्याच्या ६ किमी डांबरीकरणासाठी ₹३.१ कोटी मंजूर. पावसाळ्यानंतर ऑक्टोबर २०२६ मध्ये काम सुरू होईल.",
    },
  },
  {
    id: "A-03", state: "Maharashtra", district: "Beed", category: "Electricity", date: "2026-08-11", addressed: 64,
    title: {
      en: "New transformers installed across Beed and Latur",
      hi: "बीड और लातूर में नए ट्रांसफार्मर लगाए गए",
      mr: "बीड आणि लातूरमध्ये नवीन रोहित्रे बसवली",
    },
    body: {
      en: "MSEDCL has installed 22 new 100 kVA transformers, restoring reliable supply to 64 reporting villages.",
      hi: "MSEDCL ने 22 नए 100 kVA ट्रांसफार्मर लगाए हैं, जिससे शिकायत करने वाले 64 गांवों में बिजली आपूर्ति सुचारू हो गई है।",
      mr: "महावितरणने २२ नवीन १०० kVA रोहित्रे बसवली असून ६४ गावांचा वीजपुरवठा सुरळीत झाला आहे.",
    },
  },
  {
    id: "A-04", state: "Maharashtra", district: "Thane", place: "Shahapur", category: "Health", date: "2026-09-05", addressed: 23,
    title: {
      en: "Mobile health clinics for Thane's tribal belt",
      hi: "ठाणे के आदिवासी क्षेत्र के लिए मोबाइल स्वास्थ्य क्लिनिक",
      mr: "ठाण्याच्या आदिवासी पट्ट्यासाठी फिरते दवाखाने",
    },
    body: {
      en: "Three mobile clinics will visit 40 hamlets in Shahapur and Murbad every week, with a doctor, nurse and essential medicines.",
      hi: "तीन मोबाइल क्लिनिक हर हफ्ते शहापुर और मुरबाड के 40 बस्तियों में डॉक्टर, नर्स और ज़रूरी दवाओं के साथ जाएंगे।",
      mr: "शहापूर व मुरबाडमधील ४० पाड्यांना दर आठवड्याला डॉक्टर, परिचारिका आणि औषधांसह तीन फिरते दवाखाने भेट देतील.",
    },
  },
  {
    id: "A-05", state: "Maharashtra", district: "Latur", place: "Latur", category: "Water", date: "2026-08-28", addressed: 27,
    title: {
      en: "Latur main pipeline repair completed",
      hi: "लातूर मुख्य पाइपलाइन की मरम्मत पूरी",
      mr: "लातूर मुख्य जलवाहिनी दुरुस्ती पूर्ण",
    },
    body: {
      en: "The 14 km Dhanegaon pipeline leak has been repaired. Supply will move from weekly to every 4 days from 1 October.",
      hi: "धनेगांव पाइपलाइन का 14 किमी रिसाव ठीक कर दिया गया है। 1 अक्टूबर से पानी की आपूर्ति हफ्ते में एक बार के बजाय हर 4 दिन में होगी।",
      mr: "धनेगाव जलवाहिनीची १४ किमी गळती दुरुस्त झाली. १ ऑक्टोबरपासून पाणीपुरवठा आठवड्याऐवजी दर ४ दिवसांनी होईल.",
    },
  },
  {
    id: "A-06", state: "Tamil Nadu", district: "Madurai", place: "Anaiyur", category: "Water", date: "2026-09-24", addressed: 16,
    title: {
      en: "Water purification units for Madurai north wards",
      hi: "मदुरै के उत्तरी वार्डों के लिए जल शोधन इकाइयां",
      mr: "मदुराईच्या उत्तर प्रभागांसाठी जलशुद्धीकरण केंद्रे",
    },
    body: {
      en: "After reports of turbid drinking water, 6 community RO units are being installed in Anaiyur and nearby wards, with weekly water-quality tests.",
      hi: "गंदे पेयजल की शिकायतों के बाद, आनैयूर और आसपास के वार्डों में 6 सामुदायिक RO इकाइयां लगाई जा रही हैं, साथ ही हर हफ्ते पानी की जांच होगी।",
      mr: "गढूळ पिण्याच्या पाण्याच्या तक्रारींनंतर आनैयूर व परिसरातील प्रभागांमध्ये ६ सामुदायिक RO केंद्रे बसवली जात आहेत, तसेच दर आठवड्याला पाण्याची तपासणी होईल.",
    },
  },
];

// Demo data detection: seed requests carry uid "seed"; seed announcements keep their fixed ids (A-01…).
const SEED_ANNOUNCEMENT_IDS = new Set(ANNOUNCEMENTS.map((a) => a.id));
export const isDemoRequest = (r: { uid: string }) => r.uid === "seed";
export const isDemoAnnouncement = (a: { id: string }) => SEED_ANNOUNCEMENT_IDS.has(a.id);
