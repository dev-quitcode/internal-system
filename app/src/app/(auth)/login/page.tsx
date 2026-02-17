'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const logoRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
  }, [searchParams])

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = createClient()

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        throw error
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Failed to sign in')
      setIsLoading(false)
    }
  }

  const handleLogoSpin = () => {
    if (!logoRef.current) return
    logoRef.current.classList.remove('spin')
    void logoRef.current.offsetWidth
    logoRef.current.classList.add('spin')
  }

  return (
    <div className="qc-login">
      <main className="container">
        <section className="info-panel">
          <div
            className="logo-wrapper"
            ref={logoRef}
            onClick={handleLogoSpin}
            role="button"
            aria-label="Spin logo"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 106.68 106.68"
              aria-hidden="true"
            >
              <defs>
                <style>
                  {`.cls-2 { fill: #3985f8; } .cls-3 { fill: #09c0ff; }`}
                </style>
              </defs>
              <g>
                <path
                  className="cls-2"
                  d="M81.09,49.86c-.21,0-.41,.02-.61,.06l-11.14-19.3c.57-.56,.92-1.34,.92-2.2,0-1.71-1.39-3.1-3.1-3.1-1.52,0-2.79,1.1-3.04,2.55h-22.02c-.26-1.45-1.52-2.55-3.04-2.55-1.71,0-3.1,1.39-3.1,3.1,0,.97,.44,1.83,1.14,2.4l-11.03,19.11c-.21-.05-.43-.07-.66-.07-1.71,0-3.1,1.39-3.1,3.1s1.39,3.1,3.1,3.1c.23,0,.45-.03,.66-.07l10.99,19.03c-.67,.57-1.09,1.41-1.09,2.36,0,1.71,1.39,3.1,3.1,3.1,1.48,0,2.71-1.04,3.02-2.43h9.78c.25,.53,.79,.91,1.42,.91s1.17-.37,1.42-.91h9.45c.31,1.39,1.54,2.43,3.02,2.43,1.71,0,3.1-1.39,3.1-3.1,0-.84-.33-1.6-.87-2.15l11.1-19.22c.2,.04,.4,.06,.61,.06,1.71,0,3.1-1.39,3.1-3.1s-1.39-3.1-3.1-3.1Zm-13.52-4.58l10.79,6.23c-.19,.36-.31,.77-.35,1.19h-10.44v-7.42Zm10.44,7.92c.03,.43,.16,.83,.35,1.19l-9.88,5.71c-.23-.28-.54-.48-.9-.55v-6.35h10.44Zm-12.33,7.89c0,.2,.04,.38,.11,.56l-5.4,3.12-6.68-11.57h13.36v6.34c-.78,.1-1.38,.75-1.38,1.56Zm-26.2-.18v-6.47c.68-.08,1.23-.58,1.37-1.24h11.99l-6.38,11.05c-.07-.02-.14-.03-.21-.03-.24,0-.45,.09-.61,.24l-6.15-3.55Zm7.42,3.58l6.38-11.05,6.68,11.57-6.68,3.86-6.13-3.54c.01-.06,.02-.13,.02-.19,0-.25-.1-.48-.27-.65Zm5.77-27.12c.16,.15,.38,.24,.61,.24s.45-.09,.61-.24l4.91,2.83c-.09,.2-.14,.41-.14,.64,0,.5,.24,.94,.6,1.23l-5.99,10.37-6.68-11.57,6.07-3.5Zm7.57,5.05c.52,0,.98-.26,1.27-.65l5.57,3.21v7.71h-13.36l5.99-10.37c.17,.06,.34,.1,.53,.1Zm6.84-10.92v12.9l-5.34-3.08c.05-.15,.08-.31,.08-.48,0-.48-.22-.91-.56-1.2l4.82-8.34c.31,.12,.65,.19,1.01,.2Zm-1.46-.42l-4.79,8.3c-.18-.07-.38-.11-.58-.11-.46,0-.87,.2-1.16,.52l-4.92-2.84c.02-.08,.04-.16,.04-.25,0-.07,0-.13-.02-.19l10.6-6.12c.23,.28,.52,.52,.83,.7Zm-23.61-1.71h22.23c.07,.21,.16,.41,.27,.59l-10.55,6.09c-.17-.17-.4-.28-.66-.28s-.49,.11-.66,.28l-10.81-6.24c.07-.14,.14-.29,.19-.44Zm-.45,.87l10.84,6.26c-.01,.06-.02,.13-.02,.19,0,.09,.02,.17,.04,.25l-6.05,3.49-5.49-9.51c.26-.19,.5-.42,.69-.68Zm-2.06,1.23c.33-.05,.65-.15,.94-.29l5.49,9.51-6.43,3.71v-12.93Zm6.68,9.65l6.68,11.57h-11.98c-.09-.72-.66-1.29-1.38-1.37v-6.34l6.68-3.86Zm-8.41,11.57h-9.26c-.03-.42-.15-.82-.34-1.17l10.83-6.25v6.07c-.65,.14-1.15,.68-1.23,1.35Zm.72-21.24c.17,.03,.34,.05,.51,.05v13.19l-11.1,6.41c-.14-.19-.3-.35-.47-.5l11.05-19.14Zm.51,42.81c-.2,0-.39,.03-.58,.07l-10.99-19.03c.18-.15,.33-.32,.47-.5l11.1,6.41v13.06Zm-10.83-19.89c.18-.36,.3-.75,.34-1.17h9.27c.12,.62,.61,1.1,1.22,1.23v6.19l-10.83-6.25Zm11.33,19.92v-12.8l5.89,3.4c-.02,.08-.04,.16-.04,.25,0,.24,.1,.46,.25,.63l-5.1,8.84c-.31-.16-.64-.27-1-.32Zm1.42,.58l5.11-8.85c.07,.02,.15,.03,.23,.03,.26,0,.49-.11,.66-.28l5.87,3.39-11.16,6.45c-.19-.28-.43-.53-.71-.73Zm23.28,1.64h-9.58c-.28-.44-.77-.74-1.33-.74s-1.05,.3-1.33,.74h-9.91c-.05-.16-.1-.32-.18-.47l11.42-6.59,11.16,6.44c-.1,.2-.19,.41-.25,.62Zm.52-1.04l-10.93-6.31,6.43-3.71,5.35,9.26c-.33,.2-.61,.46-.85,.76Zm1.29-.99l-5.36-9.29,5.4-3.12c.25,.31,.61,.52,1.03,.57v11.62c-.38,.01-.74,.09-1.07,.22Zm2.1-.08c-.17-.05-.35-.09-.53-.12v-11.65c.72-.14,1.27-.78,1.27-1.54,0-.2-.04-.39-.11-.56l9.9-5.72c.14,.19,.31,.36,.49,.51l-11.01,19.08Zm10.52-23.33l-11.06-6.38v-13.21c.16-.02,.32-.05,.47-.1l11.08,19.18c-.18,.15-.35,.33-.49,.51Z"
                />
                <path
                  className="cls-3"
                  d="M102.87,43.26c-2.33-.27-4.66-.55-7-.77-.99-.1-1.51-.47-1.87-1.5-.93-2.63-2.02-5.2-3.2-7.73-.46-.97-.39-1.58,.28-2.37,1.54-1.85,3-3.76,4.47-5.67,1.64-2.12,1.57-3.39-.3-5.28-2.84-2.87-5.68-5.72-8.54-8.55-1.94-1.93-3.21-1.99-5.42-.27-1.98,1.55-3.93,3.15-5.96,4.64-.38,.28-1.13,.35-1.58,.18-2.81-1.09-5.6-2.23-8.34-3.46-.52-.24-1.08-.93-1.17-1.49-.42-2.65-.65-5.33-1.02-7.99-.27-1.94-1.28-2.92-3.24-2.96-4.42-.08-8.84-.08-13.26,0-2.1,.03-3.11,1.09-3.38,3.2-.33,2.56-.69,5.1-.93,7.66-.08,.92-.4,1.33-1.27,1.66-2.76,1.05-5.45,2.27-8.21,3.33-.49,.19-1.31,.13-1.72-.17-2.12-1.55-4.15-3.23-6.24-4.83-1.87-1.43-3.21-1.35-4.89,.31-2.99,2.95-5.95,5.92-8.91,8.91-1.62,1.65-1.7,3.08-.3,4.9,1.53,2,3.07,4,4.67,5.93,.62,.74,.71,1.3,.29,2.22-1.19,2.59-2.29,5.21-3.26,7.89-.35,.96-.81,1.33-1.75,1.42-2.22,.22-4.44,.55-6.67,.73-1.78,.14-3.26,.67-4.14,2.35v15.45c.78,1.66,2.15,2.25,3.91,2.39,2.39,.2,4.79,.51,7.15,.91,.53,.1,1.16,.71,1.4,1.24,1.18,2.65,2.3,5.33,3.33,8.03,.21,.54,.16,1.43-.16,1.87-1.5,2.09-3.15,4.07-4.72,6.11-1.46,1.9-1.37,3.32,.33,5.04,2.87,2.91,5.76,5.79,8.66,8.67,1.87,1.86,3.2,1.94,5.29,.33,2.29-1.78,4.57-3.59,6.58-5.17,3.32,1.31,6.4,2.48,9.42,3.76,.51,.22,1.05,.92,1.14,1.47,.42,2.54,.68,5.1,1,7.66,.28,2.26,1.35,3.28,3.64,3.31,4.25,.04,8.51,.05,12.76,0,2.14-.03,3.2-.98,3.49-3.08,.37-2.61,.58-5.23,1.02-7.82,.1-.59,.71-1.32,1.28-1.58,2.64-1.2,5.38-2.19,8.01-3.4,.86-.4,1.37-.33,2.05,.24,1.99,1.63,4.03,3.21,6.07,4.77,1.77,1.35,3.22,1.3,4.78-.24,3.04-2.98,6.04-5.99,9.02-9.03,1.65-1.68,1.7-3.02,.26-4.9-1.57-2.04-3.22-4.02-4.72-6.1-.33-.45-.42-1.34-.22-1.87,1.04-2.77,2.17-5.5,3.37-8.2,.22-.49,.82-1.04,1.33-1.12,2.42-.4,4.87-.67,7.32-.93,2.9-.31,3.78-1.26,3.79-4.21,0-3.92,.01-7.84,0-11.75-.01-2.83-.9-3.82-3.7-4.15Zm-31.79,40.9H35.49l-17.8-30.83,17.8-30.83h35.59l17.8,30.83-17.8,30.83Z"
                />
                <polygon
                  className="cls-2"
                  points="55.72 48.61 50.78 48.61 48.31 52.89 50.78 57.17 55.72 57.17 58.19 52.89 55.72 48.61"
                />
              </g>
            </svg>
          </div>
          <h1>QC Internal System</h1>
          <p className="description">
            We deliver automation solutions that sling-shot your big ideas.
          </p>
        </section>

        <section className="login-panel">
          <h2>Sign In</h2>
          <p className="subtitle">Log in to your account to continue</p>

          {error && <div className="error-box">{error}</div>}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="google-btn"
          >
            {isLoading ? (
              <Loader2 className="spinner" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>{isLoading ? 'Signing in...' : 'Continue with Google'}</span>
          </button>

          <p className="footer-text">
            By signing in, you agree to our <strong>Terms of Service</strong> and{' '}
            <strong>Privacy Policy</strong>.
          </p>
        </section>
      </main>

      <style>{`
        :root {
          --primary-bg: #f8fafc;
          --accent-blue: #3985f8;
          --text-main: #1e293b;
          --text-muted: #64748b;
          --glass-white: rgba(255, 255, 255, 0.9);
        }

        .qc-login {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px;
          font-family: var(--font-inter), 'Inter', -apple-system, sans-serif;
          background: radial-gradient(
            circle at top left,
            #e0f2fe 0%,
            #ffffff 50%,
            #f1f5f9 100%
          );
          color: var(--text-main);
        }

        .container {
          display: flex;
          width: 100%;
          max-width: 850px;
          min-height: 480px;
          background: var(--glass-white);
          backdrop-filter: blur(15px);
          border-radius: 32px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.6);
        }

        .info-panel {
          flex: 1.1;
          padding: 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.5) 0%, rgba(248, 250, 252, 0) 100%);
        }

        .logo-wrapper {
          width: 48px;
          height: 48px;
          margin-bottom: 25px;
          filter: drop-shadow(0 4px 8px rgba(57, 133, 248, 0.15));
          cursor: pointer;
          transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          user-select: none;
        }

        .logo-wrapper svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .logo-wrapper:active {
          transform: scale(0.9);
        }

        .spin {
          animation: fullRotation 0.8s ease-in-out;
        }

        @keyframes fullRotation {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        h1,
        h2 {
          font-size: 26px;
          font-weight: 700;
          color: var(--text-main);
          margin: 0;
          letter-spacing: -0.5px;
        }

        h1 {
          line-height: 1.2;
          margin-bottom: 15px;
          max-width: 300px;
        }

        .description {
          font-size: 15px;
          color: var(--text-muted);
          line-height: 1.6;
          margin: 0;
          max-width: 320px;
        }

        .login-panel {
          flex: 0.9;
          background: rgba(255, 255, 255, 0.4);
          padding: 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border-left: 1px solid rgba(0, 0, 0, 0.04);
        }

        h2 {
          margin-bottom: 8px;
        }

        .subtitle {
          font-size: 14px;
          color: var(--text-muted);
          margin-bottom: 28px;
        }

        .google-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 12px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 600;
          font-size: 14px;
          color: var(--text-main);
          gap: 10px;
        }

        .google-btn:hover {
          border-color: var(--accent-blue);
          transform: translateY(-2px);
          box-shadow: 0 8px 15px rgba(0, 0, 0, 0.05);
        }

        .google-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .footer-text {
          margin-top: 25px;
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .error-box {
          margin-bottom: 18px;
          padding: 10px 12px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(248, 113, 113, 0.35);
          border-radius: 10px;
          color: #b91c1c;
          font-size: 12px;
        }

        .spinner {
          width: 18px;
          height: 18px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 900px) {
          .container {
            flex-direction: column;
            max-width: 520px;
          }

          .info-panel,
          .login-panel {
            padding: 40px;
          }

          h1 {
            max-width: none;
          }
        }

        @media (max-width: 600px) {
          .qc-login {
            padding: 16px;
          }

          .container {
            border-radius: 24px;
          }

          .info-panel,
          .login-panel {
            padding: 28px 24px;
          }

          h1,
          h2 {
            font-size: 22px;
          }

          .description {
            font-size: 14px;
          }

          .subtitle {
            margin-bottom: 22px;
          }

          .google-btn {
            padding: 11px;
          }
        }
      `}</style>
    </div>
  )
}
