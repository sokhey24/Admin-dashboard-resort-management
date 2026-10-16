import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import { MdHome, MdSupportAgent } from "react-icons/md";
import { useTranslation } from "../../i18n";
import { getHomeByRole } from "../../components/layout/ProtectedRoute";
import useRole from "../../util/useRole";
import { useDarkMode } from "../../util/DarkModeContext";

export default function AccessDenied() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { role } = useRole();
  const dark = useDarkMode();

  const homePath = getHomeByRole(role);

  return (
    <div
      className={`min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 ${
        dark ? "text-slate-200" : "text-slate-800"
      }`}
    >
      <div
        className={`w-full max-w-lg rounded-2xl border p-8 shadow-sm ${
          dark
            ? "bg-slate-900 border-slate-800"
            : "bg-white border-slate-200/80"
        }`}
      >
        <Result
          status="403"
          title={
            <span className="font-semibold text-slate-900 dark:text-white text-xl">
              {t("errors.accessDeniedTitle", "Access Denied")}
            </span>
          }
          subTitle={
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              {t(
                "errors.accessDeniedDescription",
                "You do not have permission to view this page. If you believe this is a mistake, contact your system administrator."
              )}
            </p>
          }
          extra={[
            <Button
              key="home"
              type="primary"
              size="large"
              icon={<MdHome size={18} />}
              onClick={() => navigate(homePath, { replace: true })}
            >
              {t("errors.returnToDashboard", "Return to Dashboard")}
            </Button>,
          ]}
        />
        <div
          className={`mt-2 flex items-center justify-center gap-2 text-xs ${
            dark ? "text-slate-500" : "text-slate-400"
          }`}
        >
          <MdSupportAgent size={16} />
          <span>{t("errors.contactAdmin", "Need access? Contact your administrator.")}</span>
        </div>
      </div>
    </div>
  );
}
