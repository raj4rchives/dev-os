const KEY="jee370rTrackerV2";
const LEGACY_KEY="jee370rTrackerV1";
const fields=[
  "date","lec",
  "phyHw","phyIllu",
  "chemHw","chemIllu",
  "mathHw","mathIllu",
  "phyDpp","chemDpp","mathDpp",
  "phyPyq","chemPyq","mathPyq"
];
const tbody=document.querySelector("#tracker tbody");

function makeRows(){
  tbody.innerHTML="";
  for(let i=0;i<15;i++){
    const tr=document.createElement("tr");
    tr.dataset.i=i;
    tr.innerHTML=fields.map((f,j)=>`<td><input data-f="${f}" ${j===0?'type="date"':''} inputmode="numeric"></td>`).join("");
    tbody.appendChild(tr);
  }
  tbody.querySelectorAll("input").forEach(x=>x.addEventListener("input",updateStats));
}

function rowsData(){
  return [...tbody.querySelectorAll("tr")].map(tr=>{
    const o={};
    tr.querySelectorAll("input").forEach(i=>o[i.dataset.f]=i.value);
    return o;
  });
}

function setData(data){
  makeRows();
  (data||[]).slice(0,15).forEach((o,i)=>{
    const tr=tbody.children[i];
    fields.forEach(f=>{if(o[f]!=null)tr.querySelector(`[data-f="${f}"]`).value=o[f]});
  });
  updateStats();
}

function migrateLegacy(){
  const old=JSON.parse(localStorage.getItem(LEGACY_KEY)||"null");
  if(!old || !Array.isArray(old.rows)) return null;
  const migrated=old.rows.map(r=>({
    date:r.date||"",
    lec:r.lec||"",
    phyHw:r.phy||"",
    phyIllu:"",
    chemHw:r.chem||"",
    chemIllu:"",
    mathHw:r.math||"",
    mathIllu:"",
    phyDpp:"",
    chemDpp:r.chemDpp||"",
    mathDpp:r.mathDpp||"",
    phyPyq:r.pyq||"",
    chemPyq:"",
    mathPyq:""
  }));
  return {startDate:old.startDate||"",rows:migrated};
}

function save(){
  localStorage.setItem(KEY,JSON.stringify({startDate:document.querySelector("#startDate").value,rows:rowsData()}));
  alert("Progress saved on this device.");
}

function load(){
  const x=JSON.parse(localStorage.getItem(KEY)||"null") || migrateLegacy();
  if(!x){alert("No saved tracker found.");return}
  document.querySelector("#startDate").value=x.startDate||"";
  setData(x.rows);
  if(!localStorage.getItem(KEY)) localStorage.setItem(KEY,JSON.stringify(x));
}

function clearAll(){
  if(!confirm("Clear all 15 days?"))return;
  localStorage.removeItem(KEY);
  document.querySelector("#startDate").value="";
  setData([]);
}

function fillDates(){
  const s=document.querySelector("#startDate").value;
  if(!s){alert("Select a start date first.");return}
  const d=new Date(s+"T00:00:00");
  [...tbody.children].forEach((tr,i)=>{
    const x=new Date(d);x.setDate(d.getDate()+i);
    tr.querySelector('[data-f="date"]').value=x.toISOString().slice(0,10);
  });
  updateStats();
}

function num(v){
  const m=String(v||"").match(/\d+/);
  return m?Number(m[0]):0;
}

function sumField(data,field){
  return data.reduce((s,r)=>s+num(r[field]),0);
}

function put(id,value){
  const el=document.getElementById(id);
  if(el) el.textContent=value;
}

function updateStats(){
  const data=rowsData();
  const done=data.filter(r=>Object.values(r).some(v=>String(v||"").trim()!=="")).length;
  const lec=sumField(data,"lec");

  const totals={};
  fields.slice(2).forEach(f=>totals[f]=sumField(data,f));

  const phy=totals.phyHw+totals.phyIllu+totals.phyDpp+totals.phyPyq;
  const chem=totals.chemHw+totals.chemIllu+totals.chemDpp+totals.chemPyq;
  const math=totals.mathHw+totals.mathIllu+totals.mathDpp+totals.mathPyq;
  const overall=phy+chem+math;
  const pyq=totals.phyPyq+totals.chemPyq+totals.mathPyq;
  const avg=done?Math.round(overall/done):0;
  const target=Math.min(100,Math.round(overall/(15*70)*100));

  put("daysDone",done+"/15");
  put("lecSum",lec);
  put("questionSum",overall);
  put("pyqSum",pyq);
  put("avgQ",avg);
  put("qTarget",target+"%");

  put("phyHwSum",totals.phyHw); put("chemHwSum",totals.chemHw); put("mathHwSum",totals.mathHw); put("hwSum",totals.phyHw+totals.chemHw+totals.mathHw);
  put("phyIlluSum",totals.phyIllu); put("chemIlluSum",totals.chemIllu); put("mathIlluSum",totals.mathIllu); put("illuSum",totals.phyIllu+totals.chemIllu+totals.mathIllu);
  put("phyDppSum",totals.phyDpp); put("chemDppSum",totals.chemDpp); put("mathDppSum",totals.mathDpp); put("dppSum",totals.phyDpp+totals.chemDpp+totals.mathDpp);
  put("phyPyqSum",totals.phyPyq); put("chemPyqSum",totals.chemPyq); put("mathPyqSum",totals.mathPyq); put("pyqDetailSum",pyq);
  put("phyTotal",phy); put("chemTotal",chem); put("mathTotal",math); put("overallTotal",overall);
}

async function makePDF(){
  const {jsPDF}=window.jspdf;
  const pdf=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
  const data=rowsData();
  const headers=["DATE","LEC","PHY HW","PHY ILLU","CHEM HW","CHEM ILLU","MATH HW","MATH ILLU","PHY DPP","CHEM DPP","MATH DPP","PHY PYQ","CHEM PYQ","MATH PYQ"];
  const widths=[18,10,13,14,14,15,14,15,13,14,14,13,14,14];
  const startX=7, startY=29, rowH=9;
  let x=startX;

  pdf.setFont("helvetica","bold");
  pdf.setFontSize(17);
  pdf.text("370R JEE ADVANCED TRACKER",startX,14);
  pdf.setFontSize(9);
  pdf.text("15-DAY QUESTION & LECTURE LOG",startX,21);

  pdf.setFontSize(6.5);
  headers.forEach((h,i)=>{
    pdf.setFillColor(255,217,0);
    pdf.rect(x,startY,widths[i],rowH,"F");
    pdf.rect(x,startY,widths[i],rowH);
    pdf.text(h,x+widths[i]/2,startY+5.8,{align:"center",maxWidth:widths[i]-1});
    x+=widths[i];
  });

  pdf.setFont("helvetica","normal");
  data.forEach((r,row)=>{
    let xx=startX;
    const vals=[r.date,r.lec,r.phyHw,r.phyIllu,r.chemHw,r.chemIllu,r.mathHw,r.mathIllu,r.phyDpp,r.chemDpp,r.mathDpp,r.phyPyq,r.chemPyq,r.mathPyq];
    vals.forEach((v,i)=>{
      pdf.rect(xx,startY+(row+1)*rowH,widths[i],rowH);
      let text=v||"";
      if(i===0 && /^\d{4}-\d{2}-\d{2}$/.test(text)){
        const [yy,mm,dd]=text.split("-"); text=`${dd}/${mm}`;
      }
      pdf.text(String(text),xx+widths[i]/2,startY+(row+1)*rowH+5.8,{align:"center",maxWidth:widths[i]-1});
      xx+=widths[i];
    });
  });

  const totalsRow=data.length+2;
  let xx=startX;
  const allVals=["TOTAL","",sumField(data,"phyHw"),sumField(data,"phyIllu"),sumField(data,"chemHw"),sumField(data,"chemIllu"),sumField(data,"mathHw"),sumField(data,"mathIllu"),sumField(data,"phyDpp"),sumField(data,"chemDpp"),sumField(data,"mathDpp"),sumField(data,"phyPyq"),sumField(data,"chemPyq"),sumField(data,"mathPyq")];
  pdf.setFont("helvetica","bold");
  allVals.forEach((v,i)=>{
    pdf.setFillColor(245,247,251);
    pdf.rect(xx,startY+totalsRow*rowH,widths[i],rowH,"F");
    pdf.rect(xx,startY+totalsRow*rowH,widths[i],rowH);
    pdf.text(String(v),xx+widths[i]/2,startY+totalsRow*rowH+5.8,{align:"center",maxWidth:widths[i]-1});
    xx+=widths[i];
  });

  pdf.setFontSize(8);
  pdf.text(`Total questions: ${sumField(data,"phyHw")+sumField(data,"phyIllu")+sumField(data,"chemHw")+sumField(data,"chemIllu")+sumField(data,"mathHw")+sumField(data,"mathIllu")+sumField(data,"phyDpp")+sumField(data,"chemDpp")+sumField(data,"mathDpp")+sumField(data,"phyPyq")+sumField(data,"chemPyq")+sumField(data,"mathPyq")}`,7,198);
  pdf.text(`Total lectures: ${sumField(data,"lec")}    |    Total PYQs: ${sumField(data,"phyPyq")+sumField(data,"chemPyq")+sumField(data,"mathPyq")}`,7,204);
  pdf.save("370R-JEE-Advanced-Tracker-Filled.pdf");
}

document.querySelector("#saveBtn").onclick=save;
document.querySelector("#loadBtn").onclick=load;
document.querySelector("#clearBtn").onclick=clearAll;
document.querySelector("#datesBtn").onclick=fillDates;
document.querySelector("#pdfBtn").onclick=makePDF;

makeRows();
const saved=JSON.parse(localStorage.getItem(KEY)||"null") || migrateLegacy();
if(saved){
  document.querySelector("#startDate").value=saved.startDate||"";
  setData(saved.rows);
}
updateStats();
