import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { ArrowRight, Loader2, Phone, Lock, UserPlus, ShieldCheck, ArrowLeft } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../lib/auth'

/**
 * Two-step login: mobile → OTP. The code is delivered via the WhatsApp
 * Authentication-category template (with copy-code button) so the same number
 * can be used to receive bot replies and portal codes.
 */
export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const fromPath = location.state?.from?.pathname || '/grievance'

  const [step, setStep] = useState(1)            // 1 = phone, 2 = otp
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const otpRef = useRef(null)

  useEffect(() => { if (step === 2) setTimeout(() => otpRef.current?.focus(), 50) }, [step])

  // Countdown for the resend button.
  useEffect(() => {
    if (secondsLeft <= 0) return
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft])

  async function requestOtp(e) {
    e?.preventDefault()
    setError('')
    if (phone.length !== 10) return setError('Enter a 10-digit mobile number')
    setBusy(true)
    try {
      await api.post('/portal/auth/send-otp', { phone, mode: 'login' })
      setStep(2)
      setInfo(`We sent a 6-digit code to your WhatsApp on +91 ${phone}.`)
      setSecondsLeft(45)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send OTP. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function verifyOtp(e) {
    e?.preventDefault()
    setError('')
    if (otp.length < 6) return setError('Enter the 6-digit code')
    setBusy(true)
    try {
      const { data } = await api.post('/portal/auth/verify-otp', { phone, otp })
      login(data.token, data.user)
      navigate(fromPath, { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* ─── LEFT: LEADER IMAGE ─── */}
        <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden items-end justify-center bg-white">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[80%] h-[80%] bg-[#f5c518]/20 rounded-full blur-3xl" />
          </div>
          <img
            src="/login-right.png"
            alt="TVK Leader"
            className="relative z-10 w-[88%] max-w-xl object-contain object-bottom"
          />
        </div>

        {/* ─── RIGHT: LOGIN FORM ─── */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-10 lg:py-8 overflow-y-auto">
          <div className="w-full max-w-md mx-auto">

            {/* Back button */}
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-navy mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>

            {/* TVK Brand header */}
            <div className="flex items-center gap-3 mb-8">
              <img src="/e.jpg" alt="TVK" className="w-12 h-12 rounded-full object-cover object-top shadow-md" />
              <div>
                <p className="text-red-800 font-bold text-lg leading-tight">தமிழக வெற்றிக் கழகம்</p>
                <p className="text-gray-400 text-xs">பிறப்பொக்கும் எல்லா உயிர்க்கும்</p>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Welcome Back!</h1>
            <p className="text-gray-400 text-sm mb-8">Login to the Mylapore Citizen Portal</p>

            {/* Mobile leader image */}
            <div className="lg:hidden flex justify-center mb-6">
              <img src="/login-right.png" alt="TVK" className="w-40 object-contain" />
            </div>

            {error && (
              <div className="mb-5 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            {info && step === 2 && !error && (
              <div className="mb-5 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" /> {info}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={requestOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                  <div className="flex border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-[#f5c518] focus-within:border-[#f5c518] transition">
                    <span className="px-4 flex items-center text-gray-500 text-sm font-medium border-r border-gray-300 bg-gray-50 rounded-l-lg">+91</span>
                    <input
                      type="tel"
                      autoComplete="tel-national"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none rounded-r-lg"
                      placeholder="Enter mobile number"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">We'll send a 6-digit code via WhatsApp.</p>
                </div>

                <button
                  type="submit"
                  disabled={busy || phone.length !== 10}
                  className="w-full py-3.5 rounded-lg text-base font-bold bg-[#f5c518] text-gray-900 hover:bg-[#e6b800] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {busy ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-5">
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(''); setError(''); setInfo('') }}
                  className="text-sm text-gray-500 hover:text-tvk-blue flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Edit number
                </button>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">6-Digit Code</label>
                  <input
                    ref={otpRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3.5 border border-gray-300 rounded-lg text-gray-900 font-bold tracking-[0.4em] text-center text-lg focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:border-[#f5c518] transition"
                    placeholder="••••••"
                    required
                  />
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-gray-400">Code expires in 5 minutes</span>
                    <button
                      type="button"
                      onClick={requestOtp}
                      disabled={secondsLeft > 0 || busy}
                      className="font-semibold text-red-700 hover:text-red-900 disabled:text-gray-300 disabled:cursor-not-allowed"
                    >
                      {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend OTP'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy || otp.length !== 6}
                  className="w-full py-3.5 rounded-lg text-base font-bold bg-[#f5c518] text-gray-900 hover:bg-[#e6b800] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {busy ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Verify & Sign In'}
                </button>
              </form>
            )}

            <p className="text-center text-sm text-gray-500 mt-8">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-red-700 hover:text-red-900">
                Register now
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-100 py-4 text-center">
        <p className="text-xs text-gray-400">© 2024 Tamilaga Vettri Kazhagam. All Rights Reserved.</p>
        <div className="flex items-center justify-center gap-3 mt-1 text-xs text-gray-400">
          <span className="hover:text-gray-600 cursor-pointer">Privacy Policy</span>
          <span>|</span>
          <span className="hover:text-gray-600 cursor-pointer">Terms of Service</span>
        </div>
      </footer>
    </div>
  )
}
