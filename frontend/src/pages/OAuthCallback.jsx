import { useEffect } from "react";

const OAuthCallback = () => {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");

    if (accessToken && window.opener) {
      window.opener.postMessage(
        {
          type: "GOOGLE_AUTH_SUCCESS",
          accessToken,
        },
        "http://localhost:5173"
      );
      window.close();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a365d] mx-auto mb-4"></div>
        <p className="text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
