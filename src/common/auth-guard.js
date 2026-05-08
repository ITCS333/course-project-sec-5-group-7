(function () {
  if (!sessionStorage.getItem('user')) {
    const inSrc = window.location.pathname.includes('/src/');
    window.location.replace(inSrc ? '../auth/login.html' : 'src/auth/login.html');
  }
}());
