(function () {
  var touch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia && matchMedia('(pointer:coarse)').matches);
  window.IS_TOUCH = touch;
  if (!touch) return;
  document.body.classList.add('touch');
  var K = function () { return window.__keys; };
  var pad = document.getElementById('pad'), knob = document.getElementById('knob');
  function setDir(dx, dy) {
    var k = K(); if (!k) return;
    k.ArrowLeft = dx < -0.3; k.ArrowRight = dx > 0.3; k.ArrowUp = dy < -0.3; k.ArrowDown = dy > 0.3;
    knob.style.transform = 'translate(' + (dx * 30) + 'px,' + (dy * 30) + 'px)';
  }
  function padMove(e) {
    var r = pad.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2), m = Math.hypot(dx, dy);
    if (m > 1) { dx /= m; dy /= m; }
    setDir(dx, dy);
  }
  pad.addEventListener('pointerdown', function (e) { pad.setPointerCapture(e.pointerId); if (window.unlockAudio) unlockAudio(); padMove(e); e.preventDefault(); });
  pad.addEventListener('pointermove', function (e) { if (pad.hasPointerCapture(e.pointerId)) padMove(e); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { pad.addEventListener(t, function () { setDir(0, 0); }); });
  Array.prototype.forEach.call(document.querySelectorAll('.tb'), function (b) {
    var code = b.getAttribute('data-k');
    b.addEventListener('pointerdown', function (e) { b.setPointerCapture(e.pointerId); if (window.unlockAudio) unlockAudio(); var k = K(); if (k) k[code] = true; b.classList.add('on'); e.preventDefault(); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { b.addEventListener(t, function () { var k = K(); if (k) k[code] = false; b.classList.remove('on'); }); });
  });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
})();
