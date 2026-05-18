/**
 * Form Editor inspector module for the "Options Provider" feature.
 *
 * Saves a lightweight reference (file, columns) as `properties.optionsProvider`
 * plus a stub of the first N options in `properties.options` (required by the
 * Form Editor). The full option set is resolved at render time on the frontend
 * by a PSR-14 event listener.
 */
import AjaxRequest from '@typo3/core/ajax/ajax-request.js';

const STUB_COUNT = 4;

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

function buildStub(allOptions) {
  const stub = {};
  let i = 0;
  for (const [k, v] of Object.entries(allOptions)) {
    if (i >= STUB_COUNT) break;
    stub[k] = v;
    i++;
  }
  return stub;
}

async function fetchOptions(file, valCol, lblCol) {
  const response = await new AjaxRequest(TYPO3.settings.ajaxUrls.sitepackage_options_import)
    .post({ file, valueColumn: valCol, labelColumn: lblCol });
  const result = await response.resolve();
  if (!result.success) {
    throw new Error(result.error || 'Request failed.');
  }
  return result.options;
}

async function renderOptionsProviderEditor(editorConfiguration, editorHtml) {
  const formElement = getCurrentlySelectedFormElement();

  const fileSelect = editorHtml.querySelector('[data-identifier="optionsProviderFileSelect"]');
  const valueColInput = editorHtml.querySelector('[data-identifier="optionsProviderValueColumn"]');
  const labelColInput = editorHtml.querySelector('[data-identifier="optionsProviderLabelColumn"]');
  const applyBtn = editorHtml.querySelector('[data-identifier="optionsProviderApplyBtn"]');
  const previewBtn = editorHtml.querySelector('[data-identifier="optionsProviderPreviewBtn"]');
  const clearBtn = editorHtml.querySelector('[data-identifier="optionsProviderClearBtn"]');
  const statusEl = editorHtml.querySelector('[data-identifier="optionsProviderStatus"]');
  const previewEl = editorHtml.querySelector('[data-identifier="optionsProviderPreview"]');

  if (!fileSelect || !applyBtn || !statusEl) {
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

  applyBtn.addEventListener('click', async () => {
    const file = fileSelect.value;
    if (!file) {
      statusEl.textContent = 'Please select a file first.';
      statusEl.className = 'form-text mt-1 text-danger';
      return;
    }

    applyBtn.disabled = true;
    statusEl.textContent = 'Applying provider\u2026';
    statusEl.className = 'form-text mt-1 text-muted';

    const valCol = valueColInput.value.trim() || 'value';
    const lblCol = labelColInput.value.trim() || 'label';

    try {
      const allOptions = await fetchOptions(file, valCol, lblCol);
      const stub = buildStub(allOptions);

      formElement.set('properties.optionsProvider', {
        source: file,
        valueColumn: valCol,
        labelColumn: lblCol,
      });
      formElement.set('properties.options', stub);

      clearBtn.style.display = '';

      const total = Object.keys(allOptions).length;
      const stubCount = Object.keys(stub).length;
      statusEl.textContent = 'Provider applied: ' + file + ' (' + total
        + ' options, ' + stubCount + ' stored as stub). Save the form to persist.';
      statusEl.className = 'form-text mt-1 text-success';
    } catch (err) {
      statusEl.textContent = err.message || 'Failed to apply provider.';
      statusEl.className = 'form-text mt-1 text-danger';
    } finally {
      applyBtn.disabled = false;
    }
  });

  clearBtn.addEventListener('click', () => {
    fileSelect.value = '';
    formElement.set('properties.optionsProvider', null);
    clearBtn.style.display = 'none';
    previewEl.style.display = 'none';
    statusEl.textContent = 'Provider removed. Save the form to persist.';
    statusEl.className = 'form-text mt-1 text-warning';
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

    const valCol = valueColInput.value.trim() || 'value';
    const lblCol = labelColInput.value.trim() || 'label';

    try {
      const allOptions = await fetchOptions(file, valCol, lblCol);
      const count = Object.keys(allOptions).length;
      statusEl.textContent = count + ' options found in ' + file;
      statusEl.className = 'form-text mt-1 text-success';
      renderPreviewTable(previewEl, allOptions);
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
