;(function() { // https://stackoverflow.com/questions/70474845/inject-javascript-from-content-script-with-a-chrome-extension-v3
  var s = document.createElement('script');
	s.src = chrome.runtime.getURL('webglripper.js');
	s.onload = function() {
			this.remove();
	};
	(document.head || document.documentElement).appendChild(s);
})();