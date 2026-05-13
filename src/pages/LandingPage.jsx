import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useCallback, useState } from 'react'
import { ShieldCheck, UserPlus, Search, ArrowRight, MapPin, FileText, Eye, Phone, Mail, Globe, ChevronRight, AlertCircle, CheckCircle2, Timer, Users, Upload, Clock, Lock, Code } from 'lucide-react'
import { useLang } from '../i18n'
import { useAuth } from '../lib/auth'
import api from '../lib/api'

/* ——— Scroll-triggered reveal (landing.love style) ——— */
function useReveal() {
  const ref = useRef(null)
  const init = useCallback(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('shown'); io.unobserve(e.target) }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    el.querySelectorAll('.rv').forEach((c) => io.observe(c))
    return () => io.disconnect()
  }, [])
  useEffect(init, [init])
  return ref
}

export default function LandingPage() {
  const go = useNavigate()
  const root = useReveal()
  const { t } = useLang()
  const { user } = useAuth()

  const [stats, setStats] = useState({
    totalReceived: '1,247',
    totalResolved: '834',
    avgResponseTime: '7 days',
    satisfaction: '14,500+'
  })

  useEffect(() => {
    let cancelled = false
    api.get('/portal/stats')
      .then((r) => {
        if (cancelled || !r.data?.success) return
        const s = r.data.stats || {}
        setStats({
          totalReceived: Number(s.totalReceived || 0).toLocaleString('en-IN'),
          totalResolved: Number(s.totalResolved || 0).toLocaleString('en-IN'),
          avgResponseTime: s.avgResponseTime || '7 days',
          satisfaction: s.satisfaction || '0+',
        })
      })
      .catch(() => { /* keep defaults */ })
    return () => { cancelled = true }
  }, [])

  return (
    <div ref={root} className="bg-white">


      {/* ═══════ HERO ═══════ */}
      <section className="relative bg-[#990000] overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <img src="/bg.png" alt="Background" className="w-full h-full object-cover opacity-15" style={{ imageRendering: 'auto' }} />
        </div>

        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-12 sm:py-16 md:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-center">

            {/* Left — Copy */}
            <div className="max-w-full overflow-hidden">
              <div className="hero-anim inline-flex items-center gap-2 bg-saffron/20 text-saffron text-xs sm:text-sm font-bold px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6 tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-saffron dot-pulse" />{t('portalActive')}
              </div>

              <h1 className="hero-anim hero-anim-d1 text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-sans text-white leading-[1.15] tracking-tight break-words max-w-full">
                {t('heroTitle1')}<br />{t('heroTitle2')}{' '}
                <span className="text-saffron">{t('heroTitle3')}</span>
              </h1>

              <p className="hero-anim hero-anim-d2 text-white/80 text-sm sm:text-base md:text-lg leading-relaxed mt-4 sm:mt-6 max-w-md">
                {t('heroDesc')} <strong className="text-white">{t('heroMLA')}</strong>.
                {t('heroResponse')} <strong className="text-saffron">{t('heroResponseDays')}</strong>.
              </p>

              <div className="hero-anim hero-anim-d3 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mt-6 sm:mt-8">
                {user ? (
                  <>
                    <button onClick={() => go('/grievance')} className="bg-saffron text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg md:rounded-xl text-sm sm:text-base font-bold flex items-center justify-center gap-2 lift hover:bg-saffron/90 transition-colors shadow-lg shadow-saffron/20">
                      <FileText className="w-4 sm:w-5 h-4 sm:h-5" /> File a Grievance
                    </button>
                    <button onClick={() => go('/my-grievances')} className="bg-white/10 border border-white/20 backdrop-blur-sm text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg md:rounded-xl text-sm sm:text-base font-semibold flex items-center justify-center gap-2 lift hover:bg-white/20 transition-colors shadow-lg shadow-black/10">
                      My Requests <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => go('/login')} className="bg-saffron text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg md:rounded-xl text-sm sm:text-base font-bold flex items-center justify-center gap-2 lift hover:bg-saffron/90 transition-colors shadow-lg shadow-saffron/20">
                      Login Now
                    </button>
                    <button onClick={() => go('/register')} className="bg-white/10 border border-white/20 backdrop-blur-sm text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg md:rounded-xl text-sm sm:text-base font-semibold flex items-center gap-2.5 lift hover:bg-white/20 transition-colors shadow-lg shadow-black/10">
                      Register Now <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Mini stats */}
              <div className="hero-anim hero-anim-d4 flex flex-wrap gap-4 sm:gap-8 mt-10 pt-8 border-t border-white/20 max-w-full">
                {[
                  { n: stats.totalReceived, l: t('received') },
                  { n: stats.totalResolved, l: t('resolved') },
                  { n: stats.avgResponseTime, l: t('avgResponse') },
                ].map((s, i) => (
                  <div key={i} className="min-w-0 flex-shrink-0">
                    <div className="text-xl sm:text-2xl font-extrabold text-white leading-none break-words">{s.n}</div>
                    <div className="text-xs sm:text-sm text-white/60 uppercase tracking-widest mt-1 break-words">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Image */}
            <div className="img-reveal relative flex justify-center items-end mt-8 lg:mt-0 w-full max-w-full overflow-visible">
              <div className="relative w-full h-auto max-w-md lg:max-w-lg flex items-center justify-center">
                <img
                  src="/mla.png"
                  alt="MLA Venkatramanan"
                  className="w-full h-auto max-w-full block drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)]"
                  style={{
                    imageRendering: 'crisp-edges',
                    backfaceVisibility: 'hidden',
                    WebkitFontSmoothing: 'antialiased'
                  }}
                  loading="eager"
                  decoding="async"
                />
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ═══════ SERVICES ═══════ */}
      <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-[#f8f9fc] to-white relative overflow-hidden">
        {/* Decorative dots top-left */}
        <div className="absolute top-8 left-8 grid grid-cols-4 gap-1.5 opacity-30">
          {[...Array(16)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-300"></div>
          ))}
        </div>
        {/* Decorative blue blob right */}
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-72 h-72 bg-blue-100/40 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16 rv rv-up">
            <p className="text-xs sm:text-sm font-bold text-blue-600 uppercase tracking-[5px] mb-4">{t('whatYouCanDo')}</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0f1b3d] mb-5">{t('ourServices')}</h2>
            <div className="flex items-center justify-center gap-1.5 mx-auto mb-5">
              <div className="w-10 h-1 bg-blue-600 rounded-full"></div>
              <div className="w-10 h-1 bg-green-500 rounded-full"></div>
              <div className="w-10 h-1 bg-orange-500 rounded-full"></div>
            </div>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Modern, secure and efficient tools to simplify your grievance redressal experience.
            </p>
          </div>

          {/* Service Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7 lg:gap-8">
            {[
              {
                title: t('fileGrievance'),
                desc: t('fileGrievanceDesc'),
                to: '/grievance',
                number: '01',
                btnText: 'Get started',
                features: ['GPS location tagging', 'Upload photos & details', 'Instant reference ID'],
                hex: '#2563eb',
                hoverHex: '#1d4ed8',
                lightHex: '#dbeafe',
                dotHex: '#93c5fd',
                svgIcon: (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                    <path d="M8 13h2" /><path d="M8 17h2" />
                    <path d="M14 13h.01" /><path d="M14 17h.01" />
                  </svg>
                ),
              },
              {
                title: t('trackStatus'),
                desc: t('trackStatusDesc'),
                to: '/track',
                number: '02',
                btnText: 'Track now',
                features: ['Real-time status updates', 'Status timeline', 'SMS & email notifications'],
                hex: '#16a34a',
                hoverHex: '#15803d',
                lightHex: '#dcfce7',
                dotHex: '#86efac',
                svgIcon: (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <path d="M8 21h8" /><path d="M12 17v4" />
                    <path d="M7 13l3-4 3 2 4-5" />
                    <circle cx="17" cy="6" r="1.5" fill="white" stroke="none" />
                  </svg>
                ),
              },
              {
                title: t('viewResponse'),
                desc: t('viewResponseDesc'),
                to: '/my-grievances',
                number: '03',
                btnText: 'View responses',
                features: ['Official response', 'Resolution updates', 'Download documents'],
                hex: '#f97316',
                hoverHex: '#ea580c',
                lightHex: '#fff7ed',
                dotHex: '#fdba74',
                svgIcon: (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                    <path d="M14 2v6h6" />
                    <circle cx="13.5" cy="15.5" r="2.5" />
                    <path d="M15.4 17.4 17 19" />
                  </svg>
                ),
              },
            ].map((s, i) => (
              <div key={i} className="rv rv-up bg-white rounded-2xl px-8 pt-10 pb-8 border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col" data-d={i + 1}>
                {/* Icon + Number */}
                <div className="flex items-start justify-between mb-8">
                  {/* Icon with dot-grid border */}
                  <div className="relative w-[88px] h-[88px]">
                    {/* Dot grid background */}
                    <div className="absolute inset-0 rounded-[22px]"
                      style={{
                        backgroundImage: `radial-gradient(circle, ${s.dotHex} 1.5px, transparent 1.5px)`,
                        backgroundSize: '8px 8px',
                      }}
                    ></div>
                    {/* Solid icon */}
                    <div className="absolute inset-[10px] rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: s.hex }}
                    >
                      {s.svgIcon}
                    </div>
                  </div>
                  <span className="text-3xl font-extrabold select-none" style={{ color: s.hex, opacity: 0.35 }}>{s.number}</span>
                </div>

                {/* Color line */}
                <div className="w-8 h-[3px] rounded-full mb-5" style={{ backgroundColor: s.hex }}></div>

                {/* Title */}
                <h3 className="font-bold text-[#0f1b3d] text-[22px] mb-3">{s.title}</h3>

                {/* Description */}
                <p className="text-gray-500 text-[14px] leading-relaxed mb-7">{s.desc}</p>

                {/* Features */}
                <div className="space-y-3 mb-8 flex-1">
                  {s.features.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-[13px] text-gray-700">
                      <CheckCircle2 className="w-[18px] h-[18px] flex-shrink-0" style={{ color: s.hex }} />
                      <span className="font-medium">{f}</span>
                    </div>
                  ))}
                </div>

                {/* Button */}
                <button
                  onClick={() => go(s.to)}
                  className="inline-flex items-center justify-between px-6 py-3.5 rounded-xl text-white font-semibold text-[14px] transition-all duration-200 shadow-md hover:shadow-lg mt-auto"
                  style={{ backgroundColor: s.hex, width: '75%' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = s.hoverHex}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = s.hex}
                >
                  <span>{s.btnText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="py-12 sm:py-16 md:py-20 bg-white overflow-hidden">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6">
          <div className="text-center mb-14 rv rv-up">
            <p className="text-xs sm:text-sm font-bold text-saffron uppercase tracking-[4px] mb-3">{t('simpleProcess')}</p>
            <h2 className="text-3xl sm:text-4xl md:text-4xl font-bold font-sans text-navy">{t('howItWorks')}</h2>
            <div className="section-line mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
            {[
              { n: '01', Icon: ShieldCheck, t: t('step1'), d: t('step1Desc') },
              { n: '02', Icon: FileText, t: t('step2'), d: t('step2Desc') },
              { n: '03', Icon: MapPin, t: t('step3'), d: t('step3Desc') },
              { n: '04', Icon: CheckCircle2, t: t('step4'), d: t('step4Desc') },
            ].map((s, i) => (
              <div key={i} className="rv rv-up text-center" data-d={i + 1}>
                <div className="relative inline-block mb-5">
                  <div className="w-[88px] h-[88px] rounded-2xl bg-white border-2 border-gray-200 flex items-center justify-center mx-auto shadow-sm">
                    <s.Icon className="w-9 h-9 text-navy" />
                  </div>
                  <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-navy text-white text-xs font-bold flex items-center justify-center shadow-md">
                    {s.n}
                  </span>
                </div>
                <h4 className="font-bold text-lg sm:text-xl text-navy mb-2">{s.t}</h4>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ STATS BAR ═══════ */}
      <section className="rv rv-up overflow-hidden">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
          <div className="rounded-2xl bg-gradient-to-br from-navy-dark to-navy text-white p-8 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-60 h-60 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/[0.03] rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { v: stats.totalReceived, l: t('totalReceived'), Icon: FileText, c: 'text-white' },
                { v: stats.totalResolved, l: t('totalResolved'), Icon: CheckCircle2, c: 'text-green-400' },
                { v: stats.avgResponseTime, l: t('responseTime'), Icon: Timer, c: 'text-orange-300' },
                { v: stats.satisfaction, l: t('satisfaction'), Icon: Users, c: 'text-blue-300' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <s.Icon className="w-7 h-7 text-blue-300" />
                  </div>
                  <div>
                    <div className={`text-4xl md:text-5xl font-black leading-none tracking-tight ${s.c}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{s.v}</div>
                    <div className="text-xs sm:text-sm text-blue-200/70 uppercase tracking-widest mt-2 font-semibold">{s.l}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ INFO GRID ═══════ */}
      <section className="py-12 sm:py-16 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 grid md:grid-cols-2 gap-4 sm:gap-6">

          {/* Announcements */}
          <div className="rv rv-left bg-white rounded-2xl p-7 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg text-navy mb-5 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-saffron" /> {t('announcements')}
            </h3>
            <ul className="space-y-4">
              {[
                { t: t('ann1'), d: '05 May 2026' },
                { t: t('ann2'), d: '03 May 2026' },
                { t: t('ann3'), d: '28 Apr 2026' },
              ].map((a, i) => (
                <li key={i} className="flex items-start gap-3 text-base text-gray-800 pb-3.5 border-b border-gray-100 last:border-0 last:pb-0">
                  <span className="w-2 h-2 rounded-full bg-saffron mt-1.5 flex-shrink-0" />
                  <div><p className="leading-relaxed font-semibold">{a.t}</p><p className="text-sm text-gray-500 mt-1 font-medium">{a.d}</p></div>
                </li>
              ))}
            </ul>
          </div>

          {/* Constituency */}
          <div className="rv rv-up bg-white rounded-2xl p-7 border border-gray-200 shadow-sm" data-d="2">
            <h3 className="font-bold text-lg text-navy mb-5 flex items-center gap-2">
              <Globe className="w-5 h-5 text-navy" /> {t('constituencyInfo')}
            </h3>
            <div className="space-y-0 text-base">
              {[
                [t('infoConstituency'), t('infoConstVal')],
                [t('infoDistrict'), t('infoDistVal')],
                [t('infoMLA'), t('infoMLAVal')],
                [t('infoParty'), t('infoPartyVal')],
                [t('infoTerm'), t('infoTermVal')],
              ].map(([k, v], i) => (
                <div key={i} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600 font-medium">{k}</span>
                  <span className="font-bold text-navy">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="py-12 sm:py-16 bg-navy text-white rv rv-up overflow-hidden">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-4xl font-bold mb-4">{t('ctaTitle')}</h2>
          <p className="text-base sm:text-lg text-blue-200/80 mb-8 max-w-md mx-auto leading-relaxed">
            {t('ctaDesc')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => go('/grievance')} className="bg-white text-navy px-7 py-3.5 rounded-xl text-base font-bold lift hover:bg-gray-50 flex items-center gap-2">
              {t('ctaBtn')} <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => go('/track')} className="border-2 border-white/20 text-white px-7 py-3.5 rounded-xl text-base font-semibold hover:bg-white/10 transition-all flex items-center gap-2">
              {t('trackBtn')} <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

    </div>
  )
}
