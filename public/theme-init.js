// İlk render'dan önce temayı uygular (Gereksinimler §6). CSP inline script'e izin vermediği
// için ayrı dosyadır. Mantık src/app/theme.ts ile aynıdır; birini değiştirirsen
// diğerini de güncelle.
(function () {
  var stored = null;
  try {
    stored = localStorage.getItem('theme');
  } catch {
    // Depolama kapalıysa varsayılan: Sistem.
  }
  var pref = stored === 'light' || stored === 'dark' ? stored : 'system';
  var dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  var root = document.documentElement;
  root.classList.toggle('dark', dark);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#111214' : '#F7F7F5');
})();
