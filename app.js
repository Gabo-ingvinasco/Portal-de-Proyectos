/* ═══ CONFIGURA ESTO: pega aquí la URL de tu Apps Script desplegado ═══ */
const API_URL = 'https://script.google.com/macros/s/AKfycbzZ-IkmKPIICIWI7tt_Iy2Qvw95GC9RNWdv1HX3F7-ov9dXiFrCej_yrRBc3K7wvZHI4A/exec';
const GOOGLE_CLIENT_ID = '31258029935-n8eimmvs8duntfgf5o8741ecd9bh3qtk.apps.googleusercontent.com';
const WORKSPACE_DOMAIN = 'minimaarquitectos.com';

/* FASE 0 — CONTENCIÓN
   Los módulos que dependían de información financiera pública permanecen
   deshabilitados hasta que esos datos se sirvan desde un endpoint autenticado. */
const FASE_0_CONTENCION = false;


/* FASE 4: los datos financieros existen solo en memoria después de que un
   endpoint POST autenticado devuelve el subconjunto autorizado. */
let financialProjects = [];

const fmtMM=v=>{if(v===null||v===undefined||isNaN(v)||v===0)return"—";return"$"+Math.round(v).toLocaleString('es-CO');};

let filteredProjects = [];

const PROJ_DETAIL = {};

const CAPS = [];



let FLUJO_CAJA=[];

function parseSheetCSV(text){
  const rows=[];let row=[];let field='';let inQ=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(inQ){ if(c==='"'){ if(text[i+1]==='"'){field+='"';i++;} else inQ=false; } else field+=c; }
    else { if(c==='"') inQ=true; else if(c===','){row.push(field);field='';} else if(c==='\n'){row.push(field);rows.push(row);row=[];field='';} else if(c==='\r'){} else field+=c; }
  }
  if(field.length||row.length){row.push(field);rows.push(row);}
  return rows;
}
function parseMoneyCO(s){
  if(!s)return 0;
  const neg=s.indexOf('-')!==-1;
  const digits=s.replace(/[^0-9]/g,'');
  if(!digits)return 0;
  const n=parseInt(digits,10);
  return neg?-n:n;
}
function parsePctCO(s){
  if(!s)return 0;
  const n=parseFloat(s.replace('%','').replace(',','.').trim());
  return isNaN(n)?0:n;
}
function parseSemanaNum(s){
  if(!s)return null;
  const m=s.match(/Semana\s+(\d+)/i);
  return m?parseInt(m[1],10):null;
}
function isoFromSemanaNum(n){
  if(n==null)return null;
  const d=addDays(SEMANA1_INICIO,(n-1)*7);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
/* Columnas verificadas contra la hoja real (índices 0-based de la fila CSV) */
const FC_MILESTONE_SPECS=[
  {tipo:'Anticipo',label:null,pctIdx:8,valorProyIdx:10,fechaProyIdx:11,fechaRealIdx:12,valorRealIdx:13,fechaPresentaIdx:null,estadoIdx:14},
  {tipo:'Corte',label:'Corte 1',pctIdx:16,valorProyIdx:22,fechaPresentaIdx:23,fechaProyIdx:24,fechaRealIdx:25,valorRealIdx:26,estadoIdx:27},
  {tipo:'Corte',label:'Corte 2',pctIdx:29,valorProyIdx:35,fechaPresentaIdx:36,fechaProyIdx:37,fechaRealIdx:38,valorRealIdx:39,estadoIdx:40},
  {tipo:'Corte',label:'Corte 3',pctIdx:42,valorProyIdx:48,fechaPresentaIdx:49,fechaProyIdx:50,fechaRealIdx:51,valorRealIdx:52,estadoIdx:53},
  {tipo:'Corte',label:'Corte 4',pctIdx:55,valorProyIdx:61,fechaPresentaIdx:62,fechaProyIdx:63,fechaRealIdx:64,valorRealIdx:null,estadoIdx:65},
  {tipo:'Corte',label:'Corte 5',pctIdx:67,valorProyIdx:73,fechaPresentaIdx:74,fechaProyIdx:75,fechaRealIdx:76,valorRealIdx:null,estadoIdx:77},
  {tipo:'Retegarantía',label:null,pctIdx:85,valorProyIdx:86,fechaProyIdx:87,fechaRealIdx:88,valorRealIdx:null,fechaPresentaIdx:null,estadoIdx:89},
  {tipo:'Liquidación',label:null,pctIdx:91,valorProyIdx:92,valorRealIdx:93,fechaPresentaIdx:94,fechaProyIdx:95,fechaRealIdx:95,estadoIdx:96},
];
function extractHito(row,spec){
  const pct=parsePctCO(row[spec.pctIdx]);
  const valorProy=spec.valorProyIdx!=null?parseMoneyCO(row[spec.valorProyIdx]):0;
  const valorReal=spec.valorRealIdx!=null?parseMoneyCO(row[spec.valorRealIdx]):0;
  const estadoRaw=(row[spec.estadoIdx]||'').trim();
  if(!(pct>0||valorProy>0||valorReal>0||estadoRaw!==''))return null;
  const estado=estadoRaw==='Confirmado'?'Confirmado':'Pendiente';
  const valor=valorReal>0?valorReal:valorProy;
  const semanaNumProy=spec.fechaProyIdx!=null?parseSemanaNum(row[spec.fechaProyIdx]):null;
  const semanaNumReal=spec.fechaRealIdx!=null?parseSemanaNum(row[spec.fechaRealIdx]):null;
  const semanaNumPresenta=spec.fechaPresentaIdx!=null?parseSemanaNum(row[spec.fechaPresentaIdx]):null;
  const semanaNum=semanaNumReal!=null?semanaNumReal:semanaNumProy;
  if(!(valor>0))return null;
  return{tipo:spec.tipo,label:spec.label||undefined,valor,
    semana:isoFromSemanaNum(semanaNum),
    semanaPresenta:isoFromSemanaNum(semanaNumPresenta),
    fecha:null,estado};
}
async function loadFlujoCajaLive(){
  const note=document.getElementById('fc-note');
  const [flujoData, proyectosData] = await Promise.all([
    apiPost_('flujo_caja'),
    apiPost_('proyectos_financieros')
  ]);
  if(!flujoData.ok) throw new Error(flujoData.error || 'No se pudo cargar el flujo de caja.');
  if(!proyectosData.ok) throw new Error(proyectosData.error || 'No se pudo cargar los proyectos financieros.');
  FLUJO_CAJA.length=0;
  FLUJO_CAJA.push(...(flujoData.flujo || []));
  financialProjects = proyectosData.proyectos || [];
  dropdownFilteredAll = financialProjects.slice();
  filteredProjects = dropdownFilteredAll.slice();
  financialMeta = flujoData;
  updateSidebarDataStatus_(flujoData.fechaActualizacion, flujoData.fechaExtraccion);
  resetFinancialFilters_();
  populateFilters();
  computeFilteredProjects();
  if(note){ note.style.display='none'; note.textContent=''; }
}
const TIPO_COLOR_FC={Anticipo:'#2e7dd1',Corte:'#1a8a52','Liquidación':'#e8622a','Retegarantía':'#a82c00',Vencido:'#c0392b'};
function mondayOf(d){const dt=new Date(d);const day=(dt.getDay()+6)%7;dt.setHours(0,0,0,0);dt.setDate(dt.getDate()-day);return dt;}
function addDays(d,n){const dt=new Date(d);dt.setDate(dt.getDate()+n);return dt;}
function fcShort(d){return d.toLocaleDateString('es-CO',{day:'2-digit',month:'2-digit'});}
function fcResolveDate(val,base){if(val==null)return null;if(typeof val==='number')return addDays(base,val);const d=new Date(val+'T00:00:00');return isNaN(d)?null:d;}
const SEMANA1_INICIO=new Date(2025,11,29);
function semanaNumOf(d){const diff=Math.round((mondayOf(d)-SEMANA1_INICIO)/(86400000*7));return diff+1;}

let fcSemanaChart,fcTipoChart,fcVencTipoChart;
let fcActiveWeek=0,fcR4Weeks=[],fcR4Rows=[];
function fcSelectWeek(i){fcActiveWeek=i;renderResumen4Semanas();}
function buildResumen4Semanas(weeks,rows){
  fcR4Weeks=weeks.slice(0,4);
  fcR4Rows=rows;
  if(fcActiveWeek>fcR4Weeks.length-1)fcActiveWeek=0;
  renderResumen4Semanas();
}
function esVencido(h,cutoff){
  const ingOverdue=h.semanaDate&&h.semanaDate<cutoff&&h.estado!=='Confirmado';
  const presOverdue=h.semanaPresentaDate&&h.semanaPresentaDate<cutoff&&h.estado!=='Confirmado';
  return ingOverdue||presOverdue;
}
function renderResumen4Semanas(){
  const weeks=fcR4Weeks,rows=fcR4Rows;
  if(!weeks.length)return;
  const cards=weeks.map((w,i)=>{
    const ingresar=rows.filter(h=>h.semanaDate&&h.semanaDate>=w.start&&h.semanaDate<=w.end).reduce((s,h)=>s+h.valor,0);
    const presentar=rows.filter(h=>h.semanaPresentaDate&&h.semanaPresentaDate>=w.start&&h.semanaPresentaDate<=w.end).reduce((s,h)=>s+h.valor,0);
    const totalSemana=ingresar+presentar;
    const esSemanaActual=i===0;
    const cardCls='fc-r4-card'+(i===fcActiveWeek?' active':'');
    return`<div class="${cardCls}" onclick="fcSelectWeek(${i})">
      <div class="fc-r4-wk">Semana ${semanaNumOf(w.start)}${esSemanaActual?' (actual)':''}</div>
      <div class="fc-r4-date">${fcShort(w.start)}–${fcShort(w.end)}</div>
      <div class="fc-r4-row"><span>A ingresar</span><span class="fc-r4-val ing">${fmtMM(ingresar)}</span></div>
      <div class="fc-r4-row"><span>A presentar</span><span class="fc-r4-val pres">${fmtMM(presentar)}</span></div>
      <div class="fc-r4-row total"><span>Total semana</span><span class="fc-r4-val total">${fmtMM(totalSemana)}</span></div>
    </div>`;
  }).join('');
  document.getElementById('fc-resumen4').innerHTML=cards;

  const w=weeks[fcActiveWeek];
  const ingRows=rows.filter(h=>h.semanaDate&&h.semanaDate>=w.start&&h.semanaDate<=w.end);
  const presRows=rows.filter(h=>h.semanaPresentaDate&&h.semanaPresentaDate>=w.start&&h.semanaPresentaDate<=w.end);
  const rowHtml=list=>list.length?list.map(h=>`<div class="fc-r4-row" style="border-bottom:1px solid #f5f3f0;padding:5px 0">
      <span><strong style="color:#1a1a1a">${escapeHtml_(h.proyecto)}</strong> — ${escapeHtml_(h.label||h.tipo)} <span class="ht ht-${safeHitoTipo_(h.tipo)}" style="margin-left:4px">${escapeHtml_(h.tipo)}</span></span>
      <span class="fc-r4-val" style="font-size:11px">${fmtMM(h.valor)}</span></div>`).join(''):
    '<div class="fc-r4-detail-empty">Nada programado esta semana.</div>';
  document.getElementById('fc-resumen4-detail').innerHTML=`
    <div class="fc-r4-detail-wrap">
      <div class="fc-r4-detail-title">A ingresar — Semana ${semanaNumOf(w.start)} (${fcShort(w.start)}–${fcShort(w.end)})</div>
      ${rowHtml(ingRows)}
      <div class="fc-r4-detail-title" style="margin-top:12px">A presentar — Semana ${semanaNumOf(w.start)} (${fcShort(w.start)}–${fcShort(w.end)})</div>
      ${rowHtml(presRows)}
    </div>`;
}
/* ── Panel independiente de Pagos Vencidos (no depende de la semana seleccionada) ── */
function diasAtraso(fecha,today0){
  if(!fecha)return null;
  return Math.max(0,Math.round((today0-fecha)/86400000));
}
/* Icono ✓/✗ para indicar si el hito ya fue presentado.
   Solo aplica a hitos con paso de presentación (Corte/Liquidación).
   ✓ verde: la fecha de presentación ya pasó (se dio por presentado).
   ✗ rojo: tiene fecha de presentación pero todavía no llega o sigue pendiente.
   — gris: el hito no requiere presentación (Anticipo/Retegarantía). */
function presentadoIcon(h,today0){
  if(!h.semanaPresentaDate)return'<span style="color:#c5c2bc">—</span>';
  return h.semanaPresentaDate<=today0
    ?'<span style="color:#1a8a52;font-weight:700;font-size:13px">✓</span>'
    :'<span style="color:#c0392b;font-weight:700;font-size:13px">✗</span>';
}
/* Icono ✓/✗ para el ingreso: ✓ solo si el estado del hito ya quedó Confirmado
   (el pago realmente entró). ✗ si tenía fecha de ingreso y sigue Pendiente. */
function ingresoIcon(h){
  if(!h.semanaDate)return'<span style="color:#c5c2bc">—</span>';
  return h.estado==='Confirmado'
    ?'<span style="color:#1a8a52;font-weight:700;font-size:13px">✓</span>'
    :'<span style="color:#c0392b;font-weight:700;font-size:13px">✗</span>';
}
function renderVencidos(vencidosList,today0){
  const total=vencidosList.reduce((s,h)=>s+h.valor,0);
  const sub=document.getElementById('fc-venc-sub');
  sub.textContent=vencidosList.length? `${vencidosList.length} hito(s) — ${fmtMM(total)} en total`:'Sin pagos vencidos';
  const sorted=[...vencidosList].sort((a,b)=>{
    const da=a.semanaDate||a.semanaPresentaDate||new Date(0);
    const db=b.semanaDate||b.semanaPresentaDate||new Date(0);
    return da-db;
  });
  document.getElementById('fc-vencidos-tbody').innerHTML=sorted.length?sorted.map(h=>{
    const diasIng=diasAtraso(h.semanaDate&&h.semanaDate<today0?h.semanaDate:null,today0);
    const diasPres=diasAtraso(h.semanaPresentaDate&&h.semanaPresentaDate<today0?h.semanaPresentaDate:null,today0);
    const dias=[diasIng,diasPres].filter(d=>d!==null);
    const diasMax=dias.length?Math.max(...dias):null;
    return`<tr class="fc-row-venc">
      <td class="td-primary">${escapeHtml_(h.proyecto)}</td><td>${escapeHtml_(h.encargado||'')}</td>
      <td><span class="ht ht-${safeHitoTipo_(h.tipo)}">${escapeHtml_(h.label||h.tipo)}</span></td>
      <td class="td-money" style="text-align:right">${fmtMM(h.valor)}</td>
      <td>${ingresoIcon(h)} ${h.semanaDate?fcShort(h.semanaDate)+(h.semanaDate<today0?' ⚠':''):'—'}</td>
      <td>${presentadoIcon(h,today0)} ${h.semanaPresentaDate?fcShort(h.semanaPresentaDate)+(h.semanaPresentaDate<today0?' ⚠':''):'—'}</td>
      <td style="text-align:right;color:#c0392b;font-weight:600">${diasMax!==null?diasMax+' días':'—'}</td>
      <td><span class="hb ${h.estado==='Confirmado'?'hb-cob':'hb-pend'}">${escapeHtml_(h.estado)}</span></td></tr>`;
  }).join(''):
    '<tr><td colspan="8" style="text-align:center;color:#aaa;padding:20px">No hay pagos vencidos con los filtros actuales</td></tr>';

  const vTipoTotals={Anticipo:0,Corte:0,'Liquidación':0,'Retegarantía':0};
  vencidosList.forEach(h=>vTipoTotals[h.tipo]+=h.valor);
  const vLabelsAll=Object.keys(vTipoTotals);
  const vLabels=vLabelsAll.filter(l=>vTipoTotals[l]>0);
  const vData=vLabels.map(l=>vTipoTotals[l]);
  const vColors=vLabels.map(l=>TIPO_COLOR_FC[l]);
  if(fcVencTipoChart)fcVencTipoChart.destroy();
  const vencCanvas=document.getElementById('fcVencTipoChart');
  if(vencCanvas){
    fcVencTipoChart=new Chart(vencCanvas,{type:'doughnut',
      data:{labels:vLabels.length?vLabels:['Sin datos'],datasets:[{data:vLabels.length?vData:[1],backgroundColor:vLabels.length?vColors:['#e8e5e0'],borderWidth:6,borderColor:'#fff',borderRadius:8,spacing:4}]},
      options:{responsive:false,maintainAspectRatio:false,cutout:'58%',plugins:{legend:{display:false},tooltip:{enabled:vLabels.length>0,callbacks:{label:c=>` ${c.label}: ${fmtMM(c.raw)}`}}}}});
  }
  const vDonutN=document.getElementById('fc-venc-donut-n');
  if(vDonutN)vDonutN.textContent=vencidosList.length;
  const vLegend=document.getElementById('fc-venc-tipo-legend');
  if(vLegend)vLegend.innerHTML=vLabels.length?vLabels.map((l,i)=>`<div class="legend-item"><div class="legend-dot" style="background:${vColors[i]}"></div><span>${l}</span><span class="legend-n">${fmtMM(vData[i])}</span></div>`).join(''):
    '<div style="font-size:11px;color:#aaa;text-align:center">Sin pagos vencidos</div>';
}
function buildFlujoCaja(){
  const codigosVisibles=new Set(filteredProjects.map(p=>p.codigo));
  const today0=mondayOf(new Date());
  const weeks=[...Array(12)].map((_,i)=>({start:addDays(today0,i*7),end:addDays(today0,i*7+6)}));
  const rows=[];
  FLUJO_CAJA.forEach(fc=>{
    const p=financialProjects.find(x=>x.codigo===fc.codigo);
    if(!p||!codigosVisibles.has(fc.codigo))return;
    fc.hitos.forEach(h=>{
      rows.push({...h,codigo:fc.codigo,proyecto:p.proyecto,encargado:p.encargado,
        semanaDate:fcResolveDate(h.semana,today0),fechaDate:fcResolveDate(h.fecha,today0),
        semanaPresentaDate:fcResolveDate(h.semanaPresenta,today0)});
    });
  });

  buildResumen4Semanas(weeks,rows);

  const totalProyectado=rows.filter(h=>h.semanaDate&&h.semanaDate>=weeks[0].start&&h.semanaDate<=weeks[11].end).reduce((s,h)=>s+h.valor,0);
  const vencidos=rows.filter(h=>esVencido(h,weeks[0].start));
  const totalVencido=vencidos.reduce((s,h)=>s+h.valor,0);
  renderVencidos(vencidos,today0);
  const totalPendiente=rows.filter(h=>h.estado==='Pendiente').reduce((s,h)=>s+h.valor,0);
  const totalGestionado=rows.filter(h=>h.estado==='Confirmado').reduce((s,h)=>s+h.valor,0);

  const sinHitos=FLUJO_CAJA.filter(fc=>codigosVisibles.has(fc.codigo)&&fc.hitos.length===0).length;
  const note=document.getElementById('fc-note');
  if(sinHitos>0){note.style.display='block';note.textContent=`⚠ ${sinHitos} proyecto(s) activos sin hitos programados todavía — complétalos en la pestaña "Flujo de Caja" del Google Sheet y regenera este archivo.`;}
  else note.style.display='none';

  document.getElementById('fc-kpi-strip').innerHTML=`
    <div class="kpi"><div class="kpi-ico total"><svg width="16" height="16" fill="none" stroke="#e8622a" stroke-width="1.8" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="9" x2="23" y2="9"/></svg></div>
      <div><div class="kpi-num">${fmtMM(totalProyectado)}</div><div class="kpi-lbl">Proyectado 12 semanas</div></div></div>
    <div class="kpi"><div class="kpi-ico venc"><svg width="16" height="16" fill="none" stroke="#c0392b" stroke-width="1.8" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg></div>
      <div><div class="kpi-num" style="color:#c0392b">${fmtMM(totalVencido)}</div><div class="kpi-lbl">Vencido sin presentar</div></div></div>
    <div class="kpi"><div class="kpi-ico liq"><svg width="16" height="16" fill="none" stroke="#a0620a" stroke-width="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
      <div><div class="kpi-num" style="color:#a0620a">${fmtMM(totalPendiente)}</div><div class="kpi-lbl">Pendiente por presentar</div></div></div>
    <div class="kpi"><div class="kpi-ico ejec"><svg width="16" height="16" fill="none" stroke="#1a8a52" stroke-width="1.8" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
      <div><div class="kpi-num" style="color:#1a8a52">${fmtMM(totalGestionado)}</div><div class="kpi-lbl">Confirmado</div></div></div>`;

  const byWeek=weeks.map(w=>({Anticipo:0,Corte:0,'Liquidación':0,'Retegarantía':0}));
  rows.forEach(h=>{if(!h.semanaDate)return;weeks.forEach((w,i)=>{if(h.semanaDate>=w.start&&h.semanaDate<=w.end)byWeek[i][h.tipo]+=h.valor;});});
  const labels=weeks.map(w=>[`${fcShort(w.start)}–${fcShort(w.end)}`,`Semana ${semanaNumOf(w.start)}`]);
  if(fcSemanaChart)fcSemanaChart.destroy();
  fcSemanaChart=new Chart(document.getElementById('fcSemanaChart'),{type:'bar',
    data:{labels,datasets:['Anticipo','Corte','Liquidación','Retegarantía'].map(t=>({label:t,backgroundColor:TIPO_COLOR_FC[t],data:byWeek.map(w=>w[t]),stack:'s',borderRadius:3}))},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${fmtMM(c.raw)}`}}},
      scales:{x:{stacked:true,grid:{display:false},ticks:{color:"#6b6b66",font:{size:9}},border:{display:false}},
               y:{stacked:true,grid:{color:"#f0efec"},ticks:{color:"#6b6b66",font:{size:10},callback:v=>fmtMM(v)},border:{display:false}}}}});

  const tipoTotals={Anticipo:0,Corte:0,'Liquidación':0,'Retegarantía':0};
  rows.forEach(h=>tipoTotals[h.tipo]+=h.valor);
  const tLabels=Object.keys(tipoTotals),tData=Object.values(tipoTotals),tColors=tLabels.map(l=>TIPO_COLOR_FC[l]);
  if(fcTipoChart)fcTipoChart.destroy();
  fcTipoChart=new Chart(document.getElementById('fcTipoChart'),{type:'doughnut',
    data:{labels:tLabels,datasets:[{data:tData,backgroundColor:tColors,borderWidth:6,borderColor:'#fff',borderRadius:8,spacing:4}]},
    options:{responsive:false,maintainAspectRatio:false,cutout:'58%',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` ${c.label}: ${fmtMM(c.raw)}`}}}}});
  document.getElementById('fc-donut-n').textContent=rows.length;
  document.getElementById('fc-tipo-legend').innerHTML=tLabels.map((l,i)=>`<div class="legend-item"><div class="legend-dot" style="background:${tColors[i]}"></div><span>${l}</span><span class="legend-n">${fmtMM(tData[i])}</span></div>`).join('');

  const vencidosSet=new Set(vencidos);
  const pendRows=rows.filter(h=>h.estado!=='Confirmado'&&!vencidosSet.has(h)).sort((a,b)=>{const av=a.semanaDate?a.semanaDate.getTime():Infinity;const bv=b.semanaDate?b.semanaDate.getTime():Infinity;return av-bv;});
  document.getElementById('fc-hitos-tbody').innerHTML=pendRows.length?pendRows.map(h=>{
    const hbCls=h.estado==='Confirmado'?'hb-cob':'hb-pend';
    return`<tr>
      <td>${h.semanaDate?fcShort(h.semanaDate):'<em style="color:#bbb">Sin fecha</em>'}</td>
      <td class="td-primary">${escapeHtml_(h.proyecto)}</td><td>${escapeHtml_(h.encargado||'')}</td>
      <td><span class="ht ht-${safeHitoTipo_(h.tipo)}">${escapeHtml_(h.label||h.tipo)}</span></td>
      <td class="td-money" style="text-align:right">${fmtMM(h.valor)}</td>
      <td><span class="hb ${hbCls}">${escapeHtml_(h.estado)}</span></td>
      <td style="text-align:center">${presentadoIcon(h,today0)}</td></tr>`;}).join(''):
    '<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px">No hay hitos pendientes con los filtros actuales (los vencidos se muestran en el cuadro de arriba)</td></tr>';

  document.getElementById('fc-proy-tbody').innerHTML=FLUJO_CAJA.filter(fc=>codigosVisibles.has(fc.codigo)).map(fc=>{
    const p=financialProjects.find(x=>x.codigo===fc.codigo);if(!p)return'';
    const programado=fc.hitos.filter(h=>h.tipo!=='Retegarantía').reduce((s,h)=>s+h.valor,0);
    const sinProgramar=Math.max(0,(p.valor||0)-programado);
    const cls=EB[p.estado]||"eb-cerr";
    return`<tr><td class="td-code">${escapeHtml_(p.codigo)}</td><td class="td-primary">${escapeHtml_(p.proyecto)}</td><td>${escapeHtml_(p.encargado)}</td>
      <td><span class="estado-badge ${cls}">${escapeHtml_(p.estado)}</span></td>
      <td class="td-money" style="text-align:right">${fmtMM(p.valor)}</td>
      <td class="td-money" style="text-align:right">${fmtMM(programado)}</td>
      <td style="text-align:right;color:${sinProgramar>0?'#a0620a':'#aaa'}">${sinProgramar>0?fmtMM(sinProgramar):'—'}</td></tr>`;
  }).join('');
}

async function refreshFlujoCaja(){
  const btn=document.getElementById('fc-refresh-btn');
  const timeEl=document.getElementById('fc-refresh-time');
  const fcNote=document.getElementById('fc-note');
  if(btn){btn.disabled=true;btn.textContent='⟳ Actualizando...';}
  if(fcNote){fcNote.style.display='block';fcNote.textContent='⏳ Cargando datos en vivo desde el Google Sheet...';}
  try{
    await loadFlujoCajaLive();
    document.getElementById('topbar-sub').textContent = 'Control de hitos de cobro — próximas 12 semanas' + financialMetaLabel_();
    buildFlujoCaja();
  }catch(err){
    if(fcNote){fcNote.style.display='block';fcNote.textContent='⚠ '+err.message;}
  }
  if(btn){btn.disabled=false;btn.textContent='⟳ Actualizar datos';}
  if(timeEl){
    const now=new Date();
    const fecha=now.toLocaleDateString('es-CO',{day:'2-digit',month:'2-digit',year:'numeric'});
    const hora=now.toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'});
    timeEl.textContent='Última actualización: '+fecha+' · '+hora;
  }
}


/* ═══ FUSIÓN: Resumen Ejecutivo / Directores / Alertas / Comparativo / KPI's ═══ */
const EC={"Finalizado":"#e8622a","En Ejecución":"#f7c400","En Liquidación":"#a82c00","Garantias":"#7a1010","Por Iniciar":"#ffaa44","Cerrado":"#9e8c80"};
const EB={"Finalizado":"eb-fin","En Ejecución":"eb-ejec","En Liquidación":"eb-liq","Garantias":"eb-gar","Por Iniciar":"eb-ini","Cerrado":"eb-cerr"};
const fmtPct=v=>v?v.toFixed(1)+"%":"—";
const hCol=v=>v>=85?"#1a8a52":v>=60?"#c08a00":"#c0392b";
let donutChart,sectorChart,compMesChart,compDirCountChart;

let dropdownFilteredAll = [];
let financialMeta = null;
let checklistAlerts = [];
const MESES_NOM=['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function resetFinancialFilters_(){
  ['fil-anio','fil-mes','fil-enc','fil-sector'].forEach(id => {
    const select = document.getElementById(id);
    while(select && select.options.length > 1) select.remove(1);
  });
}

async function loadFinancialProjects_(action){
  const data = await apiPost_(action);
  if(!data.ok) throw new Error(data.error || 'No se pudo cargar la información financiera.');
  financialProjects = data.proyectos || [];
  dropdownFilteredAll = financialProjects.slice();
  filteredProjects = dropdownFilteredAll.slice();
  financialMeta = {
    fechaCorte:data.fechaCorte,
    fechaActualizacion:data.fechaActualizacion,
    fechaExtraccion:data.fechaExtraccion,
    fuente:data.fuente,
    tipoDato:data.tipoDato
  };
  updateSidebarDataStatus_(data.fechaActualizacion, data.fechaExtraccion);
  resetFinancialFilters_();
  populateFilters();
  return data;
}

function financialMetaLabel_(){
  if(!financialMeta) return '';
  return ` · Corte ${financialMeta.fechaCorte || '—'} · ${financialMeta.tipoDato || 'real'}`;
}

function formatSidebarDate_(value, includeTime){
  const date = new Date(value);
  if(Number.isNaN(date.getTime())) return '—';
  const options = {timeZone:'America/Bogota', day:'2-digit', month:'short', year:'numeric'};
  if(includeTime){ options.hour='2-digit'; options.minute='2-digit'; }
  return date.toLocaleString('es-CO', options).replace(',', ' ·');
}

function updateSidebarDataStatus_(sourceUpdated, extractedAt, persist=true){
  const sourceEl = document.getElementById('sidebar-source-update');
  const extractionEl = document.getElementById('sidebar-data-extraction');
  if(sourceEl) sourceEl.textContent = formatSidebarDate_(sourceUpdated, false);
  if(extractionEl) extractionEl.textContent = extractedAt ? formatSidebarDate_(extractedAt, true) : 'Aún no consultados';
  if(!persist) return;
  try{
    if(sourceUpdated) localStorage.setItem('mn_last_source_update', sourceUpdated);
    if(extractedAt) localStorage.setItem('mn_last_data_extraction', extractedAt);
  }catch(e){ /* El portal sigue funcionando si el almacenamiento está bloqueado. */ }
}

function restoreSidebarDataStatus_(){
  let sourceUpdated = document.lastModified;
  let extractedAt = '';
  try{
    sourceUpdated = localStorage.getItem('mn_last_source_update') || sourceUpdated;
    extractedAt = localStorage.getItem('mn_last_data_extraction') || '';
  }catch(e){ /* Usar la fecha del documento como respaldo. */ }
  updateSidebarDataStatus_(sourceUpdated, extractedAt, false);
}

function populateFilters(){
  const fa=document.getElementById('fil-anio');
  [...new Set(financialProjects.map(p=>p.anio).filter(a=>a))].sort().forEach(a=>{const o=document.createElement('option');o.value=a;o.textContent=a;fa.appendChild(o);});
  const fm=document.getElementById('fil-mes');
  [...new Set(financialProjects.map(p=>p.mes).filter(m=>m))].sort((a,b)=>a-b).forEach(m=>{const o=document.createElement('option');o.value=m;o.textContent=MESES_NOM[m];fm.appendChild(o);});
  const fe=document.getElementById('fil-enc');
  [...new Set(financialProjects.map(p=>p.encargado).filter(Boolean))].sort().forEach(e=>{const o=document.createElement('option');o.textContent=e;fe.appendChild(o);});
  const fs=document.getElementById('fil-sector');
  [...new Set(financialProjects.map(p=>p.sector).filter(s=>s))].sort().forEach(s=>{const o=document.createElement('option');o.value=s;o.textContent=s;fs.appendChild(o);});
}

function applyFilters(){
  const an=document.getElementById('fil-anio').value;
  const mn=document.getElementById('fil-mes').value;
  const en=document.getElementById('fil-enc').value;
  const es=document.getElementById('fil-estado').value;
  const sc=document.getElementById('fil-sector').value;
  dropdownFilteredAll = financialProjects.filter(p=>{
    if(an!=='todos'&&p.anio!=an)return false;
    if(mn!=='todos'&&p.mes!=mn)return false;
    if(en!=='todos'&&p.encargado!==en)return false;
    if(es!=='todos'&&p.estado!==es)return false;
    if(sc!=='todos'&&p.sector!==sc)return false;
    return true;
  });
  computeFilteredProjects();
  rebuildCurrentFinancialView();
}

function rebuildCurrentFinancialView(){
  // Vuelve a dibujar solo la vista financiera que esté activa en este momento
  if(currentView === 'kpis'){ buildKPIs(); buildFinanceBar(); buildDonut(); buildHealth(); buildSector(); }
  else if(currentView === 'resumen'){ buildRisks(); buildActions(); }
  else if(currentView === 'alertas'){ buildAlertas(); }
  else if(currentView === 'directores'){ buildDirectores(); closeDrawer(); }
  else if(currentView === 'comparativo'){ buildComparativo(); }
  else if(currentView === 'todos-proyectos'){ buildEstadoFiltersTodos(); buildTodosProyectosTabla(null); }
}

function computeFilteredProjects(){
  // El backend ya devolvió exclusivamente los proyectos autorizados.
  filteredProjects = dropdownFilteredAll.slice();
}

function buildKPIs(){
  const fp=dropdownFilteredAll; // KPI's: visible a todos, filtrable por los desplegables, sin restricción de rol
  const kpis=[
    {n:fp.length,l:"Total proyectos",ic:"total",c:"#e8622a"},
    {n:fp.filter(p=>p.estado==="Finalizado").length,l:"Finalizados",ic:"fin",c:"#5a8a5a"},
    {n:fp.filter(p=>p.estado==="En Ejecución").length,l:"En ejecución",ic:"ejec",c:"#1a8a52"},
    {n:fp.filter(p=>p.estado==="En Liquidación").length,l:"En liquidación",ic:"liq",c:"#c08a00"},
    {n:fp.filter(p=>p.estado==="Por Iniciar").length,l:"Por iniciar",ic:"ini",c:"#4a3aa7"},
    {n:fp.filter(p=>p.estado==="Cerrado").length,l:"Cerrados",ic:"cerr",c:"#6b6b66"},
    {n:fp.filter(p=>p.estado==="Garantias").length,l:"Garantías",ic:"gar",c:"#1a5fa5"},
  ];
  const svgs=['<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>','<circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/>','<polygon points="5 3 19 12 5 21 5 3"/>','<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>','<path d="M5 12l5-5 5 5 5-5"/>','<polyline points="20 6 9 17 4 12"/>','<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'];
  const el=document.getElementById('kpi-strip');
  if(el)el.innerHTML=kpis.map((k,i)=>`
    <div class="kpi"><div class="kpi-ico ${k.ic}"><svg width="16" height="16" fill="none" stroke="${k.c}" stroke-width="1.8" viewBox="0 0 24 24">${svgs[i]}</svg></div>
    <div><div class="kpi-num">${k.n}</div><div class="kpi-lbl">${k.l}</div></div></div>`).join('');
}

function buildFinanceBar(){
  const fp=dropdownFilteredAll; // igual que KPIs: visible a todos, filtrable por los desplegables
  const tv=fp.reduce((a,p)=>a+(p.valor||0),0);
  const tf=fp.reduce((a,p)=>a+(p.pxFacturar||0),0);
  const tc=fp.reduce((a,p)=>a+(p.pxCobrar||0),0);
  const as=fp.filter(p=>p.difSNpct>0).length?fp.reduce((a,p)=>a+(p.difSNpct||0),0)/fp.filter(p=>p.difSNpct>0).length:0;
  const ac=fp.filter(p=>p.difCNpct>0&&p.difCNpct<200).length?fp.reduce((a,p)=>a+(p.difCNpct<200?p.difCNpct||0:0),0)/fp.filter(p=>p.difCNpct>0&&p.difCNpct<200).length:0;
  const el=document.getElementById('finance-bar');
  if(el)el.innerHTML=`
    <div class="finance-bar-lbl">Desempeño<br>financiero</div>
    <div class="finance-item"><div class="fn">${fmtMM(tv)}</div><div class="fl">Valor total (COP)</div></div>
    <div class="finance-item"><div class="fn">${fmtMM(tf)}</div><div class="fl">Pendiente facturar</div><div class="fd neg">▼ Gestión requerida</div></div>
    <div class="finance-item"><div class="fn">${fmtMM(tc)}</div><div class="fl">Pendiente cobrar</div><div class="fd neg">▼ Cartera activa</div></div>
    <div class="finance-item"><div class="fn">${as.toFixed(1)}%</div><div class="fl">Diferencia SN prom.</div></div>
    <div class="finance-item"><div class="fn">${ac.toFixed(1)}%</div><div class="fl">Diferencia CN prom.</div></div>`;
}

function buildDonut(){
  const fp=dropdownFilteredAll;
  const counts={};fp.forEach(p=>{counts[p.estado]=(counts[p.estado]||0)+1;});
  const labels=Object.keys(counts),data=labels.map(l=>counts[l]),colors=labels.map(l=>EC[l]||"#888");
  const canvas=document.getElementById('donutChart');
  if(!canvas)return;
  if(donutChart)donutChart.destroy();
  donutChart=new Chart(canvas,{
    type:'doughnut',
    data:{labels,datasets:[{data,backgroundColor:colors,borderWidth:6,borderColor:'#faf9f7',borderRadius:8,spacing:4,hoverOffset:8}]},
    options:{responsive:false,maintainAspectRatio:false,cutout:'58%',
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${ctx.label}: ${ctx.raw} (${Math.round(ctx.raw/fp.length*100)}%)`}}},
      animation:{animateRotate:true,duration:700}
    }
  });
  document.getElementById('donut-center-text').innerHTML=`<div class="donut-big-n">${fp.length}</div><div class="donut-sub">proyectos</div>`;
  document.getElementById('donut-legend').innerHTML=labels.map((l,i)=>`<div class="legend-item"><div class="legend-dot" style="background:${colors[i]}"></div><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${l}</span><span class="legend-n">${data[i]}</span></div>`).join('');
}

function buildHealth(){
  const fp=dropdownFilteredAll;
  const total=fp.reduce((s,p)=>s+(p.valor||0),0);
  const promedio=(campo,def=0)=>fp.length?fp.reduce((s,p)=>s+(Number(p[campo])||0),0)/fp.length:def;
  const items=[
    {lbl:"Cronograma",pct:Math.round(promedio('avObra'))},
    {lbl:"Financiero",pct:Math.round(Math.max(0,100-promedio('difSNpct')))},
    {lbl:"Facturación",pct:Math.round(total?Math.max(0,100-fp.reduce((s,p)=>s+(p.pxFacturar||0),0)/total*100):0)},
    {lbl:"Cartera",pct:Math.round(total?Math.max(0,100-fp.reduce((s,p)=>s+(p.pxCobrar||0),0)/total*100):0)},
    {lbl:"Liquidación",pct:Math.round(promedio('avLiq'))}
  ];
  const el=document.getElementById('health-list');
  if(el)el.innerHTML=items.map(h=>`<div class="health-row"><div class="health-lbl">${h.lbl}</div><div class="hbar-bg"><div class="hbar-fill" style="width:${h.pct}%;background:${hCol(h.pct)}"></div></div><div class="health-pct" style="color:${hCol(h.pct)}">${h.pct}%</div><div class="hdot" style="background:${hCol(h.pct)}"></div></div>`).join('');
}

function buildSector(){
  const sec={};dropdownFilteredAll.forEach(p=>{if(p.sector)sec[p.sector]=(sec[p.sector]||0)+1;});
  const sorted=Object.entries(sec).sort((a,b)=>b[1]-a[1]);
  const colors=["#e8622a","#f5a623","#d94f00","#f7c948","#c0392b","#8c7b6e","#e8905a"];
  const canvas=document.getElementById('sectorChart');
  if(!canvas)return;
  if(sectorChart)sectorChart.destroy();
  sectorChart=new Chart(canvas,{type:'bar',data:{labels:sorted.map(s=>s[0]),datasets:[{data:sorted.map(s=>s[1]),backgroundColor:colors,borderRadius:4,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:"#6b6b66",font:{size:10}},border:{display:false}},y:{grid:{display:false},ticks:{color:"#6b6b66",font:{size:10}},border:{display:false}}}}});
}

function buildRisks(){
  const risks=[];
  filteredProjects.forEach(p=>{
    if((p.dias||0)>30) risks.push({proj:`${p.proyecto} — ${p.codigo}`,desc:`Retraso registrado de ${p.dias} días.`,nivel:'alta',score:300+p.dias});
    if((p.difSNpct||0)>30) risks.push({proj:`${p.proyecto} — ${p.codigo}`,desc:`Diferencia SN de ${fmtPct(p.difSNpct)}.`,nivel:p.difSNpct>40?'alta':'media',score:200+p.difSNpct});
    if((p.pxCobrar||0)>0) risks.push({proj:`${p.proyecto} — ${p.codigo}`,desc:`Pendiente por cobrar: ${fmtMM(p.pxCobrar)}.`,nivel:p.pxCobrar>500000000?'alta':'media',score:100+Math.min(p.pxCobrar/10000000,99)});
  });
  risks.sort((a,b)=>b.score-a.score);
  const visibles=risks.slice(0,6);
  const el=document.getElementById('risk-list');
  if(el)el.innerHTML=visibles.length?visibles.map(r=>`<div class="risk-row"><span class="rbadge ${r.nivel}">${r.nivel.toUpperCase()}</span><div><div class="risk-proj">${escapeHtml_(r.proj)}</div><div class="risk-desc">${escapeHtml_(r.desc)}</div></div></div>`).join(''):'<div class="fase-empty">Sin riesgos financieros críticos con los datos actuales.</div>';
}

function buildActions(){
  const actions=[];
  filteredProjects.forEach(p=>{
    if((p.pxCobrar||0)>0) actions.push({proj:p.proyecto,desc:`Gestionar cartera pendiente por ${fmtMM(p.pxCobrar)}`,resp:p.encargado||'Sin asignar',prio:p.pxCobrar>500000000?'alta':'media',score:p.pxCobrar});
    else if((p.pxFacturar||0)>0) actions.push({proj:p.proyecto,desc:`Gestionar facturación pendiente por ${fmtMM(p.pxFacturar)}`,resp:p.encargado||'Sin asignar',prio:'media',score:p.pxFacturar});
  });
  actions.sort((a,b)=>b.score-a.score);
  const visibles=actions.slice(0,6);
  const el=document.getElementById('action-list');
  if(el)el.innerHTML=visibles.length?visibles.map(a=>`<div class="action-row"><div class="aproj">${escapeHtml_(a.proj)}</div><div class="adesc">${escapeHtml_(a.desc)}</div><div class="aresp">${escapeHtml_(a.resp)}</div><span class="pbadge ${a.prio}">${a.prio.toUpperCase()}</span></div>`).join(''):'<div class="fase-empty">Sin acciones financieras pendientes.</div>';
}

function buildDirectores(){
  const dirs={};
  filteredProjects.forEach(p=>{if(!dirs[p.encargado])dirs[p.encargado]={name:p.encargado,cargo:p.cargo,proyectos:[],totalValor:0,totalCobrar:0};dirs[p.encargado].proyectos.push(p);dirs[p.encargado].totalValor+=p.valor||0;dirs[p.encargado].totalCobrar+=p.pxCobrar||0;});
  const directorList=Object.values(dirs);
  const grid=document.getElementById('dir-grid');
  grid.innerHTML=directorList.map((d,index)=>{
    const ejec=d.proyectos.filter(p=>p.estado==="En Ejecución").length;
    const liq=d.proyectos.filter(p=>p.estado==="En Liquidación").length;
    const avProm=d.proyectos.length?Math.round(d.proyectos.reduce((a,p)=>a+(p.avObra||0),0)/d.proyectos.length):0;
    const initials=d.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
    const avC=hCol(avProm);
    const ccvArr=d.proyectos.filter(p=>p.difCNpct!=null&&p.difCNpct!==0);
    const scvArr=d.proyectos.filter(p=>p.difSNpct!=null&&p.difSNpct!==0);
    const avgCCV=ccvArr.length?ccvArr.reduce((s,p)=>s+(p.difCNpct||0),0)/ccvArr.length:null;
    const avgSCV=scvArr.length?scvArr.reduce((s,p)=>s+(p.difSNpct||0),0)/scvArr.length:null;
    const fmtDif=(v,n)=>v==null?`<span style="color:#aaa">—</span>`:`<span style="color:${v>=0?'#1a8a52':'#c0392b'}">${v>=0?'+':''}${v.toFixed(1)}%</span><span style="font-size:9px;color:#aaa;margin-left:3px">(${n} proy.)</span>`;
    return`<div class="dir-card" data-director-index="${index}">
      <div class="dir-head"><div class="dir-av">${escapeHtml_(initials)}</div><div><div class="dir-name">${escapeHtml_(d.name)}</div><div class="dir-cargo">${escapeHtml_(d.cargo)}</div></div></div>
      <div class="dir-kpis">
        <div class="dir-kpi"><div class="dir-kpi-n">${d.proyectos.length}</div><div class="dir-kpi-l">Proyectos</div></div>
        <div class="dir-kpi"><div class="dir-kpi-n">${ejec}</div><div class="dir-kpi-l">En ejec.</div></div>
        <div class="dir-kpi"><div class="dir-kpi-n">${liq}</div><div class="dir-kpi-l">En liq.</div></div>
      </div>
      <div class="dir-fin">
        <div class="dir-fin-item"><div class="dir-fin-v">${fmtMM(d.totalValor)}</div><div class="dir-fin-l">Valor portafolio</div></div>
        <div class="dir-fin-item"><div class="dir-fin-v" style="color:#c0392b">${fmtMM(d.totalCobrar)}</div><div class="dir-fin-l">Pend. cobrar</div></div>
      </div>
      <div class="dir-dif-row">
        <div class="dir-dif-item"><div class="dir-dif-l">Dif. CCV% prom.</div><div class="dir-dif-v">${fmtDif(avgCCV,ccvArr.length)}</div></div>
        <div class="dir-dif-item"><div class="dir-dif-l">Dif. SCV% prom.</div><div class="dir-dif-v">${fmtDif(avgSCV,scvArr.length)}</div></div>
      </div>
      <div class="dir-av-row"><div class="dir-av-lbl">Avance prom.</div><div class="dir-av-bg"><div class="dir-av-fill" style="width:${avProm}%;background:${avC}"></div></div><div class="dir-pct" style="color:${avC}">${avProm}%</div></div>
    </div>`;}).join('');
  grid.querySelectorAll('[data-director-index]').forEach(card=>{
    const director=directorList[Number(card.dataset.directorIndex)];
    card.addEventListener('click',()=>openDrawer(director.name));
  });
}

function openDrawer(dirName){
  document.querySelectorAll('.dir-card').forEach(c=>c.classList.remove('selected'));
  const card=[...document.querySelectorAll('.dir-card')].find(c=>{
    const index=Number(c.dataset.directorIndex);
    return Object.keys(c.dataset).includes('directorIndex') && index>=0 && c.querySelector('.dir-name')?.textContent===dirName;
  });
  if(card)card.classList.add('selected');
  const projs=filteredProjects.filter(p=>p.encargado===dirName);
  const EC_local={"Finalizado":"#5a8a5a","En Ejecución":"#1a8a52","En Liquidación":"#c08a00","Garantias":"#1a5fa5","Por Iniciar":"#4a3aa7","Cerrado":"#6b6b66"};
  const rows=projs.map(p=>{
    const ccvC=p.difCNpct>0?'#1a8a52':p.difCNpct<0?'#c0392b':'#aaa';
    const scvC=p.difSNpct>0?'#1a8a52':p.difSNpct<0?'#c0392b':'#aaa';
    const est=`<span style="background:${EC_local[p.estado]||'#888'};color:#fff;padding:2px 7px;border-radius:10px;font-size:9px;font-weight:600">${escapeHtml_(p.estado)}</span>`;
    const dCCV=p.difCNpct!=null&&p.difCNpct!==0?`<span style="color:${ccvC}">${p.difCNpct>0?'+':''}${p.difCNpct.toFixed(1)}%</span>`:'<span style="color:#aaa">—</span>';
    const dSCV=p.difSNpct!=null&&p.difSNpct!==0?`<span style="color:${scvC}">${p.difSNpct>0?'+':''}${p.difSNpct.toFixed(1)}%</span>`:'<span style="color:#aaa">—</span>';
    const fac=p.pxFacturar>0?`<span style="color:#c08a00">${fmtMM(p.pxFacturar)}</span>`:'<span style="color:#aaa">—</span>';
    const cob=p.pxCobrar>0?`<span style="color:#c0392b">${fmtMM(p.pxCobrar)}</span>`:'<span style="color:#aaa">—</span>';
    return `<tr>
      <td style="font-weight:600;color:#666">${escapeHtml_(p.codigo)}</td>
      <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis" title="${escapeHtml_(p.proyecto)}">${escapeHtml_(p.proyecto)}</td>
      <td>${est}</td>
      <td style="text-align:right">${fmtMM(p.valor)}</td>
      <td style="text-align:right">${dCCV}</td>
      <td style="text-align:right">${dSCV}</td>
      <td style="text-align:right">${fac}</td>
      <td style="text-align:right">${cob}</td>
      <td style="text-align:right">${p.avObra!=null?p.avObra+'%':'—'}</td>
    </tr>`;
  }).join('');
  const totVal=projs.reduce((s,p)=>s+(p.valor||0),0);
  const totFac=projs.reduce((s,p)=>s+(p.pxFacturar||0),0);
  const totCob=projs.reduce((s,p)=>s+(p.pxCobrar||0),0);
  document.getElementById('dir-drawer-ttl').textContent=dirName;
  document.getElementById('dir-drawer-body').innerHTML=rows;
  const ccvArr2=projs.filter(p=>p.difCNpct!=null&&p.difCNpct!==0);
  const scvArr2=projs.filter(p=>p.difSNpct!=null&&p.difSNpct!==0);
  const avgCCV2=ccvArr2.length?ccvArr2.reduce((s,p)=>s+p.difCNpct,0)/ccvArr2.length:null;
  const avgSCV2=scvArr2.length?scvArr2.reduce((s,p)=>s+p.difSNpct,0)/scvArr2.length:null;
  const fmtAvg=(v,el)=>{if(v==null){el.textContent='—';el.style.color='#aaa';return;}
    el.textContent=(v>0?'+':'')+v.toFixed(1)+'%';el.style.color=v>=0?'#1a8a52':'#c0392b';};
  document.getElementById('tot-n').textContent=projs.length+' proyectos';
  document.getElementById('tot-val').textContent=fmtMM(totVal);
  document.getElementById('tot-fac').textContent=totFac>0?fmtMM(totFac):'—';
  document.getElementById('tot-cob').textContent=totCob>0?fmtMM(totCob):'—';
  fmtAvg(avgCCV2,document.getElementById('tot-ccv'));
  fmtAvg(avgSCV2,document.getElementById('tot-scv'));
  document.getElementById('dir-drawer').classList.add('open');
}
function closeDrawer(){
  document.getElementById('dir-drawer').classList.remove('open');
  document.querySelectorAll('.dir-card').forEach(c=>c.classList.remove('selected'));
}

/* Alertas: visible a TODOS los roles, pero filtrado por los proyectos que
   cada quien puede ver (filteredProjects). Nota: para Residente, hoy esto
   sale vacío por la misma limitación de datos explicada en computeFilteredProjects. */
function buildAlertas(){
  const base=filteredProjects;
  const rol=getSession().rol;
  const mostrarFinanzas=['Director','Gerente','Admin'].includes(rol);
  ['financial-alerts-observations','financial-alerts-grid'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.style.display=mostrarFinanzas?(id==='financial-alerts-grid'?'grid':'block'):'none';
  });
  const commentsEl=document.getElementById('checklist-comments-list');
  if(commentsEl){
    commentsEl.innerHTML=checklistAlerts.length?checklistAlerts.map(c=>{
      const fecha=formatSidebarDate_(c.fecha,true);
      const estadoClase=['Aprobado','Incompleto','Rechazado','No Aplica'].includes(c.estado)?c.estado.toLowerCase().replace(/\s+/g,'-'):'pendiente';
      return `<div class="checklist-comment-alert">
        <div class="checklist-comment-head"><span class="obs-code">${escapeHtml_(c.codigo)}</span><strong>${escapeHtml_(c.proyecto||c.subcarpeta||'Documento')}</strong><span class="comment-state ${estadoClase}">${escapeHtml_(c.estado||'Pendiente')}</span></div>
        <div class="checklist-comment-doc">${escapeHtml_(c.subcarpeta||c.documento||'')}</div>
        <div class="checklist-comment-text">${escapeHtml_(c.comentario)}</div>
        <div class="checklist-comment-meta">${escapeHtml_(c.autor)} · ${escapeHtml_(c.rol)} · ${escapeHtml_(fecha)}</div>
      </div>`;
    }).join(''):'<div class="fase-empty">Todavía no hay comentarios de revisión.</div>';
  }
  const note=document.getElementById('alertas-scope-note');
  if(note){
    if(mostrarFinanzas&&base.length===0){
      note.style.display='block';
      note.textContent='⚠ No se encontraron proyectos asociados a tu usuario en la base de datos financiera todavía. Habla con tu Gerente para que se agregue tu nombre como responsable en el proyecto correspondiente.';
    } else note.style.display='none';
  }
  const withObs=base.filter(p=>p.obs&&p.obs.length>5);
  document.getElementById('obs-list').innerHTML=withObs.length?withObs.map(p=>`<div class="obs-row"><span class="obs-code">${escapeHtml_(p.codigo)}</span><span class="obs-txt"><strong style="color:#1a1a1a">${escapeHtml_(p.proyecto)}</strong> — ${escapeHtml_(p.obs)}</span></div>`).join(''):'<div style="font-size:11px;color:#6b6b66;padding:8px 0">Sin observaciones críticas.</div>';
  const delayed=base.filter(p=>p.dias>10).sort((a,b)=>b.dias-a.dias);
  document.getElementById('delay-list').innerHTML=delayed.length?delayed.map(p=>`<div class="risk-row"><span class="rbadge ${p.dias>50?'alta':'media'}">${p.dias}d</span><div><div class="risk-proj">${escapeHtml_(p.proyecto)}</div><div class="risk-desc">${escapeHtml_(p.encargado)} — ${escapeHtml_(p.estado)}</div></div></div>`).join(''):'<div style="font-size:11px;color:#6b6b66;padding:8px 0">Sin retrasos significativos.</div>';
  const highSN=base.filter(p=>p.difSNpct>30&&p.difSNpct<200).sort((a,b)=>b.difSNpct-a.difSNpct);
  document.getElementById('margin-list').innerHTML=highSN.length?highSN.map(p=>`<div class="risk-row"><span class="rbadge alta">${fmtPct(p.difSNpct)}</span><div><div class="risk-proj">${escapeHtml_(p.proyecto)}</div><div class="risk-desc">${escapeHtml_(p.encargado)} — ${escapeHtml_(p.estado)}</div></div></div>`).join(''):'<div style="font-size:11px;color:#6b6b66;padding:8px 0">Sin diferencias críticas.</div>';
}

function buildComparativo(){
  const p25=filteredProjects.filter(p=>p.anio===2025);
  const p26=filteredProjects.filter(p=>p.anio===2026);
  function yrCard(pp){
    const val=pp.reduce((s,p)=>s+p.valor,0);
    const abonos=pp.reduce((s,p)=>s+p.vPagado,0);
    const fin=pp.filter(p=>p.estado==='Finalizado'||p.estado==='Cerrado').length;
    const ejec=pp.filter(p=>p.estado==='En Ejecución').length;
    const mgnArr=pp.filter(p=>p.difSNpct>0);
    const mgn=mgnArr.length?mgnArr.reduce((s,p)=>s+p.difSNpct,0)/mgnArr.length:0;
    return [
      {n:pp.length,     l:'Proyectos'},
      {n:fmtMM(val),    l:'Valor CCV'},
      {n:fmtMM(abonos), l:'Abonos'},
      {n:fin,           l:'Finalizados'},
      {n:ejec,          l:'En Ejecución'},
      {n:mgn.toFixed(1)+'%', l:'Margen SCV'}
    ].map(k=>`<div class="cmp-kpi"><div class="cmp-kpi-n">${k.n}</div><div class="cmp-kpi-l">${k.l}</div></div>`).join('');
  }
  document.getElementById('cmp-kpi-25').innerHTML=yrCard(p25);
  document.getElementById('cmp-kpi-26').innerHTML=yrCard(p26);
  const chOpts=(fmt)=>({
    responsive:true,maintainAspectRatio:false,
    plugins:{legend:{position:'top',labels:{boxWidth:10,font:{size:11}}},
      tooltip:{callbacks:{label:c=>c.dataset.label+': '+fmt(c.raw)}}},
    scales:{y:{ticks:{callback:v=>fmt(v)},grid:{color:'rgba(0,0,0,.04)'}},
            x:{grid:{display:false},ticks:{font:{size:10},maxRotation:45}}}
  });
  const meses=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const mv25=meses.map((_,i)=>Math.round(p25.filter(p=>(p.estado==='Finalizado'||p.estado==='Cerrado')&&p.mes===i+1).reduce((s,p)=>s+p.valor,0)/1e6));
  const mv26=meses.map((_,i)=>Math.round(p26.filter(p=>(p.estado==='Finalizado'||p.estado==='Cerrado')&&p.mes===i+1).reduce((s,p)=>s+p.valor,0)/1e6));
  if(compMesChart)compMesChart.destroy();
  compMesChart=new Chart(document.getElementById('compMesChart'),{type:'bar',
    data:{labels:meses,datasets:[
      {label:'2025',data:mv25,backgroundColor:'#f5a623',borderRadius:4,barPercentage:.65},
      {label:'2026',data:mv26,backgroundColor:'#e8622a',borderRadius:4,barPercentage:.65}
    ]},options:chOpts(v=>'$'+v+' M')});
  const dirs=[...new Set(filteredProjects.map(p=>p.encargado))].sort();
  const c25=dirs.map(d=>p25.filter(p=>p.encargado===d).length);
  const c26=dirs.map(d=>p26.filter(p=>p.encargado===d).length);
  if(compDirCountChart)compDirCountChart.destroy();
  compDirCountChart=new Chart(document.getElementById('compDirCountChart'),{type:'bar',
    data:{labels:dirs,datasets:[
      {label:'2025',data:c25,backgroundColor:'#f5a623',borderRadius:4,barPercentage:.7},
      {label:'2026',data:c26,backgroundColor:'#e8622a',borderRadius:4,barPercentage:.7}
    ]},options:chOpts(v=>v+' proy.')});
  const sects=[...new Set(filteredProjects.map(p=>p.sector).filter(Boolean))].sort();
  const rows=sects.map(s=>{
    const s25=p25.filter(p=>p.sector===s);
    const s26=p26.filter(p=>p.sector===s);
    return `<tr><td>${s}</td><td>${s25.length} proy. &nbsp;${fmtMM(s25.reduce((a,p)=>a+p.valor,0))}</td><td>${s26.length} proy. &nbsp;${fmtMM(s26.reduce((a,p)=>a+p.valor,0))}</td></tr>`;
  }).join('');
  document.getElementById('comp-sector-table').innerHTML=`
    <table class="comp-table">
      <thead><tr><th>Sector</th><th>2025</th><th>2026</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}


const FASE_ORDER = ['Inicio','Planeación','Ejecución','Cierre','Seguimiento y control'];
let currentProject = null;
let currentFaseIndex = 0;
let currentView = 'projects'; // 'projects' | 'timeline'

function handleSessionError_(note, message){
  note.className = 'load-note error';
  note.textContent = '⚠ ' + message;
  if(/sesi[oó]n/i.test(message)){
    note.textContent += ' Redirigiendo al login...';
    setTimeout(doLogout, 1800);
  }
}

/* FASE 2 — Nunca insertar directamente en HTML valores de Sheets/Drive. */
function escapeHtml_(value){
  return String(value == null ? '' : value).replace(/[&<>'"]/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
  })[c]);
}
function safeHitoTipo_(value){
  return ['Anticipo','Corte','Liquidación','Retegarantía'].includes(value) ? value : 'Corte';
}
function safeDriveUrl_(value){
  const url = String(value || '').trim();
  return /^https:\/\/drive\.google\.com\/(?:drive\/(?:u\/\d+\/)?folders|folders)\/[A-Za-z0-9_-]+(?:[/?#].*)?$/i.test(url) ? url : '';
}

function saveSession(token, nombre, rol, correo, expiresAt){
  sessionStorage.setItem('mn_token', token);
  sessionStorage.setItem('mn_nombre', nombre);
  sessionStorage.setItem('mn_rol', rol);
  sessionStorage.setItem('mn_correo', correo || '');
  sessionStorage.setItem('mn_expires_at', String(expiresAt || ''));
}
function getSession(){
  const session = {
    token: sessionStorage.getItem('mn_token'),
    nombre: sessionStorage.getItem('mn_nombre'),
    rol: sessionStorage.getItem('mn_rol'),
    correo: sessionStorage.getItem('mn_correo'),
    expiresAt: Number(sessionStorage.getItem('mn_expires_at') || 0)
  };
  if(session.token && session.expiresAt && Date.now() >= session.expiresAt){
    clearSession();
    return {token:null,nombre:null,rol:null,correo:null,expiresAt:0};
  }
  return session;
}
function clearSession(){
  ['mn_token','mn_nombre','mn_rol','mn_correo','mn_expires_at'].forEach(key => sessionStorage.removeItem(key));
}

async function apiPost_(action, payload, incluirSesion = true){
  const body = Object.assign({action}, payload || {});
  if(incluirSesion && !body.token) body.token = getSession().token;
  const res = await fetch(API_URL, {method:'POST', body:JSON.stringify(body)});
  return res.json();
}

async function handleGoogleCredential(response){
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  const note = document.getElementById('login-progress');
  note.textContent = 'Verificando tu cuenta corporativa...';
  try{
    const data = await apiPost_('google_login', {credential:response && response.credential}, false);
    if(data.ok){
      saveSession(data.token, data.nombre, data.rol, data.correo, data.expiresAt);
      enterApp();
    } else {
      errEl.textContent = data.error || 'No fue posible autorizar la cuenta.';
    }
  }catch(e){
    errEl.textContent = 'No se pudo conectar con el servidor.';
  }
  note.textContent = '';
}

function initGoogleIdentity_(intento = 0){
  const errEl = document.getElementById('login-error');
  if(GOOGLE_CLIENT_ID.indexOf('CONFIGURA_') === 0){
    errEl.textContent = 'Falta configurar el Client ID corporativo de Google.';
    return;
  }
  if(!window.google || !google.accounts || !google.accounts.id){
    if(intento < 20){
      setTimeout(() => initGoogleIdentity_(intento + 1), 250);
      return;
    }
    errEl.textContent = 'No fue posible cargar el acceso de Google. Revisa la conexión y actualiza la página.';
    return;
  }
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredential,
    hd: WORKSPACE_DOMAIN,
    auto_select: false,
    cancel_on_tap_outside: true
  });
  google.accounts.id.renderButton(document.getElementById('google-signin-button'), {
    type:'standard', theme:'outline', size:'large', text:'signin_with', shape:'rectangular', width:268, locale:'es'
  });
}

async function doLogout(){
  const token = getSession().token;
  clearSession();
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  if(window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
  if(token){
    try{ await apiPost_('logout', {token}, false); }catch(e){ /* la sesión local ya fue eliminada */ }
  }
}

const ALL_VIEW_IDS = ['view-projects','view-timeline','view-new-project','view-flujocaja','view-kpis','view-resumen','view-alertas','view-directores','view-residentes','view-contratistas','view-comparativo','view-todos-proyectos'];
function hideAllViews(){
  ALL_VIEW_IDS.forEach(id => { const el = document.getElementById(id); if(el) el.style.display = 'none'; });
}

function enterApp(){
  const s = getSession();
  const userInfo = document.getElementById('user-info');
  const strong = document.createElement('strong');
  strong.textContent = s.nombre || '';
  userInfo.replaceChildren(strong, document.createElement('br'), document.createTextNode(s.rol || ''));
  restoreSidebarDataStatus_();
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  const esGerencia = s.rol === 'Gerente' || s.rol === 'Admin';
  const esGerenteEquipo = s.rol === 'Gerente';
  const puedeVerFinanzas = s.rol === 'Director' || esGerencia;
  ['nav-todos-proyectos','nav-kpis','nav-resumen','nav-flujo-caja'].forEach(id => {
    const modulo = document.getElementById(id);
    if(modulo) modulo.style.display = puedeVerFinanzas ? 'flex' : 'none';
  });
  document.getElementById('nav-alertas').style.display = 'flex';
  ['nav-directores','nav-residentes','nav-contratistas'].forEach(id => {
    const modulo = document.getElementById(id);
    if(modulo) modulo.style.display = esGerenteEquipo ? 'flex' : 'none';
  });
  document.getElementById('nav-section-equipo').style.display = esGerenteEquipo ? 'block' : 'none';
  document.getElementById('nav-comparativo').style.display = esGerencia ? 'flex' : 'none';
  document.getElementById('subtab-resumen').style.display = puedeVerFinanzas ? 'inline-block' : 'none';
  document.getElementById('nav-nuevo-proyecto').style.display = esGerencia ? 'flex' : 'none';
  goToProjectList();
}

function moduloEnContencion_(nombre){
  return false;
}

function refreshCurrentView(){
  if(currentView === 'projects') loadProjects();
  else if(currentView === 'timeline') loadProjectChecklist(currentProject.codigo);
}

function setActiveNav(id){
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const el = document.getElementById(id);
  if(el) el.classList.add('active');
}

function showFilters(show){
  document.getElementById('topbar-filters').style.display = show ? 'flex' : 'none';
}

function goToProjectList(){
  currentView = 'projects';
  hideAllViews();
  showFilters(false);
  document.getElementById('view-projects').style.display = 'block';
  document.getElementById('topbar-title').textContent = 'MIS PROYECTOS';
  document.getElementById('topbar-sub').textContent = 'Proyectos asignados a tu usuario';
  document.getElementById('refresh-btn').style.display = 'inline-block';
  setActiveNav('nav-mis-proyectos');
  loadProjects();
}

function goToFlujoCaja(){
  if(moduloEnContencion_('Flujo de Caja')) return;
  const s = getSession();
  if(!(s.rol === 'Director' || s.rol === 'Gerente' || s.rol === 'Admin')) return; // respaldo; el nav ya está oculto
  currentView = 'flujocaja';
  hideAllViews();
  showFilters(true);
  document.getElementById('view-flujocaja').style.display = 'block';
  document.getElementById('topbar-title').textContent = 'FLUJO DE CAJA';
  document.getElementById('topbar-sub').textContent = 'Control de hitos de cobro — próximas 12 semanas';
  document.getElementById('refresh-btn').style.display = 'none'; // esta vista tiene su propio botón "Actualizar"
  setActiveNav('nav-flujo-caja');
  refreshFlujoCaja();
}

async function goToTodosProyectos(){
  if(moduloEnContencion_('Todos los Proyectos')) return;
  const s = getSession();
  if(!(s.rol === 'Director' || s.rol === 'Gerente' || s.rol === 'Admin')) return;
  currentView = 'todos-proyectos';
  hideAllViews();
  showFilters(true);
  document.getElementById('view-todos-proyectos').style.display = 'block';
  document.getElementById('topbar-title').textContent = 'TODOS LOS PROYECTOS';
  document.getElementById('topbar-sub').textContent = s.rol === 'Director' ? 'Todo tu portafolio, activo e histórico' : 'Portafolio completo de Mínima Arquitectos';
  document.getElementById('refresh-btn').style.display = 'none';
  setActiveNav('nav-todos-proyectos');
  try{
    await loadFinancialProjects_('proyectos_financieros');
    document.getElementById('topbar-sub').textContent += financialMetaLabel_();
    buildEstadoFiltersTodos();
    buildTodosProyectosTabla(null);
  }catch(err){ alert('No se pudo cargar el portafolio financiero: '+err.message); }
}

function buildEstadoFiltersTodos(){
  const estados = ['Todos','Finalizado','En Ejecución','En Liquidación','Garantias','Por Iniciar','Cerrado'];
  const el = document.getElementById('estado-filters-todos');
  el.innerHTML = '';
  estados.forEach((e,i) => {
    const btn = document.createElement('button');
    btn.className = 'pfbtn' + (i===0 ? ' active' : '');
    btn.textContent = e + (e!=='Todos' ? ' (' + filteredProjects.filter(p=>p.estado===e).length + ')' : '');
    btn.onclick = function(){
      document.querySelectorAll('#estado-filters-todos .pfbtn').forEach(b=>b.classList.remove('active'));
      this.classList.add('active');
      buildTodosProyectosTabla(e==='Todos' ? null : e);
    };
    el.appendChild(btn);
  });
}

function buildTodosProyectosTabla(estadoFiltro){
  const fp = estadoFiltro ? filteredProjects.filter(p=>p.estado===estadoFiltro) : filteredProjects;
  document.getElementById('todos-proyectos-tbody').innerHTML = fp.map(p => {
    const cls = EB[p.estado] || 'eb-cerr';
    const avC = p.avObra>=75 ? '#1a8a52' : p.avObra>=40 ? '#c08a00' : '#c0392b';
    const snC = p.difSNpct>35 ? 'td-neg' : p.difSNpct>25 ? 'td-warn' : 'td-ok';
    return `<tr>
      <td class="td-code">${escapeHtml_(p.codigo)}</td>
      <td class="td-primary" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml_(p.proyecto)}</td>
      <td>${escapeHtml_(p.cliente)}</td><td><span class="estado-badge ${cls}">${escapeHtml_(p.estado)}</span></td>
      <td>${escapeHtml_(p.encargado)}</td><td>${escapeHtml_(p.ciudad||'—')}</td>
      <td class="td-money" style="text-align:right">${fmtMM(p.valor)}</td>
      <td class="td-money" style="text-align:right;color:${p.pxCobrar>500000000?'#c0392b':'inherit'}">${fmtMM(p.pxCobrar)}</td>
      <td class="${snC}" style="text-align:right">${fmtPct(p.difSNpct)}</td>
      <td><div style="display:flex;align-items:center;gap:5px"><div class="av-bar"><div class="av-fill" style="width:${p.avObra}%;background:${avC}"></div></div><span style="font-size:10px;color:#6b6b66">${p.avObra}%</span></div></td>
    </tr>`;
  }).join('') || '<tr><td colspan="10" style="text-align:center;color:#aaa;padding:20px">Sin proyectos con este filtro.</td></tr>';
}

async function goToKPIs(){
  if(moduloEnContencion_("KPI's")) return;
  currentView = 'kpis';
  hideAllViews();
  showFilters(true);
  document.getElementById('view-kpis').style.display = 'block';
  document.getElementById('topbar-title').textContent = "KPI'S";
  document.getElementById('topbar-sub').textContent = 'Indicadores generales de todo el portafolio';
  document.getElementById('refresh-btn').style.display = 'none';
  setActiveNav('nav-kpis');
  try{
    await loadFinancialProjects_('proyectos_financieros');
    document.getElementById('topbar-sub').textContent += financialMetaLabel_();
    buildKPIs(); buildFinanceBar(); buildDonut(); buildHealth(); buildSector();
  }catch(err){ alert('No se pudo cargar los indicadores: '+err.message); }
}

async function goToResumen(){
  if(moduloEnContencion_('Por Riesgos')) return;
  const s = getSession();
  if(!(s.rol === 'Director' || s.rol === 'Gerente' || s.rol === 'Admin')) return;
  currentView = 'resumen';
  hideAllViews();
  showFilters(true);
  document.getElementById('view-resumen').style.display = 'block';
  document.getElementById('topbar-title').textContent = 'POR RIESGOS';
  document.getElementById('topbar-sub').textContent = s.rol === 'Director' ? 'Riesgos de tus proyectos asignados' : 'Riesgos del portafolio completo';
  document.getElementById('refresh-btn').style.display = 'none';
  setActiveNav('nav-resumen');
  try{
    await loadFinancialProjects_('resumen_ejecutivo');
    document.getElementById('topbar-sub').textContent += financialMetaLabel_();
    buildRisks(); buildActions();
  }catch(err){ alert('No se pudo cargar el análisis por riesgos: '+err.message); }
}

async function goToAlertas(){
  if(moduloEnContencion_('Alertas')) return;
  currentView = 'alertas';
  hideAllViews();
  const s=getSession();
  const puedeVerFinanzas=['Director','Gerente','Admin'].includes(s.rol);
  showFilters(puedeVerFinanzas);
  document.getElementById('view-alertas').style.display = 'block';
  document.getElementById('topbar-title').textContent = 'ALERTAS';
  document.getElementById('topbar-sub').textContent = 'Observaciones y riesgos de tus proyectos asignados';
  document.getElementById('refresh-btn').style.display = 'none';
  setActiveNav('nav-alertas');
  try{
    const commentsData=await apiPost_('alertas_checklist');
    if(!commentsData.ok) throw new Error(commentsData.error||'No se pudieron cargar los comentarios.');
    checklistAlerts=commentsData.comentarios||[];
    if(puedeVerFinanzas){
      await loadFinancialProjects_('resumen_ejecutivo');
      document.getElementById('topbar-sub').textContent += financialMetaLabel_();
    }else{
      financialProjects=[]; dropdownFilteredAll=[]; filteredProjects=[];
      updateSidebarDataStatus_(document.lastModified,commentsData.fechaExtraccion);
    }
    buildAlertas();
  }catch(err){ alert('No se pudo cargar las alertas: '+err.message); }
}

async function goToDirectores(){
  if(moduloEnContencion_('Directores')) return;
  const s = getSession();
  if(s.rol !== 'Gerente') return;
  currentView = 'directores';
  hideAllViews();
  showFilters(true);
  document.getElementById('view-directores').style.display = 'block';
  document.getElementById('topbar-title').textContent = 'DIRECTORES';
  document.getElementById('topbar-sub').textContent = 'Desempeño por director';
  document.getElementById('refresh-btn').style.display = 'none';
  setActiveNav('nav-directores');
  try{
    await loadFinancialProjects_('directores');
    document.getElementById('topbar-sub').textContent += financialMetaLabel_();
    buildDirectores();
  }catch(err){ alert('No se pudo cargar el panel de directores: '+err.message); }
}

function goToResidentes(){
  const s = getSession();
  if(s.rol !== 'Gerente') return;
  currentView = 'residentes';
  hideAllViews();
  showFilters(false);
  document.getElementById('view-residentes').style.display = 'block';
  document.getElementById('topbar-title').textContent = 'RESIDENTES';
  document.getElementById('topbar-sub').textContent = 'Equipo residente y asignaciones de proyectos';
  document.getElementById('refresh-btn').style.display = 'none';
  setActiveNav('nav-residentes');
}

function goToContratistas(){
  const s = getSession();
  if(s.rol !== 'Gerente') return;
  currentView = 'contratistas';
  hideAllViews();
  showFilters(false);
  document.getElementById('view-contratistas').style.display = 'block';
  document.getElementById('topbar-title').textContent = 'CONTRATISTAS';
  document.getElementById('topbar-sub').textContent = 'Contratistas vinculados a los proyectos';
  document.getElementById('refresh-btn').style.display = 'none';
  setActiveNav('nav-contratistas');
}

async function goToComparativo(){
  if(moduloEnContencion_('Comparativo Anual')) return;
  const s = getSession();
  if(!(s.rol === 'Gerente' || s.rol === 'Admin')) return;
  currentView = 'comparativo';
  hideAllViews();
  showFilters(true);
  document.getElementById('view-comparativo').style.display = 'block';
  document.getElementById('topbar-title').textContent = 'COMPARATIVO ANUAL';
  document.getElementById('topbar-sub').textContent = '2025 vs 2026';
  document.getElementById('refresh-btn').style.display = 'none';
  setActiveNav('nav-comparativo');
  try{
    await loadFinancialProjects_('comparativo');
    document.getElementById('topbar-sub').textContent += financialMetaLabel_();
    buildComparativo();
  }catch(err){ alert('No se pudo cargar el comparativo: '+err.message); }
}

function goToNewProject(){
  const s = getSession();
  if(!(s.rol === 'Gerente' || s.rol === 'Admin')) return; // respaldo; el nav ya está oculto
  currentView = 'new-project';
  hideAllViews();
  showFilters(false);
  document.getElementById('view-new-project').style.display = 'block';
  document.getElementById('topbar-title').textContent = 'NUEVO PROYECTO';
  document.getElementById('topbar-sub').textContent = 'Crea un proyecto y clónale su checklist';
  document.getElementById('refresh-btn').style.display = 'none';
  setActiveNav('nav-nuevo-proyecto');
  document.getElementById('np-error').textContent = '';
  document.getElementById('np-success').textContent = '';
}

async function crearProyecto(){
  const errEl = document.getElementById('np-error');
  const okEl = document.getElementById('np-success');
  const btn = document.getElementById('np-submit-btn');
  errEl.textContent = ''; okEl.textContent = '';

  const datos = {
    codigo: document.getElementById('np-codigo').value.trim(),
    nombre: document.getElementById('np-nombre').value.trim(),
    cliente: document.getElementById('np-cliente').value.trim(),
    plantilla: document.getElementById('np-plantilla').value,
    estado: document.getElementById('np-estado').value,
    director: document.getElementById('np-director').value.trim(),
    residente: document.getElementById('np-residente').value.trim(),
    residente2: document.getElementById('np-residente-2').value.trim(),
    residente3: document.getElementById('np-residente-3').value.trim(),
    gerente: document.getElementById('np-gerente').value.trim(),
    carpetaDrive: document.getElementById('np-drive').value.trim()
  };
  if(!datos.codigo || !datos.nombre){
    errEl.textContent = 'El código y el nombre del proyecto son obligatorios.';
    return;
  }
  btn.disabled = true; btn.textContent = 'Creando...';
  try{
    const s = getSession();
    const res = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'crear_proyecto', token: s.token, datos })
    });
    const data = await res.json();
    if(!data.ok) throw new Error(data.error || 'Error desconocido');
    okEl.textContent = '✓ Proyecto creado' + (data.checklist && data.checklist.filas_creadas ? ' con ' + data.checklist.filas_creadas + ' ítems de checklist.' : '.');
    ['np-codigo','np-nombre','np-cliente','np-director','np-residente','np-residente-2','np-residente-3','np-gerente','np-drive'].forEach(id => document.getElementById(id).value = '');
    setTimeout(goToProjectList, 1500);
  }catch(e){
    errEl.textContent = '⚠ ' + e.message;
  }
  btn.disabled = false; btn.textContent = 'Crear proyecto';
}

let allMyProjects = [];
let currentProjectStatusFilter = 'todos';

async function loadProjects(){
  const note = document.getElementById('load-note');
  const grid = document.getElementById('projects-grid');
  note.style.display = 'block'; note.className = 'load-note';
  note.textContent = '⏳ Cargando tus proyectos...';
  try{
    const s = getSession();
    const data = await apiPost_('proyectos');
    if(!data.ok) throw new Error(data.error || 'Error desconocido');
    note.style.display = 'none';
    allMyProjects = data.proyectos;
    currentProjectStatusFilter = 'todos';
    renderProjectStatusTabs();
    renderProjects(allMyProjects);
    precalentarCarpetasEnSegundoPlano(allMyProjects);
  }catch(e){
    handleSessionError_(note, 'No se pudo cargar tus proyectos: ' + e.message);
    grid.innerHTML = '';
  }
}

/* ═══ PRECALENTADO DE CACHÉ EN SEGUNDO PLANO ═══
   Apenas se carga "Mis proyectos", se dispara en silencio el escaneo de
   Drive de cada proyecto (sin bloquear la pantalla ni esperar respuesta).
   El caché del backend es COMPARTIDO entre todos los que usan el portal
   (dura 6 horas) — con que UNA persona deje esto corriendo de fondo un
   rato, después todos entran instantáneo a cualquier proyecto. Se hace de
   a pocos a la vez (no todos en paralelo) para no saturar Apps Script. */
let _precalentando = false;
async function precalentarCarpetasEnSegundoPlano(proyectos){
  if(_precalentando) return; // evita relanzar si ya hay uno corriendo
  _precalentando = true;
  const CONCURRENCIA = 2;
  const s = getSession();
  const cola = [...proyectos];
  const banner = document.getElementById('precarga-banner');
  let restantes = cola.length;
  function actualizarBanner(){
    if(!banner) return;
    if(restantes <= 0){ banner.style.display = 'none'; return; }
    banner.style.display = 'block';
    banner.textContent = '🔄 Precargando datos de Drive en segundo plano... (' + (cola.length - restantes + 1) + '/' + cola.length + ' — puedes seguir usando el portal mientras tanto)';
  }
  async function trabajador(){
    while(cola.length){
      const p = cola.shift();
      actualizarBanner();
      try{
        await apiPost_('checklist_proyecto', {codigo:p.codigo});
      }catch(e){ /* si uno falla, no importa — se sigue con los demás */ }
      restantes--;
      actualizarBanner();
    }
  }
  const workers = [];
  for(let i=0;i<CONCURRENCIA;i++) workers.push(trabajador());
  await Promise.all(workers);
  _precalentando = false;
  actualizarBanner();
}

function renderProjectStatusTabs(){
  const wrap = document.getElementById('projects-status-tabs');
  const counts = {};
  allMyProjects.forEach(p => { const e = p.estado || 'Sin estado'; counts[e] = (counts[e]||0) + 1; });
  const estados = Object.keys(counts).sort();
  const tabs = [{key:'todos', label:'Todos', n: allMyProjects.length}]
    .concat(estados.map(e => ({key:e, label:e, n:counts[e]})));
  wrap.replaceChildren();
  tabs.forEach(t => {
    const button = document.createElement('button');
    button.className = 'status-tab' + (currentProjectStatusFilter === t.key ? ' active' : '');
    button.textContent = t.label + ' (' + t.n + ')';
    button.addEventListener('click', () => filterProjectsByStatus(t.key));
    wrap.appendChild(button);
  });
}

function filterProjectsByStatus(estado){
  currentProjectStatusFilter = estado;
  renderProjectStatusTabs();
  const filtered = estado === 'todos' ? allMyProjects : allMyProjects.filter(p => (p.estado || 'Sin estado') === estado);
  renderProjects(filtered);
}

function renderProjects(proyectos){
  const grid = document.getElementById('projects-grid');
  if(!proyectos.length){
    grid.innerHTML = '<div class="projects-empty">No tienes proyectos asignados todavía. Si crees que es un error, contacta a quien administra el portal.</div>';
    return;
  }
  grid.innerHTML = proyectos.map((p, index) => {
    const roles = [];
    if(p.director) roles.push('Director: ' + p.director);
    if(p.residente) roles.push('Residente: ' + p.residente);
    if(p.gerente) roles.push('Gerente: ' + p.gerente);
    return `
    <div class="project-card" data-project-index="${index}">
      <div class="pc-codigo">${escapeHtml_(p.codigo)}${p.estado ? ' · ' + escapeHtml_(p.estado) : ''}</div>
      <div class="pc-nombre">${escapeHtml_(p.nombre)}</div>
      <div class="pc-cliente">${escapeHtml_(p.cliente || '')}</div>
      <div class="pc-roles">${roles.map(r=>`<span class="pc-role-tag">${escapeHtml_(r)}</span>`).join('')}</div>
    </div>`;
  }).join('');
  grid.querySelectorAll('[data-project-index]').forEach(card => {
    const p = proyectos[Number(card.dataset.projectIndex)];
    card.addEventListener('click', () => openProject(p));
  });
}

let currentProjSubtab = 'documental';

function openProject(p){
  currentProject = p;
  currentView = 'timeline';
  currentFaseIndex = 0;
  currentCarpetaIndex = 0;
  currentGrupoFiltro = null;
  currentProjSubtab = 'documental';
  hideAllViews();
  showFilters(false);
  document.getElementById('view-timeline').style.display = 'block';
  document.getElementById('refresh-btn').style.display = 'inline-block';
  setActiveNav('nav-mis-proyectos');
  document.getElementById('topbar-title').textContent = p.codigo;
  document.getElementById('topbar-sub').textContent = p.nombre;
  const driveUrl = safeDriveUrl_(p.carpetaDrive);
  document.getElementById('project-header').innerHTML = `
    <div>
      <div class="ph-codigo">${escapeHtml_(p.codigo)}${p.cliente ? ' · ' + escapeHtml_(p.cliente) : ''}</div>
      <div class="ph-nombre">${escapeHtml_(p.nombre)}</div>
    </div>
    ${driveUrl ? `<a class="ph-drive" href="${escapeHtml_(driveUrl)}" target="_blank" rel="noopener noreferrer">📁 Abrir carpeta en Drive</a>` : ''}
  `;
  switchProjSubtab('documental');
  loadProjectChecklist(p.codigo);
  if(['Director','Gerente','Admin'].includes(getSession().rol)) renderResumenGeneral(p.codigo);
}

function switchProjSubtab(name){
  const s = getSession();
  if(name === 'resumen' && !(s.rol === 'Director' || s.rol === 'Gerente' || s.rol === 'Admin')) name = 'documental';
  currentProjSubtab = name;
  ['documental','fases','resumen'].forEach(n => {
    document.getElementById('subview-' + n).style.display = (n === name) ? 'block' : 'none';
    document.getElementById('subtab-' + n).classList.toggle('active', n === name);
  });
}

let _checklistRequestId = 0;

async function loadProjectChecklist(codigo){
  const note = document.getElementById('load-note');
  const driveNote = document.getElementById('drive-scan-note');
  note.style.display = 'block'; note.className = 'load-note';
  note.textContent = '⏳ Cargando checklist del proyecto... (puede tardar hasta 1 minuto la primera vez que se revisa la carpeta de Drive de este proyecto)';
  driveNote.style.display = 'none';
  const miRequestId = ++_checklistRequestId; // si se navega a otro proyecto antes de que esto responda, esta respuesta se descarta
  try{
    const s = getSession();
    const data = await apiPost_('checklist_proyecto', {codigo});
    // Si mientras esperábamos la respuesta el usuario ya cambió de proyecto
    // (o de vista), o esta respuesta ya no es la más reciente, se ignora
    // por completo para no pisar lo que se está viendo ahora.
    if(miRequestId !== _checklistRequestId || currentView !== 'timeline' || !currentProject || currentProject.codigo !== codigo) return;
    if(!data.ok) throw new Error(data.error || 'Error desconocido');
    note.style.display = 'none';
    window._fasesData = data.fases;
    window._resumenData = data.resumen;
    window._carpetasData = agruparPorCarpeta_(data.fases);
    if(data.driveScanError){
      driveNote.style.display = 'block';
      driveNote.textContent = '⚠ ' + data.driveScanError + ' El estado "Archivo cargado" puede salir como "sin verificar" para algunos ítems.';
    }
    renderFaseSidebar(data.fases, data.resumen);
    renderFaseDetail(FASE_ORDER[currentFaseIndex]);
    renderCarpetaSidebar(window._carpetasData);
    renderCarpetaDetail(CARPETA_ORDER[currentCarpetaIndex]);
  }catch(e){
    if(miRequestId !== _checklistRequestId) return;
    handleSessionError_(note, 'No se pudo cargar el checklist: ' + e.message);
    document.getElementById('proj-fase-sidebar').innerHTML = '';
    document.getElementById('fase-detail-wrap').innerHTML = '';
    document.getElementById('proj-carpeta-sidebar').innerHTML = '';
    document.getElementById('carpeta-detail-wrap').innerHTML = '';
  }
}

/* ═══ CONTROL DOCUMENTAL — agrupado por carpeta base (no por fase) ═══
   HSE se deja como recordatorio visual de un desarrollo futuro: no se
   clona en el checklist (ver Code.gs), así que aquí siempre aparece
   deshabilitada con la etiqueta "Próximamente". */
const CARPETA_ORDER = ['1. CLIENTE','2. CONTRATISTAS Y COMPRAS','3. HSE','4. SEGUIMIENTO Y CONTROL','5. GARANTÍAS'];
const CARPETA_LABELS = {
  '1. CLIENTE':'Cliente',
  '2. CONTRATISTAS Y COMPRAS':'Contratistas y Compras',
  '3. HSE':'HSE',
  '4. SEGUIMIENTO Y CONTROL':'Seguimiento y Control',
  '5. GARANTÍAS':'Garantías'
};
let currentCarpetaIndex = 0;

function agruparPorCarpeta_(fasesData){
  const porCarpeta = {};
  CARPETA_ORDER.forEach(c => porCarpeta[c] = []);
  Object.values(fasesData || {}).forEach(lista => {
    (lista || []).forEach(it => {
      const clave = (it.carpetaBase || '').trim().toUpperCase();
      const match = CARPETA_ORDER.find(c => clave.indexOf(c.split('. ')[1]) !== -1 || clave === c);
      if(match) porCarpeta[match].push(it);
      else {
        if(!porCarpeta['_otros']) porCarpeta['_otros'] = [];
        porCarpeta['_otros'].push(it);
      }
    });
  });
  return porCarpeta;
}

let currentGrupoFiltro = null; // null = mostrar todos los grupos de la carpeta; string = solo ese grupo

function gruposDeCarpeta_(items){
  const vistos = [];
  items.forEach(it => { const g = it.grupo || 'General'; if(!vistos.includes(g)) vistos.push(g); });
  vistos.sort((a,b) => a.localeCompare(b, 'es', {numeric:true}));
  return vistos;
}

function renderCarpetaSidebar(carpetas){
  const wrap = document.getElementById('proj-carpeta-sidebar');
  wrap.innerHTML = CARPETA_ORDER.map((carpeta, idx) => {
    const esHSE = carpeta === '3. HSE';
    const items = carpetas[carpeta] || [];
    const progreso = progresoChecklist_(items);
    const total = progreso.total;
    const pct = progreso.porcentaje;
    const done = progreso.aplicables > 0 && pct === 100;
    if(esHSE){
      return `
        <div class="pf-node disabled" title="Pendiente de desarrollo">
          <div class="pf-circle">🚧</div>
          <div class="pf-info">
            <div class="pf-label">${CARPETA_LABELS[carpeta]} <span class="pf-soon-tag">Próximamente</span></div>
            <div class="pf-pct">Aún no se controla en el portal</div>
          </div>
        </div>`;
    }
    const esActiva = idx === currentCarpetaIndex;
    const cls = (esActiva ? 'active' : '') + (done ? ' done' : '');
    const nodeHtml = `
      <div class="pf-node ${cls}" onclick="selectCarpeta(${idx})">
        <div class="pf-circle">${done ? '✓' : idx+1}</div>
        <div class="pf-info">
          <div class="pf-label">${CARPETA_LABELS[carpeta]}</div>
          <div class="pf-pct">Avance ${pct}%${progreso.noAplica?' · '+progreso.noAplica+' N/A':''}</div>
        </div>
      </div>`;
    // Si esta carpeta está activa, despliega debajo la lista de subcarpetas
    // (el "grupo" — ej. Administrativo, Contable...) para navegar directo.
    let gruposHtml = '';
    if(esActiva){
      const grupos = gruposDeCarpeta_(items);
      gruposHtml = grupos.map((g, grupoIndex) => `
        <div class="pf-grupo-node ${currentGrupoFiltro===g?'active':''}" data-grupo-index="${grupoIndex}">${escapeHtml_(g)}</div>
      `).join('');
      if(grupos.length){
        gruposHtml = `<div class="pf-grupo-list">
          <div class="pf-grupo-node ${currentGrupoFiltro===null?'active':''}" onclick="event.stopPropagation();selectGrupo(null)">Ver todo</div>
          ${gruposHtml}
        </div>`;
      }
    }
    return nodeHtml + gruposHtml;
  }).join('');
  const gruposActivos = gruposDeCarpeta_((carpetas && carpetas[CARPETA_ORDER[currentCarpetaIndex]]) || []);
  wrap.querySelectorAll('[data-grupo-index]').forEach(node => {
    node.addEventListener('click', event => {
      event.stopPropagation();
      selectGrupo(gruposActivos[Number(node.dataset.grupoIndex)]);
    });
  });
}

function selectCarpeta(idx){
  currentCarpetaIndex = idx;
  currentGrupoFiltro = null;
  renderCarpetaSidebar(window._carpetasData);
  renderCarpetaDetail(CARPETA_ORDER[idx]);
}

function selectGrupo(grupo){
  currentGrupoFiltro = grupo;
  renderCarpetaSidebar(window._carpetasData);
  renderCarpetaDetail(CARPETA_ORDER[currentCarpetaIndex]);
}

function progresoChecklist_(items){
  const aplicables=(items||[]).filter(it=>it.porcentaje!==null);
  const puntos=aplicables.reduce((s,it)=>s+(Number(it.porcentaje)||0),0);
  return {
    total:(items||[]).length,
    aplicables:aplicables.length,
    noAplica:(items||[]).length-aplicables.length,
    completos:aplicables.filter(it=>it.porcentaje===100).length,
    porcentaje:aplicables.length?Math.round(puntos/aplicables.length):100
  };
}

function revisionControlsHtml_(it, puedeEditar){
  const comentarioActual=it.comentario?`<div class="revision-last-comment"><strong>${escapeHtml_(it.comentadoPor||'Revisión')}</strong><span>${escapeHtml_(it.comentario)}</span></div>`:'';
  if(!puedeEditar) return comentarioActual;
  const active=estado=>it.vistoBueno===estado?' active':'';
  return `<div class="revision-box">
    <div class="calidad-actions">
      <button class="calidad-btn aprobar${active('Aprobado')}" onclick="marcarVistoBueno(this,${it.rowIndex},'Aprobado')">Aprobar</button>
      <button class="calidad-btn incompleto${active('Incompleto')}" onclick="marcarVistoBueno(this,${it.rowIndex},'Incompleto')">Incompleto 50%</button>
      <button class="calidad-btn rechazar${active('Rechazado')}" onclick="marcarVistoBueno(this,${it.rowIndex},'Rechazado')">Rechazar</button>
      <button class="calidad-btn no-aplica${active('No Aplica')}" onclick="marcarVistoBueno(this,${it.rowIndex},'No Aplica')">No Aplica</button>
    </div>
    <textarea class="revision-comment-input" maxlength="1000" placeholder="Agregar comentario de Calidad o Gerencia..."></textarea>
    <button class="revision-comment-save" onclick="guardarComentarioChecklist(this,${it.rowIndex})">Guardar comentario</button>
    ${comentarioActual}
  </div>`;
}

function renderCarpetaDetail(carpeta){
  const todosLosItems = (window._carpetasData && window._carpetasData[carpeta]) || [];
  const items = currentGrupoFiltro ? todosLosItems.filter(it => (it.grupo || 'General') === currentGrupoFiltro) : todosLosItems;
  const wrap = document.getElementById('carpeta-detail-wrap');
  if(carpeta === '3. HSE'){
    wrap.innerHTML = `
      <div class="fase-detail-head"><div class="fase-detail-title">HSE</div></div>
      <div class="fase-empty">Esta carpeta está reservada para un desarrollo futuro — todavía no se controla documentalmente desde el portal.</div>`;
    return;
  }
  const s = getSession();
  const puedeDarVistoBueno = s.rol === 'Calidad' || s.rol === 'Gerente' || s.rol === 'Admin';
  function renderItem(it){
    return `
    <div class="fase-item">
      <div class="body">
        <div class="sub">${escapeHtml_(it.subcarpeta)}</div>
        <div class="doc">${escapeHtml_(it.documento || '')}</div>
      </div>
      <div class="resp">${escapeHtml_(it.responsable)}</div>
      <div class="fase-item-status">
        ${estadoArchivoPill_(it.archivoCargado, it.archivoUrl)}
        ${estadoCalidadPill_(it.vistoBueno)}
      </div>
      <div class="fase-item-review">${revisionControlsHtml_(it, puedeDarVistoBueno)}</div>
    </div>`;
  }
  let itemsHtml, tituloPanel;
  if(currentGrupoFiltro){
    // Un solo grupo seleccionado: título = nombre del grupo, sin sub-encabezados repetidos
    tituloPanel = CARPETA_LABELS[carpeta] + ' — ' + currentGrupoFiltro;
    itemsHtml = items.length ? items.map(renderItem).join('') : '<div class="fase-empty">Sin ítems en esta subcarpeta.</div>';
  } else {
    // "Ver todo": agrupa por subcarpeta intermedia (el mismo nivel que ves al
    // navegar Drive, ej. "1. Administrativo", "2. Contable"...). Si un ítem
    // no tiene grupo asignado (checklists creados antes de esta función),
    // cae en "General".
    tituloPanel = CARPETA_LABELS[carpeta];
    const grupos = {};
    const ordenGrupos = [];
    items.forEach(it => {
      const g = it.grupo || 'General';
      if(!grupos[g]){ grupos[g] = []; ordenGrupos.push(g); }
      grupos[g].push(it);
    });
    ordenGrupos.sort((a,b) => a.localeCompare(b, 'es', {numeric:true}));
    itemsHtml = items.length ? ordenGrupos.map(g => {
      const avanceGrupo=progresoChecklist_(grupos[g]);
      return `<div class="grupo-subheader"><span>${escapeHtml_(g)}</span><span class="grupo-progress">Avance ${avanceGrupo.porcentaje}%${avanceGrupo.noAplica?' · '+avanceGrupo.noAplica+' N/A':''}</span></div>
      ${grupos[g].map(renderItem).join('')}`;
    }).join('') : '<div class="fase-empty">Sin ítems clasificados en esta carpeta.</div>';
  }
  const progreso = progresoChecklist_(items);
  wrap.innerHTML = `
    <div class="fase-detail-head">
      <div class="fase-detail-title">${escapeHtml_(tituloPanel)}</div>
      <div class="fase-detail-count">Avance ${progreso.porcentaje}%${progreso.noAplica?' · '+progreso.noAplica+' N/A':''}</div>
    </div>
    ${itemsHtml}`;
}

/* ═══ RESUMEN GENERAL DE PROYECTO — datos reales del Sheet de Control
   General de Proyectos (el mismo de Flujo de Caja), buscados por código.
   Si el proyecto no existe ahí todavía (por ejemplo, se creó solo en el
   Portal y no en ese Sheet), se avisa en vez de inventar datos. ═══ */
let curvaSChart;
async function renderResumenGeneral(codigo){
  const note = document.getElementById('resumen-proyecto-note');
  const headerEl = document.getElementById('ficha-header');
  const kpisEl = document.getElementById('ficha-kpis');
  const healthEl = document.getElementById('ficha-health');
  const curvaNota = document.getElementById('resumen-curva-nota');
  let p = financialProjects.find(x => x.codigo === codigo);
  if(!p){
    try{
      await loadFinancialProjects_('resumen_ejecutivo');
      p = financialProjects.find(x => x.codigo === codigo);
    }catch(err){
      note.style.display = 'block';
      note.className = 'load-note error';
      note.textContent = '⚠ No se pudo consultar el resumen financiero: ' + err.message;
      headerEl.style.display = 'none';
      return;
    }
  }
  if(!p){
    note.style.display = 'block';
    note.className = 'load-note error';
    note.textContent = '⚠ Este proyecto no se encontró en el Sheet de "Control General de Proyectos" — puede que se haya creado solo en este portal. No hay datos financieros/de avance para mostrar todavía.';
    headerEl.style.display = 'none'; kpisEl.innerHTML = ''; healthEl.innerHTML = '';
    document.getElementById('cronograma-list').innerHTML = '';
    document.getElementById('presupuesto-caps').innerHTML = '';
    if(curvaSChart){ curvaSChart.destroy(); curvaSChart = null; }
    curvaNota.style.display = 'none';
    return;
  }
  note.style.display = 'none';
  headerEl.style.display = 'grid';

  const cls = EB[p.estado] || 'eb-cerr';
  const salud = Math.round(((p.avObra||0)*0.4) + ((p.avLiq||0)*0.3) + 60*0.3);
  headerEl.innerHTML = `
    <div>
      <div class="ficha-codigo">${escapeHtml_(p.codigo)}</div>
      <div class="ficha-nombre">${escapeHtml_(p.proyecto)}</div>
      <div class="ficha-meta">
        <div class="ficha-meta-item">Cliente: <span>${escapeHtml_(p.cliente||'—')}</span></div>
        <div class="ficha-meta-item">Director: <span>${escapeHtml_(p.encargado||'—')}</span></div>
        <div class="ficha-meta-item">Ciudad: <span>${escapeHtml_(p.ciudad||'—')}</span></div>
        <div class="ficha-meta-item">Sector: <span>${escapeHtml_(p.sector||'—')}</span></div>
        <div class="ficha-meta-item">Estado: <span><span class="estado-badge ${cls}" style="font-size:10px">${escapeHtml_(p.estado)}</span></span></div>
      </div>
    </div>
    <div class="ficha-salud">
      <div class="ficha-salud-n" style="color:${hCol(salud)}">${salud}</div>
      <div class="ficha-salud-l">Índice de salud /100</div>
    </div>`;

  const kpiData = [
    {v: fmtMM(p.valor), l:'Valor del contrato', pct:100, c:'#1a1a1a'},
    {v: fmtMM(p.vPagado), l:'Facturado', pct: p.valor ? Math.round((p.vPagado||0)/p.valor*100) : 0, c:'#1a8a52'},
    {v: fmtMM(p.pxCobrar), l:'Pendiente cobrar', pct: p.valor ? Math.round((p.pxCobrar||0)/p.valor*100) : 0, c:'#c0392b'},
    {v: (p.avObra||0)+'%', l:'Avance de obra', pct: p.avObra||0, c: hCol(p.avObra||0)},
    {v: fmtPct(p.difSNpct), l:'Diferencia SN', pct: Math.min(p.difSNpct||0,100), c: (p.difSNpct||0)>35?'#c0392b':(p.difSNpct||0)>25?'#c08a00':'#1a8a52'},
  ];
  kpisEl.innerHTML = kpiData.map(k => `
    <div class="ficha-kpi">
      <div class="ficha-kpi-v">${k.v}</div>
      <div class="ficha-kpi-l">${k.l}</div>
      <div class="ficha-kpi-bar"><div class="ficha-kpi-bar-fill" style="width:${k.pct}%;background:${k.c}"></div></div>
    </div>`).join('');

  const healthItems = [
    {lbl:'Cronograma', pct: p.avObra>=80?85:p.avObra>=50?70:50},
    {lbl:'Financiero', pct: (p.difSNpct||0)<25?85:(p.difSNpct||0)<35?65:45},
    {lbl:'Cartera', pct: p.pxCobrar===0?95:p.pxCobrar<p.valor*0.3?70:45},
    {lbl:'Calidad', pct: p.obs && p.obs.length>5 ? 60 : 85},
  ];
  healthEl.innerHTML = healthItems.map(h => `<div class="health-row"><div class="health-lbl">${h.lbl}</div><div class="hbar-bg"><div class="hbar-fill" style="width:${h.pct}%;background:${hCol(h.pct)}"></div></div><div class="health-pct" style="color:${hCol(h.pct)}">${h.pct}%</div><div class="hdot" style="background:${hCol(h.pct)}"></div></div>`).join('')
    + `<div style="font-size:9px;color:#a09c96;margin-top:6px">HSE: pendiente de desarrollo (ver pestaña Control documental)</div>`;

  // ── Curva S: usa datos reales si existen para este código (PROJ_DETAIL);
  // si no, muestra una aproximación genérica basada solo en el % de avance
  // actual, dejándolo explícito con un aviso — nunca se presenta como real.
  if(curvaSChart) curvaSChart.destroy();
  const det = PROJ_DETAIL[p.codigo];
  let labels, planData, realData;
  if(det && det.curvaS && det.curvaS.length){
    curvaNota.style.display = 'none';
    labels = det.curvaS.map(d=>d.s);
    planData = det.curvaS.map(d=>d.prog);
    realData = det.curvaS.map(d=>d.real);
  } else {
    curvaNota.style.display = 'block';
    curvaNota.className = 'load-note';
    curvaNota.textContent = '⚠ Aproximación — todavía no hay datos históricos semana a semana para este proyecto en el Sheet, así que esta curva es una estimación basada solo en el % de avance actual.';
    const meses=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const avReal = p.avObra||0;
    const mActual = new Date().getMonth();
    labels = meses;
    planData = meses.map((_,i)=>Math.min(100,Math.round((i/(meses.length-1))*100)));
    realData = meses.map((_,i)=>{ if(i>mActual) return null; const r=Math.round((i/Math.max(mActual,1))*avReal); return Math.min(r,avReal); });
    realData[mActual] = avReal;
  }
  curvaSChart = new Chart(document.getElementById('curvaSChart'), {type:'line', data:{labels, datasets:[
    {label:'Planeado', data:planData, borderColor:'#1a5fa5', borderDash:[5,4], borderWidth:2, pointRadius:3, pointBackgroundColor:'#1a5fa5', tension:0.4, fill:false},
    {label:'Real', data:realData, borderColor:'#e8622a', borderWidth:2.5, pointRadius:4, pointBackgroundColor:'#e8622a', tension:0.4, fill:false},
  ]}, options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:true, labels:{font:{size:10}, boxWidth:16, padding:12}}, tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${ctx.raw!=null?ctx.raw+'%':'—'}`}}}, scales:{x:{grid:{display:false}, ticks:{color:'#6b6b66',font:{size:10}}, border:{display:false}}, y:{min:0,max:100, grid:{color:'#f0efec'}, ticks:{color:'#6b6b66',font:{size:10}, callback:v=>v+'%'}, border:{display:false}}}}
  });

  // ── Cronograma y Presupuesto por capítulo: SIEMPRE de muestra (CAPS es un
  // listado genérico, no datos reales de ningún proyecto) — el aviso ya
  // está fijo en el HTML de esta sección, y aquí igual queda claro.
  const pctBase = p.avObra||0;
  const caps = CAPS.map((c,i)=>{ const variacion=(i%3===0?-8:i%3===1?5:-2); return {...c, pct: Math.max(0,Math.min(100, pctBase+variacion+(i*3%15-7)))}; });
  document.getElementById('cronograma-list').innerHTML = `<table class="cronograma-table"><thead><tr>
    <th>Cap.</th><th>Descripción</th><th style="min-width:120px">Avance</th><th style="text-align:right">Selección</th></tr></thead><tbody>
    ${caps.map(c=>`<tr>
      <td class="cap-num">${c.n}</td>
      <td><div style="display:flex;align-items:center;gap:6px"><div style="width:18px;height:18px;border-radius:4px;background:${c.color}22;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0">${c.ico}</div><span style="font-size:11px;font-weight:600;color:${c.color}">${c.nom}</span></div></td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <div class="cap-bar-wrap" style="flex:1"><div class="cap-bar-fill" style="width:${c.pct}%;background:${c.color}"></div></div>
          <span class="cap-pct">${Math.round(c.pct)}%</span>
        </div>
      </td>
      <td style="text-align:right"><div style="display:inline-block;background:${c.color}22;border-radius:4px;padding:2px 8px;font-size:10px;font-weight:600;color:${c.color}">Alcance</div></td>
    </tr>`).join('')}
  </tbody></table>`;

  const totalMonto = CAPS.reduce((a,c)=>a+c.monto,0);
  const factor = p.valor>0 ? p.valor/1e6/totalMonto : 1;
  document.getElementById('presupuesto-caps').innerHTML = CAPS.map(c=>{
    const monto = Math.round(c.monto*factor);
    const pct = Math.round(c.monto/totalMonto*100);
    return `<div class="cap-row">
      <div class="cap-icon" style="background:${c.color}22;color:${c.color}">${c.ico}</div>
      <div class="cap-info">
        <div class="cap-info-top">
          <span class="cap-info-label" style="color:${c.color}">${c.n} — ${c.nom}</span>
          <span class="cap-info-monto">$${monto.toLocaleString()} M</span>
        </div>
        <div class="cap-info-sub">${pct}% del presupuesto total · $${c.monto.toLocaleString()}/m²</div>
        <div class="cap-bar-mini"><div class="cap-bar-mini-fill" style="width:${pct}%;background:${c.color}"></div></div>
      </div>
    </div>`;
  }).join('');
}

function renderFaseSidebar(fases, resumen){
  const wrap = document.getElementById('proj-fase-sidebar');
  wrap.innerHTML = FASE_ORDER.map((fase, idx) => {
    const r = resumen[fase] || {total:0, aplicables:0, noAplica:0, porcentaje:0};
    const pct = Number(r.porcentaje)||0;
    const done = r.aplicables > 0 && pct === 100;
    const cls = (idx === currentFaseIndex ? 'active' : '') + (done ? ' done' : '');
    return `
      <div class="pf-node ${cls}" onclick="selectFase(${idx})">
        <div class="pf-circle">${done ? '✓' : idx+1}</div>
        <div class="pf-info">
          <div class="pf-label">${fase}</div>
          <div class="pf-pct">Avance ${pct}%${r.noAplica?' · '+r.noAplica+' N/A':''}</div>
        </div>
      </div>`;
  }).join('');
}

function selectFase(idx){
  currentFaseIndex = idx;
  renderFaseSidebar(window._fasesData, window._resumenData);
  renderFaseDetail(FASE_ORDER[idx]);
}

function estadoArchivoPill_(archivoCargado, archivoUrl){
  const url = safeDriveUrl_(archivoUrl);
  const contenido = archivoCargado === true ? '📎 Archivo cargado' : '📎 Sin archivo';
  if(url) return `<a class="status-pill ${archivoCargado === true ? 'ok' : 'no'}" href="${escapeHtml_(url)}" target="_blank" rel="noopener noreferrer" title="Abrir carpeta en Drive">${contenido} ↗</a>`;
  if(archivoCargado === true) return '<span class="status-pill ok">📎 Archivo cargado</span>';
  if(archivoCargado === false) return '<span class="status-pill no">📎 Sin archivo</span>';
  return '<span class="status-pill unknown">📎 Sin verificar</span>';
}

function estadoCalidadPill_(vistoBueno){
  if(vistoBueno === 'Aprobado') return '<span class="status-pill ok">✅ Aprobado</span>';
  if(vistoBueno === 'Incompleto') return '<span class="status-pill incompleto">◐ Incompleto · 50%</span>';
  if(vistoBueno === 'Rechazado') return '<span class="status-pill rechazado">❌ Rechazado</span>';
  if(vistoBueno === 'No Aplica') return '<span class="status-pill no-aplica">➖ No Aplica</span>';
  return '<span class="status-pill pend">✅ Pendiente</span>';
}

function renderFaseDetail(fase){
  const items = (window._fasesData && window._fasesData[fase]) || [];
  const r = (window._resumenData && window._resumenData[fase]) || {total:0, hechos:0};
  const wrap = document.getElementById('fase-detail-wrap');
  const s = getSession();
  const puedeDarVistoBueno = s.rol === 'Calidad' || s.rol === 'Gerente' || s.rol === 'Admin';
  const itemsHtml = items.length ? items.map(it => {
    return `
    <div class="fase-item">
      <div class="body">
        <div class="carpeta">${escapeHtml_(it.carpetaBase)}</div>
        <div class="sub">${escapeHtml_(it.subcarpeta)}</div>
        <div class="doc">${escapeHtml_(it.documento || '')}</div>
      </div>
      <div class="resp">${escapeHtml_(it.responsable)}</div>
      <div class="fase-item-status">
        ${estadoArchivoPill_(it.archivoCargado, it.archivoUrl)}
        ${estadoCalidadPill_(it.vistoBueno)}
      </div>
      <div class="fase-item-review">${revisionControlsHtml_(it, puedeDarVistoBueno)}</div>
    </div>`;
  }).join('') : '<div class="fase-empty">Sin ítems clasificados en esta fase.</div>';
  wrap.innerHTML = `
    <div class="fase-detail-head">
      <div class="fase-detail-title">${fase}</div>
      <div class="fase-detail-count">Avance ${Number(r.porcentaje)||0}%${r.noAplica?' · '+r.noAplica+' N/A':''}</div>
    </div>
    ${itemsHtml}`;
}

async function enviarRevisionChecklist_(trigger, rowIndex, estado){
  const box = trigger && trigger.closest ? trigger.closest('.revision-box') : null;
  const input = box ? box.querySelector('.revision-comment-input') : null;
  const comentario = input ? input.value.trim() : '';
  if(!estado && !comentario){ alert('Escribe un comentario antes de guardarlo.'); return; }
  const botones = box ? box.querySelectorAll('button') : [];
  botones.forEach(btn=>btn.disabled=true);
  try{
    const data = await apiPost_('marcar_visto_bueno', {codigo:currentProject.codigo, rowIndex, estado, comentario});
    if(!data.ok) throw new Error(data.error || 'Error desconocido');
    await loadProjectChecklist(currentProject.codigo);
  }catch(e){
    alert('No se pudo actualizar el Visto Bueno: ' + e.message);
    botones.forEach(btn=>btn.disabled=false);
  }
}

function marcarVistoBueno(trigger, rowIndex, estado){
  return enviarRevisionChecklist_(trigger, rowIndex, estado);
}

function guardarComentarioChecklist(trigger, rowIndex){
  return enviarRevisionChecklist_(trigger, rowIndex, '');
}

document.addEventListener('DOMContentLoaded', function(){
  const s = getSession();
  if(s.nombre && s.token){ enterApp(); }
  else initGoogleIdentity_();
});
