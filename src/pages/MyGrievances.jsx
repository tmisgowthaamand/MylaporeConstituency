import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, MessageSquare, Plus, Search, User, ShieldAlert, CheckCircle2, PhoneCall } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../lib/auth'

/**
 * Lists every ServiceRequest filed by the current user — both the ones raised
 * here on the web and the ones raised earlier through the WhatsApp bot, since
 * the backend keys grievances by phone and our JWT carries that phone.
 */

const STATUS_LABELS = {
  pending:    { label: 'Open',        cls: 'bg-orange-100 text-orange-700',  bar: 'bg-saffron',    pct: '12%', icon: '🔴' },
  accepted:   { label: 'Accepted',    cls: 'bg-blue-100 text-blue-700',      bar: 'bg-tvk-blue',   pct: '30%', icon: '🔵' },
  processing: { label: 'In Progress', cls: 'bg-blue-100 text-blue-700',      bar: 'bg-tvk-blue',   pct: '55%', icon: '🔵' },
  completed:  { label: 'Resolved',    cls: 'bg-green-200 text-green-800',    bar: 'bg-tvk-green',  pct: '100%',icon: '✅' },
  rejected:   { label: 'Rejected',    cls: 'bg-red-100 text-red-700',        bar: 'bg-red-500',    pct: '100%',icon: '⛔' },
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MyGrievances() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchRequests = () => {
      api.get('/portal/grievances')
        .then((r) => { if (!cancelled) setRequests(Array.isArray(r.data?.requests) ? r.data.requests : []) })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoading(false) })
    }

    setLoading(true)
    fetchRequests()

    // Real-time polling every 5 seconds
    const interval = setInterval(fetchRequests, 5000)

    return () => { 
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const resolvedCount = requests.filter(r => r.status === 'completed').length;
  const pendingCount = requests.length - resolvedCount;

  return (
    <div className="min-h-screen bg-gray-50 pb-16 relative z-0">
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-30 z-0 pt-20">
        <img src="/35df4c78-0f29-4db2-87df-8b48fc2965d1.png" alt="Background" className="w-[80%] max-w-5xl h-[80%] object-contain" />
      </div>

      {/* ── LEFT SIDE WIDGET (Citizen Profile) ── */}
      <div className="hidden 2xl:flex fixed left-8 lg:left-12 top-32 w-72 flex-col pointer-events-none z-20">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white mt-8 animate-float transform transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-navy to-tvk-blue flex items-center justify-center text-white shadow-md">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-navy leading-tight">{user?.name || 'Citizen'}</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Verified Resident</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center border border-gray-100">
              <span className="text-xs font-semibold text-gray-600">Total Filed</span>
              <span className="text-sm font-bold text-navy">{requests.length}</span>
            </div>
            <div className="bg-green-50 rounded-xl p-3 flex justify-between items-center border border-green-100">
              <span className="text-xs font-semibold text-green-700">Resolved</span>
              <span className="text-sm font-bold text-green-700">{resolvedCount}</span>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 flex justify-between items-center border border-orange-100">
              <span className="text-xs font-semibold text-orange-700">Pending</span>
              <span className="text-sm font-bold text-orange-700">{pendingCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDE WIDGET (Escalation Policy) ── */}
      <div className="hidden 2xl:flex fixed right-8 lg:right-12 top-32 w-72 flex-col pointer-events-none z-20">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white mt-8 animate-float transform transition-all duration-300 hover:shadow-2xl" style={{ animationDelay: '2.5s' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shadow-sm border border-red-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-navy leading-tight">Need Help?</h3>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Escalation Policy</p>
            </div>
          </div>
          
          <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100 mb-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              We value your time. If any grievance remains pending for <strong className="text-red-600">more than 7 days</strong>, it is automatically escalated to the MLA's direct monitoring desk.
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-start gap-3">
            <PhoneCall className="w-4 h-4 text-navy mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-navy mb-0.5">Helpline Support</p>
              <p className="text-[10px] text-gray-500">Available 9 AM - 6 PM</p>
            </div>
          </div>
        </div>
      </div>

      <div className="page-header">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white font-serif mb-2 flex items-center gap-3">
                <span className="text-2xl md:text-3xl">📂</span> My Requests
              </h1>
              <p className="text-sm md:text-lg text-white/90">
                {user?.name || 'Mylapore Resident'} — <strong>{requests.length}</strong> grievance{requests.length !== 1 ? 's' : ''} filed
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => navigate('/track')} className="btn-outline border-white/20 text-white hover:bg-white/10 hover:border-white/30 text-sm py-2.5 px-4 flex items-center gap-2 shadow-sm">
                <Search className="w-4 h-4" /> Track
              </button>
              <button onClick={() => navigate('/grievance')} className="btn-primary bg-white text-navy hover:bg-gray-50 shadow-lg text-sm py-2.5 px-4 flex items-center gap-2">
                <Plus className="w-4 h-4" /> New Request
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 pb-8 -mt-10 md:-mt-16 relative z-10">

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-spin w-8 h-8 border-2 border-tvk-blue border-t-transparent rounded-full mx-auto mb-3" />
          Loading grievances...
        </div>
      ) : requests.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-500 mb-4">No grievances raised yet.</p>
          <button onClick={() => navigate('/grievance')} className="btn-primary text-sm">
            📋 Raise Your First Grievance
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((g) => {
            const status = STATUS_LABELS[g.status] || STATUS_LABELS.pending
            const isClosed = g.status === 'completed' || g.status === 'rejected'
            return (
              <div key={g._id || g.ticketId} className={`card p-5 ${g.status === 'completed' ? 'border-green-200 bg-green-50/30' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-tvk-blue tracking-wide">#{g.ticketId}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${status.cls}`}>
                    {status.icon} {status.label}
                  </span>
                </div>

                <div className="mb-2">
                  <span className="inline-block bg-tvk-blue-light text-tvk-blue text-xs font-bold px-2 py-0.5 rounded">
                    {g.serviceTitle || g.serviceId}
                  </span>
                </div>

                <h3 className="font-semibold text-sm text-gray-800 mb-1">{g.optionTitle || g.optionId}</h3>

                {g.location && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                    <MapPin className="w-3.5 h-3.5" />
                    {g.location}
                  </div>
                )}

                {g.description && (
                  <p className="text-xs text-gray-600 italic bg-gray-50 rounded p-2 mb-3">
                    "{g.description.substring(0, 140)}{g.description.length > 140 ? '...' : ''}"
                  </p>
                )}

                {g.notes && (
                  <div className="bg-white border border-green-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-tvk-green mb-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      MLA Team Response:
                    </div>
                    <p className="text-sm text-green-800">"{g.notes}"</p>
                    {g.updatedAt && (
                      <p className="text-xs text-green-600 mt-1">Updated: {formatDate(g.updatedAt)}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(g.createdAt)}
                  </span>
                  <span className={`font-semibold ${isClosed ? 'text-tvk-green' : 'text-saffron'}`}>
                    {isClosed ? '✓ Action Taken' : '⏳ Awaiting Review'}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${status.bar}`} style={{ width: status.pct }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>Received</span><span>Review</span><span>Action</span><span>Resolved</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
    </div>
  )
}
