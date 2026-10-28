import { useMemo, useState } from "react";
import { Breadcrumb, Button, Segmented, Tag } from "antd";
import { MdAccountBalance, MdOpenInNew, MdLanguage } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
import { useDarkMode } from "../../util/DarkModeContext";
import ResortBrandProfile from "./ResortBrandProfile";
import ResortWebContentEditor, { SITE_URL, TAB_PREVIEW } from "./ResortWebContentEditor";

export default function Manage_Resort() {
  const dark = useDarkMode();
  const location = useLocation();
  const brandOnly = location.pathname.includes("brand-profile");

  const [mainTab, setMainTab] = useState("website");
  const [cmsTab, setCmsTab] = useState("hero");

  const previewPath = TAB_PREVIEW[cmsTab] || "/";
  const previewUrl = `${SITE_URL}${previewPath}`;

  const pageBg = dark ? "bg-gray-900" : "bg-[#F0F4F8]";
  const headerBar = dark
    ? "border-gray-700/80 bg-gray-900/80"
    : "border-[#D9E2EC] bg-white/80";

  const mainTabOptions = useMemo(
    () => [
      {
        label: (
          <span className="inline-flex items-center justify-center gap-2 px-1 py-0.5 font-semibold text-sm">
            <MdLanguage size={18} />
            Guest website
          </span>
        ),
        value: "website",
      },
      {
        label: (
          <span className="inline-flex items-center justify-center gap-2 px-1 py-0.5 font-semibold text-sm">
            <MdAccountBalance size={18} />
            Brand profile
          </span>
        ),
        value: "brand",
      },
    ],
    []
  );

  if (brandOnly) {
    return <ResortBrandProfile showPageHeader />;
  }

  return (
    <div
      className={`w-full min-h-screen ${pageBg}`}
      style={{ fontFamily: "Inter, Poppins, sans-serif" }}
    >
      <header
        className={`sticky top-0 z-20 border-b backdrop-blur-md px-4 sm:px-6 lg:px-8 py-5 shadow-sm ${headerBar}`}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3 min-w-0">
            <Breadcrumb
              className="text-xs sm:text-sm"
              items={[
                { title: <Link to="/dashboard" className="hover:!text-[#FF6B00]">Dashboard</Link> },
                { title: <span className={dark ? "text-gray-400" : "text-[#829AB1]"}>Manager System</span> },
                { title: <span className={dark ? "text-gray-200" : "text-[#486581]"}>Manage Resort</span> },
              ]}
            />
            <div className="flex flex-wrap items-center gap-3">
              <h1 className={`text-xl sm:text-2xl font-bold tracking-tight m-0 ${dark ? "text-gray-100" : "text-[#102A43]"}`}>
                Manage Resort
              </h1>
              <Tag
                bordered={false}
                className="!m-0 !font-semibold !text-[11px] !px-2.5 !py-0.5 !rounded-md"
                color={dark ? "processing" : "orange"}
              >
                Solara
              </Tag>
              <code
                className={`text-[11px] sm:text-xs font-mono px-2.5 py-1 rounded-lg border ${
                  dark
                    ? "border-gray-600 bg-gray-800 text-gray-300"
                    : "border-[#D9E2EC] bg-[#F5F8FC] text-[#486581]"
                }`}
              >
                {SITE_URL}
              </code>
            </div>
            <p className={`text-sm m-0 max-w-2xl ${dark ? "text-gray-400" : "text-[#829AB1]"}`}>
              Headless CMS and central brand profile for the guest experience.
            </p>
          </div>

          {mainTab === "website" && (
            <Button
              type="primary"
              size="large"
              icon={<MdOpenInNew />}
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="manage-resort-preview-btn !h-11 !px-5 !font-semibold !bg-[#FF6B00] hover:!bg-[#e05e00] !border-none shrink-0"
            >
              Open Guest Website ↗
            </Button>
          )}
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <Segmented
          block
          size="large"
          value={mainTab}
          onChange={setMainTab}
          options={mainTabOptions}
          className={`manage-resort-segment mb-6 max-w-xl ${dark ? "manage-resort-segment-dark" : ""}`}
        />

        <div className="w-full">
          {mainTab === "website" ? (
            <ResortWebContentEditor activeTab={cmsTab} onActiveTabChange={setCmsTab} />
          ) : (
            <ResortBrandProfile showPageHeader={false} />
          )}
        </div>
      </div>
    </div>
  );
}
