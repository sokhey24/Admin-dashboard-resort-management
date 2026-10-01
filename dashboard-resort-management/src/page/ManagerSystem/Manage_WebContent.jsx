import { useEffect, useState, useCallback } from "react";
import { request } from "../../util/request";
import axios from "axios";
import config from "../../util/config";
import { MdSave, MdUpload, MdLanguage, MdClose, MdOpenInNew } from "react-icons/md";
import {
  FaHome, FaInfoCircle, FaConciergeBell, FaPhoneAlt,
  FaUsers, FaImage, FaRunning, FaBed, FaMapMarkerAlt,
  FaGlobe,
} from "react-icons/fa";
import { message, Spin } from "antd";
import { useDarkMode } from "../../util/DarkModeContext";

const API      = "admin/website-content";
const SITE_URL = "http://localhost:5500"; // adjust to your resort website port

// ── Page badge — shows which HTML page this section affects ──────
const PAGE_BADGES = {
  hero:       [{ label: "home.html",       color: "blue"   }],
  about:      [{ label: "aboutus.html",    color: "cyan"   }],
  service:    [{ label: "home.html",       color: "blue"   }],
  team:       [{ label: "aboutus.html",    color: "cyan"   }],
  contact:    [{ label: "home.html",       color: "blue"   }, { label: "aboutus.html", color: "cyan"   }],
  footer:     [{ label: "All pages",       color: "purple" }],
  banner:     [{ label: "aboutus.html",    color: "cyan"   }],
  activities: [{ label: "home.html",       color: "blue"   }, { label: "activities.html", color: "green" }],
  rooms:      [{ label: "home.html",       color: "blue"   }, { label: "room.html",       color: "orange" }],
  roomdetail: [{ label: "roomdetail.html", color: "red"    }],
};

// ── Section tab definitions ──────────────────────────────────────
const SECTIONS = [
  { key: "hero",       label: "Home",        icon: <FaHome />,         hint: "All editable content on home.html — hero, activities preview, rooms preview, service section, contact & footer" },
  { key: "about",      label: "About",       icon: <FaInfoCircle />,   hint: "About section title, description paragraph and side image" },
  { key: "service",    label: "Services",    icon: <FaConciergeBell />,hint: "Service section heading and the 4 service cards" },
  { key: "team",       label: "Team",        icon: <FaUsers />,        hint: "3 team member cards — name, role and photo" },
  { key: "contact",    label: "Contact",     icon: <FaPhoneAlt />,     hint: "Phone, email and address shown in footer & contact section" },
  { key: "footer",     label: "Footer",      icon: <FaGlobe />,        hint: "Logo shown in navbar & footer on every page, check-in/out times" },
  { key: "banner",     label: "Banners",     icon: <FaImage />,        hint: "3 rotating carousel banner images on About Us page" },
  { key: "activities", label: "Activities",  icon: <FaRunning />,      hint: "Page title, intro text and 6 activity cards" },
  { key: "rooms",      label: "Rooms",       icon: <FaBed />,          hint: "Page title, description and 6 room cards" },
  { key: "roomdetail", label: "Room Detail", icon: <FaBed />,          hint: "Room name, description, price, specs and gallery images" },
];

// ── Card groups — each group renders image + text fields together ─
const SITE = "http://localhost:5500/images/"; // resort website image base

const CARD_GROUPS = {
  hero: [
    // ── Hero ──────────────────────────────────────────────────────
    { groupLabel: "Hero Text", location: "Big title & subtitle over the video (home.html)", fields: [
      { key: "title",    label: "Title",    type: "text",     defaultValue: "Welcome to Solara Resort" },
      { key: "subtitle", label: "Subtitle", type: "textarea", defaultValue: "Luxury beachfront resort with world-class amenities, pristine beaches, and unforgettable experiences." },
    ]},
    { groupLabel: "Hero Background Video", location: "Fullscreen background video (home.html)", fields: [
      { key: "video", label: "Background Video (mp4/webm)", type: "video" },
    ]},
    // ── Activities Preview ────────────────────────────────────────
    { groupLabel: "Activities Preview — Card 1", location: "1st card in 'Explore Activities' section (home.html)", fields: [
      { key: "activities.card1_image", label: "Image", type: "image", defaultImage: `${SITE}activity1.jpg` },
      { key: "activities.card1_title", label: "Title", type: "text",  defaultValue: "The Retreat" },
      { key: "activities.card1_text",  label: "Text",  type: "text",  defaultValue: "Where Time Slows Down" },
    ]},
    { groupLabel: "Activities Preview — Card 2", location: "2nd card in 'Explore Activities' section (home.html)", fields: [
      { key: "activities.card2_image", label: "Image", type: "image", defaultImage: `${SITE}activity2.jpg` },
      { key: "activities.card2_title", label: "Title", type: "text",  defaultValue: "Luxury Spa" },
      { key: "activities.card2_text",  label: "Text",  type: "text",  defaultValue: "Relax your body and mind" },
    ]},
    { groupLabel: "Activities Preview — Card 3", location: "3rd card in 'Explore Activities' section (home.html)", fields: [
      { key: "activities.card3_image", label: "Image", type: "image", defaultImage: `${SITE}activity3.jpg` },
      { key: "activities.card3_title", label: "Title", type: "text",  defaultValue: "Ocean Adventure" },
      { key: "activities.card3_text",  label: "Text",  type: "text",  defaultValue: "Enjoy unforgettable experiences" },
    ]},
    // ── Rooms Preview ─────────────────────────────────────────────
    { groupLabel: "Rooms Preview — Card 1", location: "1st card in 'Choose Your Perfect Room' section (home.html)", fields: [
      { key: "rooms.card1_image", label: "Image", type: "image", defaultImage: `${SITE}room1.png` },
      { key: "rooms.card1_title", label: "Title", type: "text",  defaultValue: "Junior Villa One Bedroom" },
    ]},
    { groupLabel: "Rooms Preview — Card 2", location: "2nd card in 'Choose Your Perfect Room' section (home.html)", fields: [
      { key: "rooms.card2_image", label: "Image", type: "image", defaultImage: `${SITE}room2.png` },
      { key: "rooms.card2_title", label: "Title", type: "text",  defaultValue: "Premium Triple Balcony Sea View" },
    ]},
    { groupLabel: "Rooms Preview — Card 3", location: "3rd card in 'Choose Your Perfect Room' section (home.html)", fields: [
      { key: "rooms.card3_image", label: "Image", type: "image", defaultImage: `${SITE}room.jpg` },
      { key: "rooms.card3_title", label: "Title", type: "text",  defaultValue: "Deluxe Twin Room" },
    ]},
    { groupLabel: "Rooms Preview — Card 4", location: "4th card in 'Choose Your Perfect Room' section (home.html)", fields: [
      { key: "rooms.card4_image", label: "Image", type: "image", defaultImage: `${SITE}room3.png` },
      { key: "rooms.card4_title", label: "Title", type: "text",  defaultValue: "Deluxe Double Room" },
    ]},
    // ── Service Section ───────────────────────────────────────────
    { groupLabel: "Service — Section Header", location: "Heading & description of Service section (home.html)", fields: [
      { key: "service.title",       label: "Section Title",       type: "text",     defaultValue: "SERVICE" },
      { key: "service.description", label: "Section Description", type: "textarea", defaultValue: "Lorem ipsum dolor sit amet consectetur adipisicing elit." },
    ]},
    { groupLabel: "Service — Card 1 (Swimming Pool)", location: "Service card 1 (home.html)", fields: [
      { key: "service.card1_title", label: "Title", type: "text", defaultValue: "Swimming Pool" },
      { key: "service.card1_text",  label: "Text",  type: "text", defaultValue: "Take a dip into our infinity swimming pool." },
    ]},
    { groupLabel: "Service — Card 2 (Free Wi-Fi)", location: "Service card 2 (home.html)", fields: [
      { key: "service.card2_title", label: "Title", type: "text", defaultValue: "Free Wi-Fi" },
      { key: "service.card2_text",  label: "Text",  type: "text", defaultValue: "Offer free Wi-Fi throughout the resort." },
    ]},
    { groupLabel: "Service — Card 3 (Ferry Service)", location: "Service card 3 (home.html)", fields: [
      { key: "service.card3_title", label: "Title", type: "text", defaultValue: "Ferry Service" },
      { key: "service.card3_text",  label: "Text",  type: "text", defaultValue: "Ferry ticket arrangement is available here." },
    ]},
    { groupLabel: "Service — Card 4 (Food & Drink)", location: "Service card 4 (home.html)", fields: [
      { key: "service.card4_title", label: "Title", type: "text", defaultValue: "Food & Drink" },
      { key: "service.card4_text",  label: "Text",  type: "text", defaultValue: "Great offers on a range of food and drinks." },
    ]},
    // ── Footer / Contact ──────────────────────────────────────────
    { groupLabel: "Contact Info", location: "Footer contact box (home.html)", fields: [
      { key: "contact.phone",   label: "Phone",   type: "text", defaultValue: "(+855) 78 888 090" },
      { key: "contact.email",   label: "Email",   type: "text", defaultValue: "info@solararesort.com" },
      { key: "contact.address", label: "Address", type: "text", defaultValue: "Cambodia" },
    ]},
    { groupLabel: "Footer Logo & Times", location: "Navbar logo & footer check-in/out (home.html)", fields: [
      { key: "footer.logo",      label: "Logo Image",     type: "image", defaultImage: `${SITE}logo.png` },
      { key: "footer.checkin",   label: "Check-in Time",  type: "text",  defaultValue: "14:00" },
      { key: "footer.checkout",  label: "Check-out Time", type: "text",  defaultValue: "12:00" },
    ]},
  ],
  about: [
    { groupLabel: "About Text", location: "Left side of About section", fields: [
      { key: "title",       label: "Title",       type: "text",     defaultValue: "About Resort" },
      { key: "description", label: "Description", type: "textarea", defaultValue: "Experience and comfort with beautiful ocean views, modern facilities and unforgettable memories. Escape to paradise where luxury meets nature." },
    ]},
    { groupLabel: "About Image", location: "Right side of About section", fields: [
      { key: "image", label: "Image", type: "image", defaultImage: `${SITE}swimmingpool.jpg` },
    ]},
  ],
  service: [
    { groupLabel: "Section Header", location: "Top of Service section", fields: [
      { key: "title",       label: "Section Title",       type: "text",     defaultValue: "SERVICE" },
      { key: "description", label: "Section Description", type: "textarea", defaultValue: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestias nisi eligendi odit! Consequatur necessitatibus quaerat inventore maiores." },
    ]},
    { groupLabel: "Card 1 — Swimming Pool", location: "Service card 1", fields: [
      { key: "card1_title", label: "Title", type: "text", defaultValue: "Swimming Pool" },
      { key: "card1_text",  label: "Text",  type: "text", defaultValue: "Take a dip into our infinity swimming pool." },
    ]},
    { groupLabel: "Card 2 — Free Wi-Fi", location: "Service card 2", fields: [
      { key: "card2_title", label: "Title", type: "text", defaultValue: "Free Wi-Fi" },
      { key: "card2_text",  label: "Text",  type: "text", defaultValue: "Offer free Wi-Fi throughout the resort." },
    ]},
    { groupLabel: "Card 3 — Ferry Service", location: "Service card 3", fields: [
      { key: "card3_title", label: "Title", type: "text", defaultValue: "Ferry Service" },
      { key: "card3_text",  label: "Text",  type: "text", defaultValue: "Ferry ticket arrangement is available here." },
    ]},
    { groupLabel: "Card 4 — Food & Drink", location: "Service card 4", fields: [
      { key: "card4_title", label: "Title", type: "text", defaultValue: "Food & Drink" },
      { key: "card4_text",  label: "Text",  type: "text", defaultValue: "Great offers on a range of food and drinks." },
    ]},
  ],
  team: [
    { groupLabel: "Team Member 1", location: "First team card", fields: [
      { key: "member1_image", label: "Photo", type: "image", defaultImage: `${SITE}manager.jpg` },
      { key: "member1_name",  label: "Name",  type: "text",  defaultValue: "Alex Johnson" },
      { key: "member1_role",  label: "Role",  type: "text",  defaultValue: "Resort Manager" },
    ]},
    { groupLabel: "Team Member 2", location: "Second team card", fields: [
      { key: "member2_image", label: "Photo", type: "image", defaultImage: `${SITE}housekeeping.jpg` },
      { key: "member2_name",  label: "Name",  type: "text",  defaultValue: "Cheng Dara" },
      { key: "member2_role",  label: "Role",  type: "text",  defaultValue: "Housekeeping Supervisor" },
    ]},
    { groupLabel: "Team Member 3", location: "Third team card", fields: [
      { key: "member3_image", label: "Photo", type: "image", defaultImage: `${SITE}fontdesk.jpg` },
      { key: "member3_name",  label: "Name",  type: "text",  defaultValue: "Cheng Dara" },
      { key: "member3_role",  label: "Role",  type: "text",  defaultValue: "Front Desk Supervisor" },
    ]},
  ],
  contact: [
    { groupLabel: "Contact Info", location: "Footer & Contact section on all pages", fields: [
      { key: "phone",   label: "Phone",   type: "text", defaultValue: "(+855) 78 888 090" },
      { key: "email",   label: "Email",   type: "text", defaultValue: "info@solararesort.com" },
      { key: "address", label: "Address", type: "text", defaultValue: "Cambodia" },
    ]},
  ],
  footer: [
    { groupLabel: "Logo", location: "Navbar & footer logo on every page", fields: [
      { key: "logo", label: "Logo Image", type: "image", defaultImage: `${SITE}logo.png` },
    ]},
    { groupLabel: "Check-in / Check-out", location: "Footer contact box on every page", fields: [
      { key: "checkin",   label: "Check-in Time",  type: "text", defaultValue: "14:00" },
      { key: "checkout",  label: "Check-out Time", type: "text", defaultValue: "12:00" },
      { key: "copyright", label: "Copyright Text", type: "text", defaultValue: "© 2025 Solara Resort" },
    ]},
  ],
  banner: [
    { groupLabel: "Banner 1", location: "First slide of hero carousel (aboutus.html)", fields: [
      { key: "banner1", label: "Banner Image 1", type: "image", defaultImage: `${SITE}banner.jpg` },
    ]},
    { groupLabel: "Banner 2", location: "Second slide of hero carousel (aboutus.html)", fields: [
      { key: "banner2", label: "Banner Image 2", type: "image", defaultImage: `${SITE}banner1.png` },
    ]},
    { groupLabel: "Banner 3", location: "Third slide of hero carousel (aboutus.html)", fields: [
      { key: "banner3", label: "Banner Image 3", type: "image", defaultImage: `${SITE}massage.jpg` },
    ]},
  ],
  activities: [
    { groupLabel: "Page Header", location: "Top of activities.html", fields: [
      { key: "title",       label: "Page Title", type: "text",     defaultValue: "ACTIVITIES" },
      { key: "description", label: "Intro Text", type: "textarea", defaultValue: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Porro libero deleniti perspiciatis, consequatur dignissimos accusantium magni harum doloribus officiis laboriosam." },
    ]},
    { groupLabel: "Activity Card 1", location: "Card 1 on activities.html", fields: [
      { key: "card1_image", label: "Image", type: "image", defaultImage: `${SITE}activity5.jpg` },
      { key: "card1_title", label: "Title", type: "text",  defaultValue: "Jet Ski Adventures" },
      { key: "card1_text",  label: "Text",  type: "text",  defaultValue: "Ride the waves on our high-speed jet skis." },
    ]},
    { groupLabel: "Activity Card 2", location: "Card 2 on activities.html", fields: [
      { key: "card2_image", label: "Image", type: "image", defaultImage: `${SITE}kayak.jpg` },
      { key: "card2_title", label: "Title", type: "text",  defaultValue: "Kayaking" },
      { key: "card2_text",  label: "Text",  type: "text",  defaultValue: "Explore the coastline by kayak." },
    ]},
    { groupLabel: "Activity Card 3", location: "Card 3 on activities.html", fields: [
      { key: "card3_image", label: "Image", type: "image", defaultImage: `${SITE}beach party.jpg` },
      { key: "card3_title", label: "Title", type: "text",  defaultValue: "Beach Party" },
      { key: "card3_text",  label: "Text",  type: "text",  defaultValue: "Join our legendary beachside parties." },
    ]},
    { groupLabel: "Activity Card 4", location: "Card 4 on activities.html", fields: [
      { key: "card4_image", label: "Image", type: "image", defaultImage: `${SITE}resorttour.jpg` },
      { key: "card4_title", label: "Title", type: "text",  defaultValue: "Resort Tour" },
      { key: "card4_text",  label: "Text",  type: "text",  defaultValue: "Discover every corner of our resort." },
    ]},
    { groupLabel: "Activity Card 5", location: "Card 5 on activities.html", fields: [
      { key: "card5_image", label: "Image", type: "image", defaultImage: `${SITE}waterpark.jpg` },
      { key: "card5_title", label: "Title", type: "text",  defaultValue: "Water Park" },
      { key: "card5_text",  label: "Text",  type: "text",  defaultValue: "Splash and play at our water park." },
    ]},
    { groupLabel: "Activity Card 6", location: "Card 6 on activities.html", fields: [
      { key: "card6_image", label: "Image", type: "image", defaultImage: `${SITE}swimmingpool.jpg` },
      { key: "card6_title", label: "Title", type: "text",  defaultValue: "Swimming Pool" },
      { key: "card6_text",  label: "Text",  type: "text",  defaultValue: "Relax in our infinity swimming pool." },
    ]},
  ],
  rooms: [
    { groupLabel: "Page Header", location: "Top of room.html", fields: [
      { key: "title",       label: "Page Title",  type: "text",     defaultValue: "Captivating Rooms & Suites" },
      { key: "description", label: "Description", type: "textarea", defaultValue: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Reprehenderit quia voluptate aspernatur minima consequatur ducimus, distinctio quidem illum necessitatibus omnis." },
    ]},
    { groupLabel: "Room Card 1", location: "Room card 1 on room.html", fields: [
      { key: "card1_image", label: "Image", type: "image", defaultImage: `${SITE}room1.png` },
      { key: "card1_title", label: "Title", type: "text",  defaultValue: "Junior Villa One Bedroom" },
    ]},
    { groupLabel: "Room Card 2", location: "Room card 2 on room.html", fields: [
      { key: "card2_image", label: "Image", type: "image", defaultImage: `${SITE}room2.png` },
      { key: "card2_title", label: "Title", type: "text",  defaultValue: "Premium Triple Balcony Sea View" },
    ]},
    { groupLabel: "Room Card 3", location: "Room card 3 on room.html", fields: [
      { key: "card3_image", label: "Image", type: "image", defaultImage: `${SITE}room2.png` },
      { key: "card3_title", label: "Title", type: "text",  defaultValue: "Deluxe Twin Room" },
    ]},
    { groupLabel: "Room Card 4", location: "Room card 4 on room.html", fields: [
      { key: "card4_image", label: "Image", type: "image", defaultImage: `${SITE}room3.png` },
      { key: "card4_title", label: "Title", type: "text",  defaultValue: "Deluxe Double Room" },
    ]},
    { groupLabel: "Room Card 5", location: "Room card 5 on room.html", fields: [
      { key: "card5_image", label: "Image", type: "image", defaultImage: `${SITE}room.jpg` },
      { key: "card5_title", label: "Title", type: "text",  defaultValue: "Prince Villa 4 Bedrooms" },
    ]},
    { groupLabel: "Room Card 6", location: "Room card 6 on room.html", fields: [
      { key: "card6_image", label: "Image", type: "image", defaultImage: `${SITE}room2.png` },
      { key: "card6_title", label: "Title", type: "text",  defaultValue: "Deluxe One Room" },
    ]},
  ],
  roomdetail: [
    { groupLabel: "Room Info", location: "Right panel on roomdetail.html", fields: [
      { key: "title",       label: "Room Name",   type: "text",     defaultValue: "Junior Villa One Bedroom" },
      { key: "description", label: "Description", type: "textarea", defaultValue: "" },
      { key: "price",       label: "Price",       type: "text",     defaultValue: "From $250 per night" },
      { key: "capacity",    label: "Capacity",    type: "text",     defaultValue: "Sleep 4" },
      { key: "size",        label: "Room Size",   type: "text",     defaultValue: "65 sqm" },
      { key: "view",        label: "View Type",   type: "text",     defaultValue: "Sunrise" },
    ]},
    ...[1,2,3,4,5].map(n => ({
      groupLabel: `Gallery Image ${n}`,
      location:   `Image ${n} in room gallery on roomdetail.html`,
      fields: [
        { key: `image${n}`, label: `Gallery Image ${n}`, type: "image" },
      ],
    })),
  ],
};

// ── Status badges ────────────────────────────────────────────────
function LiveBadge({ dark }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
      dark ? "bg-green-900/40 text-green-400" : "bg-[#DCFCE7] text-[#16A34A]"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${dark ? "bg-green-400" : "bg-[#16A34A]"}`} />
      Live
    </span>
  );
}
function DefaultBadge({ dark }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
      dark ? "bg-gray-700 text-gray-400 border-gray-600" : "bg-[#F5F8FC] text-[#829AB1] border-[#D9E2EC]"
    }`}>
      Default
    </span>
  );
}

// ── Single video upload field ────────────────────────────────────
const VIDEO_MAX_MB = 200;

function VideoUpload({ section, fieldKey, label, currentUrl, currentId, onSaved }) {
  const dark = useDarkMode();
  const [file,     setFile]     = useState(null);
  const [progress, setProgress] = useState(0);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isLive  = !!currentUrl && !file;
  const preview = file ? URL.createObjectURL(file) : (currentUrl ?? null);

  const getToken = () => {
    try { return JSON.parse(localStorage.getItem("ResortProfileStore"))?.state?.access_token || null; }
    catch { return null; }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > VIDEO_MAX_MB * 1024 * 1024) {
      message.error(`Video is too large. Maximum allowed size is ${VIDEO_MAX_MB} MB. Your file is ${(f.size / 1024 / 1024).toFixed(1)} MB.`);
      e.target.value = "";
      return;
    }
    setFile(f);
    setProgress(0);
  };

  const handleSave = async () => {
    if (!file) return;
    setSaving(true);
    setProgress(0);
    const fd = new FormData();
    fd.append("section", section);
    fd.append("key", fieldKey);
    fd.append("image", file);
    try {
      await axios.post(config.base_url + API, fd, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        timeout: 0,
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      message.success(`${label} uploaded successfully`);
      setFile(null);
      setProgress(0);
      onSaved();
    } catch (err) {
      const msg = err.response?.data?.message
        ?? err.response?.data?.errors?.image?.[0]
        ?? `Upload failed (HTTP ${err.response?.status ?? 'no response'})`;
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentId) return;
    setDeleting(true);
    const res = await request(`${API}/${currentId}/image`, "delete");
    setDeleting(false);
    if (!res?.errors) { message.success(`${label} removed`); onSaved(); }
    else message.error("Failed to delete video");
  };

  const id = `vid-${section}-${fieldKey}`;
  const borderColor = file ? "border-[#FF6B00]" : isLive ? "border-[#86EFAC]" : (dark ? "border-gray-600" : "border-[#D9E2EC]");
  const labelCls = `text-[14px] font-semibold ${dark ? "text-gray-300" : "text-[#486581]"}`;
  const mutedCls = `text-[12px] ${dark ? "text-gray-500" : "text-[#829AB1]"}`;
  const fileBtn = `flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-semibold cursor-pointer border transition-colors ${
    dark ? "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700" : "border-[#D9E2EC] bg-white text-[#486581] hover:bg-[#F5F8FC]"
  } ${saving ? "pointer-events-none opacity-50" : ""}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={labelCls}>{label}</span>
        {isLive && <LiveBadge dark={dark} />}
        {!currentUrl && !file && <DefaultBadge dark={dark} />}
        <span className={`ml-auto ${mutedCls}`}>Max {VIDEO_MAX_MB} MB &middot; mp4 / webm / mov</span>
      </div>

      <div className={`relative rounded-[10px] overflow-hidden border-2 ${borderColor} ${dark ? "bg-gray-700" : "bg-[#F5F8FC]"} transition-colors`} style={{ height: 200 }}>
        {preview ? (
          <>
            <video key={preview} src={preview} className="w-full h-full object-cover" muted autoPlay loop />
            <span className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${
              file ? "bg-[#FF6B00]" : "bg-[#16A34A]"
            }`}>{file ? "Unsaved" : "Live"}</span>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <FaImage size={32} className={dark ? "text-gray-500" : "text-[#D9E2EC]"} />
            <span className={`text-[13px] ${dark ? "text-gray-300" : "text-[#486581]"}`}>No video uploaded — default video will play</span>
            <span className={mutedCls}>Accepted: mp4, webm, mov &middot; Max {VIDEO_MAX_MB} MB</span>
          </div>
        )}
      </div>

      {saving && (
        <div className="w-full">
          <div className={`flex justify-between text-[12px] mb-1 ${dark ? "text-gray-400" : "text-[#486581]"}`}>
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${dark ? "bg-gray-600" : "bg-[#D9E2EC]"}`}>
            <div className="h-full bg-[#FF6B00] rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <label htmlFor={id} className={fileBtn}>
          <MdUpload size={14} /> {isLive ? "Replace" : "Choose file"}
        </label>
        <input id={id} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleFileChange} className="hidden" disabled={saving} />
        {isLive && !file && (
          <button onClick={handleDelete} disabled={deleting || saving}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-semibold border disabled:opacity-60 transition-colors ${
              dark ? "bg-red-900/40 text-red-400 border-red-800 hover:bg-red-900/70" : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
            }`}>
            <MdClose size={14} /> {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
        {file && (
          <>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-semibold bg-[#FF6B00] text-white hover:bg-[#e05e00] disabled:opacity-60 transition-colors">
              <MdSave size={14} /> {saving ? `Uploading ${progress}%` : "Upload"}
            </button>
            {!saving && (
              <button onClick={() => { setFile(null); setProgress(0); }}
                className={`p-1.5 rounded-[8px] transition-colors ${dark ? "text-gray-400 hover:text-gray-100 hover:bg-gray-700" : "text-[#829AB1] hover:text-[#102A43] hover:bg-[#F5F8FC]"}`}>
                <MdClose size={14} />
              </button>
            )}
            <span className={`text-[12px] ${dark ? "text-gray-400" : "text-[#486581]"}`}>
              {file.name} &middot; {(file.size / 1024 / 1024).toFixed(1)} MB
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Single image upload field ────────────────────────────────────
function ImageUpload({ section, fieldKey, label, currentUrl, currentId, defaultImage, onSaved }) {
  const dark = useDarkMode();
  const [file,     setFile]     = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isLive    = !!currentUrl && !file;
  const isDefault = !currentUrl && !!defaultImage && !file;
  const preview   = file ? URL.createObjectURL(file) : (currentUrl ?? defaultImage ?? null);

  const handleSave = async () => {
    if (!file) return;
    setSaving(true);
    const fd = new FormData();
    fd.append("section", section);
    fd.append("key", fieldKey);
    fd.append("image", file);
    const res = await request(API, "post", fd);
    setSaving(false);
    if (!res?.errors) { message.success(`${label} updated`); setFile(null); onSaved(); }
    else message.error("Failed to upload image");
  };

  const handleDelete = async () => {
    if (!currentId) return;
    setDeleting(true);
    const res = await request(`${API}/${currentId}/image`, "delete");
    setDeleting(false);
    if (!res?.errors) { message.success(`${label} reset to default`); onSaved(); }
    else message.error("Failed to delete image");
  };

  const id = `img-${section}-${fieldKey}`;
  const borderColor = file
    ? "border-[#FF6B00]"
    : isLive ? "border-[#86EFAC]" : (dark ? "border-gray-600" : "border-[#D9E2EC]");
  const fileBtn = `flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-semibold cursor-pointer border transition-colors ${
    dark ? "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700" : "border-[#D9E2EC] bg-white text-[#486581] hover:bg-[#F5F8FC]"
  }`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={`text-[14px] font-semibold ${dark ? "text-gray-300" : "text-[#486581]"}`}>{label}</span>
        {isLive && <LiveBadge dark={dark} />}
        {isDefault && <DefaultBadge dark={dark} />}
      </div>
      <div className={`relative rounded-[10px] overflow-hidden border-2 ${borderColor} ${dark ? "bg-gray-700" : "bg-[#F5F8FC]"} transition-colors`} style={{ height: 160 }}>
        {preview ? (
          <>
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            <span className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${
              file ? "bg-[#FF6B00]" : isDefault ? "bg-[#829AB1]" : "bg-[#16A34A]"
            }`}>{file ? "Unsaved" : isDefault ? "Default" : "Live"}</span>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <FaImage size={32} className={dark ? "text-gray-500" : "text-[#D9E2EC]"} />
            <span className={`text-[13px] ${dark ? "text-gray-400" : "text-[#486581]"}`}>No image set</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <label htmlFor={id} className={fileBtn}>
          <MdUpload size={14} /> {isLive ? "Replace" : "Choose file"}
        </label>
        <input id={id} type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) setFile(f); }} className="hidden" />
        {isLive && !file && (
          <button onClick={handleDelete} disabled={deleting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-semibold border disabled:opacity-60 transition-colors ${
              dark ? "bg-red-900/40 text-red-400 border-red-800 hover:bg-red-900/70" : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
            }`}>
            <MdClose size={14} /> {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
        {file && (
          <>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-semibold bg-[#FF6B00] text-white hover:bg-[#e05e00] disabled:opacity-60 transition-colors">
              <MdSave size={14} /> {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setFile(null)}
              className={`p-1.5 rounded-[8px] transition-colors ${dark ? "text-gray-400 hover:text-gray-100 hover:bg-gray-700" : "text-[#829AB1] hover:text-[#102A43] hover:bg-[#F5F8FC]"}`}>
              <MdClose size={14} />
            </button>
            <span className={`text-[12px] truncate max-w-[120px] ${dark ? "text-gray-400" : "text-[#486581]"}`}>{file.name}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Single text/textarea field ───────────────────────────────────
function TextInput({ section, fieldKey, label, type, defaultValue, currentValue, onSaved }) {
  const dark = useDarkMode();
  const [value,  setValue]  = useState(currentValue ?? defaultValue ?? "");
  const [saving, setSaving] = useState(false);
  const [dirty,  setDirty]  = useState(false);

  useEffect(() => { setValue(currentValue ?? defaultValue ?? ""); setDirty(false); }, [currentValue, defaultValue]);

  const handleSave = async () => {
    setSaving(true);
    const fd = new FormData();
    fd.append("section", section); fd.append("key", fieldKey); fd.append("value", value);
    const res = await request(API, "post", fd);
    setSaving(false);
    if (!res?.errors) { message.success(`${label} saved`); setDirty(false); onSaved(); }
    else message.error("Failed to save");
  };

  const isLive    = !!currentValue && !dirty;
  const isDefault = !currentValue && !!defaultValue && !dirty;

  const borderColor = dirty ? "border-[#FF6B00]" : isLive ? "border-[#86EFAC]" : (dark ? "border-gray-600" : "border-[#D9E2EC]");
  const inputCls = `w-full border ${borderColor} rounded-[10px] px-5 py-3 text-[17px] focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 transition-colors placeholder:text-[#829AB1] font-[Inter,Poppins,sans-serif] ${
    dark ? "text-gray-100 bg-gray-700" : "text-[#102A43] bg-white"
  }`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <label className={`text-[14px] font-semibold ${dark ? "text-gray-300" : "text-[#486581]"}`}>{label}</label>
        {isLive && <LiveBadge dark={dark} />}
        {isDefault && <DefaultBadge dark={dark} />}
      </div>
      {type === "textarea"
        ? <textarea rows={3} value={value} onChange={e => { setValue(e.target.value); setDirty(true); }} className={inputCls} />
        : <input type="text" value={value} onChange={e => { setValue(e.target.value); setDirty(true); }} className={inputCls} />
      }
      {dirty && (
        <button onClick={handleSave} disabled={saving}
          className="self-start flex items-center gap-1.5 px-4 py-1.5 rounded-[8px] text-[13px] font-semibold bg-[#FF6B00] text-white hover:bg-[#e05e00] disabled:opacity-60 transition-colors">
          <MdSave size={13} /> {saving ? "Saving…" : "Save changes"}
        </button>
      )}
    </div>
  );
}

// ── Card group ───────────────────────────────────────────────────
function resolveField(field, section, allContent) {
  if (field.key.includes(".")) {
    const [sec, k] = field.key.split(".");
    return { sec, k, data: allContent?.[sec]?.[k] };
  }
  return { sec: section, k: field.key, data: allContent?.[section]?.[field.key] };
}

function CardGroup({ group, section, allContent, onSaved }) {
  const dark = useDarkMode();
  const imageFields = group.fields.filter(f => f.type === "image");
  const videoFields = group.fields.filter(f => f.type === "video");
  const textFields  = group.fields.filter(f => f.type !== "image" && f.type !== "video");

  const firstTextField = textFields[0];
  const firstResolved  = firstTextField ? resolveField(firstTextField, section, allContent) : null;
  const cardName       = firstResolved ? (firstResolved.data?.value || firstTextField.defaultValue || "") : "";
  const cleanLocation  = group.location
    .replace(/\s*\([^)]*\.html\)/gi, "")
    .replace(/\s+on\s+\S+\.html/gi, "")
    .replace(/\s+of\s+\S+\.html/gi, "")
    .replace(/\s+\S+\.html/gi, "");

  return (
    <div className={`rounded-xl p-6 border ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]"}`}>
      <div className={`flex items-center gap-2 mb-5 pb-4 border-b ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
        <span className={`text-[15px] font-bold ${dark ? "text-gray-100" : "text-[#102A43]"}`}>{group.groupLabel}</span>
        {imageFields.length > 0 && cardName && (
          <span className={`text-[12px] font-semibold px-2.5 py-0.5 rounded-full border ${
            dark ? "bg-orange-900/30 text-[#FF6B00] border-orange-800" : "bg-[#FFF3E8] text-[#FF6B00] border-[#FFD4A8]"
          }`}>
            {cardName}
          </span>
        )}
        <span className={`flex items-center gap-1 text-[13px] ml-1 ${dark ? "text-gray-500" : "text-[#829AB1]"}`}>
          <FaMapMarkerAlt size={10} /> {cleanLocation}
        </span>
      </div>

      {videoFields.length > 0 && textFields.length === 0 && imageFields.length === 0 && (
        <div className="flex flex-col gap-5">
          {videoFields.map(f => {
            const { sec, k, data } = resolveField(f, section, allContent);
            return <VideoUpload key={f.key} section={sec} fieldKey={k} label={f.label}
              currentUrl={data?.image_url ?? null} currentId={data?.id ?? null} onSaved={onSaved} />;
          })}
        </div>
      )}

      {imageFields.length > 0 && textFields.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-5">
          <div>
            {imageFields.map(f => {
              const { sec, k, data } = resolveField(f, section, allContent);
              return <ImageUpload key={f.key} section={sec} fieldKey={k} label={f.label}
                currentUrl={data?.image_url ?? null} currentId={data?.id ?? null}
                defaultImage={f.defaultImage} onSaved={onSaved} />;
            })}
          </div>
          <div className="flex flex-col gap-4">
            {textFields.map(f => {
              const { sec, k, data } = resolveField(f, section, allContent);
              return <TextInput key={f.key} section={sec} fieldKey={k} label={f.label}
                type={f.type} defaultValue={f.defaultValue}
                currentValue={data?.value ?? null} onSaved={onSaved} />;
            })}
          </div>
        </div>
      ) : imageFields.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {imageFields.map(f => {
            const { sec, k, data } = resolveField(f, section, allContent);
            return <ImageUpload key={f.key} section={sec} fieldKey={k} label={f.label}
              currentUrl={data?.image_url ?? null} currentId={data?.id ?? null}
              defaultImage={f.defaultImage} onSaved={onSaved} />;
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {textFields.map(f => {
            const { sec, k, data } = resolveField(f, section, allContent);
            return (
              <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                <TextInput section={sec} fieldKey={k} label={f.label}
                  type={f.type} defaultValue={f.defaultValue}
                  currentValue={data?.value ?? null} onSaved={onSaved} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Manage_WebContent() {
  const dark = useDarkMode();
  const [content,   setContent]   = useState({});
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState("hero");

  const load = useCallback(() => {
    setLoading(true);
    request(API, "get")
      .then(res => { if (res?.data) setContent(res.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const groups = CARD_GROUPS[activeTab] ?? [];

  return (
    <div className={`min-h-full rounded-xl p-6 transition-colors duration-200 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-[26px] font-bold flex items-center gap-2.5 ${dark ? "text-gray-100" : "text-[#102A43]"}`}>
            <MdLanguage className="text-[#FF6B00]" size={26} />
            Website Content Manager
          </h2>
          <p className={`text-[15px] mt-1 ${dark ? "text-gray-400" : "text-[#486581]"}`}>
            Changes save instantly and reflect live on the resort website
          </p>
        </div>
        <a href={SITE_URL} target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[14px] font-semibold bg-[#FF6B00] text-white hover:bg-[#e05e00] transition-colors shadow-sm">
          <MdOpenInNew size={15} /> Open Website
        </a>
      </div>

      <div className={`rounded-xl shadow-sm overflow-hidden border ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]"}`}>

        <div className={`flex overflow-x-auto border-b ${dark ? "border-gray-700 bg-gray-900/50" : "border-[#D9E2EC] bg-[#F5F8FC]"}`}>
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => setActiveTab(s.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-[14px] font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === s.key
                  ? dark
                    ? "border-[#FF6B00] text-[#FF6B00] bg-gray-800"
                    : "border-[#FF6B00] text-[#FF6B00] bg-white"
                  : dark
                    ? "border-transparent text-gray-400 hover:text-gray-100 hover:bg-gray-800/70"
                    : "border-transparent text-[#486581] hover:text-[#102A43] hover:bg-white/70"
              }`}>
              <span className="text-[13px]">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          <Spin spinning={loading}>
            <div className="space-y-4">
              {groups.map((g, i) => (
                <CardGroup key={i} group={g} section={activeTab}
                  allContent={content} onSaved={load} />
              ))}
            </div>
          </Spin>
        </div>
      </div>
    </div>
  );
}
