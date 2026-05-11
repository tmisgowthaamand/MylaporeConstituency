import { useState } from 'react'
import { Search, MapPin, Clock, MessageSquare, AlertCircle, PhoneCall, QrCode, CheckCircle2 } from 'lucide-react'
import api from '../lib/api'

/**
 * Quick lookup by ticket ID. The endpoint is auth-protected, so the result is
 * scoped to the current user — looking up someone else's ticket returns 404.
 * That's intentional: any user who needs the full list of their own tickets
 * can use the My Grievances page instead.
 */

const STATUS = {
  pending:    { label: 'Open',        cls: 'bg-orange-100 text-orange-700', bar: 'bg-saffron',   pct: '12%',  icon: '🔴' },
  accepted:   { label: 'Accepted',    cls: 'bg-blue-100 text-blue-700',     bar: 'bg-tvk-blue',  pct: '30%',  icon: '🔵' },
  processing: { label: 'In Progress', cls: 'bg-blue-100 text-blue-700',     bar: 'bg-tvk-blue',  pct: '55%',  icon: '🔵' },
  completed:  { label: 'Resolved',    cls: 'bg-green-200 text-green-800',   bar: 'bg-tvk-green', pct: '100%', icon: '✅' },
  rejected:   { label: 'Rejected',    cls: 'bg-red-100 text-red-700',       bar: 'bg-red-500',   pct: '100%', icon: '⛔' },
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TrackStatus() {
  const [trackId, setTrackId] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleTrack(e) {
    e.preventDefault()
    setError('')
    setResult(null)
    const cleanId = trackId.trim().toUpperCase().replace('#', '')
    if (!cleanId) return setError('Please enter a Grievance ID')

    setLoading(true)
    try {
      const { data } = await api.get(`/portal/grievances/${encodeURIComponent(cleanId)}`)
      setResult(data.request)
    } catch (err) {
      const status = err.response?.status
      if (status === 404) setError(`No grievance found with ID "${cleanId}".`)
      else setError(err.response?.data?.error || 'Could not look up that ticket. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 relative z-0">
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-30 z-0 pt-20">
        <img src="/35df4c78-0f29-4db2-87df-8b48fc2965d1.png" alt="Background" className="w-[80%] max-w-5xl h-[80%] object-contain" />
      </div>

      {/* ── LEFT SIDE WIDGET (Abstract Map & Flag Blend) ── */}
      <div className="hidden 2xl:flex fixed left-8 lg:left-12 top-32 w-80 flex-col pointer-events-none z-20">
        <div className="pointer-events-auto relative w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl border border-white/40 mt-8 animate-float transform transition-all duration-300 hover:shadow-[0_30px_60px_-15px_rgba(139,0,0,0.3)] group">
          {/* Base gradient matching the flag colors (Red & Yellow) */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#a00000] via-[#8b0000] to-saffron/90 opacity-95"></div>
          
          {/* Subtle floating particles effect */}
          <div className="absolute top-10 left-10 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-saffron/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000 delay-100"></div>

          {/* The Flag/Map blend image with glow effect */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
             <div className="relative w-full h-full drop-shadow-[0_0_25px_rgba(255,255,255,0.2)] group-hover:drop-shadow-[0_0_35px_rgba(255,255,255,0.3)] transition-all duration-500">
                <img src="/35df4c78-0f29-4db2-87df-8b48fc2965d1.png" alt="Tamil Nadu Map" className="w-full h-full object-contain opacity-90 mix-blend-overlay group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
             </div>
          </div>

          {/* Text overlay */}
          <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/60 to-transparent">
             <h3 className="font-serif text-2xl font-bold text-white leading-tight drop-shadow-md">Our Land.</h3>
             <h3 className="font-serif text-2xl font-bold text-saffron leading-tight drop-shadow-md mb-2">Our Rights.</h3>
             <div className="w-12 h-1 bg-white/50 rounded-full mb-3"></div>
             <p className="text-xs text-white/90 font-medium tracking-wide">
               Building a transparent future, one grievance at a time.
             </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDE WIDGET (Clean Timeline & Support) ── */}
      <div className="hidden 2xl:flex fixed right-8 lg:right-12 top-32 w-80 flex-col pointer-events-none z-20 space-y-6">
        
        {/* Timeline Panel */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white mt-8 animate-float transform transition-all duration-300 hover:shadow-2xl" style={{ animationDelay: '2.5s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy to-tvk-blue flex items-center justify-center text-white shadow-md">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-navy leading-tight">Status Guide</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">How tracking works</p>
            </div>
          </div>
          
          <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
            <div className="relative group cursor-default">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-saffron shadow-[0_0_0_4px_rgba(255,255,255,1)] transition-transform duration-300"></div>
              <h4 className="text-sm font-bold text-gray-800 mb-1">Request Submitted</h4>
              <p className="text-xs text-gray-500 leading-snug">Waiting for initial review.</p>
            </div>
            <div className="relative group cursor-default">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-tvk-blue shadow-[0_0_0_4px_rgba(255,255,255,1)] transition-transform duration-300"></div>
              <h4 className="text-sm font-bold text-gray-800 mb-1">Under Review</h4>
              <p className="text-xs text-gray-500 leading-snug">Sent to officials for field action.</p>
            </div>
            <div className="relative group cursor-default">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_0_4px_rgba(255,255,255,1)] transition-transform duration-300"></div>
              <h4 className="text-sm font-bold text-gray-800 mb-1">Approved & Resolved</h4>
              <p className="text-xs text-gray-500 leading-snug">Action taken. Issue closed.</p>
            </div>
          </div>
        </div>

        {/* Support & QR Panel */}
        <div className="pointer-events-auto bg-gradient-to-br from-navy to-tvk-blue p-5 rounded-3xl shadow-xl border border-white/20 animate-float flex items-center justify-between group overflow-hidden relative" style={{ animationDelay: '3s' }}>
          {/* Subtle background glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-500"></div>
          
          <div className="flex flex-col gap-3.5 relative z-10">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/5">
                 <PhoneCall className="w-4 h-4 text-white" />
               </div>
               <div>
                 <p className="text-xs font-bold text-white/90 leading-none mb-1">Helpline</p>
                 <p className="text-xs text-white font-bold tracking-wide">1800-123-4567</p>
               </div>
             </div>
             
             <div className="w-24 h-[1px] bg-white/20 rounded-full"></div>
             
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-saffron animate-pulse shadow-[0_0_5px_#f26522]"></div>
               <p className="text-[9px] text-white/80 uppercase tracking-widest font-bold">Official App</p>
             </div>
          </div>
          
          <div className="relative z-10 w-[72px] h-[72px] bg-white rounded-2xl shadow-[0_10px_20px_-10px_rgba(0,0,0,0.3)] flex items-center justify-center flex-col gap-1 group-hover:scale-105 transition-transform duration-300 border-2 border-white/90">
             <QrCode className="w-8 h-8 text-navy" />
             <span className="text-[7px] font-bold text-navy text-center uppercase tracking-widest">Verify</span>
          </div>
        </div>
      </div>
      <div className="page-header">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-inner border border-white/20">
            <Search className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-white font-serif mb-3">Track Status</h1>
          <p className="text-sm md:text-lg text-white/90">Enter your reference ID to check the latest updates</p>
        </div>
      </div>
      <div className="max-w-md mx-auto px-4 pb-8 -mt-10 md:-mt-16 relative z-10">
        <div className="card p-6 md:p-8 shadow-xl border-0">

        <form onSubmit={handleTrack}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Reference ID</label>
            <input
              type="text"
              className="input-field text-center font-mono uppercase tracking-wider"
              placeholder="TVK-XXXX-XXXX"
              value={trackId}
              onChange={(e) => setTrackId(e.target.value.toUpperCase())}
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs mb-4 bg-red-50 p-3 rounded-lg border border-red-100">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full py-3.5"
            disabled={loading || !trackId.trim()}
          >
            {loading ? 'Searching...' : 'Track Status'}
          </button>
        </form>

        {result && (() => {
          const status = STATUS[result.status] || STATUS.pending
          const isClosed = result.status === 'completed' || result.status === 'rejected'
          return (
            <div className="mt-6 border rounded-xl p-5 bg-gray-50/60 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-tvk-blue tracking-wide">#{result.ticketId}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${status.cls}`}>
                  {status.icon} {status.label}
                </span>
              </div>

              <div className="mb-2">
                <span className="inline-block bg-tvk-blue-light text-tvk-blue text-xs font-bold px-2 py-0.5 rounded">
                  {result.serviceTitle || result.serviceId}
                </span>
              </div>

              <h3 className="font-semibold text-sm text-gray-800 mb-1">{result.optionTitle || result.optionId}</h3>

              {result.location && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                  <MapPin className="w-3.5 h-3.5" />
                  {result.location}
                </div>
              )}

              {result.description && (
                <p className="text-xs text-gray-600 italic bg-white rounded p-2 mb-3 border border-gray-100">
                  "{result.description}"
                </p>
              )}

              {result.notes && (
                <div className="bg-white border border-green-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-tvk-green mb-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    MLA Team Response:
                  </div>
                  <p className="text-sm text-green-800">"{result.notes}"</p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(result.createdAt)}
                </span>
                <span className={`font-semibold ${isClosed ? 'text-tvk-green' : 'text-saffron'}`}>
                  {isClosed ? '✓ Action Taken' : '⏳ Awaiting Review'}
                </span>
              </div>

              <div className="mt-3">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${status.bar}`} style={{ width: status.pct }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>Received</span><span>Review</span><span>Action</span><span>Resolved</span>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
    </div>
  )
}
