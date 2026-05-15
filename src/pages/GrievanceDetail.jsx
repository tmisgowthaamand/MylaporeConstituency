import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, FileText, MessageSquare, Clock, ExternalLink, Image as ImageIcon, Loader2 } from 'lucide-react'
import api from '../lib/api'

const STATUS_LABELS = {
  pending:    { label: 'Open',        cls: 'bg-orange-100 text-orange-700',  bar: 'bg-orange-500',  pct: '12%' },
  accepted:   { label: 'Accepted',    cls: 'bg-blue-100 text-blue-700',      bar: 'bg-blue-500',    pct: '30%' },
  processing: { label: 'In Progress', cls: 'bg-blue-100 text-blue-700',      bar: 'bg-blue-500',    pct: '55%' },
  completed:  { label: 'Resolved',    cls: 'bg-green-200 text-green-800',    bar: 'bg-green-500',   pct: '100%' },
  rejected:   { label: 'Rejected',    cls: 'bg-red-100 text-red-700',        bar: 'bg-red-500',     pct: '100%' },
}

function formatDateTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).toUpperCase()
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function GrievanceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [grievance, setGrievance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lightboxImg, setLightboxImg] = useState(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    api.get(`/portal/grievances/${encodeURIComponent(id)}`)
      .then(({ data }) => {
        if (alive) setGrievance(data.request || data.grievance || data)
      })
      .catch((err) => {
        if (alive) setError(err.response?.data?.error || 'Could not load grievance details.')
      })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#f4f6f8]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a3a6b] mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading grievance details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#f4f6f8]">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Not Found</h2>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button onClick={() => navigate(-1)} className="bg-[#1a3a6b] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#122d55] transition-colors">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!grievance) return null

  const status = STATUS_LABELS[grievance.status] || STATUS_LABELS.pending
  const photos = grievance.imageUrl
    ? [grievance.imageUrl]
    : grievance.photos || grievance.images || []
  const hasLocation = grievance.location || (grievance.lat && grievance.lng)
  const googleMapsUrl = grievance.lat && grievance.lng
    ? `https://www.google.com/maps?q=${grievance.lat},${grievance.lng}`
    : null

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f4f6f8]">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">

        {/* Back + Header */}
        <div className="mb-6 md:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Grievances
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1a3a6b]">#{grievance.ticketId}</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Filed on {formatDate(grievance.createdAt)}</p>
            </div>
            <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold ${status.cls} self-start`}>
              {status.label}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-5">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div className={`h-full rounded-full transition-all duration-700 ${status.bar}`} style={{ width: status.pct }} />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 font-medium">
              <span>Received</span><span>Review</span><span>Action</span><span>Resolved</span>
            </div>
          </div>
        </div>

        {/* ─── YOUR SUBMISSION ─── */}
        <div className="bg-[#edeef1] rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="px-6 md:px-8 py-5 border-b border-gray-200">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Your Submission</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">What you reported when filing this grievance</p>
          </div>

          <div className="px-6 md:px-8 py-6 space-y-6">
            {/* Category & Issue */}
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-12">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Category
                </div>
                <p className="text-base font-bold text-gray-900">{grievance.serviceTitle || grievance.serviceId || '-'}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Issue
                </div>
                <p className="text-base font-bold text-gray-900">{grievance.optionTitle || grievance.optionId || '-'}</p>
              </div>
            </div>

            {/* Description */}
            {grievance.description && (
              <div>
                <div className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2">Description</div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
                  <p className="text-sm md:text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{grievance.description}</p>
                </div>
              </div>
            )}

            {/* Location */}
            {hasLocation && (
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Location</div>
                <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm md:text-base text-gray-800">{grievance.location}</p>
                      {googleMapsUrl && (
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-800 hover:text-red-900 mt-2 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open in Google Maps ({Number(grievance.lat).toFixed(5)}, {Number(grievance.lng).toFixed(5)})
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── ATTACHED PHOTOS ─── */}
        {photos.length > 0 && (
          <div className="bg-[#edeef1] rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="px-6 md:px-8 py-5 border-b border-gray-200">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Attached Photos</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{photos.length} photo{photos.length !== 1 ? 's' : ''} you uploaded</p>
            </div>

            <div className="px-6 md:px-8 py-6">
              <div className="flex flex-wrap gap-3">
                {photos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxImg(url)}
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

        {/* ─── OFFICIAL RESPONSE ─── */}
        {grievance.notes && (
          <div className="bg-[#edeef1] rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="px-6 md:px-8 py-5 border-b border-gray-200">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Official Response</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Message from MLA Venkatramanan's office</p>
            </div>

            <div className="px-6 md:px-8 py-6">
              <div className="bg-red-50 rounded-xl border border-red-200 p-5 md:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-red-800 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-yellow-400" />
                  </div>
                  <span className="text-sm font-bold text-red-800 uppercase tracking-wider">MLA Office</span>
                </div>
                <p className="text-base text-gray-900 leading-relaxed mb-3">{grievance.notes}</p>
                <p className="text-xs font-bold text-red-800 uppercase tracking-wider">
                  Replied on {formatDateTime(grievance.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        )}

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
