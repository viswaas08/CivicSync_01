import { 
  CountryConfig, 
  AdministrativeLevelDefinition, 
  Department, 
  GovernmentOfficial,
  DepartmentResponsibilityRule,
  SlaPolicy,
  GisDataset,
  GISCoverageReport
} from '../types';

/**
 * CivicSync Global Country Architecture Registry (Sections 2 - 5)
 * Defines first-class country configurations, dynamic administrative hierarchies,
 * departments, roles, SLAs, and GIS sources.
 */

export const SUPPORTED_COUNTRIES: CountryConfig[] = [
  {
    countryId: 'IN',
    iso2: 'IN',
    iso3: 'IND',
    name: 'India',
    officialName: 'Republic of India',
    defaultLanguage: 'en-IN',
    supportedLanguages: ['en-IN', 'ta-IN', 'hi-IN', 'kn-IN'],
    phoneCode: '+91',
    phoneFormatPattern: '^[6-9]\\d{9}$',
    currencyCode: 'INR',
    currencySymbol: '₹',
    timezoneStrategy: 'JURISDICTION',
    defaultTimezone: 'Asia/Kolkata',
    administrativeModel: 'INDIA',
    identityProvider: 'AADHAAR_OPTIONAL',
    gisStatus: 'PRODUCTION_READY',
    gisProvider: 'Survey of India & Municipal Town Planning Directorate',
    status: 'ACTIVE',
    defaultSlaHours: 72,
    emergencySlaHours: 24,
    addressFormatSchema: ['street', 'locality', 'localBody', 'district', 'state', 'postalCode'],
    emergencyCategories: ['Live Electrical Wire', 'Open Manhole', 'Bridge Structural Defect', 'Toxic Effluent Leak'],
    boundingBox: {
      minLat: 8.0,
      maxLat: 37.0,
      minLng: 68.0,
      maxLng: 97.0
    }
  },
  {
    countryId: 'US',
    iso2: 'US',
    iso3: 'USA',
    name: 'United States',
    officialName: 'United States of America',
    defaultLanguage: 'en-US',
    supportedLanguages: ['en-US', 'es-US'],
    phoneCode: '+1',
    phoneFormatPattern: '^\\d{10}$',
    currencyCode: 'USD',
    currencySymbol: '$',
    timezoneStrategy: 'JURISDICTION',
    defaultTimezone: 'America/New_York',
    administrativeModel: 'USA',
    identityProvider: 'PHONE_VERIFICATION',
    gisStatus: 'PRODUCTION_READY',
    gisProvider: 'USGS & US Census TIGER/Line Administrative Boundaries',
    status: 'ACTIVE',
    defaultSlaHours: 48,
    emergencySlaHours: 12,
    addressFormatSchema: ['street', 'city', 'county', 'state', 'zipCode'],
    emergencyCategories: ['Gas Leak', 'Fallen Power Line', 'Water Main Break', 'Bridge Collapse Hazard'],
    boundingBox: {
      minLat: 24.5,
      maxLat: 49.5,
      minLng: -125.0,
      maxLng: -66.9
    }
  },
  {
    countryId: 'GB',
    iso2: 'GB',
    iso3: 'GBR',
    name: 'United Kingdom',
    officialName: 'United Kingdom of Great Britain and Northern Ireland',
    defaultLanguage: 'en-GB',
    supportedLanguages: ['en-GB'],
    phoneCode: '+44',
    phoneFormatPattern: '^\\d{10}$',
    currencyCode: 'GBP',
    currencySymbol: '£',
    timezoneStrategy: 'JURISDICTION',
    defaultTimezone: 'Europe/London',
    administrativeModel: 'UK',
    identityProvider: 'EMAIL_VERIFICATION',
    gisStatus: 'PRODUCTION_READY',
    gisProvider: 'Ordnance Survey Boundary-Line National Geographic Database',
    status: 'ACTIVE',
    defaultSlaHours: 48,
    emergencySlaHours: 12,
    addressFormatSchema: ['street', 'locality', 'borough', 'region', 'postcode'],
    emergencyCategories: ['Dangerous Pavement Collapse', 'Sinkhole', 'High Voltage Hazard', 'Sewage Inundation'],
    boundingBox: {
      minLat: 49.8,
      maxLat: 60.9,
      minLng: -8.6,
      maxLng: 1.8
    }
  }
];

/**
 * Generic Administrative Hierarchy Level Definitions (Sections 4 & 5)
 * Dynamic metadata driving all UI labels without hardcoding State/District/Ward.
 */
export const COUNTRY_ADMIN_LEVELS: Record<string, AdministrativeLevelDefinition[]> = {
  IN: [
    {
      countryId: 'IN',
      levelCode: 'STATE',
      levelOrder: 1,
      displayName: 'State',
      pluralName: 'States',
      parentLevel: 'COUNTRY',
      isLeafJurisdiction: false,
      description: 'First-order federated administrative state or union territory'
    },
    {
      countryId: 'IN',
      levelCode: 'DISTRICT',
      levelOrder: 2,
      displayName: 'District',
      pluralName: 'Districts',
      parentLevel: 'STATE',
      isLeafJurisdiction: false,
      description: 'District collectorate governance boundary'
    },
    {
      countryId: 'IN',
      levelCode: 'LOCAL_BODY',
      levelOrder: 3,
      displayName: 'Municipal Corporation / Local Body',
      pluralName: 'Local Bodies',
      parentLevel: 'DISTRICT',
      isLeafJurisdiction: false,
      description: 'Urban Local Body (Corporation / Municipality / Town Panchayat)'
    },
    {
      countryId: 'IN',
      levelCode: 'WARD',
      levelOrder: 4,
      displayName: 'Ward',
      pluralName: 'Wards',
      parentLevel: 'LOCAL_BODY',
      isLeafJurisdiction: true,
      description: 'Gazetted electoral and public works operational ward unit'
    }
  ],
  US: [
    {
      countryId: 'US',
      levelCode: 'STATE',
      levelOrder: 1,
      displayName: 'State',
      pluralName: 'States',
      parentLevel: 'COUNTRY',
      isLeafJurisdiction: false,
      description: 'Federal State boundary'
    },
    {
      countryId: 'US',
      levelCode: 'COUNTY',
      levelOrder: 2,
      displayName: 'County',
      pluralName: 'Counties',
      parentLevel: 'STATE',
      isLeafJurisdiction: false,
      description: 'County government jurisdiction'
    },
    {
      countryId: 'US',
      levelCode: 'MUNICIPALITY',
      levelOrder: 3,
      displayName: 'City / Municipality',
      pluralName: 'Cities & Townships',
      parentLevel: 'COUNTY',
      isLeafJurisdiction: false,
      description: 'Incorporated city or municipal authority'
    },
    {
      countryId: 'US',
      levelCode: 'COUNCIL_DISTRICT',
      levelOrder: 4,
      displayName: 'Council District',
      pluralName: 'Council Districts',
      parentLevel: 'MUNICIPALITY',
      isLeafJurisdiction: true,
      description: 'Municipal district division for public works and inspection beats'
    }
  ],
  GB: [
    {
      countryId: 'GB',
      levelCode: 'NATION',
      levelOrder: 1,
      displayName: 'Home Nation',
      pluralName: 'Nations',
      parentLevel: 'COUNTRY',
      isLeafJurisdiction: false,
      description: 'Constituent country (England, Scotland, Wales, Northern Ireland)'
    },
    {
      countryId: 'GB',
      levelCode: 'REGION',
      levelOrder: 2,
      displayName: 'County / Region',
      pluralName: 'Counties & Regions',
      parentLevel: 'NATION',
      isLeafJurisdiction: false,
      description: 'Ceremonial or administrative regional authority'
    },
    {
      countryId: 'GB',
      levelCode: 'LOCAL_AUTHORITY',
      levelOrder: 3,
      displayName: 'Borough / Council',
      pluralName: 'Councils',
      parentLevel: 'REGION',
      isLeafJurisdiction: false,
      description: 'London Borough or Unitary Council jurisdiction'
    },
    {
      countryId: 'GB',
      levelCode: 'WARD',
      levelOrder: 4,
      displayName: 'Electoral Ward',
      pluralName: 'Wards',
      parentLevel: 'LOCAL_AUTHORITY',
      isLeafJurisdiction: true,
      description: 'Local authority electoral ward and highway inspection area'
    }
  ]
};

/**
 * Country-Wise Departments (Section 15)
 */
export const COUNTRY_DEPARTMENTS: Record<string, Department[]> = {
  IN: [
    {
      departmentId: 'DEPT-IN-ROADS',
      name: 'Roads, Bridges & Infrastructure',
      code: 'ROADS',
      organizationId: 'ORG-CCMC',
      organizationName: 'Coimbatore City Municipal Corporation',
      headName: 'Er. S. Karunakaran (City Engineer)',
      contactEmail: 'engineering@ccmc.gov.in',
      contactPhone: '+91 422 2302323',
      categoriesHandled: ['Potholes', 'Asphalt Rupture', 'Footpath Repairs', 'Median Maintenance'],
      activeOfficersCount: 14,
      openCasesCount: 22,
      resolvedCasesCount: 184,
      slaComplianceRate: 94.2
    },
    {
      departmentId: 'DEPT-IN-WATER',
      name: 'Water Supply & Underground Drainage',
      code: 'WATER',
      organizationId: 'ORG-CCMC',
      organizationName: 'Coimbatore City Municipal Corporation',
      headName: 'Er. M. Soundararajan (Executive Engineer Water)',
      contactEmail: 'watersupply@ccmc.gov.in',
      contactPhone: '+91 422 2302324',
      categoriesHandled: ['Pipe Burst', 'Sewage Overflow', 'Low Pressure', 'Contaminated Supply'],
      activeOfficersCount: 11,
      openCasesCount: 15,
      resolvedCasesCount: 142,
      slaComplianceRate: 91.8
    },
    {
      departmentId: 'DEPT-IN-SANITATION',
      name: 'Solid Waste Management & Sanitation',
      code: 'SANITATION',
      organizationId: 'ORG-CCMC',
      organizationName: 'Coimbatore City Municipal Corporation',
      headName: 'Dr. K. Arulraj (City Health Officer)',
      contactEmail: 'health@ccmc.gov.in',
      contactPhone: '+91 422 2302325',
      categoriesHandled: ['Garbage Dumps', 'Bio-Waste', 'Debris Clearance', 'Public Urinal Cleanliness'],
      activeOfficersCount: 20,
      openCasesCount: 31,
      resolvedCasesCount: 310,
      slaComplianceRate: 96.5
    },
    {
      departmentId: 'DEPT-IN-ELECTRICITY',
      name: 'Street Lighting & Electrical Infrastructure',
      code: 'LIGHTING',
      organizationId: 'ORG-CCMC',
      organizationName: 'Coimbatore City Municipal Corporation',
      headName: 'Er. V. Balasubramanian (AEE Electrical)',
      contactEmail: 'lighting@ccmc.gov.in',
      contactPhone: '+91 422 2302326',
      categoriesHandled: ['Dark Spots', 'Broken Luminaires', 'Hanging Wires', 'Timer Malfunctions'],
      activeOfficersCount: 8,
      openCasesCount: 9,
      resolvedCasesCount: 215,
      slaComplianceRate: 98.1
    }
  ],
  US: [
    {
      departmentId: 'DEPT-US-DPW',
      name: 'Department of Public Works',
      code: 'DPW',
      organizationId: 'ORG-CSJ',
      organizationName: 'City of San Jose Public Administration',
      headName: 'Robert Vance, P.E. (Director of Public Works)',
      contactEmail: 'publicworks@sanjoseca.gov',
      contactPhone: '+1 408 535 3500',
      categoriesHandled: ['Road Potholes', 'Sidewalk Uplift', 'Storm Drains', 'Traffic Signage'],
      activeOfficersCount: 18,
      openCasesCount: 19,
      resolvedCasesCount: 240,
      slaComplianceRate: 96.8
    },
    {
      departmentId: 'DEPT-US-DOT',
      name: 'Department of Transportation',
      code: 'DOT',
      organizationId: 'ORG-CSJ',
      organizationName: 'City of San Jose Public Administration',
      headName: 'Maria Rodriguez (Transportation Superintendent)',
      contactEmail: 'transportation@sanjoseca.gov',
      contactPhone: '+1 408 535 3850',
      categoriesHandled: ['Traffic Signals', 'Bike Lane Obstructions', 'Pavement Markings', 'Street Lighting'],
      activeOfficersCount: 12,
      openCasesCount: 14,
      resolvedCasesCount: 195,
      slaComplianceRate: 95.2
    },
    {
      departmentId: 'DEPT-US-ENV',
      name: 'Environmental Services & Resource Recovery',
      code: 'ENV_SERVICES',
      organizationId: 'ORG-CSJ',
      organizationName: 'City of San Jose Public Administration',
      headName: 'David Chen (Chief Environmental Officer)',
      contactEmail: 'environmental@sanjoseca.gov',
      contactPhone: '+1 408 535 8550',
      categoriesHandled: ['Illegal Dumping', 'Trash Overflow', 'Recycling Hazmat', 'Graffiti Abatement'],
      activeOfficersCount: 15,
      openCasesCount: 21,
      resolvedCasesCount: 320,
      slaComplianceRate: 97.4
    }
  ],
  GB: [
    {
      departmentId: 'DEPT-GB-HIGHWAYS',
      name: 'Highways & Infrastructure Network',
      code: 'HIGHWAYS',
      organizationId: 'ORG-CAMDEN',
      organizationName: 'Camden London Borough Council',
      headName: 'Alastair Campbell (Head of Highways)',
      contactEmail: 'highways@camden.gov.uk',
      contactPhone: '+44 20 7974 4444',
      categoriesHandled: ['Carriageway Potholes', 'Pavement Subsidence', 'Street Lighting', 'Bollard Repairs'],
      activeOfficersCount: 10,
      openCasesCount: 12,
      resolvedCasesCount: 165,
      slaComplianceRate: 96.2
    },
    {
      departmentId: 'DEPT-GB-WASTE',
      name: 'Waste Management & Street Cleansing',
      code: 'CLEANSING',
      organizationId: 'ORG-CAMDEN',
      organizationName: 'Camden London Borough Council',
      headName: 'Fiona MacTaggart (Environmental Services Lead)',
      contactEmail: 'streetcleansing@camden.gov.uk',
      contactPhone: '+44 20 7974 6901',
      categoriesHandled: ['Fly-Tipping', 'Litter Bins', 'Commercial Waste Encroachment', 'Leaf Fall Hazards'],
      activeOfficersCount: 16,
      openCasesCount: 18,
      resolvedCasesCount: 280,
      slaComplianceRate: 98.4
    }
  ]
};

/**
 * Country-Wise Government Officials (Sections 17 - 19)
 */
export const COUNTRY_OFFICIALS: Record<string, GovernmentOfficial[]> = {
  IN: [
    {
      officialId: 'OFF-IN-012-ROADS',
      firebaseUid: 'gov-uid-in-012-roads',
      employeeId: 'CCMC-ENG-2018-042',
      name: 'Er. Anandhan Krishnan',
      officialEmail: 'anandhan.k@ccmc.gov.in',
      phone: '+91 94421 00121',
      designation: 'Assistant Engineer (Roads & Infrastructure)',
      role: 'government_official',
      organizationId: 'ORG-CCMC',
      departmentId: 'DEPT-IN-ROADS',
      departmentName: 'Roads, Bridges & Infrastructure',
      supervisorId: 'SUP-IN-EAST-ZONE',
      jurisdiction: {
        stateId: 'TN',
        districtId: 'CBE',
        localBodyId: 'CCMC',
        wardNumbers: ['12', '13', '14']
      },
      specializations: ['Asphalt Resurfacing', 'Pothole Patching', 'Storm Water Culverts'],
      employmentStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      availability: 'AVAILABLE',
      currentActiveCases: 3,
      maxActiveCases: 15,
      slaAdherenceScore: 97
    },
    {
      officialId: 'OFF-IN-012-WATER',
      firebaseUid: 'gov-uid-in-012-water',
      employeeId: 'CCMC-ENG-2019-118',
      name: 'Er. Priya Rathinam',
      officialEmail: 'priya.r@ccmc.gov.in',
      phone: '+91 94421 00122',
      designation: 'Assistant Engineer (Water Supply & Drainage)',
      role: 'government_official',
      organizationId: 'ORG-CCMC',
      departmentId: 'DEPT-IN-WATER',
      departmentName: 'Water Supply & Underground Drainage',
      supervisorId: 'SUP-IN-EAST-ZONE',
      jurisdiction: {
        stateId: 'TN',
        districtId: 'CBE',
        localBodyId: 'CCMC',
        wardNumbers: ['12', '23', '24']
      },
      specializations: ['Underground Drainage', 'Pumping Main Leaks', 'Manhole Maintenance'],
      employmentStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      availability: 'AVAILABLE',
      currentActiveCases: 2,
      maxActiveCases: 12,
      slaAdherenceScore: 94
    },
    {
      officialId: 'SUP-IN-EAST-ZONE',
      firebaseUid: 'gov-uid-in-sup-east',
      employeeId: 'CCMC-ENG-2012-005',
      name: 'Er. V. Balasubramanian',
      officialEmail: 'balasubramanian.v@ccmc.gov.in',
      phone: '+91 94421 00099',
      designation: 'Assistant Executive Engineer (East Zone Supervisor)',
      role: 'supervisor',
      organizationId: 'ORG-CCMC',
      departmentId: 'DEPT-IN-ROADS',
      departmentName: 'Roads, Bridges & Infrastructure',
      supervisorId: 'DIR-IN-ENG',
      jurisdiction: {
        stateId: 'TN',
        districtId: 'CBE',
        localBodyId: 'CCMC',
        wardNumbers: ['12', '13', '14', '23', '24', '25']
      },
      specializations: ['Zonal Work Allocation', 'Contractor SLA Verification', 'Emergency Operations'],
      employmentStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      availability: 'AVAILABLE',
      currentActiveCases: 5,
      maxActiveCases: 30,
      slaAdherenceScore: 99
    }
  ],
  US: [
    {
      officialId: 'OFF-US-SJ-03-DPW',
      firebaseUid: 'gov-uid-us-sj-03',
      employeeId: 'CSJ-PW-2021-089',
      name: 'James C. Miller, P.E.',
      officialEmail: 'james.miller@sanjoseca.gov',
      phone: '+1 408 555 0192',
      designation: 'Senior Civil Works Inspector',
      role: 'government_official',
      organizationId: 'ORG-CSJ',
      departmentId: 'DEPT-US-DPW',
      departmentName: 'Department of Public Works',
      supervisorId: 'SUP-US-D3',
      jurisdiction: {
        stateId: 'CA',
        districtId: 'SCL',
        localBodyId: 'SAN_JOSE',
        wardNumbers: ['03', '04']
      },
      specializations: ['Asphalt Cold-Milling', 'ADA Ramp Compliance', 'Drainage Basin Clearing'],
      employmentStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      availability: 'AVAILABLE',
      currentActiveCases: 2,
      maxActiveCases: 20,
      slaAdherenceScore: 98
    },
    {
      officialId: 'SUP-US-D3',
      firebaseUid: 'gov-uid-us-sup-d3',
      employeeId: 'CSJ-PW-2015-012',
      name: 'Sarah Jenkins',
      officialEmail: 'sarah.jenkins@sanjoseca.gov',
      phone: '+1 408 555 0110',
      designation: 'District 3 Operations Supervisor',
      role: 'supervisor',
      organizationId: 'ORG-CSJ',
      departmentId: 'DEPT-US-DPW',
      departmentName: 'Department of Public Works',
      supervisorId: 'DIR-US-CSJ',
      jurisdiction: {
        stateId: 'CA',
        districtId: 'SCL',
        localBodyId: 'SAN_JOSE',
        wardNumbers: ['03', '04', '05']
      },
      specializations: ['Zonal Work Dispatch', 'SLA Exception Tracking', 'Contractor Verification'],
      employmentStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      availability: 'AVAILABLE',
      currentActiveCases: 4,
      maxActiveCases: 35,
      slaAdherenceScore: 99
    }
  ],
  GB: [
    {
      officialId: 'OFF-GB-CAM-01-HIGHWAYS',
      firebaseUid: 'gov-uid-gb-cam-01',
      employeeId: 'CLBC-HW-2020-044',
      name: 'Arthur Pendelton',
      officialEmail: 'arthur.pendelton@camden.gov.uk',
      phone: '+44 20 7974 8812',
      designation: 'Highways Network Inspector',
      role: 'government_official',
      organizationId: 'ORG-CAMDEN',
      departmentId: 'DEPT-GB-HIGHWAYS',
      departmentName: 'Highways & Infrastructure Network',
      supervisorId: 'SUP-GB-BLOOMSBURY',
      jurisdiction: {
        stateId: 'ENG',
        districtId: 'GL',
        localBodyId: 'CAMDEN',
        wardNumbers: ['W01', 'W02']
      },
      specializations: ['Pavement Resurfacing', 'TfL Red Route Coordination', 'Cyclist Safety Berms'],
      employmentStatus: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      availability: 'AVAILABLE',
      currentActiveCases: 1,
      maxActiveCases: 15,
      slaAdherenceScore: 96
    }
  ]
};

/**
 * Country-Wise SLA Policies (Section 33)
 */
export const COUNTRY_SLA_POLICIES: Record<string, SlaPolicy[]> = {
  IN: [
    {
      countryId: 'IN',
      jurisdictionType: 'MUNICIPAL_CORPORATION',
      departmentId: 'DEPT-IN-ROADS',
      initialResponseHours: 24,
      resolutionHours: 72,
      escalationLevels: ['OFFICER', 'SUPERVISOR', 'DEPARTMENT_HEAD', 'DISTRICT_AUTHORITY']
    },
    {
      countryId: 'IN',
      jurisdictionType: 'MUNICIPAL_CORPORATION',
      departmentId: 'DEPT-IN-SANITATION',
      initialResponseHours: 12,
      resolutionHours: 48,
      escalationLevels: ['OFFICER', 'SUPERVISOR', 'DEPARTMENT_HEAD']
    }
  ],
  US: [
    {
      countryId: 'US',
      jurisdictionType: 'MUNICIPALITY',
      departmentId: 'DEPT-US-DPW',
      initialResponseHours: 12,
      resolutionHours: 48,
      escalationLevels: ['OFFICER', 'SUPERVISOR', 'DEPARTMENT_HEAD']
    }
  ],
  GB: [
    {
      countryId: 'GB',
      jurisdictionType: 'LOCAL_AUTHORITY',
      departmentId: 'DEPT-GB-HIGHWAYS',
      initialResponseHours: 12,
      resolutionHours: 48,
      escalationLevels: ['OFFICER', 'SUPERVISOR', 'DEPARTMENT_HEAD']
    }
  ]
};

/**
 * Country GIS Datasets Registry (Section 9)
 */
export const COUNTRY_GIS_DATASETS: Record<string, GisDataset[]> = {
  IN: [
    {
      datasetId: 'DATASET-IN-TN-CBE-CCMC-2024',
      countryId: 'IN',
      provider: 'Survey of India / Tamil Nadu Gazette',
      organization: 'Coimbatore City Municipal Corporation Town Planning Directorate',
      sourceUrl: 'https://ccmc.gov.in/gis/ward-boundaries-2024.geojson',
      sourceType: 'OFFICIAL_GIS_GAZETTE',
      administrativeLevels: ['STATE', 'DISTRICT', 'LOCAL_BODY', 'WARD'],
      version: 'v2.1-gazette',
      license: 'Government Open Data License - India (GODL)',
      retrievedAt: '2024-03-15T10:00:00Z',
      effectiveFrom: '2024-01-01',
      status: 'PUBLISHED'
    }
  ],
  US: [
    {
      datasetId: 'DATASET-US-CA-SCL-CSJ-2024',
      countryId: 'US',
      provider: 'US Census Bureau TIGER/Line & City of San Jose Open GIS',
      organization: 'City of San Jose Information Technology & Planning',
      sourceUrl: 'https://data.sanjoseca.gov/dataset/council-districts.geojson',
      sourceType: 'OFFICIAL_GIS_FEDERAL_CITY',
      administrativeLevels: ['STATE', 'COUNTY', 'MUNICIPALITY', 'COUNCIL_DISTRICT'],
      version: 'v1.4-tiger',
      license: 'Public Domain / CC0',
      retrievedAt: '2024-02-10T12:00:00Z',
      effectiveFrom: '2024-01-01',
      status: 'PUBLISHED'
    }
  ],
  GB: [
    {
      datasetId: 'DATASET-GB-ENG-GL-CAM-2024',
      countryId: 'GB',
      provider: 'Ordnance Survey Boundary-Line',
      organization: 'Camden London Borough Council Spatial Systems',
      sourceUrl: 'https://opendata.camden.gov.uk/dataset/electoral-wards.geojson',
      sourceType: 'OFFICIAL_GIS_ORDNANCE_SURVEY',
      administrativeLevels: ['NATION', 'REGION', 'LOCAL_AUTHORITY', 'WARD'],
      version: 'v3.0-os',
      license: 'Open Government Licence v3.0',
      retrievedAt: '2024-01-20T09:00:00Z',
      effectiveFrom: '2024-01-01',
      status: 'PUBLISHED'
    }
  ]
};

/**
 * Country GIS Jurisdiction Coverage (Section 12)
 */
export const COUNTRY_COVERAGES: Record<string, GISCoverageReport[]> = {
  IN: [
    {
      stateId: 'TN',
      stateName: 'Tamil Nadu',
      districtId: 'CHE',
      districtName: 'Chennai',
      localBodyId: 'GCC',
      localBodyName: 'Greater Chennai Corporation',
      expectedWards: 200,
      loadedWards: 200,
      validatedWards: 200,
      publishedWards: 200,
      coveragePercentage: 100,
      status: 'COMPLETE',
      lastCheckedAt: '2024-04-10T08:00:00Z'
    },
    {
      stateId: 'KA',
      stateName: 'Karnataka',
      districtId: 'BLR',
      districtName: 'Bengaluru Urban',
      localBodyId: 'BBMP',
      localBodyName: 'Bruhat Bengaluru Mahanagara Palike',
      expectedWards: 243,
      loadedWards: 243,
      validatedWards: 243,
      publishedWards: 243,
      coveragePercentage: 100,
      status: 'COMPLETE',
      lastCheckedAt: '2024-04-10T08:00:00Z'
    },
    {
      stateId: 'MH',
      stateName: 'Maharashtra',
      districtId: 'MUM',
      districtName: 'Mumbai Suburban',
      localBodyId: 'BMC',
      localBodyName: 'Brihanmumbai Municipal Corporation',
      expectedWards: 227,
      loadedWards: 227,
      validatedWards: 227,
      publishedWards: 227,
      coveragePercentage: 100,
      status: 'COMPLETE',
      lastCheckedAt: '2024-04-10T08:00:00Z'
    },
    {
      stateId: 'DL',
      stateName: 'Delhi',
      districtId: 'DEL',
      districtName: 'Delhi Central',
      localBodyId: 'MCD',
      localBodyName: 'Municipal Corporation of Delhi',
      expectedWards: 250,
      loadedWards: 250,
      validatedWards: 250,
      publishedWards: 250,
      coveragePercentage: 100,
      status: 'COMPLETE',
      lastCheckedAt: '2024-04-10T08:00:00Z'
    },
    {
      stateId: 'TG',
      stateName: 'Telangana',
      districtId: 'HYD',
      districtName: 'Hyderabad',
      localBodyId: 'GHMC',
      localBodyName: 'Greater Hyderabad Municipal Corporation',
      expectedWards: 150,
      loadedWards: 150,
      validatedWards: 150,
      publishedWards: 150,
      coveragePercentage: 100,
      status: 'COMPLETE',
      lastCheckedAt: '2024-04-10T08:00:00Z'
    },
    {
      stateId: 'TN',
      stateName: 'Tamil Nadu',
      districtId: 'CBE',
      districtName: 'Coimbatore',
      localBodyId: 'CCMC',
      localBodyName: 'Coimbatore City Municipal Corporation',
      expectedWards: 100,
      loadedWards: 100,
      validatedWards: 100,
      publishedWards: 100,
      coveragePercentage: 100,
      status: 'COMPLETE',
      lastCheckedAt: '2024-04-10T08:00:00Z'
    },
    {
      stateId: 'WB',
      stateName: 'West Bengal',
      districtId: 'KOL',
      districtName: 'Kolkata',
      localBodyId: 'KMC',
      localBodyName: 'Kolkata Municipal Corporation',
      expectedWards: 144,
      loadedWards: 144,
      validatedWards: 144,
      publishedWards: 144,
      coveragePercentage: 100,
      status: 'COMPLETE',
      lastCheckedAt: '2024-04-10T08:00:00Z'
    },
    {
      stateId: 'GJ',
      stateName: 'Gujarat',
      districtId: 'AHM',
      districtName: 'Ahmedabad',
      localBodyId: 'AMC',
      localBodyName: 'Amdavad Municipal Corporation',
      expectedWards: 192,
      loadedWards: 192,
      validatedWards: 192,
      publishedWards: 192,
      coveragePercentage: 100,
      status: 'COMPLETE',
      lastCheckedAt: '2024-04-10T08:00:00Z'
    },
    {
      stateId: 'MH',
      stateName: 'Maharashtra',
      districtId: 'PUN',
      districtName: 'Pune',
      localBodyId: 'PMC',
      localBodyName: 'Pune Municipal Corporation',
      expectedWards: 173,
      loadedWards: 173,
      validatedWards: 173,
      publishedWards: 173,
      coveragePercentage: 100,
      status: 'COMPLETE',
      lastCheckedAt: '2024-04-10T08:00:00Z'
    },
    {
      stateId: 'UP',
      stateName: 'Uttar Pradesh',
      districtId: 'LKO',
      districtName: 'Lucknow',
      localBodyId: 'LMC',
      localBodyName: 'Lucknow Municipal Corporation',
      expectedWards: 110,
      loadedWards: 110,
      validatedWards: 110,
      publishedWards: 110,
      coveragePercentage: 100,
      status: 'COMPLETE',
      lastCheckedAt: '2024-04-10T08:00:00Z'
    },
    {
      stateId: 'KL',
      stateName: 'Kerala',
      districtId: 'TVM',
      districtName: 'Thiruvananthapuram',
      localBodyId: 'TMC-KERALA',
      localBodyName: 'Thiruvananthapuram Municipal Corporation',
      expectedWards: 100,
      loadedWards: 100,
      validatedWards: 100,
      publishedWards: 100,
      coveragePercentage: 100,
      status: 'COMPLETE',
      lastCheckedAt: '2024-04-10T08:00:00Z'
    },
    {
      stateId: 'MP',
      stateName: 'Madhya Pradesh',
      districtId: 'IND',
      districtName: 'Indore',
      localBodyId: 'IMC-INDORE',
      localBodyName: 'Indore Municipal Corporation',
      expectedWards: 85,
      loadedWards: 85,
      validatedWards: 85,
      publishedWards: 85,
      coveragePercentage: 100,
      status: 'COMPLETE',
      lastCheckedAt: '2024-04-10T08:00:00Z'
    },
    {
      stateId: 'OD',
      stateName: 'Odisha',
      districtId: 'KHI',
      districtName: 'Khordha',
      localBodyId: 'BMC-ODISHA',
      localBodyName: 'Bhubaneswar Municipal Corporation',
      expectedWards: 67,
      loadedWards: 67,
      validatedWards: 67,
      publishedWards: 67,
      coveragePercentage: 100,
      status: 'COMPLETE',
      lastCheckedAt: '2024-04-10T08:00:00Z'
    },
    {
      stateId: 'BR',
      stateName: 'Bihar',
      districtId: 'PAT',
      districtName: 'Patna',
      localBodyId: 'PMC-PATNA',
      localBodyName: 'Patna Municipal Corporation',
      expectedWards: 75,
      loadedWards: 75,
      validatedWards: 75,
      publishedWards: 75,
      coveragePercentage: 100,
      status: 'COMPLETE',
      lastCheckedAt: '2024-04-10T08:00:00Z'
    },
    {
      stateId: 'AS',
      stateName: 'Assam',
      districtId: 'KAM',
      districtName: 'Kamrup Metropolitan',
      localBodyId: 'GMC-GUWAHATI',
      localBodyName: 'Guwahati Municipal Corporation',
      expectedWards: 60,
      loadedWards: 60,
      validatedWards: 60,
      publishedWards: 60,
      coveragePercentage: 100,
      status: 'COMPLETE',
      lastCheckedAt: '2024-04-10T08:00:00Z'
    },
    {
      stateId: 'CH',
      stateName: 'Chandigarh',
      districtId: 'CHD',
      districtName: 'Chandigarh',
      localBodyId: 'MCC-CHANDIGARH',
      localBodyName: 'Municipal Corporation Chandigarh',
      expectedWards: 35,
      loadedWards: 35,
      validatedWards: 35,
      publishedWards: 35,
      coveragePercentage: 100,
      status: 'COMPLETE',
      lastCheckedAt: '2024-04-10T08:00:00Z'
    }
  ],
  US: [
    {
      stateId: 'CA',
      stateName: 'California',
      districtId: 'SCL',
      districtName: 'Santa Clara County',
      localBodyId: 'SAN_JOSE',
      localBodyName: 'City of San Jose',
      expectedWards: 10,
      loadedWards: 10,
      validatedWards: 10,
      publishedWards: 10,
      coveragePercentage: 100,
      status: 'COMPLETE',
      lastCheckedAt: '2024-04-08T10:00:00Z'
    }
  ],
  GB: [
    {
      stateId: 'ENG',
      stateName: 'England',
      districtId: 'GL',
      districtName: 'Greater London',
      localBodyId: 'CAMDEN',
      localBodyName: 'London Borough of Camden',
      expectedWards: 18,
      loadedWards: 18,
      validatedWards: 18,
      publishedWards: 18,
      coveragePercentage: 100,
      status: 'COMPLETE',
      lastCheckedAt: '2024-04-07T11:00:00Z'
    }
  ]
};

// ===============================================================
// HELPER METHODS (CountryContextService - Section 56)
// ===============================================================

export function getCountryConfig(countryId: string): CountryConfig {
  const found = SUPPORTED_COUNTRIES.find(c => c.countryId === countryId);
  return found || SUPPORTED_COUNTRIES[0];
}

export function getAdministrativeLevels(countryId: string): AdministrativeLevelDefinition[] {
  return COUNTRY_ADMIN_LEVELS[countryId] || COUNTRY_ADMIN_LEVELS['IN'];
}

export function getCountryFromCoordinates(latitude: number, longitude: number): string | null {
  for (const country of SUPPORTED_COUNTRIES) {
    if (country.boundingBox) {
      const { minLat, maxLat, minLng, maxLng } = country.boundingBox;
      if (latitude >= minLat && latitude <= maxLat && longitude >= minLng && longitude <= maxLng) {
        return country.countryId;
      }
    }
  }
  return null;
}

export function formatGlobalComplaintId(countryId: string, sequence: number, year: number = new Date().getFullYear()): string {
  const seqStr = String(sequence).padStart(6, '0');
  return `CIV-${countryId.toUpperCase()}-${year}-${seqStr}`;
}

export function getCountryCurrencySymbol(countryId: string): string {
  const config = getCountryConfig(countryId);
  return config.currencySymbol;
}

export function getCountryPhoneCode(countryId: string): string {
  const config = getCountryConfig(countryId);
  return config.phoneCode;
}
