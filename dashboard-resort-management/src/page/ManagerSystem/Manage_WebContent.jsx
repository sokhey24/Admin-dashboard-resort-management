import { useState } from "react";
import { Button, Typography } from "antd";
import { MdOpenInNew } from "react-icons/md";
import ResortWebContentEditor, { SITE_URL, TAB_PREVIEW } from "./ResortWebContentEditor";

export default function Manage_WebContent() {
  const [activeTab, setActiveTab] = useState("hero");
  const previewPath = TAB_PREVIEW[activeTab] || "/";
  const previewUrl = `${SITE_URL}${previewPath}`;

  return (
    <div className="min-h-full bg-[#F0F4F8]">
      <div
        className="sticky top-0 z-20 border-b border-[#D9E2EC] bg-white/95 backdrop-blur px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm"
      >
        <div>
          <Typography.Title level={4} className="!mb-0 !text-[#102A43]">
            Solara Resort — Web Content Management
          </Typography.Title>
          <Typography.Text type="secondary" className="text-sm">
            Headless CMS for the guest site at{" "}
            <code className="text-xs bg-[#F5F8FC] px-1 rounded">{SITE_URL}</code>
          </Typography.Text>
        </div>
        <Button
          type="primary"
          size="middle"
          icon={<MdOpenInNew />}
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="!bg-[#FF6B00] hover:!bg-[#e05e00]"
        >
          Open Guest Website ↗
        </Button>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <ResortWebContentEditor activeTab={activeTab} onActiveTabChange={setActiveTab} />
      </div>
    </div>
  );
}
