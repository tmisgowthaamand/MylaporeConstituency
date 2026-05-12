import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, MessageSquare, Plus, Search, User, ShieldAlert, CheckCircle2, PhoneCall, ArrowRight, Info, Filter } from 'lucide-react'
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
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredRequests = filterStatus === 'all'
    ? requests
    : requests.filter(r => r.status === filterStatus)

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
    <div className="flex min-h-[calc(100vh-80px)] bg-[#f4f6f8]">
      {/* ── LEFT SIDEBAR (Categories Filter) ── */}
      <div className="hidden lg:flex flex-col w-[260px] xl:w-[280px] shrink-0 bg-[#f0f2f5]">
        <div className="px-5 py-4 bg-gray-200">
          <h3 className="text-[11px] font-bold text-gray-600 tracking-widest uppercase">Filter by Status</h3>
        </div>

        <div className="overflow-y-auto flex flex-col">
          {[
            { id: 'all', label: 'All Requests', count: requests.length },
            { id: 'pending', label: 'Open', count: requests.filter(r => r.status === 'pending').length },
            { id: 'accepted', label: 'Accepted', count: requests.filter(r => r.status === 'accepted').length },
            { id: 'processing', label: 'In Progress', count: requests.filter(r => r.status === 'processing').length },
            { id: 'completed', label: 'Resolved', count: requests.filter(r => r.status === 'completed').length },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setFilterStatus(filter.id)}
              className={`w-full text-left px-5 py-3.5 flex items-center justify-between transition-all ${
                filterStatus === filter.id
                  ? 'bg-[#2c4569] text-white font-bold'
                  : 'text-gray-700 hover:bg-white font-medium'
              }`}
            >
              <span className="text-[15px]">{filter.label}</span>
              <span className={`text-sm font-bold px-2.5 py-0.5 rounded-md ${
                filterStatus === filter.id ? 'bg-white/25 text-white' : 'bg-gray-300 text-gray-700'
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto p-6 lg:p-12">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-[#1a3a6b] mb-2">My Requests</h1>
                <p className="text-gray-600">
                  {user?.name || 'Mylapore Resident'} — <strong>{requests.length}</strong> grievance{requests.length !== 1 ? 's' : ''} filed
                </p>
              </div>
              <button
                onClick={() => navigate('/grievance')}
                className="bg-[#1a3a6b] hover:bg-[#122d55] text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> New Request
              </button>
            </div>
          </div>

          {/* Status Tabs (Mobile) */}
          <div className="lg:hidden mb-6 flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Open' },
              { id: 'completed', label: 'Resolved' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFilterStatus(filter.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  filterStatus === filter.id
                    ? 'bg-[#1a3a6b] text-white'
                    : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Content Section */}
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin w-8 h-8 border-2 border-[#1a3a6b] border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-gray-500">Loading grievances...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-gray-600 text-lg mb-6">
                {filterStatus === 'all' ? 'No grievances raised yet.' : 'No grievances in this status.'}
              </p>
              <button
                onClick={() => navigate('/grievance')}
                className="bg-[#1a3a6b] hover:bg-[#122d55] text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors"
              >
                File Your First Grievance
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((g) => {
                const status = STATUS_LABELS[g.status] || STATUS_LABELS.pending
                const isClosed = g.status === 'completed' || g.status === 'rejected'
                return (
                  <div key={g._id || g.ticketId} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-bold text-[#1a3a6b]">#{g.ticketId}</span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${status.cls}`}>
                            {status.label}
                          </span>
                        </div>
                        <h3 className="text-[15px] font-bold text-gray-900">{g.optionTitle || g.optionId}</h3>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="inline-block bg-[#1a3a6b]/10 text-[#1a3a6b] text-xs font-bold px-3 py-1.5 rounded-lg">
                        {g.serviceTitle || g.serviceId}
                      </span>
                    </div>

                    {g.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4" />
                        {g.location}
                      </div>
                    )}

                    {g.description && (
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mb-4 border border-gray-100">
                        {g.description.substring(0, 200)}{g.description.length > 200 ? '...' : ''}
                      </p>
                    )}

                    {g.notes && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-green-800 mb-2">
                          <CheckCircle2 className="w-4 h-4" />
                          MLA Team Response:
                        </div>
                        <p className="text-sm text-green-800">{g.notes}</p>
                        {g.updatedAt && (
                          <p className="text-xs text-green-700 mt-2">Updated: {formatDate(g.updatedAt)}</p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(g.createdAt)}
                      </span>
                      <span className={`font-semibold px-2.5 py-1 rounded-full ${isClosed ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {isClosed ? 'Action Taken' : 'Awaiting Review'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                        <div className={`h-full rounded-full transition-all duration-700 ${status.bar}`} style={{ width: status.pct }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400">
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

      {/* ── RIGHT SIDEBAR (Citizen Profile + Help) ── */}
      <div className="hidden 2xl:flex flex-col w-[280px] shrink-0 bg-[#f0f2f5] overflow-y-auto">
        <div className="p-6">
          {/* Citizen Profile Card */}
          <div className="bg-gradient-to-br from-[#1a3a6b] to-[#2b4162] rounded-2xl p-6 text-white mb-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base">{user?.name || 'Citizen'}</h3>
                <p className="text-[10px] text-white/70 uppercase tracking-widest">Verified Resident</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white/10 rounded-lg p-3 flex justify-between items-center border border-white/20">
                <span className="text-xs font-semibold text-white/80">Total Filed</span>
                <span className="text-sm font-bold text-white">{requests.length}</span>
              </div>
              <div className="bg-white/10 rounded-lg p-3 flex justify-between items-center border border-white/20">
                <span className="text-xs font-semibold text-white/80">Resolved</span>
                <span className="text-sm font-bold text-white">{resolvedCount}</span>
              </div>
              <div className="bg-white/10 rounded-lg p-3 flex justify-between items-center border border-white/20">
                <span className="text-xs font-semibold text-white/80">Pending</span>
                <span className="text-sm font-bold text-white">{pendingCount}</span>
              </div>
            </div>
          </div>

          {/* Help & Support Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-[#1a3a6b]">Need Help?</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Grievances pending for more than 7 days are automatically escalated to the MLA's direct monitoring desk.
            </p>

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-start gap-2">
                <PhoneCall className="w-4 h-4 text-[#1a3a6b] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#1a3a6b]">Helpline Support</p>
                  <p className="text-[10px] text-gray-700">Available 9 AM - 6 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
