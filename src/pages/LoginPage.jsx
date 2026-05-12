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
        <div
          className="hidden lg:block lg:w-[45%] relative overflow-hidden"
          style={{
            backgroundImage: 'url(/93bb2e14-70f0-463c-96c1-7a4fec0c9e25.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#e8e8e8',
          }}
        />

        {/* ─── RIGHT: LOGIN FORM ─── */}
        <div className="flex-1 flex flex-col justify-center px-3 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 sm:py-12 lg:py-8 overflow-y-auto">
          <div className="w-full max-w-md mx-auto">

            {/* Back button */}
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 hover:text-gray-600 mb-6 sm:mb-8 transition-colors">
              <ArrowLeft className="w-3 sm:w-4 h-3 sm:h-4" /> Back
            </Link>

            {/* TVK Brand header */}
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-8 sm:mb-10">
              <img src="/e.jpg" alt="TVK" className="w-10 sm:w-12 lg:w-14 h-10 sm:h-12 lg:h-14 rounded-full object-cover shadow-md border-2 border-yellow-300 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-red-800 font-bold text-sm sm:text-base lg:text-lg leading-tight">தமிழக வெற்றிக் கழகம்</p>
                <p className="text-gray-500 text-xs font-semibold">பிறப்பொக்கும் எல்லா உயிர்க்கும்</p>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Welcome Back!</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-6 sm:mb-8 md:mb-10">Login to the Mylapore Citizen Portal</p>

            {/* Mobile leader image */}
            <div className="lg:hidden flex justify-center mb-6 sm:mb-8">
              <img src="/93bb2e14-70f0-463c-96c1-7a4fec0c9e25.png" alt="TVK" className="w-32 sm:w-40 md:w-48 object-contain" />
            </div>

            {error && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 text-red-700 text-xs md:text-sm rounded-lg md:rounded-xl border border-red-200 flex items-start gap-2 md:gap-3">
                <ShieldCheck className="w-4 md:w-5 h-4 md:h-5 shrink-0 mt-0.5" /> <span>{error}</span>
              </div>
            )}
            {info && step === 2 && !error && (
              <div className="mb-4 md:mb-6 p-3 md:p-4 bg-green-50 text-green-700 text-xs md:text-sm rounded-lg md:rounded-xl border border-green-200 flex items-start gap-2 md:gap-3">
                <ShieldCheck className="w-4 md:w-5 h-4 md:h-5 shrink-0 mt-0.5" /> <span>{info}</span>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={requestOtp} className="space-y-4 md:space-y-6">
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-800 mb-1.5 md:mb-2.5">Mobile Number</label>
                  <div className="flex border-2 border-gray-300 rounded-lg md:rounded-xl focus-within:ring-2 focus-within:ring-yellow-400 focus-within:border-yellow-400 transition-all bg-white">
                    <span className="px-2 md:px-4 flex items-center text-gray-600 text-xs md:text-sm font-semibold border-r-2 border-gray-300 bg-gray-50 rounded-l-lg md:rounded-l-xl">+91</span>
                    <input
                      type="tel"
                      autoComplete="tel-national"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="flex-1 px-3 md:px-4 py-2.5 md:py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none rounded-r-lg md:rounded-r-xl bg-white text-base md:text-lg font-semibold"
                      placeholder="Enter mobile number"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 md:mt-2 font-medium">We'll send a 6-digit code via WhatsApp.</p>
                </div>

                <button
                  type="submit"
                  disabled={busy || phone.length !== 10}
                  className="w-full py-2.5 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base font-bold bg-yellow-400 text-gray-900 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                  {busy ? <Loader2 className="w-4 md:w-5 h-4 md:h-5 animate-spin mx-auto" /> : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-4 md:space-y-6">
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(''); setError(''); setInfo('') }}
                  className="text-xs md:text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1 font-medium"
                >
                  <ArrowLeft className="w-3 md:w-3.5 h-3 md:h-3.5" /> Edit number
                </button>

                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-800 mb-1.5 md:mb-2.5">6-Digit Code</label>
                  <input
                    ref={otpRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3 md:px-4 py-3 md:py-4 border-2 border-gray-300 rounded-lg md:rounded-xl text-gray-900 font-bold tracking-[0.5em] text-center text-lg md:text-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all bg-white"
                    placeholder="••••••"
                    required
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 md:mt-3 text-xs gap-2">
                    <span className="text-gray-500 font-medium">Code expires in 5 minutes</span>
                    <button
                      type="button"
                      onClick={requestOtp}
                      disabled={secondsLeft > 0 || busy}
                      className="font-bold text-yellow-600 hover:text-yellow-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-left"
                    >
                      {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend OTP'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy || otp.length !== 6}
                  className="w-full py-2.5 md:py-4 rounded-lg md:rounded-xl text-sm md:text-base font-bold bg-yellow-400 text-gray-900 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                  {busy ? <Loader2 className="w-4 md:w-5 h-4 md:h-5 animate-spin mx-auto" /> : 'Verify & Sign In'}
                </button>
              </form>
            )}

            <div className="relative my-6 md:my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-yellow-600 hover:text-yellow-700 transition-colors">
                Register now
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-gray-200 py-5 text-center bg-gray-50">
        <p className="text-xs text-gray-600 font-medium">© 2024 Tamilaga Vettri Kazhagam. All Rights Reserved.</p>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-600">
          <span className="hover:text-gray-800 cursor-pointer transition-colors">Privacy Policy</span>
          <span className="text-gray-300">|</span>
          <span className="hover:text-gray-800 cursor-pointer transition-colors">Terms of Service</span>
        </div>
      </footer>
    </div>
  )
}
