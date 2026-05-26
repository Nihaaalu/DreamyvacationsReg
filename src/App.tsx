import React, { useState, useEffect, useRef } from 'react';
import { 
  RotateCcw, 
  Plus, 
  Trash2, 
  CircleAlert, 
  Loader2, 
  FileDown,
  User,
  Phone,
  MapPin,
  Car,
  FileText,
  CreditCard,
  Users,
  Compass,
  CheckCircle,
  ShieldCheck,
  Award,
  Info,
  Hotel
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { GuestCheckIn, DEFAULT_FORM_STATE } from './types';
import AddressAutocomplete from './components/AddressAutocomplete';
import Notification, { NotificationType } from './components/Notification';
import PdfTemplate from './components/PdfTemplate';

export default function App() {
  const [formData, setFormData] = useState<GuestCheckIn>(() => DEFAULT_FORM_STATE(new Date()));
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [logoError, setLogoError] = useState(false);
  
  // Custom suggestion dropdown open states
  const [showPurposeDropdown, setShowPurposeDropdown] = useState(false);
  const [showCoDropdown, setShowCoDropdown] = useState(false);
  
  // Ref elements for closing dropdowns on outer click
  const purposeRef = useRef<HTMLDivElement>(null);
  const coRef = useRef<HTMLDivElement>(null);

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Notification state
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: NotificationType }>({
    isVisible: false,
    message: '',
    type: 'success',
  });

  // Autocomplete Suggestions lists
  const visitPurposes = [
    'Business',
    'Family Trip',
    'Friends Trip',
    'Vacation',
    'Tourism',
    'Event',
    'Personal'
  ];

  const coSources = [
    'Direct',
    'Travel Agency',
    'Booking.com',
    'MakeMyTrip',
    'Agoda',
    'Walk-in'
  ];

  // Setup dropdown close handlers on initial load
  useEffect(() => {
    function handleOuterClicks(e: MouseEvent) {
      if (purposeRef.current && !purposeRef.current.contains(e.target as Node)) {
        setShowPurposeDropdown(false);
      }
      if (coRef.current && !coRef.current.contains(e.target as Node)) {
        setShowCoDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleOuterClicks);
    return () => {
      document.removeEventListener('mousedown', handleOuterClicks);
    };
  }, []);

  // Show customized action updates to user
  const showNotification = (message: string, type: NotificationType) => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };

  const closeNotification = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  // Perform custom input validation
  const validateForm = (): boolean => {
    const tempErrors: { [key: string]: string } = {};

    if (!formData.guestName.trim()) {
      tempErrors.guestName = 'Guest name is required.';
    }

    if (!formData.title) {
      tempErrors.title = 'Please select a suffix (Mr / Mrs).';
    }

    if (formData.phone) {
      const cleanPhone = formData.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 7 || cleanPhone.length > 15) {
        tempErrors.phone = 'Phone must be between 7 and 15 numeric digits.';
      }
    } else {
      tempErrors.phone = 'Phone number is required for reservations.';
    }

    if (!formData.address.trim()) {
      tempErrors.address = 'A primary address is required.';
    }

    if (formData.departureDate) {
      const arr = new Date(formData.arrivalDate);
      const dep = new Date(formData.departureDate);
      if (dep < arr) {
        tempErrors.departureDate = 'Departure date cannot be before Arrival date.';
      }
    }

    // Room numbers validation
    const emptyRoom = formData.rooms.some(r => !r.trim());
    if (emptyRoom) {
      tempErrors.rooms = 'Room number cannot be empty.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // State mutators
  const updateField = (key: keyof GuestCheckIn, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [key]: value };
      // Clear associated validation error on key events
      if (errors[key]) {
        setErrors(prevErr => {
          const updated = { ...prevErr };
          delete updated[key];
          return updated;
        });
      }
      return next;
    });
  };

  // Handles dynamic multiple rooms expansion
  const addRoomField = () => {
    updateField('rooms', [...formData.rooms, '']);
    showNotification('New room field appended.', 'success');
  };

  const removeRoomField = (indexToRemove: number) => {
    if (formData.rooms.length <= 1) {
      // Must have at least 1 room input
      updateField('rooms', ['']);
      return;
    }
    const filtered = formData.rooms.filter((_, idx) => idx !== indexToRemove);
    updateField('rooms', filtered);
    showNotification('Room item removed.', 'warning');
  };

  const updateRoomValue = (indexToUpdate: number, newVal: string) => {
    const updated = formData.rooms.map((room, idx) => 
      idx === indexToUpdate ? newVal : room
    );
    updateField('rooms', updated);
  };

  // Reset form completely (Clear Form)
  const handleResetForm = () => {
    const cleanState = DEFAULT_FORM_STATE(new Date());
    setFormData(cleanState);
    setErrors({});
    setIsGeneratingPdf(false);
    showNotification('Form cleared successfully. Defaults restored.', 'success');
  };

  // Robust Async Download PDF function utilizing local html2canvas and jsPDF directly on hidden PDF element
  const handleDownloadPdf = async () => {
    const isValid = validateForm();
    if (!isValid) {
      showNotification('Please correct outstanding form issues before exporting PDF.', 'error');
      const firstErrKey = Object.keys(errors)[0] || 'guestName';
      const el = document.getElementById(firstErrKey);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const element = document.getElementById('a4-sheet');
    if (!element) {
      showNotification('Error: Hidden print target wrapper with id "a4-sheet" not found.', 'error');
      return;
    }

    setIsGeneratingPdf(true);
    showNotification('Generating high quality custom A4 document...', 'success');

    const generatePDF = async () => {
      try {
        // Create high-res screenshot using html2canvas exactly as specified
        const canvas = await html2canvas(element, {
          width: element.scrollWidth,
          height: element.scrollHeight,
          scale: 1.6,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 0
        });

        const context = canvas.getContext('2d');
        if (context) {
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';
        }

        const imgData = canvas.toDataURL('image/jpeg', 0.82);
        
        // Initialize jsPDF using exact pixel settings
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });

        // Add the image exactly as specified
        pdf.addImage(
          imgData,
          'JPEG',
          0,
          0,
          canvas.width,
          canvas.height,
          undefined,
          'FAST'
        );

        // Format filename precisely: DreamyVacations_YYYY-MM-DD.pdf
        const currentDateString = formData.arrivalDate || new Date().toISOString().split('T')[0];
        const pdfFileName = `DreamyVacations_${currentDateString}.pdf`;
        pdf.save(pdfFileName);
        
        showNotification('Success! Premium PDF check-in form saved & downloaded.', 'success');
      } catch (e) {
        console.error('PDF creation error:', e);
        showNotification('PDF generation failed. Please try again.', 'error');
      } finally {
        setIsGeneratingPdf(false);
      }
    };

    if (document.fonts) {
      document.fonts.ready.then(() => {
        generatePDF();
      });
    } else {
      generatePDF();
    }
  };

  // Format date for footer text signature preview
  const getFormattedCurrentDate = () => {
    const dateObj = new Date();
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFormattedArrivalDate = () => {
    if (!formData.arrivalDate) return getFormattedCurrentDate();
    return new Date(formData.arrivalDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculated statistics variables
  const activeRoomsCount = formData.rooms.filter(r => r.trim()).length;
  const totalGuests = (formData.guestsMale || 0) + (formData.guestsFemale || 0) + (formData.guestsKids || 0);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-start items-center px-3 py-4 sm:px-5 lg:px-8 lg:py-6 font-sans overflow-x-hidden select-none">
      
      {/* Toast Notification */}
      <Notification 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={closeNotification} 
      />

      <div className="w-full max-w-[1700px] mx-auto px-1 sm:px-2 lg:px-4">
        
        {/* TOP MAIN HEADER - MINIMAL LUXURY HEADER */}
        <header className="w-full mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center shrink-0">
              <Hotel className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-widest text-white">
                  Dreamy Vacations
                </h1>
              </div>
              <p className="text-[11px] uppercase tracking-[4px] text-zinc-500 mt-0.5 font-medium">
                Resort Management System
              </p>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-lg text-xs font-extrabold uppercase transition-all duration-150 cursor-pointer disabled:opacity-40"
            >
              {isGeneratingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin text-black" />
              ) : (
                <FileDown className="h-4 w-4 text-black" />
              )}
              {isGeneratingPdf ? 'Compiling...' : 'Download PDF'}
            </button>
          </div>
        </header>

        {/* SINGLE COLUMN STRUCTURE */}
        <div className="w-full space-y-5">
          
          {/* CARD 1: PRIMARY GUEST DETAILS */}
          <div className="bg-[#050505] border border-zinc-800 rounded-2xl p-5 lg:p-6 space-y-4">
            <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2">
              <User className="h-4 w-4 text-white" />
              <h3 className="text-[15px] font-semibold tracking-wide text-white">
                Guest Details
              </h3>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
              {/* Salute Selection */}
              <div className="xl:col-span-4 space-y-1.5">
                <label className="text-zinc-400 uppercase text-[11px] block">
                  Salutation <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5 bg-black border border-zinc-800 p-1.5 rounded-lg h-10">
                  <button
                    type="button"
                    onClick={() => updateField('title', 'Mr')}
                    className={`flex-1 h-full rounded text-xs font-bold transition-all ${
                      formData.title === 'Mr' 
                        ? 'bg-white text-black shadow-md' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    Mr.
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('title', 'Mrs')}
                    className={`flex-1 h-full rounded text-xs font-bold transition-all ${
                      formData.title === 'Mrs' 
                        ? 'bg-white text-black shadow-md' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    Mrs. / Ms.
                  </button>
                </div>
                {errors.title && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1 font-medium mt-1">
                    <CircleAlert className="h-3 w-3 shrink-0" />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Complete Name */}
              <div className="xl:col-span-8 space-y-1.5">
                <label htmlFor="guestName" className="text-zinc-400 uppercase text-[11px] block">
                  Complete Legal Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    id="guestName"
                    type="text"
                    value={formData.guestName}
                    onChange={(e) => updateField('guestName', e.target.value)}
                    placeholder="Enter legal identification name"
                    className="w-full bg-black border border-zinc-800 text-white placeholder:text-zinc-500 rounded-lg px-4 h-10 text-[15px] outline-none transition-all duration-200 focus:border-white"
                  />
                </div>
                {errors.guestName && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1 font-medium mt-1">
                    <CircleAlert className="h-3 w-3 shrink-0" />
                    {errors.guestName}
                  </p>
                )}
              </div>
            </div>

            {/* Autocomplete Search Address */}
            <div className="space-y-1.5 relative z-30">
              <label className="text-zinc-400 uppercase text-[11px] block">
                Primary Address <span className="text-rose-500">*</span>
              </label>
              <div className="flex-1 overflow-visible bg-black border border-zinc-800 text-white placeholder:text-zinc-500 rounded-lg px-4 py-2 text-[15px] outline-none transition-all duration-200 min-h-10 flex items-center focus-within:border-white relative z-30">
                <AddressAutocomplete
                  value={formData.address || ''}
                  onChange={(val) => updateField('address', val)}
                  placeholder="Search residential city, state, country..."
                />
              </div>
              {errors.address && (
                <p className="text-[10px] text-rose-500 flex items-center gap-1 font-medium mt-1">
                  <CircleAlert className="h-3 w-3 shrink-0" />
                  {errors.address}
                </p>
              )}
            </div>

            {/* Phone and ID Produced */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5 min-w-0">
                <label htmlFor="phone" className="text-zinc-400 uppercase text-[11px] block">
                  Phone / Mobile <span className="text-rose-500">*</span>
                </label>
                <div className="relative w-full min-w-0 overflow-hidden">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none z-10" />
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="Mobile contact coordinates"
                    style={{ display: 'block' }}
                    className="w-full min-w-0 bg-black border border-zinc-800 text-white placeholder:text-zinc-500 rounded-lg pl-[52px] pr-4 h-10 text-[15px] outline-none transition-all duration-200 font-mono focus:border-white block"
                  />
                </div>
                {errors.phone && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1 font-medium mt-1">
                    <CircleAlert className="h-3 w-3 shrink-0" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 min-w-0">
                <label htmlFor="idProduced" className="text-zinc-400 uppercase text-[11px] block">
                  Identity Document Produced
                </label>
                <div className="relative w-full min-w-0 overflow-hidden">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none z-10" />
                  <input
                    id="idProduced"
                    type="text"
                    value={formData.idProduced}
                    onChange={(e) => updateField('idProduced', e.target.value)}
                    placeholder="e.g. Passport, License (No.)"
                    style={{ display: 'block' }}
                    className="w-full min-w-0 bg-black border border-zinc-800 text-white placeholder:text-zinc-500 rounded-lg pl-[52px] pr-4 h-10 text-[15px] outline-none transition-all duration-200 focus:border-white block"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: STAY DETAILS */}
          <div className="bg-[#050505] border border-zinc-800 rounded-2xl p-5 lg:p-6 space-y-4">
            <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2">
              <Users className="h-4 w-4 text-white" />
              <h3 className="text-[15px] font-semibold tracking-wide text-white">
                Stay Details
              </h3>
            </div>

            {/* Dynamic Room Fields Editor Grid */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-zinc-400 uppercase text-[10px] tracking-wider block font-bold">
                  Assigned Rooms <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addRoomField}
                  className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                >
                  <Plus className="h-3 w-3" />
                  Add Room
                </button>
              </div>

              <div className="w-full overflow-hidden bg-[#020202] p-1.5 rounded-lg border border-zinc-900 shadow-inner">
                <div className="flex flex-wrap items-center gap-1.5 w-full overflow-hidden">
                  {formData.rooms.map((room, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-[#09090b]/80 hover:bg-[#121215] rounded border border-zinc-800 px-1.5 h-[32px] transition-all min-w-0 max-w-full overflow-hidden shrink shrink-0"
                    >
                      <span className="text-[8px] text-zinc-600 font-mono uppercase tracking-wider font-semibold shrink-0 select-none">
                        R#{index + 1}
                      </span>

                      <input
                        type="text"
                        value={room}
                        onChange={(e) => updateRoomValue(index, e.target.value)}
                        placeholder="No"
                        className="w-10 min-w-0 max-w-[40px] overflow-hidden focus:outline-none bg-transparent text-center font-mono font-bold text-white text-[11px] placeholder-zinc-800"
                      />

                      {formData.rooms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRoomField(index)}
                          className="text-zinc-600 hover:text-rose-400 hover:bg-rose-950/20 transition-all p-0.5 rounded shrink-0"
                          title="Remove Room"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {errors.rooms && (
                <p className="text-[10px] text-rose-500 flex items-center gap-1 font-medium mt-1">
                  <CircleAlert className="h-3 w-3 shrink-0" />
                  {errors.rooms}
                </p>
              )}
            </div>

            {/* Guest Counts Matrix Inputs */}
            <div className="space-y-1.5">
              <label className="text-zinc-400 uppercase text-[11px] block">
                Guests
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-black p-2.5 rounded-lg border border-zinc-800 flex flex-col justify-center items-center">
                  <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2">Male (M)</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.guestsMale || ''}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      updateField('guestsMale', val);
                    }}
                    className="w-12 h-9 bg-[#0a0a0a] border border-zinc-800 rounded text-center text-xs font-bold text-white focus:border-white focus:outline-none p-1 font-mono"
                  />
                </div>

                <div className="bg-black p-2.5 rounded-lg border border-zinc-800 flex flex-col justify-center items-center">
                  <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2">Female (F)</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.guestsFemale || ''}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      updateField('guestsFemale', val);
                    }}
                    className="w-12 h-9 bg-[#0a0a0a] border border-zinc-800 rounded text-center text-xs font-bold text-white focus:border-white focus:outline-none p-1 font-mono"
                  />
                </div>

                <div className="bg-black p-2.5 rounded-lg border border-zinc-800 flex flex-col justify-center items-center">
                  <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2">Kids (K)</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.guestsKids || ''}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      updateField('guestsKids', val);
                    }}
                    className="w-12 h-9 bg-[#0a0a0a] border border-zinc-800 rounded text-center text-xs font-bold text-white focus:border-white focus:outline-none p-1 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Number */}
            <div className="space-y-1.5 min-w-0">
              <label htmlFor="vehicleNumber" className="text-zinc-400 uppercase text-[11px] block">
                Vehicle Registration Plate (Optional)
              </label>
              <div className="relative w-full min-w-0 overflow-hidden">
                <Car className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none z-10" />
                <input
                  id="vehicleNumber"
                  type="text"
                  value={formData.vehicleNumber}
                  onChange={(e) => updateField('vehicleNumber', e.target.value)}
                  placeholder="Enter registration plates for hotel free parking access"
                  style={{ display: 'block' }}
                  className="w-full min-w-0 bg-black border border-zinc-800 text-white placeholder:text-zinc-500 rounded-lg pl-[52px] pr-4 h-10 text-[15px] outline-none transition-all duration-200 font-mono focus:border-white block"
                />
              </div>
            </div>
          </div>

          {/* CARD 3: BOOKING DETAILS */}
          <div className="bg-[#050505] border border-zinc-800 rounded-2xl p-5 lg:p-6 space-y-4">
            <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2">
              <Compass className="h-4 w-4 text-white" />
              <h3 className="text-[15px] font-semibold tracking-wide text-white">
                Booking Details
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* Purpose of Visit with suggestion Box */}
              <div className="space-y-1.5 relative" ref={purposeRef}>
                <label htmlFor="purpose" className="text-zinc-400 uppercase text-[11px] block">
                  Purpose of Visit
                </label>
                <input
                  id="purpose"
                  type="text"
                  value={formData.purposeOfVisit}
                  onChange={(e) => updateField('purposeOfVisit', e.target.value)}
                  onFocus={() => setShowPurposeDropdown(true)}
                  placeholder="Reason for travel/business..."
                  autoComplete="off"
                  className="w-full bg-black border border-zinc-800 text-white placeholder:text-zinc-500 rounded-lg px-4 h-10 text-[15px] outline-none transition-all duration-200 focus:border-white"
                />
                {showPurposeDropdown && (
                  <div className="absolute z-15 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-black rounded-lg shadow-xl border border-zinc-800 py-1 font-sans">
                    {visitPurposes.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onMouseDown={() => {
                          updateField('purposeOfVisit', p);
                          setShowPurposeDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Coming From */}
              <div className="space-y-1.5">
                <label htmlFor="comingFrom" className="text-zinc-400 uppercase text-[11px] block">
                  Coming From
                </label>
                <input
                  id="comingFrom"
                  type="text"
                  value={formData.comingFrom}
                  onChange={(e) => updateField('comingFrom', e.target.value)}
                  placeholder="Last city / origin region"
                  className="w-full bg-black border border-zinc-800 text-white placeholder:text-zinc-500 rounded-lg px-4 h-10 text-[15px] outline-none transition-all duration-200 focus:border-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Channel CO Agent */}
              <div className="space-y-1.5 relative" ref={coRef}>
                <label htmlFor="co" className="text-zinc-400 uppercase text-[11px] block">
                  Booking Agent / C/O Source
                </label>
                <input
                  id="co"
                  type="text"
                  value={formData.co}
                  onChange={(e) => updateField('co', e.target.value)}
                  onFocus={() => setShowCoDropdown(true)}
                  placeholder="e.g. Booking.com, walk-in"
                  autoComplete="off"
                  className="w-full bg-black border border-zinc-800 text-white placeholder:text-zinc-500 rounded-lg px-4 h-10 text-[15px] outline-none transition-all duration-200 focus:border-white"
                />
                {showCoDropdown && (
                  <div className="absolute z-15 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-black rounded-lg shadow-xl border border-zinc-800 py-1">
                    {coSources.map((source, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onMouseDown={() => {
                          updateField('co', source);
                          setShowCoDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
                      >
                        {source}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Option Framework (Multi selection buttons) */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 uppercase text-[11px] block">
                  Payment Method
                </label>
                <div className="flex gap-4 h-10 items-center px-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={formData.paymentCash}
                      onChange={(e) => updateField('paymentCash', e.target.checked)}
                      className="accent-white rounded h-4.5 w-4.5 bg-black border-zinc-800 cursor-pointer"
                    />
                    Cash
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={formData.paymentOnline}
                      onChange={(e) => updateField('paymentOnline', e.target.checked)}
                      className="accent-white rounded h-4.5 w-4.5 bg-black border-zinc-800 cursor-pointer"
                    />
                    Online Pay / UPI
                  </label>
                </div>
              </div>
            </div>

            {/* TIMING CONFIGURATIONS (Arrival Dates, times, departure date fields) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-zinc-400 uppercase text-[11px] block">
                  Arrival Date
                </label>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={formData.arrivalDate}
                    onChange={(e) => updateField('arrivalDate', e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-zinc-800 text-white rounded-lg px-4 h-10 text-[15px] outline-none transition-all duration-200 focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 uppercase text-[11px] block">
                  Check-In Time
                </label>
                <div className="relative flex items-center">
                  <input
                    type="time"
                    value={formData.arrivalTime}
                    onChange={(e) => updateField('arrivalTime', e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-zinc-800 text-white rounded-lg px-4 h-10 text-[15px] outline-none transition-all duration-200 focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="departureDate" className="text-zinc-400 uppercase text-[11px] block">
                  Departure Date
                </label>
                <div className="relative flex items-center">
                  <input
                    id="departureDate"
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => updateField('departureDate', e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-zinc-800 text-white rounded-lg px-4 h-10 text-[15px] outline-none transition-all duration-200 focus:border-zinc-500"
                  />
                </div>
                {errors.departureDate && (
                  <p className="text-[10px] text-rose-500 flex items-center gap-1 font-medium mt-1">
                    <CircleAlert className="h-3 w-3 shrink-0" />
                    {errors.departureDate}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* FORM TERMINAL BOTTOM SYSTEM ACTIONS */}
          <div className="bg-[#050505] p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row justify-end items-center gap-3">
            <button
              type="button"
              onClick={handleResetForm}
              disabled={isGeneratingPdf}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 border border-zinc-700 text-white rounded-lg text-xs font-bold uppercase transition-colors duration-150 cursor-pointer disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
              Clear Form
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-lg text-xs font-extrabold uppercase transition-all duration-150 cursor-pointer disabled:opacity-40"
            >
              {isGeneratingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin text-black" />
              ) : (
                <FileDown className="h-4 w-4 text-black" />
              )}
              {isGeneratingPdf ? 'Compiling...' : 'Download PDF'}
            </button>
          </div>

        </div>

      </div>

      {/* FOOTER */}
      <footer className="w-full text-center mt-6 mb-4">
        <p className="text-xs text-zinc-600 text-center">
          Dreamy Vacations Resort Management System
        </p>
      </footer>

      {/* OFFSCREEN PDF EXPORT WRAPPER (ISOLATED DEDICATED DOM ZONE) */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }} className="no-print">
        <PdfTemplate formData={formData} logoError={logoError} setLogoError={setLogoError} />
      </div>

    </div>
  );
}
