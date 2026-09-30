"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Category, Localized, Status } from "@/lib/mock-data";

const en = {
  label: "English",
  // nav
  home: "Home", requests: "My Requests", announcements: "Announcements", language: "Language",
  // landing
  dpg: "A Digital Public Good for India",
  heroA: "Your voice, in your language, shapes ", heroB: "India's development.",
  heroSub: "Submit development requests (water, roads, health, schools) by voice or text in any of 22 Indian languages. AI makes sure every voice is heard and routed to the officials who can act.",
  citizen: "I'm a Citizen", official: "I'm an Official", heroAlt: "A woman speaks into her phone while an elderly man listens. Her words turn into a repaired handpump, a new road, a clinic, a school and a working streetlight.", how: "How it works",
  steps: [
    ["Speak or type", "Describe the problem in your own language, by voice, text or photo. No forms, no jargon.", "A woman speaks into her phone; her words become a voice note, a text message and a photo."],
    ["AI understands & prioritizes", "Requests are translated, categorised, clustered and scored by urgency and need.", "Problems like a broken handpump, a potholed road, a dark streetlight, a clinic and a school flow into an AI hub and come out as sorted, prioritised lists."],
    ["Government acts & updates you", "Officials plan action from real demand and announce progress back to you.", "A citizen's report reaches a government office, officials act, and the road, streetlight, handpump and clinic are marked fixed while she gets a confirmation."],
  ],
  statRequests: "Requests raised", statStates: "States & UTs", statDistricts: "Districts covered", statResolved: "Resolved", statLanguages: "Languages",
  credit: "Developed by {team}", demoStats: "Requests raised and resolved are sample figures for this pilot. States, districts and languages are real.", demoAnnouncements: "Announcements marked 'Demo' are sample data for this pilot, not real government actions.", demoBadge: "Demo",
  // citizen home
  hello: "Namaste", raise: "Raise a Request", raiseSub: "Speak or type in any language. We'll take it from there.",
  viewAll: "View all", active: "Active", resolved: "Resolved",
  // submit
  submitSub: "Speak or type in any Indian language. Add a photo if you can.",
  tapSpeak: "Tap to speak", tapStop: "Tap to stop", or: "or",
  placeholder: "Type your request in any language…", addPhoto: "Add a photo", optional: "(optional)",
  state: "State / UT", district: "District", place: "City / Village", placePh: "e.g. Wadgaon",
  useLocation: "Use my location", located: "Location captured", locationFailed: "Couldn't get your location. We'll use the address instead.", micNeeded: "Microphone permission is needed to record.", transcribing: "Transcribing…", transcribeFailed: "Couldn't transcribe. Please type instead.",
  submit: "Submit request", understanding: "AI is understanding your request…", understandingSub: "Detecting language · translating · categorising",
  submitted: "Request submitted", refSms: "Reference {id} · Track it anytime in My Requests", understoodAs: "We understood your request as:",
  category: "Category", urgency: "Urgency", location: "Location", summary: "Summary", original: "Original",
  translation: "English translation", viewMine: "View my requests", another: "Raise another",
  // requests
  reqSub: "{n} requests · tap one to track progress", progress: "Progress", linkedAnn: "Linked announcement",
  selectReq: "Select a request to see its status timeline.", pending: "Pending",
  // announcements
  annSub: "What the government has done in response to citizen requests.", addressed: "{n} requests addressed",
  auth: {"welcome":"Welcome to JanVaani","welcomeSub":"Sign in to raise and track development requests.","google":"Continue with Google","orEmail":"or use email","signIn":"Sign in","signUp":"Create account","name":"Full name","email":"Email","password":"Password (min 6 characters)","forgot":"Forgot password?","resetSent":"Password reset email sent.","enterEmail":"Enter your email first.","noAccount":"New to JanVaani?","haveAccount":"Already have an account?","completeTitle":"Complete your profile","completeSub":"Tell us where you live so your requests reach the right officials.","save":"Continue","signOut":"Sign out","signedInAs":"Signed in as","notYou":"Not you?","officialSession":"You are signed in as a government official. Sign out to use JanVaani as a citizen.","toAdmin":"Go to admin","official":"Government official? Sign in here","notConfigured":"Firebase is not configured. Add your keys to .env.local (see .env.example).","errBadCreds":"Wrong email or password.","errInUse":"An account with this email already exists.","errWeak":"Password must be at least 6 characters.","errPopup":"Your browser blocked the Google sign-in popup. Allow popups for this site and try again.","errGeneric":"Something went wrong. Please try again."},
  push: {"enable":"Get notified about updates","on":"Notifications on","blocked":"Notifications are blocked in your browser settings"}, empty: {"requests":"You haven't raised any requests yet.","announcements":"No announcements yet."}, submitFailed: "Couldn't submit. Please try again.", photo: "Photo",
  status: { Submitted: "Submitted", "Under Review": "Under Review", "Action Planned": "Action Planned", Resolved: "Resolved" } as Record<Status, string>,
  cat: { Water: "Water", Roads: "Roads", Health: "Health", Education: "Education", Electricity: "Electricity", Sanitation: "Sanitation" } as Record<Category, string>,
  urg: { Critical: "Critical", High: "High", Medium: "Medium", Low: "Low" } as Record<string, string>,
};
type Dict = typeof en;

const hi: Dict = {
  label: "हिन्दी",
  home: "होम", requests: "मेरे अनुरोध", announcements: "घोषणाएं", language: "भाषा",
  dpg: "भारत के लिए एक डिजिटल पब्लिक गुड",
  heroA: "आपकी आवाज़, आपकी भाषा में, गढ़ती है ", heroB: "भारत का विकास।",
  heroSub: "पानी, सड़क, स्वास्थ्य, स्कूल जैसे विकास अनुरोध 22 भारतीय भाषाओं में से किसी में भी बोलकर या लिखकर भेजें। AI सुनिश्चित करता है कि हर आवाज़ सुनी जाए और सही अधिकारी तक पहुंचे।",
  citizen: "मैं नागरिक हूं", official: "मैं अधिकारी हूं", heroAlt: "एक महिला फ़ोन में बोल रही है और एक बुज़ुर्ग सुन रहे हैं। उसकी बातें मरम्मत हुए हैंडपंप, नई सड़क, क्लिनिक, स्कूल और जलती स्ट्रीटलाइट में बदल जाती हैं।", how: "यह कैसे काम करता है",
  steps: [
    ["बोलें या लिखें", "अपनी भाषा में समस्या बताएं - आवाज़, टेक्स्ट या फ़ोटो से। कोई फॉर्म नहीं, कोई कठिन शब्द नहीं।", "एक महिला फ़ोन में बोल रही है; उसकी बात वॉइस नोट, संदेश और फ़ोटो बन जाती है।"],
    ["AI समझता है और प्राथमिकता तय करता है", "अनुरोधों का अनुवाद, वर्गीकरण और समूहीकरण होता है, और तात्कालिकता व ज़रूरत के आधार पर अंक दिए जाते हैं।", "टूटा हैंडपंप, गड्ढों वाली सड़क, बंद स्ट्रीटलाइट, क्लिनिक और स्कूल जैसी समस्याएं AI केंद्र में जाकर छंटी हुई, प्राथमिकता वाली सूचियां बन जाती हैं।"],
    ["सरकार कार्रवाई करती है और आपको बताती है", "अधिकारी वास्तविक मांग के आधार पर योजना बनाते हैं और प्रगति की जानकारी आप तक पहुंचाते हैं।", "नागरिक की शिकायत सरकारी दफ़्तर पहुंचती है, अधिकारी काम करते हैं, और सड़क, स्ट्रीटलाइट, हैंडपंप व क्लिनिक ठीक होने पर उसे पुष्टि मिलती है।"],
  ],
  statRequests: "दर्ज अनुरोध", statStates: "राज्य व केंद्रशासित प्रदेश", statDistricts: "शामिल ज़िले", statResolved: "हल हुए", statLanguages: "भाषाएं",
  credit: "{team} द्वारा विकसित", demoStats: "दर्ज और हल हुए अनुरोधों की संख्या इस पायलट के लिए नमूना आंकड़े हैं। राज्य, ज़िले और भाषाएं वास्तविक हैं।", demoAnnouncements: "'डेमो' चिह्नित घोषणाएं इस पायलट का नमूना डेटा हैं, वास्तविक सरकारी कार्रवाई नहीं।", demoBadge: "डेमो",
  hello: "नमस्ते", raise: "अनुरोध दर्ज करें", raiseSub: "किसी भी भाषा में बोलें या लिखें। बाकी हम संभाल लेंगे।",
  viewAll: "सभी देखें", active: "सक्रिय", resolved: "हल हुए",
  submitSub: "किसी भी भारतीय भाषा में बोलें या लिखें। हो सके तो फ़ोटो जोड़ें।",
  tapSpeak: "बोलने के लिए टैप करें", tapStop: "रोकने के लिए टैप करें", or: "या",
  placeholder: "अपना अनुरोध किसी भी भाषा में लिखें…", addPhoto: "फ़ोटो जोड़ें", optional: "(वैकल्पिक)",
  state: "राज्य / केंद्रशासित प्रदेश", district: "ज़िला", place: "शहर / गांव", placePh: "जैसे वडगांव",
  useLocation: "मेरी लोकेशन इस्तेमाल करें", located: "लोकेशन मिल गई", locationFailed: "आपकी लोकेशन नहीं मिल सकी। हम पते का उपयोग करेंगे।", micNeeded: "रिकॉर्ड करने के लिए माइक्रोफ़ोन की अनुमति चाहिए।", transcribing: "लिखा जा रहा है…", transcribeFailed: "आवाज़ को लिखा नहीं जा सका। कृपया टाइप करें।",
  submit: "अनुरोध भेजें", understanding: "AI आपका अनुरोध समझ रहा है…", understandingSub: "भाषा पहचान · अनुवाद · वर्गीकरण",
  submitted: "अनुरोध दर्ज हुआ", refSms: "संदर्भ {id} · 'मेरे अनुरोध' में कभी भी देखें", understoodAs: "हमने आपका अनुरोध ऐसे समझा:",
  category: "श्रेणी", urgency: "तात्कालिकता", location: "स्थान", summary: "सारांश", original: "मूल",
  translation: "हिन्दी अनुवाद", viewMine: "मेरे अनुरोध देखें", another: "एक और अनुरोध",
  reqSub: "{n} अनुरोध · प्रगति देखने के लिए टैप करें", progress: "प्रगति", linkedAnn: "संबंधित घोषणा",
  selectReq: "स्थिति देखने के लिए कोई अनुरोध चुनें।", pending: "लंबित",
  annSub: "नागरिकों के अनुरोधों पर सरकार ने क्या किया।", addressed: "{n} अनुरोधों पर कार्रवाई",
  auth: {"welcome":"JanVaani में आपका स्वागत है","welcomeSub":"विकास अनुरोध दर्ज करने और ट्रैक करने के लिए साइन इन करें।","google":"Google से जारी रखें","orEmail":"या ईमेल से","signIn":"साइन इन करें","signUp":"खाता बनाएं","name":"पूरा नाम","email":"ईमेल","password":"पासवर्ड (कम से कम 6 अक्षर)","forgot":"पासवर्ड भूल गए?","resetSent":"पासवर्ड रीसेट ईमेल भेजा गया।","enterEmail":"पहले अपना ईमेल दर्ज करें।","noAccount":"JanVaani पर नए हैं?","haveAccount":"पहले से खाता है?","completeTitle":"अपनी प्रोफ़ाइल पूरी करें","completeSub":"बताएं कि आप कहां रहते हैं, ताकि आपके अनुरोध सही अधिकारियों तक पहुंचें।","save":"आगे बढ़ें","signOut":"साइन आउट","signedInAs":"इस खाते से साइन इन:","notYou":"आप नहीं हैं?","officialSession":"आप सरकारी अधिकारी के रूप में साइन इन हैं। नागरिक के रूप में उपयोग करने के लिए साइन आउट करें।","toAdmin":"एडमिन पर जाएं","official":"सरकारी अधिकारी? यहां साइन इन करें","notConfigured":"Firebase कॉन्फ़िगर नहीं है। अपनी keys .env.local में जोड़ें (.env.example देखें)।","errBadCreds":"ईमेल या पासवर्ड गलत है।","errInUse":"इस ईमेल से पहले से एक खाता मौजूद है।","errWeak":"पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।","errPopup":"आपके ब्राउज़र ने Google साइन-इन पॉपअप ब्लॉक कर दिया। इस साइट के लिए पॉपअप की अनुमति दें और फिर से प्रयास करें।","errGeneric":"कुछ गलत हो गया। कृपया फिर से प्रयास करें।"},
  push: {"enable":"अपडेट की सूचना पाएं","on":"सूचनाएं चालू हैं","blocked":"ब्राउज़र सेटिंग में सूचनाएं बंद हैं"}, empty: {"requests":"आपने अभी तक कोई अनुरोध दर्ज नहीं किया है।","announcements":"अभी कोई घोषणा नहीं है।"}, submitFailed: "अनुरोध नहीं भेजा जा सका। कृपया फिर से प्रयास करें।", photo: "फ़ोटो",
  status: { Submitted: "दर्ज", "Under Review": "समीक्षाधीन", "Action Planned": "कार्रवाई नियोजित", Resolved: "हल हुआ" },
  cat: { Water: "पानी", Roads: "सड़क", Health: "स्वास्थ्य", Education: "शिक्षा", Electricity: "बिजली", Sanitation: "स्वच्छता" },
  urg: { Critical: "अति गंभीर", High: "उच्च", Medium: "मध्यम", Low: "निम्न" },
};

const mr: Dict = {
  label: "मराठी",
  home: "मुख्यपृष्ठ", requests: "माझ्या विनंत्या", announcements: "घोषणा", language: "भाषा",
  dpg: "भारतासाठी एक डिजिटल पब्लिक गुड",
  heroA: "तुमचा आवाज, तुमच्या भाषेत, घडवतो ", heroB: "भारताचा विकास.",
  heroSub: "पाणी, रस्ते, आरोग्य, शाळा अशा विकास विनंत्या २२ भारतीय भाषांपैकी कोणत्याही भाषेत बोलून किंवा लिहून पाठवा. प्रत्येक आवाज ऐकला जाईल आणि योग्य अधिकाऱ्यापर्यंत पोहोचेल याची AI खात्री करते.",
  citizen: "मी नागरिक आहे", official: "मी अधिकारी आहे", heroAlt: "एक महिला फोनवर बोलत आहे आणि एक वृद्ध गृहस्थ ऐकत आहेत. तिचे शब्द दुरुस्त हातपंप, नवा रस्ता, दवाखाना, शाळा आणि चालू पथदिव्यात बदलतात.", how: "हे कसे कार्य करते",
  steps: [
    ["बोला किंवा लिहा", "तुमच्या भाषेत समस्या सांगा - आवाज, मजकूर किंवा फोटोद्वारे. कोणतेही फॉर्म नाहीत, क्लिष्ट शब्द नाहीत.", "एक महिला फोनवर बोलत आहे; तिचे बोलणे व्हॉइस नोट, संदेश आणि फोटो बनते."],
    ["AI समजते व प्राधान्य ठरवते", "विनंत्यांचे भाषांतर, वर्गीकरण व गटबद्धता होते आणि तातडी व गरजेनुसार गुण दिले जातात.", "तुटलेला हातपंप, खड्ड्यांचा रस्ता, बंद पथदिवा, दवाखाना आणि शाळा यांसारख्या समस्या AI केंद्रात जाऊन वर्गीकृत, प्राधान्यक्रमित याद्या बनतात."],
    ["सरकार कृती करते व तुम्हाला कळवते", "अधिकारी प्रत्यक्ष मागणीनुसार नियोजन करतात आणि प्रगतीची माहिती तुम्हाला देतात.", "नागरिकाची तक्रार सरकारी कार्यालयात पोहोचते, अधिकारी काम करतात, आणि रस्ता, पथदिवा, हातपंप व दवाखाना दुरुस्त झाल्यावर तिला पुष्टी मिळते."],
  ],
  statRequests: "नोंदवलेल्या विनंत्या", statStates: "राज्ये व केंद्रशासित प्रदेश", statDistricts: "समाविष्ट जिल्हे", statResolved: "निकाली", statLanguages: "भाषा",
  credit: "{team} यांनी विकसित केले", demoStats: "नोंदवलेल्या व निकाली विनंत्यांची संख्या या पायलटसाठी नमुना आकडे आहेत. राज्ये, जिल्हे आणि भाषा खऱ्या आहेत.", demoAnnouncements: "'डेमो' चिन्हांकित घोषणा या पायलटसाठी नमुना माहिती आहेत, खऱ्या सरकारी कृती नाहीत.", demoBadge: "डेमो",
  hello: "नमस्कार", raise: "विनंती नोंदवा", raiseSub: "कोणत्याही भाषेत बोला किंवा लिहा. पुढचे आम्ही पाहू.",
  viewAll: "सर्व पहा", active: "सक्रिय", resolved: "निकाली",
  submitSub: "कोणत्याही भारतीय भाषेत बोला किंवा लिहा. शक्य असल्यास फोटो जोडा.",
  tapSpeak: "बोलण्यासाठी टॅप करा", tapStop: "थांबवण्यासाठी टॅप करा", or: "किंवा",
  placeholder: "तुमची विनंती कोणत्याही भाषेत लिहा…", addPhoto: "फोटो जोडा", optional: "(ऐच्छिक)",
  state: "राज्य / केंद्रशासित प्रदेश", district: "जिल्हा", place: "शहर / गाव", placePh: "उदा. वडगाव",
  useLocation: "माझे स्थान वापरा", located: "स्थान मिळाले", locationFailed: "तुमचे स्थान मिळाले नाही. आम्ही पत्ता वापरू.", micNeeded: "रेकॉर्ड करण्यासाठी मायक्रोफोनची परवानगी हवी.", transcribing: "लिहिले जात आहे…", transcribeFailed: "आवाज लिहिता आला नाही. कृपया टाइप करा.",
  submit: "विनंती पाठवा", understanding: "AI तुमची विनंती समजून घेत आहे…", understandingSub: "भाषा ओळख · भाषांतर · वर्गीकरण",
  submitted: "विनंती नोंदवली", refSms: "संदर्भ {id} · 'माझ्या विनंत्या' मध्ये कधीही पहा", understoodAs: "आम्ही तुमची विनंती अशी समजलो:",
  category: "श्रेणी", urgency: "तातडी", location: "स्थान", summary: "सारांश", original: "मूळ",
  translation: "इंग्रजी भाषांतर (अधिकाऱ्यांसाठी)", viewMine: "माझ्या विनंत्या पहा", another: "आणखी विनंती",
  reqSub: "{n} विनंत्या · प्रगती पाहण्यासाठी टॅप करा", progress: "प्रगती", linkedAnn: "संबंधित घोषणा",
  selectReq: "स्थिती पाहण्यासाठी विनंती निवडा.", pending: "प्रलंबित",
  annSub: "नागरिकांच्या विनंत्यांवर सरकारने काय केले.", addressed: "{n} विनंत्यांवर कार्यवाही",
  auth: {"welcome":"JanVaani मध्ये आपले स्वागत आहे","welcomeSub":"विकास विनंत्या नोंदवण्यासाठी व पाहण्यासाठी साइन इन करा.","google":"Google द्वारे पुढे जा","orEmail":"किंवा ईमेल वापरा","signIn":"साइन इन करा","signUp":"खाते तयार करा","name":"पूर्ण नाव","email":"ईमेल","password":"पासवर्ड (किमान ६ अक्षरे)","forgot":"पासवर्ड विसरलात?","resetSent":"पासवर्ड रीसेट ईमेल पाठवला.","enterEmail":"आधी तुमचा ईमेल लिहा.","noAccount":"JanVaani वर नवीन आहात?","haveAccount":"आधीच खाते आहे?","completeTitle":"तुमची प्रोफाइल पूर्ण करा","completeSub":"तुम्ही कुठे राहता ते सांगा, म्हणजे तुमच्या विनंत्या योग्य अधिकाऱ्यांपर्यंत पोहोचतील.","save":"पुढे जा","signOut":"साइन आउट","signedInAs":"या खात्याने साइन इन:","notYou":"तुम्ही नाही?","officialSession":"तुम्ही सरकारी अधिकारी म्हणून साइन इन आहात. नागरिक म्हणून वापरण्यासाठी साइन आउट करा.","toAdmin":"अ‍ॅडमिनवर जा","official":"सरकारी अधिकारी? येथे साइन इन करा","notConfigured":"Firebase कॉन्फिगर केलेले नाही. तुमच्या keys .env.local मध्ये जोडा (.env.example पहा).","errBadCreds":"ईमेल किंवा पासवर्ड चुकीचा आहे.","errInUse":"या ईमेलने आधीच खाते आहे.","errWeak":"पासवर्ड किमान ६ अक्षरांचा असावा.","errPopup":"तुमच्या ब्राउझरने Google साइन-इन पॉपअप ब्लॉक केला. या साइटसाठी पॉपअपला परवानगी द्या आणि पुन्हा प्रयत्न करा.","errGeneric":"काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा."},
  push: {"enable":"अपडेटची सूचना मिळवा","on":"सूचना सुरू आहेत","blocked":"ब्राउझर सेटिंगमध्ये सूचना बंद आहेत"}, empty: {"requests":"तुम्ही अद्याप कोणतीही विनंती नोंदवलेली नाही.","announcements":"अद्याप कोणतीही घोषणा नाही."}, submitFailed: "विनंती पाठवता आली नाही. कृपया पुन्हा प्रयत्न करा.", photo: "फोटो",
  status: { Submitted: "नोंदवली", "Under Review": "पुनरावलोकनाधीन", "Action Planned": "कृती नियोजित", Resolved: "निकाली" },
  cat: { Water: "पाणी", Roads: "रस्ते", Health: "आरोग्य", Education: "शिक्षण", Electricity: "वीज", Sanitation: "स्वच्छता" },
  urg: { Critical: "अतितातडीचे", High: "उच्च", Medium: "मध्यम", Low: "कमी" },
};

const DICT = { en, hi, mr };
export type Lang = keyof typeof DICT;
export const LANG_OPTIONS = Object.entries(DICT).map(([k, v]) => [k as Lang, v.label] as const);

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "en", setLang: () => {} });

// Root layout holds the citizen/landing language; admin wraps its own provider so it stays English.
export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export function useLang() {
  const { lang, setLang } = useContext(Ctx);
  return {
    lang,
    setLang,
    t: DICT[lang],
    /** Pick the current language from a Localized value (falls back to English). */
    L: (v: Localized | string) => (typeof v === "string" ? v : v[lang] || v.en),
    date: (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) =>
      new Date(iso).toLocaleDateString(`${lang}-IN`, opts),
    num: (n: number) => n.toLocaleString(`${lang}-IN`),
  };
}
