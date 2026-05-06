const RoofScanState={points:[],polygon:null};let companyLogo=null;function formatCurrency(value){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(value)||0)}function getNumberValue(id,fallback=0){const value=parseFloat(document.getElementById(id)?.value);return Number.isFinite(value)?value:fallback}function setText(id,value){const el=document.getElementById(id);if(el)el.textContent=value}function showMessage(message){setText('systemMessage',message)}function getEstimateData(){const baseSqft=parseFloat(document.getElementById('baseSqft')?.textContent)||0;const pitch=getNumberValue('pitchFactor',1);const waste=getNumberValue('wasteFactor',10)/100;const price=getNumberValue('pricePerSquare',450);const labor=getNumberValue('laborPerSquare',150);const adjusted=baseSqft*pitch*(1+waste);const squares=adjusted/100;const materialCost=squares*price;const laborCost=squares*labor;const total=materialCost+laborCost;return{baseSqft,pitch,waste,price,labor,adjusted,squares,materialCost,laborCost,total}}function renderEstimate(){const data=getEstimateData();setText('adjustedSqft',data.adjusted.toFixed(2));setText('roofingSquares',data.squares.toFixed(2));setText('materialCost',formatCurrency(data.materialCost));setText('laborCost',formatCurrency(data.laborCost));setText('estimatedTotal',formatCurrency(data.total));setText('pointCount',RoofScanState.points.length);setText('activeStatus',RoofScanState.points.length>=3?'Measured':'Ready')}function collectCurrentJob(){const data=getEstimateData();return{id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),app:'Morales Roofing RoofScan Pro',customerName:document.getElementById('customerName')?.value||'Unnamed Customer',customerPhone:document.getElementById('customerPhone')?.value||'',address:document.getElementById('address')?.value||'',status:document.getElementById('jobStatus')?.value||'Lead',notes:document.getElementById('jobNotes')?.value||'',companyPhone:document.getElementById('companyPhone')?.value||'',companyEmail:document.getElementById('companyEmail')?.value||'',estimate:{baseSqft:Number(data.baseSqft.toFixed(2)),adjustedSqft:Number(data.adjusted.toFixed(2)),roofingSquares:Number(data.squares.toFixed(2)),materialCost:Number(data.materialCost.toFixed(2)),laborCost:Number(data.laborCost.toFixed(2)),total:Number(data.total.toFixed(2)),pitchFactor:data.pitch,wasteFactorPercent:Number((data.waste*100).toFixed(1)),pricePerSquare:data.price,laborPerSquare:data.labor},points:RoofScanState.points.map(p=>({lat:p.lat(),lng:p.lng()})),createdAt:new Date().toISOString()}}function resetDrawing(){RoofScanState.points=[];if(RoofScanState.polygon){RoofScanState.polygon.setMap(null);RoofScanState.polygon=null}['baseSqft','adjustedSqft','roofingSquares','pointCount'].forEach(id=>setText(id,'0'));['materialCost','laborCost','estimatedTotal'].forEach(id=>setText(id,'$0'));setText('activeStatus','Ready');showMessage('Drawing reset.')}function exportJob(){const job=collectCurrentJob();const blob=new Blob([JSON.stringify(job,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='morales-roofing-roofscan-job.json';a.click();URL.revokeObjectURL(url)}function generatePdfQuote(){const job=collectCurrentJob();if(!window.jspdf||!window.jspdf.jsPDF){showMessage('PDF library did not load. Check internet connection.');return}const{jsPDF}=window.jspdf;const doc=new jsPDF();const pageWidth=doc.internal.pageSize.getWidth();const margin=16;let y=18;doc.setFillColor(11,11,11);doc.rect(0,0,pageWidth,50,'F');if(companyLogo){try{doc.addImage(companyLogo,'PNG',pageWidth-52,8,34,34)}catch(e){}}doc.setTextColor(212,175,55);doc.setFontSize(20);doc.setFont('helvetica','bold');doc.text('Morales Roofing',margin,y);doc.setTextColor(247,243,233);doc.setFontSize(10);doc.setFont('helvetica','normal');doc.text('RoofScan Pro Estimate Quote',margin,y+8);if(job.companyPhone)doc.text(job.companyPhone,margin,y+16);if(job.companyEmail)doc.text(job.companyEmail,margin+55,y+16);y=64;doc.setTextColor(11,11,11);doc.setFontSize(16);doc.setFont('helvetica','bold');doc.text('Customer & Job Details',margin,y);y+=10;doc.setFontSize(10);const details=[['Customer',job.customerName],['Phone',job.customerPhone],['Address',job.address],['Status',job.status],['Notes',job.notes],['Quote Date',new Date(job.createdAt).toLocaleString()]];details.forEach(([label,value])=>{doc.setFont('helvetica','bold');doc.text(`${label}:`,margin,y);doc.setFont('helvetica','normal');doc.text(String(value||''),margin+35,y,{maxWidth:pageWidth-margin*2-35});y+=8});y+=8;doc.setFontSize(16);doc.setFont('helvetica','bold');doc.text('Roof Measurement Summary',margin,y);y+=10;const rows=[['Base Roof Area',`${job.estimate.baseSqft} sq ft`],['Adjusted Roof Area',`${job.estimate.adjustedSqft} sq ft`],['Roofing Squares',`${job.estimate.roofingSquares}`],['Pitch Factor',`${job.estimate.pitchFactor}`],['Waste Factor',`${job.estimate.wasteFactorPercent}%`],['Material Rate',formatCurrency(job.estimate.pricePerSquare)+' / square'],['Labor Rate',formatCurrency(job.estimate.laborPerSquare)+' / square']];rows.forEach(([label,value],index)=>{if(index%2===0){doc.setFillColor(245,245,245);doc.rect(margin,y-5,pageWidth-margin*2,8,'F')}doc.setFontSize(10);doc.setTextColor(11,11,11);doc.setFont('helvetica','bold');doc.text(label,margin+2,y);doc.setFont('helvetica','normal');doc.text(value,pageWidth-margin-62,y);y+=9});y+=10;doc.setFillColor(193,18,31);doc.rect(margin,y,pageWidth-margin*2,34,'F');doc.setTextColor(255,255,255);doc.setFontSize(12);doc.setFont('helvetica','bold');doc.text('Estimated Total',margin+8,y+13);doc.setFontSize(24);doc.text(formatCurrency(job.estimate.total),margin+8,y+27);y+=48;doc.setTextColor(11,11,11);doc.setFontSize(10);doc.setFont('helvetica','normal');doc.text(`Material Cost: ${formatCurrency(job.estimate.materialCost)}`,margin,y);y+=7;doc.text(`Labor Cost: ${formatCurrency(job.estimate.laborCost)}`,margin,y);y+=16;doc.setFontSize(9);doc.setTextColor(90,90,90);doc.text('Note: This quote is an estimate based on satellite roof tracing, selected pitch factor, waste factor, material rate, and labor rate. Final pricing may change after physical inspection.',margin,y,{maxWidth:pageWidth-margin*2});doc.setDrawColor(212,175,55);doc.line(margin,282,pageWidth-margin,282);doc.setTextColor(80,80,80);doc.setFontSize(8);doc.text('Generated by Morales Roofing RoofScan Pro',margin,288);const safeName=(job.customerName||'roofing-quote').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');doc.save(`morales-roofing-quote-${safeName||'estimate'}.pdf`);showMessage('PDF quote generated.')}const AUTOSAVE_KEY='moralesRoofScanAutosave';function getAutosaveFieldIds(){return['customerName','customerPhone','address','jobStatus','jobNotes','companyPhone','companyEmail','pricePerSquare','laborPerSquare','wasteFactor','pitchFactor']}function collectAutosaveDraft(){const draft={savedAt:new Date().toISOString(),fields:{}};getAutosaveFieldIds().forEach(id=>{const el=document.getElementById(id);if(el)draft.fields[id]=el.value});return draft}function autosaveDraft(){try{localStorage.setItem(AUTOSAVE_KEY,JSON.stringify(collectAutosaveDraft()));const savedAt=document.getElementById('autosaveStatus');if(savedAt)savedAt.textContent='Autosaved '+new Date().toLocaleTimeString()}catch(e){console.warn(e)}}function restoreAutosaveDraft(){try{const raw=localStorage.getItem(AUTOSAVE_KEY);if(!raw)return;const draft=JSON.parse(raw);Object.entries(draft.fields||{}).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.value=value});renderEstimate();const status=document.getElementById('autosaveStatus');if(status&&draft.savedAt)status.textContent='Recovered draft from '+new Date(draft.savedAt).toLocaleString();showMessage('Autosaved draft restored.')}catch(e){console.warn(e)}}function clearAutosaveDraft(){localStorage.removeItem(AUTOSAVE_KEY);setText('autosaveStatus','Autosave cleared.');showMessage('Autosave draft cleared.')}document.addEventListener('DOMContentLoaded',()=>{['pricePerSquare','laborPerSquare','wasteFactor','pitchFactor'].forEach(id=>document.getElementById(id)?.addEventListener('input',renderEstimate));document.getElementById('resetBtn')?.addEventListener('click',resetDrawing);document.getElementById('exportBtn')?.addEventListener('click',exportJob);document.getElementById('pdfBtn')?.addEventListener('click',generatePdfQuote);document.getElementById('logoUpload')?.addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=x=>{companyLogo=x.target.result;showMessage('Company logo loaded for PDF.')};reader.readAsDataURL(file)});restoreAutosaveDraft();getAutosaveFieldIds().forEach(id=>{document.getElementById(id)?.addEventListener('input',autosaveDraft);document.getElementById(id)?.addEventListener('change',autosaveDraft)});document.getElementById('clearAutosaveBtn')?.addEventListener('click',clearAutosaveDraft);setInterval(autosaveDraft,15000);});


/* === PROFIT TRACKING PATCH === */
function getProfitInputs(){
  return {
    overheadPercent: getNumberValue('overheadPercent',15)/100,
    profitPercent: getNumberValue('profitPercent',25)/100
  };
}

const originalGetEstimateData = getEstimateData;
getEstimateData = function(){
  const base = originalGetEstimateData();
  const {overheadPercent, profitPercent} = getProfitInputs();
  const directCost = (base.materialCost || 0) + (base.laborCost || 0);
  const overheadCost = directCost * overheadPercent;
  const projectCost = directCost + overheadCost;
  const projectProfit = projectCost * profitPercent;
  const total = projectCost + projectProfit;
  const margin = total ? (projectProfit / total) * 100 : 0;

  return {
    ...base,
    overheadPercent,
    profitPercent,
    directCost,
    overheadCost,
    projectCost,
    projectProfit,
    total,
    margin
  };
};

const originalRenderEstimate = renderEstimate;
renderEstimate = function(){
  originalRenderEstimate();
  const data = getEstimateData();
  setText('projectCost', formatCurrency(data.projectCost));
  setText('projectProfit', formatCurrency(data.projectProfit));
  setText('projectMargin', data.margin.toFixed(1) + '%');
};

const originalCollectCurrentJob = collectCurrentJob;
collectCurrentJob = function(){
  const job = originalCollectCurrentJob();
  const data = getEstimateData();
  job.estimate.overheadPercent = Number((data.overheadPercent * 100).toFixed(1));
  job.estimate.profitPercent = Number((data.profitPercent * 100).toFixed(1));
  job.estimate.projectCost = Number(data.projectCost.toFixed(2));
  job.estimate.projectProfit = Number(data.projectProfit.toFixed(2));
  job.estimate.margin = Number(data.margin.toFixed(1));
  job.estimate.total = Number(data.total.toFixed(2));
  return job;
};

document.addEventListener('DOMContentLoaded',()=>{
  ['overheadPercent','profitPercent'].forEach(id=>{
    document.getElementById(id)?.addEventListener('input', renderEstimate);
    document.getElementById(id)?.addEventListener('change', renderEstimate);
  });
});
/* === END PROFIT TRACKING PATCH === */
