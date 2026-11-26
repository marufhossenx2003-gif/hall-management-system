// Custom in-page modal prompts to replace native browser dialogs (alert, confirm, prompt)
// Supports: showAlert, showConfirm, showPrompt, showPasswordPrompt

function _createModal(opts) {
  var title = opts.title || 'Notice';
  var iconName = opts.iconName || 'alert-circle';
  var message = opts.message || '';
  var input = opts.input || false;
  var inputType = opts.inputType || 'text';
  var okText = opts.okText || 'OK';
  var cancelText = opts.cancelText;
  var callback = opts.callback;

  // Remove any existing prompt modal
  var old = document.getElementById('custom-prompt-overlay');
  if (old) old.remove();

  var overlay = document.createElement('div');
  overlay.id = 'custom-prompt-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;animation:promptFadeIn 0.15s ease-out;';

  var box = document.createElement('div');
  box.style.cssText = 'background:var(--bg-surface,#ffffff);border:1px solid var(--border,#e2e8f0);border-radius:14px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.2),0 8px 10px -6px rgba(0,0,0,0.1);width:100%;max-width:420px;overflow:hidden;display:flex;flex-direction:column;font-family:var(--font-body,sans-serif);animation:promptScaleIn 0.18s cubic-bezier(0.16,1,0.3,1);';

  // Modal Header
  var header = document.createElement('div');
  header.style.cssText = 'padding:16px 20px;border-bottom:1px solid var(--border,#e2e8f0);display:flex;align-items:center;gap:10px;background:var(--bg-surface-alt,#f8fafc);';

  var iconWrap = document.createElement('div');
  iconWrap.style.cssText = 'width:32px;height:32px;border-radius:8px;background:var(--primary-light,#eff6ff);color:var(--primary,#3b82f6);display:flex;align-items:center;justify-content:center;flex-shrink:0;';
  iconWrap.innerHTML = '<i data-lucide="' + iconName + '" style="width:18px;height:18px;"></i>';

  var titleEl = document.createElement('h3');
  titleEl.style.cssText = 'font-size:16px;font-weight:700;color:var(--text-main,#0f172a);font-family:var(--font-heading,Montserrat,sans-serif);margin:0;letter-spacing:-0.01em;';
  titleEl.textContent = title;

  header.appendChild(iconWrap);
  header.appendChild(titleEl);
  box.appendChild(header);

  // Modal Body
  var body = document.createElement('div');
  body.style.cssText = 'padding:20px;display:flex;flex-direction:column;gap:12px;';

  var msgEl = document.createElement('p');
  msgEl.style.cssText = 'font-size:14px;color:var(--text-body,#334155);line-height:1.55;margin:0;word-break:break-word;';
  msgEl.textContent = message;
  body.appendChild(msgEl);

  var inputEl = null;
  if (input) {
    inputEl = document.createElement('input');
    inputEl.type = inputType;
    inputEl.className = 'form-control';
    inputEl.style.cssText = 'width:100%;box-sizing:border-box;padding:10px 14px;font-size:14px;border:1.5px solid var(--border,#e2e8f0);border-radius:8px;background:var(--bg-surface,#ffffff);color:var(--text-main,#0f172a);font-family:inherit;outline:none;transition:border-color 0.15s ease, box-shadow 0.15s ease;';
    inputEl.onfocus = function() {
      inputEl.style.borderColor = 'var(--primary,#3b82f6)';
      inputEl.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.18)';
    };
    inputEl.onblur = function() {
      inputEl.style.borderColor = 'var(--border,#e2e8f0)';
      inputEl.style.boxShadow = 'none';
    };
    body.appendChild(inputEl);
  }
  box.appendChild(body);

  // Modal Footer
  var footer = document.createElement('div');
  footer.style.cssText = 'padding:14px 20px;border-top:1px solid var(--border,#e2e8f0);display:flex;justify-content:flex-end;gap:10px;background:var(--bg-surface-alt,#f8fafc);';

  function close(result) {
    overlay.remove();
    if (callback) callback(result);
  }

  if (cancelText !== null && cancelText !== undefined) {
    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.style.cssText = 'padding:8px 16px;font-size:13px;font-weight:600;color:var(--text-body,#334155);border:1px solid var(--border,#cbd5e1);background:#ffffff;cursor:pointer;border-radius:6px;transition:all 0.15s ease;';
    cancelBtn.textContent = cancelText;
    cancelBtn.onclick = function() { close(input ? null : false); };
    footer.appendChild(cancelBtn);
  }

  var okBtn = document.createElement('button');
  okBtn.type = 'button';
  okBtn.style.cssText = 'padding:8px 18px;font-size:13px;font-weight:600;background:var(--primary,#3b82f6);color:#ffffff;border:none;cursor:pointer;border-radius:6px;box-shadow:0 2px 4px rgba(59,130,246,0.25);transition:all 0.15s ease;';
  okBtn.textContent = okText;
  okBtn.onclick = function() {
    if (input) {
      close(inputEl.value);
    } else {
      close(true);
    }
  };
  footer.appendChild(okBtn);
  box.appendChild(footer);

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  if (window.lucide) {
    lucide.createIcons();
  }

  if (inputEl) {
    inputEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        okBtn.click();
      }
    });
    setTimeout(function() {
      inputEl.focus();
      inputEl.select();
    }, 60);
  } else {
    setTimeout(function() {
      okBtn.focus();
    }, 60);
  }

  overlay.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close(input ? null : (cancelText !== null && cancelText !== undefined ? false : true));
    }
  });

  return overlay;
}

function showAlert(message, callback) {
  _createModal({
    title: 'Notice',
    iconName: 'alert-circle',
    message: message,
    input: false,
    okText: 'OK',
    cancelText: null,
    callback: callback
  });
}

function showConfirm(message, callback) {
  _createModal({
    title: 'Please Confirm',
    iconName: 'help-circle',
    message: message,
    input: false,
    okText: 'Confirm',
    cancelText: 'Cancel',
    callback: callback
  });
}

function showPrompt(message, defaultValue, callback, inputType) {
  _createModal({
    title: 'Input Required',
    iconName: 'edit-3',
    message: message,
    input: true,
    inputType: inputType || 'text',
    okText: 'Submit',
    cancelText: 'Cancel',
    callback: function(val) {
      if (callback) callback(val);
    }
  });
  if (defaultValue) {
    var inp = document.querySelector('#custom-prompt-overlay input');
    if (inp) inp.value = defaultValue;
  }
}

function showPasswordPrompt(message, callback) {
  _createModal({
    title: 'Password Protected',
    iconName: 'lock',
    message: message,
    input: true,
    inputType: 'password',
    okText: 'Unlock',
    cancelText: 'Cancel',
    callback: function(val) {
      if (callback) callback(val);
    }
  });
}

// Auto-render icons on DOM readiness
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    if (window.lucide) lucide.createIcons();
  });
} else {
  if (window.lucide) lucide.createIcons();
}
