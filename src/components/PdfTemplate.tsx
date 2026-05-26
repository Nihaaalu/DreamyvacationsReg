import React from 'react';
import { GuestCheckIn } from '../types';

interface PdfTemplateProps {
  formData: GuestCheckIn;
  logoError: boolean;
  setLogoError: (val: boolean) => void;
}

export default function PdfTemplate({ formData, logoError, setLogoError }: PdfTemplateProps) {
  // Luxury Date Formatter
  const formatToLuxuryDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      // Create date without local timezone offset issues
      const d = new Date(dateStr + 'T12:00:00');
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const getFormattedCurrentDate = () => {
    const d = new Date();
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Convert 24-hour time to 12-hour AM/PM format
  const formatTo12HourTime = (timeStr?: string) => {
    if (!timeStr) return '—';
    try {
      const parts = timeStr.split(':');
      if (parts.length < 2) return timeStr;
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      if (isNaN(hours)) return timeStr;
      
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // hour '0' should be '12'
      const hoursStr = hours < 10 ? `0${hours}` : `${hours}`;
      return `${hoursStr}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <div id="a4-sheet" className="a4-sheet-offscreen">
      {/* Luxury Google Fonts Pre-Loading */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700;800&display=swap');
      `}</style>

      {/* HEADER SECTION - ENHANCED TYPOGRAPHY & BRANDING LOGO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #8a704c', paddingBottom: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {!logoError ? (
          <img
            src="/logo.png"  /* Notice it starts with a single forward slash */
            alt="Dreamy Vacations Logo"
            onError={() => setLogoError(true)}
            style={{
              height: '112px',
              width: '112px',
              objectFit: 'contain',
              imageRendering: '-webkit-optimize-contrast',
              transform: 'translateY(2px)'
            }}
          />
          ) : (
            <div style={{ height: '112px', width: '112px', backgroundColor: '#8a704c', color: '#ffffff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '38px', fontWeight: '700', fontFamily: "'Playfair Display', serif" }}>DV</span>
            </div>
          )}
          <div>
            <h1 className="luxury-title">Dreamy Vacations</h1>
            <p className="luxury-subtitle">Resort Register & Guest Profile Record</p>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontFamily: "'Inter', sans-serif" }}>
          <span style={{ display: 'block', fontSize: '14px', fontWeight: '800', color: '#0f172a', letterSpacing: '1px' }}>REF: DV-GEF-2026</span>
          <span style={{ display: 'block', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: '#64748b', marginTop: '6px', letterSpacing: '0.5px' }}>
            REGISTRY DATE: {getFormattedCurrentDate()}
          </span>
        </div>
      </div>

      {/* SECTION 1: GUEST LEDGER */}
      <div className="pdf-section">
        <h2 className="pdf-section-title">
          <span className="pdf-section-num">01 /</span> Guest Profile Ledger
        </h2>
        
        <div className="pdf-row-grid">
          <div>
            <div className="pdf-ledger-row">
              <span className="pdf-ledger-label">Guest Name:</span>
              <div className="pdf-ledger-value">
                {formData.title ? `${formData.title}. ` : ''}{formData.guestName || '—'}
              </div>
            </div>
          </div>
          
          <div>
            <div className="pdf-ledger-row">
              <span className="pdf-ledger-label">Phone No:</span>
              <div className="pdf-ledger-value">{formData.phone || '—'}</div>
            </div>
            <div className="pdf-ledger-row">
              <span className="pdf-ledger-label">Vehicle No:</span>
              <div className="pdf-ledger-value">{formData.vehicleNumber || '—'}</div>
            </div>
          </div>
        </div>

        <div className="pdf-ledger-row" style={{ marginTop: '8px' }}>
          <span className="pdf-ledger-label">Address:</span>
          <div className="pdf-ledger-value">{formData.address || '—'}</div>
        </div>
      </div>

      {/* SECTION 2: VISIT DETAILS */}
      <div className="pdf-section">
        <h2 className="pdf-section-title">
          <span className="pdf-section-num">02 /</span> Visit & Stanover Info
        </h2>

        <div className="pdf-row-grid">
          <div>
            <div className="pdf-ledger-row">
              <span className="pdf-ledger-label">Arrival Date:</span>
              <div className="pdf-ledger-value">{formatToLuxuryDate(formData.arrivalDate)}</div>
            </div>
            <div className="pdf-ledger-row">
              <span className="pdf-ledger-label">Arrival Time:</span>
              <div className="pdf-ledger-value">{formatTo12HourTime(formData.arrivalTime)}</div>
            </div>
            <div className="pdf-ledger-row">
              <span className="pdf-ledger-label">Purpose:</span>
              <div className="pdf-ledger-value">{formData.purposeOfVisit || '—'}</div>
            </div>
            <div className="pdf-ledger-row">
              <span className="pdf-ledger-label">C/O Source:</span>
              <div className="pdf-ledger-value">{formData.co || '—'}</div>
            </div>
          </div>

          <div>
            <div className="pdf-ledger-row">
              <span className="pdf-ledger-label">Departure:</span>
              <div className="pdf-ledger-value">{formatToLuxuryDate(formData.departureDate)}</div>
            </div>
            <div className="pdf-ledger-row">
              <span className="pdf-ledger-label">Coming From:</span>
              <div className="pdf-ledger-value">{formData.comingFrom || '—'}</div>
            </div>
            <div className="pdf-ledger-row">
              <span className="pdf-ledger-label">ID Produced:</span>
              <div className="pdf-ledger-value">{formData.idProduced || '—'}</div>
            </div>
          </div>
        </div>

        <div className="pdf-ledger-row" style={{ marginTop: '8px' }}>
          <span className="pdf-ledger-label">Payment:</span>
          <div className="pdf-ledger-value" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            {formData.paymentCash && (
              <span className="pdf-payment-custom-check">
                <span className="pdf-checkbox-gold checked"></span>
                Cash Method
              </span>
            )}
            {formData.paymentOnline && (
              <span className="pdf-payment-custom-check">
                <span className="pdf-checkbox-gold checked"></span>
                Online / CC / Bank UPI
              </span>
            )}
            {!formData.paymentCash && !formData.paymentOnline && '—'}
          </div>
        </div>
      </div>

      {/* SECTION 3: ACCOMMODATION & PARTY LEDGER */}
      <div className="pdf-section">
        <h2 className="pdf-section-title">
          <span className="pdf-section-num">03 /</span> Suites & Occupancy Details
        </h2>

        <div className="luxury-accommodation-card">
          <div className="luxury-card-col" style={{ borderRight: '1px solid #cbd5e1', paddingRight: '24px' }}>
            <h3 className="luxury-card-title">Registered Party Summary</h3>
            <div className="luxury-guest-pill-container">
              <div className="luxury-guest-pill">
                <span className="luxury-guest-type">MALES</span>
                <span className="luxury-guest-count">{formData.guestsMale || 0}</span>
              </div>
              <div className="luxury-guest-pill">
                <span className="luxury-guest-type">FEMALES</span>
                <span className="luxury-guest-count">{formData.guestsFemale || 0}</span>
              </div>
              <div className="luxury-guest-pill">
                <span className="luxury-guest-type">KIDS</span>
                <span className="luxury-guest-count">{formData.guestsKids || 0}</span>
              </div>
            </div>
          </div>

          <div className="luxury-card-col" style={{ paddingLeft: '12px' }}>
            <h3 className="luxury-card-title">Allocated Resort Suites</h3>
            <div className="luxury-suite-badge-container">
              {formData.rooms && formData.rooms.length > 0 ? (
                formData.rooms.map((room, idx) => (
                  <span key={idx} className="luxury-suite-badge">
                    {room || '—'}
                  </span>
                ))
              ) : (
                <span className="no-suites-allocated">No suites currently assigned</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: TERMS & CONDITIONS */}
      <div className="luxury-notes-box">
        <h4 className="luxury-notes-title">Registry Notice & Terms of Stay</h4>
        <div className="luxury-notes-content">
          <div className="luxury-notes-item">1. Guests are kindfully requested to arrange advance credit/settlement towards room occupancy.</div>
          <div className="luxury-notes-item">2. All valuables, currencies, and luggage are brought within resort boundaries entirely at the owner's risk. The management accepts no liability.</div>
          <div className="luxury-notes-item">3. Cheques and general drafts are not supported under any circumstances. Settlements prior to guest checkout are required.</div>
          <div className="luxury-notes-item">4. Guests are respectfully requested to maintain silence and avoid loud music or disturbances after 10:00 PM in consideration of fellow occupants.</div>
          <div className="luxury-notes-item">5. Any permanent damage, excessive staining, or linen contamination caused during the stay, including damage resulting from vomiting or misuse, shall be chargeable to the registered guest.</div>
          <div className="luxury-notes-item" style={{ marginTop: '8px' }}>
            <span className="luxury-checkout-highlight">Notice: The standard resort departure check-out limit is respectfully set at 11:00 AM.</span>
          </div>
        </div>
      </div>

      {/* SECTION 5: SIGNATURES & VERIFICATION */}
      <div className="luxury-footer-grid">
        <div className="luxury-sig-block">
          <span className="luxury-sig-label">Guest Signature:</span>
          <div className="luxury-sig-line"></div>
          <span className="luxury-sig-value"></span>
        </div>

        <div className="luxury-sig-block" style={{ textAlign: 'center' }}>
          <span className="luxury-sig-label">Date:</span>
          <div className="luxury-sig-date-center">
            {formatToLuxuryDate(formData.arrivalDate)}
          </div>
        </div>

        <div className="luxury-sig-block" style={{ textAlign: 'right' }}>
          <span className="luxury-sig-label">Checked in by:</span>
          <div className="luxury-sig-line"></div>
          <span className="luxury-sig-value"></span>
        </div>
      </div>
    </div>
  );
}
