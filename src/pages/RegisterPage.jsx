import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, Loader2, Phone, User, Calendar, CreditCard, Lock, ArrowLeft, ShieldCheck, UserCheck } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../lib/auth'

/**
 * Registration form. Step 1 collects the profile (name, mobile, DOB, EPIC?)
 * and triggers an OTP. Step 2 verifies the OTP and creates the account in one
 * round-trip. The EPIC field is optional — citizens without a Voter ID can
 * still register; their `registrationType` is recorded as 'manual'.
 *
 * The portal Member is keyed by phone, so anyone who has previously messaged
 * the WhatsApp bot ends up with the same record once they finish registering
 * here. Mobile numbers are unique across both surfaces.
 */
export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    dob: '',
    epic: '',
    hasEpic: true,
  })
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const otpRef = useRef(null)

  useEffect(() => { if (step === 2) setTimeout(() => otpRef.current?.focus(), 50) }, [step])
  useEffect(() => {
    if (secondsLeft <= 0) return
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  function validateStep1() {
    if (!form.name.trim() || form.name.trim().length < 2) return 'Enter your full name'
    if (form.phone.length !== 10) return 'Enter a 10-digit mobile number'
    if (!form.dob) return 'Select your date of birth'
    const dobDate = new Date(form.dob)
    if (Number.isNaN(dobDate.getTime()) || dobDate > new Date()) return 'Date of birth looks invalid'
    if (form.hasEpic) {
      const e = form.epic.trim().toUpperCase()
      if (!/^[A-Z]{2,3}[0-9]{6,7}$/.test(e)) {
        return 'EPIC format looks invalid (expected e.g. TNA1234567)'
      }
    }
    return ''
  }

  async function requestOtp(e) {
    e?.preventDefault()
    setError('')
    const err = validateStep1()
    if (err) return setError(err)
    setBusy(true)
    try {
      await api.post('/portal/auth/send-otp', { phone: form.phone, mode: 'register' })
      setStep(2)
      setInfo(`We sent a 6-digit code to your WhatsApp on +91 ${form.phone}.`)
      setSecondsLeft(45)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send OTP. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function completeRegister(e) {
    e?.preventDefault()
    setError('')
    if (otp.length < 6) return setError('Enter the 6-digit code')
    setBusy(true)
    try {
      const { data } = await api.post('/portal/auth/register', {
        phone: form.phone,
        otp,
        name: form.name.trim(),
        dob: form.dob,
        epic: form.hasEpic ? form.epic.trim().toUpperCase() : '',
      })
      login(data.token, data.user)
      navigate('/grievance', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* ─── LEFT: LEADER IMAGE ─── */}
        <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden items-end justify-center bg-white">
          {/* Yellow TN map silhouette background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[80%] h-[80%] bg-[#f5c518]/20 rounded-full blur-3xl" />
          </div>
          <img
            src="/login-right.png"
            alt="TVK Leader"
            className="relative z-10 w-[88%] max-w-xl object-contain object-bottom"
          />
        </div>

        {/* ─── RIGHT: REGISTER FORM ─── */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-10 lg:py-8 overflow-y-auto">
          <div className="w-full max-w-md mx-auto">

            {/* Back button */}
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-tvk-blue mb-6 transition-colors">
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
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Create Account</h1>
            <p className="text-gray-400 text-sm mb-8">Register for the Mylapore Citizen Portal</p>

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
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={set('name')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:border-[#f5c518] transition"
                    placeholder="As on your government ID"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                  <div className="flex border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-[#f5c518] focus-within:border-[#f5c518] transition">
                    <span className="px-4 flex items-center text-gray-500 text-sm font-medium border-r border-gray-300 bg-gray-50 rounded-l-lg">+91</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none rounded-r-lg"
                      placeholder="Enter mobile number"
                      required
                    />
                  </div>
                </div>

                {/* DOB */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={set('dob')}
                    max={new Date().toISOString().slice(0, 10)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:border-[#f5c518] transition"
                    required
                  />
                </div>

                {/* EPIC */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Voter ID (EPIC)</label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-gray-500 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!form.hasEpic}
                        onChange={(e) => setForm({ ...form, hasEpic: !e.target.checked, epic: '' })}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-[#f5c518] focus:ring-[#f5c518]"
                      />
                      I don't have one
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={!form.hasEpic}
                    value={form.epic}
                    onChange={(e) => setForm({ ...form, epic: e.target.value.toUpperCase().replace(/\s/g, '').slice(0, 10) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 uppercase tracking-wider placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f5c518] focus:border-[#f5c518] transition disabled:bg-gray-100 disabled:text-gray-400"
                    placeholder={form.hasEpic ? 'TNA1234567' : 'Skipped'}
                    maxLength={10}
                  />
                  {!form.hasEpic && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      You can still file grievances. Add your EPIC later from Profile.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3.5 rounded-lg text-base font-bold bg-[#f5c518] text-gray-900 hover:bg-[#e6b800] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {busy ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Continue'}
                </button>
              </form>
            ) : (
              <form onSubmit={completeRegister} className="space-y-5">
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(''); setError(''); setInfo('') }}
                  className="text-sm text-gray-500 hover:text-tvk-blue flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Edit details
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
                  {busy ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Verify & Create Account'}
                </button>
              </form>
            )}

            <p className="text-center text-sm text-gray-500 mt-8">
              Already registered?{' '}
              <Link to="/login" className="font-bold text-red-700 hover:text-red-900">
                Log In
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
