/** Auto-generated state map registry — real district boundaries */

/**
 * Generate a standardized slug from a state name
 * @param {string} name - State name
 * @returns {string} Slug for file path
 */
export function getStateSlug(name) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export const STATE_MAP_REGISTRY = {
  'AP': { name: 'Andhra Pradesh', slug: 'andhra-pradesh', districtCount: 13 },
  'AR': { name: 'Arunachal Pradesh', slug: 'arunachal-pradesh', districtCount: 25 },
  'AS': { name: 'Assam', slug: 'assam', districtCount: 33 },
  'BR': { name: 'Bihar', slug: 'bihar', districtCount: 38 },
  'CH': { name: 'Chandigarh', slug: 'chandigarh', districtCount: 1 },
  'CT': { name: 'Chhattisgarh', slug: 'chhattisgarh', districtCount: 27 },
  'DN': { name: 'Dadra and Nagar Haveli and Daman and Diu', slug: 'dadra-and-nagar-haveli-and-daman-and-diu', districtCount: 3 },
  'DL': { name: 'Delhi', slug: 'delhi', districtCount: 1 },
  'GA': { name: 'Goa', slug: 'goa', districtCount: 2 },
  'GJ': { name: 'Gujarat', slug: 'gujarat', districtCount: 33 },
  'HR': { name: 'Haryana', slug: 'haryana', districtCount: 22 },
  'HP': { name: 'Himachal Pradesh', slug: 'himachal-pradesh', districtCount: 12 },
  'JK': { name: 'Jammu and Kashmir', slug: 'jammu-and-kashmir', districtCount: 22 },
  'JH': { name: 'Jharkhand', slug: 'jharkhand', districtCount: 24 },
  'KA': { name: 'Karnataka', slug: 'karnataka', districtCount: 30 },
  'KL': { name: 'Kerala', slug: 'kerala', districtCount: 14 },
  'LA': { name: 'Ladakh', slug: 'ladakh', districtCount: 2 },
  'LD': { name: 'Lakshadweep', slug: 'lakshadweep', districtCount: 1 },
  'MP': { name: 'Madhya Pradesh', slug: 'madhya-pradesh', districtCount: 52 },
  'MH': { name: 'Maharashtra', slug: 'maharashtra', districtCount: 35 },
  'MN': { name: 'Manipur', slug: 'manipur', districtCount: 16 },
  'ML': { name: 'Meghalaya', slug: 'meghalaya', districtCount: 11 },
  'MZ': { name: 'Mizoram', slug: 'mizoram', districtCount: 10 },
  'NL': { name: 'Nagaland', slug: 'nagaland', districtCount: 11 },
  'OR': { name: 'Odisha', slug: 'odisha', districtCount: 30 },
  'PY': { name: 'Puducherry', slug: 'puducherry', districtCount: 4 },
  'PB': { name: 'Punjab', slug: 'punjab', districtCount: 22 },
  'RJ': { name: 'Rajasthan', slug: 'rajasthan', districtCount: 33 },
  'SK': { name: 'Sikkim', slug: 'sikkim', districtCount: 4 },
  'TN': { name: 'Tamil Nadu', slug: 'tamil-nadu', districtCount: 37 },
  'TG': { name: 'Telangana', slug: 'telangana', districtCount: 33 },
  'TR': { name: 'Tripura', slug: 'tripura', districtCount: 8 },
  'UP': { name: 'Uttar Pradesh', slug: 'uttar-pradesh', districtCount: 75 },
  'UT': { name: 'Uttarakhand', slug: 'uttarakhand', districtCount: 13 },
  'WB': { name: 'West Bengal', slug: 'west-bengal', districtCount: 23 },
  'AN': { name: 'Andaman and Nicobar Islands', slug: 'andaman-and-nicobar-islands', districtCount: 3 },
};

export function getStateMapUrl(code) {
  const entry = STATE_MAP_REGISTRY[code];
  if (!entry) {
    console.error(`[StateMapRegistry] No entry found for state code: ${code}`);
    return null;
  }
  const url = `/maps/states/${entry.slug}.json`;
  console.log(`[StateMapRegistry] Loading map for ${entry.name} (${code}): ${url}`);
  return url;
}

export function getStateName(code) {
  return STATE_MAP_REGISTRY[code]?.name || code;
}
