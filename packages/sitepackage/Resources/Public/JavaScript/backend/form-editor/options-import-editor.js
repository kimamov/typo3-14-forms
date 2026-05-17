/**
 * Form Editor inspector module for the "Options Provider" feature.
 *
 * Instead of importing options into the YAML, this saves only a lightweight
 * reference (file, columns) as `properties.optionsProvider`. The actual
 * options are resolved at render time by a PSR-14 event listener.
 */
import AjaxRequest from '@typo3/core/ajax/ajax-request.js';

let _formEditorApp = null;

function getFormEditorApp() {
  return _formEditorApp;
}

function getCurrentlySelectedFormElement() {
  return getFormEditorApp().getCurrentlySelectedFormElement();
}

async function populateFileDropdown(selectEl) {
  const ajaxUrl = TYPO3.settings.ajaxUrls.sitepackage_options_import_files;
  if (!ajaxUrl) {
    selectEl.innerHTML = '<option value="">AJAX route not registered \u2013 flush TYPO3 caches</option>';
    return;
  }

  try {
    const response = await new AjaxRequest(ajaxUrl).get();
    const data = await response.resolve();

    selectEl.innerHTML = '';

    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-- select a file --';
    selectEl.appendChild(emptyOption);

    if (!data.success || !data.files || data.files.length === 0) {
      const noFiles = document.createElement('option');
      noFiles.value = '';
      noFiles.disabled = true;
      noFiles.textContent = data.error
        ? 'Error: ' + data.error
        : 'No files found in ' + (data.directory || 'options_providers');
      selectEl.appendChild(noFiles);
      return;
    }

    for (const file of data.files) {
      const opt = document.createElement('option');
      opt.value = file.identifier;
      opt.textContent = file.name;
      selectEl.appendChild(opt);
    }
  } catch (err) {
    let detail = err.message || 'failed to load file list';
    if (err.response) {
      try {
        const body = await err.response.resolve();
        if (body && body.error) {
          detail = body.error;
        }
      } catch {
        detail = 'HTTP ' + (err.response.status || 'error');
      }
    }
    selectEl.innerHTML = '<option value="">Error: ' + detail + '</option>';
  }
}

function renderPreviewTable(previewEl, options) {
  const entries = Object.entries(options);
  const count = entries.length;
  const PREVIEW_LIMIT = 10;

  let html = '<table class="table table-sm table-bordered mb-0">'
    + '<thead><tr><th>Value</th><th>Label</th></tr></thead><tbody>';

  const slice = entries.slice(0, PREVIEW_LIMIT);
  for (const [value, label] of slice) {
    const v = String(value).replace(/</g, '&lt;');
    const l = String(label).replace(/</g, '&lt;');
    html += '<tr><td><code>' + v + '</code></td><td>' + l + '</td></tr>';
  }

  html += '</tbody></table>';

  if (count > PREVIEW_LIMIT) {
    html += '<small class="text-muted">\u2026 and ' + (count - PREVIEW_LIMIT) + ' more (' + count + ' total)</small>';
  }

  previewEl.innerHTML = html;
  previewEl.style.display = '';
}

async function renderOptionsProviderEditor(editorConfiguration, editorHtml) {
  const formElement = getCurrentlySelectedFormElement();

  const fileSelect = editorHtml.querySelector('[data-identifier="optionsProviderFileSelect"]');
  const valueColInput = editorHtml.querySelector('[data-identifier="optionsProviderValueColumn"]');
  const labelColInput = editorHtml.querySelector('[data-identifier="optionsProviderLabelColumn"]');
  const previewBtn = editorHtml.querySelector('[data-identifier="optionsProviderPreviewBtn"]');
  const clearBtn = editorHtml.querySelector('[data-identifier="optionsProviderClearBtn"]');
  const statusEl = editorHtml.querySelector('[data-identifier="optionsProviderStatus"]');
  const previewEl = editorHtml.querySelector('[data-identifier="optionsProviderPreview"]');

  if (!fileSelect || !previewBtn || !statusEl) {
    return;
  }

  await populateFileDropdown(fileSelect);

  const existingProvider = formElement.get('properties.optionsProvider');
  if (existingProvider && existingProvider.source) {
    fileSelect.value = existingProvider.source;
    if (existingProvider.valueColumn) {
      valueColInput.value = existingProvider.valueColumn;
    }
    if (existingProvider.labelColumn) {
      labelColInput.value = existingProvider.labelColumn;
    }
    statusEl.textContent = 'Provider active: ' + existingProvider.source;
    statusEl.classList.add('text-muted');
    clearBtn.style.display = '';
  }

  function saveProvider() {
    const file = fileSelect.value;
    if (!file) {
      formElement.set('properties.optionsProvider', null);
      clearBtn.style.display = 'none';
      statusEl.textContent = 'Provider removed. Save the form to persist.';
      statusEl.className = 'form-text mt-1 text-warning';
      previewEl.style.display = 'none';
      return;
    }

    const provider = {
      source: file,
      valueColumn: valueColInput.value.trim() || 'value',
      labelColumn: labelColInput.value.trim() || 'label',
    };

    formElement.set('properties.optionsProvider', provider);
    clearBtn.style.display = '';
    statusEl.textContent = 'Provider set: ' + file + '. Save the form to persist.';
    statusEl.className = 'form-text mt-1 text-success';
  }

  fileSelect.addEventListener('change', saveProvider);
  valueColInput.addEventListener('change', saveProvider);
  labelColInput.addEventListener('change', saveProvider);

  clearBtn.addEventListener('click', () => {
    fileSelect.value = '';
    saveProvider();
  });

  previewBtn.addEventListener('click', async () => {
    const file = fileSelect.value;
    if (!file) {
      statusEl.textContent = 'Please select a file first.';
      statusEl.className = 'form-text mt-1 text-danger';
      return;
    }

    previewBtn.disabled = true;
    statusEl.textContent = 'Loading preview\u2026';
    statusEl.className = 'form-text mt-1 text-muted';

    try {
      const response = await new AjaxRequest(TYPO3.settings.ajaxUrls.sitepackage_options_import)
        .post({
          file: file,
          valueColumn: valueColInput.value.trim() || 'value',
          labelColumn: labelColInput.value.trim() || 'label',
        });

      const result = await response.resolve();

      if (!result.success) {
        throw new Error(result.error || 'Preview failed.');
      }

      const count = Object.keys(result.options).length;
      statusEl.textContent = count + ' options found in ' + file;
      statusEl.className = 'form-text mt-1 text-success';

      renderPreviewTable(previewEl, result.options);
    } catch (err) {
      statusEl.textContent = err.message || 'Preview failed.';
      statusEl.className = 'form-text mt-1 text-danger';
      previewEl.style.display = 'none';
    } finally {
      previewBtn.disabled = false;
    }
  });
}

export function bootstrap(formEditorApp) {
  _formEditorApp = formEditorApp;

  _formEditorApp.getPublisherSubscriber().subscribe(
    'view/inspector/editor/insert/perform',
    function (topic, args) {
      if (args[0].templateName === 'Inspector-OptionsProviderEditor') {
        renderOptionsProviderEditor(args[0], args[1]);
      }
    }
  );
}
