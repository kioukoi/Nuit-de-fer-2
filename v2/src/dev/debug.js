window.__dbg = {
  step, render, keys,
  start: (n, hs) => { nPlayers = n; SEL = [0, 1, 2, 3].map(i => ({ c: Math.max(0, HERO_KEYS.indexOf(hs[i] || ['cogneur', 'vive', 'costaud', 'ombre'][i])), lock: true })); startGame(); },
  ev: s => eval(s),
  net: () => ({ frameNo, desync, online, hostCode, stallT, state, hash: stateHash(), localSlot, room, peerIn: others() > 0, joinBusy, nPlayers, act: act.slice(), paused: netPaused, rttMax, curDelay, ff: FRIENDLY }),
  hits: () => ({ myHash, theirHash }),
  dbgNet: () => ({ frameNo, sentF, rb: rbuf.map(o => Object.keys(o).length).join(','), lb: Object.keys(localBuf).join(','), stallT, rxT, tick, startMsg: !!startMsg }),
  sel: () => ({ SEL: JSON.parse(JSON.stringify(SEL)), selT, nPlayers, localSlot }),
  snap: () => ({
    state, cam, waveI, enemies: E.length, n: nPlayers,
    ps: PS.map(p => ({ hp: p.hp, lives: p.lives, score: p.score, st: p.st, x: Math.round(p.x), y: Math.round(p.y), out: p.out, dying: p.dying, hero: p.hero })),
    list: E.map(e => [e.type, e.st, Math.round(e.x), Math.round(e.y), e.cool, e.dying])
  })
};
