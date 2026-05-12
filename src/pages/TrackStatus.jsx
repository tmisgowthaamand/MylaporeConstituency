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
    <div className="flex min-h-[calc(100vh-80px)] bg-[#f4f6f8]">
      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto p-6 lg:p-12">
          {/* Header Section */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold text-[#1a3a6b] mb-3">Track Status</h1>
            <p className="text-lg text-gray-600">
              Enter your reference ID to check the latest updates
            </p>
          </div>

          {/* Search Form Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-10 shadow-sm mb-8 max-w-2xl mx-auto">
            <form onSubmit={handleTrack}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-[#1a3a6b] uppercase tracking-widest mb-3">Reference ID</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-xl px-5 py-3.5 text-center font-mono uppercase tracking-wider text-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="TVK-XXXX-XXXX"
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value.toUpperCase())}
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm mb-6 bg-red-50 p-4 rounded-lg border border-red-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#1a3a6b] hover:bg-[#122d55] text-white py-3.5 rounded-xl font-bold text-base transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !trackId.trim()}
              >
                {loading ? 'Searching...' : 'Track Status'}
              </button>
            </form>
          </div>

          {/* Result Card */}
          {result && (() => {
            const status = STATUS[result.status] || STATUS.pending
            const isClosed = result.status === 'completed' || result.status === 'rejected'
            return (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 shadow-sm max-w-2xl mx-auto">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-[#1a3a6b]">#{result.ticketId}</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${status.cls}`}>
                        {status.label}
                      </span>
                    </div>
                    <h3 className="text-[17px] font-bold text-gray-900">{result.optionTitle || result.optionId}</h3>
                  </div>
                </div>

                <div className="mb-5">
                  <span className="inline-block bg-[#1a3a6b]/10 text-[#1a3a6b] text-xs font-bold px-3 py-1.5 rounded-lg">
                    {result.serviceTitle || result.serviceId}
                  </span>
                </div>

                {result.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <MapPin className="w-4 h-4" />
                    {result.location}
                  </div>
                )}

                {result.description && (
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 mb-5 border border-gray-100">
                    {result.description}
                  </p>
                )}

                {result.notes && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-green-800 mb-3">
                      <CheckCircle2 className="w-4 h-4" />
                      MLA Team Response:
                    </div>
                    <p className="text-sm text-green-800">{result.notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-600 mb-5 pb-5 border-b border-gray-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDate(result.createdAt)}
                  </span>
                  <span className={`font-semibold px-3 py-1 rounded-full ${isClosed ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {isClosed ? 'Action Taken' : 'Awaiting Review'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                    <div className={`h-full rounded-full transition-all ${status.bar}`} style={{ width: status.pct }} />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>Received</span><span>Review</span><span>Action</span><span>Resolved</span>
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
