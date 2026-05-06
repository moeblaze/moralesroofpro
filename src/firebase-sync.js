// Morales Roofing RoofScan Pro - Firebase Cloud Sync Patch
// Optional. Local save still works without Firebase.
// To enable:
// 1. Create Firebase project
// 2. Enable Firestore Database
// 3. Replace firebaseConfig values
// 4. Set FIREBASE_ENABLED = true

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const FIREBASE_ENABLED = false;

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let db = null;

function emitCloudStatus(status, detail){
  window.dispatchEvent(new CustomEvent("morales-cloud-status", {
    detail: { status, detail }
  }));
}

if(FIREBASE_ENABLED){
  try{
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    window.MORALES_FIREBASE_READY = true;
    emitCloudStatus("Cloud Ready", "Firebase connected. Jobs can sync across devices.");
  }catch(error){
    console.error("Firebase init failed:", error);
    window.MORALES_FIREBASE_READY = false;
    emitCloudStatus("Cloud Error", "Firebase failed to initialize. Local save still works.");
  }
}else{
  window.MORALES_FIREBASE_READY = false;
  emitCloudStatus("Local Mode", "Firebase disabled. Local save is active.");
}

window.saveJobToCloud = async function(job){
  if(!db){
    emitCloudStatus("Local Mode", "Firebase not enabled. Job saved locally only.");
    return null;
  }
  const payload = {
    ...job,
    syncedAt: serverTimestamp(),
    source: "Morales Roofing RoofScan Pro"
  };
  const ref = await addDoc(collection(db, "moralesRoofingJobs"), payload);
  emitCloudStatus("Cloud Synced", "Job saved to Firebase.");
  return ref.id;
};

window.loadJobsFromCloud = async function(){
  if(!db){
    emitCloudStatus("Local Mode", "Firebase not enabled. No cloud jobs loaded.");
    return [];
  }
  const snapshot = await getDocs(collection(db, "moralesRoofingJobs"));
  const jobs = snapshot.docs.map(d => ({ cloudId: d.id, ...d.data() }));
  emitCloudStatus("Cloud Loaded", `${jobs.length} cloud jobs loaded.`);
  return jobs;
};

window.deleteJobFromCloud = async function(cloudId){
  if(!db || !cloudId) return;
  await deleteDoc(doc(db, "moralesRoofingJobs", cloudId));
  emitCloudStatus("Cloud Updated", "Cloud job deleted.");
};
