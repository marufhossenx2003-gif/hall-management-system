// Prompt utility functions to replace native dialogs
// Dependencies: assumes existing .modal-overlay and .modal-box styles (similar to info-modal)

function _createModal({title='', message='', input=false, okText='OK', cancelText='Cancel', callback}) {
  // Remove existing custom prompt if any
  const existing = document.getElementById('custom-prompt');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'custom-prompt';
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex'; // ensure visible

  const box = document.createElement('div');
  box.className = 'modal-box';
  box.innerHTML = `
    <div class="modal-header"><h3>${title}</h3></div>
    <div class="modal-body">
      <p id="prompt-message">${message}</p>
      ${input ? '<input id="prompt-input" type="text" class="form-control" style="width:100%;margin-top:8px;"/>' : ''}
    </div>
    <div class="modal-actions" style="margin-top:12px; text-align:right;">
      <button id="prompt-ok" class="btn btn-primary">${okText}</button>
      ${cancelText ? `<button id="prompt-cancel" class="btn btn-outline" style="margin-left:8px;">${cancelText}</button>` : ''}
    </div>`;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const close = (result) => { overlay.remove(); if (callback) callback(result); };

  document.getElementById('prompt-ok').onclick = () => {
    if (input) {
      const val = document.getElementById('prompt-input').value;
      close(val);
    } else {
      close(true);
    }
  };
  const cancelBtn = document.getElementById('prompt-cancel');
  if (cancelBtn) cancelBtn.onclick = () => close(input ? null : false);
}

// Public helpers
function showAlert(message, callback) { _createModal({title:'Alert', message, input:false, okText:'OK', cancelText:null, callback}); }
function showConfirm(message, callback) { _createModal({title:'Confirm', message, input:false, okText:'OK', cancelText:'Cancel', callback}); }
function showPrompt(message, defaultValue, callback) {
  _createModal({title:'Prompt', message, input:true, okText:'OK', cancelText:'Cancel', callback: (val)=> callback(val)});
  if (defaultValue) document.getElementById('prompt-input').value = defaultValue;
}
