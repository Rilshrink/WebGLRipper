; (function () { // https://stackoverflow.com/questions/70474845/inject-javascript-from-content-script-with-a-chrome-extension-v3

	// Extremely hacky way to make this work, since you can't access chrome.storage
	(chrome || browser).storage.sync.get({
		default_texture_res: '4096x4096',
		do_shader_calc: false,
		is_debug_mode: true,
		unflip_textures: true,
		should_download_zip: false,
		minimum_clears: 1
	}, function(items) {

		let hiddenSettings = document.createElement("div");
		hiddenSettings.id = "webgl_ripper_settings";
		hiddenSettings.textContent = JSON.stringify(items);
		hiddenSettings.hidden = true;
		(document.head || document.documentElement).appendChild(hiddenSettings);

		if(items.should_download_zip) {
			let s = document.createElement('script');
			s.src = (chrome || browser).runtime.getURL('jszip.min.js');
			s.onload = function () { this.remove(); };
			(document.head || document.documentElement).appendChild(s);
		}

	}); // Add settings before WebGL Ripper Script

	let s = document.createElement('script');
	s.src = (chrome || browser).runtime.getURL('webglripper.js');
	s.onload = function () { this.remove(); };
	(document.head || document.documentElement).appendChild(s);
})();