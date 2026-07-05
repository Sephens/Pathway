import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  LayoutDashboard, Kanban, Calendar as CalendarIcon, Mail, FileText, Building2,
  Users, FolderOpen, Bookmark, Settings, Search, Plus, Moon, Sun, X, ChevronLeft,
  ChevronRight, MoreHorizontal, Star, Trash2, Edit3, Check, Clock, MapPin,
  DollarSign, Link as LinkIcon, Phone, ExternalLink, Sparkles, Download, Upload,
  Tag as TagIcon, ListChecks, MessageSquare, History, Paperclip, Menu, ArrowUpRight,
  TrendingUp, Briefcase, CircleDot, AlertCircle, ChevronDown, Copy, Send, Loader2,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import { supabase, supabaseConfigured } from "./lib/supabaseClient";
import Auth from "./Auth.jsx";

const CLOUD_TABLE = "job_tracker_data";
const DOCS_BUCKET = "documents";

/* ============================================================================
   DESIGN TOKENS
   Palette: cool neutral base + indigo signature accent (deliberately distinct
   from the terracotta/cream and near-black/acid-green defaults). A warm
   amber and a calm emerald carry status meaning (pending / positive).
   Type: "Space Grotesk" for numerals & headings (a career "scoreboard" feel),
   "Inter" for UI/body text, legible at dense table sizes.
   Signature: the vertical "stage rail" on every card + the hand-drawn-style
   progress ring on the dashboard hero.
============================================================================ */

const CSS_VARS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

  .jat-root {
    --bg: #F6F6F9;
    --surface: #FFFFFF;
    --surface-2: #FBFBFD;
    --border: #E7E7EF;
    --border-strong: #D9D9E6;
    --text: #14151E;
    --text-2: #6C6E7D;
    --text-3: #9799A6;
    --accent: #5B5FEF;
    --accent-soft: #EEEEFD;
    --accent-strong: #4145C7;
    --success: #1FA971;
    --success-soft: #E7F8F0;
    --warning: #E29A2E;
    --warning-soft: #FCF1DF;
    --danger: #E15A52;
    --danger-soft: #FBEAE8;
    --info: #3B82C4;
    --info-soft: #E9F2FA;
    --shadow-sm: 0 1px 2px rgba(20,21,30,0.05);
    --shadow-md: 0 4px 16px rgba(20,21,30,0.08);
    --shadow-lg: 0 12px 32px rgba(20,21,30,0.14);
    --radius: 12px;
    --radius-sm: 8px;
    --font-display: 'Space Grotesk', 'Inter', sans-serif;
    --font-body: 'Inter', sans-serif;
    color-scheme: light;
  }
  .jat-root[data-theme="dark"] {
    --bg: #0B0C10;
    --surface: #15161C;
    --surface-2: #1B1C23;
    --border: #262730;
    --border-strong: #33343E;
    --text: #F1F1F6;
    --text-2: #9A9CAA;
    --text-3: #6E7080;
    --accent: #7B7FFA;
    --accent-soft: #23234A;
    --accent-strong: #9EA1FC;
    --success: #34C98B;
    --success-soft: #12291F;
    --warning: #F0B04E;
    --warning-soft: #302311;
    --danger: #F0776E;
    --danger-soft: #331715;
    --info: #5FA6E0;
    --info-soft: #142330;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
    --shadow-md: 0 4px 20px rgba(0,0,0,0.4);
    --shadow-lg: 0 16px 40px rgba(0,0,0,0.5);
    color-scheme: dark;
  }

  .jat-root {
    font-family: var(--font-body);
    background: var(--bg);
    color: var(--text);
    width: 100%;
    min-height: 100vh;
    display: flex;
    position: relative;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }
  .jat-root * { box-sizing: border-box; }
  .jat-root ::selection { background: var(--accent); color: #fff; }
  .jat-root button { font-family: inherit; cursor: pointer; }
  .jat-root input, .jat-root textarea, .jat-root select {
    font-family: inherit; background: var(--surface-2); border: 1px solid var(--border);
    color: var(--text); border-radius: var(--radius-sm); padding: 9px 12px; font-size: 13.5px;
    outline: none; transition: border-color .15s ease, box-shadow .15s ease;
    width: 100%;
  }
  .jat-root input:focus, .jat-root textarea:focus, .jat-root select:focus {
    border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft);
  }
  .jat-root button:focus-visible, .jat-root [tabindex]:focus-visible, .jat-root a:focus-visible {
    outline: 2px solid var(--accent); outline-offset: 2px;
  }
  .jat-root ::-webkit-scrollbar { width: 8px; height: 8px; }
  .jat-root ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 8px; }
  .jat-root ::-webkit-scrollbar-track { background: transparent; }

  @media (prefers-reduced-motion: reduce) {
    .jat-root * { animation: none !important; transition: none !important; }
  }

  .jat-fade-in { animation: jatFadeIn .28s ease both; }
  @keyframes jatFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
  .jat-pop { animation: jatPop .18s cubic-bezier(.2,.9,.3,1.2) both; }
  @keyframes jatPop { from { opacity:0; transform: scale(.96); } to { opacity:1; transform: scale(1);} }

  .jat-scrollbar-thin::-webkit-scrollbar { width: 6px; height:6px; }

  /* Sidebar */
  .jat-sidebar {
    width: 232px; flex-shrink: 0; background: var(--surface); border-right: 1px solid var(--border);
    display: flex; flex-direction: column; height: 100vh; position: sticky; top: 0;
    transition: transform .25s ease, width .25s ease; z-index: 40;
  }
  .jat-logo { display:flex; align-items:center; gap:10px; padding: 18px 16px 14px 18px; }
  .jat-logo-mark {
    width: 30px; height: 30px; border-radius: 9px; flex-shrink:0;
    background: linear-gradient(135deg, var(--accent), #9C6BFF);
    display:flex; align-items:center; justify-content:center; box-shadow: var(--shadow-sm);
  }
  .jat-logo-text { font-family: var(--font-display); font-weight: 700; font-size: 15.5px; letter-spacing: -0.01em; }
  .jat-nav { padding: 6px 10px; display:flex; flex-direction:column; gap: 2px; flex:1; overflow-y:auto; }
  .jat-nav-group-label { font-size: 10.5px; text-transform: uppercase; letter-spacing: .06em; color: var(--text-3); padding: 14px 10px 6px; font-weight: 600; }
  .jat-nav-item {
    display:flex; align-items:center; gap:10px; padding: 8px 10px; border-radius: 8px; border:none;
    background: transparent; color: var(--text-2); font-size: 13.5px; font-weight: 500; text-align:left;
    transition: background .12s ease, color .12s ease; position: relative; width:100%;
  }
  .jat-nav-item:hover { background: var(--surface-2); color: var(--text); }
  .jat-nav-item.active { background: var(--accent-soft); color: var(--accent-strong); font-weight: 600; }
  .jat-nav-item .jat-count { margin-left:auto; font-size:11px; color: var(--text-3); background: var(--surface-2); padding:1px 7px; border-radius:20px; }
  .jat-nav-item.active .jat-count { color: var(--accent-strong); background: rgba(255,255,255,0.5); }
  .jat-root[data-theme="dark"] .jat-nav-item.active .jat-count { background: rgba(255,255,255,0.08); }

  .jat-sidebar-foot { padding: 12px; border-top: 1px solid var(--border); }
  .jat-theme-toggle {
    display:flex; align-items:center; gap:8px; width:100%; padding:8px 10px; border-radius:8px;
    border:1px solid var(--border); background: var(--surface-2); color: var(--text-2); font-size:13px; font-weight:500;
  }
  .jat-theme-toggle:hover { color: var(--text); border-color: var(--border-strong); }

  /* Main */
  .jat-main { flex:1; min-width:0; display:flex; flex-direction:column; height:100vh; overflow:hidden; }
  .jat-topbar {
    height: 62px; flex-shrink:0; border-bottom:1px solid var(--border); display:flex; align-items:center;
    gap: 12px; padding: 0 22px; background: var(--surface);
  }
  .jat-search { position:relative; max-width: 360px; flex:1; }
  .jat-search svg { position:absolute; left:11px; top:50%; transform:translateY(-50%); color: var(--text-3); }
  .jat-search input { padding-left: 34px; background: var(--surface-2); }
  .jat-content { flex:1; overflow-y:auto; padding: 24px 28px 60px; }

  .jat-btn {
    display:inline-flex; align-items:center; gap:7px; padding: 8px 14px; border-radius: 9px;
    font-size: 13.5px; font-weight: 600; border: 1px solid transparent; transition: all .13s ease; white-space:nowrap;
  }
  .jat-btn-primary { background: var(--accent); color: #fff; box-shadow: var(--shadow-sm); }
  .jat-btn-primary:hover { background: var(--accent-strong); transform: translateY(-1px); box-shadow: var(--shadow-md); }
  .jat-btn-ghost { background: transparent; color: var(--text-2); border-color: var(--border); }
  .jat-btn-ghost:hover { color: var(--text); border-color: var(--border-strong); background: var(--surface-2); }
  .jat-btn-soft { background: var(--surface-2); color: var(--text); border-color: var(--border); }
  .jat-btn-soft:hover { border-color: var(--border-strong); }
  .jat-btn-danger { background: var(--danger-soft); color: var(--danger); }
  .jat-btn-danger:hover { filter: brightness(0.95); }
  .jat-btn-icon { padding: 7px; border-radius: 8px; background: transparent; border:1px solid transparent; color: var(--text-2); display:flex; }
  .jat-btn-icon:hover { background: var(--surface-2); color: var(--text); }
  .jat-btn:disabled { opacity:.5; cursor:not-allowed; transform:none !important; }

  .jat-page-head { display:flex; align-items:flex-start; justify-content:space-between; gap: 16px; margin-bottom: 22px; flex-wrap:wrap; }
  .jat-page-title { font-family: var(--font-display); font-size: 24px; font-weight: 700; letter-spacing:-0.015em; }
  .jat-page-sub { color: var(--text-2); font-size: 13.5px; margin-top: 3px; }

  .jat-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
  }

  /* Stat cards */
  .jat-stats-grid { display:grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
  .jat-stat-card { padding: 16px 18px; display:flex; flex-direction:column; gap: 8px; }
  .jat-stat-top { display:flex; align-items:center; justify-content:space-between; }
  .jat-stat-icon { width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; }
  .jat-stat-value { font-family: var(--font-display); font-size: 26px; font-weight:700; letter-spacing:-0.02em; }
  .jat-stat-label { font-size: 12.5px; color: var(--text-2); font-weight:500; }
  .jat-stat-delta { font-size:11.5px; font-weight:600; display:flex; align-items:center; gap:3px; }

  .jat-dash-grid { display:grid; grid-template-columns: 1.3fr 1fr; gap: 16px; margin-bottom: 16px; }
  .jat-panel { padding: 18px 20px; }
  .jat-panel-title { font-family: var(--font-display); font-weight:600; font-size:15px; margin-bottom: 2px; }
  .jat-panel-sub { font-size:12px; color: var(--text-3); margin-bottom: 14px; }

  /* Progress ring */
  .jat-ring-wrap { display:flex; align-items:center; gap: 22px; }
  .jat-ring-stats { display:flex; flex-direction:column; gap:10px; flex:1; }
  .jat-ring-row { display:flex; align-items:center; justify-content:space-between; font-size:13px; }
  .jat-ring-dot { width:8px; height:8px; border-radius:50%; display:inline-block; margin-right:8px; }

  /* Kanban */
  .jat-board { display:flex; gap: 14px; overflow-x:auto; padding-bottom: 10px; align-items:flex-start; }
  .jat-column { min-width: 268px; width:268px; flex-shrink:0; background: var(--surface-2); border:1px solid var(--border); border-radius: var(--radius); display:flex; flex-direction:column; max-height: calc(100vh - 230px); }
  .jat-column.drag-over { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
  .jat-column-head { padding: 12px 12px 8px; display:flex; align-items:center; gap:8px; }
  .jat-column-dot { width:9px; height:9px; border-radius:3px; flex-shrink:0; }
  .jat-column-title { font-weight:600; font-size:13px; flex:1; }
  .jat-column-count { font-size:11.5px; color: var(--text-3); background: var(--surface); border:1px solid var(--border); padding: 1px 7px; border-radius:20px; }
  .jat-column-body { padding: 4px 10px 10px; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap: 8px; }
  .jat-column-add { margin: 0 10px 10px; }

  .jat-app-card {
    background: var(--surface); border:1px solid var(--border); border-radius: 10px; padding: 12px 12px 12px 14px;
    cursor: grab; position:relative; overflow:hidden; transition: box-shadow .15s ease, transform .1s ease; box-shadow: var(--shadow-sm);
  }
  .jat-app-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
  .jat-app-card:active { cursor: grabbing; }
  .jat-app-card::before { content:""; position:absolute; left:0; top:0; bottom:0; width:4px; }
  .jat-app-card-role { font-weight:600; font-size:13.5px; margin-bottom:2px; padding-right: 20px; }
  .jat-app-card-company { font-size:12px; color: var(--text-2); display:flex; align-items:center; gap:5px; margin-bottom:8px; }
  .jat-app-card-meta { display:flex; align-items:center; justify-content:space-between; margin-top:8px; }
  .jat-tag-row { display:flex; gap:5px; flex-wrap:wrap; }
  .jat-tag { font-size: 10.5px; font-weight:600; padding: 2px 7px; border-radius: 20px; }
  .jat-priority-star { color: var(--warning); }
  .jat-avatar-date { font-size:11px; color: var(--text-3); display:flex; align-items:center; gap:4px; }

  /* List/table */
  .jat-table-wrap { overflow-x:auto; }
  .jat-table { width:100%; border-collapse: collapse; font-size: 13px; }
  .jat-table th { text-align:left; font-size: 11px; text-transform:uppercase; letter-spacing:.05em; color: var(--text-3); font-weight:600; padding: 10px 14px; border-bottom: 1px solid var(--border); white-space:nowrap; }
  .jat-table td { padding: 12px 14px; border-bottom: 1px solid var(--border); vertical-align:middle; }
  .jat-table tr:last-child td { border-bottom:none; }
  .jat-table tr.jat-row-hover:hover { background: var(--surface-2); cursor:pointer; }

  .jat-badge { display:inline-flex; align-items:center; gap:5px; font-size:11.5px; font-weight:600; padding: 3px 9px; border-radius: 20px; white-space:nowrap; }
  .jat-filter-bar { display:flex; align-items:center; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
  .jat-chip { display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:20px; border:1px solid var(--border); background: var(--surface); font-size:12.5px; font-weight:500; color: var(--text-2); }
  .jat-chip.active { background: var(--accent-soft); color: var(--accent-strong); border-color: transparent; }
  .jat-viewtoggle { display:flex; border:1px solid var(--border); border-radius:9px; overflow:hidden; }
  .jat-viewtoggle button { padding:7px 12px; background: var(--surface); color: var(--text-2); border:none; font-size:12.5px; font-weight:600; }
  .jat-viewtoggle button.active { background: var(--accent-soft); color: var(--accent-strong); }

  /* Modal */
  .jat-modal-overlay { position:fixed; inset:0; background: rgba(10,10,15,0.5); backdrop-filter: blur(2px); display:flex; align-items:center; justify-content:center; z-index: 200; padding: 24px; }
  .jat-modal { background: var(--surface); border-radius: 16px; width: 100%; box-shadow: var(--shadow-lg); border: 1px solid var(--border); max-height: 90vh; display:flex; flex-direction:column; }
  .jat-modal-sm { max-width: 460px; }
  .jat-modal-md { max-width: 640px; }
  .jat-modal-lg { max-width: 880px; }
  .jat-modal-head { display:flex; align-items:center; justify-content:space-between; padding: 18px 22px; border-bottom:1px solid var(--border); flex-shrink:0; }
  .jat-modal-title { font-family: var(--font-display); font-weight:700; font-size:17px; }
  .jat-modal-body { padding: 20px 22px; overflow-y:auto; }
  .jat-modal-foot { padding: 14px 22px; border-top:1px solid var(--border); display:flex; justify-content:flex-end; gap:10px; flex-shrink:0; }

  .jat-field { margin-bottom: 14px; }
  .jat-field label { display:block; font-size:12px; font-weight:600; color: var(--text-2); margin-bottom:6px; }
  .jat-field-row { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .jat-tabs { display:flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: 16px; }
  .jat-tab { padding: 9px 4px; margin-right: 18px; font-size:13px; font-weight:600; color: var(--text-3); border-bottom: 2px solid transparent; background:none; border-top:none; border-left:none; border-right:none; }
  .jat-tab.active { color: var(--text); border-color: var(--accent); }

  .jat-empty { text-align:center; padding: 50px 20px; color: var(--text-3); }
  .jat-empty svg { margin-bottom: 10px; opacity: .5; }
  .jat-empty-title { font-weight:600; color: var(--text-2); font-size: 14px; margin-bottom: 4px; }

  .jat-timeline-item { display:flex; gap:12px; position:relative; padding-bottom: 18px; }
  .jat-timeline-item:last-child { padding-bottom:0; }
  .jat-timeline-item::before { content:""; position:absolute; left:5px; top: 18px; bottom:-4px; width:1px; background: var(--border); }
  .jat-timeline-item:last-child::before { display:none; }
  .jat-timeline-dot { width:11px; height:11px; border-radius:50%; background: var(--accent); flex-shrink:0; margin-top:3px; box-shadow: 0 0 0 3px var(--accent-soft); }

  .jat-task-row { display:flex; align-items:center; gap:10px; padding: 8px 0; border-bottom: 1px solid var(--border); }
  .jat-task-row:last-child { border-bottom:none; }
  .jat-checkbox { width:18px; height:18px; border-radius:5px; border:1.5px solid var(--border-strong); flex-shrink:0; display:flex; align-items:center; justify-content:center; background: var(--surface-2); }
  .jat-checkbox.checked { background: var(--accent); border-color: var(--accent); color:#fff; }

  .jat-contact-card, .jat-doc-card, .jat-company-card, .jat-template-card { padding: 16px; }
  .jat-avatar { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:700; font-family: var(--font-display); color:#fff; flex-shrink:0; font-size:14px; }

  .jat-cal-grid { display:grid; grid-template-columns: repeat(7, 1fr); gap:1px; background: var(--border); border:1px solid var(--border); border-radius: var(--radius); overflow:hidden; }
  .jat-cal-headcell { background: var(--surface-2); padding: 8px; text-align:center; font-size:11px; font-weight:700; color: var(--text-3); text-transform:uppercase; letter-spacing:.05em; }
  .jat-cal-cell { background: var(--surface); min-height: 108px; padding: 6px; display:flex; flex-direction:column; gap:3px; }
  .jat-cal-cell.other-month { background: var(--surface-2); }
  .jat-cal-cell.today .jat-cal-daynum { background: var(--accent); color:#fff; }
  .jat-cal-daynum { font-size:11.5px; font-weight:600; width:20px; height:20px; display:flex; align-items:center; justify-content:center; border-radius:6px; color: var(--text-2); }
  .jat-cal-event { font-size:10.5px; padding: 2px 6px; border-radius:5px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer; }

  .jat-grid-3 { display:grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .jat-grid-2 { display:grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }

  .jat-ai-box { border: 1px dashed var(--border-strong); border-radius: var(--radius-sm); padding: 14px; background: var(--accent-soft); }
  .jat-ai-result { background: var(--surface-2); border:1px solid var(--border); border-radius: var(--radius-sm); padding: 14px; font-size: 13px; line-height:1.6; white-space: pre-wrap; margin-top: 10px; max-height: 320px; overflow-y:auto; }

  .jat-templates-layout { display:grid; grid-template-columns: 260px 1fr; gap: 16px; }
  .jat-btn-label { display:inline; }
  .jat-cal-head-full { display:inline; }
  .jat-cal-head-short { display:none; }
  .jat-mobile-menu-btn { display:none; }

  .jat-tabs { overflow-x:auto; flex-wrap:nowrap; -webkit-overflow-scrolling:touch; }
  .jat-tabs::-webkit-scrollbar { height:0; }
  .jat-tab { flex-shrink:0; }

  .jat-board { scroll-snap-type: x proximity; -webkit-overflow-scrolling: touch; }
  .jat-column { scroll-snap-align: start; }

  @media (max-width: 980px) {
    .jat-stats-grid { grid-template-columns: repeat(2,1fr); }
    .jat-dash-grid { grid-template-columns: 1fr; }
    .jat-grid-3 { grid-template-columns: repeat(2,1fr); }
    .jat-field-row { grid-template-columns: 1fr; }
    .jat-templates-layout { grid-template-columns: 220px 1fr; }
  }

  @media (max-width: 780px) {
    .jat-templates-layout { grid-template-columns: 1fr; }
  }

  @media (max-width: 720px) {
    .jat-sidebar { position: fixed; left:0; top:0; transform: translateX(-100%); box-shadow: var(--shadow-lg); }
    .jat-sidebar.open { transform: translateX(0); }
    .jat-mobile-menu-btn { display:flex; }
    .jat-stats-grid { grid-template-columns: 1fr 1fr; }
    .jat-grid-3, .jat-grid-2 { grid-template-columns: 1fr; }
    .jat-content { padding: 16px; }
    .jat-topbar { padding: 0 12px; gap: 8px; }
    .jat-search { display:none; }
    .jat-page-title { font-size: 20px; }
    .jat-page-head { gap: 10px; }
    .jat-modal-overlay { padding: 14px; }
    .jat-modal-head, .jat-modal-body, .jat-modal-foot { padding-left: 16px; padding-right: 16px; }
    .jat-column { min-width: 82vw; width: 82vw; }
    .jat-btn, .jat-btn-icon { min-height: 38px; }
  }

  @media (max-width: 640px) {
    .jat-btn-label { display:none; }
    .jat-btn-label-primary { display:inline; }
    .jat-btn { padding: 8px 11px; }
    .jat-cal-head-full { display:none; }
    .jat-cal-head-short { display:inline; }
    .jat-cal-cell { min-height: 64px; padding: 4px; }
    .jat-cal-event { font-size: 9.5px; padding: 1px 4px; }
    .jat-cal-daynum { width:18px; height:18px; font-size:11px; }
  }

  @media (max-width: 480px) {
    .jat-stats-grid { grid-template-columns: 1fr; }
    .jat-stat-value { font-size: 22px; }
    .jat-page-title { font-size: 18px; }
    .jat-btn-label-primary { display:none; }
    .jat-topbar { gap: 6px; }
    .jat-column { min-width: 88vw; width: 88vw; }
    .jat-panel, .jat-stat-card, .jat-contact-card, .jat-doc-card, .jat-company-card { padding: 14px; }
    .jat-content { padding: 12px; }
    .jat-cal-cell { min-height: 52px; }
    .jat-cal-event:nth-child(n+3) { display:none; }
    .jat-modal-overlay { padding: 0; align-items: flex-end; }
    .jat-modal { border-radius: 16px 16px 0 0; max-height: 94vh; }
    .jat-filter-bar { gap: 6px; }
    .jat-chip { padding: 5px 10px; font-size: 12px; }
    .jat-ring-wrap { flex-direction: column; align-items: flex-start; gap: 16px; }
    .jat-ring-wrap > div:first-child { align-self: center; }
  }

  @media (hover: none) and (pointer: coarse) {
    .jat-app-card { cursor: default; }
    .jat-nav-item, .jat-btn, .jat-btn-icon, .jat-chip, .jat-viewtoggle button { min-height: 38px; }
  }
`;

/* ============================================================================
   CONSTANTS
============================================================================ */

const STAGES = [
  { key: "saved", label: "Saved", color: "#9799A6" },
  { key: "applied", label: "Applied", color: "#3B82C4" },
  { key: "interviewing", label: "Interviewing", color: "#5B5FEF" },
  { key: "assessment", label: "Assessment", color: "#E29A2E" },
  { key: "offer", label: "Offer", color: "#1FA971" },
  { key: "accepted", label: "Accepted", color: "#0E8F5B" },
  { key: "rejected", label: "Rejected", color: "#E15A52" },
];

const TAG_PALETTE = ["#5B5FEF", "#1FA971", "#E29A2E", "#3B82C4", "#E15A52", "#9C6BFF", "#2FB6B0"];
const tagColor = (tag) => {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = tag.charCodeAt(i) + ((h << 5) - h);
  return TAG_PALETTE[Math.abs(h) % TAG_PALETTE.length];
};
const AVATAR_COLORS = ["#5B5FEF", "#E29A2E", "#1FA971", "#3B82C4", "#E15A52", "#9C6BFF"];
const avatarColor = (name) => AVATAR_COLORS[Math.abs([...name].reduce((a, c) => a + c.charCodeAt(0), 0)) % AVATAR_COLORS.length];
const initials = (name) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const fmtDate = (iso) => { if (!iso) return "—"; const d = new Date(iso + "T00:00:00"); return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); };
const fmtDateShort = (iso) => { if (!iso) return "—"; const d = new Date(iso + "T00:00:00"); return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }); };
const stageInfo = (key) => STAGES.find((s) => s.key === key) || STAGES[0];

/* ============================================================================
   SEED DATA
============================================================================ */

const seedApplications = () => [
  {
    id: "a1", company: "Nimbus Analytics", role: "Senior Data Scientist", stage: "interviewing",
    location: "Nairobi, KE (Hybrid)", salary: "KES 380,000/mo", url: "https://example.com/jobs/nimbus-ds",
    appliedDate: daysAgo(18), priority: true, tags: ["Data Science", "Dream Role"],
    resumeVersion: "Resume — Data Science v3", coverLetterVersion: "Cover Letter — Nimbus",
    notes: "Referral from a Cyber Shujaa alum. Team uses Python + dbt + Snowflake.",
    tasks: [
      { id: uid(), text: "Send thank-you note after first interview", done: true },
      { id: uid(), text: "Prep take-home case study", done: false },
      { id: uid(), text: "Research team lead's recent talks", done: false },
    ],
    timeline: [
      { id: uid(), date: daysAgo(18), text: "Application submitted via referral." },
      { id: uid(), date: daysAgo(11), text: "Recruiter phone screen — 30 min, positive." },
      { id: uid(), date: daysAgo(3), text: "Moved to Interviewing — panel scheduled." },
    ],
    contactIds: ["c1"],
  },
  {
    id: "a2", company: "Solstice Robotics", role: "Full-Stack Engineer (Next.js)", stage: "assessment",
    location: "Remote (EAT)", salary: "KES 320,000/mo", url: "https://example.com/jobs/solstice-fe",
    appliedDate: daysAgo(12), priority: false, tags: ["Full-Stack", "Remote"],
    resumeVersion: "Resume — Full-Stack v2", coverLetterVersion: "Cover Letter — Generic Eng",
    notes: "Take-home assignment due Friday — build a small Next.js + Prisma CRUD.",
    tasks: [
      { id: uid(), text: "Finish take-home assignment", done: false },
      { id: uid(), text: "Write README for submission", done: false },
    ],
    timeline: [
      { id: uid(), date: daysAgo(12), text: "Applied through company careers page." },
      { id: uid(), date: daysAgo(5), text: "Received technical assessment." },
    ],
    contactIds: ["c2"],
  },
  {
    id: "a3", company: "Fernback Health", role: "AI/ML Trainer & Curriculum Lead", stage: "offer",
    location: "Nairobi, KE", salary: "KES 410,000/mo", url: "https://example.com/jobs/fernback-ml",
    appliedDate: daysAgo(30), priority: true, tags: ["Training", "Dream Role"],
    resumeVersion: "Resume — Training Lead v1", coverLetterVersion: "Cover Letter — Fernback",
    notes: "Offer received! Base + housing allowance. Negotiating start date and remote days.",
    tasks: [
      { id: uid(), text: "Compare offer against Nimbus expected range", done: true },
      { id: uid(), text: "Draft counter-offer email", done: false },
      { id: uid(), text: "Confirm start date by Monday", done: false },
    ],
    timeline: [
      { id: uid(), date: daysAgo(30), text: "Applied." },
      { id: uid(), date: daysAgo(20), text: "Interviewed with hiring panel — 3 rounds." },
      { id: uid(), date: daysAgo(2), text: "Verbal offer received." },
    ],
    contactIds: ["c3"],
  },
  {
    id: "a4", company: "Harborlight Cyber", role: "Cybersecurity Analyst", stage: "applied",
    location: "Mombasa, KE", salary: "KES 260,000/mo", url: "https://example.com/jobs/harborlight-sec",
    appliedDate: daysAgo(6), priority: false, tags: ["Security"],
    resumeVersion: "Resume — Security v1", coverLetterVersion: "",
    notes: "", tasks: [{ id: uid(), text: "Follow up if no response by day 14", done: false }],
    timeline: [{ id: uid(), date: daysAgo(6), text: "Application submitted." }],
    contactIds: [],
  },
  {
    id: "a5", company: "Quartzline Media", role: "Frontend Developer", stage: "rejected",
    location: "Remote", salary: "KES 220,000/mo", url: "https://example.com/jobs/quartzline-fe",
    appliedDate: daysAgo(40), priority: false, tags: ["Frontend"],
    resumeVersion: "Resume — Full-Stack v2", coverLetterVersion: "Cover Letter — Generic Eng",
    notes: "Rejected after final round — feedback: wanted more design-systems experience.",
    tasks: [], timeline: [
      { id: uid(), date: daysAgo(40), text: "Applied." },
      { id: uid(), date: daysAgo(25), text: "Final round interview." },
      { id: uid(), date: daysAgo(20), text: "Rejection received. Asked for feedback." },
    ],
    contactIds: [],
  },
  {
    id: "a6", company: "Meridian Grid Power", role: "Data Engineer", stage: "saved",
    location: "Kisumu, KE", salary: "KES 300,000/mo (est.)", url: "https://example.com/jobs/meridian-de",
    appliedDate: "", priority: false, tags: ["Data Engineering"],
    resumeVersion: "", coverLetterVersion: "", notes: "Saved from LinkedIn — check requirements again before applying.",
    tasks: [{ id: uid(), text: "Tailor resume bullets to job description", done: false }],
    timeline: [{ id: uid(), date: todayISO(), text: "Saved to wishlist." }],
    contactIds: [],
  },
  {
    id: "a7", company: "Coral & Vine Studio", role: "Product Designer", stage: "saved",
    location: "Remote", salary: "", url: "https://example.com/jobs/coralvine-pd",
    appliedDate: "", priority: false, tags: ["Design", "Long shot"],
    resumeVersion: "", coverLetterVersion: "", notes: "",
    tasks: [], timeline: [{ id: uid(), date: todayISO(), text: "Saved to wishlist." }], contactIds: [],
  },
  {
    id: "a8", company: "Basalt Insurance Group", role: "SQL / BI Analyst", stage: "accepted",
    location: "Nairobi, KE", salary: "KES 290,000/mo", url: "https://example.com/jobs/basalt-bi",
    appliedDate: daysAgo(70), priority: false, tags: ["Data Science"],
    resumeVersion: "Resume — Data Science v3", coverLetterVersion: "Cover Letter — Basalt",
    notes: "Accepted an earlier offer here before deciding to keep exploring — case study for what worked.",
    tasks: [], timeline: [
      { id: uid(), date: daysAgo(70), text: "Applied." },
      { id: uid(), date: daysAgo(50), text: "Offer received." },
      { id: uid(), date: daysAgo(48), text: "Accepted." },
    ], contactIds: ["c4"],
  },
];

const seedContacts = () => [
  { id: "c1", name: "Amara Cheruiyot", role: "Engineering Manager", company: "Nimbus Analytics", email: "amara.c@example.com", phone: "+254 700 111 222", linkedin: "linkedin.com/in/amaracheruiyot", notes: "Warm intro via Cyber Shujaa cohort 4 alum." },
  { id: "c2", name: "David Otieno", role: "Technical Recruiter", company: "Solstice Robotics", email: "d.otieno@example.com", phone: "+254 700 333 444", linkedin: "linkedin.com/in/davidotieno", notes: "Responds fastest on LinkedIn DM." },
  { id: "c3", name: "Grace Wanjiru", role: "Head of People", company: "Fernback Health", email: "grace.w@example.com", phone: "+254 700 555 666", linkedin: "linkedin.com/in/gracewanjiru", notes: "Sent verbal offer; formal letter pending." },
  { id: "c4", name: "Peter Mwangi", role: "Hiring Manager", company: "Basalt Insurance Group", email: "p.mwangi@example.com", phone: "+254 700 777 888", linkedin: "linkedin.com/in/petermwangi", notes: "" },
  { id: "c5", name: "Lindiwe Banda", role: "Former Cyber Shujaa Mentor", company: "—", email: "lindiwe.b@example.com", phone: "", linkedin: "linkedin.com/in/lindiwebanda", notes: "Great for mock interviews and referrals in fintech." },
];

const seedCompanies = () => [
  { id: "co1", name: "Nimbus Analytics", industry: "Data & Analytics SaaS", size: "120–200", research: "Series B, raised $18M last year. Strong engineering blog. Values: ownership, curiosity, calm urgency.", interviewHistory: "Round 1: recruiter screen. Round 2: technical pairing (SQL + Python). Round 3 (upcoming): panel with EM + 2 ICs." },
  { id: "co2", name: "Solstice Robotics", industry: "Industrial Robotics", size: "50–100", research: "Building warehouse automation. Hiring aggressively for the platform team. Culture seems fast-paced, some remote flexibility.", interviewHistory: "Applied via careers page. Currently on take-home assessment." },
  { id: "co3", name: "Fernback Health", industry: "Health Tech / EdTech hybrid", size: "300+", research: "Runs digital health training programs across East Africa. Mission-driven, growing L&D team.", interviewHistory: "3 rounds: recruiter, panel, exec chat. Offer extended." },
  { id: "co4", name: "Harborlight Cyber", industry: "Cybersecurity Consulting", size: "20–50", research: "Boutique security consultancy serving banks and SACCOs. Small team, high ownership.", interviewHistory: "Awaiting response to application." },
];

const seedTemplates = () => [
  { id: "t1", category: "Application", name: "Cold Application Cover Letter", subject: "Application for {{role}} — {{your_name}}", body: "Hi {{hiring_manager}},\n\nI'm writing to apply for the {{role}} position at {{company}}. In my current work on the Cyber Shujaa program, I train and build production tools across data science and web development — a combination that maps closely to what this role needs.\n\nA few things I'd bring on day one:\n• Hands-on delivery: I recently shipped a research portal with full-text search and an admin analytics dashboard.\n• Teaching-grade communication: I facilitate live cohorts, so I explain technical tradeoffs clearly to any audience.\n• Ownership: I run a 30-day career acceleration challenge end-to-end, from content to daily standups.\n\nI'd love the chance to talk about how I can contribute to {{team}}. Thank you for your time and consideration.\n\nBest,\n{{your_name}}" },
  { id: "t2", category: "Follow-up", name: "Post-Application Follow-up (Day 10)", subject: "Following up — {{role}} application", body: "Hi {{hiring_manager}},\n\nI applied for the {{role}} role on {{applied_date}} and wanted to follow up while the search is still active. I remain very interested in {{company}} and happy to share any additional materials that would help the team evaluate my application.\n\nThanks again for your time.\n\nBest,\n{{your_name}}" },
  { id: "t3", category: "Thank You", name: "Post-Interview Thank You", subject: "Thank you — {{role}} interview", body: "Hi {{hiring_manager}},\n\nThank you for the conversation today about the {{role}} position. I enjoyed hearing about {{topic_discussed}} and it confirmed how much I'd enjoy contributing to {{team}}.\n\nPlease let me know if there's anything further you need from me as you move through the process.\n\nBest,\n{{your_name}}" },
  { id: "t4", category: "Networking", name: "LinkedIn Coffee Chat Request", subject: "Quick question about {{company}}", body: "Hi {{contact_name}},\n\nI've been following {{company}}'s work in {{industry}} and would love 15 minutes to hear about your experience on the team. I'm currently exploring roles in {{field}} and always value hearing directly from people doing the work.\n\nWould you be open to a short call in the next couple of weeks?\n\nThanks so much,\n{{your_name}}" },
  { id: "t5", category: "Negotiation", name: "Salary Negotiation / Counter-Offer", subject: "Re: Offer for {{role}}", body: "Hi {{hiring_manager}},\n\nThank you again for the offer to join {{company}} as {{role}} — I'm genuinely excited about the team and the mission.\n\nBased on my research on comparable roles and the scope we discussed, I'd like to request a base of {{target_salary}}. I'm confident this reflects the value I can bring, particularly around {{key_strength}}.\n\nI'm flexible on structure if that helps — happy to discuss further.\n\nBest,\n{{your_name}}" },
];

const seedEvents = () => [
  { id: "e1", title: "Panel Interview — Nimbus Analytics", date: daysFromNow(2), time: "10:00", type: "interview", appId: "a1" },
  { id: "e2", title: "Take-home due — Solstice Robotics", date: daysFromNow(1), time: "23:59", type: "deadline", appId: "a2" },
  { id: "e3", title: "Coffee chat — Lindiwe Banda", date: daysFromNow(4), time: "17:00", type: "networking", appId: null },
  { id: "e4", title: "Follow up — Harborlight Cyber", date: daysFromNow(7), time: "09:00", type: "followup", appId: "a4" },
  { id: "e5", title: "Decide on Fernback offer", date: daysFromNow(3), time: "12:00", type: "deadline", appId: "a3" },
  { id: "e6", title: "Mock interview practice", date: daysAgo(1), time: "18:00", type: "networking", appId: null },
];

const EVENT_TYPES = {
  interview: { label: "Interview", color: "#5B5FEF" },
  deadline: { label: "Deadline", color: "#E15A52" },
  networking: { label: "Networking", color: "#1FA971" },
  followup: { label: "Follow-up", color: "#E29A2E" },
};

const seedWishlist = () => [
  { id: "w1", company: "Aurora Fintech Labs", role: "Data Scientist, Risk", url: "https://example.com/jobs/aurora-risk", notes: "Watching for req to open in Q3.", excitement: 5 },
  { id: "w2", company: "Threadline Logistics", role: "Full-Stack Engineer", url: "https://example.com/jobs/threadline-fs", notes: "Friend works here, could ask for referral.", excitement: 3 },
  { id: "w3", company: "Northgate University", role: "AI Curriculum Designer", url: "https://example.com/jobs/northgate-ai", notes: "Aligns closely with current trainer work.", excitement: 4 },
];

/* ============================================================================
   SMALL PRIMITIVES
============================================================================ */

function IconCircle({ children, bg, color }) {
  return <div className="jat-stat-icon" style={{ background: bg, color }}>{children}</div>;
}

function Badge({ children, color, soft }) {
  return <span className="jat-badge" style={{ background: soft, color }}>{children}</span>;
}

function Tag({ label }) {
  const c = tagColor(label);
  return <span className="jat-tag" style={{ background: c + "1E", color: c }}>{label}</span>;
}

function Avatar({ name, size = 38 }) {
  const c = avatarColor(name);
  return <div className="jat-avatar" style={{ width: size, height: size, background: c }}>{initials(name)}</div>;
}

function EmptyState({ icon, title, sub, action }) {
  return (
    <div className="jat-empty">
      {icon}
      <div className="jat-empty-title">{title}</div>
      <div style={{ fontSize: 13, marginBottom: action ? 14 : 0 }}>{sub}</div>
      {action}
    </div>
  );
}

function Modal({ title, onClose, children, footer, size = "md" }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="jat-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`jat-modal jat-modal-${size} jat-pop`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="jat-modal-head">
          <div className="jat-modal-title">{title}</div>
          <button className="jat-btn-icon" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </div>
        <div className="jat-modal-body">{children}</div>
        {footer && <div className="jat-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

function ProgressRing({ value, size = 108, stroke = 10, color = "var(--accent)", trackColor = "var(--border)" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(Math.max(value, 0), 100) / 100) * c;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset .6s cubic-bezier(.2,.9,.3,1)" }} />
    </svg>
  );
}

/* ============================================================================
   AI ASSISTANT (real API call per artifact spec)
============================================================================ */

async function callClaude(prompt, system) {
  // In production this calls our own serverless function (see /api/generate.js),
  // which holds the real Anthropic API key server-side and forwards the request.
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, system }),
  });
  if (!res.ok) throw new Error("AI request failed (" + res.status + ")");
  const data = await res.json();
  return data.text || "No response generated.";
}

function AIAssistBox({ mode, context }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const MODES = {
    cover_letter: {
      label: "Draft a cover letter",
      placeholder: "Paste the job description or key requirements (optional) — I'll tailor it to " + (context.company || "this role") + ".",
      system: "You are a career coach helping a job seeker in Kenya's tech sector (Cyber Shujaa program alum, trainer and web developer skill set). Write a concise, confident, specific cover letter draft. No generic filler. 200-280 words.",
    },
    follow_up: {
      label: "Draft a follow-up email",
      placeholder: "Add any context — e.g. how long since you applied, or what happened in the last interview.",
      system: "You are a career coach. Write a short, warm, professional follow-up email. Keep it under 130 words. Direct, no groveling.",
    },
    resume_bullets: {
      label: "Improve resume bullets",
      placeholder: "Paste 2-5 resume bullet points to strengthen.",
      system: "You are a resume editor. Rewrite the given bullets using strong action verbs and quantifiable impact where plausible. Keep each bullet under 24 words. Return only the rewritten bullets as a list.",
    },
  };
  const m = MODES[mode];

  const run = async () => {
    setLoading(true); setError(""); setResult("");
    try {
      const prompt = `Context: Applying for ${context.role || "a role"} at ${context.company || "a company"}.\n${context.notes ? "Notes: " + context.notes + "\n" : ""}User input: ${input || "(no extra input provided)"}`;
      const text = await callClaude(prompt, m.system);
      setResult(text);
    } catch (e) {
      setError("Couldn't reach the AI assistant right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="jat-ai-box">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontWeight: 700, fontSize: 13.5 }}>
        <Sparkles size={16} color="var(--accent)" /> {m.label}
      </div>
      <textarea rows={3} placeholder={m.placeholder} value={input} onChange={(e) => setInput(e.target.value)} style={{ marginBottom: 10 }} />
      <button className="jat-btn jat-btn-primary" onClick={run} disabled={loading}>
        {loading ? <Loader2 size={14} className="jat-spin" style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={14} />}
        {loading ? "Generating…" : "Generate"}
      </button>
      {error && <div style={{ color: "var(--danger)", fontSize: 12.5, marginTop: 8 }}>{error}</div>}
      {result && (
        <div className="jat-ai-result">
          {result}
          <div style={{ marginTop: 10 }}>
            <button className="jat-btn jat-btn-soft" style={{ fontSize: 12 }} onClick={() => navigator.clipboard && navigator.clipboard.writeText(result)}>
              <Copy size={13} /> Copy text
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   APP
============================================================================ */

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "pipeline", label: "Applications", icon: Kanban },
  { key: "calendar", label: "Calendar", icon: CalendarIcon },
  { key: "wishlist", label: "Wishlist", icon: Bookmark },
  { key: "companies", label: "Companies", icon: Building2 },
  { key: "contacts", label: "Contacts", icon: Users },
  { key: "templates", label: "Email Templates", icon: Mail },
  { key: "documents", label: "Documents", icon: FolderOpen },
  { key: "settings", label: "Settings", icon: Settings },
];

function JobTracker({ session }) {
  const [theme, setTheme] = useState("light");
  const [tab, setTab] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  const [applications, setApplications] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [events, setEvents] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [cloudError, setCloudError] = useState("");
  const userId = session.user.id;

  const [activeAppId, setActiveAppId] = useState(null);
  const [showNewApp, setShowNewApp] = useState(false);
  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  // ---- Load this user's data once, on sign-in ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from(CLOUD_TABLE).select("data").eq("user_id", userId).maybeSingle();
      if (cancelled) return;
      if (error) {
        setCloudError("Couldn't load your data from the cloud. " + error.message);
        setCloudLoaded(true);
        return;
      }
      if (data && data.data) {
        const d = data.data;
        setApplications(d.applications || []);
        setContacts(d.contacts || []);
        setCompanies(d.companies || []);
        setTemplates(d.templates && d.templates.length ? d.templates : seedTemplates());
        setEvents(d.events || []);
        setWishlist(d.wishlist || []);
        setDocuments(d.documents || []);
      } else {
        // First time this account has signed in — seed with demo data so the app isn't empty.
        setApplications(seedApplications());
        setContacts(seedContacts());
        setCompanies(seedCompanies());
        setTemplates(seedTemplates());
        setEvents(seedEvents());
        setWishlist(seedWishlist());
        setDocuments([]);
      }
      setCloudLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // ---- Autosave to the cloud (debounced) whenever data changes ----
  useEffect(() => {
    if (!cloudLoaded) return;
    const t = setTimeout(async () => {
      const payload = { applications, contacts, companies, templates, events, wishlist, documents };
      const { error } = await supabase.from(CLOUD_TABLE).upsert({ user_id: userId, data: payload, updated_at: new Date().toISOString() });
      if (error) setCloudError("Couldn't save your latest changes. " + error.message);
      else setCloudError("");
    }, 700);
    return () => clearTimeout(t);
  }, [applications, contacts, companies, templates, events, wishlist, documents, cloudLoaded, userId]);

  const activeApp = useMemo(() => applications.find((a) => a.id === activeAppId) || null, [applications, activeAppId]);

  const updateApp = useCallback((id, patch) => {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, ...(typeof patch === "function" ? patch(a) : patch) } : a)));
  }, []);

  const addApp = (app) => {
    const newApp = {
      id: uid(), tags: [], tasks: [], timeline: [{ id: uid(), date: todayISO(), text: "Application created." }],
      contactIds: [], priority: false, resumeVersion: "", coverLetterVersion: "", notes: "", url: "", location: "", salary: "",
      ...app,
    };
    setApplications((prev) => [newApp, ...prev]);
    notify("Application added");
    return newApp.id;
  };

  const deleteApp = (id) => { setApplications((prev) => prev.filter((a) => a.id !== id)); if (activeAppId === id) setActiveAppId(null); notify("Application deleted"); };

  const moveStage = (id, stage) => {
    updateApp(id, (a) => ({ stage, timeline: [...a.timeline, { id: uid(), date: todayISO(), text: `Moved to ${stageInfo(stage).label}.` }] }));
  };

  // ---- Stats ----
  const stats = useMemo(() => {
    const total = applications.length;
    const applied = applications.filter((a) => a.stage !== "saved").length;
    const interviewing = applications.filter((a) => ["interviewing", "assessment", "offer", "accepted"].includes(a.stage)).length;
    const offers = applications.filter((a) => ["offer", "accepted"].includes(a.stage)).length;
    const rejected = applications.filter((a) => a.stage === "rejected").length;
    const responseRate = applied ? Math.round((interviewing / applied) * 100) : 0;
    const interviewRate = applied ? Math.round((applications.filter((a) => a.stage === "interviewing").length / applied) * 100) : 0;
    const offerRate = applied ? Math.round((offers / applied) * 100) : 0;
    return { total, applied, interviewing, offers, rejected, responseRate, interviewRate, offerRate };
  }, [applications]);

  const stageCounts = useMemo(() => STAGES.map((s) => ({ name: s.label, value: applications.filter((a) => a.stage === s.key).length, color: s.color })), [applications]);

  const weeklyData = useMemo(() => {
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date(); start.setDate(start.getDate() - i * 7 - start.getDay());
      const label = `${start.getMonth() + 1}/${start.getDate()}`;
      const count = applications.filter((a) => {
        if (!a.appliedDate) return false;
        const d = new Date(a.appliedDate);
        const diffDays = Math.floor((new Date() - d) / 86400000);
        return diffDays >= i * 7 && diffDays < (i + 1) * 7;
      }).length;
      weeks.push({ week: label, applications: count });
    }
    return weeks;
  }, [applications]);

  const upcomingEvents = useMemo(() => events
    .filter((e) => e.date >= todayISO())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5), [events]);

  const pendingTasks = useMemo(() => {
    const list = [];
    applications.forEach((a) => (a.tasks || []).forEach((t) => { if (!t.done) list.push({ ...t, appId: a.id, appLabel: `${a.role} · ${a.company}` }); }));
    return list.slice(0, 6);
  }, [applications]);

  // ---- Export / Import ----
  const exportBackup = () => {
    const payload = { applications, contacts, companies, templates, events, wishlist, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `job-tracker-backup-${todayISO()}.json`; a.click();
    URL.revokeObjectURL(url);
    notify("Backup exported");
  };
  const importBackup = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.applications) setApplications(data.applications);
        if (data.contacts) setContacts(data.contacts);
        if (data.companies) setCompanies(data.companies);
        if (data.templates) setTemplates(data.templates);
        if (data.events) setEvents(data.events);
        if (data.wishlist) setWishlist(data.wishlist);
        if (data.documents) setDocuments(data.documents);
        notify("Backup imported");
      } catch { notify("Import failed — invalid file"); }
    };
    reader.readAsText(file);
  };

  if (!cloudLoaded) {
    return (
      <div className="jat-root" data-theme={theme} style={{ alignItems: "center", justifyContent: "center" }}>
        <style>{CSS_VARS}</style>
        <div style={{ textAlign: "center", color: "var(--text-2)", fontSize: 14 }}>Loading your workspace…</div>
      </div>
    );
  }

  return (
    <div className="jat-root" data-theme={theme}>
      <style>{CSS_VARS}</style>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {mobileNavOpen && <div onClick={() => setMobileNavOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", zIndex: 39 }} />}

      <aside className={`jat-sidebar ${mobileNavOpen ? "open" : ""}`}>
        <div className="jat-logo">
          <div className="jat-logo-mark"><Briefcase size={16} color="#fff" /></div>
          <div className="jat-logo-text">Pathway</div>
        </div>
        <nav className="jat-nav">
          <div className="jat-nav-group-label">Workspace</div>
          {NAV.map((n) => {
            const Icon = n.icon;
            const count = n.key === "pipeline" ? applications.length : n.key === "wishlist" ? wishlist.length : null;
            return (
              <button key={n.key} className={`jat-nav-item ${tab === n.key ? "active" : ""}`} onClick={() => { setTab(n.key); setMobileNavOpen(false); }}>
                <Icon size={16} /> {n.label}
                {count !== null && <span className="jat-count">{count}</span>}
              </button>
            );
          })}
        </nav>
        <div className="jat-sidebar-foot" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", padding: "0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={session.user.email}>
            {session.user.email}
          </div>
          <button className="jat-theme-toggle" onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
            {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
            {theme === "light" ? "Dark mode" : "Light mode"}
          </button>
          <button className="jat-theme-toggle" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="jat-main">
        <div className="jat-topbar">
          <button className="jat-btn-icon jat-mobile-menu-btn" onClick={() => setMobileNavOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="jat-search">
            <Search size={15} />
            <input placeholder="Search companies, roles, contacts…" value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} />
          </div>
          <div style={{ flex: 1 }} />
          {cloudError && <span style={{ fontSize: 12, color: "var(--danger)" }}>{cloudError}</span>}
          <button className="jat-btn jat-btn-ghost" onClick={exportBackup} title="Export backup"><Download size={14} /><span className="jat-btn-label">Export</span></button>
          <input ref={fileInputRef} type="file" accept="application/json" style={{ display: "none" }} onChange={(e) => e.target.files[0] && importBackup(e.target.files[0])} />
          <button className="jat-btn jat-btn-ghost" onClick={() => fileInputRef.current.click()} title="Import backup"><Upload size={14} /><span className="jat-btn-label">Import</span></button>
          <button className="jat-btn jat-btn-primary" onClick={() => setShowNewApp(true)}><Plus size={15} /><span className="jat-btn-label jat-btn-label-primary">Add Application</span></button>
        </div>

        <div className="jat-content jat-fade-in" key={tab}>
          {tab === "dashboard" && (
            <DashboardTab stats={stats} stageCounts={stageCounts} weeklyData={weeklyData} upcomingEvents={upcomingEvents}
              pendingTasks={pendingTasks} applications={applications} onOpenApp={setActiveAppId} theme={theme} />
          )}
          {tab === "pipeline" && (
            <PipelineTab applications={applications} search={globalSearch} onOpen={setActiveAppId} onMoveStage={moveStage}
              onAddNew={() => setShowNewApp(true)} onDelete={deleteApp} />
          )}
          {tab === "calendar" && <CalendarTab events={events} setEvents={setEvents} applications={applications} />}
          {tab === "wishlist" && <WishlistTab wishlist={wishlist} setWishlist={setWishlist} onConvert={(w) => { const id = addApp({ company: w.company, role: w.role, stage: "saved", url: w.url, notes: w.notes }); setWishlist((prev) => prev.filter((x) => x.id !== w.id)); setActiveAppId(id); }} />}
          {tab === "companies" && <CompaniesTab companies={companies} setCompanies={setCompanies} applications={applications} search={globalSearch} />}
          {tab === "contacts" && <ContactsTab contacts={contacts} setContacts={setContacts} search={globalSearch} applications={applications} />}
          {tab === "templates" && <TemplatesTab templates={templates} setTemplates={setTemplates} />}
          {tab === "documents" && <DocumentsTab documents={documents} setDocuments={setDocuments} applications={applications} userId={userId} />}
          {tab === "settings" && <SettingsTab onExport={exportBackup} onImportClick={() => fileInputRef.current.click()} counts={{ applications: applications.length, contacts: contacts.length, companies: companies.length, documents: documents.length }} />}
        </div>
      </div>

      {activeApp && (
        <ApplicationDetailModal app={activeApp} contacts={contacts} documents={documents} onClose={() => setActiveAppId(null)}
          onUpdate={(patch) => updateApp(activeApp.id, patch)} onDelete={() => deleteApp(activeApp.id)} />
      )}

      {showNewApp && <NewApplicationModal onClose={() => setShowNewApp(false)} onCreate={(app) => { const id = addApp(app); setShowNewApp(false); setActiveAppId(id); }} />}

      {toast && (
        <div style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", background: "var(--text)", color: "var(--bg)", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "var(--shadow-lg)", zIndex: 300 }} className="jat-pop">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   AUTH GATE — decides between the sign-in screen and the app itself
============================================================================ */

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = still checking, null = signed out

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!supabaseConfigured) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", padding: 24 }}>
        <div style={{ maxWidth: 440, textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 10 }}>Supabase isn't configured</div>
          <div style={{ color: "#6C6E7D", fontSize: 14, lineHeight: 1.6 }}>
            This deployment is missing <code>VITE_SUPABASE_URL</code> and/or <code>VITE_SUPABASE_ANON_KEY</code>.
            Add both under Vercel → Project Settings → Environment Variables (or your local <code>.env</code> file),
            then redeploy — Vite bakes these in at build time, so a plain restart isn't enough.
          </div>
        </div>
      </div>
    );
  }

  if (session === undefined) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", color: "#6C6E7D" }}>Loading…</div>;
  }
  if (!session) return <Auth />;
  return <JobTracker key={session.user.id} session={session} />;
}

/* ============================================================================
   DASHBOARD
============================================================================ */

function DashboardTab({ stats, stageCounts, weeklyData, upcomingEvents, pendingTasks, applications, onOpenApp, theme }) {
  const gridColor = theme === "dark" ? "#262730" : "#E7E7EF";
  const textColor = theme === "dark" ? "#9A9CAA" : "#6C6E7D";
  return (
    <div>
      <div className="jat-page-head">
        <div>
          <div className="jat-page-title">Good to see you 👋</div>
          <div className="jat-page-sub">Here's where your job search stands today, {fmtDate(todayISO())}.</div>
        </div>
      </div>

      <div className="jat-stats-grid">
        <div className="jat-card jat-stat-card">
          <div className="jat-stat-top"><IconCircle bg="var(--accent-soft)" color="var(--accent)"><Briefcase size={16} /></IconCircle></div>
          <div className="jat-stat-value">{stats.total}</div>
          <div className="jat-stat-label">Total applications</div>
        </div>
        <div className="jat-card jat-stat-card">
          <div className="jat-stat-top"><IconCircle bg="var(--info-soft)" color="var(--info)"><TrendingUp size={16} /></IconCircle></div>
          <div className="jat-stat-value">{stats.responseRate}%</div>
          <div className="jat-stat-label">Response rate</div>
        </div>
        <div className="jat-card jat-stat-card">
          <div className="jat-stat-top"><IconCircle bg="var(--warning-soft)" color="var(--warning)"><Users size={16} /></IconCircle></div>
          <div className="jat-stat-value">{stats.interviewing}</div>
          <div className="jat-stat-label">In interview process</div>
        </div>
        <div className="jat-card jat-stat-card">
          <div className="jat-stat-top"><IconCircle bg="var(--success-soft)" color="var(--success)"><Star size={16} /></IconCircle></div>
          <div className="jat-stat-value">{stats.offers}</div>
          <div className="jat-stat-label">Offers &amp; accepted</div>
        </div>
      </div>

      <div className="jat-dash-grid">
        <div className="jat-card jat-panel">
          <div className="jat-panel-title">Applications over time</div>
          <div className="jat-panel-sub">Weekly submission volume, last 8 weeks</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="fillApps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: textColor }} axisLine={{ stroke: gridColor }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="applications" stroke="#5B5FEF" strokeWidth={2.5} fill="url(#fillApps)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="jat-card jat-panel">
          <div className="jat-panel-title">Pipeline momentum</div>
          <div className="jat-panel-sub">Share of active applications past the applied stage</div>
          <div className="jat-ring-wrap">
            <div style={{ position: "relative", flexShrink: 0 }}>
              <ProgressRing value={stats.responseRate} />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 22 }}>{stats.responseRate}%</div>
                <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>moving forward</div>
              </div>
            </div>
            <div className="jat-ring-stats">
              {STAGES.filter((s) => s.key !== "saved").map((s) => (
                <div className="jat-ring-row" key={s.key}>
                  <span><span className="jat-ring-dot" style={{ background: s.color }} />{s.label}</span>
                  <strong>{stageCounts.find((x) => x.name === s.label)?.value || 0}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="jat-dash-grid">
        <div className="jat-card jat-panel">
          <div className="jat-panel-title">Applications by stage</div>
          <div className="jat-panel-sub">Where everything currently sits</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stageCounts} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke={gridColor} horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: textColor }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} cursor={{ fill: "var(--surface-2)" }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {stageCounts.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="jat-card jat-panel">
          <div className="jat-panel-title">Upcoming on your calendar</div>
          <div className="jat-panel-sub">Next {upcomingEvents.length} events</div>
          {upcomingEvents.length === 0 ? (
            <EmptyState icon={<CalendarIcon size={30} />} title="Nothing scheduled" sub="Add interviews or deadlines from the Calendar tab." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {upcomingEvents.map((e) => {
                const t = EVENT_TYPES[e.type];
                return (
                  <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</div>
                      <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{fmtDateShort(e.date)} · {e.time}</div>
                    </div>
                    <Badge color={t.color} soft={t.color + "1A"}>{t.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="jat-card jat-panel">
        <div className="jat-panel-title">Pending tasks across applications</div>
        <div className="jat-panel-sub">Quick wins to keep momentum</div>
        {pendingTasks.length === 0 ? (
          <EmptyState icon={<ListChecks size={30} />} title="All caught up" sub="No pending tasks right now." />
        ) : (
          <div>
            {pendingTasks.map((t) => (
              <div key={t.id} className="jat-task-row" style={{ cursor: "pointer" }} onClick={() => onOpenApp(t.appId)}>
                <div className="jat-checkbox"><Clock size={11} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13 }}>{t.text}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{t.appLabel}</div>
                </div>
                <ArrowUpRight size={14} color="var(--text-3)" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   PIPELINE (Board + List)
============================================================================ */

function PipelineTab({ applications, search, onOpen, onMoveStage, onAddNew, onDelete }) {
  const [view, setView] = useState("board");
  const [stageFilter, setStageFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [dragOverStage, setDragOverStage] = useState(null);

  const allTags = useMemo(() => Array.from(new Set(applications.flatMap((a) => a.tags || []))), [applications]);

  const filtered = useMemo(() => applications.filter((a) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q) || (a.tags || []).some((t) => t.toLowerCase().includes(q));
    const matchesStage = stageFilter === "all" || a.stage === stageFilter;
    const matchesTag = tagFilter === "all" || (a.tags || []).includes(tagFilter);
    return matchesSearch && matchesStage && matchesTag;
  }), [applications, search, stageFilter, tagFilter]);

  return (
    <div>
      <div className="jat-page-head">
        <div>
          <div className="jat-page-title">Applications</div>
          <div className="jat-page-sub">{filtered.length} of {applications.length} shown</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div className="jat-viewtoggle">
            <button className={view === "board" ? "active" : ""} onClick={() => setView("board")}>Board</button>
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>List</button>
          </div>
          <button className="jat-btn jat-btn-primary" onClick={onAddNew}><Plus size={15} /> Add Application</button>
        </div>
      </div>

      <div className="jat-filter-bar">
        <button className={`jat-chip ${stageFilter === "all" ? "active" : ""}`} onClick={() => setStageFilter("all")}>All stages</button>
        {STAGES.map((s) => (
          <button key={s.key} className={`jat-chip ${stageFilter === s.key ? "active" : ""}`} onClick={() => setStageFilter(s.key)}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, display: "inline-block" }} /> {s.label}
          </button>
        ))}
        {allTags.length > 0 && (
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} style={{ width: "auto", maxWidth: 160 }}>
            <option value="all">All tags</option>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      {view === "board" ? (
        <div className="jat-board">
          {STAGES.map((s) => {
            const items = filtered.filter((a) => a.stage === s.key);
            return (
              <div key={s.key} className={`jat-column ${dragOverStage === s.key ? "drag-over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOverStage(s.key); }}
                onDragLeave={() => setDragOverStage((cur) => (cur === s.key ? null : cur))}
                onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) onMoveStage(id, s.key); setDragOverStage(null); }}>
                <div className="jat-column-head">
                  <span className="jat-column-dot" style={{ background: s.color }} />
                  <span className="jat-column-title">{s.label}</span>
                  <span className="jat-column-count">{items.length}</span>
                </div>
                <div className="jat-column-body">
                  {items.length === 0 && <div style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", padding: "20px 6px" }}>No applications</div>}
                  {items.map((a) => (
                    <div key={a.id} className="jat-app-card" draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", a.id)}
                      onClick={() => onOpen(a.id)}>
                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: s.color }} />
                      <div className="jat-app-card-role">{a.role}</div>
                      <div className="jat-app-card-company"><Building2 size={12} /> {a.company}</div>
                      {a.tags && a.tags.length > 0 && (
                        <div className="jat-tag-row">{a.tags.map((t) => <Tag key={t} label={t} />)}</div>
                      )}
                      <div className="jat-app-card-meta">
                        <span className="jat-avatar-date"><Clock size={11} />{a.appliedDate ? fmtDateShort(a.appliedDate) : "Not yet applied"}</span>
                        {a.priority && <Star size={13} className="jat-priority-star" fill="var(--warning)" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="jat-card jat-table-wrap">
          <table className="jat-table">
            <thead>
              <tr>
                <th>Role</th><th>Company</th><th>Stage</th><th>Applied</th><th>Tags</th><th>Salary</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const s = stageInfo(a.stage);
                return (
                  <tr key={a.id} className="jat-row-hover" onClick={() => onOpen(a.id)}>
                    <td style={{ fontWeight: 600 }}>{a.priority && <Star size={12} className="jat-priority-star" fill="var(--warning)" style={{ marginRight: 5, verticalAlign: -1 }} />}{a.role}</td>
                    <td>{a.company}</td>
                    <td><Badge color={s.color} soft={s.color + "1A"}>{s.label}</Badge></td>
                    <td>{a.appliedDate ? fmtDate(a.appliedDate) : "—"}</td>
                    <td><div className="jat-tag-row">{(a.tags || []).map((t) => <Tag key={t} label={t} />)}</div></td>
                    <td>{a.salary || "—"}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button className="jat-btn-icon" onClick={() => { if (confirm("Delete this application?")) onDelete(a.id); }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7}><EmptyState icon={<Search size={28} />} title="No matches" sub="Try a different search or filter." /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   APPLICATION DETAIL MODAL
============================================================================ */

function ApplicationDetailModal({ app, contacts, documents, onClose, onUpdate, onDelete }) {
  const [tab, setTab] = useState("overview");
  const [newTask, setNewTask] = useState("");
  const [newNoteEntry, setNewNoteEntry] = useState("");
  const s = stageInfo(app.stage);
  const linkedContacts = contacts.filter((c) => (app.contactIds || []).includes(c.id));
  const linkedDocs = documents.filter((d) => (d.appIds || []).includes(app.id));

  const toggleTask = (taskId) => onUpdate({ tasks: app.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) });
  const addTask = () => { if (!newTask.trim()) return; onUpdate({ tasks: [...app.tasks, { id: uid(), text: newTask.trim(), done: false }] }); setNewTask(""); };
  const removeTask = (taskId) => onUpdate({ tasks: app.tasks.filter((t) => t.id !== taskId) });
  const addTimelineNote = () => {
    if (!newNoteEntry.trim()) return;
    onUpdate({ timeline: [...app.timeline, { id: uid(), date: todayISO(), text: newNoteEntry.trim() }] });
    setNewNoteEntry("");
  };

  return (
    <Modal size="lg" title="" onClose={onClose} footer={
      <>
        <button className="jat-btn jat-btn-danger" onClick={() => { if (confirm("Delete this application permanently?")) { onDelete(); } }}><Trash2 size={14} /> Delete</button>
        <button className="jat-btn jat-btn-soft" onClick={onClose}>Close</button>
      </>
    }>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20 }}>{app.role}</div>
          <div style={{ color: "var(--text-2)", fontSize: 13.5, display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            <Building2 size={13} /> {app.company} {app.location && <>· <MapPin size={13} /> {app.location}</>}
          </div>
        </div>
        <button className="jat-btn-icon" onClick={() => onUpdate({ priority: !app.priority })} title="Toggle priority">
          <Star size={18} className={app.priority ? "jat-priority-star" : ""} fill={app.priority ? "var(--warning)" : "none"} color={app.priority ? "var(--warning)" : "var(--text-3)"} />
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "12px 0 4px", flexWrap: "wrap" }}>
        <select value={app.stage} onChange={(e) => onUpdate({ stage: e.target.value, timeline: [...app.timeline, { id: uid(), date: todayISO(), text: `Moved to ${stageInfo(e.target.value).label}.` }] })} style={{ width: "auto", fontWeight: 600, color: s.color, borderColor: s.color + "55" }}>
          {STAGES.map((st) => <option key={st.key} value={st.key}>{st.label}</option>)}
        </select>
        {app.url && <a href={app.url} target="_blank" rel="noopener noreferrer" className="jat-btn jat-btn-ghost" style={{ fontSize: 12.5 }}><ExternalLink size={13} /> Job posting</a>}
        <div className="jat-tag-row">{(app.tags || []).map((t) => <Tag key={t} label={t} />)}</div>
      </div>

      <div className="jat-tabs" style={{ marginTop: 16 }}>
        {["overview", "tasks", "contacts", "documents", "timeline", "ai assist"].map((t) => (
          <button key={t} className={`jat-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)} style={{ textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div>
          <div className="jat-field-row">
            <div className="jat-field"><label>Applied date</label><input type="date" value={app.appliedDate || ""} onChange={(e) => onUpdate({ appliedDate: e.target.value })} /></div>
            <div className="jat-field"><label>Salary / compensation</label><input value={app.salary || ""} onChange={(e) => onUpdate({ salary: e.target.value })} placeholder="e.g. KES 350,000/mo" /></div>
          </div>
          <div className="jat-field-row">
            <div className="jat-field"><label>Resume version</label><input value={app.resumeVersion || ""} onChange={(e) => onUpdate({ resumeVersion: e.target.value })} placeholder="e.g. Resume — Data Science v3" /></div>
            <div className="jat-field"><label>Cover letter version</label><input value={app.coverLetterVersion || ""} onChange={(e) => onUpdate({ coverLetterVersion: e.target.value })} placeholder="e.g. Cover Letter — Nimbus" /></div>
          </div>
          <div className="jat-field">
            <label>Tags (comma separated)</label>
            <input value={(app.tags || []).join(", ")} onChange={(e) => onUpdate({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
          </div>
          <div className="jat-field">
            <label>Notes</label>
            <textarea rows={5} value={app.notes || ""} onChange={(e) => onUpdate({ notes: e.target.value })} placeholder="Anything worth remembering about this opportunity…" />
          </div>
        </div>
      )}

      {tab === "tasks" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a task…" onKeyDown={(e) => e.key === "Enter" && addTask()} />
            <button className="jat-btn jat-btn-primary" onClick={addTask}><Plus size={14} /></button>
          </div>
          {app.tasks.length === 0 ? <EmptyState icon={<ListChecks size={28} />} title="No tasks yet" sub="Add prep steps, follow-ups, or reminders." /> : (
            app.tasks.map((t) => (
              <div className="jat-task-row" key={t.id}>
                <button className={`jat-checkbox ${t.done ? "checked" : ""}`} onClick={() => toggleTask(t.id)}>{t.done && <Check size={12} />}</button>
                <span style={{ flex: 1, fontSize: 13.5, textDecoration: t.done ? "line-through" : "none", color: t.done ? "var(--text-3)" : "var(--text)" }}>{t.text}</span>
                <button className="jat-btn-icon" onClick={() => removeTask(t.id)}><X size={13} /></button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "contacts" && (
        <div>
          {linkedContacts.length === 0 ? <EmptyState icon={<Users size={28} />} title="No contacts linked" sub="Link recruiters or hiring managers from the Contacts tab." /> : (
            <div className="jat-grid-2">
              {linkedContacts.map((c) => (
                <div key={c.id} className="jat-card jat-contact-card" style={{ display: "flex", gap: 12 }}>
                  <Avatar name={c.name} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-2)" }}>{c.role}</div>
                    <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>{c.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "documents" && (
        <div>
          {linkedDocs.length === 0 ? <EmptyState icon={<FolderOpen size={28} />} title="No documents linked" sub="Upload and link resumes or cover letters from the Documents tab." /> : (
            <div className="jat-grid-2">
              {linkedDocs.map((d) => (
                <div key={d.id} className="jat-card jat-doc-card" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <FileText size={20} color="var(--accent)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{d.type} · {d.version}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "timeline" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input value={newNoteEntry} onChange={(e) => setNewNoteEntry(e.target.value)} placeholder="Log an update (e.g. 'Recruiter called')…" onKeyDown={(e) => e.key === "Enter" && addTimelineNote()} />
            <button className="jat-btn jat-btn-primary" onClick={addTimelineNote}><Plus size={14} /></button>
          </div>
          {[...app.timeline].reverse().map((t) => (
            <div className="jat-timeline-item" key={t.id}>
              <div className="jat-timeline-dot" />
              <div>
                <div style={{ fontSize: 13.5 }}>{t.text}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{fmtDate(t.date)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "ai assist" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <AIAssistBox mode="cover_letter" context={{ company: app.company, role: app.role, notes: app.notes }} />
          <AIAssistBox mode="follow_up" context={{ company: app.company, role: app.role, notes: app.notes }} />
          <AIAssistBox mode="resume_bullets" context={{ company: app.company, role: app.role, notes: app.notes }} />
        </div>
      )}
    </Modal>
  );
}

/* ============================================================================
   NEW APPLICATION MODAL
============================================================================ */

function NewApplicationModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ role: "", company: "", stage: "saved", location: "", salary: "", url: "", appliedDate: "", tags: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const canSave = form.role.trim() && form.company.trim();
  return (
    <Modal title="Add Application" size="md" onClose={onClose} footer={
      <>
        <button className="jat-btn jat-btn-soft" onClick={onClose}>Cancel</button>
        <button className="jat-btn jat-btn-primary" disabled={!canSave} onClick={() => onCreate({ ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) })}><Plus size={14} /> Create</button>
      </>
    }>
      <div className="jat-field-row">
        <div className="jat-field"><label>Job title *</label><input value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="e.g. Senior Data Scientist" /></div>
        <div className="jat-field"><label>Company *</label><input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="e.g. Nimbus Analytics" /></div>
      </div>
      <div className="jat-field-row">
        <div className="jat-field"><label>Stage</label>
          <select value={form.stage} onChange={(e) => set("stage", e.target.value)}>
            {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div className="jat-field"><label>Applied date</label><input type="date" value={form.appliedDate} onChange={(e) => set("appliedDate", e.target.value)} /></div>
      </div>
      <div className="jat-field-row">
        <div className="jat-field"><label>Location</label><input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Remote / Nairobi, KE" /></div>
        <div className="jat-field"><label>Salary</label><input value={form.salary} onChange={(e) => set("salary", e.target.value)} placeholder="e.g. KES 300,000/mo" /></div>
      </div>
      <div className="jat-field"><label>Job posting URL</label><input value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://…" /></div>
      <div className="jat-field"><label>Tags (comma separated)</label><input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="Data Science, Remote, Dream Role" /></div>
    </Modal>
  );
}

/* ============================================================================
   CALENDAR
============================================================================ */

function CalendarTab({ events, setEvents, applications }) {
  const [cursor, setCursor] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const year = cursor.getFullYear(), month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (d) => { const t = new Date(); return d === t.getDate() && month === t.getMonth() && year === t.getFullYear(); };
  const isoFor = (d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const eventsFor = (d) => events.filter((e) => e.date === isoFor(d));

  return (
    <div>
      <div className="jat-page-head">
        <div>
          <div className="jat-page-title">Calendar</div>
          <div className="jat-page-sub">Interviews, assessments, deadlines, and networking events</div>
        </div>
        <button className="jat-btn jat-btn-primary" onClick={() => { setSelectedDate(todayISO()); setShowAdd(true); }}><Plus size={15} /> Add Event</button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button className="jat-btn-icon" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft size={18} /></button>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, minWidth: 160, textAlign: "center" }}>
          {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </div>
        <button className="jat-btn-icon" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight size={18} /></button>
        <button className="jat-btn jat-btn-ghost" onClick={() => setCursor(new Date())}>Today</button>
        <div style={{ flex: 1 }} />
        {Object.entries(EVENT_TYPES).map(([k, v]) => (
          <span key={k} style={{ fontSize: 11.5, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: v.color, display: "inline-block" }} /> {v.label}
          </span>
        ))}
      </div>

      <div className="jat-cal-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="jat-cal-headcell">
            <span className="jat-cal-head-full">{d}</span>
            <span className="jat-cal-head-short">{d[0]}</span>
          </div>
        ))}
        {cells.map((d, i) => (
          <div key={i} className={`jat-cal-cell ${d === null ? "other-month" : ""} ${d && isToday(d) ? "today" : ""}`}
            onClick={() => d && (setSelectedDate(isoFor(d)), setShowAdd(true))} style={{ cursor: d ? "pointer" : "default" }}>
            {d && (
              <>
                <div className="jat-cal-daynum">{d}</div>
                {eventsFor(d).slice(0, 3).map((e) => (
                  <div key={e.id} className="jat-cal-event" style={{ background: EVENT_TYPES[e.type].color + "22", color: EVENT_TYPES[e.type].color }} title={e.title}>{e.title}</div>
                ))}
                {eventsFor(d).length > 3 && <div style={{ fontSize: 10, color: "var(--text-3)" }}>+{eventsFor(d).length - 3} more</div>}
              </>
            )}
          </div>
        ))}
      </div>

      {showAdd && (
        <AddEventModal date={selectedDate} applications={applications} onClose={() => setShowAdd(false)}
          onCreate={(ev) => { setEvents((prev) => [...prev, { id: uid(), ...ev }]); setShowAdd(false); }} />
      )}
    </div>
  );
}

function AddEventModal({ date, applications, onClose, onCreate }) {
  const [form, setForm] = useState({ title: "", date: date || todayISO(), time: "09:00", type: "interview", appId: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Modal title="Add Calendar Event" size="sm" onClose={onClose} footer={
      <>
        <button className="jat-btn jat-btn-soft" onClick={onClose}>Cancel</button>
        <button className="jat-btn jat-btn-primary" disabled={!form.title.trim()} onClick={() => onCreate(form)}><Plus size={14} /> Add</button>
      </>
    }>
      <div className="jat-field"><label>Title</label><input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Panel interview — Nimbus" /></div>
      <div className="jat-field-row">
        <div className="jat-field"><label>Date</label><input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} /></div>
        <div className="jat-field"><label>Time</label><input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} /></div>
      </div>
      <div className="jat-field"><label>Type</label>
        <select value={form.type} onChange={(e) => set("type", e.target.value)}>
          {Object.entries(EVENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div className="jat-field"><label>Linked application (optional)</label>
        <select value={form.appId} onChange={(e) => set("appId", e.target.value)}>
          <option value="">None</option>
          {applications.map((a) => <option key={a.id} value={a.id}>{a.role} · {a.company}</option>)}
        </select>
      </div>
    </Modal>
  );
}

/* ============================================================================
   WISHLIST
============================================================================ */

function WishlistTab({ wishlist, setWishlist, onConvert }) {
  const [showAdd, setShowAdd] = useState(false);
  const remove = (id) => setWishlist((prev) => prev.filter((w) => w.id !== id));
  return (
    <div>
      <div className="jat-page-head">
        <div><div className="jat-page-title">Wishlist</div><div className="jat-page-sub">Bookmarked roles you're not ready to apply to yet</div></div>
        <button className="jat-btn jat-btn-primary" onClick={() => setShowAdd(true)}><Plus size={15} /> Bookmark a Role</button>
      </div>
      {wishlist.length === 0 ? (
        <EmptyState icon={<Bookmark size={30} />} title="Your wishlist is empty" sub="Save interesting roles here before you're ready to apply." />
      ) : (
        <div className="jat-grid-3">
          {wishlist.map((w) => (
            <div key={w.id} className="jat-card" style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{w.role}</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>{w.company}</div>
                </div>
                <div style={{ display: "flex" }}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} fill={i < w.excitement ? "var(--warning)" : "none"} color="var(--warning)" />)}</div>
              </div>
              {w.notes && <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 8 }}>{w.notes}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="jat-btn jat-btn-primary" style={{ fontSize: 12 }} onClick={() => onConvert(w)}>Move to tracker</button>
                {w.url && <a href={w.url} target="_blank" rel="noopener noreferrer" className="jat-btn jat-btn-ghost" style={{ fontSize: 12 }}><ExternalLink size={12} /></a>}
                <button className="jat-btn-icon" style={{ marginLeft: "auto" }} onClick={() => remove(w.id)}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showAdd && <AddWishlistModal onClose={() => setShowAdd(false)} onCreate={(w) => { setWishlist((prev) => [...prev, { id: uid(), excitement: 3, ...w }]); setShowAdd(false); }} />}
    </div>
  );
}

function AddWishlistModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ role: "", company: "", url: "", notes: "", excitement: 3 });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Modal title="Bookmark a Role" size="sm" onClose={onClose} footer={
      <><button className="jat-btn jat-btn-soft" onClick={onClose}>Cancel</button>
      <button className="jat-btn jat-btn-primary" disabled={!form.role || !form.company} onClick={() => onCreate(form)}><Plus size={14} /> Save</button></>
    }>
      <div className="jat-field"><label>Role</label><input value={form.role} onChange={(e) => set("role", e.target.value)} /></div>
      <div className="jat-field"><label>Company</label><input value={form.company} onChange={(e) => set("company", e.target.value)} /></div>
      <div className="jat-field"><label>URL</label><input value={form.url} onChange={(e) => set("url", e.target.value)} /></div>
      <div className="jat-field"><label>Notes</label><textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
    </Modal>
  );
}

/* ============================================================================
   COMPANIES
============================================================================ */

function CompaniesTab({ companies, setCompanies, applications, search }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const filtered = companies.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  const update = (id, patch) => setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id) => setCompanies((prev) => prev.filter((c) => c.id !== id));

  return (
    <div>
      <div className="jat-page-head">
        <div><div className="jat-page-title">Companies</div><div className="jat-page-sub">Research, notes, and interview history in one place</div></div>
        <button className="jat-btn jat-btn-primary" onClick={() => setShowAdd(true)}><Plus size={15} /> Add Company</button>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={<Building2 size={30} />} title="No companies yet" sub="Add a company to start tracking research and interview history." />
      ) : (
        <div className="jat-grid-2">
          {filtered.map((c) => {
            const relatedApps = applications.filter((a) => a.company === c.name);
            const isEditing = editing === c.id;
            return (
              <div key={c.id} className="jat-card jat-company-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <Avatar name={c.name} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-2)" }}>{c.industry} {c.size && `· ${c.size} employees`}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="jat-btn-icon" onClick={() => setEditing(isEditing ? null : c.id)}><Edit3 size={14} /></button>
                    <button className="jat-btn-icon" onClick={() => remove(c.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                {relatedApps.length > 0 && (
                  <div className="jat-tag-row" style={{ marginTop: 10 }}>
                    {relatedApps.map((a) => <Badge key={a.id} color={stageInfo(a.stage).color} soft={stageInfo(a.stage).color + "1A"}>{a.role}</Badge>)}
                  </div>
                )}
                {isEditing ? (
                  <div style={{ marginTop: 12 }}>
                    <div className="jat-field"><label>Research notes</label><textarea rows={3} value={c.research} onChange={(e) => update(c.id, { research: e.target.value })} /></div>
                    <div className="jat-field"><label>Interview history</label><textarea rows={3} value={c.interviewHistory} onChange={(e) => update(c.id, { interviewHistory: e.target.value })} /></div>
                    <button className="jat-btn jat-btn-primary" style={{ fontSize: 12 }} onClick={() => setEditing(null)}><Check size={13} /> Done</button>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 10 }}><strong style={{ color: "var(--text)" }}>Research: </strong>{c.research || "—"}</div>
                    <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 6 }}><strong style={{ color: "var(--text)" }}>Interviews: </strong>{c.interviewHistory || "—"}</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      {showAdd && <AddCompanyModal onClose={() => setShowAdd(false)} onCreate={(c) => { setCompanies((prev) => [...prev, { id: uid(), research: "", interviewHistory: "", ...c }]); setShowAdd(false); }} />}
    </div>
  );
}

function AddCompanyModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", industry: "", size: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Modal title="Add Company" size="sm" onClose={onClose} footer={
      <><button className="jat-btn jat-btn-soft" onClick={onClose}>Cancel</button>
      <button className="jat-btn jat-btn-primary" disabled={!form.name} onClick={() => onCreate(form)}><Plus size={14} /> Add</button></>
    }>
      <div className="jat-field"><label>Company name</label><input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
      <div className="jat-field"><label>Industry</label><input value={form.industry} onChange={(e) => set("industry", e.target.value)} /></div>
      <div className="jat-field"><label>Size</label><input value={form.size} onChange={(e) => set("size", e.target.value)} placeholder="e.g. 50-100 employees" /></div>
    </Modal>
  );
}

/* ============================================================================
   CONTACTS
============================================================================ */

function ContactsTab({ contacts, setContacts, search, applications }) {
  const [showAdd, setShowAdd] = useState(false);
  const filtered = contacts.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase()));
  const remove = (id) => setContacts((prev) => prev.filter((c) => c.id !== id));

  return (
    <div>
      <div className="jat-page-head">
        <div><div className="jat-page-title">Contacts</div><div className="jat-page-sub">Recruiters, hiring managers, and your network</div></div>
        <button className="jat-btn jat-btn-primary" onClick={() => setShowAdd(true)}><Plus size={15} /> Add Contact</button>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={<Users size={30} />} title="No contacts yet" sub="Add people you meet during your search." />
      ) : (
        <div className="jat-grid-3">
          {filtered.map((c) => {
            const linkedApp = applications.find((a) => (a.contactIds || []).includes(c.id));
            return (
              <div key={c.id} className="jat-card jat-contact-card">
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <Avatar name={c.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-2)" }}>{c.role} {c.company !== "—" && `· ${c.company}`}</div>
                  </div>
                  <button className="jat-btn-icon" onClick={() => remove(c.id)}><Trash2 size={13} /></button>
                </div>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5, fontSize: 12.5, color: "var(--text-2)" }}>
                  {c.email && <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail size={12} /> {c.email}</div>}
                  {c.phone && <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone size={12} /> {c.phone}</div>}
                  {c.linkedin && <div style={{ display: "flex", alignItems: "center", gap: 6 }}><LinkIcon size={12} /> {c.linkedin}</div>}
                </div>
                {linkedApp && <div style={{ marginTop: 10 }}><Badge color={stageInfo(linkedApp.stage).color} soft={stageInfo(linkedApp.stage).color + "1A"}>{linkedApp.role}</Badge></div>}
                {c.notes && <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8, fontStyle: "italic" }}>{c.notes}</div>}
              </div>
            );
          })}
        </div>
      )}
      {showAdd && <AddContactModal onClose={() => setShowAdd(false)} onCreate={(c) => { setContacts((prev) => [...prev, { id: uid(), notes: "", ...c }]); setShowAdd(false); }} />}
    </div>
  );
}

function AddContactModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", role: "", company: "", email: "", phone: "", linkedin: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Modal title="Add Contact" size="sm" onClose={onClose} footer={
      <><button className="jat-btn jat-btn-soft" onClick={onClose}>Cancel</button>
      <button className="jat-btn jat-btn-primary" disabled={!form.name} onClick={() => onCreate(form)}><Plus size={14} /> Add</button></>
    }>
      <div className="jat-field"><label>Full name</label><input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
      <div className="jat-field-row">
        <div className="jat-field"><label>Role</label><input value={form.role} onChange={(e) => set("role", e.target.value)} /></div>
        <div className="jat-field"><label>Company</label><input value={form.company} onChange={(e) => set("company", e.target.value)} /></div>
      </div>
      <div className="jat-field-row">
        <div className="jat-field"><label>Email</label><input value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
        <div className="jat-field"><label>Phone</label><input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
      </div>
      <div className="jat-field"><label>LinkedIn</label><input value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} /></div>
    </Modal>
  );
}

/* ============================================================================
   TEMPLATES
============================================================================ */

function TemplatesTab({ templates, setTemplates }) {
  const [active, setActive] = useState(templates[0]?.id || null);
  const [showAdd, setShowAdd] = useState(false);
  const activeTemplate = templates.find((t) => t.id === active);
  const categories = Array.from(new Set(templates.map((t) => t.category)));

  const update = (id, patch) => setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const remove = (id) => { setTemplates((prev) => prev.filter((t) => t.id !== id)); if (active === id) setActive(null); };

  return (
    <div>
      <div className="jat-page-head">
        <div><div className="jat-page-title">Email Templates</div><div className="jat-page-sub">Reusable drafts for every stage of outreach</div></div>
        <button className="jat-btn jat-btn-primary" onClick={() => setShowAdd(true)}><Plus size={15} /> New Template</button>
      </div>
      <div className="jat-templates-layout">
        <div className="jat-card" style={{ padding: 8, height: "fit-content" }}>
          {categories.map((cat) => (
            <div key={cat}>
              <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--text-3)", fontWeight: 700, padding: "10px 10px 4px" }}>{cat}</div>
              {templates.filter((t) => t.category === cat).map((t) => (
                <button key={t.id} onClick={() => setActive(t.id)} className="jat-nav-item" style={{ width: "100%", background: active === t.id ? "var(--accent-soft)" : "transparent", color: active === t.id ? "var(--accent-strong)" : "var(--text-2)" }}>
                  <Mail size={14} /> {t.name}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="jat-card" style={{ padding: 20 }}>
          {!activeTemplate ? (
            <EmptyState icon={<Mail size={30} />} title="Select a template" sub="Choose one from the list to view or edit it." />
          ) : (
            <TemplateEditor key={activeTemplate.id} template={activeTemplate} onUpdate={(p) => update(activeTemplate.id, p)} onDelete={() => remove(activeTemplate.id)} />
          )}
        </div>
      </div>
      {showAdd && <AddTemplateModal onClose={() => setShowAdd(false)} onCreate={(t) => { const id = uid(); setTemplates((prev) => [...prev, { id, ...t }]); setActive(id); setShowAdd(false); }} />}
    </div>
  );
}

function TemplateEditor({ template, onUpdate, onDelete }) {
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [aiOpen, setAiOpen] = useState(false);
  const dirty = subject !== template.subject || body !== template.body;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{template.name}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="jat-btn jat-btn-ghost" onClick={() => setAiOpen((v) => !v)}><Sparkles size={13} /> AI improve</button>
          <button className="jat-btn jat-btn-soft" onClick={() => navigator.clipboard && navigator.clipboard.writeText(subject + "\n\n" + body)}><Copy size={13} /> Copy</button>
          <button className="jat-btn jat-btn-danger" onClick={onDelete}><Trash2 size={13} /></button>
        </div>
      </div>
      {aiOpen && (
        <div style={{ marginBottom: 14 }}>
          <AIAssistBox mode="follow_up" context={{ company: "{{company}}", role: "{{role}}", notes: "Improve this existing template: " + body.slice(0, 400) }} />
        </div>
      )}
      <div className="jat-field"><label>Subject line</label><input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
      <div className="jat-field"><label>Body</label><textarea rows={14} value={body} onChange={(e) => setBody(e.target.value)} style={{ fontFamily: "monospace", fontSize: 12.5, lineHeight: 1.6 }} /></div>
      <div style={{ fontSize: 11.5, color: "var(--text-3)", marginBottom: 10 }}>Use placeholders like <code>{"{{company}}"}</code>, <code>{"{{role}}"}</code>, <code>{"{{hiring_manager}}"}</code>, <code>{"{{your_name}}"}</code>.</div>
      <button className="jat-btn jat-btn-primary" disabled={!dirty} onClick={() => onUpdate({ subject, body })}><Check size={14} /> Save changes</button>
    </div>
  );
}

function AddTemplateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: "", category: "Application", subject: "", body: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Modal title="New Template" size="md" onClose={onClose} footer={
      <><button className="jat-btn jat-btn-soft" onClick={onClose}>Cancel</button>
      <button className="jat-btn jat-btn-primary" disabled={!form.name} onClick={() => onCreate(form)}><Plus size={14} /> Create</button></>
    }>
      <div className="jat-field-row">
        <div className="jat-field"><label>Name</label><input value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div className="jat-field"><label>Category</label>
          <select value={form.category} onChange={(e) => set("category", e.target.value)}>
            {["Application", "Follow-up", "Thank You", "Networking", "Negotiation"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="jat-field"><label>Subject</label><input value={form.subject} onChange={(e) => set("subject", e.target.value)} /></div>
      <div className="jat-field"><label>Body</label><textarea rows={8} value={form.body} onChange={(e) => set("body", e.target.value)} /></div>
    </Modal>
  );
}

/* ============================================================================
   DOCUMENTS
============================================================================ */

function DocumentsTab({ documents, setDocuments, applications, userId }) {
  const fileRef = useRef(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const onFileSelected = (file) => { setUploadError(""); setPendingFile(file); };

  const saveDoc = async (meta) => {
    setUploading(true);
    setUploadError("");
    try {
      const path = `${userId}/${uid()}-${pendingFile.name}`;
      const { error: uploadErr } = await supabase.storage.from(DOCS_BUCKET).upload(path, pendingFile);
      if (uploadErr) throw uploadErr;
      const { data: pub } = supabase.storage.from(DOCS_BUCKET).getPublicUrl(path);
      setDocuments((prev) => [...prev, { id: uid(), name: pendingFile.name, url: pub.publicUrl, path, uploadedAt: todayISO(), appIds: [], ...meta }]);
      setPendingFile(null);
    } catch (err) {
      setUploadError(err.message || "Upload failed. Make sure the 'documents' storage bucket exists (see README).");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id) => {
    const doc = documents.find((d) => d.id === id);
    if (doc && doc.path) await supabase.storage.from(DOCS_BUCKET).remove([doc.path]);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };
  const toggleLink = (docId, appId) => setDocuments((prev) => prev.map((d) => d.id === docId ? { ...d, appIds: d.appIds.includes(appId) ? d.appIds.filter((x) => x !== appId) : [...d.appIds, appId] } : d));

  return (
    <div>
      <div className="jat-page-head">
        <div><div className="jat-page-title">Documents</div><div className="jat-page-sub">Resumes, cover letters, certificates, and portfolio files — synced to your account</div></div>
        <div>
          <input ref={fileRef} type="file" style={{ display: "none" }} onChange={(e) => e.target.files[0] && onFileSelected(e.target.files[0])} />
          <button className="jat-btn jat-btn-primary" onClick={() => fileRef.current.click()}><Upload size={15} /> Upload Document</button>
        </div>
      </div>

      {uploadError && <div style={{ color: "var(--danger)", fontSize: 12.5, marginBottom: 14 }}>{uploadError}</div>}

      {documents.length === 0 ? (
        <EmptyState icon={<FolderOpen size={30} />} title="No documents uploaded" sub="Upload resumes, cover letters, certificates, or portfolio files to keep everything in one place." />
      ) : (
        <div className="jat-grid-3">
          {documents.map((d) => (
            <div key={d.id} className="jat-card jat-doc-card">
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={18} color="var(--accent)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>{d.type} · {d.version} · {fmtDate(d.uploadedAt)}</div>
                </div>
                <button className="jat-btn-icon" onClick={() => remove(d.id)}><Trash2 size={13} /></button>
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <a href={d.url} target="_blank" rel="noopener noreferrer" className="jat-btn jat-btn-ghost" style={{ fontSize: 12 }}><ExternalLink size={12} /> Open</a>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 5, fontWeight: 600 }}>LINKED APPLICATIONS</div>
                <div className="jat-tag-row">
                  {applications.slice(0, 12).map((a) => (
                    <button key={a.id} onClick={() => toggleLink(d.id, a.id)}
                      className={`jat-chip ${d.appIds.includes(a.id) ? "active" : ""}`}
                      style={{ padding: "3px 9px", fontSize: 11 }}>
                      {a.company}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingFile && (
        <Modal title="Document Details" size="sm" onClose={() => setPendingFile(null)} footer={
          <><button className="jat-btn jat-btn-soft" onClick={() => setPendingFile(null)}>Cancel</button>
          <button className="jat-btn jat-btn-primary" disabled={uploading} onClick={() => saveDoc({ type: document.getElementById("doc-type").value, version: document.getElementById("doc-version").value })}>
            {uploading ? "Uploading…" : <><Check size={14} /> Save</>}
          </button></>
        }>
          <div className="jat-field"><label>File</label><input value={pendingFile.name} disabled /></div>
          <div className="jat-field"><label>Type</label>
            <select id="doc-type" defaultValue="Resume">
              {["Resume", "Cover Letter", "Certificate", "Portfolio", "Other"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="jat-field"><label>Version label</label><input id="doc-version" placeholder="e.g. v3 — Data Science focus" /></div>
        </Modal>
      )}
    </div>
  );
}

/* ============================================================================
   SETTINGS
============================================================================ */

function SettingsTab({ onExport, onImportClick, counts }) {
  return (
    <div>
      <div className="jat-page-head">
        <div><div className="jat-page-title">Settings</div><div className="jat-page-sub">Backup, stages, and workspace info</div></div>
      </div>

      <div className="jat-grid-2">
        <div className="jat-card jat-panel">
          <div className="jat-panel-title">Backup &amp; restore</div>
          <div className="jat-panel-sub">Your data lives in this browser session. Export regularly so nothing is lost on refresh.</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="jat-btn jat-btn-primary" onClick={onExport}><Download size={14} /> Export backup (.json)</button>
            <button className="jat-btn jat-btn-soft" onClick={onImportClick}><Upload size={14} /> Import backup</button>
          </div>
        </div>

        <div className="jat-card jat-panel">
          <div className="jat-panel-title">Pipeline stages</div>
          <div className="jat-panel-sub">Your customizable application stages</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {STAGES.map((s) => (
              <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color, display: "inline-block" }} /> {s.label}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 10 }}>Rename or reorder stages by editing the STAGES list in code — every board, chart, and filter updates automatically.</div>
        </div>

        <div className="jat-card jat-panel">
          <div className="jat-panel-title">Workspace snapshot</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Applications</span><strong>{counts.applications}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Contacts</span><strong>{counts.contacts}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Companies</span><strong>{counts.companies}</strong></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Documents</span><strong>{counts.documents}</strong></div>
          </div>
        </div>

        <div className="jat-card jat-panel">
          <div className="jat-panel-title">About Pathway</div>
          <div className="jat-panel-sub">A calm, single-dashboard job search tracker</div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.6 }}>
            Built for focus: one board for every application stage, a calendar for what's next, and AI assistance for the writing that usually stalls a search.
          </div>
        </div>
      </div>
    </div>
  );
}