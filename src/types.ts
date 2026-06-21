export interface GuestCheckIn {
  title: 'Mr' | 'Mrs' | '';
  guestName: string;
  address: string;
  phone: string;
  purposeOfVisit: string;
  comingFrom: string;
  co: string;
  guestsMale: number;
  guestsFemale: number;
  guestsKids: number;
  rooms: string[];
  arrivalDate: string;
  arrivalTime: string;
  departureDate: string;
  idProduced: string;
  vehicleNumber: string;
  paymentCash: boolean;
  paymentOnline: boolean;
}

export const DEFAULT_FORM_STATE = (date: Date): GuestCheckIn => {
  // Extract date string YYYY-MM-DD
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const defaultDate = `${yyyy}-${mm}-${dd}`;

  // Extract time HH:MM
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const defaultTime = `${hh}:${min}`;

  return {
    title: '',
    guestName: '',
    address: '',
    phone: '',
    purposeOfVisit: '',
    comingFrom: '',
    co: '',
    guestsMale: 0,
    guestsFemale: 0,
    guestsKids: 0,
    rooms: [''],
    arrivalDate: defaultDate,
    arrivalTime: defaultTime,
    departureDate: '',
    idProduced: '',
    vehicleNumber: '',
    paymentCash: false,
    paymentOnline: false,
  };
};
