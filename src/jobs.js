const JOBS_KEY='moralesRoofScanJobs';let currentJobFilter='All';function getLocalJobs(){try{return JSON.parse(localStorage.getItem(JOBS_KEY))||[]}catch{return[]}}function setLocalJobs(jobs){localStorage.setItem(JOBS_KEY,JSON.stringify(jobs))}async function saveJob(){const job=collectCurrentJob();const jobs=getLocalJobs();jobs.unshift(job);setLocalJobs(jobs);showMessage('Job saved locally.');renderJobs()}function deleteJob(id){setLocalJobs(getLocalJobs().filter(job=>job.id!==id));renderJobs();showMessage('Job deleted.')}function updateJobStatus(id,status){const jobs=getLocalJobs().map(job=>job.id===id?{...job,status,updatedAt:new Date().toISOString()}:job);setLocalJobs(jobs);renderJobs();showMessage(`Job moved to ${status}.`)}function downloadJob(id){const job=getLocalJobs().find(job=>job.id===id);if(!job)return;const blob=new Blob([JSON.stringify(job,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`morales-roofscan-job-${job.id}.json`;a.click();URL.revokeObjectURL(url)}function getJobSearchQuery(){return(document.getElementById('jobSearchInput')?.value||'').trim().toLowerCase()}function getJobSortMode(){return document.getElementById('jobSortSelect')?.value||'newest'}function jobMatchesSearch(job,query){if(!query)return true;const haystack=[job.customerName,job.customerPhone,job.address,job.status,job.notes,job.estimate?.total,job.estimate?.roofingSquares].filter(Boolean).join(' ').toLowerCase();return haystack.includes(query)}function sortJobsForDisplay(jobs){const mode=getJobSortMode();const copy=[...jobs];if(mode==='oldest')return copy.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));if(mode==='highest')return copy.sort((a,b)=>(b.estimate?.total||0)-(a.estimate?.total||0));if(mode==='lowest')return copy.sort((a,b)=>(a.estimate?.total||0)-(b.estimate?.total||0));if(mode==='customer')return copy.sort((a,b)=>(a.customerName||'').localeCompare(b.customerName||''));return copy.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))}function getFilteredJobs(){const query=getJobSearchQuery();let jobs=getLocalJobs();if(currentJobFilter!=='All')jobs=jobs.filter(job=>job.status===currentJobFilter);jobs=jobs.filter(job=>jobMatchesSearch(job,query));return sortJobsForDisplay(jobs)}function renderPipelineSummary(){const el=document.getElementById('pipelineSummary');if(!el)return;const jobs=getLocalJobs();const statuses=['Lead','Measured','Quoted','Approved','Completed'];el.innerHTML=statuses.map(status=>{const count=jobs.filter(job=>job.status===status).length;return`<div><span>${status}</span><strong>${count}</strong></div>`}).join('')}function renderFilterButtons(){document.querySelectorAll('.filter-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.status===currentJobFilter))}function renderJobs(){const grid=document.getElementById('jobsGrid');const jobs=getFilteredJobs();const allJobs=getLocalJobs();setText('heroJobCount',`${allJobs.length} Saved`);renderPipelineSummary();renderFilterButtons();if(!grid)return;if(!jobs.length){grid.innerHTML=`<div class="empty-state">No matching ${currentJobFilter==='All'?'saved':currentJobFilter} jobs found.</div>`;return}grid.innerHTML=jobs.map(job=>`<article class="job-card"><div><small>${new Date(job.createdAt).toLocaleString()}</small><h3>${job.customerName||'Unnamed Customer'}</h3><p>${job.address||'No address added'}</p><p>Status: <strong>${job.status}</strong></p><p>Total: <strong>${formatCurrency(job.estimate.total)}</strong></p><p>Squares: <strong>${job.estimate.roofingSquares}</strong></p><p>Profit: <strong>${formatCurrency(job.estimate.projectProfit||0)}</strong></p></div><label class="mini-label" for="status-${job.id}">Move Status</label><select id="status-${job.id}" onchange="updateJobStatus('${job.id}', this.value)">${['Lead','Measured','Quoted','Approved','Completed'].map(status=>`<option value="${status}" ${job.status===status?'selected':''}>${status}</option>`).join('')}</select><div class="job-actions"><button onclick="downloadJob('${job.id}')">Download</button><button onclick="deleteJob('${job.id}')">Delete</button></div></article>`).join('')}function clearJobs(){if(confirm('Clear all locally saved jobs?')){setLocalJobs([]);renderJobs();showMessage('Local jobs cleared.')}}document.addEventListener('DOMContentLoaded',()=>{document.getElementById('saveJobBtn')?.addEventListener('click',saveJob);document.getElementById('mobileSaveBtn')?.addEventListener('click',saveJob);document.getElementById('refreshJobsBtn')?.addEventListener('click',renderJobs);document.getElementById('clearJobsBtn')?.addEventListener('click',clearJobs);
  document.getElementById('cloudPushBtn')?.addEventListener('click',pushLocalJobsToCloud);
  document.getElementById('cloudPullBtn')?.addEventListener('click',pullCloudJobs);document.getElementById('jobSearchInput')?.addEventListener('input',renderJobs);document.getElementById('jobSortSelect')?.addEventListener('change',renderJobs);document.querySelectorAll('.filter-btn').forEach(btn=>{btn.addEventListener('click',()=>{currentJobFilter=btn.dataset.status||'All';renderJobs()})});renderJobs()});


/* === FIREBASE CLOUD SYNC PATCH === */
function updateCloudStatus(status, detail){
  setText('cloudSyncStatus', status);
  setText('cloudSyncDetail', detail);
}

window.addEventListener('morales-cloud-status', event => {
  updateCloudStatus(event.detail.status, event.detail.detail);
});

function normalizeCloudJob(job){
  return {
    ...job,
    id: job.id || job.cloudId || String(Date.now()),
    cloudId: job.cloudId || job.id || null,
    estimate: job.estimate || {}
  };
}

function mergeCloudJobsIntoLocal(cloudJobs){
  const localJobs = getLocalJobs();
  const existingKeys = new Set(localJobs.map(job => job.id || job.cloudId || job.createdAt));
  const merged = [...localJobs];

  cloudJobs.map(normalizeCloudJob).forEach(job => {
    const key = job.id || job.cloudId || job.createdAt;
    if(!existingKeys.has(key)){
      merged.unshift(job);
      existingKeys.add(key);
    }
  });

  setLocalJobs(merged);
  renderJobs();
}

async function pushLocalJobsToCloud(){
  if(!window.saveJobToCloud){
    updateCloudStatus('Local Mode','Firebase module not loaded.');
    return;
  }
  const jobs = getLocalJobs();
  if(!jobs.length){
    updateCloudStatus('No Local Jobs','There are no saved jobs to push.');
    return;
  }
  let count = 0;
  for(const job of jobs){
    try{
      await window.saveJobToCloud(job);
      count++;
    }catch(error){
      console.warn('Cloud push failed:', error);
    }
  }
  updateCloudStatus('Cloud Push Complete', `${count} local jobs pushed to Firebase.`);
}

async function pullCloudJobs(){
  if(!window.loadJobsFromCloud){
    updateCloudStatus('Local Mode','Firebase module not loaded.');
    return;
  }
  try{
    const cloudJobs = await window.loadJobsFromCloud();
    mergeCloudJobsIntoLocal(cloudJobs);
    updateCloudStatus('Cloud Pull Complete', `${cloudJobs.length} cloud jobs merged locally.`);
  }catch(error){
    console.warn('Cloud pull failed:', error);
    updateCloudStatus('Cloud Pull Failed', 'Check Firebase config and Firestore permissions.');
  }
}
/* === END FIREBASE CLOUD SYNC PATCH === */
