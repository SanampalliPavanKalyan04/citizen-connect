import { createContext, useContext, useEffect, useState } from "react";

// English / Telugu / Hindi strings for the main screens.
const D = {
  en: {
    tagline: "Civic Grievance Portal",
    heroA: "Your city,", heroB: "heard.",
    heroText: "Report potholes, garbage, broken street lights and more. Track every complaint from submission to resolution.",
    report: "Report an Issue", signIn: "Sign in", register: "Create account", dashboard: "Go to dashboard",
    trackTitle: "Track a complaint", trackHint: "Enter your complaint ID, e.g. CC-4107136573", track: "Track",
    statTotal: "Complaints received", statResolved: "Resolved", statAvg: "Avg. resolution time", statRating: "Citizen rating",
    howTitle: "How it works",
    how1: "Report", how1t: "Pick a category, describe the problem, pin it on the map and add a photo.",
    how2: "We assign", how2t: "The admin routes it to the right field team with a deadline.",
    how3: "It gets fixed", how3t: "Follow live updates, see the after photo and rate the work.",
    catsTitle: "What you can report", recentTitle: "Recently resolved",
    myComplaints: "My Complaints", allComplaints: "All Complaints", analytics: "Analytics", users: "Users", tasks: "Assigned Tasks",
    logout: "Logout", total: "Total", pending: "Pending", inProgress: "In Progress", resolved: "Resolved",
    assigned: "Assigned", rejected: "Rejected", overdue: "Overdue",
    PENDING: "Pending", ASSIGNED: "Assigned", IN_PROGRESS: "In Progress", RESOLVED: "Resolved", REJECTED: "Rejected",
    Pothole: "Pothole", Garbage: "Garbage", "Street Light": "Street Light", Water: "Water",
    Drainage: "Drainage", Electricity: "Electricity", "Road Cleaning": "Road Cleaning", Other: "Other",
    viewDetails: "View details", rateNow: "Rate the work", updated: "Updated", live: "Live",
    welcome: "Welcome back", signInSub: "Sign in to report and track civic issues.",
    email: "Email address", password: "Password", newCitizen: "New citizen?", haveAccount: "Already registered?",
    home: "Home",
  },
  te: {
    tagline: "పౌర ఫిర్యాదుల పోర్టల్",
    heroA: "మీ నగరం,", heroB: "మీ మాట.",
    heroText: "గుంతలు, చెత్త, వెలగని వీధి దీపాలు మరియు మరెన్నో ఫిర్యాదు చేయండి. ప్రతి ఫిర్యాదును పరిష్కారం వరకు ట్రాక్ చేయండి.",
    report: "సమస్యను నివేదించండి", signIn: "లాగిన్", register: "ఖాతా సృష్టించండి", dashboard: "డాష్‌బోర్డ్‌కు వెళ్ళండి",
    trackTitle: "ఫిర్యాదును ట్రాక్ చేయండి", trackHint: "మీ ఫిర్యాదు ID నమోదు చేయండి, ఉదా. CC-4107136573", track: "ట్రాక్",
    statTotal: "అందిన ఫిర్యాదులు", statResolved: "పరిష్కరించినవి", statAvg: "సగటు పరిష్కార సమయం", statRating: "పౌరుల రేటింగ్",
    howTitle: "ఇది ఎలా పనిచేస్తుంది",
    how1: "నివేదించండి", how1t: "వర్గాన్ని ఎంచుకుని, సమస్యను వివరించి, మ్యాప్‌లో గుర్తించి ఫోటో జోడించండి.",
    how2: "మేము కేటాయిస్తాం", how2t: "అడ్మిన్ గడువుతో సరైన బృందానికి అప్పగిస్తారు.",
    how3: "పరిష్కారం", how3t: "లైవ్ అప్‌డేట్‌లు చూడండి, తర్వాతి ఫోటో చూసి రేటింగ్ ఇవ్వండి.",
    catsTitle: "మీరు నివేదించగలిగేవి", recentTitle: "ఇటీవల పరిష్కరించినవి",
    myComplaints: "నా ఫిర్యాదులు", allComplaints: "అన్ని ఫిర్యాదులు", analytics: "విశ్లేషణ", users: "వినియోగదారులు", tasks: "కేటాయించిన పనులు",
    logout: "లాగౌట్", total: "మొత్తం", pending: "పెండింగ్", inProgress: "పనిలో ఉంది", resolved: "పరిష్కరించబడింది",
    assigned: "కేటాయించబడింది", rejected: "తిరస్కరించబడింది", overdue: "గడువు మీరింది",
    PENDING: "పెండింగ్", ASSIGNED: "కేటాయించబడింది", IN_PROGRESS: "పనిలో ఉంది", RESOLVED: "పరిష్కరించబడింది", REJECTED: "తిరస్కరించబడింది",
    Pothole: "గుంత", Garbage: "చెత్త", "Street Light": "వీధి దీపం", Water: "నీరు",
    Drainage: "డ్రైనేజీ", Electricity: "విద్యుత్", "Road Cleaning": "రోడ్డు శుభ్రత", Other: "ఇతర",
    viewDetails: "వివరాలు చూడండి", rateNow: "రేటింగ్ ఇవ్వండి", updated: "నవీకరించబడింది", live: "లైవ్",
    welcome: "స్వాగతం", signInSub: "సమస్యలను నివేదించడానికి, ట్రాక్ చేయడానికి లాగిన్ అవ్వండి.",
    email: "ఈమెయిల్", password: "పాస్‌వర్డ్", newCitizen: "కొత్త పౌరులా?", haveAccount: "ఇప్పటికే నమోదు చేసుకున్నారా?",
    home: "హోమ్",
  },
  hi: {
    tagline: "नागरिक शिकायत पोर्टल",
    heroA: "आपका शहर,", heroB: "आपकी आवाज़।",
    heroText: "गड्ढे, कचरा, खराब स्ट्रीट लाइट और बहुत कुछ की शिकायत करें। हर शिकायत को समाधान तक ट्रैक करें।",
    report: "समस्या दर्ज करें", signIn: "लॉग इन", register: "खाता बनाएं", dashboard: "डैशबोर्ड पर जाएं",
    trackTitle: "शिकायत ट्रैक करें", trackHint: "अपनी शिकायत ID डालें, जैसे CC-4107136573", track: "ट्रैक",
    statTotal: "प्राप्त शिकायतें", statResolved: "हल की गईं", statAvg: "औसत समाधान समय", statRating: "नागरिक रेटिंग",
    howTitle: "यह कैसे काम करता है",
    how1: "दर्ज करें", how1t: "श्रेणी चुनें, समस्या बताएं, नक्शे पर जगह चिह्नित करें और फोटो जोड़ें।",
    how2: "हम सौंपते हैं", how2t: "एडमिन समय-सीमा के साथ सही टीम को भेजते हैं।",
    how3: "समाधान", how3t: "लाइव अपडेट देखें, बाद की फोटो देखें और काम को रेट करें।",
    catsTitle: "आप क्या दर्ज कर सकते हैं", recentTitle: "हाल ही में हल की गईं",
    myComplaints: "मेरी शिकायतें", allComplaints: "सभी शिकायतें", analytics: "विश्लेषण", users: "उपयोगकर्ता", tasks: "सौंपे गए कार्य",
    logout: "लॉग आउट", total: "कुल", pending: "लंबित", inProgress: "प्रगति में", resolved: "हल हुई",
    assigned: "सौंपी गई", rejected: "अस्वीकृत", overdue: "समय-सीमा पार",
    PENDING: "लंबित", ASSIGNED: "सौंपी गई", IN_PROGRESS: "प्रगति में", RESOLVED: "हल हुई", REJECTED: "अस्वीकृत",
    Pothole: "गड्ढा", Garbage: "कचरा", "Street Light": "स्ट्रीट लाइट", Water: "पानी",
    Drainage: "नाली", Electricity: "बिजली", "Road Cleaning": "सड़क सफाई", Other: "अन्य",
    viewDetails: "विवरण देखें", rateNow: "काम को रेट करें", updated: "अपडेट", live: "लाइव",
    welcome: "फिर से स्वागत है", signInSub: "समस्याएं दर्ज करने और ट्रैक करने के लिए लॉग इन करें।",
    email: "ईमेल", password: "पासवर्ड", newCitizen: "नए नागरिक?", haveAccount: "पहले से पंजीकृत?",
    home: "होम",
  },
};

export const LANGS = [["en", "English"], ["te", "తెలుగు"], ["hi", "हिन्दी"]];

const Ctx = createContext({ lang: "en", setLang: () => {}, t: k => k });

function read(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => read("lang", "en"));
  const setLang = l => { setLangState(l); try { localStorage.setItem("lang", l); } catch {} };
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const t = k => (D[lang] && D[lang][k]) || D.en[k] || k;
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);

export function LangSelect({ className = "" }) {
  const { lang, setLang } = useT();
  return (
    <select className={`lang-select ${className}`} value={lang} onChange={e => setLang(e.target.value)} aria-label="Language">
      {LANGS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
    </select>
  );
}

// Dark mode: stored per browser, applied as data-theme on <html>
export function useTheme() {
  const [theme, setTheme] = useState(() => read("theme", window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme]);
  return [theme, () => setTheme(t => (t === "dark" ? "light" : "dark"))];
}
