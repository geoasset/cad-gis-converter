export interface CrsOption {
  value: string;
  label: string;
}

export type CrsCategory = 'common' | 'state-plane-2d' | 'state-plane-3d';

export const commonCRS: CrsOption[] = [
  { value: 'EPSG:4326', label: 'WGS84 (EPSG:4326) - Geographic' },
  { value: 'EPSG:3857', label: 'Web Mercator (EPSG:3857)' },
  { value: 'EPSG:2154', label: 'RGF93 / Lambert-93 (EPSG:2154)' },
  { value: 'EPSG:3826', label: 'TWD97 / TM2 zone 121 (EPSG:3826)' },
  { value: 'EPSG:32633', label: 'WGS84 / UTM zone 33N (EPSG:32633)' },
  { value: 'EPSG:32618', label: 'WGS84 / UTM zone 18N (EPSG:32618)' },
];

export const statePlane2DCRS: CrsOption[] = [
  // Arizona
  { value: 'EPSG:2222', label: 'NAD83 / Arizona East (ft)' },
  { value: 'EPSG:2223', label: 'NAD83 / Arizona Central (ft)' },
  { value: 'EPSG:2224', label: 'NAD83 / Arizona West (ft)' },
  // Arkansas
  { value: 'EPSG:3433', label: 'NAD83 / Arkansas North (ftUS)' },
  { value: 'EPSG:3434', label: 'NAD83 / Arkansas South (ftUS)' },
  // California
  { value: 'EPSG:2225', label: 'NAD83 / California zone 1 (ftUS)' },
  { value: 'EPSG:2226', label: 'NAD83 / California zone 2 (ftUS)' },
  { value: 'EPSG:2227', label: 'NAD83 / California zone 3 (ftUS)' },
  { value: 'EPSG:2228', label: 'NAD83 / California zone 4 (ftUS)' },
  { value: 'EPSG:2229', label: 'NAD83 / California zone 5 (ftUS)' },
  { value: 'EPSG:2230', label: 'NAD83 / California zone 6 (ftUS)' },
  // Colorado
  { value: 'EPSG:2231', label: 'NAD83 / Colorado North (ftUS)' },
  { value: 'EPSG:2232', label: 'NAD83 / Colorado Central (ftUS)' },
  { value: 'EPSG:2233', label: 'NAD83 / Colorado South (ftUS)' },
  // Connecticut
  { value: 'EPSG:2234', label: 'NAD83 / Connecticut (ftUS)' },
  // Delaware
  { value: 'EPSG:2235', label: 'NAD83 / Delaware (ftUS)' },
  // Florida
  { value: 'EPSG:2238', label: 'NAD83 / Florida North (ftUS)' },
  { value: 'EPSG:2236', label: 'NAD83 / Florida East (ftUS)' },
  { value: 'EPSG:2237', label: 'NAD83 / Florida West (ftUS)' },
  // Georgia
  { value: 'EPSG:2239', label: 'NAD83 / Georgia East (ftUS)' },
  { value: 'EPSG:2240', label: 'NAD83 / Georgia West (ftUS)' },
  // Hawaii
  { value: 'EPSG:3759', label: 'NAD83 / Hawaii zone 3 (ftUS)' },
  // Idaho
  { value: 'EPSG:2241', label: 'NAD83 / Idaho East (ftUS)' },
  { value: 'EPSG:2242', label: 'NAD83 / Idaho Central (ftUS)' },
  { value: 'EPSG:2243', label: 'NAD83 / Idaho West (ftUS)' },
  // Illinois
  { value: 'EPSG:3435', label: 'NAD83 / Illinois East (ftUS)' },
  { value: 'EPSG:3436', label: 'NAD83 / Illinois West (ftUS)' },
  // Indiana
  { value: 'EPSG:2965', label: 'NAD83 / Indiana East (ftUS)' },
  { value: 'EPSG:2966', label: 'NAD83 / Indiana West (ftUS)' },
  // Iowa
  { value: 'EPSG:3417', label: 'NAD83 / Iowa North (ftUS)' },
  { value: 'EPSG:3418', label: 'NAD83 / Iowa South (ftUS)' },
  // Kansas
  { value: 'EPSG:3419', label: 'NAD83 / Kansas North (ftUS)' },
  { value: 'EPSG:3420', label: 'NAD83 / Kansas South (ftUS)' },
  // Kentucky
  { value: 'EPSG:2246', label: 'NAD83 / Kentucky North (ftUS)' },
  { value: 'EPSG:2247', label: 'NAD83 / Kentucky South (ftUS)' },
  // Louisiana
  { value: 'EPSG:3451', label: 'NAD83 / Louisiana North (ftUS)' },
  { value: 'EPSG:3452', label: 'NAD83 / Louisiana South (ftUS)' },
  { value: 'EPSG:3453', label: 'NAD83 / Louisiana Offshore (ftUS)' },
  // Maryland
  { value: 'EPSG:2248', label: 'NAD83 / Maryland (ftUS)' },
  // Massachusetts
  { value: 'EPSG:2249', label: 'NAD83 / Massachusetts Mainland (ftUS)' },
  { value: 'EPSG:2250', label: 'NAD83 / Massachusetts Island (ftUS)' },
  // Michigan
  { value: 'EPSG:2251', label: 'NAD83 / Michigan North (ft)' },
  { value: 'EPSG:2252', label: 'NAD83 / Michigan Central (ft)' },
  { value: 'EPSG:2253', label: 'NAD83 / Michigan South (ft)' },
  // Mississippi
  { value: 'EPSG:2254', label: 'NAD83 / Mississippi East (ftUS)' },
  { value: 'EPSG:2255', label: 'NAD83 / Mississippi West (ftUS)' },
  // Montana
  { value: 'EPSG:2256', label: 'NAD83 / Montana (ft)' },
  // Nevada
  { value: 'EPSG:3421', label: 'NAD83 / Nevada East (ftUS)' },
  { value: 'EPSG:3422', label: 'NAD83 / Nevada Central (ftUS)' },
  { value: 'EPSG:3423', label: 'NAD83 / Nevada West (ftUS)' },
  // New Hampshire
  { value: 'EPSG:3437', label: 'NAD83 / New Hampshire (ftUS)' },
  // New Jersey
  { value: 'EPSG:3424', label: 'NAD83 / New Jersey (ftUS)' },
  // New Mexico
  { value: 'EPSG:2257', label: 'NAD83 / New Mexico East (ftUS)' },
  { value: 'EPSG:2258', label: 'NAD83 / New Mexico Central (ftUS)' },
  { value: 'EPSG:2259', label: 'NAD83 / New Mexico West (ftUS)' },
  // New York
  { value: 'EPSG:2260', label: 'NAD83 / New York East (ftUS)' },
  { value: 'EPSG:2261', label: 'NAD83 / New York Central (ftUS)' },
  { value: 'EPSG:2262', label: 'NAD83 / New York West (ftUS)' },
  { value: 'EPSG:2263', label: 'NAD83 / New York Long Island (ftUS)' },
  // North Carolina
  { value: 'EPSG:2264', label: 'NAD83 / North Carolina (ftUS)' },
  // North Dakota
  { value: 'EPSG:2265', label: 'NAD83 / North Dakota North (ft)' },
  { value: 'EPSG:2266', label: 'NAD83 / North Dakota South (ft)' },
  // Ohio
  { value: 'EPSG:3734', label: 'NAD83 / Ohio North (ftUS)' },
  { value: 'EPSG:3735', label: 'NAD83 / Ohio South (ftUS)' },
  // Oklahoma
  { value: 'EPSG:2267', label: 'NAD83 / Oklahoma North (ftUS)' },
  { value: 'EPSG:2268', label: 'NAD83 / Oklahoma South (ftUS)' },
  // Oregon
  { value: 'EPSG:2269', label: 'NAD83 / Oregon North (ft)' },
  { value: 'EPSG:2270', label: 'NAD83 / Oregon South (ft)' },
  // Pennsylvania
  { value: 'EPSG:2271', label: 'NAD83 / Pennsylvania North (ftUS)' },
  { value: 'EPSG:2272', label: 'NAD83 / Pennsylvania South (ftUS)' },
  // Rhode Island
  { value: 'EPSG:3438', label: 'NAD83 / Rhode Island (ftUS)' },
  // South Carolina
  { value: 'EPSG:2273', label: 'NAD83 / South Carolina (ft)' },
  // South Dakota
  { value: 'EPSG:3455', label: 'NAD83 / South Dakota South (ftUS)' },
  // Tennessee
  { value: 'EPSG:2274', label: 'NAD83 / Tennessee (ftUS)' },
  // Texas
  { value: 'EPSG:2275', label: 'NAD83 / Texas North (ftUS)' },
  { value: 'EPSG:2276', label: 'NAD83 / Texas North Central (ftUS)' },
  { value: 'EPSG:2277', label: 'NAD83 / Texas Central (ftUS)' },
  { value: 'EPSG:2278', label: 'NAD83 / Texas South Central (ftUS)' },
  { value: 'EPSG:2279', label: 'NAD83 / Texas South (ftUS)' },
  // Utah
  { value: 'EPSG:3560', label: 'NAD83 / Utah North (ftUS)' },
  { value: 'EPSG:3566', label: 'NAD83 / Utah Central (ftUS)' },
  { value: 'EPSG:3567', label: 'NAD83 / Utah South (ftUS)' },
  // Virginia
  { value: 'EPSG:2283', label: 'NAD83 / Virginia North (ftUS)' },
  { value: 'EPSG:2284', label: 'NAD83 / Virginia South (ftUS)' },
  // Washington
  { value: 'EPSG:2285', label: 'NAD83 / Washington North (ftUS)' },
  { value: 'EPSG:2286', label: 'NAD83 / Washington South (ftUS)' },
  // Wisconsin
  { value: 'EPSG:2287', label: 'NAD83 / Wisconsin North (ftUS)' },
  { value: 'EPSG:2288', label: 'NAD83 / Wisconsin Central (ftUS)' },
  { value: 'EPSG:2289', label: 'NAD83 / Wisconsin South (ftUS)' },
  // Wyoming
  { value: 'EPSG:3736', label: 'NAD83 / Wyoming East (ftUS)' },
  { value: 'EPSG:3737', label: 'NAD83 / Wyoming East Central (ftUS)' },
  { value: 'EPSG:3738', label: 'NAD83 / Wyoming West Central (ftUS)' },
  { value: 'EPSG:3739', label: 'NAD83 / Wyoming West (ftUS)' },
];

export const statePlane3DCRS: CrsOption[] = [
  // Arizona
  { value: 'EPSG:8700', label: 'NAD83 / Arizona East (ft) + NAVD88 height (ft)' },
  { value: 'EPSG:8701', label: 'NAD83 / Arizona Central (ft) + NAVD88 height (ft)' },
  { value: 'EPSG:8702', label: 'NAD83 / Arizona West (ft) + NAVD88 height (ft)' },
  // Arkansas
  { value: 'EPSG:8712', label: 'NAD83 / Arkansas North (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8713', label: 'NAD83 / Arkansas South (ftUS) + NAVD88 height (ftUS)' },
  // California
  { value: 'EPSG:8714', label: 'NAD83 / California zone 1 (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8715', label: 'NAD83 / California zone 2 (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8716', label: 'NAD83 / California zone 3 (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8717', label: 'NAD83 / California zone 4 (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8718', label: 'NAD83 / California zone 5 (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8719', label: 'NAD83 / California zone 6 (ftUS) + NAVD88 height (ftUS)' },
  // Colorado
  { value: 'EPSG:8720', label: 'NAD83 / Colorado North (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8721', label: 'NAD83 / Colorado Central (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8722', label: 'NAD83 / Colorado South (ftUS) + NAVD88 height (ftUS)' },
  // Connecticut
  { value: 'EPSG:8723', label: 'NAD83 / Connecticut (ftUS) + NAVD88 height (ftUS)' },
  // Delaware
  { value: 'EPSG:8724', label: 'NAD83 / Delaware (ftUS) + NAVD88 height (ftUS)' },
  // Florida
  { value: 'EPSG:8725', label: 'NAD83 / Florida North (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8726', label: 'NAD83 / Florida East (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8727', label: 'NAD83 / Florida West (ftUS) + NAVD88 height (ftUS)' },
  // Georgia
  { value: 'EPSG:8728', label: 'NAD83 / Georgia East (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8729', label: 'NAD83 / Georgia West (ftUS) + NAVD88 height (ftUS)' },
  // Idaho
  { value: 'EPSG:8730', label: 'NAD83 / Idaho East (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8731', label: 'NAD83 / Idaho Central (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8732', label: 'NAD83 / Idaho West (ftUS) + NAVD88 height (ftUS)' },
  // Illinois
  { value: 'EPSG:8733', label: 'NAD83 / Illinois East (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8734', label: 'NAD83 / Illinois West (ftUS) + NAVD88 height (ftUS)' },
  // Indiana
  { value: 'EPSG:8735', label: 'NAD83 / Indiana East (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8736', label: 'NAD83 / Indiana West (ftUS) + NAVD88 height (ftUS)' },
  // Iowa
  { value: 'EPSG:8737', label: 'NAD83 / Iowa North (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8738', label: 'NAD83 / Iowa South (ftUS) + NAVD88 height (ftUS)' },
  // Kansas
  { value: 'EPSG:8739', label: 'NAD83 / Kansas North (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8740', label: 'NAD83 / Kansas South (ftUS) + NAVD88 height (ftUS)' },
  // Kentucky
  { value: 'EPSG:8741', label: 'NAD83 / Kentucky North (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8742', label: 'NAD83 / Kentucky South (ftUS) + NAVD88 height (ftUS)' },
  // Louisiana
  { value: 'EPSG:8743', label: 'NAD83 / Louisiana North (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8744', label: 'NAD83 / Louisiana South (ftUS) + NAVD88 height (ftUS)' },
  // Maine
  { value: 'EPSG:8745', label: 'NAD83 / Maine East (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8746', label: 'NAD83 / Maine West (ftUS) + NAVD88 height (ftUS)' },
  // Maryland
  { value: 'EPSG:8747', label: 'NAD83 / Maryland (ftUS) + NAVD88 height (ftUS)' },
  // Massachusetts
  { value: 'EPSG:8748', label: 'NAD83 / Massachusetts Mainland (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8749', label: 'NAD83 / Massachusetts Island (ftUS) + NAVD88 height (ftUS)' },
  // Michigan
  { value: 'EPSG:8703', label: 'NAD83 / Michigan North (ft) + NAVD88 height (ft)' },
  { value: 'EPSG:8704', label: 'NAD83 / Michigan Central (ft) + NAVD88 height (ft)' },
  { value: 'EPSG:8705', label: 'NAD83 / Michigan South (ft) + NAVD88 height (ft)' },
  // Minnesota
  { value: 'EPSG:8750', label: 'NAD83 / Minnesota North (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8751', label: 'NAD83 / Minnesota Central (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8752', label: 'NAD83 / Minnesota South (ftUS) + NAVD88 height (ftUS)' },
  // Mississippi
  { value: 'EPSG:8753', label: 'NAD83 / Mississippi East (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8754', label: 'NAD83 / Mississippi West (ftUS) + NAVD88 height (ftUS)' },
  // Montana
  { value: 'EPSG:8706', label: 'NAD83 / Montana (ft) + NAVD88 height (ft)' },
  // Nebraska
  { value: 'EPSG:8755', label: 'NAD83 / Nebraska (ftUS) + NAVD88 height (ftUS)' },
  // Nevada
  { value: 'EPSG:8756', label: 'NAD83 / Nevada East (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8757', label: 'NAD83 / Nevada Central (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8758', label: 'NAD83 / Nevada West (ftUS) + NAVD88 height (ftUS)' },
  // New Hampshire
  { value: 'EPSG:8759', label: 'NAD83 / New Hampshire (ftUS) + NAVD88 height (ftUS)' },
  // New Jersey
  { value: 'EPSG:8760', label: 'NAD83 / New Jersey (ftUS) + NAVD88 height (ftUS)' },
  // New Mexico
  { value: 'EPSG:8761', label: 'NAD83 / New Mexico East (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8762', label: 'NAD83 / New Mexico Central (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8763', label: 'NAD83 / New Mexico West (ftUS) + NAVD88 height (ftUS)' },
  // New York
  { value: 'EPSG:8764', label: 'NAD83 / New York East (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8765', label: 'NAD83 / New York Central (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8766', label: 'NAD83 / New York West (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8767', label: 'NAD83 / New York Long Island (ftUS) + NAVD88 height (ftUS)' },
  // North Carolina
  { value: 'EPSG:8768', label: 'NAD83 / North Carolina (ftUS) + NAVD88 height (ftUS)' },
  // North Dakota
  { value: 'EPSG:8707', label: 'NAD83 / North Dakota North (ft) + NAVD88 height (ft)' },
  { value: 'EPSG:8708', label: 'NAD83 / North Dakota South (ft) + NAVD88 height (ft)' },
  // Ohio
  { value: 'EPSG:8769', label: 'NAD83 / Ohio North (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8770', label: 'NAD83 / Ohio South (ftUS) + NAVD88 height (ftUS)' },
  // Oklahoma
  { value: 'EPSG:8771', label: 'NAD83 / Oklahoma North (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8772', label: 'NAD83 / Oklahoma South (ftUS) + NAVD88 height (ftUS)' },
  // Oregon
  { value: 'EPSG:8709', label: 'NAD83 / Oregon North (ft) + NAVD88 height (ft)' },
  { value: 'EPSG:8710', label: 'NAD83 / Oregon South (ft) + NAVD88 height (ft)' },
  // Pennsylvania
  { value: 'EPSG:8773', label: 'NAD83 / Pennsylvania North (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8774', label: 'NAD83 / Pennsylvania South (ftUS) + NAVD88 height (ftUS)' },
  // Rhode Island
  { value: 'EPSG:8775', label: 'NAD83 / Rhode Island (ftUS) + NAVD88 height (ftUS)' },
  // South Carolina
  { value: 'EPSG:8711', label: 'NAD83 / South Carolina (ft) + NAVD88 height (ft)' },
  // South Dakota
  { value: 'EPSG:8776', label: 'NAD83 / South Dakota North (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8777', label: 'NAD83 / South Dakota South (ftUS) + NAVD88 height (ftUS)' },
  // Tennessee
  { value: 'EPSG:8778', label: 'NAD83 / Tennessee (ftUS) + NAVD88 height (ftUS)' },
  // Texas
  { value: 'EPSG:8779', label: 'NAD83 / Texas North (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8780', label: 'NAD83 / Texas North Central (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8781', label: 'NAD83 / Texas Central (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8782', label: 'NAD83 / Texas South Central (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8783', label: 'NAD83 / Texas South (ftUS) + NAVD88 height (ftUS)' },
  // Utah
  { value: 'EPSG:8784', label: 'NAD83 / Utah North (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8785', label: 'NAD83 / Utah Central (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8786', label: 'NAD83 / Utah South (ftUS) + NAVD88 height (ftUS)' },
  // Vermont
  { value: 'EPSG:8787', label: 'NAD83 / Vermont (ftUS) + NAVD88 height (ftUS)' },
  // Virginia
  { value: 'EPSG:8788', label: 'NAD83 / Virginia North (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8789', label: 'NAD83 / Virginia South (ftUS) + NAVD88 height (ftUS)' },
  // Washington
  { value: 'EPSG:8790', label: 'NAD83 / Washington North (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8791', label: 'NAD83 / Washington South (ftUS) + NAVD88 height (ftUS)' },
  // West Virginia
  { value: 'EPSG:8792', label: 'NAD83 / West Virginia North (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8793', label: 'NAD83 / West Virginia South (ftUS) + NAVD88 height (ftUS)' },
  // Wisconsin
  { value: 'EPSG:8794', label: 'NAD83 / Wisconsin North (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8795', label: 'NAD83 / Wisconsin Central (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8796', label: 'NAD83 / Wisconsin South (ftUS) + NAVD88 height (ftUS)' },
  // Wyoming
  { value: 'EPSG:8797', label: 'NAD83 / Wyoming East (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8798', label: 'NAD83 / Wyoming East Central (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8799', label: 'NAD83 / Wyoming West Central (ftUS) + NAVD88 height (ftUS)' },
  { value: 'EPSG:8800', label: 'NAD83 / Wyoming West (ftUS) + NAVD88 height (ftUS)' },
];

export const getCurrentCRSList = (category: CrsCategory): CrsOption[] => {
  if (category === 'common') return commonCRS;
  if (category === 'state-plane-2d') return statePlane2DCRS;
  return statePlane3DCRS;
};

/**
 * Get a human-readable display name for an EPSG code
 * @param epsgCode - The EPSG code (e.g., "EPSG:2278")
 * @returns The formatted display name from the CRS options, or just the code if not found
 */
export const getEpsgDisplayName = (epsgCode: string): string => {
  // Search through all CRS categories for the matching code
  const allCRS = [...commonCRS, ...statePlane2DCRS, ...statePlane3DCRS];
  const crsOption = allCRS.find(option => option.value === epsgCode);
  
  if (crsOption) {
    return `${epsgCode} - ${crsOption.label}`;
  }
  
  // Return just the code if no match is found
  return epsgCode;
};
