/**
 * Indian States and Cities Data
 * Used for dynamic state/city selection in event creation
 */

export const INDIAN_STATES = [
    { value: 'andhra-pradesh', label: 'Andhra Pradesh' },
    { value: 'arunachal-pradesh', label: 'Arunachal Pradesh' },
    { value: 'assam', label: 'Assam' },
    { value: 'bihar', label: 'Bihar' },
    { value: 'chhattisgarh', label: 'Chhattisgarh' },
    { value: 'goa', label: 'Goa' },
    { value: 'gujarat', label: 'Gujarat' },
    { value: 'haryana', label: 'Haryana' },
    { value: 'himachal-pradesh', label: 'Himachal Pradesh' },
    { value: 'jharkhand', label: 'Jharkhand' },
    { value: 'karnataka', label: 'Karnataka' },
    { value: 'kerala', label: 'Kerala' },
    { value: 'madhya-pradesh', label: 'Madhya Pradesh' },
    { value: 'maharashtra', label: 'Maharashtra' },
    { value: 'manipur', label: 'Manipur' },
    { value: 'meghalaya', label: 'Meghalaya' },
    { value: 'mizoram', label: 'Mizoram' },
    { value: 'nagaland', label: 'Nagaland' },
    { value: 'odisha', label: 'Odisha' },
    { value: 'punjab', label: 'Punjab' },
    { value: 'rajasthan', label: 'Rajasthan' },
    { value: 'sikkim', label: 'Sikkim' },
    { value: 'tamil-nadu', label: 'Tamil Nadu' },
    { value: 'telangana', label: 'Telangana' },
    { value: 'tripura', label: 'Tripura' },
    { value: 'uttar-pradesh', label: 'Uttar Pradesh' },
    { value: 'uttarakhand', label: 'Uttarakhand' },
    { value: 'west-bengal', label: 'West Bengal' },
    { value: 'delhi', label: 'Delhi' },
    { value: 'jammu-kashmir', label: 'Jammu and Kashmir' },
    { value: 'ladakh', label: 'Ladakh' },
    { value: 'puducherry', label: 'Puducherry' },
] as const;

export const CITIES_BY_STATE: Record<string, { value: string; label: string }[]> = {
    'karnataka': [
        { value: 'bangalore', label: 'Bangalore' },
        { value: 'mysore', label: 'Mysore' },
        { value: 'mangalore', label: 'Mangalore' },
        { value: 'hubli', label: 'Hubli' },
        { value: 'belgaum', label: 'Belgaum' },
    ],
    'maharashtra': [
        { value: 'mumbai', label: 'Mumbai' },
        { value: 'pune', label: 'Pune' },
        { value: 'nagpur', label: 'Nagpur' },
        { value: 'nashik', label: 'Nashik' },
        { value: 'aurangabad', label: 'Aurangabad' },
    ],
    'delhi': [
        { value: 'new-delhi', label: 'New Delhi' },
        { value: 'south-delhi', label: 'South Delhi' },
        { value: 'north-delhi', label: 'North Delhi' },
        { value: 'east-delhi', label: 'East Delhi' },
        { value: 'west-delhi', label: 'West Delhi' },
    ],
    'tamil-nadu': [
        { value: 'chennai', label: 'Chennai' },
        { value: 'coimbatore', label: 'Coimbatore' },
        { value: 'madurai', label: 'Madurai' },
        { value: 'tiruchirappalli', label: 'Tiruchirappalli' },
        { value: 'salem', label: 'Salem' },
    ],
    'telangana': [
        { value: 'hyderabad', label: 'Hyderabad' },
        { value: 'warangal', label: 'Warangal' },
        { value: 'nizamabad', label: 'Nizamabad' },
        { value: 'khammam', label: 'Khammam' },
    ],
    'uttar-pradesh': [
        { value: 'lucknow', label: 'Lucknow' },
        { value: 'kanpur', label: 'Kanpur' },
        { value: 'agra', label: 'Agra' },
        { value: 'varanasi', label: 'Varanasi' },
        { value: 'noida', label: 'Noida' },
    ],
    'gujarat': [
        { value: 'ahmedabad', label: 'Ahmedabad' },
        { value: 'surat', label: 'Surat' },
        { value: 'vadodara', label: 'Vadodara' },
        { value: 'rajkot', label: 'Rajkot' },
    ],
    'west-bengal': [
        { value: 'kolkata', label: 'Kolkata' },
        { value: 'howrah', label: 'Howrah' },
        { value: 'durgapur', label: 'Durgapur' },
        { value: 'siliguri', label: 'Siliguri' },
    ],
    'rajasthan': [
        { value: 'jaipur', label: 'Jaipur' },
        { value: 'jodhpur', label: 'Jodhpur' },
        { value: 'udaipur', label: 'Udaipur' },
        { value: 'kota', label: 'Kota' },
    ],
    'punjab': [
        { value: 'chandigarh', label: 'Chandigarh' },
        { value: 'ludhiana', label: 'Ludhiana' },
        { value: 'amritsar', label: 'Amritsar' },
        { value: 'jalandhar', label: 'Jalandhar' },
    ],
    'kerala': [
        { value: 'kochi', label: 'Kochi' },
        { value: 'thiruvananthapuram', label: 'Thiruvananthapuram' },
        { value: 'kozhikode', label: 'Kozhikode' },
        { value: 'thrissur', label: 'Thrissur' },
    ],
};

// Support for adding custom cities
export function getCitiesForState(state: string): { value: string; label: string }[] {
    return CITIES_BY_STATE[state] || [];
}
