var is_selecting_keycode = false;
var current_keycode = 45;
var current_keyname = 'Insert';

// Saves options to chrome.storage
function save_options() {
  let defaultTextureRes = document.getElementById('ripper_defaulttexres').value;
  let minimumClears = document.getElementById('ripper_minimumclears').value;
  let shadercalc = document.getElementById('ripper_shadercalc').checked;
  let debugmode = document.getElementById('ripper_debug').checked;
  let unfliptex = document.getElementById('ripper_shouldfliptextures').checked;
  let downloadzip = document.getElementById('ripper_downloadzip').checked;
  let modelview = document.getElementById('ripper_domodelviewmatrix').checked;

  (chrome || browser).storage.sync.set({
    default_texture_res: defaultTextureRes,
    keybind: current_keycode,
    keyname: current_keyname,
    do_shader_calc: shadercalc,
    is_debug_mode: debugmode,
    unflip_textures: unfliptex,
    do_model_view_matrix: modelview,
    should_download_zip: downloadzip,
    minimum_clears: minimumClears
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
    keybind: 45,
    keyname: 'Insert',
    do_shader_calc: false,
    is_debug_mode: false,
    unflip_textures: true,
    do_model_view_matrix: true,
    should_download_zip: true,
    minimum_clears: 1
  }, function(items) {
    document.getElementById('ripper_defaulttexres').value = items.default_texture_res;
    document.getElementById('ripper_shadercalc').checked = items.do_shader_calc;
    document.getElementById('ripper_debug').checked = items.is_debug_mode;
    document.getElementById('ripper_shouldfliptextures').checked = items.unflip_textures;
    document.getElementById('ripper_domodelviewmatrix').checked = items.do_model_view_matrix;
    document.getElementById('ripper_downloadzip').checked = items.should_download_zip;
    document.getElementById('ripper_minimumclears').value = items.minimum_clears;
    document.getElementById('ripper_keybind').value = `Keybind: ${items.keyname}`;
    current_keycode = items.keybind;
    current_keyname = items.keyname;
    is_selecting_keycode = false;
  });
}

document.addEventListener('keydown', function (event) {
  if(!is_selecting_keycode) {
    return;
  }

  current_keycode = event.which;
  current_keyname = event.code;
  document.getElementById('ripper_keybind').value = `Keybind: ${current_keyname}`;
  is_selecting_keycode = false;
});

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('ripper_keybind').addEventListener('click', function() {
  is_selecting_keycode = !is_selecting_keycode;
  if(is_selecting_keycode) {
    document.getElementById('ripper_keybind').value = 'Waiting...';
  } else {
    document.getElementById('ripper_keybind').value = `Keybind: ${current_keyname}`;
  }
});