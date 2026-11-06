const fs = require('fs');
const OUT = 'manuscript-flowcharts';

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function wrap(label, max=16){
  const words = String(label).split(' ');
  const lines=[]; let cur='';
  for(const w of words){ if((cur+' '+w).trim().length>max){ lines.push(cur.trim()); cur=w; } else cur+=' '+w; }
  if(cur.trim()) lines.push(cur.trim());
  return lines.slice(0,4);
}
function textLines(x,y,lines,size=11){
  const lh = size+2;
  const y0 = y - ((lines.length-1)*lh)/2;
  return lines.map((l,i)=>`<text x="${x}" y="${y0+i*lh+4}" text-anchor="middle" font-family="Arial" font-size="${size}">${esc(l)}</text>`).join('');
}
// Shapes (GymTrack monochrome: white fill, black 1.5 stroke)
function terminator(x,y,w,h,label){
  return `<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="${h/2}" fill="white" stroke="black" stroke-width="1.5"/>`+textLines(x,y,wrap(label,18),11);
}
function hexagon(x,y,w,h,label){
  const hw=w/2, hh=h/2;
  const pts=`${x-hw+12},${y-hh} ${x+hw-12},${y-hh} ${x+hw},${y} ${x+hw-12},${y+hh} ${x-hw+12},${y+hh} ${x-hw},${y}`;
  return `<polygon points="${pts}" fill="white" stroke="black" stroke-width="1.5"/>`+textLines(x,y,wrap(label,20),10);
}
function diamond(x,y,w,h,label){
  const pts=`${x},${y-h/2} ${x+w/2},${y} ${x},${y+h/2} ${x-w/2},${y}`;
  return `<polygon points="${pts}" fill="white" stroke="black" stroke-width="1.5"/>`+textLines(x,y,wrap(label,13),10);
}
function para(x,y,w,h,label){
  const s=14;
  const pts=`${x-w/2+s},${y-h/2} ${x+w/2+s},${y-h/2} ${x+w/2-s},${y+h/2} ${x-w/2-s},${y+h/2}`;
  return `<polygon points="${pts}" fill="white" stroke="black" stroke-width="1.5"/>`+textLines(x,y,wrap(label,17),10);
}
function database(x,y,w,h,label){
  const hw=w/2, hh=h/2, e=8;
  return `<path d="M ${x-hw} ${y-hh+e} A ${hw} ${e} 0 0 0 ${x+hw} ${y-hh+e} L ${x+hw} ${y+hh-e} A ${hw} ${e} 0 0 1 ${x-hw} ${y+hh-e} Z" fill="white" stroke="black" stroke-width="1.5"/>`
   + `<ellipse cx="${x}" cy="${y-hh+e}" rx="${hw}" ry="${e}" fill="white" stroke="black" stroke-width="1.5"/>`
   + textLines(x,y+4,wrap(label,14),9);
}
function connector(x,y,r,label){
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="white" stroke="black" stroke-width="1.5"/>`+textLines(x,y,[label],10);
}
function arrow(x1,y1,x2,y2,label='',lx=0,ly=0){
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black" stroke-width="1.2" marker-end="url(#ah)"/>`
   + (label?`<text x="${(x1+x2)/2+lx}" y="${(y1+y2)/2+ly}" font-family="Arial" font-size="10" text-anchor="middle">${label}</text>`:'');
}
function header(title, page, h){
  return `<defs><marker id="ah" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6" fill="none" stroke="black" stroke-width="1.2"/></marker></defs>
  <rect x="5" y="5" width="790" height="${h-10}" fill="none" stroke="#1F49A6" stroke-width="1.5"/>
  <line x1="5" y1="52" x2="795" y2="52" stroke="#1F49A6" stroke-width="1.5"/>
  <line x1="5" y1="78" x2="795" y2="78" stroke="#1F49A6" stroke-width="1.5"/>
  <text x="400" y="33" text-anchor="middle" font-family="Times New Roman" font-weight="bold" font-size="20">INSTITUTE OF COMPUTING STUDIES</text>
  <text x="400" y="68" text-anchor="middle" font-family="Times New Roman" font-weight="bold" font-size="15">B.S. INFORMATION TECHNOLOGY</text>
  <text x="760" y="68" text-anchor="middle" font-family="Times New Roman" font-size="12">${page}</text>
  <text x="400" y="102" text-anchor="middle" font-family="Times New Roman" font-weight="bold" font-size="14">${esc(title)}</text>`;
}

// ---------- WEBSITE ----------
function website(){
  const H=1750; let s=header('Appendix C: Website Flowchart','96',H);
  const CX=230, IX=470, DX=650, EX=745, EN=110; // spine, io, done, exit, entry
  let y=150;
  s+=terminator(400,140,110,32,'Start');
  s+=arrow(400,156,400,178);
  s+=hexagon(400,200,210,36,'Initialize Website (/)');
  s+=arrow(400,218,230,250); // to first decision
  const sections=[
    {q:'Hero?', io:'Show hero + Explore app + See how it works', db:null},
    {q:'Features?', io:'Show 3 features + phone preview tabs', db:null},
    {q:'How it works?', io:'Show resident 3 steps + staff panel', db:null},
    {q:'Community preview?', io:'Show advisories + alerts preview', db:'Laravel Public API Database'},
    {q:'Directory preview?', io:'Show hotlines + evacuation + officials', db:'Laravel Public API Database'},
    {q:'Get the app?', io:'Show Download APK / Open app + guides', db:null},
    {q:'FAQs?', io:'Show 5 FAQs accordion', db:null},
    {q:'CTA / Footer?', io:'Show final CTA + Resident / Admin links', db:null},
    {q:'Staff sign-in?', io:'Go to Admin portal link', db:'Laravel MySQL Database'},
  ];
  const letters=['A','B','C','D','E','F','G','H','I'];
  y=270;
  sections.forEach((sec,i)=>{
    const L=letters[i];
    s+=connector(EN,y,13,L); // entry
    s+=diamond(CX,y,120,62,sec.q);
    s+=arrow(EN+13,y,CX-60,y);
    s+=para(IX,y,190,44,sec.io);
    s+=arrow(CX+60,y,IX-95-14,y,'Yes',0,-8);
    s+=diamond(DX,y,100,58,'Done?');
    s+=arrow(IX+95+14,y,DX-50,y);
    s+=connector(EX,y,13,L);
    s+=arrow(DX+50,y,EX-13,y,'Yes',0,-8);
    // No branches
    s+=arrow(CX,y+31,CX,y+89,'No',10,0); // down spine
    // Done No loops back to io
    s+=`<line x1="${DX}" y1="${y+29}" x2="${DX}" y2="${y+62}" stroke="black" stroke-width="1.2"/><line x1="${DX}" y1="${y+62}" x2="${IX}" y2="${y+62}" stroke="black" stroke-width="1.2"/><line x1="${IX}" y1="${y+62}" x2="${IX}" y2="${y+22}" stroke="black" stroke-width="1.2" marker-end="url(#ah)"/><text x="${DX+22}" y="${y+52}" font-family="Arial" font-size="10">No</text>`;
    if(sec.db){
      s+=database(IX,y+105,150,34,sec.db);
      s+=arrow(IX,y+22,IX,y+88);
      y+=55; // extra space
    }
    y+=120;
  });
  // final Done -> End
  s+=diamond(CX,y,110,60,'Done?');
  s+=arrow(EN+13,y-10,CX-55,y-10); // from last? simplify
  s+=arrow(CX,y+30,CX,y+70,'Yes',10,0);
  s+=terminator(CX,y+100,110,32,'End');
  s+=`<line x1="${CX}" y1="${y-30}" x2="${CX}" y2="${y-30}" stroke="black"/>`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${H}" viewBox="0 0 800 ${H}"><rect width="800" height="${H}" fill="white"/>${s}</svg>`;
  fs.writeFileSync(`${OUT}/Appendix-C-Website-Flowchart.svg`,svg);
}

// ---------- DESKTOP ----------
function desktop(){
  const H=3300; let s=header('Appendix D: Desktop Application Flowchart','97',H);
  let y=150;
  const add=(str)=>{s+=str;};
  add(terminator(400,140,110,32,'Start'));
  add(arrow(400,156,400,178));
  add(hexagon(400,202,240,38,'Initialize Admin console (/admin)'));
  // Auth row
  y=280;
  add(diamond(200,y,130,66,'Staff Login?'));
  add(arrow(400,221,400,240)); add(`<line x1="400" y1="240" x2="200" y2="240" stroke="black" stroke-width="1.2"/><line x1="200" y1="240" x2="200" y2="${y-33}" stroke="black" stroke-width="1.2" marker-end="url(#ah)"/>`);
  add(para(400,y,170,44,'Input email + password (CSRF)'));
  add(arrow(265,y,315,y,'Yes',0,-8));
  add(database(565,y,130,36,'Laravel MySQL + Sanctum'));
  add(arrow(485,y,500,y));
  add(diamond(680,y,110,62,'Valid?'));
  add(arrow(630,y,625,y)); // db->valid (approx)
  // valid lines
  // Try again branch below valid
  add(diamond(680,y+120,110,62,'Try again?'));
  add(arrow(680,y+31,680,y+89,'No',12,0));
  add(connector(745,y+120,13,'A'));
  add(arrow(680+55,y+120,732,y+120,'No',0,-9));
  add(arrow(680,y-31+62,680,y+89-62+30,'Yes',-42,0)); // valid Yes? actually need Yes to dashboard
  // Valid Yes -> dashboard (down left)
  // Valid No -> Try again Yes loops to Input
  add(`<text x="625" y="${y-12}" font-family="Arial" font-size="10">Yes</text>`);
  add(`<text x="615" y="${y+12}" font-family="Arial" font-size="10">No</text>`);
  add(`<line x1="680" y1="${y+31}" x2="580" y2="${y+31}" stroke="black" stroke-width="1.2"/><line x1="580" y1="${y+31}" x2="580" y2="${y+120}" stroke="black" stroke-width="1.2"/><line x1="580" y1="${y+120}" x2="625" y2="${y+120}" stroke="black" stroke-width="1.2" marker-end="url(#ah)"/><text x="600" y="${y+80}" font-family="Arial" font-size="10">No</text>`);
  add(`<line x1="625" y1="${y}" x2="480" y2="${y}" stroke="black" stroke-width="0"/><text x="560" y="${y-10}" font-family="Arial" font-size="10"></text>`);
  // Valid Yes path to C (dashboard)
  add(`<line x1="735" y1="${y}" x2="735" y2="${y+200}" stroke="black" stroke-width="1.2"/><line x1="735" y1="${y+200}" x2="200" y2="${y+200}" stroke="black" stroke-width="1.2" marker-end="url(#ah)"/><text x="748" y="${y+100}" font-family="Arial" font-size="10">Yes</text>`);
  // Try again Yes loop back to Input credentials
  add(`<line x1="625" y1="${y+120}" x2="485" y2="${y+120}" stroke="black" stroke-width="1.2"/><line x1="485" y1="${y+120}" x2="485" y2="${y+22}" stroke="black" stroke-width="1.2" marker-end="url(#ah)"/><text x="555" y="${y+112}" font-family="Arial" font-size="10">Yes</text>`);

  // Login No -> Sign Up
  y=480;
  add(diamond(200,y,130,66,'Temp password?'));
  add(arrow(200,313,200,447,'No',12,0));
  add(para(400,y,200,44,'Change password 12+ chars'));
  add(arrow(265,y,300,y,'Yes',0,-8));
  add(diamond(600,y,100,58,'Valid?'));
  add(arrow(500,y,550,y));
  add(database(710,y,110,34,'Laravel MySQL'));
  add(arrow(650,y,655,y));
  add(`<text x="600" y="${y+70}" font-family="Arial" font-size="10">must_change_password=false</text>`);
  add(terminator(600,y+110,120,32,'Proceed to console'));
  add(arrow(600,y+29,600,y+94,'Yes',12,0));
  add(connector(745,y+40,13,'B'));
  add(arrow(650,y+20,732,y+40,'No',0,-8));

  // Forgot
  y=660;
  add(diamond(200,y,140,68,'Resident / No access?'));
  add(arrow(200,513,200,626,'No',12,0));
  add(para(400,y-20,170,42,'Resend temp password'));
  add(arrow(270,y,315,y-20,'Yes',0,-8));
  add(database(585,y-20,120,34,'Laravel MySQL'));
  add(arrow(485,y-20,525,y-20));
  add(diamond(680,y-20,100,58,'Sent?'));
  add(para(400,y+60,190,42,'Resident -> Open /app link'));
  add(arrow(680,y+9,680,y+40)); add(`<line x1="680" y1="${y+40}" x2="400" y2="${y+40}" stroke="black" stroke-width="1.2"/><line x1="400" y1="${y+40}" x2="400" y2="${y+39}" stroke="black" stroke-width="1.2" marker-end="url(#ah)"/><text x="550" y="${y+32}" font-family="Arial" font-size="10">Yes</text>`);
  add(database(600,y+60,120,34,'Session ends'));
  add(arrow(495,y+60,540,y+60));
  add(connector(745,y+60,13,'A'));
  add(arrow(660,y+60,732,y+60,'',0,0));
  add(`<text x="200" y="${y+110}" font-family="Arial" font-size="10">A = back to Staff Login</text>`);

  // Dashboard entry
  y=830;
  add(connector(110,y,13,'C'));
  add(diamond(240,y,140,70,'Dashboard?'));
  add(arrow(123,y,170,y));
  add(para(450,y,200,44,'Show stats + navigate + search'));
  add(arrow(310,y,350,y,'Yes',0,-8));
  add(arrow(240,y+35,240,y+80,'No',12,0));

  const mods=[
    {L:'D',q:'Residents?',io:'Show residents + search + ID card',db:'Laravel MySQL records',extra:'Add / Update Resident | Delete (admin only)'},
    {L:'E',q:'Complaints (Blotter)?',io:'Show blotter + search/filter',db:'Laravel MySQL records',extra:'Add / Update status | Delete (admin only)'},
    {L:'F',q:'Emergency & Rescue?',io:'Show incidents + centers + alerts',db:'Laravel MySQL records',extra:'Add incident / center / alert + responders + equipment'},
    {L:'G',q:'Operations + BDRRM?',io:'Show logs + equipment + advisory',db:'Laravel MySQL records',extra:'Add operation / equipment + update advisory'},
    {L:'H',q:'Community inbox?',io:'Show submissions kind/status filter',db:'Laravel admin submissions',extra:'Update status + admin_note to resident'},
    {L:'I',q:'Officials?',io:'Show officials directory',db:'Laravel MySQL records',extra:'View officials (admin manages)'},
    {L:'J',q:'Staff Accounts? (admin)',io:'Show staff list + temp creds',db:'Laravel admin accounts',extra:'Create staff + Edit role / active (admin only)'},
    {L:'K',q:'Password / Session?',io:'Show change password + logout',db:'Laravel Sanctum session',extra:'Change password + logout, expire session'},
  ];
  y=960;
  mods.forEach(m=>{
    add(connector(110,y,13,m.L));
    add(diamond(240,y,140,68,m.q));
    add(arrow(123,y,170,y));
    add(arrow(240,y-45,240,y-34)); // from previous No (approx spine)
    add(para(470,y-20,230,42,m.io));
    add(arrow(310,y,355,y,'Yes',0,-8));
    add(database(470,y+45,150,34,m.db));
    add(arrow(470,y+2,470,y+28));
    add(para(470,y+105,250,40,m.extra));
    add(arrow(470,y+62,470,y+85));
    add(diamond(670,y+105,90,56,'Done?'));
    add(arrow(595,y+105,625,y+105));
    add(connector(750,y+105,13,m.L));
    add(arrow(715,y+105,737,y+105,'Yes',0,-9));
    add(`<line x1="670" y1="${y+133}" x2="670" y2="${y+175}" stroke="black" stroke-width="1.2"/><line x1="670" y1="${y+175}" x2="470" y2="${y+175}" stroke="black" stroke-width="1.2"/><line x1="470" y1="${y+175}" x2="470" y2="${y+125}" stroke="black" stroke-width="1.2" marker-end="url(#ah)"/><text x="692" y="${y+160}" font-family="Arial" font-size="10">No</text>`);
    add(arrow(240,y+34,240,y+120,'No',12,0));
    y+=230;
  });
  add(diamond(240,y,120,62,'Logout?'));
  add(arrow(240,y-110,240,y-31,'',0,0));
  add(terminator(240,y+90,110,32,'End'));
  add(arrow(240,y+31,240,y+74,'Yes',12,0));
  add(connector(110,y,13,'C'));
  add(arrow(123,y,180,y));
  add(`<text x="300" y="${y+10}" font-family="Arial" font-size="10">No -> back to Dashboard (C)</text>`);
  add(`<line x1="300" y1="${y}" x2="380" y2="${y}" stroke="black" stroke-width="1.2"/><line x1="380" y1="${y}" x2="380" y2="${830}" stroke="black" stroke-width="1.2"/><line x1="380" y1="${830}" x2="310" y2="${830}" stroke="black" stroke-width="1.2" marker-end="url(#ah)"/>`);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${H}" viewBox="0 0 800 ${H}"><rect width="800" height="${H}" fill="white"/>${s}</svg>`;
  fs.writeFileSync(`${OUT}/Appendix-D-Desktop-Flowchart.svg`,svg);
}

// ---------- MOBILE ----------
function mobile(){
  const H=3100; let s=header('Appendix E: Mobile Application Flowchart','103',H);
  let y=150;
  s+=terminator(400,140,110,32,'Start');
  s+=arrow(400,156,400,178);
  s+=hexagon(400,202,240,38,'Initialize Resident app (/app)');
  y=285;
  s+=diamond(200,y,130,66,'Sign In?');
  s+=`<line x1="400" y1="221" x2="400" y2="245" stroke="black" stroke-width="1.2"/><line x1="400" y1="245" x2="200" y2="245" stroke="black" stroke-width="1.2"/><line x1="200" y1="245" x2="200" y2="${y-33}" stroke="black" stroke-width="1.2" marker-end="url(#ah)"/>`;
  s+=para(400,y,170,44,'Input email + password');
  s+=arrow(265,y,315,y,'Yes',0,-8);
  s+=database(565,y,130,36,'Laravel resident login');
  s+=arrow(485,y,500,y);
  s+=diamond(680,y,110,62,'Valid?');
  s+=arrow(630,y,625,y);
  s+=diamond(680,y+120,110,62,'Try again?');
  s+=arrow(680,y+31,680,y+89,'No',12,0);
  s+=connector(745,y+120,13,'A');
  s+=arrow(735,y+120,732,y+120,'No',0,-9);
  s+=`<line x1="680" y1="${y+31}" x2="580" y2="${y+31}" stroke="black" stroke-width="1.2"/><line x1="580" y1="${y+31}" x2="580" y2="${y+120}" stroke="black" stroke-width="1.2"/><line x1="580" y1="${y+120}" x2="625" y2="${y+120}" stroke="black" stroke-width="1.2" marker-end="url(#ah)"/><text x="600" y="${y+80}" font-family="Arial" font-size="10">No</text>`;
  s+=`<line x1="625" y1="${y+120}" x2="485" y2="${y+120}" stroke="black" stroke-width="1.2"/><line x1="485" y1="${y+120}" x2="485" y2="${y+22}" stroke="black" stroke-width="1.2" marker-end="url(#ah)"/><text x="555" y="${y+112}" font-family="Arial" font-size="10">Yes</text>`;
  s+=`<line x1="735" y1="${y}" x2="735" y2="${y+205}" stroke="black" stroke-width="1.2"/><line x1="735" y1="${y+205}" x2="200" y2="${y+205}" stroke="black" stroke-width="1.2" marker-end="url(#ah)"/><text x="748" y="${y+100}" font-family="Arial" font-size="10">Yes</text>`;

  y=490;
  s+=diamond(200,y,130,66,'Create account?');
  s+=arrow(200,318,200,457,'No',12,0);
  s+=para(410,y,210,44,'Register name + email, temp pw 24h');
  s+=arrow(265,y,305,y,'Yes',0,-8);
  s+=diamond(610,y,100,58,'Issued?');
  s+=arrow(515,y,560,y);
  s+=database(715,y,110,34,'Laravel resident register');
  s+=arrow(660,y,660,y);
  s+=terminator(610,y+105,140,32,'Copy temp pw, sign in');
  s+=arrow(610,y+29,610,y+89,'Yes',12,0);
  s+=connector(750,y+40,13,'B');
  s+=arrow(660,y+15,737,y+40,'No',0,-8);

  y=665;
  s+=diamond(200,y,140,68,'Change password?');
  s+=arrow(200,523,200,631,'No',12,0);
  s+=para(410,y-25,170,40,'Input current + new 12+');
  s+=arrow(270,y,325,y-25,'Yes',0,-8);
  s+=para(410,y+45,190,40,'Resend temp pw if expired');
  s+=arrow(410,y-5,410,y+25);
  s+=database(610,y+45,130,34,'Laravel account API');
  s+=arrow(505,y+45,545,y+45);
  s+=connector(750,y+45,13,'A');
  s+=arrow(675,y+45,737,y+45);

  y=820;
  s+=connector(110,y,13,'C');
  s+=diamond(245,y,135,68,'Home?');
  s+=arrow(123,y,177,y);
  s+=para(460,y,210,44,'Show hello + Send concern + updates');
  s+=arrow(312,y,355,y,'Yes',0,-8);
  s+=arrow(245,y+34,245,y+80,'No',12,0);

  const mods=[
    {L:'D',q:'Submit concern?',io:'Composer kind + subject + location + contact + desc',db:'Laravel resident submissions',done:'Go to Reports tab'},
    {L:'E',q:'Report incident?',io:'Composer emergency + hotline notice',db:'Laravel resident submissions',done:'Office review only'},
    {L:'F',q:'Community updates?',io:'Show advisory + alerts + Refresh',db:'Laravel public community',done:'Viewed'},
    {L:'G',q:'Directory?',io:'Show hotlines tel + evacuation + officials',db:'Laravel public community',done:'Called / viewed'},
    {L:'H',q:'Track reports?',io:'Show own submissions + admin_note',db:'Laravel resident submissions',done:'submitted/in_review/resolved'},
    {L:'I',q:'Account?',io:'Show profile + Sign out + Back to site',db:'Laravel Sanctum session',done:'Signed out'},
  ];
  y=950;
  mods.forEach(m=>{
    s+=connector(110,y,13,m.L);
    s+=diamond(245,y,135,66,m.q);
    s+=arrow(123,y,177,y);
    s+=para(470,y,220,42,m.io);
    s+=arrow(312,y,360,y,'Yes',0,-8);
    s+=database(470,y+70,150,34,m.db);
    s+=arrow(470,y+21,470,y+53);
    s+=diamond(660,y,95,56,'Done?');
    s+=arrow(580,y,612,y);
    s+=connector(750,y,13,m.L);
    s+=arrow(707,y,737,y,'Yes',0,-9);
    s+=`<text x="560" y="${y+28}" font-family="Arial" font-size="9">${esc(m.done)}</text>`;
    s+=`<line x1="660" y1="${y+28}" x2="660" y2="${y+60}" stroke="black" stroke-width="1.2"/><line x1="660" y1="${y+60}" x2="470" y2="${y+60}" stroke="black" stroke-width="1.2"/><line x1="470" y1="${y+60}" x2="470" y2="${y+21}" stroke="black" stroke-width="1.2" marker-end="url(#ah)"/><text x="680" y="${y+52}" font-family="Arial" font-size="10">No</text>`;
    s+=arrow(245,y+33,245,y+100,'No',12,0);
    y+=170;
  });
  s+=diamond(245,y,120,62,'Logout?');
  s+=connector(110,y,13,'C');
  s+=arrow(123,y,185,y);
  s+=terminator(245,y+90,110,32,'End');
  s+=arrow(245,y+31,245,y+74,'Yes',12,0);
  s+=`<text x="320" y="${y+10}" font-family="Arial" font-size="10">No -&gt; back to Home (C)</text>`;
  s+=`<line x1="305" y1="${y}" x2="380" y2="${y}" stroke="black" stroke-width="1.2"/><line x1="380" y1="${y}" x2="380" y2="${820}" stroke="black" stroke-width="1.2"/><line x1="380" y1="${820}" x2="312" y2="${820}" stroke="black" stroke-width="1.2" marker-end="url(#ah)"/>`;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${H}" viewBox="0 0 800 ${H}"><rect width="800" height="${H}" fill="white"/>${s}</svg>`;
  fs.writeFileSync(`${OUT}/Appendix-E-Mobile-Flowchart.svg`,svg);
}

website(); desktop(); mobile();
console.log('done');
