import { FRow, FInput } from '../ui/Form';

const ADDRESS_DATA = {
  India: {
    'Andhra Pradesh':     { cities: ['Visakhapatnam','Vijayawada','Guntur','Nellore','Kurnool','Tirupati','Rajahmundry','Kakinada'] },
    'Delhi':              { cities: ['New Delhi','Dwarka','Rohini','Saket','Lajpat Nagar','Karol Bagh','Janakpuri','Pitampura'] },
    'Gujarat':            { cities: ['Ahmedabad','Surat','Vadodara','Rajkot','Bhavnagar','Jamnagar','Gandhinagar','Anand'] },
    'Karnataka':          { cities: ['Bengaluru','Mysuru','Hubli','Mangaluru','Belagavi','Kalaburagi','Davanagere','Shimoga'] },
    'Kerala':             { cities: ['Thiruvananthapuram','Kochi','Kozhikode','Thrissur','Kollam','Palakkad','Alappuzha','Kannur'] },
    'Madhya Pradesh':     { cities: ['Bhopal','Indore','Jabalpur','Gwalior','Ujjain','Sagar','Dewas','Satna'] },
    'Maharashtra':        { cities: ['Mumbai','Pune','Nagpur','Nashik','Aurangabad','Solapur','Thane','Navi Mumbai'] },
    'Punjab':             { cities: ['Ludhiana','Amritsar','Jalandhar','Patiala','Bathinda','Mohali','Hoshiarpur','Gurdaspur'] },
    'Rajasthan':          { cities: ['Jaipur','Jodhpur','Udaipur','Kota','Ajmer','Bikaner','Alwar','Bharatpur'] },
    'Tamil Nadu':         { cities: ['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli','Erode','Vellore'] },
    'Telangana':          { cities: ['Hyderabad','Warangal','Nizamabad','Karimnagar','Khammam','Ramagundam','Mahbubnagar','Nalgonda'] },
    'Uttar Pradesh':      { cities: ['Lucknow','Kanpur','Ghaziabad','Agra','Meerut','Varanasi','Allahabad','Bareilly'] },
    'West Bengal':        { cities: ['Kolkata','Howrah','Durgapur','Asansol','Siliguri','Bardhaman','Malda','Baharampur'] },
    'Haryana':            { cities: ['Gurugram','Faridabad','Panipat','Ambala','Yamunanagar','Rohtak','Hisar','Karnal'] },
    'Bihar':              { cities: ['Patna','Gaya','Bhagalpur','Muzaffarpur','Darbhanga','Purnia','Arrah','Bihar Sharif'] },
    'Odisha':             { cities: ['Bhubaneswar','Cuttack','Rourkela','Brahmapur','Sambalpur','Puri','Balasore','Bhadrak'] },
    'Jharkhand':          { cities: ['Ranchi','Jamshedpur','Dhanbad','Bokaro','Deoghar','Phusro','Hazaribagh','Giridih'] },
    'Chhattisgarh':       { cities: ['Raipur','Bhilai','Bilaspur','Korba','Durg','Rajnandgaon','Raigarh','Ambikapur'] },
    'Assam':              { cities: ['Guwahati','Silchar','Dibrugarh','Jorhat','Nagaon','Tinsukia','Tezpur','Bongaigaon'] },
    'Himachal Pradesh':   { cities: ['Shimla','Manali','Dharamsala','Solan','Mandi','Kullu','Hamirpur','Una'] },
    'Uttarakhand':        { cities: ['Dehradun','Haridwar','Roorkee','Haldwani','Rudrapur','Kashipur','Rishikesh','Kotdwar'] },
    'Goa':                { cities: ['Panaji','Margao','Vasco da Gama','Mapusa','Ponda','Bicholim','Curchorem','Sanquelim'] },
  },
  UAE: {
    'Abu Dhabi':   { cities: ['Abu Dhabi City','Al Ain','Ruwais','Liwa','Madinat Zayed'] },
    'Dubai':       { cities: ['Dubai City','Deira','Bur Dubai','Jumeirah','Al Barsha','Business Bay','Dubai Marina'] },
    'Sharjah':     { cities: ['Sharjah City','Khor Fakkan','Kalba','Dhaid'] },
    'Ajman':       { cities: ['Ajman City'] },
    'Fujairah':    { cities: ['Fujairah City','Dibba'] },
    'Ras Al Khaimah': { cities: ['RAK City','Julfar','Khatt'] },
    'Umm Al Quwain': { cities: ['UAQ City'] },
  },
  USA: {
    'California':  { cities: ['Los Angeles','San Francisco','San Diego','Sacramento','San Jose','Fresno','Oakland','Bakersfield'] },
    'Texas':       { cities: ['Houston','Dallas','Austin','San Antonio','Fort Worth','El Paso','Arlington','Corpus Christi'] },
    'New York':    { cities: ['New York City','Buffalo','Rochester','Yonkers','Syracuse','Albany','New Rochelle','Mount Vernon'] },
    'Florida':     { cities: ['Miami','Orlando','Tampa','Jacksonville','Tallahassee','Fort Lauderdale','St. Petersburg','Hialeah'] },
    'Illinois':    { cities: ['Chicago','Aurora','Rockford','Joliet','Naperville','Springfield','Peoria','Elgin'] },
    'Washington':  { cities: ['Seattle','Spokane','Tacoma','Vancouver','Bellevue','Kirkland','Redmond','Renton'] },
    'Georgia':     { cities: ['Atlanta','Augusta','Columbus','Macon','Savannah','Athens','Sandy Springs','Roswell'] },
  },
  'United Kingdom': {
    'England':     { cities: ['London','Manchester','Birmingham','Leeds','Sheffield','Bristol','Liverpool','Newcastle'] },
    'Scotland':    { cities: ['Edinburgh','Glasgow','Aberdeen','Dundee','Inverness','Perth','Stirling','Falkirk'] },
    'Wales':       { cities: ['Cardiff','Swansea','Newport','Wrexham','Barry','Neath','Cwmbran','Bangor'] },
    'N. Ireland':  { cities: ['Belfast','Londonderry','Lisburn','Newry','Armagh','Ballymena','Coleraine','Omagh'] },
  },
  Australia: {
    'New South Wales':   { cities: ['Sydney','Newcastle','Wollongong','Canberra','Central Coast','Maitland','Bathurst','Orange'] },
    'Victoria':          { cities: ['Melbourne','Geelong','Ballarat','Bendigo','Shepparton','Mildura','Wodonga','Warrnambool'] },
    'Queensland':        { cities: ['Brisbane','Gold Coast','Sunshine Coast','Cairns','Townsville','Toowoomba','Mackay','Rockhampton'] },
    'Western Australia': { cities: ['Perth','Fremantle','Mandurah','Bunbury','Geraldton','Kalgoorlie','Albany','Broome'] },
    'South Australia':   { cities: ['Adelaide','Mount Gambier','Whyalla','Murray Bridge','Port Augusta','Port Pirie','Victor Harbor','Gawler'] },
  },
};

const COUNTRIES = Object.keys(ADDRESS_DATA);

// `value` = { country, state, city, area, pincode } — parent owns this object
// `onChange` = (nextValue) => void — called on every field change
const AddressFields = ({ prefix = '', value, onChange }) => {
  const v = value || { country: '', state: '', city: '', area: '', pincode: '' };

  const states = v.country ? Object.keys(ADDRESS_DATA[v.country] || {}) : [];
  const cities = (v.country && v.state) ? (ADDRESS_DATA[v.country]?.[v.state]?.cities || []) : [];

  const set = (patch) => onChange?.({ ...v, ...patch });

  const handleCountry = (e) => set({ country: e.target.value, state: '', city: '' });
  const handleState   = (e) => set({ state: e.target.value, city: '' });
  const handleCity    = (e) => set({ city: e.target.value });
  const handleArea    = (e) => set({ area: e.target.value });
  const handlePincode = (e) => set({ pincode: e.target.value });

  return (
    <div className="addr-wrap">
      <div className="addr-grid-3">
        <FRow label="Country">
          <select className="form-select" value={v.country} onChange={handleCountry} name={`${prefix}country`}>
            <option value="">Select Country</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FRow>
        <FRow label="State / Province">
          <select className="form-select" value={v.state} onChange={handleState} name={`${prefix}state`} disabled={!v.country}>
            <option value="">Select State</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </FRow>
        <FRow label="City">
          <select className="form-select" value={v.city} onChange={handleCity} name={`${prefix}city`} disabled={!v.state}>
            <option value="">Select City</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </FRow>
      </div>
      <div className="addr-grid-2">
        <FRow label="Area / Locality">
          <FInput placeholder="e.g. Koramangala, Sector 15…" name={`${prefix}area`} value={v.area} onChange={handleArea} />
        </FRow>
        <FRow label="ZIP / PIN Code">
          <FInput placeholder="e.g. 560034" name={`${prefix}pincode`} maxLength={10} value={v.pincode} onChange={handlePincode} />
        </FRow>
      </div>
    </div>
  );
};

export default AddressFields;