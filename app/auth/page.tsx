"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useTheme } from "next-themes";

export default function AuthPage() {

  const router = useRouter();
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Mark as client-side only after component mounts
    setIsClient(true);

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push("/");
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          router.push("/");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  // Don't render the Auth component until we're on the client
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 p-8 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/25">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded animate-pulse"></div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/25">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded"></div>
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent mb-2">
              Welcome to MusicWave
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to access your music library
            </p>
          </div>

          {/* Auth UI - Only render on client */}
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#8b5cf6',
                    brandAccent: '#7c3aed',
                    brandButtonText: 'white',
                    defaultButtonBackground: theme === 'dark' ? '#374151' : '#f3f4f6',
                    defaultButtonBackgroundHover: theme === 'dark' ? '#4b5563' : '#e5e7eb',
                    defaultButtonBorder: theme === 'dark' ? '#6b7280' : '#d1d5db',
                    defaultButtonText: theme === 'dark' ? '#f9fafb' : '#374151',
                    dividerBackground: theme === 'dark' ? '#4b5563' : '#e5e7eb',
                    inputBackground: theme === 'dark' ? '#1f2937' : '#ffffff',
                    inputBorder: theme === 'dark' ? '#4b5563' : '#d1d5db',
                    inputBorderHover: theme === 'dark' ? '#6b7280' : '#9ca3af',
                    inputBorderFocus: '#8b5cf6',
                    inputText: theme === 'dark' ? '#f9fafb' : '#111827',
                    inputLabelText: theme === 'dark' ? '#e5e7eb' : '#374151',
                    inputPlaceholder: theme === 'dark' ? '#9ca3af' : '#6b7280',
                    messageText: theme === 'dark' ? '#f87171' : '#dc2626',
                    messageTextDanger: '#ef4444',
                    anchorTextColor: '#8b5cf6',
                    anchorTextHoverColor: '#7c3aed',
                  },
                  space: {
                    spaceSmall: '4px',
                    spaceMedium: '8px',
                    spaceLarge: '16px',
                    labelBottomMargin: '8px',
                    anchorBottomMargin: '4px',
                    emailInputSpacing: '4px',
                    socialAuthSpacing: '4px',
                    buttonPadding: '10px 15px',
                    inputPadding: '10px 15px',
                  },
                  fontSizes: {
                    baseBodySize: '14px',
                    baseInputSize: '14px',
                    baseLabelSize: '14px',
                    baseButtonSize: '14px',
                  },
                  fonts: {
                    bodyFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    buttonFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    inputFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    labelFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '12px',
                    buttonBorderRadius: '12px',
                    inputBorderRadius: '12px',
                  },
                },
              },
            }}
            providers={['google','']}
            redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
            theme={theme === 'dark' ? 'dark' : 'default'}
          />
        </div>
      </div>
    </div>
  );
}
