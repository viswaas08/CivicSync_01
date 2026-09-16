// Provision and seed Firestore database with GIS Wards, Departments, and System Settings
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.resolve(__dirname, '../firebase-applet-config.json');
const firebaseConfig = JSON.parse(readFileSync(configPath, 'utf8'));

console.log(`Connecting to Firebase project: ${firebaseConfig.projectId}...`);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedDatabase() {
  console.log('Seeding GIS Wards, Municipal Departments, and System Rules into Firestore...');

  // 1. Coimbatore Wards Definition
  const wards = [
    {
      wardId: 'IN-TN-CBE-CCMC-W12',
      countryId: 'IN',
      levelCode: 'WARD',
      wardNumber: '12',
      wardName: 'Peelamedu Ward',
      type: 'WARD',
      stateId: 'TN',
      districtId: 'CBE',
      localBodyId: 'CCMC',
      localBodyName: 'Coimbatore City Municipal Corporation',
      localBodyType: 'MUNICIPAL_CORPORATION',
      status: 'PUBLISHED',
      population: 48500,
      areaSqKm: 5.4,
      centroid: { lat: 11.0315, lng: 77.0142 },
      updatedAt: new Date().toISOString()
    },
    {
      wardId: 'IN-TN-CBE-CCMC-W72',
      countryId: 'IN',
      levelCode: 'WARD',
      wardNumber: '72',
      wardName: 'Singanallur Ward',
      type: 'WARD',
      stateId: 'TN',
      districtId: 'CBE',
      localBodyId: 'CCMC',
      localBodyName: 'Coimbatore City Municipal Corporation',
      localBodyType: 'MUNICIPAL_CORPORATION',
      status: 'PUBLISHED',
      population: 52000,
      areaSqKm: 6.8,
      centroid: { lat: 10.9950, lng: 77.0300 },
      updatedAt: new Date().toISOString()
    },
    {
      wardId: 'IN-TN-CBE-CCMC-W23',
      countryId: 'IN',
      levelCode: 'WARD',
      wardNumber: '23',
      wardName: 'RS Puram Ward',
      type: 'WARD',
      stateId: 'TN',
      districtId: 'CBE',
      localBodyId: 'CCMC',
      localBodyName: 'Coimbatore City Municipal Corporation',
      localBodyType: 'MUNICIPAL_CORPORATION',
      status: 'PUBLISHED',
      population: 44000,
      areaSqKm: 4.1,
      centroid: { lat: 11.0080, lng: 76.9500 },
      updatedAt: new Date().toISOString()
    },
    {
      wardId: 'IN-TN-CBE-CCMC-W45',
      countryId: 'IN',
      levelCode: 'WARD',
      wardNumber: '45',
      wardName: 'Gandhipuram Ward',
      type: 'WARD',
      stateId: 'TN',
      districtId: 'CBE',
      localBodyId: 'CCMC',
      localBodyName: 'Coimbatore City Municipal Corporation',
      localBodyType: 'MUNICIPAL_CORPORATION',
      status: 'PUBLISHED',
      population: 49000,
      areaSqKm: 3.9,
      centroid: { lat: 11.0180, lng: 76.9680 },
      updatedAt: new Date().toISOString()
    },
    {
      wardId: 'IN-TN-CBE-CCMC-W88',
      countryId: 'IN',
      levelCode: 'WARD',
      wardNumber: '88',
      wardName: 'Ukkadam Ward',
      type: 'WARD',
      stateId: 'TN',
      districtId: 'CBE',
      localBodyId: 'CCMC',
      localBodyName: 'Coimbatore City Municipal Corporation',
      localBodyType: 'MUNICIPAL_CORPORATION',
      status: 'PUBLISHED',
      population: 56000,
      areaSqKm: 4.8,
      centroid: { lat: 10.9900, lng: 76.9600 },
      updatedAt: new Date().toISOString()
    }
  ];

  for (const ward of wards) {
    await setDoc(doc(db, 'gisWards', ward.wardId), ward, { merge: true });
    console.log(`✓ Seeded Ward: ${ward.wardName} (${ward.wardId})`);
  }

  // 2. Municipal Departments
  const departments = [
    {
      departmentId: 'DEPT-ROADS',
      code: 'ENG_ROADS',
      name: 'Roads, Bridges & Infrastructure',
      slaHours: 48,
      escalationLevels: ['Field Officer', 'Zonal Supervisor', 'Executive Engineer', 'Commissioner'],
      updatedAt: new Date().toISOString()
    },
    {
      departmentId: 'DEPT-SWM',
      code: 'SANITATION_SWM',
      name: 'Solid Waste Management & Sanitation',
      slaHours: 24,
      escalationLevels: ['Sanitary Inspector', 'Zonal Officer', 'Health Officer', 'Commissioner'],
      updatedAt: new Date().toISOString()
    },
    {
      departmentId: 'DEPT-WATER',
      code: 'WATER_UGD',
      name: 'Water Supply & Underground Drainage',
      slaHours: 24,
      escalationLevels: ['Assistant Engineer', 'Executive Engineer', 'TWAD/Board Head', 'Commissioner'],
      updatedAt: new Date().toISOString()
    },
    {
      departmentId: 'DEPT-LIGHTING',
      code: 'ELEC_LIGHTING',
      name: 'Street Lighting & Electrical Infrastructure',
      slaHours: 24,
      escalationLevels: ['Electrical Supervisor', 'Assistant Executive Engineer', 'Commissioner'],
      updatedAt: new Date().toISOString()
    },
    {
      departmentId: 'DEPT-HEALTH',
      code: 'PUBLIC_HEALTH',
      name: 'Public Health, Vector Control & Environment',
      slaHours: 36,
      escalationLevels: ['Health Inspector', 'City Health Officer', 'Commissioner'],
      updatedAt: new Date().toISOString()
    }
  ];

  for (const dept of departments) {
    await setDoc(doc(db, 'departments', dept.departmentId), dept, { merge: true });
    console.log(`✓ Seeded Department: ${dept.name}`);
  }

  // 3. System Configuration
  await setDoc(doc(db, 'systemSettings', 'governanceConfig'), {
    platformName: 'CivicSync',
    country: 'IN',
    model: 'gemini-2.5-flash',
    authoritativeGIS: true,
    gazetteVersion: 'CCMC-2024-V3',
    updatedAt: new Date().toISOString()
  }, { merge: true });

  console.log('✓ Seeded System Governance Configuration');
  console.log('\nAll Firestore storage collections and ward datasets successfully provisioned!');
  process.exit(0);
}

seedDatabase().catch((err) => {
  console.error('Firestore seeding failed:', err);
  process.exit(1);
});
