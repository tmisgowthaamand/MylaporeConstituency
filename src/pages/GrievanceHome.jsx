import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, Send, ChevronRight, AlertCircle, Camera, X,
  Loader2, ExternalLink, FileText, ArrowLeft, CheckCircle2, Clock, ArrowRight, Info, Check, Lightbulb, Edit2, Upload
} from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../lib/auth'
import LocationPicker from '../components/LocationPicker'

/**
 * Phase machine that mirrors the WhatsApp flow's terminal actions defined in
 * backend/services/issueActions.js. The route AFTER sub-category branches on
 * optionObj.action.kind so each grievance type asks for only the fields that
 * specific issue needs — location-only, location+photo, description, or just
 * a URL/PDF resource pointer with no ticket created at all.
 */
const PHASE = {
  CATEGORY: 'category',
  OPTION:   'option',
  CTA:      'cta',      // for kind=url / kind=pdf  (no ticket)
  DETAILS:  'details',  // for kind=ticket / details_then_url
  LOCATION: 'location', // for both location flows
  PHOTO:    'photo',    // for location_photos_ticket
  CONFIRM:  'confirm',
}

// Ordered phase sequence per action kind — drives the progress bar and the
// "Back" buttons. CTA flows (url/pdf) terminate at the CTA step without
// hitting /portal/grievances.
const FLOWS = {
  url:                    [PHASE.CATEGORY, PHASE.OPTION, PHASE.CTA],
  pdf:                    [PHASE.CATEGORY, PHASE.OPTION, PHASE.CTA],
  ticket:                 [PHASE.CATEGORY, PHASE.OPTION, PHASE.DETAILS,  PHASE.CONFIRM],
  details_then_url:       [PHASE.CATEGORY, PHASE.OPTION, PHASE.DETAILS,  PHASE.CONFIRM],
  location_only_ticket:   [PHASE.CATEGORY, PHASE.OPTION, PHASE.LOCATION, PHASE.CONFIRM],
  location_photos_ticket: [PHASE.CATEGORY, PHASE.OPTION, PHASE.LOCATION, PHASE.PHOTO, PHASE.CONFIRM],
}

const LABELS = {
  url:                    ['Category', 'Issue', 'Resource'],
  pdf:                    ['Category', 'Issue', 'Document'],
  ticket:                 ['Category', 'Issue', 'Details',  'Done'],
  details_then_url:       ['Category', 'Issue', 'Details',  'Done'],
  location_only_ticket:   ['Category', 'Issue', 'Location', 'Done'],
  location_photos_ticket: ['Category', 'Issue', 'Location', 'Photo', 'Done'],
}

// Sensible default when an option has no action mapping (shouldn't normally
// happen, but keeps the wizard usable in that edge case).
const DEFAULT_KIND = 'ticket'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export default function GrievanceHome() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [phase, setPhase] = useState(PHASE.CATEGORY)
  const [serviceObj, setServiceObj] = useState(null)
  const [optionObj, setOptionObj] = useState(null)
  const [location, setLocation] = useState({ text: '', lat: null, lng: null })
  const [description, setDescription] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [certified, setCertified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [grievanceId, setGrievanceId] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [toast, setToast] = useState(null)

  // Catalog fetched from /portal/services — same admin-uploaded icons that
  // drive the WhatsApp flow show up here, single source of truth.
  const [services, setServices] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')

  const [activeCategoryPreview, setActiveCategoryPreview] = useState(null)

  useEffect(() => {
    let alive = true
    setCatalogLoading(true); setCatalogError('')
    api.get('/portal/services')
      .then((res) => { 
        if (alive) {
          const srvs = Array.isArray(res.data?.services) ? res.data.services : []
          setServices(srvs)
          if (srvs.length > 0) setActiveCategoryPreview(srvs[0])
        } 
      })
      .catch((err) => { if (alive) setCatalogError(err.response?.data?.error || 'Could not load services. Please retry in a moment.') })
      .finally(() => { if (alive) setCatalogLoading(false) })
    return () => { alive = false }
  }, [])

  const action = optionObj?.action || null
  const kind   = action?.kind || DEFAULT_KIND
  const flow   = FLOWS[kind]  || FLOWS[DEFAULT_KIND]
  const labels = LABELS[kind] || LABELS[DEFAULT_KIND]
  const stepIndex = Math.max(0, flow.indexOf(phase))

  /* ─── handlers ─────────────────────────────────────────────────── */

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > MAX_IMAGE_BYTES) {
      alert('Image too large. Please select a photo smaller than 10MB.')
      e.target.value = ''
      return
    }
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImage(null); setImagePreview(null)
  }

  const handleLocationSelect = useCallback((loc) => setLocation(loc), [])

  const [geoLoading, setGeoLoading] = useState(false)
  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) { setToast('Geolocation is not supported by your browser.'); setTimeout(() => setToast(null), 5000); return }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        let { latitude, longitude } = pos.coords
        // Validate India bounds (lat: 6-37, lng: 68-98). If outside, default to Chennai.
        const inIndia = latitude >= 6 && latitude <= 37 && longitude >= 68 && longitude <= 98
        if (!inIndia) {
          latitude = 13.0827; longitude = 80.2707
        }
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&countrycodes=in`)
          const data = await res.json()
          const addr = data.address || {}
          const shortAddr = [addr.road, addr.suburb || addr.neighbourhood, addr.city || addr.town || addr.county, addr.state].filter(Boolean).join(', ')
          setLocation({ ...location, text: shortAddr || data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, lat: latitude, lng: longitude })
          if (!inIndia) { setToast('Location outside India — defaulted to Chennai. Please select your district & area.'); setTimeout(() => setToast(null), 5000) }
        } catch {
          setLocation({ ...location, text: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, lat: latitude, lng: longitude })
        } finally { setGeoLoading(false) }
      },
      (err) => { setToast('Unable to get location: ' + err.message); setTimeout(() => setToast(null), 5000); setGeoLoading(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Wipe everything past sub-category so going Back never carries a stale
  // description / location / photo into a different action kind.
  const resetDownstream = () => {
    setLocation({ text: '', lat: null, lng: null })
    setDescription('')
    setImage(null); setImagePreview(null)
    setSubmitError('')
    setGrievanceId(null)
    setCertified(false)
  }

  const pickService = (s) => {
    setServiceObj(s); setOptionObj(null); resetDownstream(); setPhase(PHASE.OPTION)
  }

  const pickOption = (o) => {
    setOptionObj(o); resetDownstream()
    const k = o.action?.kind || DEFAULT_KIND
    if (k === 'url' || k === 'pdf') setPhase(PHASE.CTA)
    else setPhase(PHASE.DETAILS)
  }

  const submitTicket = async () => {
    if (!user) {
      setToast('Please log in to submit a grievance.'); setTimeout(() => setToast(null), 5000)
      navigate('/login')
      return
    }
    if (!serviceObj || !optionObj) return

    // Validate required fields
    if (!description || !description.trim()) {
      setSubmitError('Please provide a description of the issue.')
      return
    }

    if (!certified) {
      setSubmitError('Please certify that the information is accurate before submitting.')
      return
    }

    setLoading(true); setSubmitError('')
    try {
      const fd = new FormData()
      fd.append('serviceId',    serviceObj.id)
      fd.append('serviceTitle', serviceObj.title)
      fd.append('optionId',     optionObj.id)
      fd.append('optionTitle',  optionObj.title)
      fd.append('description',  description.trim())
      fd.append('location',     location.text || '')
      if (location.lat != null) fd.append('lat', location.lat)
      if (location.lng != null) fd.append('lng', location.lng)

      // If no image provided, create a placeholder image
      if (image) {
        fd.append('image', image)
      } else {
        // Create a minimal 1x1 transparent PNG as placeholder
        const placeholderBlob = await new Promise((resolve) => {
          const canvas = document.createElement('canvas')
          canvas.width = 1
          canvas.height = 1
          canvas.toBlob(resolve, 'image/png')
        })
        fd.append('image', placeholderBlob, 'placeholder.png')
      }

      const res = await api.post('/portal/grievances', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setGrievanceId(res.data.grievanceId)
      setPhase(PHASE.CONFIRM)
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to submit. Please check your connection and try again.'
      setSubmitError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  /* ─── render ───────────────────────────────────────────────────── */

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-[#f4f6f8]">

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in-right max-w-sm">
          <div className="bg-[#1a3a6b] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-start gap-3 border border-white/10">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">{toast}</p>
            <button onClick={() => setToast(null)} className="text-white/50 hover:text-white shrink-0 ml-2 mt-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── LEFT SIDEBAR (GLOBAL) ── */}
      <div className="hidden lg:flex flex-col w-[260px] xl:w-[280px] shrink-0 bg-white border-r border-gray-200 pt-6">
        <div className="px-5 pb-4">
          <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Grievance Categories</h3>
        </div>
        
        {catalogLoading && (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Loading services...</span>
          </div>
        )}

        {!catalogLoading && catalogError && (
          <div className="flex items-start gap-2 bg-red-50 text-red-700 p-4 m-4 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>{catalogError}</div>
          </div>
        )}

        {!catalogLoading && !catalogError && (
          <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar flex flex-col justify-between">
            {services.map((s) => {
              const isActive = (activeCategoryPreview?.id === s.id && phase === PHASE.CATEGORY) || (serviceObj?.id === s.id && phase !== PHASE.CATEGORY);
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveCategoryPreview(s)
                    setPhase(PHASE.CATEGORY)
                  }}
                  className={`w-full flex items-center gap-3 px-5 py-3 transition-all duration-200 text-left ${
                    isActive
                      ? 'bg-[#1a3a6b] text-white font-bold shadow-sm' 
                      : 'text-gray-600 hover:text-[#2b4162] hover:bg-gray-100 font-medium'
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
                  <span className="text-[20px] truncate">{s.title}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* ── BOTTOM HELP BLOCK ── */}
        <div className="mt-auto p-6 bg-gray-50/50 border-t border-gray-100">
          <button className="flex items-center gap-3 w-full text-left group">
            <Info className="w-6 h-6 text-[#2b4162] shrink-0 group-hover:scale-110 transition-transform" />
            <span className="text-[15px] font-medium text-[#2b4162] leading-tight">
              Need help<br/>choosing?
            </span>
          </button>
        </div>
      </div>

      {/* ── MAIN RIGHT CONTENT ── */}
      <div className="flex-1 bg-transparent overflow-y-auto min-w-0 pb-20">
        <div className="max-w-[1100px] mx-auto p-6 lg:p-12">
          
          {/* Progress Bar — Stitch Style */}
          {(() => {
            let currentStep = 0;
            if (phase === PHASE.CATEGORY) currentStep = 0;
            else if (phase === PHASE.OPTION) currentStep = 1;
            else if (phase === PHASE.DETAILS || phase === PHASE.LOCATION || phase === PHASE.PHOTO) currentStep = 1;
            else if (phase === PHASE.CONFIRM) currentStep = 2;
            
            return (
              <div className="max-w-2xl mx-auto mb-12 mt-2">
                <div className="flex items-center justify-between relative">
                  {/* Connecting Lines */}
                  <div className="absolute left-[16%] right-[16%] top-[20px] h-[3px] bg-gray-200 z-0"></div>
                  <div className="absolute left-[16%] top-[20px] h-[3px] bg-[#1a3a6b] z-0 transition-all duration-700" style={{ width: currentStep === 0 ? '0%' : currentStep === 1 ? '34%' : '68%' }}></div>
                  
                  {['Category', 'Details', 'Review'].map((label, i) => (
                    <div key={label} className="flex flex-col items-center gap-2 z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        i < currentStep 
                          ? 'bg-[#1a3a6b] text-white' 
                          : i === currentStep 
                            ? 'bg-[#1a3a6b] text-white ring-4 ring-[#1a3a6b]/20' 
                            : 'bg-white text-gray-400 border-2 border-gray-300'
                      }`}>
                        {i < currentStep ? <Check className="w-5 h-5" /> : i + 1}
                      </div>
                      <span className={`text-xs font-semibold ${
                        i <= currentStep ? 'text-[#1a3a6b]' : 'text-gray-400'
                      }`}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* ── PHASE: CATEGORY ── */}
          {phase === PHASE.CATEGORY && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold text-[#2b4162] mb-3">Select Issue Category</h2>
              <p className="text-gray-500 text-[14px] mb-8">Please choose the department that best aligns with your grievance for faster resolution.</p>

              {/* MOBILE/TABLET CATEGORY GRID */}
              <div className="lg:hidden grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
                {services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveCategoryPreview(s)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                      activeCategoryPreview?.id === s.id
                        ? 'border-[#2b4162] bg-[#f4f6f8] text-[#2b4162] shadow-[inset_0_0_0_1px_#2b4162]'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 mb-3 flex items-center justify-center shrink-0 ${
                      activeCategoryPreview?.id === s.id ? 'text-[#2b4162]' : 'text-gray-400'
                    }`}>
                      {s.iconUrl ? (
                        <img src={s.iconUrl} alt={s.title} className="w-full h-full object-contain" />
                      ) : (
                        <div className="font-bold text-xl">{s.title?.charAt(0)}</div>
                      )}
                    </div>
                    <span className={`text-[11px] text-center leading-tight ${activeCategoryPreview?.id === s.id ? 'font-bold' : 'font-medium'}`}>
                      {s.title}
                    </span>
                  </button>
                ))}
              </div>

              {activeCategoryPreview ? (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Category Details Card */}
                  <div className="xl:col-span-2 bg-white rounded-[20px] p-8 lg:p-10 border border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col">
                    <img src="/35df4c78-0f29-4db2-87df-8b48fc2965d1.png" alt="Map Watermark" className="absolute -right-20 -bottom-10 w-[500px] h-[500px] object-contain opacity-[0.03] pointer-events-none z-0" />
                    
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2b4162] text-white text-[10px] font-bold uppercase tracking-wider mb-6 self-start relative z-10 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Most Frequent
                    </div>

                    <h3 className="text-2xl lg:text-[26px] font-bold text-[#2b4162] mb-4 relative z-10">{activeCategoryPreview.title}</h3>
                    <p className="text-gray-500 text-[14px] leading-relaxed relative z-10 mb-10 max-w-[90%]">{activeCategoryPreview.description || 'Certificates, patta, relief and other documentation requests.'}</p>
                    
                    <div className="grid grid-cols-2 gap-y-5 gap-x-6 mb-12 relative z-10">
                      {(activeCategoryPreview.options?.length > 0 ? activeCategoryPreview.options.slice(0, 4).map(o => o.title) : ['Income Certificate Issue', 'Patta Issue', 'Disaster Relief', 'Death / Birth Certificate']).map(item => (
                        <div key={item} className="flex items-center gap-3 text-[13px] text-gray-700 font-medium">
                          <div className="w-5 h-5 rounded-full bg-transparent border border-[#2b4162] flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-[#2b4162]" />
                          </div>
                          <span className="line-clamp-1">{item}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto relative z-10 self-start">
                      <button onClick={() => pickService(activeCategoryPreview)} className="bg-[#2b4162] hover:bg-[#1a2942] text-white px-8 py-3.5 rounded-xl font-bold text-[13px] transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                        Proceed with {activeCategoryPreview.title} <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* SLA Tracking Card */}
                  <div className="bg-white rounded-[20px] p-6 lg:p-8 border border-gray-200 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                    {(() => {
                      const slaMapping = {
                        'Civic Works': { desc: 'Civic issues are typically acknowledged within 24 hours and resolved within 7 working days.', avg: '4.2 Days', percent: '60%' },
                        'Revenue': { desc: 'Revenue documentation requests are acknowledged in 48 hours and resolved within 14 days.', avg: '10.5 Days', percent: '75%' },
                        'Health': { desc: 'Health-related grievances are prioritized and typically resolved within 3 to 5 working days.', avg: '3.1 Days', percent: '45%' },
                        'Education': { desc: 'Education requests are acknowledged within 48 hours and processed within 10 working days.', avg: '7.4 Days', percent: '70%' },
                        'Ration': { desc: 'PDS and ration issues are fast-tracked for resolution within 2 to 4 working days.', avg: '2.8 Days', percent: '40%' },
                        'Agriculture': { desc: 'Agricultural grievances are reviewed by the respective local officer within 5 working days.', avg: '5.5 Days', percent: '55%' },
                        'Law & Order': { desc: 'Law & Order complaints are immediately routed to local stations with a 24-hour SLA.', avg: '1.2 Days', percent: '20%' },
                        'Employment': { desc: 'Employment and job fair queries are processed in batches within 7 working days.', avg: '6.0 Days', percent: '80%' },
                        'Personal Assistance': { desc: 'Personal petitions to the MLA are reviewed weekly and updated accordingly.', avg: '8.5 Days', percent: '65%' },
                      }
                      const activeSLA = slaMapping[activeCategoryPreview?.title] || { desc: 'Requests in this category are typically acknowledged within 48 hours and resolved within 7-10 days.', avg: '5.0 Days', percent: '50%' }
                      
                      return (
                        <>
                          <div>
                            <div className="w-10 h-10 rounded-xl bg-transparent border border-gray-200 flex items-center justify-center mb-6">
                              <Clock className="w-5 h-5 text-[#2b4162]" />
                            </div>
                            <h4 className="text-[16px] font-bold text-[#2b4162] mb-3">SLA Tracking</h4>
                            <p className="text-[13px] text-gray-500 leading-relaxed transition-all duration-300">
                              {activeSLA.desc}
                            </p>
                          </div>
                          <div className="mt-auto pt-8">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Avg. Resolution</span>
                              <span className="text-[11px] font-bold text-[#2b4162] transition-all duration-300">{activeSLA.avg}</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-[#2b4162] rounded-full transition-all duration-700 ease-out" style={{ width: activeSLA.percent }}></div>
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </div>
              ) : null}

              {/* Sub Cards visual decoration — dynamic per category */}
              {(() => {
                const categoryCards = {
                  'Civic Works': [
                    { img: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=600', title: 'Roads & Transport', desc: 'Potholes, Signage, Lighting' },
                    { img: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=80&w=600', title: 'Environment', desc: 'Parks, Waste, Pollution' },
                    { img: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=600', title: 'Utilities', desc: 'Water, Drainage, Sewage' },
                  ],
                  'Revenue': [
                    { img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=600', title: 'Land Records', desc: 'Patta, Chitta, FMB' },
                    { img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=600', title: 'Certificates', desc: 'Income, Nativity, Community' },
                    { img: 'https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&q=80&w=600', title: 'Disaster Relief', desc: 'Flood, Fire, Compensation' },
                  ],
                  'Health': [
                    { img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600', title: 'Hospitals & PHC', desc: 'Treatment, Beds, Staff' },
                    { img: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&q=80&w=600', title: 'Vaccination', desc: 'Camps, Schedules, Records' },
                    { img: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?auto=format&fit=crop&q=80&w=600', title: 'Ambulance', desc: '108 Service, Emergency' },
                  ],
                  'Education': [
                    { img: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=600', title: 'Schools', desc: 'Infrastructure, Teachers' },
                    { img: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&q=80&w=600', title: 'Mid-Day Meals', desc: 'Quality, Supply, Nutrition' },
                    { img: 'https://images.unsplash.com/photo-1461896836934-bd45ba8f8e7b?auto=format&fit=crop&q=80&w=600', title: 'Sports & Arts', desc: 'Grounds, Equipment, Events' },
                  ],
                  'Ration': [
                    { img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600', title: 'Ration Card', desc: 'New, Transfer, Correction' },
                    { img: 'https://images.unsplash.com/photo-1595854341625-f33ee10dbf94?auto=format&fit=crop&q=80&w=600', title: 'Fair Price Shop', desc: 'Supply, Quality, Timing' },
                    { img: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80&w=600', title: 'Pension', desc: 'Old Age, Widow, Disability' },
                  ],
                  'Agriculture': [
                    { img: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=600', title: 'Crop Insurance', desc: 'Claims, Coverage, Premium' },
                    { img: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=600', title: 'Farm Loans', desc: 'Subsidies, Schemes, Relief' },
                    { img: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=600', title: 'Irrigation', desc: 'Canals, Borewells, Water' },
                  ],
                  'Law & Order': [
                    { img: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?auto=format&fit=crop&q=80&w=600', title: 'FIR & Complaints', desc: 'Filing, Follow-up, Status' },
                    { img: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=600', title: 'Legal Aid', desc: 'Free Counsel, Awareness' },
                    { img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=600', title: 'Public Safety', desc: 'Patrol, CCTV, Street Lights' },
                  ],
                  'Employment': [
                    { img: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=600', title: 'Job Fairs', desc: 'Events, Registration, Dates' },
                    { img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=600', title: 'Skill Training', desc: 'Courses, MSME, Workshops' },
                    { img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600', title: 'EPF & Benefits', desc: 'Provident Fund, ESI, Claims' },
                  ],
                  'Personal Assistance': [
                    { img: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&q=80&w=600', title: 'MLA Petition', desc: 'Direct Appeals, Meetings' },
                    { img: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=600', title: 'Marriage & Family', desc: 'Disputes, Counselling, Aid' },
                    { img: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&q=80&w=600', title: 'Senior Citizens', desc: 'Old Age Home, Welfare, Care' },
                  ],
                }
                const cards = categoryCards[activeCategoryPreview?.title] || categoryCards['Civic Works']
                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
                    {cards.map((card, idx) => (
                      <button key={idx} onClick={() => pickService(activeCategoryPreview)} className="h-44 rounded-2xl relative overflow-hidden flex items-end p-5 group border border-transparent shadow-sm">
                        <img src={card.img} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={card.title} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div className="relative z-10 text-left w-full">
                          <p className="text-white text-[15px] font-bold group-hover:text-gray-200 transition-colors">{card.title}</p>
                          <p className="text-gray-300 text-[11px] mt-1 font-medium">{card.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              })()}

            </div>
          )}

          {/* ── PHASE: OPTION ── */}
          {phase === PHASE.OPTION && serviceObj && (
            <div className="animate-fade-in">
              <div className="bg-[#edeef1] rounded-[24px] border border-gray-200 shadow-sm overflow-hidden max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-[#344966] px-8 py-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    {serviceObj.iconUrl ? (
                      <img src={serviceObj.iconUrl} alt={serviceObj.title} className="w-6 h-6 object-contain brightness-0 invert opacity-90" />
                    ) : (
                      <FileText className="w-6 h-6 text-white/80" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-[20px] font-bold text-white tracking-wide">Step 2: Select Issue Type</h2>
                    <p className="text-white/70 text-[14px] mt-0.5">Choose the specific issue under <strong className="text-white/90 font-semibold">{serviceObj.title}</strong></p>
                  </div>
                </div>

                <div className="p-6 lg:p-10">
                  <div className="grid md:grid-cols-2 gap-4">
                    {(serviceObj.options || []).map((opt, i) => (
                      <button
                        key={opt.id}
                        onClick={() => pickOption(opt)}
                        className="w-full text-left p-4 lg:p-5 border border-[#d1d5db] rounded-[16px] hover:border-[#344966] hover:bg-[#f8f9fa] bg-transparent transition-all flex items-center gap-4 group"
                      >
                        <div className="w-12 h-12 rounded-[12px] bg-[#e1e4e8] group-hover:bg-[#ebedf0] flex items-center justify-center overflow-hidden flex-shrink-0 transition-colors shadow-inner">
                          {opt.iconUrl ? (
                            <img src={opt.iconUrl} alt={opt.title} className="w-7 h-7 object-contain mix-blend-multiply" />
                          ) : (
                            <div className="text-[#344966] font-bold text-lg">{i + 1}</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[15px] text-[#344966] mb-0.5 truncate">{opt.title}</div>
                          <div className="text-[12px] text-gray-500 leading-relaxed truncate">{opt.description || 'Report an issue in this category'}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#344966] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </button>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-[#d8dce2] flex">
                    <button onClick={() => setPhase(PHASE.CATEGORY)} className="px-5 py-2.5 rounded-[12px] border border-[#d1d5db] bg-transparent hover:bg-white hover:border-[#c5c9d1] text-gray-600 font-semibold transition-all flex items-center gap-2 text-[13px]">
                      <ArrowLeft className="w-4 h-4" /> Back to Categories
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PHASE: DETAILS ── (Stitch Split Layout) */}
          {phase === PHASE.DETAILS && optionObj && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold text-[#1a3a6b] mb-2">Grievance Details</h2>
              <p className="text-gray-600 text-[14px] mb-8">Provide accurate information about the issue you are facing to help our department resolve it efficiently. You can also pin the location on the map.</p>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* LEFT: Form Card */}
                <div className="xl:col-span-2 bg-white rounded-[20px] border border-gray-200 p-6 lg:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
                  
                  {/* Issue Title */}
                  <div className="mb-6">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Issue Title</label>
                    <input
                      type="text"
                      className="w-full border border-gray-200 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] focus:border-transparent transition-all placeholder:text-gray-400"
                      placeholder="e.g., Damaged streetlight on 5th Avenue"
                      value={description.split('\n')[0] || ''}
                      onChange={(e) => {
                        const rest = description.split('\n').slice(1).join('\n')
                        setDescription(e.target.value + (rest ? '\n' + rest : ''))
                      }}
                    />
                  </div>

                  {/* Detailed Description */}
                  <div className="mb-6">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Detailed Description</label>
                    <textarea
                      className="w-full border border-gray-200 rounded-xl p-5 h-32 resize-vertical text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] focus:border-transparent transition-all placeholder:text-gray-400"
                      placeholder="Describe the problem in detail, including how long it has been persistent..."
                      value={description}
                      onChange={(e) => e.target.value.length <= 500 && setDescription(e.target.value)}
                    />
                  </div>

                  {/* Location Selection */}
                  <div className="mb-6">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Location</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {/* District */}
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">District</label>
                        <select
                          className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] focus:border-transparent transition-all text-[#2b4162] font-medium appearance-none cursor-pointer"
                          value={location.district || ''}
                          onChange={(e) => setLocation({ ...location, district: e.target.value, area: '', text: e.target.value })}
                        >
                          <option value="">Select District</option>
                          <option value="Chennai">Chennai</option>
                        </select>
                      </div>
                      {/* Area / Locality */}
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Area / Locality</label>
                        <select
                          className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] focus:border-transparent transition-all text-[#2b4162] font-medium appearance-none cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
                          value={location.area || ''}
                          disabled={!location.district}
                          onChange={(e) => {
                            const areaCoords = {
                              'Mylapore': { lat: 13.0368, lng: 80.2676 }
                            }
                            const coords = areaCoords[e.target.value] || { lat: null, lng: null }
                            setLocation({ ...location, area: e.target.value, text: `${e.target.value}, ${location.district}`, ...coords })
                          }}
                        >
                          <option value="">Select Area</option>
                          {location.district === 'Chennai' && <>
                            <option value="Mylapore">Mylapore</option>
                          </>}
                          {location.district && location.district !== 'Chennai' && <option value={location.district + ' City'}>{location.district} City</option>}
                        </select>
                      </div>
                    </div>

                    {/* Street / Landmark */}
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full border border-gray-200 rounded-xl px-5 py-3.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] focus:border-transparent transition-all placeholder:text-gray-400"
                        placeholder="Street name, landmark, or house number"
                        value={location.street || ''}
                        onChange={(e) => {
                          const street = e.target.value
                          const base = location.area ? `${location.area}, ${location.district}` : location.district || ''
                          setLocation({ ...location, street, text: street ? `${street}, ${base}` : base })
                        }}
                      />
                      <button
                        type="button"
                        onClick={fetchCurrentLocation}
                        disabled={geoLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#1a3a6b]/5 hover:bg-[#1a3a6b]/15 flex items-center justify-center transition-colors disabled:opacity-50"
                        title="Use my current location"
                      >
                        {geoLoading ? <Loader2 className="w-4 h-4 text-[#1a3a6b] animate-spin" /> : <MapPin className="w-4 h-4 text-[#1a3a6b]" />}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-8">
                    <button onClick={() => setPhase(PHASE.OPTION)} className="flex items-center justify-center gap-2 px-8 py-3 rounded-full border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors text-sm">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                      onClick={() => setPhase(PHASE.CONFIRM)}
                      disabled={!description.trim()}
                      className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[#1a3a6b] hover:bg-[#122d55] text-white font-semibold transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      Continue to Review <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* RIGHT: Side Cards */}
                <div className="flex flex-col gap-5">
                  {/* Location Preview Card */}
                  <div className="bg-gradient-to-br from-[#1a3a6b] to-[#2b4162] rounded-[20px] p-6 text-white shadow-[0_4px_16px_rgba(26,58,107,0.15)] overflow-hidden relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        <span className="text-[14px] font-bold">Location Preview</span>
                      </div>
                      <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Active Pin</span>
                    </div>
                    <div className="w-full h-72 rounded-2xl mb-4 overflow-hidden relative">
                      <iframe
                        key={`map-${location.lat}-${location.lng}`}
                        title="Location Preview"
                        className="w-full h-full border-0 rounded-2xl"
                        src={`https://maps.google.com/maps?q=${location.lat != null ? location.lat : 13.0827},${location.lng != null ? location.lng : 80.2707}&z=16&output=embed`}
                        allowFullScreen
                      />
                    </div>
                    {location.text ? (
                      <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1.5">Selected Coordinates</div>
                        <div className="text-[13px] font-medium leading-relaxed">{location.text}</div>
                      </div>
                    ) : (
                      <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <p className="text-[11px] text-white/40 text-center">Enter an address to see the preview</p>
                      </div>
                    )}
                  </div>

                  {/* Quality Check Card */}
                  <div className="bg-white rounded-[20px] border border-gray-200 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <Info className="w-5 h-5 text-[#1a3a6b]" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-[#1a3a6b] mb-1.5">Quality Check</h4>
                        <p className="text-[13px] text-gray-600 leading-relaxed">Adding photos or clear landmarks significantly increases the speed of resolution for your grievance.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PHASE: LOCATION ── */}
          {phase === PHASE.LOCATION && optionObj && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold text-[#1a3a6b] mb-2">Share Issue Location</h2>
              <p className="text-gray-600 text-[14px] mb-8">Pin the location of the issue on the map or type the landmark/address so our team can reach the spot quickly.</p>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* LEFT: Location Form */}
                <div className="xl:col-span-2 bg-white rounded-[20px] border border-gray-200 p-6 lg:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
                  <LocationPicker onLocationSelect={handleLocationSelect} />

                  {location.text && (
                    <div className="mt-6 bg-[#f4f6f8] border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#1a3a6b]/10 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-[#1a3a6b]" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Selected Location</div>
                        <span className="text-sm font-semibold text-[#2b4162]">{location.text}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 mt-8">
                    <button onClick={() => setPhase(PHASE.OPTION)} className="flex items-center justify-center gap-2 px-8 py-3 rounded-full border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors text-sm">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    {kind === 'location_photos_ticket' ? (
                      <button onClick={() => setPhase(PHASE.PHOTO)} disabled={!location.text} className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[#1a3a6b] hover:bg-[#122d55] text-white font-semibold transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                        Continue to Photo <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={submitTicket} disabled={loading || !location.text} className="flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[#1a3a6b] hover:bg-[#122d55] text-white font-semibold transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Location</>}
                      </button>
                    )}
                  </div>
                </div>

                {/* RIGHT: Side Cards */}
                <div className="flex flex-col gap-5">
                  {/* Location Preview Card */}
                  <div className="bg-gradient-to-br from-[#1a3a6b] to-[#2b4162] rounded-[20px] p-6 text-white shadow-[0_4px_16px_rgba(26,58,107,0.15)] overflow-hidden relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        <span className="text-[14px] font-bold">Location Preview</span>
                      </div>
                      <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wider">Active Pin</span>
                    </div>
                    <div className="w-full h-40 bg-white/10 rounded-2xl mb-4 flex items-center justify-center overflow-hidden relative">
                      <div className="absolute inset-0 bg-[#1a3a6b]/30 flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-red-400 drop-shadow-lg" />
                      </div>
                    </div>
                    {location.text && (
                      <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1.5">Selected Coordinates</div>
                        <div className="text-[13px] font-medium leading-relaxed">{location.text}</div>
                      </div>
                    )}
                  </div>

                  {/* Quality Check Card */}
                  <div className="bg-white rounded-[20px] border border-gray-200 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <Info className="w-5 h-5 text-[#1a3a6b]" />
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-[#1a3a6b] mb-1.5">Quick Tip</h4>
                        <p className="text-[13px] text-gray-600 leading-relaxed">Use GPS for accurate pinning or type a nearby landmark. Precise locations help resolve issues 40% faster.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PHASE: PHOTO ── */}
          {phase === PHASE.PHOTO && optionObj && (
            <div className="animate-fade-in">
              <div className="bg-white rounded-[20px] border border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden max-w-4xl mx-auto">
                <div className="bg-[#1a3a6b] px-8 py-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5 text-white/80" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Attach Photo Evidence (Optional)</h2>
                    <p className="text-white/60 text-sm mt-0.5">A photo helps the team verify the issue faster, but is not required</p>
                  </div>
                </div>

                <div className="p-6 lg:p-8">
                  {imagePreview ? (
                    <div className="relative inline-block w-full mb-6">
                      <img src={imagePreview} alt="Preview" className="w-full h-72 object-cover rounded-2xl border border-gray-200" />
                      <button onClick={removeImage} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 text-red-500 flex items-center justify-center shadow-md hover:bg-red-50 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-2xl p-16 cursor-pointer hover:border-[#1a3a6b] hover:bg-[#f4f6f8] transition-all mb-6 group">
                      <div className="w-14 h-14 rounded-2xl bg-[#f4f6f8] flex items-center justify-center group-hover:bg-[#1a3a6b]/10 transition-colors">
                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#1a3a6b] transition-colors" />
                      </div>
                      <span className="text-[15px] font-semibold text-gray-700">Click to upload evidence photo</span>
                      <span className="text-xs text-gray-400">Optional. Max 10MB (JPG, PNG)</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                  )}

                  {submitError && (
                    <div className="mb-6 flex items-start gap-2 bg-red-50 text-red-700 rounded-xl p-4 text-sm">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <div>{submitError}</div>
                    </div>
                  )}

                  <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-4">
                    <button onClick={() => setPhase(PHASE.LOCATION)} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button onClick={submitTicket} disabled={loading} className="flex-1 bg-[#1a3a6b] hover:bg-[#122d55] text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Grievance</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PHASE: CONFIRM ── (Stitch Review & Submit) */}
          {phase === PHASE.CONFIRM && (
            <div className="animate-fade-in">
              {grievanceId ? (
                /* === SUCCESS STATE === */
                <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 lg:p-16 max-w-3xl mx-auto text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-700" />
                  </div>
                  <h2 className="text-[26px] font-bold text-[#1a3a6b] mb-3">Issue Successfully Submitted!</h2>
                  <p className="text-gray-500 mb-10">We have received your grievance and sent it to the concerned authority.</p>

                  <div className="bg-[#f4f6f8] rounded-xl p-8 text-left mb-10 border border-gray-200">
                    <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2">Tracking ID</div>
                    <div className="text-2xl font-black text-[#1a3a6b] mb-6">#{grievanceId}</div>
                    <div className="space-y-3 text-[14px] text-gray-700">
                      <div className="flex"><span className="w-28 text-gray-500 shrink-0">Category:</span> <span className="font-medium">{serviceObj?.title}</span></div>
                      <div className="flex"><span className="w-28 text-gray-500 shrink-0">Issue:</span> <span className="font-medium">{optionObj?.title}</span></div>
                      {location.text && <div className="flex"><span className="w-28 text-gray-500 shrink-0">Location:</span> <span className="font-medium truncate">{location.text}</span></div>}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={() => navigate('/my-grievances')} className="flex-1 py-3.5 rounded-full border-2 border-gray-200 text-[#1a3a6b] font-semibold hover:bg-gray-50 transition-colors text-sm">
                      Track Status
                    </button>
                    <button
                      onClick={() => {
                        setPhase(PHASE.CATEGORY)
                        setServiceObj(null); setOptionObj(null)
                        resetDownstream()
                      }}
                      className="flex-1 bg-[#1a3a6b] hover:bg-[#122d55] text-white rounded-full py-3.5 font-semibold transition-colors text-sm"
                    >
                      Report Another Issue
                    </button>
                  </div>
                </div>
              ) : (
                /* === REVIEW STATE (before submission) === */
                <>
                  <h2 className="text-3xl font-bold text-[#1a3a6b] mb-2">Review & Submit</h2>
                  <p className="text-gray-600 text-[14px] mb-8">Please verify the information before submitting your grievance for resolution.</p>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* LEFT: Summary + Attachments */}
                    <div className="xl:col-span-2 flex flex-col gap-6">
                      {/* Grievance Summary Card */}
                      <div className="bg-white rounded-[20px] border border-gray-200 p-6 lg:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center justify-between mb-7">
                          <h3 className="text-[18px] font-bold text-[#1a3a6b]">Grievance Summary</h3>
                          <button onClick={() => setPhase(PHASE.DETAILS)} className="flex items-center gap-1.5 text-[13px] text-[#1a3a6b] font-semibold hover:text-[#122d55] transition-colors">
                            <Edit2 className="w-4 h-4" /> Edit Details
                          </button>
                        </div>

                        <div className="space-y-1">
                          <div className="flex py-4 border-b border-gray-100">
                            <span className="w-32 text-[13px] text-gray-500 shrink-0 font-medium">Department</span>
                            <div className="flex items-center gap-2">
                              {serviceObj?.iconUrl && <img src={serviceObj.iconUrl} alt="" className="w-5 h-5 object-contain" />}
                              <span className="text-[13px] font-bold text-gray-900">{serviceObj?.title}</span>
                            </div>
                          </div>
                          <div className="flex py-4 border-b border-gray-100">
                            <span className="w-32 text-[13px] text-gray-500 shrink-0 font-medium">Issue Title</span>
                            <span className="text-[13px] font-bold text-gray-900">{optionObj?.title}</span>
                          </div>
                          <div className="flex py-4 border-b border-gray-100">
                            <span className="w-32 text-[13px] text-gray-500 shrink-0 font-medium">Description</span>
                            <p className="text-[13px] text-gray-700 leading-relaxed">{description || 'No description provided.'}</p>
                          </div>
                          {location.text && (
                            <div className="flex py-4">
                              <span className="w-32 text-[13px] text-gray-500 shrink-0 font-medium">Location</span>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                                <span className="text-[13px] text-gray-900">{location.text}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Attachments Card */}
                      <div className="bg-white rounded-[20px] border border-gray-200 p-6 lg:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
                        <h3 className="text-[18px] font-bold text-[#1a3a6b] mb-1">Attachments</h3>
                        <p className="text-[12px] text-gray-500 mb-5">(Optional) Adding photos or videos helps resolve issues faster</p>
                        {imagePreview ? (
                          <div className="relative">
                            <img src={imagePreview} alt="Attached" className="w-full h-48 object-cover rounded-2xl border border-gray-200" />
                            <button onClick={removeImage} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-md text-red-500 flex items-center justify-center hover:bg-red-50 transition-all">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 rounded-2xl py-12 cursor-pointer hover:border-[#1a3a6b] hover:bg-[#f4f6f8]/50 transition-all group">
                              <Upload className="w-10 h-10 text-gray-300 group-hover:text-[#1a3a6b] transition-colors" />
                              <span className="text-[14px] font-semibold text-gray-700">Click to upload photo or video</span>
                              <span className="text-[12px] text-gray-500">JPG, PNG or MP4. Max 10MB</span>
                              <input
                                id="review-file-input"
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={handleImageChange}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => document.getElementById('review-file-input')?.click()}
                              className="mt-4 px-6 py-2.5 rounded-full border border-gray-300 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
                            >
                              Add Photos or Videos
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* RIGHT: SLA + Submit + Did You Know */}
                    <div className="flex flex-col gap-5">
                      {/* SLA Information Card */}
                      <div className="bg-white rounded-[20px] border border-gray-200 p-6 lg:p-7 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
                        <div className="flex items-start gap-3 mb-5">
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                            <Info className="w-5 h-5 text-[#1a3a6b]" />
                          </div>
                          <p className="text-[13px] text-gray-500 leading-relaxed">Resolution tracking will be available immediately after submission.</p>
                        </div>

                        <h4 className="text-[15px] font-bold text-[#1a3a6b] mb-5">SLA Information</h4>
                        <div className="space-y-4 mb-7">
                          <div className="flex justify-between items-center">
                            <span className="text-[13px] text-gray-600">Expected Acknowledgement</span>
                            <span className="text-[15px] font-bold text-[#1a3a6b]">24 Hours</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[13px] text-gray-600">Resolution Target</span>
                            <span className="text-[15px] font-bold text-[#1a3a6b]">7 Working Days</span>
                          </div>
                        </div>

                        <label className="flex items-start gap-3 mb-7 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={certified}
                            onChange={(e) => setCertified(e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border border-gray-300 text-[#1a3a6b] focus:ring-2 focus:ring-[#1a3a6b] focus:ring-offset-1 accent-[#1a3a6b]"
                          />
                          <span className="text-[13px] text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">I certify that the information provided is accurate and pertains to a genuine public grievance.</span>
                        </label>

                        {submitError && (
                          <div className="mb-5 flex items-start gap-3 bg-red-50 text-red-700 rounded-xl p-4 text-[13px] border border-red-200">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>{submitError}</div>
                          </div>
                        )}

                        <button
                          onClick={submitTicket}
                          disabled={loading || !certified}
                          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-[#1a3a6b] hover:bg-[#122d55] text-white font-bold text-[14px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(26,58,107,0.2)] hover:shadow-[0_4px_12px_rgba(26,58,107,0.3)] mb-3"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Submit Grievance <Send className="w-4 h-4" /></>}
                        </button>
                        <button onClick={() => setPhase(PHASE.DETAILS)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full border-2 border-gray-200 text-gray-700 font-semibold text-[14px] hover:bg-gray-50 hover:border-gray-300 transition-all duration-200">
                          <ArrowLeft className="w-4 h-4" /> Back to Details
                        </button>
                      </div>

                      {/* Did You Know Card */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[20px] border border-blue-200 p-6 shadow-[0_2px_8px_rgba(79,70,229,0.08)]">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 flex-shrink-0">
                            <Lightbulb className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-[14px] font-bold text-blue-900 mb-1.5">Did you know?</h4>
                            <p className="text-[13px] text-blue-800 leading-relaxed">Verified accounts receive status updates via SMS and WhatsApp automatically. You can also view real-time field visit reports in the 'My Requests' section.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* ── PHASE: CTA ── */}
          {phase === PHASE.CTA && optionObj && action && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6 lg:p-10 animate-fade-in max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-[#2b4162] mb-2">
                {kind === 'pdf' ? '📄 Download Document' : '🔗 Open Service Portal'}
              </h2>
              <p className="text-sm text-gray-500 mb-8">{optionObj.title}</p>
              <div className="flex flex-col-reverse sm:flex-row gap-4 mt-8">
                <button onClick={() => setPhase(PHASE.OPTION)} className="w-full sm:w-auto justify-center px-8 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors">
                  Back
                </button>
                <a
                  href={kind === 'pdf' ? action.pdfUrl : action.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#2b4162] hover:bg-[#1a2942] text-white rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  {kind === 'pdf' ? <><FileText className="w-4 h-4" /> Open PDF</> : <><ExternalLink className="w-4 h-4" /> {action.ctaLabel || 'Open Portal'}</>}
                </a>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )

}
