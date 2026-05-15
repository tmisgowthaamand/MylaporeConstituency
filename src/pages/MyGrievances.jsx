import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, MessageSquare, Plus, Search, User, ShieldAlert, CheckCircle2, PhoneCall, ArrowRight, Info, Filter, ExternalLink, FileText, ChevronDown, ChevronUp } from 'lucide-react'
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

function formatDateTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).toUpperCase()
}

export default function MyGrievances() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [lightboxImg, setLightboxImg] = useState(null)

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
    <div className="flex min-h-[calc(100vh-80px)] flex-col lg:flex-row bg-[#f4f6f8]">
      {/* ── LEFT SIDEBAR (Categories Filter) ── */}
      <div className="hidden lg:flex flex-col w-[260px] xl:w-[280px] shrink-0 bg-[#f0f2f5]">
        <div className="px-4 md:px-5 py-3 md:py-4 bg-gray-200">
          <h3 className="text-[10px] md:text-[11px] font-bold text-gray-600 tracking-widest uppercase">Filter by Status</h3>
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
              className={`w-full text-left px-4 md:px-5 py-3 md:py-3.5 flex items-center justify-between transition-all text-sm ${
                filterStatus === filter.id
                  ? 'bg-[#2c4569] text-white font-bold'
                  : 'text-gray-700 hover:bg-white font-medium'
              }`}
            >
              <span>{filter.label}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
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
        <div className="max-w-[1100px] mx-auto p-3 sm:p-4 md:p-6 lg:p-12">
          {/* Header Section */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-6">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a3a6b] mb-1 md:mb-2">My Requests</h1>
                <p className="text-xs sm:text-sm md:text-base text-gray-600">
                  {user?.name || 'Mylapore Resident'} — <strong>{requests.length}</strong> grievance{requests.length !== 1 ? 's' : ''} filed
                </p>
              </div>
              <button
                onClick={() => navigate('/grievance')}
                className="bg-[#1a3a6b] hover:bg-[#122d55] text-white px-4 sm:px-6 py-2.5 md:py-3 rounded-lg md:rounded-xl font-bold text-xs sm:text-sm md:text-base flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
              >
                <Plus className="w-3 sm:w-4 h-3 sm:h-4" /> New Request
              </button>
            </div>
          </div>

          {/* Status Tabs (Mobile) */}
          <div className="lg:hidden mb-4 md:mb-6 flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Open' },
              { id: 'completed', label: 'Resolved' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFilterStatus(filter.id)}
                className={`px-3 sm:px-4 py-1.5 md:py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
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
            <div className="text-center py-12 md:py-20">
              <div className="animate-spin w-6 md:w-8 h-6 md:h-8 border-2 border-[#1a3a6b] border-t-transparent rounded-full mx-auto mb-2 md:mb-3" />
              <p className="text-xs md:text-base text-gray-500">Loading grievances...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-xl md:rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-[#1a3a6b] to-[#2b4162] px-6 md:px-8 py-4 md:py-5">
                <h3 className="text-white font-bold text-base md:text-lg">
                  {filterStatus === 'all' ? 'No Grievances Filed' : `No ${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Grievances`}
                </h3>
              </div>
              <div className="p-8 md:p-12 text-center">
                <div className="w-16 md:w-20 h-16 md:h-20 mx-auto mb-4 md:mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <MessageSquare className="w-8 md:w-10 h-8 md:h-10 text-gray-400" />
                </div>
                <h4 className="text-lg md:text-xl font-bold text-gray-800 mb-2 md:mb-3">
                  {filterStatus === 'all' ? 'No Grievances Registered' : 'No Grievances in This Category'}
                </h4>
                <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8 max-w-md mx-auto leading-relaxed">
                  {filterStatus === 'all' 
                    ? 'You have not filed any grievances yet. Submit your first grievance to get started with the resolution process.'
                    : `There are currently no grievances with "${filterStatus}" status. Try selecting a different filter or file a new grievance.`
                  }
                </p>
                {filterStatus === 'all' && (
                  <button
                    onClick={() => navigate('/grievance')}
                    className="bg-[#1a3a6b] hover:bg-[#122d55] text-white px-6 md:px-8 py-3 md:py-3.5 rounded-lg md:rounded-xl font-bold text-sm md:text-base transition-colors shadow-sm inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 md:w-5 h-4 md:h-5" />
                    File Your First Grievance
                  </button>
                )}
                {filterStatus !== 'all' && (
                  <button
                    onClick={() => setFilterStatus('all')}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 md:px-8 py-3 md:py-3.5 rounded-lg md:rounded-xl font-bold text-sm md:text-base transition-colors inline-flex items-center gap-2"
                  >
                    <Filter className="w-4 md:w-5 h-4 md:h-5" />
                    View All Grievances
                  </button>
                )}
              </div>
              <div className="bg-blue-50 border-t border-blue-100 px-6 md:px-8 py-4 md:py-5">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs md:text-sm text-blue-900 font-semibold mb-1">Information</p>
                    <p className="text-xs md:text-sm text-blue-800 leading-relaxed">
                      All grievances are tracked and monitored by the MLA office. You will receive updates via SMS and email at each stage of the resolution process.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {filteredRequests.map((g) => {
                const status = STATUS_LABELS[g.status] || STATUS_LABELS.pending
                const isClosed = g.status === 'completed' || g.status === 'rejected'
                const isExpanded = expandedId === (g._id || g.ticketId)
                const photos = g.imageUrl ? [g.imageUrl] : g.photos || g.images || []
                const hasLocation = g.location || (g.lat && g.lng)
                const googleMapsUrl = g.lat && g.lng ? `https://www.google.com/maps?q=${g.lat},${g.lng}` : null
                return (
                  <div key={g._id || g.ticketId} className="bg-white rounded-lg md:rounded-2xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden transition-all">
                    {/* Card Header — always visible, clickable */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : (g._id || g.ticketId))}
                      className="p-4 md:p-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3 md:mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-xs sm:text-sm font-bold text-[#1a3a6b]">#{g.ticketId}</span>
                            <span className={`inline-flex items-center px-2 md:px-3 py-0.5 md:py-1 rounded-lg text-xs font-semibold ${status.cls} flex-shrink-0`}>
                              {status.label}
                            </span>
                          </div>
                          <h3 className="text-sm md:text-[15px] font-bold text-gray-900 break-words">{g.optionTitle || g.optionId}</h3>
                        </div>
                        <div className="flex items-center gap-2 self-start">
                          <span className="inline-block bg-[#1a3a6b]/10 text-[#1a3a6b] text-xs font-bold px-2 md:px-3 py-1 md:py-1.5 rounded-lg">
                            {g.serviceTitle || g.serviceId}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500 mb-3 md:mb-4 pb-3 md:pb-4 border-b border-gray-100">
                        <span className="flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-3 md:w-4 h-3 md:h-4 flex-shrink-0" />
                          {formatDate(g.createdAt)}
                        </span>
                        <span className={`font-semibold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-xs flex-shrink-0 ${isClosed ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {isClosed ? 'Action Taken' : 'Awaiting Review'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="h-1.5 md:h-2 bg-gray-200 rounded-full overflow-hidden mb-1.5 md:mb-2">
                          <div className={`h-full rounded-full transition-all duration-700 ${status.bar}`} style={{ width: status.pct }} />
                        </div>
                        <div className="flex justify-between text-[9px] md:text-[10px] text-gray-400 gap-0.5">
                          <span>Received</span><span>Review</span><span>Action</span><span>Resolved</span>
                        </div>
                      </div>
                    </div>

                    {/* ─── EXPANDED DETAIL SECTIONS ─── */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-[#f4f6f8]">

                        {/* Your Submission */}
                        <div className="border-b border-gray-200 bg-[#edeef1]">
                          <div className="px-5 md:px-8 py-4 border-b border-gray-200">
                            <h2 className="text-base md:text-lg font-bold text-gray-900">Your Submission</h2>
                            <p className="text-xs text-gray-500 mt-0.5">What you reported when filing this grievance</p>
                          </div>
                          <div className="px-5 md:px-8 py-5 space-y-5">
                            {/* Category & Issue */}
                            <div className="flex flex-col sm:flex-row gap-5 sm:gap-10">
                              <div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                  <FileText className="w-3 h-3" /> Category
                                </div>
                                <p className="text-sm font-bold text-gray-900">{g.serviceTitle || g.serviceId || '-'}</p>
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                  <FileText className="w-3 h-3" /> Issue
                                </div>
                                <p className="text-sm font-bold text-gray-900">{g.optionTitle || g.optionId || '-'}</p>
                              </div>
                            </div>

                            {/* Description */}
                            {g.description && (
                              <div>
                                <div className="text-[10px] font-bold text-red-800 uppercase tracking-wider mb-1.5">Description</div>
                                <div className="bg-white rounded-xl border border-gray-200 p-4">
                                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">{g.description}</p>
                                </div>
                              </div>
                            )}

                            {/* Location */}
                            {hasLocation && (
                              <div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Location</div>
                                <div className="bg-white rounded-xl border border-gray-200 p-4">
                                  <div className="flex items-start gap-2.5">
                                    <MapPin className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-sm text-gray-800">{g.location}</p>
                                      {googleMapsUrl && (
                                        <a
                                          href={googleMapsUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-800 hover:text-red-900 mt-2 transition-colors"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                          Open in Google Maps ({Number(g.lat).toFixed(5)}, {Number(g.lng).toFixed(5)})
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Attached Photos */}
                        {photos.length > 0 && (
                          <div className="border-b border-gray-200 bg-[#edeef1]">
                            <div className="px-5 md:px-8 py-4 border-b border-gray-200">
                              <h2 className="text-base md:text-lg font-bold text-gray-900">Attached Photos</h2>
                              <p className="text-xs text-gray-500 mt-0.5">{photos.length} photo{photos.length !== 1 ? 's' : ''} you uploaded</p>
                            </div>
                            <div className="px-5 md:px-8 py-5">
                              <div className="flex flex-wrap gap-3">
                                {photos.map((url, i) => (
                                  <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); setLightboxImg(url) }}
                                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl border-2 border-gray-200 overflow-hidden hover:border-[#1a3a6b] transition-all hover:shadow-md group"
                                  >
                                    <img
                                      src={url}
                                      alt={`Attachment ${i + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      onError={(e) => { e.target.style.display = 'none' }}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Official Response */}
                        {g.notes && (
                          <div className="bg-[#edeef1]">
                            <div className="px-5 md:px-8 py-4 border-b border-gray-200">
                              <h2 className="text-base md:text-lg font-bold text-gray-900">Official Response</h2>
                              <p className="text-xs text-gray-500 mt-0.5">Message from MLA Venkatramanan's office</p>
                            </div>
                            <div className="px-5 md:px-8 py-5">
                              <div className="bg-red-50 rounded-xl border border-red-200 p-4 md:p-5">
                                <div className="flex items-center gap-2.5 mb-2.5">
                                  <div className="w-8 h-8 rounded-full bg-red-800 flex items-center justify-center">
                                    <MessageSquare className="w-3.5 h-3.5 text-yellow-400" />
                                  </div>
                                  <span className="text-xs font-bold text-red-800 uppercase tracking-wider">MLA Office</span>
                                </div>
                                <p className="text-sm text-gray-900 leading-relaxed mb-2.5">{g.notes}</p>
                                <p className="text-[10px] font-bold text-red-800 uppercase tracking-wider">
                                  Replied on {formatDateTime(g.updatedAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={lightboxImg}
            alt="Full size"
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
