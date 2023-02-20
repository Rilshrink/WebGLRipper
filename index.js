; (function () { // https://stackoverflow.com/questions/70474845/inject-javascript-from-content-script-with-a-chrome-extension-v3
	var s = document.createElement('script');
	s.src = chrome.runtime.getURL('webglripper.js');
	s.onload = function () {
		this.remove();
	};

	// Extremely hacky way to make this work, since you can't access chrome.storage
	chrome.storage.sync.get({
		default_texture_res: '4096x4096',
		do_shader_calc: false,
		is_debug_mode: true,
		unflip_textures: true
	}, function(items) {
		let hiddenSettings = document.createElement("p");
		hiddenSettings.id = "webgl_ripper_settings";
		hiddenSettings.textContent = JSON.stringify(items);
		hiddenSettings.hidden = true;
		(document.head || document.documentElement).appendChild(hiddenSettings);
	}); // Add settings before WebGL Ripper Script

	(document.head || document.documentElement).appendChild(s);
})();