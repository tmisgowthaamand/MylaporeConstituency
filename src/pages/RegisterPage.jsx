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
        <div
          className="hidden lg:block lg:w-[45%] sticky top-0 self-start min-h-screen overflow-hidden"
          style={{
            backgroundImage: 'url(/93bb2e14-70f0-463c-96c1-7a4fec0c9e25.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#e8e8e8',
          }}
        />

        {/* ─── RIGHT: REGISTER FORM ─── */}
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Create Account</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-6 sm:mb-8 md:mb-10">Register for the Mylapore Citizen Portal</p>

            {/* Mobile leader image */}
            <div className="lg:hidden flex justify-center mb-8">
              <img src="/93bb2e14-70f0-463c-96c1-7a4fec0c9e25.png" alt="TVK" className="w-48 object-contain" />
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0" /> {error}
              </div>
            )}
            {info && step === 2 && !error && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm rounded-xl border border-green-200 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 shrink-0" /> {info}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={requestOtp} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2.5">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={set('name')}
                    className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all bg-white font-medium"
                    placeholder="As on your government ID"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2.5">Mobile Number</label>
                  <div className="flex border-2 border-gray-300 rounded-xl focus-within:ring-2 focus-within:ring-yellow-400 focus-within:border-yellow-400 transition-all bg-white">
                    <span className="px-4 flex items-center text-gray-600 text-sm font-semibold border-r-2 border-gray-300 bg-gray-50 rounded-l-xl">+91</span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className="flex-1 px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none rounded-r-xl bg-white text-lg font-semibold"
                      placeholder="Enter mobile number"
                      required
                    />
                  </div>
                </div>

                {/* DOB */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2.5">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={set('dob')}
                    max={new Date().toISOString().slice(0, 10)}
                    className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all bg-white font-medium"
                    required
                  />
                </div>

                {/* EPIC */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="block text-sm font-bold text-gray-800">Voter ID (EPIC)</label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 select-none cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={!form.hasEpic}
                        onChange={(e) => setForm({ ...form, hasEpic: !e.target.checked, epic: '' })}
                        className="w-4 h-4 rounded border-gray-300 text-yellow-400 focus:ring-yellow-400"
                      />
                      I don't have one
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={!form.hasEpic}
                    value={form.epic}
                    onChange={(e) => setForm({ ...form, epic: e.target.value.toUpperCase().replace(/\s/g, '').slice(0, 10) })}
                    className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl text-gray-900 uppercase tracking-wider placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all disabled:bg-gray-100 disabled:text-gray-400 font-semibold"
                    placeholder={form.hasEpic ? 'TNA1234567' : 'Skipped'}
                    maxLength={10}
                  />
                  {!form.hasEpic && (
                    <p className="text-xs text-gray-600 mt-2 font-medium">
                      You can still file grievances. Add your EPIC later from Profile.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-4 rounded-xl text-base font-bold bg-yellow-400 text-gray-900 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                  {busy ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Continue'}
                </button>
              </form>
            ) : (
              <form onSubmit={completeRegister} className="space-y-6">
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(''); setError(''); setInfo('') }}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1 font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Edit details
                </button>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2.5">6-Digit Code</label>
                  <input
                    ref={otpRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl text-gray-900 font-bold tracking-[0.5em] text-center text-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all bg-white"
                    placeholder="••••••"
                    required
                  />
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <span className="text-gray-500 font-medium">Code expires in 5 minutes</span>
                    <button
                      type="button"
                      onClick={requestOtp}
                      disabled={secondsLeft > 0 || busy}
                      className="font-bold text-yellow-600 hover:text-yellow-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'Resend OTP'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy || otp.length !== 6}
                  className="w-full py-4 rounded-xl text-base font-bold bg-yellow-400 text-gray-900 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                  {busy ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Verify & Create Account'}
                </button>
              </form>
            )}

            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600">
              Already registered?{' '}
              <Link to="/login" className="font-bold text-yellow-600 hover:text-yellow-700 transition-colors">
                Log In
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
