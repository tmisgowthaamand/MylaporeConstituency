import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Clock, MessageSquare, AlertCircle, PhoneCall, QrCode, CheckCircle2, Info, ArrowRight } from 'lucide-react'
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
  const navigate = useNavigate()
  const [trackId, setTrackId] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Catalog fetched from /portal/services
  const [services, setServices] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')

  useEffect(() => {
    let alive = true
    setCatalogLoading(true); setCatalogError('')
    api.get('/portal/services')
      .then((res) => { 
        if (alive) {
          const srvs = Array.isArray(res.data?.services) ? res.data.services : []
          setServices(srvs)
        } 
      })
      .catch((err) => { if (alive) setCatalogError(err.response?.data?.error || 'Could not load services.') })
      .finally(() => { if (alive) setCatalogLoading(false) })
    return () => { alive = false }
  }, [])

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
    <div className="flex min-h-[calc(100vh-80px)] bg-[#f4f6f8]">
      {/* ── LEFT SIDEBAR (Grievance Categories) ── */}
      <div className="hidden lg:flex flex-col w-[260px] xl:w-[280px] shrink-0 bg-white border-r border-gray-200 pt-6 pb-6">
        <div className="px-5 pb-4">
          <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Grievance Categories</h3>
        </div>
        
        {catalogLoading && (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Clock className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Loading...</span>
          </div>
        )}

        {!catalogLoading && catalogError && (
          <div className="flex items-start gap-2 bg-red-50 text-red-700 p-4 m-4 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>{catalogError}</div>
          </div>
        )}

        {!catalogLoading && !catalogError && (
          <div className="flex-1 flex flex-col justify-evenly">
            {services.map((s) => {
              // Highlight the category if it matches the tracked grievance
              const isActive = result && (result.serviceId === s.id || result.serviceTitle === s.title);
              return (
                <div
                  key={s.id}
                  className={`w-full flex items-center gap-3 px-5 py-3 transition-all duration-200 ${
                    isActive
                      ? 'bg-[#1a3a6b] text-white font-bold shadow-sm'
                      : 'text-gray-600 font-medium'
                  }`}
                >
                  <div className={`w-6 h-6 flex items-center justify-center shrink-0 ${
                    isActive ? 'text-white/80' : 'text-gray-400'
                  }`}>
                    {s.iconUrl ? (
                      <img src={s.iconUrl} alt={s.title} className={`w-full h-full object-contain ${isActive ? 'brightness-0 invert' : ''}`} />
                    ) : (
                      <div className="font-bold text-sm">{s.title?.charAt(0)}</div>
                    )}
                  </div>
                  <span className="text-sm truncate">{s.title}</span>
                  {isActive && (
                    <CheckCircle2 className="w-5 h-5 ml-auto shrink-0" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto">
        <div className="w-full max-w-2xl p-3 sm:p-4 md:p-6 lg:p-12">
          {/* Header Section */}
          <div className="mb-6 sm:mb-8 md:mb-10 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1a3a6b] mb-2 sm:mb-3">Track Status</h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600">
              Enter your reference ID to check the latest updates
            </p>
          </div>

          {/* Search Form Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm mb-6 md:mb-8 max-w-2xl mx-auto w-full overflow-hidden">
            <div className="bg-gradient-to-r from-[#1a3a6b] to-[#2b4162] px-6 md:px-8 py-4 md:py-5">
              <h2 className="text-white font-bold text-base md:text-lg">Track Your Grievance</h2>
              <p className="text-white/80 text-xs md:text-sm mt-1">Enter your reference ID to check status</p>
            </div>
            
            <form onSubmit={handleTrack} className="p-6 md:p-8">
              <div className="mb-4 md:mb-6">
                <label className="block text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Reference ID</label>
                <input
                  type="text"
                  className="w-full border-2 border-gray-300 rounded-lg md:rounded-xl px-4 md:px-5 py-3 md:py-4 text-center font-mono uppercase tracking-wider text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] focus:border-[#1a3a6b] transition-all placeholder:text-gray-400 bg-gray-50"
                  placeholder="TVK-XXXX-XXXX"
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value.toUpperCase())}
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-start gap-3 text-red-700 text-xs md:text-sm mb-4 md:mb-6 bg-red-50 p-4 md:p-5 rounded-lg border border-red-200">
                  <AlertCircle className="w-5 md:w-6 h-5 md:h-6 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-1">Error</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#1a3a6b] hover:bg-[#122d55] text-white py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-sm md:text-base transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !trackId.trim()}
              >
                {loading ? 'Searching...' : 'Track Status'}
              </button>
            </form>
            
            <div className="bg-blue-50 border-t border-blue-100 px-6 md:px-8 py-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  Your reference ID was sent to your registered mobile number and email when you filed the grievance.
                </p>
              </div>
            </div>
          </div>

          {/* Result Card */}
          {result && (() => {
            const status = STATUS[result.status] || STATUS.pending
            const isClosed = result.status === 'completed' || result.status === 'rejected'
            return (
              <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm max-w-2xl mx-auto w-full overflow-hidden">
                {/* Header with Ticket ID and Status */}
                <div className="bg-gradient-to-r from-[#1a3a6b] to-[#2b4162] px-6 md:px-8 py-5 md:py-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">Reference ID</div>
                      <div className="text-white font-mono text-xl md:text-2xl font-bold tracking-wider">#{result.ticketId}</div>
                    </div>
                    <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold ${status.cls} self-start sm:self-auto`}>
                      {status.label}
                    </span>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  {/* Issue Title */}
                  <div className="mb-6">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">{result.optionTitle || result.optionId}</h3>
                    <span className="inline-block bg-[#1a3a6b]/10 text-[#1a3a6b] text-xs md:text-sm font-bold px-3 md:px-4 py-1.5 md:py-2 rounded-lg border border-[#1a3a6b]/20">
                      {result.serviceTitle || result.serviceId}
                    </span>
                  </div>

                  {/* Location */}
                  {result.location && (
                    <div className="mb-5 pb-5 border-b border-gray-200">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Location</div>
                      <div className="flex items-start gap-2 text-sm text-gray-700">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[#1a3a6b]" />
                        <span>{result.location}</span>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {result.description && (
                    <div className="mb-5 pb-5 border-b border-gray-200">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</div>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-100 leading-relaxed">
                        {result.description}
                      </p>
                    </div>
                  )}

                  {/* MLA Response */}
                  {result.notes && (
                    <div className="mb-5 pb-5 border-b border-gray-200">
                      <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 md:p-5">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-bold text-green-800 mb-2">Official Response</div>
                            <p className="text-sm text-green-800 leading-relaxed">{result.notes}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>Submitted on {formatDate(result.createdAt)}</span>
                    </div>
                    <span className={`font-bold px-4 py-2 rounded-lg text-sm ${isClosed ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                      {isClosed ? 'Action Taken' : 'Awaiting Review'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Resolution Progress</div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                      <div className={`h-full rounded-full transition-all duration-700 ${status.bar}`} style={{ width: status.pct }} />
                    </div>
                    <div className="flex justify-between text-[10px] md:text-[11px] text-gray-500 font-medium">
                      <span>Received</span><span>Review</span><span>Action</span><span>Resolved</span>
                    </div>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="bg-blue-50 border-t border-blue-100 px-6 md:px-8 py-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs md:text-sm text-blue-900 font-semibold mb-1">Status Updates</p>
                      <p className="text-xs md:text-sm text-blue-800 leading-relaxed">
                        You will receive SMS and email notifications at each stage of the resolution process. For urgent queries, contact the helpline.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* ── RIGHT SIDEBAR (Status Guide) ── */}
      <div className="hidden 2xl:flex flex-col w-[320px] shrink-0 bg-[#f0f2f5] overflow-y-auto">
        <div className="p-6">
          {/* Status Guide Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#1a3a6b]" />
              </div>
              <div>
                <h3 className="font-bold text-[#1a3a6b] text-base">Status Guide</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">How tracking works</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0"></div>
                  <p className="text-sm font-bold text-gray-800">Request Submitted</p>
                </div>
                <p className="text-xs text-gray-600 ml-5">Waiting for initial review.</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600 flex-shrink-0"></div>
                  <p className="text-sm font-bold text-gray-800">Under Review</p>
                </div>
                <p className="text-xs text-gray-600 ml-5">Sent to officials for field action.</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-green-600 flex-shrink-0"></div>
                  <p className="text-sm font-bold text-gray-800">Approved & Resolved</p>
                </div>
                <p className="text-xs text-gray-600 ml-5">Action taken. Issue closed.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
