/* ---------- joueurs ---------- */
function startAttack(p, stage) {
  p.st = 'attack'; p.sprint = false; p.stage = stage; p.t = 0; p.buf = false; p.bp = 0; p.hit = new Set(); SFX.whoosh();
}
function updPlayer(p) {
  const I = HLD[p.slot], Pp = PRS[p.slot], hr = HEROES[p.hero];
  if (p.inv > 0) p.inv--;
  if (p.flash > 0) p.flash--;
  if (p.cd > 0) p.cd--;
  if (p.ping > 0) p.ping--;
  if (p.hero === 'cogneur' && !p.dying && p.hp < p.maxhp && simF - (p.hurtT | 0) > 300 && simF % 90 === 0) { p.hp++; FX.push({ x: p.x, y: p.y, z: p.z + 44, t: 0, life: 22, txt: '+1', col: '#6f6' }); }
  p.mv = false;
  if (Pp.punch) p.bp = 9; else if (p.bp > 0) p.bp--;       // tampon : une frappe demandée un peu trop tôt est conservée
  if (Pp.special) p.bs = 9; else if (p.bs > 0) p.bs--;
  const gw = p.weapon && WEAPONS[p.weapon];
  if (p.gcd > 0) p.gcd--;
  if (gw && (gw.gun || gw.nade) && (p.st === 'free' || p.st === 'air' || p.st === 'attack')) {
    if (gw.nade) {                                      // grenade : lancée en cloche, explose après ~0,8 s
      if (Pp.throw) { PJ.push({ nade: true, x: p.x + p.face * 10, y: p.y, z: p.z + 20, vx: p.face * 3.4, vy: 0, vz: 2.4, life: 200, fuse: 50, rot: 0, own: p }); p.wd--; if (p.wd <= 0) { p.weapon = null; p.wd = 0; } SFX.whoosh(); }
    } else if ((gw.gun === 'smg' ? I.throw : Pp.throw) && !(p.gcd > 0)) {   // pistolet : un coup par appui ; mitraillette : tir continu
      const smg = gw.gun === 'smg';
      PJ.push({ x: p.x + p.face * 14, y: p.y + (smg ? Math.round((rng() - 0.5) * 4) : 0), z: p.z + 24, vx: p.face * (smg ? 8 : 9), vy: 0, life: 44, rot: 0, bullet: true, magic: true, dmg: smg ? 4 : 10, own: p, hit: new Set() });
      p.gcd = smg ? 5 : 14; p.wd--; p.recoil = 5; if (smg) SFX.smg(); else SFX.shot(); shake = Math.max(shake, smg ? 1 : 2);
      FX.push({ x: p.x + p.face * 18, y: p.y, z: p.z + 24, t: 0, life: 5, big: false });
      if (p.wd <= 0) { p.weapon = null; p.wd = 0; FX.push({ x: p.x, y: p.y, z: p.z + 40, t: 0, life: 36, txt: 'PLUS DE BALLES', col: '#ffd34d' }); }
    }
  } else if (Pp.throw && p.weapon && (p.st === 'free' || p.st === 'air' || p.st === 'attack')) {
    PJ.push({ x: p.x + p.face * 12, y: p.y, z: p.z + 22, vx: p.face * 5.2, life: 56, rot: 0, wtype: p.weapon, wd: p.wd, own: p });
    p.weapon = null; p.wd = 0; SFX.whoosh();
  }
  if (Pp.throw && p.hero === 'papy' && p.cane && (p.st === 'free' || p.st === 'air' || p.st === 'attack')) {
    PJ.push({ x: p.x + p.face * 12, y: p.y, z: p.z + 22, vx: p.face * 5.6, life: 48, rot: 0, cane: true, dmg: 15, own: p });
    p.cane = false; SFX.whoosh();
  }
  if (p.hero === 'papy' && !p.cane) for (const it of IT) if (it.cane) it.x = clamp(it.x, cam + 14, cam + W - 14);   // la canne ne reste pas hors écran
  switch (p.st) {
    case 'free': {
      let dx = (I.right ? 1 : 0) - (I.left ? 1 : 0), dy = (I.down ? 1 : 0) - (I.up ? 1 : 0);
      const crawl = p.hero === 'fauteuil' && p.nochair;
      if (crawl) {
        p.chx = clamp(p.chx, cam + 14, cam + W - 14);
        p.sprint = false; p.x += dx * 0.42; p.y += dy * 0.3;
        if (dx) p.face = dx > 0 ? 1 : -1;
        if (dx || dy) { p.mv = true; p.walk += 0.1; }
        if (Math.abs(p.x - p.chx) < 14 && Math.abs(p.y - p.chy) < 12) { p.nochair = false; p.inv = Math.max(p.inv, 30); FX.push({ x: p.x, y: p.y, z: p.z + 44, t: 0, life: 40, txt: 'REMONTÉ !', col: '#9f9' }); SFX.pick(); }
        break;
      }
      const dp = Pp.right ? 1 : (Pp.left ? -1 : 0);           // sprint : double appui rapide sur une direction
      if (dp) { if (p.dtD === dp && simF - p.dtT <= 16) { if (!p.sprint) FX.push({ x: p.x - dp * 8, y: p.y, z: 3, t: 0, life: 10 }); p.sprint = true; } p.dtD = dp; p.dtT = simF; }
      if (!dx || (p.sprint && dx !== p.dtD)) p.sprint = false;
      const sm = p.sprint ? (p.hero === 'costaud' ? 1.35 : p.hero === 'fauteuil' ? 2.2 : 1.7) : 1;
      if (dx && dy) { dx *= 0.8; dy *= 0.8; }
      p.x += dx * hr.spd * (1 + p.mods.spd) * sm; p.y += dy * hr.spd * (1 + p.mods.spd) * 0.7;
      if (p.hero === 'papy' && !p.cane && (dx || dy)) {                      // sans canne : il titube, dévie, et finit par trébucher
        p.x += Math.sin(simF * 0.11) * 0.28; p.y += Math.cos(simF * 0.08 + p.slot) * 0.3;
        if ((simF + p.slot * 41) % 150 === 0) { p.st = 'hurt'; p.t = 0; p.vx = p.face * 1.6; p.hit = new Set(); FX.push({ x: p.x, y: p.y, z: p.z + 44, t: 0, life: 30, txt: 'oups…', col: '#ffe08a' }); }
      }
      if (p.hero === 'fauteuil' && p.sprint && (simF + p.slot * 29) % 150 === 0 && rng() < 0.3) { fallChair(p, p.face); p.st = 'hurt'; p.t = 0; p.vx = p.face * 2.2; p.hit = new Set(); break; }
      if (dx) p.face = dx > 0 ? 1 : -1;
      if (dx || dy) { p.mv = true; p.walk += 0.14 * hr.spd * (1 + p.mods.spd) * (p.sprint ? 1.5 : 1); }
      if (Pp.jump) { p.st = 'air'; p.vz = hr.jump; p.vx = dx * hr.spd * (1 + p.mods.spd) * sm; p.vy = dy * 0.8; p.kick = false; SFX.jump(); }
      else if (Pp.special || p.bs > 0) {
        const cost = hr.cost;
        if (p.hero === 'papy' && !p.cane) { p.bs = 0; if (Pp.special) FX.push({ x: p.x, y: p.y, z: p.z + 44, t: 0, life: 30, txt: 'sans canne !', col: '#ffe08a' }); }
        else if (p.sp >= cost) {
          p.sp -= cost; p.bs = 0;
          if (p.hero === 'ombre') { p.st = 'special'; p.t = 0; p.hit = new Set(); p.inv = 12; SFX.whoosh(); }
          else if (p.hero === 'vive') { p.st = 'roll'; p.t = 0; p.hit = new Set(); p.inv = 60; p.vx = p.face * 3.4; p.cd = 60; SFX.whoosh(); }
          else if (p.hero === 'gitan' || p.hero === 'magicien' || p.hero === 'electricien') { p.st = 'special'; p.t = 0; p.hit = new Set(); p.inv = 26; SFX.special(); }
          else if (p.hero === 'livreur') { p.st = 'rush'; ultBanner('TOURNEE EXPRESS', '#ffd34d'); SFX.bell(); p.t = 0; p.hit = new Set(); p.inv = 9999; p.rd = p.face; p.rx = p.x; p.ph = 0; p.vx = 0; SFX.special(); }
          else if (p.hero === 'fauteuil') { p.st = 'roll'; p.t = 0; p.hit = new Set(); p.inv = 60; p.vx = p.face * 3.1; p.cd = 60; SFX.whoosh(); }
          else { p.st = 'special'; p.t = 0; p.hit = new Set(); p.inv = 26; SFX.special(); }
        }
      } else if (Pp.punch || p.bp > 0) startAttack(p, 0);
      break;
    }
    case 'attack': {
      p.t++;
      const a = hr.atk[p.stage];
      if (Pp.punch) p.buf = true;
      if (p.hero === 'magicien' && p.stage === 2 && p.t === a.act[0]) PJ.push({ x: p.x + p.face * 14, y: p.y, z: p.z + 24, vx: p.face * 4.6, vy: 0, life: 60, rot: 0, orbm: true, magic: true, dmg: 7, own: p, hit: new Set() });
      if (p.t >= a.act[0] && p.t <= a.act[1]) strike(p, withW(p, a));
      if (p.t >= a.dur) {
        if (p.buf && p.stage < 2) startAttack(p, p.stage + 1);
        else p.st = 'free';
      }
      break;
    }
    case 'air': {
      p.x += p.vx; p.y += p.vy; p.vz -= 0.22; p.z += p.vz;
      if (Pp.punch && !p.kick) { p.kick = true; p.kt = 0; p.hit = new Set(); SFX.whoosh(); }
      if (p.kick) { p.kt++; if (p.kt >= 1 && p.kt <= 24) strike(p, hr.kick); }
      if (p.z <= 0) { p.z = 0; p.st = 'free'; p.kick = false; p.vx = 0; p.vy = 0; }
      break;
    }
    case 'special': {
      p.t++;
      updUlt(p, hr);
      break;
    }
    case 'roll': {
      p.t++; p.x += p.vx; p.vx *= 0.96;
      if (p.hero === 'fauteuil') {
        if (p.t === 1) { ultBanner('TURBO-ROUES', '#ffb060'); p.vx = p.face * 5; }
        p.vx = p.face * Math.max(Math.abs(p.vx), 3.6); p.inv = Math.max(p.inv, 3);
        strikeArea(p, { r: 24, dmg: 14, kd: true, nosp: true });
        if (p.t % 2 === 0) FX.push({ x: p.x - p.face * 10, y: p.y, z: 3, t: 0, life: 16, fx: 'ring', r: 12, col: '#ff9a3a' });
        if (p.t % 6 === 0) { shake = Math.max(shake, 3); SFX.hit(); }
        if (p.t >= 54) { p.st = 'free'; p.vx = 0; p.inv = 30; }
      } else {
        if (p.t === 1) { ultBanner('ROULADE FANTOME', '#8fe0ff'); p.vx = p.face * 4.6; }
        p.vx = p.face * Math.max(Math.abs(p.vx), 3.2); p.inv = Math.max(p.inv, 3);
        strikeArea(p, { r: 22, dmg: 9, kd: p.t > 30, nosp: true });
        if (p.t % 3 === 0) FX.push({ x: p.x, y: p.y, z: 10, t: 0, life: 14, fx: 'ring', r: 14, col: '#8fe0ff' });
        if (p.t >= 48) { p.st = 'free'; p.vx = 0; p.inv = 24; }
      }
      break;
    }
    case 'rush': {                       /* ultime du livreur : aller-retour sur tout l'écran, renverse tout sur son passage */
      p.t++; p.face = p.rd; p.inv = 9999; p.z = 0; p.vz = 0;
      p.x += p.rd * 9.5;
      strikeArea(p, { r: 26, dmg: 18, kd: true, nosp: true });
      if (p.t % 3 === 0) FX.push({ x: p.x - p.rd * 14, y: p.y, z: 6, t: 0, life: 10, big: false });
      if (p.t % 5 === 0) { shake = Math.max(shake, 3); SFX.hit(); }
      if (p.ph === 0 && ((p.rd > 0 && p.x >= cam + W - 16) || (p.rd < 0 && p.x <= cam + 16))) { p.ph = 1; p.rd = -p.rd; p.hit = new Set(); }
      else if (p.ph === 1 && ((p.rd > 0 && p.x >= p.rx) || (p.rd < 0 && p.x <= p.rx)) || p.t > 140) { p.st = 'free'; p.inv = 30; p.cd = 30; p.vx = 0; }
      break;
    }
    case 'hurt': {
      p.t++; p.x += p.vx; p.vx *= 0.8;
      if (p.t >= 16) p.st = 'free';
      break;
    }
    case 'down': {
      p.t++; p.x += p.vx; p.vx *= 0.97; p.vz -= 0.25; p.z += p.vz;
      if (p.z <= 0) { p.z = 0; p.vz = 0; p.vx *= 0.8; p.lie++; }
      if (p.z === 0 && p.lie > 40) {
        if (p.dying) {
          p.lives--;
          if (p.lives > 0) {
            p.hp = p.maxhp; p.dying = false; p.st = 'free'; p.inv = 120; p.x = cam + 40 + p.slot * 24; p.y = 205 + p.slot * 20; p.lie = 0;
          } else { p.out = true; }
        } else { p.st = 'free'; p.inv = 90; p.lie = 0; }
      }
      break;
    }
  }
  p.x = clamp(p.x, cam + 10, cam + W - 10);
  p.y = clamp(p.y, Y0, Y1);
  if (p.st !== 'down') {
    for (const it of IT) {
      if (!it.got && Math.abs(it.x - p.x) < 12 && Math.abs(it.y - p.y) < 10) {
        if (it.cane) { if (p.hero === 'papy' && !p.cane && (p.st === 'free' || p.st === 'air')) { p.cane = true; it.got = true; SFX.pick(); } continue; }
        if (p.hero === 'papy' && it.weapon) continue;                      // le papy ne ramasse pas d'armes (mais bien pommes, viande, potions)
        if (it.weapon) {
          if (!p.weapon && p.st === 'free') { p.weapon = it.type; p.wd = it.wd; it.got = true; SFX.pick(); }
        } else if (it.type === 'energy') { p.sp = Math.min(HEROES[p.hero].cost, p.sp + 40); it.got = true; SFX.pick(); FX.push({ x: p.x, y: p.y, z: p.z + 44, t: 0, life: 30, txt: 'ÉNERGIE', col: '#5ae0ff' });
        } else if (it.type === 'shield') { p.inv = Math.max(p.inv, 200); it.got = true; SFX.lvl(); FX.push({ x: p.x, y: p.y, z: p.z + 44, t: 0, life: 36, txt: 'BOUCLIER', col: '#ffd34d' });
        } else { const hh = it.heal * (p.hero === 'medic' ? 2 : 1); p.hp = Math.min(p.maxhp, p.hp + hh); it.got = true; SFX.pick(); if (p.hero === 'medic') FX.push({ x: p.x, y: p.y, z: p.z + 44, t: 0, life: 30, txt: '+' + hh, col: '#6f6' }); }
      }
    }
    IT = IT.filter(i => !i.got);
  }
}


/* ---------- pièges : l'état dépend uniquement du compteur de simulation simF (identique chez les deux joueurs) ---------- */
function trapHit(q, dmg, kind) {
  if (q.tcd > 0 || q.inv > 0 || q.hp <= 0) return;
  if (kind === 'shock' && ((q.hero === 'fauteuil' && !q.nochair) || q.hero === 'electricien')) { q.tcd = 90; FX.push({ x: q.x, y: q.y, z: q.z + 44, t: 0, life: 30, txt: 'ISOLÉ !', col: '#9df' }); return; }
  q.tcd = 90; q.hp -= dmg; q.flash = 8;
  hitstop = Math.max(hitstop, 5); shake = Math.max(shake, 8);
  FX.push({ x: q.x, y: q.y, z: q.z + 40, t: 0, life: 36, txt: '-' + dmg, col: '#ff5050' });
  if (kind === 'shock') SFX.zap(); else SFX.big();
  if (q.hp <= 0) { q.hp = 0; q.dying = true; knock(q, q.face ? -q.face : 1); SFX.ko(); return; }
  if (kind === 'shock' && q.z <= 0.5) { q.st = 'hurt'; q.t = -26; q.vx = 0; q.shock = 42; q.hit = new Set(); }
  else knock(q, q.face ? -q.face : 1);
}
function updTraps() {
  simF++;
  for (const q of PS) { if (q.tcd > 0) q.tcd--; if (q.shock > 0) q.shock--; }
  for (const q of E) { if (q.tcd > 0) q.tcd--; if (q.shock > 0) q.shock--; }
  for (const q of AL) { if (q.tcd > 0) q.tcd--; if (q.shock > 0) q.shock--; }
  const ents = PS.filter(p => !p.out && !p.dying && p.st !== 'down').concat(E.filter(e => !e.gone && !e.dying && e.st !== 'down'), AL.filter(a => !a.gone && !a.dying && !a.leave && a.st !== 'down'));
  for (const t of TR) {
    const c = (simF + (t.ph || 0)) % (t.per || 1);
    switch (t.t) {
      case 'cable':
        if (c === t.per - 70) SFX.zap();
        if (c >= t.per - 70) for (const q of ents) if (Math.abs(q.x - t.x) < 14 && Math.abs(q.y - t.y) < 9 && q.z < 14) trapHit(q, 60, 'shock');
        break;
      case 'steam':
        if (c === t.per - 34) SFX.steam();
        if (c >= t.per - 34) for (const q of ents) if (Math.abs(q.x - t.x) < 13 && Math.abs(q.y - t.y) < 10 && q.z < 26) trapHit(q, 22, 'burn');
        break;
      case 'fire':
        if (c === t.per - 60) SFX.steam();
        if (c >= t.per - 60) for (const q of ents) if (Math.abs(q.x - t.x) < 15 && Math.abs(q.y - t.y) < 10 && q.z < 24) trapHit(q, 16, 'burn');
        break;
      case 'water':
        if (c === t.per - 44) SFX.steam();
        if (c >= t.per - 44 && c < t.per - 6) for (const q of ents) {
          const dx = (q.x - t.x) * t.dir;
          if (dx > -6 && dx < t.len && Math.abs(q.y - t.y) < 12 && q.z < 16 && q.st !== 'down') { q.x += t.dir * 1.6; trapHit(q, 14, 'water'); }
        }
        break;
      case 'crate':
        if (c === t.per - 1) {
          shake = Math.max(shake, 7); SFX.brk();
          for (const q of ents) if (Math.abs(q.x - t.x) < 19 && Math.abs(q.y - t.y) < 14 && q.z < 22) trapHit(q, 32, 'smash');
        }
        break;
      case 'press':
        if (c === t.per - 14) SFX.whoosh();
        if (c >= t.per - 14 && c < t.per - 2) for (const q of ents) if (Math.abs(q.x - t.x) < 22 && Math.abs(q.y - t.y) < 16 && q.z < 16) trapHit(q, 38, 'smash');
        break;
      case 'belt':
        for (const q of PS) if (!q.out && !q.dying && q.st !== 'down' && q.z <= 0.5 && q.x > t.x && q.x < t.x + t.w) q.x += t.dir * 0.8;
        break;
      case 'bolt': {
        if (c === t.per - 46) {
          const al = PS.filter(p => !p.out && !p.dying), n = Math.floor((simF + t.ph) / t.per);
          if (al.length) {
            const pl = al[n % al.length];
            t.tx = clamp(pl.x + ((n * 53) % 41 - 20), cam + 18, cam + W - 18); t.ty = clamp(pl.y + ((n * 29) % 21 - 10), Y0 + 4, Y1 - 4);
          }
        }
        if (c === t.per - 1 && t.tx !== undefined) {
          shake = Math.max(shake, 10); SFX.zap(); SFX.thunder();
          for (const q of ents) if (Math.abs(q.x - t.tx) < 14 && Math.abs(q.y - t.ty) < 10) trapHit(q, 30, 'shock');
          t.hitT = 14;
        }
        if (t.hitT > 0) t.hitT--;
        break;
      }
    }
  }
}


/* ---------- attaques spéciales et ultimes des boss ---------- */
function startBspec(e, kind) {
  if (kind === 'ult') kind = LV.ult;
  const ult = ['rush', 'rain', 'furnace', 'storm', 'jets'].includes(kind);
  if (ult) { ultT = 120; ultK = kind; shake = Math.max(shake, 5); SFX.special(); }
  if (kind === 'rush') { e.rush = 2; e.ultR = true; startTele(e, 'charge'); e.tele = 54; return; }
  e.st = 'bspec'; e.sk = kind; e.t = 0; e.hit = new Set(); e.mode = 'punch'; e.mk = false; e.hide = false;
  e.sx = e.x; e.sy = e.y;
}
function bossHurt(e, p, dmg, dir) {
  if (p.inv > 0 || p.st === 'down' || p.dying || p.out) return false;
  hurt(p, { kind: 'e' }, { dmg: Math.round(dmg * (e.dm || 1)), kd: true }, dir);
  return true;
}
function updBspec(e) {
  const p = targetOf(e), k = e.sk, t = ++e.t, dm = e.dm || 1;
  const end = n => { if (t >= n) { e.st = 'recover'; e.t = 0; e.mk = false; e.hide = false; } };
  switch (k) {
    case 'leap':
      if (t === 1) { e.tx = clamp(p.x, cam + 24, cam + W - 24); e.ty = clamp(p.y, Y0 + 4, Y1 - 4); e.mk = true; }
      if (t < 30) e.face = e.tx >= e.x ? 1 : -1;
      else if (t <= 48) { const u = (t - 30) / 18; e.x = e.sx + (e.tx - e.sx) * u; e.y = e.sy + (e.ty - e.sy) * u; e.z = Math.sin(Math.PI * u) * 62; if (t === 31) SFX.whoosh(); }
      if (t === 49) {
        e.z = 0; e.mk = false; shake = Math.max(shake, 10); SFX.big();
        FX.push({ x: e.x, y: e.y, z: 6, t: 0, life: 14, big: true });
        HZ.push({ k: 'ring', x: e.x, y: e.y, r: 4, max: 60, spd: 2.8, dmg: 14, dm, hit: new Set() });
        for (const q of livePlayers()) if (Math.abs(q.x - e.x) < 32 && Math.abs(q.y - e.y) < 18 && q.z < 20) bossHurt(e, q, 18, q.x >= e.x ? 1 : -1);
      }
      end(68); break;
    case 'wave':
      if (t < 24) e.face = p.x >= e.x ? 1 : -1;
      if (t === 26) {
        SFX.big(); shake = Math.max(shake, 5);
        for (const s of [1, -1]) PJ.push({ x: e.x + s * 14, y: e.y, z: 0, vx: s * 3.4, life: 130, rot: 0, wave: true, dmg: 14, dm, hit: new Set() });
      }
      end(46); break;
    case 'quake':
      if (t === 30) { SFX.big(); shake = Math.max(shake, 8); HZ.push({ k: 'ring', x: e.x, y: e.y, r: 6, max: 110, spd: 2.3, dmg: 16, dm, hit: new Set() }); }
      end(52); break;
    case 'shots':
      if (t < 22) e.face = p.x >= e.x ? 1 : -1;
      for (const at of [24, 38]) if (t === at) {
        SFX.whoosh();
        for (const dy of [-14, 0, 14]) PJ.push({ x: e.x + e.face * 12, y: clamp(e.y + dy, Y0, Y1), z: 22, vx: e.face * 3.6, life: 120, rot: 0, orb: true, dmg: 9, dm });
      }
      end(54); break;
    case 'blink':
      if (t === 1) { e.tx = clamp(p.x - p.face * 30, cam + 24, cam + W - 24); e.ty = clamp(p.y, Y0 + 4, Y1 - 4); e.mk = true; e.hide = true; }
      if (t < 24) e.inv = 30;
      if (t === 24) { e.x = e.tx; e.y = e.ty; e.hide = false; e.mk = false; e.face = p.x >= e.x ? 1 : -1; SFX.whoosh(); e.hit = new Set(); }
      if (t >= 32 && t <= 36) strike(e, { reach: 36, dmg: Math.round(15 * dm), kd: true });
      end(52); break;
    case 'escort':
      if (t === 20) { if (E.filter(z => !z.gone && !z.dying).length < 6) { spawn(LV.summon[0], 1); spawn(LV.summon[1], -1); } SFX.big(); }
      end(44); break;
    case 'jets':
      if (t === 1 || t === 84) {
        const dir = e.x < cam + W / 2 ? 1 : -1;
        for (const q of livePlayers()) HZ.push({ k: 'jet', y: clamp(q.y, Y0 + 6, Y1 - 6), t: 0, warn: 54, dur: 34, dmg: 20, dm, dir, hit: new Set() });
        for (let i = 0; i < 2; i++) HZ.push({ k: 'jet', y: Y0 + 8 + Math.floor(rng() * 5) * 20, t: 0, warn: 54, dur: 34, dmg: 20, dm, dir, hit: new Set() });
      }
      end(170); break;
    case 'furnace':
      if (t === 70) { SFX.big(); shake = 12; HZ.push({ k: 'ring', x: e.x, y: e.y, r: 8, max: 250, spd: 2.5, dmg: 28, dm, hit: new Set(), fire: true }); }
      if (t === 112) { SFX.big(); shake = 12; HZ.push({ k: 'ring', x: e.x, y: e.y, r: 8, max: 250, spd: 2.5, dmg: 28, dm, hit: new Set(), fire: true }); }
      end(150); break;
    case 'rain': case 'storm':
      if (t === 1) {
        const al = livePlayers(), n = k === 'storm' ? 6 : 8;
        for (let i = 0; i < n; i++) {
          const q = al[i % Math.max(1, al.length)] || p;
          HZ.push({ k: 'strike', fx: k === 'storm' ? 'bolt' : 'anchor', x: clamp(q.x + (rng() - 0.5) * 70, cam + 20, cam + W - 20), y: clamp(q.y + (rng() - 0.5) * 40, Y0 + 4, Y1 - 4), t: -i * 13, warn: 56, r: 22, dmg: k === 'storm' ? 22 : 28, dm });
        }
      }
      if (k === 'storm' && (t === 60 || t === 100)) { for (const dy of [-16, 0, 16]) PJ.push({ x: e.x + e.face * 12, y: clamp(e.y + dy, Y0, Y1), z: 22, vx: e.face * 3.6, life: 120, rot: 0, orb: true, dmg: 9, dm }); }
      end(190); break;
  }
}
function updHz() {
  if (ultT > 0) ultT--;
  for (const h of HZ) {
    if (h.k === 'ring') {
      h.r += h.spd;
      for (const q of livePlayers()) {
        if (h.hit.has(q) || q.inv > 0 || q.st === 'down' || q.z >= 12) continue;
        const d = Math.hypot(q.x - h.x, (q.y - h.y) * 2.2);
        if (Math.abs(d - h.r) < 9) { h.hit.add(q); hurt(q, { kind: 'e' }, { dmg: Math.round(h.dmg * h.dm), kd: true }, q.x >= h.x ? 1 : -1); }
      }
      if (h.r >= h.max) h.dead = true;
    } else if (h.k === 'gas') {
      h.t++;
      if (h.t % 36 === 0) for (const q of livePlayers()) if (!(q.inv > 0) && q.st !== 'down' && q.z < 20 && Math.abs(q.x - h.x) < h.r && Math.abs(q.y - h.y) < h.r * 0.55) hurt(q, { kind: 'e' }, { dmg: 4, kd: false, nosp: true }, q.face ? -q.face : 1);
      if (h.t >= h.life) h.dead = true;
    } else if (h.k === 'jet') {
      h.t++;
      if (h.t >= h.warn && h.t < h.warn + h.dur) {
        if (h.t === h.warn) { SFX.steam(); shake = Math.max(shake, 4); }
        for (const q of livePlayers()) {
          if (q.st === 'down' || q.z >= 14 || Math.abs(q.y - h.y) > 13) continue;
          q.x += h.dir * 2.6;
          if (!h.hit.has(q) && !(q.inv > 0)) { h.hit.add(q); hurt(q, { kind: 'e' }, { dmg: Math.round(h.dmg * h.dm), kd: true }, h.dir); }
        }
      }
      if (h.t >= h.warn + h.dur) h.dead = true;
    } else if (h.k === 'lift') {                          /* cabine d'ascenseur / bloc de roche qui s'écrase */
      h.t++;
      if (h.t === h.warn) {
        shake = Math.max(shake, h.rock ? 7 : 15); SFX.big(); if (!h.rock) SFX.zap();
        for (const q of livePlayers()) if (!(q.inv > 0) && q.st !== 'down' && Math.abs(q.x - h.x) < h.r && Math.abs(q.y - h.y) < h.r * 0.55 && q.z < 40) hurt(q, { kind: 'e' }, { dmg: Math.round(h.dmg * h.dm), kd: true }, q.x >= h.x ? 1 : -1);
        for (const e of E) if (!e.gone && !e.dying && e.type !== 'boss' && Math.abs(e.x - h.x) < h.r && Math.abs(e.y - h.y) < h.r * 0.55) hurt(e, { kind: 'e' }, { dmg: 40, kd: true, nosp: true }, e.x >= h.x ? 1 : -1);
        for (const b of B) if (!b.gone && Math.abs(b.x - h.x) < h.r && Math.abs(b.y - h.y) < h.r * 0.55) breakBarrel(b);
        for (let k = 0; k < 6; k++) FX.push({ x: h.x + (k - 2.5) * h.r / 3, y: h.y, z: 4 + (k & 1) * 8, t: 0, life: 18, big: true });
        ring(h.x, h.y, h.r * 1.6, h.rock ? '#b0a090' : '#d8d8e8', 24);
      }
      if (h.t >= h.warn + 70) h.dead = true;
    } else if (h.k === 'strike') {
      h.t++;
      if (h.t === h.warn) {
        shake = Math.max(shake, 7); SFX.zap(); if (h.fx === 'bolt') SFX.thunder();
        for (const q of livePlayers()) if (!(q.inv > 0) && q.st !== 'down' && Math.abs(q.x - h.x) < h.r && Math.abs(q.y - h.y) < h.r * 0.7 && q.z < 40) hurt(q, { kind: 'e' }, { dmg: Math.round(h.dmg * h.dm), kd: true }, q.x >= h.x ? 1 : -1);
      }
      if (h.t >= h.warn + 16) h.dead = true;
    }
  }
  HZ = HZ.filter(h => !h.dead);
}

/* ---------- ennemis ---------- */
function targetOf(e) {
  let best = null, bd = 1e9;
  for (const p of PS) {
    if (p.out || p.dying) continue;
    const d = Math.abs(p.x - e.x) + Math.abs(p.y - e.y) * 1.5;
    if (d < bd) { bd = d; best = p; }
  }
  return best || PS.find(p => !p.out) || PS[0];
}
function startTele(e, mode) {
  const d = T[e.type];
  e.st = 'tele'; e.t = 0; e.mode = mode; e.hit = new Set();
  e.tele = mode === 'charge' ? 36 : d.atk.tele;
  e.combo = (e.type === 'boss' && e.phase >= 2 && mode === 'punch') ? 1 : 0;
}
function bossPhase(e) {
  const r = e.hp / e.maxhp, ph = r > 0.66 ? 1 : (r > 0.33 ? 2 : 3);
  if (ph > e.phase) {
    e.phase = ph; e.ultQ = true;
    if (ph === 3) { spawn(LV.summon[0], 1); spawn(LV.summon[1], -1); }
  }
}
function updEnemy(e) {
  const d = T[e.type], p = targetOf(e);
  if (e.flash > 0) e.flash--;
  if (e.inv > 0) e.inv--;
  if (e.cool > 0) e.cool--;
  if (e.st !== 'move') e.mv = false;
  switch (e.st) {
    case 'move': {
      if (e.type === 'boss') {
        bossPhase(e);
        if (e.spc > 0) e.spc--;
        if (e.phase >= 3 && e.ultCd > 0 && --e.ultCd === 0) { e.ultQ = true; e.ultCd = 1000; }
        if (e.ultQ && p.st !== 'down') { e.ultQ = false; startBspec(e, 'ult'); break; }
        if (e.spc <= 0 && e.cool <= 0 && !p.out && p.st !== 'down') {
          const L = LV.bspec[e.phase - 1];
          startBspec(e, L[Math.floor(rng() * L.length)]); e.spc = rnd(150, 250) * (e.phase === 3 ? 0.7 : 1); break;
        }
      }
      e.face = p.x >= e.x ? 1 : -1;
      e.walk += 0.18;
      const sp = d.sp * (e.spm || 1) * (e.type === 'boss' ? 1 + 0.15 * (e.phase - 1) : 1);
      const maxAtt = nPlayers >= 3 ? 4 : nPlayers === 2 ? 3 : 2;
      const busy = attackers >= maxAtt || e.cool > 0;
      const rr = d.atk.reach + (e.weapon ? WEAPONS[e.weapon].reach * 0.8 : 0);
      let tx, ty = p.y, goW = null;
      if (!e.weapon && e.likesW && e.type !== 'boss') {
        let bd = 110;
        for (const it of IT) {
          if (!it.weapon || it.got || it.x < cam + 12 || it.x > cam + W - 12) continue;
          const dd = Math.abs(it.x - e.x) + Math.abs(it.y - e.y);
          if (dd < bd) { bd = dd; goW = it; }
        }
      }
      if (goW) { tx = goW.x; ty = goW.y; }
      else if (d.ranged && !e.weapon && E.filter(z => !z.gone && !z.dying && z.type !== 'boss').length > 2) tx = clamp(p.x + e.side * 150, cam + 24, cam + W - 24);
      else tx = p.x + e.side * (busy ? 60 + e.slot : rr - 8);
      const dx = tx - e.x, dy = ty - e.y, dist = Math.sqrt(dx * dx + dy * dy);
      if (goW && Math.abs(dx) < 9 && Math.abs(dy) < 8) { goW.got = true; e.weapon = goW.type; e.wd = goW.wd; SFX.pick(); }
      e.mv = dist > 2;
      if (dist > 2) { e.x += dx / dist * sp; e.y += dy / dist * sp * 0.75; }
      e.y = clamp(e.y, Y0, Y1);
      if (!busy && p.st !== 'down' && !p.dying && !p.out) {
        if (d.ranged && !e.weapon) {
          if (Math.abs(p.x - e.x) < rr + 6 && Math.abs(p.y - e.y) < 9) startTele(e, 'punch');
          else if (Math.abs(p.y - e.y) < 8 && Math.abs(p.x - e.x) > 80 && e.x > cam + 10 && e.x < cam + W - 10) startTele(e, 'throw');
        } else if (Math.abs(p.x - e.x) < rr + 6 && Math.abs(p.y - e.y) < 9) startTele(e, 'punch');
        else if ((e.type === 'boss' || d.charger) && Math.abs(p.x - e.x) > 70 && rng() < (e.type === 'boss' ? 0.02 : 0.014)) startTele(e, 'charge');
        else if (e.weapon && e.type !== 'boss' && Math.abs(p.y - e.y) < 8 && Math.abs(p.x - e.x) > 70 && Math.abs(p.x - e.x) < 150 && rng() < 0.01) startTele(e, 'throw');
      }
      break;
    }
    case 'tele': {
      e.t++;
      if (e.t < e.tele - 6) e.face = p.x >= e.x ? 1 : -1;
      if (e.t >= e.tele) {
        e.t = 0; e.hit = new Set();
        if (e.mode === 'throw') {
          if (d.gun && !e.weapon) { PJ.push({ x: e.x + e.face * 14, y: e.y, z: 24, vx: e.face * 4.6, vy: 0, life: 90, rot: 0, bullet: true, dmg: 9, dm: e.dm }); SFX.shot(); e.st = 'recover'; e.t = 0; break; }
          PJ.push({ x: e.x + e.face * 10, y: e.y, z: 22, vx: e.face * (e.weapon ? 3.6 : 2.8), life: (d.gas && !e.weapon) ? 62 : 140, col: d.pj, rot: 0, wtype: e.weapon || undefined, wd: e.wd, dm: e.dm, can: (d.gas && !e.weapon) || undefined });
          e.weapon = null; e.wd = 0;
          e.st = 'recover'; SFX.whoosh();
        } else if (e.mode === 'charge') { e.st = 'charge'; e.vx = e.face * (e.rush > 0 || e.ultR ? 5.4 : 3.8); SFX.whoosh(); }
        else { e.st = 'attack'; SFX.whoosh(); }
      }
      break;
    }
    case 'attack': {
      e.t++;
      const a = d.atk;
      if (e.t >= a.act[0] && e.t <= a.act[1]) strike(e, withW(e, a));
      if (e.t >= a.dur) {
        if (e.combo > 0) { e.combo--; e.st = 'tele'; e.mode = 'punch'; e.tele = 8; e.t = 0; e.hit = new Set(); }
        else { e.st = 'recover'; e.t = 0; }
      }
      break;
    }
    case 'charge': {
      e.t++; e.x += e.vx; e.walk += 0.5;
      strike(e, { reach: 22, dmg: Math.round(14 * (e.dm || 1)), kd: true });
      if (e.t >= 26 || e.x < cam + 8 || e.x > cam + W - 8) {
        if (e.rush > 0) { e.rush--; startTele(e, 'charge'); e.tele = 26; }
        else { e.ultR = false; e.st = 'recover'; e.t = 0; }
      }
      break;
    }
    case 'recover': {
      e.t++;
      if (e.t >= (e.type === 'boss' ? 36 : 28)) {
        e.st = 'move'; e.cool = rnd(40, 90) * (e.type === 'boss' ? 0.6 : 1) * LV.coolM; e.side = rng() < 0.5 ? -1 : 1;
      }
      break;
    }
    case 'bspec': updBspec(e); break;
    case 'hurt': {
      e.t++; e.x += e.vx; e.vx *= 0.8;
      if (e.t >= 18) e.st = 'move';
      break;
    }
    case 'down': {
      e.t++; e.x += e.vx; e.vz -= 0.25; e.z += e.vz;
      if (e.z <= 0) { e.z = 0; e.vz = 0; e.vx *= 0.8; e.lie++; }
      if (e.z === 0 && e.lie > 40) {
        if (e.dying) e.gone = true;
        else { e.st = 'move'; e.inv = 40; e.lie = 0; e.t = 0; e.cool = 30; }
      }
      break;
    }
  }
}
function separate() {
  for (let i = 0; i < E.length; i++) {
    const a = E[i];
    if (a.gone || a.st === 'down') continue;
    for (let j = i + 1; j < E.length; j++) {
      const b = E[j];
      if (b.gone || b.st === 'down') continue;
      if (Math.abs(a.x - b.x) < 12 && Math.abs(a.y - b.y) < 6) {
        const s = a.x < b.x ? -1 : 1;
        a.x += s * 0.5; b.x -= s * 0.5;
        a.y += a.y < b.y ? -0.3 : 0.3; b.y += a.y < b.y ? 0.3 : -0.3;
      }
    }
  }
}
function updItems() {
  for (const it of IT) if (it.ttl !== undefined && !it.got && --it.ttl <= 0) it.got = true;
  IT = IT.filter(i => !i.got);
}
function addGas(b) { if (b.spent) return; b.spent = true; HZ.push({ k: 'gas', x: clamp(b.x, cam + 10, cam + W - 10), y: clamp(b.y, Y0 + 4, Y1 - 4), r: 30, t: 0, life: 280 }); SFX.steam(); }
function dropCane(b, hitX) {
  if (b.spent) return; b.spent = true;
  IT.push({ x: clamp(hitX !== undefined ? hitX : b.x, cam + 14, cam + W - 14), y: clamp(b.y, Y0, Y1), type: 'canne', cane: true, got: false });
}
function dropWeapon(b, hitX) {
  if (!b.wtype || b.spent) return;
  b.spent = true;
  const wd = b.wd - (hitX !== undefined ? 3 : 0);
  if (wd > 0) IT.push({ x: clamp(hitX !== undefined ? hitX : b.x, cam + 12, cam + W - 12), y: clamp(b.y, Y0, Y1), type: b.wtype, weapon: true, wd, got: false, ttl: 720 });
  else { SFX.brk(); FX.push({ x: b.x, y: b.y, z: b.z, t: 0, life: 14, big: true }); }
}
/* « l'appel de mon kopin » : 3 gitans entrent, cognent en mêlée, puis repartent */
/* ===== ULTIMES : bannière, anneaux, éclairs, zone sur tout l'écran (déterministe) ===== */
let uT = 0, uCol = '#fff', uName = '';
function ultBanner(name, col) { uT = 90; uCol = col; uName = name; shake = Math.max(shake, 6); hitstop = Math.max(hitstop, 6); }
function ring(x, y, r, col, life) { FX.push({ x: x, y: y, z: 2, t: 0, life: life || 22, fx: 'ring', r: r, col: col }); }
function bolt(x1, y1, z1, x2, y2, z2, col, life) { FX.push({ x: x1, y: y1, z: z1, x2: x2, y2: y2, z2: z2, t: 0, life: life || 10, fx: 'arc', col: col }); }
function pillar(x, y, w, col, life) { FX.push({ x: x, y: y, z: 0, w: w, t: 0, life: life || 20, fx: 'beam', col: col }); }
function liveE() { return E.filter(e => !e.gone && !e.dying && e.st !== 'down' && e.x > cam - 6 && e.x < cam + W + 6); }
function blast(p, cx, cy, rx, ry, dmg, kd, stun) {
  for (const t of E) {
    if (t.gone || t.dying || t.x < cam - 10 || t.x > cam + W + 10) continue;
    if (t.st === 'down' && !kd) continue;
    if (Math.abs(t.x - cx) > rx || Math.abs(t.y - cy) > ry) continue;
    hurt(t, p, { dmg: dmg, kd: kd, nosp: true }, t.x >= cx ? 1 : -1);
    if (stun && !t.dying && t.type !== 'boss' && t.st !== 'down') { t.st = 'hurt'; t.t = -stun; t.vx = 0; t.shock = stun; t.hit = new Set(); }
  }
  for (const b of B) if (!b.gone && Math.abs(b.x - cx) < rx && Math.abs(b.y - cy) < ry) hurt(b, p, { dmg: dmg }, 1);
}
function updUlt(p, hr) {
  const t = p.t, h = p.hero;
  p.inv = Math.max(p.inv, 3);
  if (h === 'costaud') {
    if (t === 1) ultBanner('SEISME', '#ff8a3a');
    if (t === 12) { blast(p, p.x, p.y, 70, 40, hr.slam + 8, true); ring(p.x, p.y, 70, '#ffb060', 26); shake = 14; SFX.big(); }
    for (const [tt, r] of [[20, 120], [28, 170], [36, 230]]) if (t === tt) { blast(p, p.x, p.y, r, 60, Math.round(hr.slam * 0.6), true); ring(p.x, p.y, r, '#ff8a3a', 26); shake = Math.max(shake, 10); SFX.big(); }
    if (t >= 46) p.st = 'free';
  } else if (h === 'ombre') {
    if (t === 1) ultBanner('DANSE DES OMBRES', '#b080ff');
    if (t >= 6 && t <= 36 && t % 6 === 0) {
      const L = liveE().sort((a, b) => a.x - b.x || a.y - b.y);
      if (L.length) {
        const e = L[(t / 6 + p.slot) % L.length | 0];
        ring(p.x, p.y, 10, '#b080ff', 12); p.x = clamp(e.x + (p.x < e.x ? -16 : 16), cam + 8, cam + W - 8); p.y = clamp(e.y, Y0, Y1); p.face = e.x >= p.x ? 1 : -1;
        hurt(e, p, { dmg: 16, kd: t >= 36, nosp: true }, p.face); bolt(p.x - p.face * 30, p.y, 34, p.x + p.face * 30, p.y, 6, '#e0d0ff', 8); ring(p.x, p.y, 16, '#b080ff', 12); SFX.hit();
      }
    }
    if (t === 42) { blast(p, p.x, p.y, 60, 30, 22, true); ring(p.x, p.y, 60, '#e0d0ff', 22); SFX.big(); }
    if (t >= 50) p.st = 'free';
  } else if (h === 'boxeur') {
    if (t === 1) ultBanner('RAFALE K.O.', '#ff5050');
    if (t < 44) p.x += p.face * 0.9;
    if (t >= 4 && t < 44 && t % 4 === 0) { p.hit = new Set(); strike(p, { reach: 30, dmg: 9, kd: false, zr: 40 }); FX.push({ x: p.x + p.face * 26, y: p.y, z: 24 + (t & 4 ? 8 : -2), t: 0, life: 8, big: true }); SFX.hit(); shake = Math.max(shake, 2); }
    if (t === 46) { p.hit = new Set(); strike(p, { reach: 40, dmg: 34, kd: true, zr: 56 }); ring(p.x + p.face * 30, p.y, 50, '#ff5050', 22); pillar(p.x + p.face * 30, p.y, 16, '#ff8a8a', 18); shake = 14; SFX.big(); }
    if (t >= 58) p.st = 'free';
  } else if (h === 'papy') {
    if (t === 1) ultBanner('COUP DE CANNE DIVIN', '#ffe08a');
    if (t === 14) { for (const e of liveE()) { pillar(e.x, e.y, 14, '#fff6c0', 24); } blast(p, cam + W / 2, p.y, W, 130, 36, true, 30); pillar(p.x + p.face * 20, p.y, 22, '#ffe08a', 24); p.hp = Math.min(p.maxhp, p.hp + 15); ring(p.x, p.y, 40, '#ffe08a', 24); shake = 14; SFX.big(); }
    if (t >= 44) p.st = 'free';
  } else if (h === 'aveugle') {
    if (t === 1) { ultBanner('ECHOLOCATION', '#9df'); p.ping = 300; }
    for (const [tt, r] of [[8, 90], [20, 170], [32, 260]]) if (t === tt) { ring(p.x, p.y, r, '#9df', 30); blast(p, cam + W / 2, p.y, W, 130, 12, tt === 32, 40); SFX.pick(); shake = Math.max(shake, 4); }
    if (t >= 52) p.st = 'free';
  } else if (h === 'gitan') {
    if (t === 1) ultBanner('LA FAMILLE DEBARQUE', '#ffd84a');
    if (t === 12) { callKopins(p); ring(p.x, p.y, 40, '#ffd84a', 24); }
    if (t >= 34) p.st = 'free';
  } else if (h === 'magicien') {
    if (t === 1) ultBanner('PLUIE DE CARTES', '#ff7ab8');
    if (t >= 8 && t <= 44 && t % 4 === 0) {
      const L = liveE(), tx = L.length ? L[(t / 4) % L.length | 0].x : cam + 40 + Math.floor(rng() * (W - 80)), ty = L.length ? L[(t / 4) % L.length | 0].y : Y0 + Math.floor(rng() * (Y1 - Y0));
      pillar(tx, ty, 8, ['#ff7ab8', '#ffe070', '#7ae0ff'][(t / 4) % 3 | 0], 14); blast(p, tx, ty, 26, 20, 10, t >= 40); ring(tx, ty, 18, '#ffe070', 12); SFX.pick();
    }
    if (t === 46) { blast(p, cam + W / 2, p.y, W, 130, 14, true); ring(p.x, p.y, 120, '#ff7ab8', 26); shake = 10; SFX.big(); }
    if (t >= 56) p.st = 'free';
  } else if (h === 'electricien') {
    if (t === 1) ultBanner('FOUDRE EN CHAINE', '#8fe0ff');
    if (t >= 8 && t <= 38 && t % 3 === 0) {
      const L = liveE().sort((a, b) => a.x - b.x), i = (t - 8) / 3 | 0;
      if (L.length) {
        const e = L[i % L.length], f = L[(i + L.length - 1) % L.length];
        bolt(i === 0 ? p.x : f.x, i === 0 ? p.y : f.y, i === 0 ? 30 : 20, e.x, e.y, 20, '#c8f6ff', 12);
        hurt(e, p, { dmg: 14, kd: false, nosp: true }, e.x >= p.x ? 1 : -1);
        if (!e.dying && e.type !== 'boss' && e.st !== 'down') { e.st = 'hurt'; e.t = -40; e.vx = 0; e.shock = 50; e.hit = new Set(); }
        SFX.zap(); shake = Math.max(shake, 3);
      } else bolt(p.x, p.y, 30, p.x + p.face * 80, p.y + (i % 2 ? 10 : -10), 10, '#c8f6ff', 10);
    }
    if (t === 42) { for (const e of liveE()) pillar(e.x, e.y, 10, '#c8f6ff', 16); blast(p, cam + W / 2, p.y, W, 130, 16, true, 50); ring(p.x, p.y, 100, '#8fe0ff', 24); shake = 12; SFX.zap(); }
    if (t >= 52) p.st = 'free';
  } else if (h === 'medic') {
    if (t === 1) ultBanner('DEFIBRILLATEUR', '#6fff9a');
    if (t === 10) {
      for (const q of PS) if (!q.out && !q.dying && (q === p || Math.abs(q.x - p.x) < 200)) {
        const hh = Math.min(60, q.maxhp - q.hp); q.hp += hh; q.flash = 8; q.inv = Math.max(q.inv, 120);
        if (hh > 0) { p.score += hh * (q === p ? 3 : 6); gainXp(p, Math.ceil(hh / 4)); }
        FX.push({ x: q.x, y: q.y, z: q.z + 44, t: 0, life: 44, txt: '+' + hh, col: '#6f6' }); pillar(q.x, q.y, 12, '#9fffb8', 26);
      }
      ring(p.x, p.y, 100, '#6fff9a', 28); blast(p, p.x, p.y, 100, 50, 14, true, 30); SFX.pick(); shake = 8;
    }
    if (t === 22) { ring(p.x, p.y, 170, '#6fff9a', 26); blast(p, p.x, p.y, 170, 70, 8, true); }
    if (t >= 38) p.st = 'free';
  } else {
    if (t === 1) ultBanner('OURAGAN', '#ffb050');
    if (t >= 6 && t <= 50) {
      for (const e of liveE()) { const d = p.x - e.x; if (Math.abs(d) < 110 && Math.abs(e.y - p.y) < 40 && e.type !== 'boss') e.x += Math.sign(d) * 1.4; }
      if (t % 6 === 0) { p.hit = new Set(); blast(p, p.x, p.y, 62, 34, 8, false); ring(p.x, p.y, 30 + (t % 18) * 3, '#ffb050', 14); shake = Math.max(shake, 3); SFX.whoosh(); }
    }
    if (t === 54) { blast(p, p.x, p.y, 90, 44, 18, true); ring(p.x, p.y, 90, '#ffd34d', 24); shake = 12; SFX.big(); }
    if (t >= 62) p.st = 'free';
  }
}
function callKopins(p) {
  AL = AL.filter(q => q.owner !== p);
  const fromL = p.x - cam < W / 2;
  for (let i = 0; i < 3; i++) {
    const side = (i === 1) ? !fromL : fromL;
    AL.push({ kind: 'a', hero: 'gitan', owner: p, slot: p.slot, skin: i, name: ['PEPE', 'TITO', 'NINO'][i], hp: 45, maxhp: 45, weapon: null, wd: 0, tcd: 0, shock: 0, z: 0, x: side ? cam - 14 - i * 10 : cam + W + 14 + i * 10, y: clamp(p.y + (i - 1) * 24, Y0, Y1), z: 0, vx: 0, vy: 0, face: side ? 1 : -1,
      st: 'free', t: 0, stage: 0, walk: i * 2, mv: false, hit: new Set(), inv: 0, flash: 0, cd: 10 + i * 8, life: 300, leave: false, dying: false });
  }
  FX.push({ x: p.x, y: p.y, z: p.z + 50, t: 0, life: 50, txt: 'LA CALOTTE DE SES MORTS !', col: '#ffd34d' });
  SFX.pick();
}
function updAllies() {
  const hr = HEROES.gitan;
  for (const al of AL) {
    if (al.flash > 0) al.flash--;
    if (al.cd > 0) al.cd--;
    if (al.inv > 0) al.inv--;
    al.mv = false;
    if (al.st === 'hurt') { al.t++; al.x += al.vx; al.vx *= 0.8; if (al.t >= 16) { al.st = 'free'; al.t = 0; } continue; }
    if (al.st === 'down') {                            // un kopin renversé par un piège : il se relève, ou ne se relève pas s'il n'a plus de vie
      al.t++; al.x += al.vx; al.vx *= 0.97; al.vz -= 0.25; al.z += al.vz;
      if (al.z <= 0) { al.z = 0; al.vz = 0; al.vx *= 0.8; al.lie++; }
      if (al.z === 0 && al.lie > 34) { if (al.dying) { al.gone = true; FX.push({ x: al.x, y: al.y, z: 20, t: 0, life: 30, txt: al.name + ' : K.O.', col: '#ff9a7a' }); } else { al.st = 'free'; al.inv = 50; al.lie = 0; al.t = 0; } }
      continue;
    }
    al.life--;
    if (al.life <= 0) al.leave = true;
    if (al.leave) {                                    // ils repartent par le bord le plus proche
      if (!al.edge) al.edge = (al.x - cam < W / 2) ? -1 : 1;
      al.x += al.edge * 2.4; al.face = al.edge; al.mv = true; al.walk += 0.22; al.st = 'free';
      if (al.x < cam - 40 || al.x > cam + W + 40) al.gone = true;
      continue;
    }
    if (al.st === 'attack') {
      al.t++;
      const a = hr.atk[al.stage];
      if (al.t >= a.act[0] && al.t <= a.act[1]) {
        const x1 = al.x + al.face * (a.reach + 6 + (al.weapon ? WEAPONS[al.weapon].reach : 0)), lo = Math.min(al.x, x1) - 5, hi = Math.max(al.x, x1) + 5;
        for (const t of E) {
          if (t.gone || t.dying || al.hit.has(t) || t.st === 'down' || t.inv > 0) continue;
          if (t.x < lo || t.x > hi || Math.abs(t.y - al.y) > 13) continue;
          al.hit.add(t);
          const wm = al.weapon ? WEAPONS[al.weapon].mul : 1;
          hurt(t, al.owner, { dmg: Math.max(2, Math.round(a.dmg * 0.4 * wm)), kd: al.stage === 2, nosp: true, ally: true }, al.face);
          if (al.weapon && --al.wd <= 0) { al.weapon = null; FX.push({ x: al.x, y: al.y, z: 30, t: 0, life: 24, txt: 'arme cassée', col: '#ccc' }); }
        }
      }
      if (al.t >= a.dur) {
        if (al.stage < 2 && al.nextCombo) { al.stage++; al.t = 0; al.hit = new Set(); al.nextCombo = false; }
        else { al.st = 'free'; al.cd = 55; }
      }
      continue;
    }
    for (const it of IT) {                              // ramasse ce qui traîne : arme de mêlée, nourriture, énergie (pour son patron), bouclier
      if (it.got || it.cane || Math.abs(it.x - al.x) > 12 || Math.abs(it.y - al.y) > 10) continue;
      if (it.weapon) { const w = WEAPONS[it.type]; if (!al.weapon && !w.gun && !w.nade) { al.weapon = it.type; al.wd = it.wd; it.got = true; SFX.pick(); FX.push({ x: al.x, y: al.y, z: 34, t: 0, life: 24, txt: w.name, col: '#ffd34d' }); } }
      else if (it.type === 'energy') { al.owner.sp = Math.min(HEROES[al.owner.hero].cost, al.owner.sp + 25); it.got = true; SFX.pick(); }
      else if (it.type === 'shield') { al.inv = 200; it.got = true; SFX.lvl(); }
      else if (al.hp < al.maxhp) { al.hp = Math.min(al.maxhp, al.hp + it.heal); it.got = true; SFX.pick(); FX.push({ x: al.x, y: al.y, z: 34, t: 0, life: 24, txt: '+' + it.heal, col: '#6f6' }); }
    }
    let tg = null, bd = 1e9;
    for (const t of E) {
      if (t.gone || t.dying || t.st === 'down' || t.x < cam - 10 || t.x > cam + W + 10) continue;
      const d = Math.abs(t.x - al.x) + Math.abs(t.y - al.y) * 1.5;
      if (d < bd) { bd = d; tg = t; }
    }
    if (tg) {
      const dx = tg.x - al.x, dy = tg.y - al.y;
      al.face = dx >= 0 ? 1 : -1;
      if (Math.abs(dx) > 22) { al.x += Math.sign(dx) * 2.0; al.mv = true; }
      if (Math.abs(dy) > 4) { al.y += Math.sign(dy) * 1.5; al.mv = true; }
      if (al.mv) al.walk += 0.22;
      if (Math.abs(dx) < hr.atk[0].reach + 14 && Math.abs(dy) < 10 && al.cd <= 0) { al.st = 'attack'; al.t = 0; al.stage = 0; al.hit = new Set(); al.nextCombo = true; SFX.whoosh(); }
    } else {
      let it2 = null, bd2 = 130;
      for (const it of IT) { if (it.got || it.cane || it.x < cam || it.x > cam + W) continue; const okw = it.weapon ? (!al.weapon && !WEAPONS[it.type].gun && !WEAPONS[it.type].nade) : (it.type === 'energy' || it.type === 'shield' || al.hp < al.maxhp); const d2 = Math.abs(it.x - al.x) + Math.abs(it.y - al.y); if (okw && d2 < bd2) { bd2 = d2; it2 = it; } }
      if (it2) { const dx2 = it2.x - al.x, dy2 = it2.y - al.y; if (Math.abs(dx2) > 4) { al.x += Math.sign(dx2) * 2.0; al.face = dx2 > 0 ? 1 : -1; al.mv = true; } if (Math.abs(dy2) > 3) { al.y += Math.sign(dy2) * 1.5; al.mv = true; } if (al.mv) al.walk += 0.22; al.y = clamp(al.y, Y0, Y1); continue; }
      const dx = al.owner.x - al.x;
      if (Math.abs(dx) > 40) { al.x += Math.sign(dx) * 1.6; al.face = dx > 0 ? 1 : -1; al.mv = true; al.walk += 0.18; }
    }
    al.y = clamp(al.y, Y0, Y1);
  }
  AL = AL.filter(a => !a.gone);
}
function explode(b) {
  for (let k = 0; k < 9; k++) FX.push({ x: b.x + rnd(-20, 20), y: b.y + rnd(-6, 6), z: rnd(4, 30), t: 0, life: 20, big: true });
  shake = Math.max(shake, 10); hitstop = Math.max(hitstop, 5); SFX.boom();
  for (const t of E.concat(B)) {
    if (t.gone || t.dying) continue;
    if (Math.abs(t.x - b.x) > 48 || Math.abs(t.y - b.y) > 28) continue;
    hurt(t, b.own, { dmg: 22, kd: true, nosp: true }, t.x >= b.x ? 1 : -1);
  }
  for (const q of livePlayers()) if (q !== b.own && Math.abs(q.x - b.x) < 40 && Math.abs(q.y - b.y) < 24) hurt(q, b.own, { dmg: 14, kd: true, nosp: true }, q.x >= b.x ? 1 : -1);
}
function updProj() {
  for (const b of PJ) {
    if (b.nade) {
      b.x += b.vx; b.z += b.vz; b.vz -= 0.2; b.rot += 0.3; b.fuse--;
      if (b.z <= 0) { b.z = 0; b.vz = Math.abs(b.vz) * 0.35; b.vx *= 0.7; }
      if (b.fuse <= 0) { explode(b); b.life = 0; }
      if (b.x < cam - 20 || b.x > cam + W + 20) b.life = 0;
      continue;
    }
    b.x += b.vx; b.y += b.vy || 0; b.life--; b.rot += b.wtype ? 0.55 : 0.4;
    if (b.own) {                       // arme lancée par un joueur : touche ennemis et barils
      for (const t of E.concat(B)) {
        if (t.gone || t.dying) continue;
        if (t.kind !== 'b' && t.st === 'down') continue;
        if (Math.abs(b.x - t.x) < 11 && Math.abs(b.y - t.y) < 10 && Math.abs(b.z - (t.z + 14)) < 28) {
          if (b.magic) { if (!b.hit.has(t)) { b.hit.add(t); hurt(t, b.own, { dmg: b.dmg, kd: false, nosp: true }, Math.sign(b.vx)); if (b.orbm || b.bullet) { b.life = 0; break; } } continue; }
          if (b.star) { hurt(t, b.own, { dmg: b.dmg, kd: false, nosp: true }, Math.sign(b.vx)); b.life = 0; break; }
          if (b.cane) { hurt(t, b.own, { dmg: b.dmg, kd: true }, Math.sign(b.vx)); dropCane(b, t.x); b.life = 0; break; }
          hurt(t, b.own, { dmg: Math.round(9 * WEAPONS[b.wtype].mul), kd: true }, Math.sign(b.vx));
          dropWeapon(b, t.x); b.life = 0; break;
        }
      }
    } else {
      for (const p of livePlayers()) {
        if (b.hit && b.hit.has(p)) continue;
        if (p.inv <= 0 && p.st !== 'down' && Math.abs(b.x - p.x) < 8 && Math.abs(b.y - p.y) < 10 && (b.wave ? p.z < 10 : Math.abs(b.z - (p.z + 16)) < 22)) {
          if (b.wave) { b.hit.add(p); hurt(p, { kind: 'e' }, { dmg: Math.round(b.dmg * b.dm), kd: true }, Math.sign(b.vx)); continue; }
          hurt(p, { kind: 'e' }, { dmg: Math.round((b.dmg || (b.wtype ? 10 : 7)) * (b.dm || 1)), kd: !!b.wtype || !!b.orb }, Math.sign(b.vx));
          if (b.can) addGas(b); dropWeapon(b, p.x); b.life = 0; break;
        }
      }
    }
    if (b.x < cam - 20 || b.x > cam + W + 20) b.life = 0;
    if (b.life <= 0 && !b.star && !b.magic) { if (b.cane) dropCane(b); else if (b.can) addGas(b); else dropWeapon(b); }
  }
  PJ = PJ.filter(b => b.life > 0);
}

/* ---------- vagues et caméra ---------- */
/* ===== ÉVÉNEMENTS DE NIVEAU : poursuite (camion fou), ascenseur qui s'effondre, éboulement ===== */
let EV = null, evDone = {};
function updEvents() {
  const evs = LV.events;
  if (!EV && evs && !waveActive) {
    for (let i = 0; i < evs.length; i++) {
      const e = evs[i], w = LV.waves[e.w];
      if (evDone[i] || !w || waveI !== e.w || cam < w.cam - (e.lead || 330)) continue;
      evDone[i] = 1; EV = { ev: e, t: 0, x: cam - 90, hit: {}, n: 0, end: w.cam + 70, lim: w.cam };
      ultBanner(e.k === 'chase' ? 'POURSUITE !' : (e.k === 'lift' ? 'L ASCENSEUR LACHE !' : 'EBOULEMENT !'), '#ff6a4a'); SFX.roar();
      break;
    }
  }
  if (!EV) return;
  const e = EV.ev, dm = Math.min(1.6, LV.dmgM) * DIFFM[DIFF];
  EV.t++;
  if (e.k === 'chase') {
    camLimit = Math.min(camLimit, EV.lim);
    const t = EV.t, spd = 1.12 + Math.min(0.3, t * 0.0007);
    if (t > 40) EV.x = Math.max(EV.x + spd, cam - 60 + Math.min(t - 40, 140) * 0.55);
    if (t === 90 || t === 190 || t === 280) spawn('thug', 1);
    if (t > 40 && t % 24 === 0) { SFX.whoosh(); shake = Math.max(shake, EV.x > cam - 30 ? 3 : 1); }
    if (t > 40 && t % 4 === 0) FX.push({ x: EV.x - 40, y: clamp(EV.y0 || 205, Y0, Y1) + (t % 12) - 6, z: 4, t: 0, life: 14, big: false });
    for (const q of livePlayers()) if (q.st !== 'down' && Math.abs(q.x - EV.x) < 32 && !(q.inv > 0) && (EV.hit[q.slot] | 0) < simF - 100) { EV.hit[q.slot] = simF; hurt(q, { kind: 'e' }, { dmg: Math.round(22 * dm), kd: true }, 1); q.x += 14; }
    for (const m of E) if (!m.gone && !m.dying && m.type !== 'boss' && m.st !== 'down' && Math.abs(m.x - EV.x) < 30) hurt(m, { kind: 'e' }, { dmg: 40, kd: true, nosp: true }, 1);
    for (const b of B) if (!b.gone && Math.abs(b.x - EV.x) < 30) breakBarrel(b);
    if (EV.x >= EV.end || t > 900) { SFX.big(); shake = 10; for (let k = 0; k < 8; k++) FX.push({ x: EV.x - 10 + k * 5, y: 200, z: 6 + k * 4, t: 0, life: 22, big: true }); EV = null; camLimit = waveActive ? camLimit : LEN - W; }
  } else {
    const n = e.k === 'rocks' ? 9 : 3, gap = e.k === 'rocks' ? 34 : 86;
    if (EV.t >= 50 && (EV.t - 50) % gap === 0 && EV.n < n) {
      const L = livePlayers(), q = L.length ? L[EV.n % L.length] : null, rock = e.k === 'rocks';
      const x = clamp((q ? q.x : cam + W / 2) + (rng() - 0.5) * (rock ? 90 : 60) + (rock ? 0 : 30), cam + 30, cam + W - 30), y = clamp((q ? q.y : 200) + (rng() - 0.5) * 40, Y0 + 6, Y1 - 6);
      HZ.push({ k: 'lift', x: x, y: y, t: 0, warn: rock ? 46 : 100, r: rock ? 26 : 50, dmg: rock ? 16 : 30, dm: dm, rock: rock });
      EV.n++;
    }
    if (EV.n >= n && EV.t > 50 + n * gap + 90) EV = null;
  }
}
function updWaves() {
  const w = LV.waves[waveI];
  if (waveActive) {
    if (E.every(e => e.gone || e.dying)) {
      waveActive = false; camLimit = LEN - W; goT = 240; if (!(w && w.boss)) SFX.go();
      if (w && w.boss) endT = 150;
      waveI++;
    }
  } else if (w && !EV && cam >= w.cam - 0.01) {
    waveActive = true; camLimit = cam; goT = 0; if (w.boss) SFX.roar();
    for (const [k, s] of w.spawn) spawn(k, s);
    if (nPlayers >= 2 && !w.boss) for (let k = 1; k < Math.min(4, nPlayers); k++) spawn('thug', rng() < 0.5 ? 1 : -1);
  }
}

