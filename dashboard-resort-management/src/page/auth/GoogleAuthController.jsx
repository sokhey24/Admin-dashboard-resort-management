// import { useGoogleLogin } from "@react-oauth/google";
// import { message } from "antd";
// import { useNavigate } from "react-router-dom";
// import { request } from "../../util/request";
// import { setAuth } from "../../util/auth";
// import { ProfileStore } from "../../store/ProfileStore";
// import { ROLES } from "../../util/useRole";

// const getRedirectByRole = (user) => {
//   const role = user?.roles?.[0]?.name;
//   if (role === ROLES.RESORT)     return "/resort/dashboard";
//   if (role === ROLES.RESTAURANT) return "/restaurant/dashboard";
//   return "/dashboard";
// };

// export function useGoogleAuth({ setLoading }) {
//   const { setProfile, setAccessToken, setPermission } = ProfileStore();
//   const navigate = useNavigate();

//   const handleGoogleSuccess = async (tokenResponse) => {
//     setLoading(true);
//     const res = await request("auth/google/token", "post", { token: tokenResponse.access_token });
//     setLoading(false);

//     if (!res || res?.errors) {
//       message.error(res?.errors?.message ?? "Google authentication failed. Please try again.");
//       return;
//     }

//     if (res?.access_token) {
//       setAuth(res.access_token, res.user);
//       setProfile({ ...res.user });
//       setAccessToken(res.access_token);
//       setPermission(res.permission ?? null);
//       message.success("Google sign-in successful!");
//       navigate(getRedirectByRole(res.user));
//     } else {
//       message.error("Google authentication failed. Please try again.");
//     }
//   };

//   const googleLogin = useGoogleLogin({
//     onSuccess: handleGoogleSuccess,
//     onError: () => message.error("Google login failed. Please try again."),
//   });

//   return { googleLogin };
// }

// export function GoogleButton({ onClick, label = "Continue with Google" }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className="w-full flex items-center justify-center gap-3 h-11 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-gray-700 font-medium text-sm cursor-pointer"
//     >
//       <svg className="w-5 h-5" viewBox="0 0 48 48">
//         <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.08-6.08C34.46 3.09 29.5 1 24 1 14.82 1 7.07 6.48 3.64 14.22l7.08 5.5C12.43 13.61 17.74 9.5 24 9.5z"/>
//         <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.74H24v8.98h12.67c-.55 2.94-2.2 5.43-4.68 7.1l7.18 5.58C43.46 37.27 46.52 31.36 46.52 24.5z"/>
//         <path fill="#FBBC05" d="M10.72 28.28A14.6 14.6 0 0 1 9.5 24c0-1.49.26-2.93.72-4.28l-7.08-5.5A23.93 23.93 0 0 0 0 24c0 3.87.93 7.53 2.56 10.76l8.16-6.48z"/>
//         <path fill="#34A853" d="M24 47c5.5 0 10.12-1.82 13.5-4.94l-7.18-5.58c-1.82 1.22-4.15 1.94-6.32 1.94-6.26 0-11.57-4.11-13.28-9.72l-8.16 6.48C7.07 41.52 14.82 47 24 47z"/>
//       </svg>
//       {label}
//     </button>
//   );
// }
