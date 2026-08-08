import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "./Footer";
import {
  Shield,
  ShieldCheck,
  Building2,
  Stethoscope,
  Search,
  CheckCircle2,
  User,
  Filter,
  Clock,
  MapPin,
  FileText,
  Eye,
  AlertTriangle,
  BarChart3,
  Flame,
  Activity,
  TrendingUp,
  Sparkles,
  Layers,
  Globe,
  Paperclip,
  ZoomIn,
  X,
  Upload,
  CheckCircle,
  SlidersHorizontal,
} from "lucide-react";

const MOCK_ENVIRONMENT_REPORTS = [
  {
    id: "REP-2026-0881",
    title: "Anand Vihar ITO Corridor PM2.5 Spike",
    category: "Air Quality",
    location: "Anand Vihar, East Delhi",
    state: "Delhi",
    aqi: 228,
    status: "Escalated",
    date: "2026-08-08",
    roles: ["user", "admin", "authority", "investigator"],
    hospitalImpact: "Respiratory admission surge of +18% at nearby GTB Hospital.",
    authorityAction: "GRAP Stage-III restrictions activated for East Delhi zone.",
    investigatorLog: "Heavy construction dust and diesel genset emissions near NH-24 flyover.",
    reporter: "CPCB Continuous Monitoring Station #AN-03",
    attachment: {
      name: "Anand_Vihar_PM25_Audit.svg",
      type: "image/svg+xml",
      url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"><rect width="600" height="400" rx="16" fill="%23f8fafc"/><rect x="20" y="20" width="560" height="360" rx="12" fill="white" stroke="%23cbd5e1" stroke-width="2"/><rect x="20" y="20" width="560" height="60" fill="%23be123c" rx="12"/><text x="40" y="58" fill="white" font-family="sans-serif" font-size="20" font-weight="bold">AIR QUALITY ESCALATION REPORT</text><text x="40" y="110" fill="%23be123c" font-family="sans-serif" font-size="14" font-weight="bold">STATION: CPCB Anand Vihar #AN-03</text><text x="40" y="135" fill="%23475569" font-family="sans-serif" font-size="12">PM2.5: 228 ug/m3 (Very Unhealthy)</text><line x1="40" y1="160" x2="560" y2="160" stroke="%23e2e8f0" stroke-width="2"/><text x="40" y="190" fill="%231e293b" font-family="sans-serif" font-size="13" font-weight="bold">Pollutant</text><text x="350" y="190" fill="%231e293b" font-family="sans-serif" font-size="13" font-weight="bold">Reading</text><text x="480" y="190" fill="%231e293b" font-family="sans-serif" font-size="13" font-weight="bold">Status</text><text x="40" y="220" fill="%23475569" font-family="sans-serif" font-size="12">PM2.5 (24hr avg)</text><text x="350" y="220" fill="%23e11d48" font-family="sans-serif" font-size="12">228 ug/m3</text><text x="480" y="220" fill="%23e11d48" font-family="sans-serif" font-size="12">ESCALATED</text><text x="40" y="250" fill="%23475569" font-family="sans-serif" font-size="12">NO2</text><text x="350" y="250" fill="%23d97706" font-family="sans-serif" font-size="12">98 ppb</text><text x="480" y="250" fill="%23d97706" font-family="sans-serif" font-size="12">WARNING</text><rect x="40" y="310" width="180" height="40" rx="8" fill="%23fee2e2"/><text x="55" y="335" fill="%23991b1b" font-family="sans-serif" font-size="12" font-weight="bold">GRAP STAGE-III</text></svg>`,
      description: "CPCB continuous monitoring station report for Anand Vihar ITO corridor."
    }
  },
  {
    id: "REP-2026-0882",
    title: "Safdarjung Hospital Pediatric Asthma Cluster",
    category: "Hospital Exposure",
    location: "Safdarjung Hospital, South Delhi",
    state: "Delhi",
    aqi: 172,
    status: "Under Investigation",
    date: "2026-08-08",
    roles: ["admin", "hospital", "reviewer"],
    hospitalImpact: "+22% surge in pediatric wheeze cases over 48 hours linked to stubble haze.",
    authorityAction: "Health advisory issued for schools within 5 km radius.",
    investigatorLog: "Correlating hospital OPD timestamps with SAFAR sensor PM10 readings.",
    reporter: "Dr. R. Kapoor (Pulmonology HOD)",
    attachment: {
      name: "Hospital_Asthma_Cluster_Report.svg",
      type: "image/svg+xml",
      url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"><rect width="600" height="400" rx="16" fill="%23f8fafc"/><rect x="20" y="20" width="560" height="360" rx="12" fill="white" stroke="%23cbd5e1" stroke-width="2"/><rect x="20" y="20" width="560" height="60" fill="%230284c7" rx="12"/><text x="40" y="58" fill="white" font-family="sans-serif" font-size="20" font-weight="bold">CLINICAL RESPIRATORY AUDIT</text><text x="40" y="110" fill="%230369a1" font-family="sans-serif" font-size="14" font-weight="bold">Safdarjung Hospital Pediatric Ward</text><text x="40" y="135" fill="%23475569" font-family="sans-serif" font-size="12">48-Hour Asthma Admission Correlation Study</text><line x1="40" y1="160" x2="560" y2="160" stroke="%23e2e8f0" stroke-width="2"/><text x="40" y="190" fill="%231e293b" font-family="sans-serif" font-size="13" font-weight="bold">Metric</text><text x="350" y="190" fill="%231e293b" font-family="sans-serif" font-size="13" font-weight="bold">Value</text><text x="480" y="190" fill="%231e293b" font-family="sans-serif" font-size="13" font-weight="bold">Status</text><text x="40" y="220" fill="%23475569" font-family="sans-serif" font-size="12">Pediatric Wheeze Cases</text><text x="350" y="220" fill="%23d97706" font-family="sans-serif" font-size="12">+22% in 48hrs</text><text x="480" y="220" fill="%23d97706" font-family="sans-serif" font-size="12">INVESTIGATING</text><rect x="40" y="310" width="200" height="40" rx="8" fill="%23e0f2fe"/><text x="55" y="335" fill="%230369a1" font-family="sans-serif" font-size="12" font-weight="bold">CLINICAL AUDIT PROOF</text></svg>`,
      description: "Safdarjung Hospital pediatric respiratory correlation study."
    }
  },
  {
    id: "REP-2026-0883",
    title: "Wazirabad WTP Ammonia Contamination Alert",
    category: "Water Quality",
    location: "Wazirabad Water Treatment Plant",
    state: "Delhi",
    aqi: 124,
    status: "Escalated",
    date: "2026-08-07",
    roles: ["hospital", "admin", "authority", "reviewer"],
    hospitalImpact: "Boil-water advisory issued for North Delhi households.",
    authorityAction: "DJB activated emergency intake diversion from Upper Ganga Canal.",
    investigatorLog: "Ammonia at 3.1 ppm detected at raw intake (safe limit 0.5 ppm).",
    reporter: "Delhi Jal Board SCADA System",
    attachment: {
      name: "DJB_Ammonia_Alert.svg",
      type: "image/svg+xml",
      url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"><rect width="600" height="400" rx="16" fill="%23f8fafc"/><rect x="20" y="20" width="560" height="360" rx="12" fill="white" stroke="%23cbd5e1" stroke-width="2"/><rect x="20" y="20" width="560" height="60" fill="%23e11d48" rx="12"/><text x="40" y="58" fill="white" font-family="sans-serif" font-size="20" font-weight="bold">WATER TREATMENT ESCALATION</text><text x="40" y="110" fill="%23e11d48" font-family="sans-serif" font-size="14" font-weight="bold">DJB Wazirabad Intake Alert</text><text x="40" y="135" fill="%23475569" font-family="sans-serif" font-size="12">Ammonia: 3.1 ppm (Safe limit: 0.5 ppm)</text><line x1="40" y1="160" x2="560" y2="160" stroke="%23e2e8f0" stroke-width="2"/><text x="40" y="190" fill="%231e293b" font-family="sans-serif" font-size="13" font-weight="bold">Contaminant</text><text x="350" y="190" fill="%231e293b" font-family="sans-serif" font-size="13" font-weight="bold">Level</text><text x="480" y="190" fill="%231e293b" font-family="sans-serif" font-size="13" font-weight="bold">Action</text><text x="40" y="220" fill="%23475569" font-family="sans-serif" font-size="12">Ammonia (NH3)</text><text x="350" y="220" fill="%23e11d48" font-family="sans-serif" font-size="12">3.1 ppm</text><text x="480" y="220" fill="%23e11d48" font-family="sans-serif" font-size="12">DIVERTED</text><rect x="40" y="310" width="200" height="40" rx="8" fill="%23ffe4e6"/><text x="55" y="335" fill="%239f1239" font-family="sans-serif" font-size="12" font-weight="bold">BOIL-WATER ADVISORY</text></svg>`,
      description: "Delhi Jal Board SCADA automated contamination alert notice."
    }
  },
  {
    id: "REP-2026-0884",
    title: "Dwarka Sector 21 Solar Streetlight Grid",
    category: "Green Infrastructure",
    location: "Dwarka Sector 21, West Delhi",
    state: "Delhi",
    aqi: 88,
    status: "Verified",
    date: "2026-08-04",
    roles: ["user", "admin", "authority"],
    hospitalImpact: "Zero health risk — improved pedestrian night safety.",
    authorityAction: "Phase 2 solar expansion budget approved by SDMC.",
    investigatorLog: "62 solar LED units commissioned with IoT dimming control.",
    reporter: "SDMC Urban Development Cell",
    attachment: {
      name: "Solar_Grid_Certificate.svg",
      type: "image/svg+xml",
      url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"><rect width="600" height="400" rx="16" fill="%23f8fafc"/><rect x="20" y="20" width="560" height="360" rx="12" fill="white" stroke="%23cbd5e1" stroke-width="2"/><rect x="20" y="20" width="560" height="60" fill="%23047857" rx="12"/><text x="40" y="58" fill="white" font-family="sans-serif" font-size="20" font-weight="bold">SOLAR INFRASTRUCTURE CERTIFICATE</text><text x="40" y="110" fill="%23047857" font-family="sans-serif" font-size="14" font-weight="bold">Dwarka Sector 21 Smart Solar Grid</text><text x="40" y="135" fill="%23475569" font-family="sans-serif" font-size="12">62 IoT Solar LED Units - 100% Renewable</text><line x1="40" y1="160" x2="560" y2="160" stroke="%23e2e8f0" stroke-width="2"/><text x="40" y="220" fill="%23475569" font-family="sans-serif" font-size="12">62 Smart Solar LEDs</text><text x="350" y="220" fill="%23047857" font-family="sans-serif" font-size="12">100% Renewable</text><text x="480" y="220" fill="%23047857" font-family="sans-serif" font-size="12">VERIFIED</text><rect x="40" y="310" width="180" height="40" rx="8" fill="%23d1fae5"/><text x="55" y="335" fill="%23065f46" font-family="sans-serif" font-size="12" font-weight="bold">SOLAR APPROVED</text></svg>`,
      description: "SDMC smart solar grid commissioning certificate."
    }
  },
  {
    id: "REP-2026-0885",
    title: "Gharuan Village Zero-Carbon Bicycle Commute",
    category: "User Footprint",
    location: "Gharuan, Mohali District",
    state: "Punjab",
    aqi: 42,
    status: "Verified",
    date: "2026-08-06",
    roles: ["user", "admin", "reviewer"],
    hospitalImpact: "Zero environmental health risks — clean air zone.",
    authorityAction: "Green Citizen Reward credits issued to 34 participants.",
    investigatorLog: "Verified 120 kg CO2 offset via GPS-tracked bicycle commutes.",
    reporter: "Gharuan Community Eco-Club",
    attachment: {
      name: "Gharuan_Green_Commute_Cert.svg",
      type: "image/svg+xml",
      url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"><rect width="600" height="400" rx="16" fill="%23f8fafc"/><rect x="20" y="20" width="560" height="360" rx="12" fill="white" stroke="%23cbd5e1" stroke-width="2"/><rect x="20" y="20" width="560" height="60" fill="%23065f46" rx="12"/><text x="40" y="58" fill="white" font-family="sans-serif" font-size="20" font-weight="bold">GREEN COMMUTE VERIFICATION</text><text x="40" y="110" fill="%23047857" font-family="sans-serif" font-size="14" font-weight="bold">Gharuan Eco-Club Certificate</text><text x="40" y="135" fill="%23475569" font-family="sans-serif" font-size="12">CO2 Offset: -120 kg via Active Bicycle Commute</text><rect x="40" y="310" width="180" height="40" rx="8" fill="%23d1fae5"/><text x="55" y="335" fill="%23065f46" font-family="sans-serif" font-size="12" font-weight="bold">VERIFIED GREEN</text></svg>`,
      description: "Community eco-club green commute verification certificate."
    }
  },
  {
    id: "REP-2026-0886",
    title: "Patiala Dakha Landfill Odor Complaint",
    category: "Landfill Safety",
    location: "Dakha Dump Site, Patiala",
    state: "Punjab",
    aqi: 95,
    status: "Resolved",
    date: "2026-08-05",
    roles: ["admin", "authority", "investigator"],
    hospitalImpact: "Mild odor-related nausea complaints from 2 nearby villages resolved.",
    authorityAction: "Bio-cover layer applied and methane vent valve replaced.",
    investigatorLog: "Post-repair methane reading: 0 ppm. Odor index within safe limits.",
    reporter: "Patiala Municipal Corporation",
    attachment: {
      name: "Dakha_Landfill_Repair_Cert.svg",
      type: "image/svg+xml",
      url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"><rect width="600" height="400" rx="16" fill="%23f8fafc"/><rect x="20" y="20" width="560" height="360" rx="12" fill="white" stroke="%23cbd5e1" stroke-width="2"/><rect x="20" y="20" width="560" height="60" fill="%232563eb" rx="12"/><text x="40" y="58" fill="white" font-family="sans-serif" font-size="20" font-weight="bold">LANDFILL REPAIR COMPLETION</text><text x="40" y="110" fill="%231d4ed8" font-family="sans-serif" font-size="14" font-weight="bold">Dakha Dump Site - Patiala</text><text x="40" y="135" fill="%23475569" font-family="sans-serif" font-size="12">Methane Vent Valve Replaced - Zero Leakage</text><rect x="40" y="310" width="180" height="40" rx="8" fill="%23dbeafe"/><text x="55" y="335" fill="%231e40af" font-family="sans-serif" font-size="12" font-weight="bold">REPAIR VERIFIED</text></svg>`,
      description: "Patiala municipal landfill bio-cover and valve repair certificate."
    }
  },
  {
    id: "REP-2026-0887",
    title: "Ludhiana Budha Nallah Industrial Discharge",
    category: "Water Quality",
    location: "Budha Nallah, Ludhiana",
    state: "Punjab",
    aqi: 112,
    status: "Under Investigation",
    date: "2026-08-07",
    roles: ["admin", "investigator", "reviewer", "authority"],
    hospitalImpact: "Skin irritation reports from downstream colonies near Sutlej.",
    authorityAction: "PPCB issued closure notice to 3 dyeing units on GT Road.",
    investigatorLog: "BOD level at 340 mg/L (safe limit 30 mg/L). Chromium traces at 0.8 ppm.",
    reporter: "Punjab Pollution Control Board (PPCB)",
    attachment: {
      name: "Budha_Nallah_Lab_Report.svg",
      type: "image/svg+xml",
      url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"><rect width="600" height="400" rx="16" fill="%23f8fafc"/><rect x="20" y="20" width="560" height="360" rx="12" fill="white" stroke="%23cbd5e1" stroke-width="2"/><rect x="20" y="20" width="560" height="60" fill="%23b45309" rx="12"/><text x="40" y="58" fill="white" font-family="sans-serif" font-size="20" font-weight="bold">WATER TOXICOLOGY LAB REPORT</text><text x="40" y="110" fill="%23b45309" font-family="sans-serif" font-size="14" font-weight="bold">Budha Nallah - Ludhiana Drain Sample</text><text x="40" y="135" fill="%23475569" font-family="sans-serif" font-size="12">BOD: 340 mg/L | Chromium: 0.8 ppm</text><rect x="40" y="310" width="200" height="40" rx="8" fill="%23fef3c7"/><text x="55" y="335" fill="%2392400e" font-family="sans-serif" font-size="12" font-weight="bold">LAB PROOF ATTACHED</text></svg>`,
      description: "PPCB water toxicology lab report for Budha Nallah drain outfall."
    }
  },
  {
    id: "REP-2026-0888",
    title: "Chembur Mahul Refinery Zone Air Alert",
    category: "Air Quality",
    location: "Mahul Village, Chembur East",
    state: "Maharashtra",
    aqi: 196,
    status: "Escalated",
    date: "2026-08-08",
    roles: ["user", "admin", "authority", "hospital", "investigator"],
    hospitalImpact: "Sion Hospital reports +15% respiratory OPD load from Mahul residents.",
    authorityAction: "MPCB ordered real-time VOC monitoring near BPCL refinery boundary.",
    investigatorLog: "Benzene at 18 ug/m3 (NAAQS limit: 5 ug/m3) near residential colony.",
    reporter: "MPCB Ambient Air Station #MH-42",
    attachment: {
      name: "Mahul_Benzene_Alert.svg",
      type: "image/svg+xml",
      url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"><rect width="600" height="400" rx="16" fill="%23f8fafc"/><rect x="20" y="20" width="560" height="360" rx="12" fill="white" stroke="%23cbd5e1" stroke-width="2"/><rect x="20" y="20" width="560" height="60" fill="%23be123c" rx="12"/><text x="40" y="58" fill="white" font-family="sans-serif" font-size="20" font-weight="bold">BENZENE ALERT - MAHUL ZONE</text><text x="40" y="110" fill="%23be123c" font-family="sans-serif" font-size="14" font-weight="bold">MPCB Station %23MH-42</text><text x="40" y="135" fill="%23475569" font-family="sans-serif" font-size="12">Benzene: 18 ug/m3 (NAAQS limit: 5 ug/m3)</text><rect x="40" y="310" width="180" height="40" rx="8" fill="%23fee2e2"/><text x="55" y="335" fill="%23991b1b" font-family="sans-serif" font-size="12" font-weight="bold">ESCALATED ALERT</text></svg>`,
      description: "MPCB ambient benzene monitoring report near BPCL refinery zone."
    }
  },
  {
    id: "REP-2026-0889",
    title: "Mithi River Plastic Debris Audit (Pre-Monsoon)",
    category: "Water Quality",
    location: "Mithi River, BKC Stretch",
    state: "Maharashtra",
    aqi: 78,
    status: "Verified",
    date: "2026-08-03",
    roles: ["user", "admin", "reviewer", "authority"],
    hospitalImpact: "No direct health impact — flood risk mitigation measure.",
    authorityAction: "BMC deployed 12 floating trash barriers before monsoon onset.",
    investigatorLog: "Removed 4.2 tonnes of plastic waste from 2 km BKC stretch.",
    reporter: "BMC Stormwater Department",
    attachment: {
      name: "Mithi_Cleanup_Report.svg",
      type: "image/svg+xml",
      url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"><rect width="600" height="400" rx="16" fill="%23f8fafc"/><rect x="20" y="20" width="560" height="360" rx="12" fill="white" stroke="%23cbd5e1" stroke-width="2"/><rect x="20" y="20" width="560" height="60" fill="%23047857" rx="12"/><text x="40" y="58" fill="white" font-family="sans-serif" font-size="20" font-weight="bold">RIVER CLEANUP AUDIT REPORT</text><text x="40" y="110" fill="%23047857" font-family="sans-serif" font-size="14" font-weight="bold">Mithi River BKC Stretch</text><text x="40" y="135" fill="%23475569" font-family="sans-serif" font-size="12">4.2 Tonnes Plastic Removed | 12 Trash Barriers</text><rect x="40" y="310" width="200" height="40" rx="8" fill="%23d1fae5"/><text x="55" y="335" fill="%23065f46" font-family="sans-serif" font-size="12" font-weight="bold">CLEANUP VERIFIED</text></svg>`,
      description: "BMC stormwater pre-monsoon river cleanup verification report."
    }
  },
  {
    id: "REP-2026-0890",
    title: "Kanpur Jajmau Tannery Effluent Discharge",
    category: "Industrial Runoff",
    location: "Jajmau Tannery Cluster, Kanpur",
    state: "Uttar Pradesh",
    aqi: 156,
    status: "Under Investigation",
    date: "2026-08-06",
    roles: ["admin", "investigator", "authority", "reviewer"],
    hospitalImpact: "Chromium-related dermatitis cases reported in downstream Shivrajpur.",
    authorityAction: "UPPCB sealed 2 tanneries for non-compliance with CETP discharge norms.",
    investigatorLog: "Hexavalent Chromium at 1.2 mg/L in drain (BIS limit: 0.05 mg/L).",
    reporter: "UPPCB Regional Office, Kanpur",
    attachment: {
      name: "Jajmau_Chromium_Report.svg",
      type: "image/svg+xml",
      url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"><rect width="600" height="400" rx="16" fill="%23f8fafc"/><rect x="20" y="20" width="560" height="360" rx="12" fill="white" stroke="%23cbd5e1" stroke-width="2"/><rect x="20" y="20" width="560" height="60" fill="%23b45309" rx="12"/><text x="40" y="58" fill="white" font-family="sans-serif" font-size="20" font-weight="bold">TANNERY EFFLUENT AUDIT</text><text x="40" y="110" fill="%23b45309" font-family="sans-serif" font-size="14" font-weight="bold">Jajmau Tannery Cluster - Kanpur</text><text x="40" y="135" fill="%23475569" font-family="sans-serif" font-size="12">Hex Chromium: 1.2 mg/L (BIS limit: 0.05 mg/L)</text><rect x="40" y="310" width="200" height="40" rx="8" fill="%23fef3c7"/><text x="55" y="335" fill="%2392400e" font-family="sans-serif" font-size="12" font-weight="bold">UNDER INVESTIGATION</text></svg>`,
      description: "UPPCB hexavalent chromium effluent discharge audit report."
    }
  },
  {
    id: "REP-2026-0891",
    title: "Lucknow Gomti Riverfront E-Waste Dump",
    category: "Landfill Safety",
    location: "Gomti Nagar, Lucknow",
    state: "Uttar Pradesh",
    aqi: 108,
    status: "Resolved",
    date: "2026-08-02",
    roles: ["user", "admin", "authority", "investigator"],
    hospitalImpact: "Lead contamination risk neutralized after cleanup.",
    authorityAction: "LMC relocated 8 tonnes of e-waste to authorized recycler.",
    investigatorLog: "Soil lead at 2.1 ppm (post-cleanup: 0.3 ppm, within safe limits).",
    reporter: "Lucknow Municipal Corporation",
    attachment: {
      name: "Gomti_EWaste_Cleanup.svg",
      type: "image/svg+xml",
      url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none"><rect width="600" height="400" rx="16" fill="%23f8fafc"/><rect x="20" y="20" width="560" height="360" rx="12" fill="white" stroke="%23cbd5e1" stroke-width="2"/><rect x="20" y="20" width="560" height="60" fill="%232563eb" rx="12"/><text x="40" y="58" fill="white" font-family="sans-serif" font-size="20" font-weight="bold">E-WASTE CLEANUP COMPLETION</text><text x="40" y="110" fill="%231d4ed8" font-family="sans-serif" font-size="14" font-weight="bold">Gomti Nagar Riverfront - Lucknow</text><text x="40" y="135" fill="%23475569" font-family="sans-serif" font-size="12">8 Tonnes E-Waste Relocated | Lead: 0.3 ppm (Safe)</text><rect x="40" y="310" width="180" height="40" rx="8" fill="%23dbeafe"/><text x="55" y="335" fill="%231e40af" font-family="sans-serif" font-size="12" font-weight="bold">CLEANUP RESOLVED</text></svg>`,
      description: "LMC e-waste riverfront cleanup completion certificate."
    }
  }
];

const ROLE_TABS = [
  { id: "all", label: "All Roles", icon: Shield },
  { id: "user", label: "User", icon: User },
  { id: "admin", label: "Admin", icon: ShieldCheck },
  { id: "authority", label: "Authority", icon: Building2 },
  { id: "hospital", label: "Hospital", icon: Stethoscope },
  { id: "investigator", label: "Investigator", icon: Search },
  { id: "reviewer", label: "Reviewer", icon: CheckCircle2 },
];

const getAQILabel = (aqi) => {
  if (aqi <= 50) return { label: "Good", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
  if (aqi <= 100) return { label: "Moderate", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" };
  if (aqi <= 150) return { label: "Unhealthy (Sensitive)", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" };
  if (aqi <= 200) return { label: "Unhealthy", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" };
  return { label: "Hazardous", color: "text-rose-900", bg: "bg-rose-100", border: "border-rose-300" };
};

const EnvironmentReports = () => {
  // Mode selection: 'advance' (Role-Aware Reports View) or 'elite' (Analytics Summary View)
  const [viewMode, setViewMode] = useState("advance");

  const [activeRoleTab, setActiveRoleTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedState, setSelectedState] = useState("all");
  
  // Lightbox Zoom Modal State
  const [previewAttachment, setPreviewAttachment] = useState(null);

  // State Filtered Dataset
  const stateReports = MOCK_ENVIRONMENT_REPORTS.filter(
    (r) => selectedState === "all" || r.state === selectedState
  );

  // Compute Elite Analytics Panel Metrics dynamically
  const totalCount = stateReports.length;
  const escalatedCount = stateReports.filter((r) => r.status === "Escalated").length;
  const investigatingCount = stateReports.filter((r) => r.status === "Under Investigation").length;
  const verifiedCount = stateReports.filter((r) => r.status === "Verified").length;
  const resolvedCount = stateReports.filter((r) => r.status === "Resolved").length;

  // Compute Hotspot (Highest AQI report)
  const topHotspot = [...stateReports].sort((a, b) => b.aqi - a.aqi)[0] || stateReports[0];

  // Compute Most Frequent Category
  const categoryCounts = {};
  stateReports.forEach((r) => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  });

  let topCategory = "N/A";
  let topCategoryCount = 0;
  Object.entries(categoryCounts).forEach(([cat, cnt]) => {
    if (cnt > topCategoryCount) {
      topCategory = cat;
      topCategoryCount = cnt;
    }
  });

  // Role + Status Filtered Dataset for the Reports List
  const filteredReports = stateReports.filter((report) => {
    const matchesRole = activeRoleTab === "all" || report.roles.includes(activeRoleTab);
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    return matchesRole && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#f0faf5] pb-24 font-sans">
      <Navbar />

      <main className="pt-32 pb-12">
        <div className="container mx-auto px-6 max-w-6xl relative">
          
          {/* Header Title */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
            <div>
              <span className="text-emerald-600 font-extrabold text-xs uppercase tracking-widest bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100 shadow-sm inline-flex items-center gap-1.5 mb-3">
                <Sparkles className="w-4 h-4 text-emerald-500" /> Environmental Governance Platform
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight uppercase">
                Environment Reports
              </h1>
              <p className="text-gray-500 font-medium text-base mt-2 max-w-2xl">
                Switch between the Role-Aware Registry and the Elite Analytics Summary using the dedicated view tabs below.
              </p>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* MASTER VIEW MODE SWITCHER BAR (SEPARATES ADVANCE & ELITE TASKS) */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <div className="bg-white p-2 rounded-3xl border border-emerald-100 shadow-sm mb-10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setViewMode("advance")}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  viewMode === "advance"
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Shield className="w-4 h-4" /> Advance Task: Role-Aware Reports View
              </button>

              <button
                onClick={() => setViewMode("elite")}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  viewMode === "elite"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-200"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <BarChart3 className="w-4 h-4" /> Elite Task: Analytics Summary Panel
              </button>
            </div>

            <span className="text-xs font-bold text-gray-400 px-4 hidden lg:block">
              {viewMode === "advance" ? "Showing Scoped Role Filter View" : "Showing Computed Hotspot & Distribution Analytics"}
            </span>
          </div>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* VIEW MODE 1: ADVANCE BOUNTY TASK (ROLE-AWARE FILTERS & LIST)   */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {viewMode === "advance" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Role Filter Tabs (Exact Match to Advance Bounty Requirements) */}
              <div className="bg-white p-3 rounded-3xl border border-emerald-100 shadow-sm">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 mb-3">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Filter className="w-4 h-4 text-emerald-500" /> Select Role Filter Tab:
                  </span>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                    Active Role Filter: <strong className="uppercase">{activeRoleTab}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {ROLE_TABS.map((tab) => {
                    const TabIcon = tab.icon;
                    const isActive = activeRoleTab === tab.id;
                    const count = tab.id === "all"
                      ? MOCK_ENVIRONMENT_REPORTS.length
                      : MOCK_ENVIRONMENT_REPORTS.filter((r) => r.roles.includes(tab.id)).length;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveRoleTab(tab.id)}
                        className={`flex flex-col items-center justify-center p-3.5 rounded-2xl transition-all duration-300 font-bold ${
                          isActive
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-105"
                            : "bg-gray-50 hover:bg-emerald-50/50 text-gray-600 hover:text-emerald-700 border border-gray-100"
                        }`}
                      >
                        <TabIcon className={`w-5 h-5 mb-1.5 ${isActive ? "text-white" : "text-emerald-500"}`} />
                        <span className="text-xs uppercase tracking-wider">{tab.label}</span>
                        <span className={`text-[10px] mt-1 px-2 py-0.5 rounded-full ${
                          isActive ? "bg-white/25 text-white" : "bg-gray-200/80 text-gray-600"
                        }`}>
                          {count} {count === 1 ? "report" : "reports"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Filter & Visible Count Indicator */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-emerald-100 shadow-sm">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Status Filter:</span>
                  {["all", "Verified", "Under Investigation", "Escalated", "Resolved"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        statusFilter === st
                          ? "bg-gray-900 text-white shadow-sm"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {st === "all" ? "All Statuses" : st}
                    </button>
                  ))}
                </div>

                <div className="px-4 py-2 bg-emerald-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md shadow-emerald-200 shrink-0">
                  Visible Count: {filteredReports.length} of {MOCK_ENVIRONMENT_REPORTS.length} Reports
                </div>
              </div>

              {/* Scoped Report Cards List */}
              {filteredReports.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-sm">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-bounce" />
                  <h3 className="text-lg font-bold text-gray-700">No Scoped Reports Found</h3>
                  <p className="text-gray-400 text-sm mt-1">No environment reports match the role "{activeRoleTab}" and status "{statusFilter}".</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredReports.map((report) => {
                    const { label: aqiLabel, color: aqiColor, bg: aqiBg, border: aqiBorder } = getAQILabel(report.aqi);

                    const statusStyle =
                      report.status === "Escalated"
                        ? "bg-rose-100 text-rose-800 border-rose-200"
                        : report.status === "Under Investigation"
                        ? "bg-amber-100 text-amber-800 border-amber-200"
                        : report.status === "Resolved"
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : "bg-emerald-100 text-emerald-800 border-emerald-200";

                    return (
                      <div
                        key={report.id}
                        className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">
                              {report.id}
                            </span>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-xl">
                              {report.category}
                            </span>
                            <span className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-xl border ${statusStyle}`}>
                              {report.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 font-bold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {report.date}
                            </span>
                            <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-xl border ${aqiBg} ${aqiColor} ${aqiBorder}`}>
                              AQI {report.aqi} — {aqiLabel}
                            </span>
                          </div>
                        </div>

                        {/* Report Title */}
                        <div className="mb-6">
                          <h3 className="text-xl font-extrabold text-gray-900 tracking-tight group-hover:text-emerald-600 transition-colors">
                            {report.title}
                          </h3>
                          <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {report.location} • Source: <strong className="text-gray-700">{report.reporter}</strong>
                          </p>
                        </div>

                        {/* Operational Insights */}
                        <div className="grid md:grid-cols-3 gap-4 mb-6 bg-gray-50/70 p-5 rounded-2xl border border-gray-100">
                          <div className="p-3 bg-white rounded-xl border border-gray-100">
                            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                              <Stethoscope className="w-3.5 h-3.5" /> Medical Health Exposure
                            </p>
                            <p className="text-xs font-semibold text-gray-700 leading-relaxed">{report.hospitalImpact}</p>
                          </div>

                          <div className="p-3 bg-white rounded-xl border border-gray-100">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                              <Building2 className="w-3.5 h-3.5" /> Authority Action
                            </p>
                            <p className="text-xs font-semibold text-gray-700 leading-relaxed">{report.authorityAction}</p>
                          </div>

                          <div className="p-3 bg-white rounded-xl border border-gray-100">
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                              <Search className="w-3.5 h-3.5" /> Investigator Log
                            </p>
                            <p className="text-xs font-semibold text-gray-700 leading-relaxed">{report.investigatorLog}</p>
                          </div>
                        </div>

                        {/* Core Bounty Attachment Preview */}
                        {report.attachment && (
                          <div className="mb-6 bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                                <Paperclip className="w-3.5 h-3.5 text-emerald-600" /> Evidence Audit Attachment
                              </p>
                              <span className="text-[10px] font-bold text-emerald-600 bg-white px-2 py-0.5 rounded-md border border-emerald-100">
                                Verified Proof
                              </span>
                            </div>

                            <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-emerald-100">
                              <div
                                onClick={() => setPreviewAttachment(report.attachment)}
                                className="relative group w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-emerald-200 cursor-pointer bg-gray-50 flex items-center justify-center"
                              >
                                <img
                                  src={report.attachment.url}
                                  alt="Attached Evidence"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-emerald-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ZoomIn className="w-5 h-5 text-white" />
                                </div>
                              </div>

                              <div className="min-w-0 flex-1">
                                <button
                                  onClick={() => setPreviewAttachment(report.attachment)}
                                  className="text-xs font-bold text-gray-800 hover:text-emerald-600 truncate text-left block w-full transition-colors"
                                >
                                  {report.attachment.name}
                                </button>
                                <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                                  {report.attachment.description}
                                </p>
                              </div>

                              <button
                                onClick={() => setPreviewAttachment(report.attachment)}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-sm"
                              >
                                Zoom Preview
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Authorized Scopes */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-50 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Scoped Roles:</span>
                            {report.roles.map((r) => (
                              <span
                                key={r}
                                className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                                  activeRoleTab === r
                                    ? "bg-emerald-500 text-white shadow-sm"
                                    : "bg-gray-200/70 text-gray-700"
                                }`}
                              >
                                {r}
                              </span>
                            ))}
                          </div>

                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <Eye className="w-4 h-4" /> Role Scoped
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* VIEW MODE 2: ELITE BOUNTY TASK (INSIGHT ANALYTICS SUMMARY)     */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {viewMode === "elite" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* State Selector for Filtered View */}
              <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-purple-100 shadow-sm">
                <div>
                  <h3 className="text-sm font-black text-purple-900 uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-600" /> State-Wise Environment Data
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">Select a state to view its environment reports and analytics</p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-purple-50 text-purple-800 border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none cursor-pointer transition-all appearance-none min-w-[200px]"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%237c3aed' stroke-width='2' fill='none'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                  >
                    <option value="all">🇮🇳 All States</option>
                    <option value="Delhi">📍 Delhi</option>
                    <option value="Punjab">📍 Punjab</option>
                    <option value="Maharashtra">📍 Maharashtra</option>
                    <option value="Uttar Pradesh">📍 Uttar Pradesh</option>
                  </select>
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
                    {totalCount} reports
                  </span>
                </div>
              </div>

              {/* 1. Metric Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                      <BarChart3 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Total Tracked
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Environment Reports</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-black text-gray-900">{totalCount}</span>
                    <span className="text-xs text-gray-500 font-semibold">records</span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-100">
                      <Flame className="w-6 h-6 text-rose-600" />
                    </div>
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Immediate Action
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Critical Escalations</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-black text-rose-600">{escalatedCount}</span>
                    <span className="text-xs text-rose-400 font-semibold">high severity</span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100">
                      <Search className="w-6 h-6 text-amber-600" />
                    </div>
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      In Progress
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Under Investigation</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-black text-amber-600">{investigatingCount}</span>
                    <span className="text-xs text-amber-500 font-semibold">audits active</span>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
                      <CheckCircle2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Completed
                    </span>
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Verified & Resolved</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-black text-blue-600">{verifiedCount + resolvedCount}</span>
                    <span className="text-xs text-blue-400 font-semibold">settled issues</span>
                  </div>
                </div>

              </div>

              {/* 2. Hotspot & Top Category Highlight Callouts */}
              <div className="grid md:grid-cols-2 gap-6">
                
                <div className="bg-gradient-to-br from-rose-900 to-rose-950 rounded-3xl p-7 text-white shadow-xl relative overflow-hidden border border-rose-800">
                  <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <Flame size={180} className="text-rose-400" />
                  </div>
                  <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-300 bg-rose-500/20 px-3 py-1 rounded-full border border-rose-500/30 inline-flex items-center gap-1 mb-4">
                      <Flame className="w-3.5 h-3.5 text-rose-400" /> Primary Environmental Hotspot Callout
                    </span>

                    <h3 className="text-2xl font-black tracking-tight text-white mb-2">
                      {topHotspot ? topHotspot.title : "Severe Zone Detected"}
                    </h3>
                    
                    <p className="text-xs text-rose-200 font-medium mb-5 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-400" /> {topHotspot?.location} • Peak Severe Level: <strong className="text-white font-extrabold">{topHotspot?.aqi} AQI</strong>
                    </p>

                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest">Investigator Assessment</p>
                        <p className="text-xs font-semibold text-white mt-0.5">{topHotspot?.investigatorLog}</p>
                      </div>
                      <span className="px-3 py-1 rounded-xl bg-rose-500 text-white text-xs font-black uppercase tracking-wider shrink-0 ml-3">
                        High Priority
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-900 to-indigo-950 rounded-3xl p-7 text-white shadow-xl relative overflow-hidden border border-purple-800">
                  <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <Activity size={180} className="text-purple-400" />
                  </div>
                  <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30 inline-flex items-center gap-1 mb-4">
                      <TrendingUp className="w-3.5 h-3.5 text-purple-400" /> Most Frequent Advisory Callout
                    </span>

                    <h3 className="text-2xl font-black tracking-tight text-white mb-2">
                      {topCategory} Incidents
                    </h3>
                    
                    <p className="text-xs text-purple-200 font-medium mb-5">
                      Constitutes <strong className="text-white font-extrabold">{topCategoryCount} active reports</strong> ({Math.round((topCategoryCount / totalCount) * 100)}% of total state dataset).
                    </p>

                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Recommended Municipal Protocol</p>
                        <p className="text-xs font-semibold text-white mt-0.5">Deploy automated continuous air & water chemical sensors.</p>
                      </div>
                      <span className="px-3 py-1 rounded-xl bg-purple-500 text-white text-xs font-black uppercase tracking-wider shrink-0 ml-3">
                        Dominant Risk
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* 3. Visual Computed Counts Breakdown Progress Bars */}
              <div className="bg-white rounded-3xl p-8 border border-purple-100 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                      <Layers className="w-5 h-5 text-purple-600" /> Computed Distribution by Category & Status
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Automated distribution analytics computed from seeded project records</p>
                  </div>
                  <span className="text-xs font-extrabold text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
                    {totalCount} Total Incidents Summarized
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  
                  <div className="space-y-4">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Distribution by Category</p>
                    {Object.entries(categoryCounts).map(([cat, count]) => {
                      const pct = Math.round((count / totalCount) * 100);
                      return (
                        <div key={cat} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                            <span>{cat}</span>
                            <span className="text-purple-600">{count} {count === 1 ? "report" : "reports"} ({pct}%)</span>
                          </div>
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-600 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Distribution by Status</p>
                    {[
                      { label: "Escalated", count: escalatedCount, color: "bg-rose-500", text: "text-rose-600" },
                      { label: "Under Investigation", count: investigatingCount, color: "bg-amber-500", text: "text-amber-600" },
                      { label: "Verified", count: verifiedCount, color: "bg-emerald-500", text: "text-emerald-600" },
                      { label: "Resolved", count: resolvedCount, color: "bg-blue-500", text: "text-blue-600" },
                    ].map(({ label, count, color, text }) => {
                      const pct = Math.round((count / totalCount) * 100) || 0;
                      return (
                        <div key={label} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                            <span>{label}</span>
                            <span className={text}>{count} {count === 1 ? "report" : "reports"} ({pct}%)</span>
                          </div>
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${color} rounded-full transition-all duration-500`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* Fullscreen Lightbox Zoom Modal for Attachments (Core Bounty Task) */}
          {previewAttachment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in duration-300">
              <div className="absolute inset-0 cursor-pointer" onClick={() => setPreviewAttachment(null)} />
              <div className="relative max-w-4xl max-h-[85vh] bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col z-10 animate-in zoom-in-95 duration-300 w-full mx-4">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                  <div className="min-w-0">
                    <h4 className="text-base font-black text-gray-800 truncate">{previewAttachment.name}</h4>
                    <p className="text-xs text-emerald-600 font-medium italic mt-0.5">{previewAttachment.description}</p>
                  </div>
                  <button
                    onClick={() => setPreviewAttachment(null)}
                    className="h-10 w-10 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full flex items-center justify-center"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-6 min-h-[350px]">
                  <img
                    src={previewAttachment.url}
                    alt="Full Evidence Audit Certificate"
                    className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-md border border-gray-200"
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EnvironmentReports;
