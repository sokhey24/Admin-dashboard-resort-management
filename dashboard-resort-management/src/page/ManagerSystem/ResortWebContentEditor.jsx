import { useCallback, useEffect, useMemo, useState } from "react";
import { Spin, Tabs, Typography } from "antd";
import {
  MdContactMail,
  MdExplore,
  MdHistoryEdu,
  MdHome,
  MdRestaurant,
  MdSpa,
  MdVerified,
} from "react-icons/md";
import { request } from "../../util/request";
import { JsonListEditor } from "../../components/cms/JsonListEditor";
import { CmsBilingualScalarGroup, CmsScalarField } from "../../components/cms/CmsScalarField";
import { CmsMediaUpload } from "../../components/cms/CmsMediaUpload";
import { useCmsTheme } from "../../components/cms/cmsTheme";
import { getCmsRow } from "../../components/cms/websiteContentUtils";

export const SITE_URL = "http://localhost:3000";

export const TAB_PREVIEW = {
  hero: "/",
  trust: "/",
  activities: "/activities",
  services: "/services",
  dining: "/dining",
  about: "/about",
  contact: "/contact",
};

const CMS_TAB_META = [
  { key: "hero", label: "Hero & Promo", icon: MdHome },
  { key: "trust", label: "Trust Pillars", icon: MdVerified },
  { key: "activities", label: "Activities", icon: MdExplore },
  { key: "services", label: "Services & Wellness", icon: MdSpa },
  { key: "dining", label: "Dining & Venues", icon: MdRestaurant },
  { key: "about", label: "Brand Heritage", icon: MdHistoryEdu },
  { key: "contact", label: "Contact & Footer", icon: MdContactMail },
];

function SectionHeader({ title, description }) {
  const { title: titleCls, pageMuted, sectionDivider } = useCmsTheme();
  return (
    <div className={`pb-4 mb-2 border-b ${sectionDivider}`}>
      <Typography.Title level={5} className={`!mb-0 !font-semibold ${titleCls}`}>
        {title}
      </Typography.Title>
      {description && (
        <p className={`text-xs mt-1.5 max-w-3xl ${pageMuted}`}>{description}</p>
      )}
    </div>
  );
}

function HeroPromoTab({ grouped, onReload }) {
  const heroVideo = getCmsRow(grouped, "hero", "background_video") || getCmsRow(grouped, "hero", "video");
  const heroImage = getCmsRow(grouped, "hero", "background_image");
  const promoImage = getCmsRow(grouped, "promo", "image");

  return (
    <div className="space-y-10">
      <section>
        <SectionHeader
          title="Homepage hero"
          description="Eyebrow, headline, subtitle, and background media for the guest homepage."
        />
        <div className="space-y-0">
          <CmsBilingualScalarGroup section="hero" enKey="badge" kmKey="badge_km" label="Eyebrow / badge" grouped={grouped} onSaved={onReload} />
          <CmsBilingualScalarGroup section="hero" enKey="title" kmKey="title_km" label="Headline" grouped={grouped} onSaved={onReload} />
          <CmsBilingualScalarGroup
            section="hero"
            enKey="subtitle"
            kmKey="subtitle_km"
            label="Subtitle"
            grouped={grouped}
            onSaved={onReload}
            textarea
            rows={3}
          />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pt-4">
            <CmsMediaUpload
              section="hero"
              fieldKey="background_image"
              label="Hero background image"
              currentUrl={heroImage?.image_url}
              currentId={heroImage?.id}
              onSaved={onReload}
            />
            <CmsMediaUpload
              section="hero"
              fieldKey="background_video"
              label="Hero background video (optional)"
              currentUrl={heroVideo?.image_url}
              currentId={heroVideo?.id}
              onSaved={onReload}
              accept="video/mp4,video/webm,video/quicktime"
              isVideo
              hint="mp4 / webm / mov · max 200MB"
            />
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Seasonal promo banner"
          description="Homepage promo strip — copy, CTA, validity, and side image."
        />
        <div className="space-y-0">
          <CmsBilingualScalarGroup section="promo" enKey="tag" kmKey="tag_km" label="Promo tag" grouped={grouped} onSaved={onReload} />
          <CmsBilingualScalarGroup section="promo" enKey="title" kmKey="title_km" label="Promo headline" grouped={grouped} onSaved={onReload} />
          <CmsBilingualScalarGroup
            section="promo"
            enKey="description"
            kmKey="description_km"
            label="Promo description"
            grouped={grouped}
            onSaved={onReload}
            textarea
            rows={4}
          />
          <CmsBilingualScalarGroup section="promo" enKey="cta_label" kmKey="cta_label_km" label="CTA button" grouped={grouped} onSaved={onReload} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-6 border-b border-gray-200 dark:border-gray-700">
            <CmsScalarField
              section="promo"
              fieldKey="valid_until"
              label="Validity note (English)"
              grouped={grouped}
              onSaved={onReload}
              placeholder="Valid for stays through December 2026."
              langTag="EN"
              embedded
            />
            <CmsScalarField
              section="promo"
              fieldKey="valid_until_km"
              label="Validity note (Khmer)"
              grouped={grouped}
              onSaved={onReload}
              langTag="🇰🇭 KM"
              embedded
            />
          </div>
          <CmsScalarField
            section="promo"
            fieldKey="cta_path"
            label="CTA link path"
            grouped={grouped}
            onSaved={onReload}
            placeholder="/booking"
          />
          <CmsMediaUpload
            section="promo"
            fieldKey="image"
            label="Promo side image"
            currentUrl={promoImage?.image_url}
            currentId={promoImage?.id}
            onSaved={onReload}
          />
        </div>
      </section>
    </div>
  );
}

function TrustTab({ grouped, onReload }) {
  return (
    <JsonListEditor
      variant="trust"
      section="trust_bar"
      grouped={grouped}
      onReload={onReload}
      title="Trust & excellence pillars"
      description="Shown on the homepage trust bar. Recommended: 4 items with icons Award, Shield, Clock, Waves."
      emptyHint="Add trust pillars to replace default i18n trust copy on the guest homepage."
    />
  );
}

function BrandHeritageTab({ grouped, onReload }) {
  const { sectionDivider } = useCmsTheme();

  return (
    <div className="space-y-10">
      <section>
        <SectionHeader title="About page hero" />
        <CmsBilingualScalarGroup section="about" enKey="hero_badge" kmKey="hero_badge_km" label="Hero badge" grouped={grouped} onSaved={onReload} />
        <CmsBilingualScalarGroup section="about" enKey="hero_title" kmKey="hero_title_km" label="Hero title" grouped={grouped} onSaved={onReload} />
        <CmsBilingualScalarGroup section="about" enKey="hero_subtitle" kmKey="hero_subtitle_km" label="Hero subtitle" grouped={grouped} onSaved={onReload} textarea />
      </section>

      <section>
        <SectionHeader title="Genesis story" />
        <CmsBilingualScalarGroup section="about" enKey="genesis_tag" kmKey="genesis_tag_km" label="Section tag" grouped={grouped} onSaved={onReload} />
        <CmsBilingualScalarGroup section="about" enKey="genesis_title" kmKey="genesis_title_km" label="Section title" grouped={grouped} onSaved={onReload} />
        <CmsBilingualScalarGroup section="about" enKey="p1" kmKey="p1_km" label="Paragraph 1" grouped={grouped} onSaved={onReload} textarea rows={4} />
        <CmsBilingualScalarGroup section="about" enKey="p2" kmKey="p2_km" label="Paragraph 2" grouped={grouped} onSaved={onReload} textarea rows={4} />
        <CmsBilingualScalarGroup section="about" enKey="p3" kmKey="p3_km" label="Paragraph 3" grouped={grouped} onSaved={onReload} textarea rows={4} />
      </section>

      <section>
        <SectionHeader title="Core values (3 cards)" />
        {[1, 2, 3].map((n) => (
          <div key={n} className={`mb-6 pb-6 border-b last:border-0 ${sectionDivider}`}>
            <Typography.Text strong className="block mb-4">Value {n}</Typography.Text>
            <CmsBilingualScalarGroup section="about" enKey={`value${n}_title`} kmKey={`value${n}_title_km`} label="Title" grouped={grouped} onSaved={onReload} />
            <CmsBilingualScalarGroup section="about" enKey={`value${n}_desc`} kmKey={`value${n}_desc_km`} label="Description" grouped={grouped} onSaved={onReload} textarea />
          </div>
        ))}
      </section>

      <section>
        <SectionHeader title="Closing quote" />
        <CmsBilingualScalarGroup section="about" enKey="quote_text" kmKey="quote_text_km" label="Quote" grouped={grouped} onSaved={onReload} textarea rows={3} />
        <CmsBilingualScalarGroup section="about" enKey="quote_author" kmKey="quote_author_km" label="Attribution" grouped={grouped} onSaved={onReload} />
      </section>
    </div>
  );
}

function ContactFooterTab({ grouped, onReload }) {
  const footerLogo = getCmsRow(grouped, "footer", "logo");
  const { sectionDivider } = useCmsTheme();

  return (
    <div className="space-y-10">
      <section>
        <SectionHeader title="Contact channels" />
        <CmsBilingualScalarGroup section="contact" enKey="phone_primary" kmKey="phone_primary_km" label="Primary phone label" grouped={grouped} onSaved={onReload} />
        <CmsScalarField section="contact" fieldKey="phone_primary_value" label="Primary phone number" grouped={grouped} onSaved={onReload} placeholder="+855 (0) 23 999 123" />
        <CmsScalarField section="contact" fieldKey="phone_secondary" label="Secondary phone" grouped={grouped} onSaved={onReload} />
        <CmsScalarField section="contact" fieldKey="email_primary" label="Primary email" grouped={grouped} onSaved={onReload} />
        <CmsScalarField section="contact" fieldKey="email_secondary" label="Secondary email" grouped={grouped} onSaved={onReload} />
        <CmsBilingualScalarGroup section="contact" enKey="address" kmKey="address_km" label="Mailing address" grouped={grouped} onSaved={onReload} textarea rows={2} />
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 py-6 border-b ${sectionDivider}`}>
          <CmsScalarField section="contact" fieldKey="hours_label" label="Hours label" grouped={grouped} onSaved={onReload} langTag="EN" embedded />
          <CmsScalarField section="contact" fieldKey="hours_label_km" label="Hours label" grouped={grouped} onSaved={onReload} langTag="🇰🇭 KM" embedded />
        </div>
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 py-6 border-b ${sectionDivider}`}>
          <CmsScalarField section="contact" fieldKey="hours_value" label="Hours value" grouped={grouped} onSaved={onReload} langTag="EN" embedded />
          <CmsScalarField section="contact" fieldKey="hours_value_km" label="Hours value" grouped={grouped} onSaved={onReload} langTag="🇰🇭 KM" embedded />
        </div>
      </section>

      <section>
        <SectionHeader title="Social links" />
        <CmsScalarField section="contact" fieldKey="facebook_url" label="Facebook URL" grouped={grouped} onSaved={onReload} />
        <CmsScalarField section="contact" fieldKey="telegram_url" label="Telegram URL" grouped={grouped} onSaved={onReload} />
        <CmsScalarField section="contact" fieldKey="instagram_url" label="Instagram URL" grouped={grouped} onSaved={onReload} />
      </section>

      <section>
        <SectionHeader title="Footer & brand" />
        <CmsMediaUpload
          section="footer"
          fieldKey="logo"
          label="Footer / navbar logo"
          currentUrl={footerLogo?.image_url}
          currentId={footerLogo?.id}
          onSaved={onReload}
        />
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b ${sectionDivider}`}>
          <CmsScalarField section="footer" fieldKey="checkin" label="Check-in time" grouped={grouped} onSaved={onReload} placeholder="14:00" embedded />
          <CmsScalarField section="footer" fieldKey="checkout" label="Check-out time" grouped={grouped} onSaved={onReload} placeholder="12:00" embedded />
        </div>
        <CmsBilingualScalarGroup section="footer" enKey="copyright" kmKey="copyright_km" label="Copyright line" grouped={grouped} onSaved={onReload} />
      </section>
    </div>
  );
}

function cmsTabLabel({ label, icon: Icon, routeKey }) {
  const route = TAB_PREVIEW[routeKey] || "/";
  return (
    <span className="inline-flex items-center gap-2 py-0.5">
      <Icon className="text-base opacity-80 shrink-0" aria-hidden />
      <span className="whitespace-nowrap">{label}</span>
      <span className="cms-tab-route-badge hidden md:inline font-mono text-[10px] font-medium opacity-60">
        {route}
      </span>
    </span>
  );
}

/**
 * CMS tab panels for the Solara guest site (hero, trust, activities, etc.).
 */
export default function ResortWebContentEditor({ activeTab, onActiveTabChange }) {
  const { panel } = useCmsTheme();
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [internalTab, setInternalTab] = useState("hero");

  const tabKey = activeTab ?? internalTab;
  const setTabKey = onActiveTabChange ?? setInternalTab;

  const load = useCallback(() => {
    setLoading(true);
    request("admin/website-content", "get")
      .then((res) => {
        if (res?.data) setContent(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tabPanels = useMemo(
    () => ({
      hero: <HeroPromoTab grouped={content} onReload={load} />,
      trust: <TrustTab grouped={content} onReload={load} />,
      activities: (
        <JsonListEditor
          variant="activities"
          section="activities"
          grouped={content}
          onReload={load}
          title="Guest experiences"
          description="Stored as activities / items — powers homepage preview and /activities when the guest site is wired to CMS."
          emptyHint="No activities yet. Add experiences for the Solara guest website."
        />
      ),
      services: (
        <JsonListEditor
          variant="services"
          section="services"
          grouped={content}
          onReload={load}
          title="Sanctuary services"
          description="Stored as services / items JSON."
          emptyHint="Add services to show on the guest homepage services section."
        />
      ),
      dining: (
        <JsonListEditor
          variant="dining"
          section="dining"
          grouped={content}
          onReload={load}
          title="Restaurants & lounges"
          description="Stored as dining / items JSON."
          emptyHint="Add dining venues for the homepage dining cards."
        />
      ),
      about: <BrandHeritageTab grouped={content} onReload={load} />,
      contact: <ContactFooterTab grouped={content} onReload={load} />,
    }),
    [content, load]
  );

  const tabItems = useMemo(
    () =>
      CMS_TAB_META.map(({ key, label, icon }) => ({
        key,
        label: cmsTabLabel({ label, icon, routeKey: key }),
        children: tabPanels[key],
      })),
    [tabPanels]
  );

  return (
    <Spin spinning={loading}>
      <div className={`w-full ${panel} p-6 lg:p-8`}>
        <Tabs
          activeKey={tabKey}
          onChange={setTabKey}
          items={tabItems}
          type="line"
          className="cms-tabs cms-tabs-line"
          size="large"
          tabBarGutter={28}
        />
      </div>
    </Spin>
  );
}
