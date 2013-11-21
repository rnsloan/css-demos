var active = true;

var isIE = navigator.userAgent.indexOf('Trident');

if (active && isIE === '-1') {
    runLiveReload();
}

function runLiveReload() {
    document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>');
}