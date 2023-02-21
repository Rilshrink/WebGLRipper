// Saves options to chrome.storage
function save_options() {
  let defaultTextureRes = document.getElementById('ripper_defaulttexres').value;
  let shadercalc = document.getElementById('ripper_shadercalc').checked;
  let debugmode = document.getElementById('ripper_debug').checked;
  let unfliptex = document.getElementById('ripper_shouldfliptextures').checked;
  let downloadzip = document.getElementById('ripper_downloadzip').checked;
  (chrome || browser).storage.sync.set({
    default_texture_res: defaultTextureRes,
    do_shader_calc: shadercalc,
    is_debug_mode: debugmode,
    unflip_textures: unfliptex,
    should_download_zip: downloadzip
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  (chrome || browser).storage.sync.get({
    default_texture_res: '4096x4096',
    do_shader_calc: false,
    is_debug_mode: false,
    unflip_textures: true,
    should_download_zip: false
  }, function(items) {
    document.getElementById('ripper_defaulttexres').value = items.default_texture_res;
    document.getElementById('ripper_shadercalc').checked = items.do_shader_calc;
    document.getElementById('ripper_debug').checked = items.is_debug_mode;
    document.getElementById('ripper_shouldfliptextures').checked = items.unflip_textures;
    document.getElementById('ripper_downloadzip').checked = items.should_download_zip;
  });
}

document.addEventListener('keydown', function (event) {
	
});

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);