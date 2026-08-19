const KEY="jee370rTrackerV1";
const fields=["date","lec","phy","chem","math","chemDpp","mathDpp","pyq"];
const tbody=document.querySelector("#tracker tbody");

function makeRows(){
  tbody.innerHTML="";
  for(let i=0;i<15;i++){
    const tr=document.createElement("tr");
    tr.dataset.i=i;
    tr.innerHTML=fields.map((f,j)=>`<td><input data-f="${f}" ${j===0?'type="date"':''}></td>`).join("");
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
function save(){
  localStorage.setItem(KEY,JSON.stringify({startDate:document.querySelector("#startDate").value,rows:rowsData()}));
  alert("Progress saved on this device.");
}
function load(){
  const x=JSON.parse(localStorage.getItem(KEY)||"null");
  if(!x){alert("No saved tracker found.");return}
  document.querySelector("#startDate").value=x.startDate||"";
  setData(x.rows);
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
function num(v){const m=String(v||"").match(/\d+/);return m?Number(m[0]):0}
function updateStats(){
  const data=rowsData();
  const done=data.filter(r=>Object.values(r).some(v=>v.trim()!=="")).length;
  const lec=data.reduce((s,r)=>s+num(r.lec),0);
  const pyq=data.reduce((s,r)=>s+num(r.pyq),0);
  document.querySelector("#daysDone").textContent=done+"/15";
  document.querySelector("#lecSum").textContent=lec;
  document.querySelector("#pyqSum").textContent=pyq;
  document.querySelector("#qTarget").textContent=Math.min(100,Math.round(pyq/(15*70)*100))+"%";
}

async function makePDF(){
  const {jsPDF}=window.jspdf;
  const img=new Image();
  img.src="tracker-template.png";
  await new Promise((res,rej)=>{img.onload=res;img.onerror=rej});
  const pdf=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
  pdf.addImage(img,"PNG",0,0,210,297);

  // Coordinates are mapped from the supplied 1086×1536 template image to A4.
  const sx=210/1086, sy=297/1536;
  const cols=[20,148,250,370,481,585,679,790,1003];
  const centers=cols.slice(0,-1).map((x,i)=>((x+cols[i+1])/2)*sx);
  const tableTop=264, rowH=(1398-264)/15;

  const data=rowsData();
  pdf.setFont("helvetica","bold");
  pdf.setTextColor(20,20,20);
  pdf.setFontSize(7);

  data.forEach((r,i)=>{
    const y=(tableTop+(i+.5)*rowH)*sy+1.7;
    const vals=[r.date,r.lec,r.phy,r.chem,r.math,r.chemDpp,r.mathDpp,r.pyq];
    vals.forEach((v,j)=>{
      if(!v)return;
      let text=v;
      if(j===0 && /^\d{4}-\d{2}-\d{2}$/.test(v)){
        const [yy,mm,dd]=v.split("-");
        text=`${dd}/${mm}`;
      }
      // Keep entries inside their cells.
      const maxChars=j===0?10:(j===1?7:12);
      if(text.length>maxChars)text=text.slice(0,maxChars-1)+"…";
      pdf.text(text,centers[j],y,{align:"center",maxWidth:(cols[j+1]-cols[j])*sx-2});
    });
  });

  pdf.save("370R-JEE-Advanced-Tracker-Filled.pdf");
}

document.querySelector("#saveBtn").onclick=save;
document.querySelector("#loadBtn").onclick=load;
document.querySelector("#clearBtn").onclick=clearAll;
document.querySelector("#datesBtn").onclick=fillDates;
document.querySelector("#pdfBtn").onclick=makePDF;

makeRows();
const saved=JSON.parse(localStorage.getItem(KEY)||"null");
if(saved){
  document.querySelector("#startDate").value=saved.startDate||"";
  setData(saved.rows);
}
updateStats();
