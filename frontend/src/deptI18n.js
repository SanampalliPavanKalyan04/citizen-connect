import { useT } from "./i18n";

// Department names, group names and labels in English / Telugu / Hindi
const DT = {
  en: {
    departments: "Departments", department: "Department", handledBy: "Handled by",
    chooseDept: "Which department?", chooseIssue: "What's the issue?", target: "Target resolution", days: "days",
    searchIssue: "Search issues, e.g. passbook, pension, ration, street light",
    dept_REVENUE: "Revenue", dept_REGISTRATION: "Registration & Stamps", dept_ROADS: "Roads & Buildings",
    dept_SANITATION: "Sanitation", dept_LIGHTING: "Street Lighting", dept_WATER: "Water Supply",
    dept_DRAINAGE: "Drainage & Sewerage", dept_ELECTRICAL: "Electricity (APSPDCL)",
    dept_PANCHAYAT: "Panchayat Raj & Rural Development", dept_IRRIGATION: "Water Resources (Irrigation)",
    dept_AGRICULTURE: "Agriculture", dept_CIVIL_SUPPLIES: "Civil Supplies", dept_WELFARE: "Social Welfare & Pensions",
    dept_HOUSING: "Housing", dept_WOMEN_CHILD: "Women & Child Welfare", dept_HEALTH: "Health & Family Welfare",
    dept_EDUCATION: "School Education", dept_POLICE: "Police", dept_TRANSPORT: "Transport", dept_FOREST: "Forest",
    dept_GENERAL: "General Administration",
    "grp_Land & Revenue": "Land & Revenue", "grp_Municipal services": "Municipal services",
    "grp_Rural development": "Rural development", grp_Welfare: "Welfare", "grp_Health & education": "Health & education",
    "grp_Public safety": "Public safety", grp_Other: "Other",
  },
  te: {
    departments: "విభాగాలు", department: "విభాగం", handledBy: "బాధ్యత వహించే విభాగం",
    chooseDept: "ఏ విభాగం?", chooseIssue: "సమస్య ఏమిటి?", target: "పరిష్కార గడువు", days: "రోజులు",
    searchIssue: "సమస్యను వెతకండి, ఉదా. పాస్‌బుక్, పింఛను, రేషన్",
    dept_REVENUE: "రెవెన్యూ", dept_REGISTRATION: "రిజిస్ట్రేషన్ & స్టాంపులు", dept_ROADS: "రోడ్లు & భవనాలు",
    dept_SANITATION: "పారిశుద్ధ్యం", dept_LIGHTING: "వీధి దీపాలు", dept_WATER: "నీటి సరఫరా",
    dept_DRAINAGE: "డ్రైనేజీ & మురుగునీరు", dept_ELECTRICAL: "విద్యుత్ (APSPDCL)",
    dept_PANCHAYAT: "పంచాయతీ రాజ్ & గ్రామీణాభివృద్ధి", dept_IRRIGATION: "జలవనరులు (నీటిపారుదల)",
    dept_AGRICULTURE: "వ్యవసాయం", dept_CIVIL_SUPPLIES: "పౌర సరఫరాలు", dept_WELFARE: "సాంఘిక సంక్షేమం & పింఛన్లు",
    dept_HOUSING: "గృహ నిర్మాణం", dept_WOMEN_CHILD: "మహిళా & శిశు సంక్షేమం", dept_HEALTH: "వైద్య ఆరోగ్యం & కుటుంబ సంక్షేమం",
    dept_EDUCATION: "పాఠశాల విద్య", dept_POLICE: "పోలీస్", dept_TRANSPORT: "రవాణా", dept_FOREST: "అటవీ",
    dept_GENERAL: "సాధారణ పరిపాలన",
    "grp_Land & Revenue": "భూమి & రెవెన్యూ", "grp_Municipal services": "పురపాలక సేవలు",
    "grp_Rural development": "గ్రామీణాభివృద్ధి", grp_Welfare: "సంక్షేమం", "grp_Health & education": "ఆరోగ్యం & విద్య",
    "grp_Public safety": "ప్రజా భద్రత", grp_Other: "ఇతర",
  },
  hi: {
    departments: "विभाग", department: "विभाग", handledBy: "जिम्मेदार विभाग",
    chooseDept: "कौन सा विभाग?", chooseIssue: "समस्या क्या है?", target: "समाधान की समय-सीमा", days: "दिन",
    searchIssue: "समस्या खोजें, जैसे पासबुक, पेंशन, राशन",
    dept_REVENUE: "राजस्व", dept_REGISTRATION: "पंजीकरण एवं स्टाम्प", dept_ROADS: "सड़क एवं भवन",
    dept_SANITATION: "स्वच्छता", dept_LIGHTING: "स्ट्रीट लाइटिंग", dept_WATER: "जल आपूर्ति",
    dept_DRAINAGE: "जल निकासी एवं सीवरेज", dept_ELECTRICAL: "बिजली (APSPDCL)",
    dept_PANCHAYAT: "पंचायती राज एवं ग्रामीण विकास", dept_IRRIGATION: "जल संसाधन (सिंचाई)",
    dept_AGRICULTURE: "कृषि", dept_CIVIL_SUPPLIES: "नागरिक आपूर्ति", dept_WELFARE: "समाज कल्याण एवं पेंशन",
    dept_HOUSING: "आवास", dept_WOMEN_CHILD: "महिला एवं बाल कल्याण", dept_HEALTH: "स्वास्थ्य एवं परिवार कल्याण",
    dept_EDUCATION: "स्कूल शिक्षा", dept_POLICE: "पुलिस", dept_TRANSPORT: "परिवहन", dept_FOREST: "वन",
    dept_GENERAL: "सामान्य प्रशासन",
    "grp_Land & Revenue": "भूमि एवं राजस्व", "grp_Municipal services": "नगरपालिका सेवाएं",
    "grp_Rural development": "ग्रामीण विकास", grp_Welfare: "कल्याण", "grp_Health & education": "स्वास्थ्य एवं शिक्षा",
    "grp_Public safety": "सार्वजनिक सुरक्षा", grp_Other: "अन्य",
  },
};

export function useDT() {
  const { lang } = useT();
  return k => (DT[lang] && DT[lang][k]) || DT.en[k] || k;
}
