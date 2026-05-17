/**
 * Custom inspector editor for importing select/radio/checkbox options from
 * a JSON or CSV file stored in fileadmin/options_providers/.
 *
 * Renders a dropdown populated from the server-side file listing, plus
 * value/label column inputs and an import button.
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
    selectEl.innerHTML = '';
    const errOpt = document.createElement('option');
    errOpt.value = '';
    errOpt.textContent = 'AJAX route not registered \u2013 flush TYPO3 caches';
    selectEl.appendChild(errOpt);
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
    selectEl.innerHTML = '';
    const errOpt = document.createElement('option');
    errOpt.value = '';
    errOpt.textContent = 'Error: ' + detail;
    selectEl.appendChild(errOpt);
  }
}

async function renderOptionsImportEditor(editorConfiguration, editorHtml) {
  const formElement = getCurrentlySelectedFormElement();

  const fileSelect = editorHtml.querySelector('[data-identifier="optionsImportFileSelect"]');
  const valueColInput = editorHtml.querySelector('[data-identifier="optionsImportValueColumn"]');
  const labelColInput = editorHtml.querySelector('[data-identifier="optionsImportLabelColumn"]');
  const importBtn = editorHtml.querySelector('[data-identifier="optionsImportButton"]');
  const statusEl = editorHtml.querySelector('[data-identifier="optionsImportStatus"]');

  if (!fileSelect || !importBtn || !statusEl) {
    return;
  }

  await populateFileDropdown(fileSelect);

  const existingImport = formElement.get('properties.optionsImport');
  if (existingImport && existingImport.source) {
    fileSelect.value = existingImport.source;
    if (existingImport.valueColumn) {
      valueColInput.value = existingImport.valueColumn;
    }
    if (existingImport.labelColumn) {
      labelColInput.value = existingImport.labelColumn;
    }
    statusEl.textContent = 'Last import: ' + (existingImport.importedCount || 0) +
      ' options on ' + (existingImport.importedAt || 'unknown');
    statusEl.classList.remove('text-danger');
    statusEl.classList.add('text-muted');
  }

  importBtn.addEventListener('click', async () => {
    const file = fileSelect.value;
    if (!file) {
      statusEl.textContent = 'Please select a file first.';
      statusEl.classList.add('text-danger');
      return;
    }

    importBtn.disabled = true;
    statusEl.textContent = 'Importing\u2026';
    statusEl.classList.remove('text-danger');
    statusEl.classList.add('text-muted');

    try {
      const response = await new AjaxRequest(TYPO3.settings.ajaxUrls.sitepackage_options_import)
        .post({
          file: file,
          valueColumn: valueColInput.value.trim() || 'value',
          labelColumn: labelColInput.value.trim() || 'label',
        });

      const result = await response.resolve();

      if (!result.success) {
        throw new Error(result.error || 'Import failed.');
      }

      formElement.set('properties.options', result.options);
      formElement.set('properties.optionsImport', result.optionsImport);

      const count = result.optionsImport.importedCount;
      const source = result.optionsImport.source;
      statusEl.textContent = 'Imported ' + count + ' options from ' + source +
        '. Save the form to persist, or click the element again to see the options grid.';
      statusEl.classList.remove('text-danger');
      statusEl.classList.add('text-success');
    } catch (err) {
      const message = err.message || 'Import failed.';
      statusEl.textContent = message;
      statusEl.classList.remove('text-success', 'text-muted');
      statusEl.classList.add('text-danger');
    } finally {
      importBtn.disabled = false;
    }
  });
}

const COLLAPSE_THRESHOLD = 20;

function collapsePropertyGridIfLarge(editorConfiguration, editorHtml) {
  if (editorConfiguration.templateName !== 'Inspector-PropertyGridEditor') {
    return;
  }
  if (editorConfiguration.propertyPath !== 'properties.options') {
    return;
  }

  const gridEl = editorHtml.querySelector('typo3-form-property-grid-editor');
  if (!gridEl) {
    return;
  }

  const checkAndCollapse = () => {
    const entries = gridEl.entries;
    if (!entries || entries.length <= COLLAPSE_THRESHOLD) {
      return;
    }

    if (editorHtml.querySelector('[data-identifier="optionsGridToggle"]')) {
      return;
    }

    const wrapper = gridEl.parentElement;
    if (!wrapper) {
      return;
    }

    gridEl.style.display = 'none';

    const toggleBar = document.createElement('div');
    toggleBar.setAttribute('data-identifier', 'optionsGridToggle');
    toggleBar.style.cssText = 'margin-bottom: 8px;';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'btn btn-default btn-sm';
    toggleBtn.textContent = 'Show all ' + entries.length + ' options';

    let expanded = false;
    toggleBtn.addEventListener('click', () => {
      expanded = !expanded;
      gridEl.style.display = expanded ? '' : 'none';
      toggleBtn.textContent = expanded
        ? 'Hide options (' + (gridEl.entries?.length ?? entries.length) + ' entries)'
        : 'Show all ' + (gridEl.entries?.length ?? entries.length) + ' options';
    });

    toggleBar.appendChild(toggleBtn);
    wrapper.insertBefore(toggleBar, gridEl);
  };

  if (gridEl.entries && gridEl.entries.length > 0) {
    checkAndCollapse();
  } else {
    const observer = new MutationObserver(() => {
      if (gridEl.entries && gridEl.entries.length > 0) {
        observer.disconnect();
        checkAndCollapse();
      }
    });
    observer.observe(gridEl, { childList: true, subtree: true, attributes: true });
    setTimeout(() => observer.disconnect(), 3000);
  }
}

export function bootstrap(formEditorApp) {
  _formEditorApp = formEditorApp;

  _formEditorApp.getPublisherSubscriber().subscribe(
    'view/inspector/editor/insert/perform',
    function (topic, args) {
      if (args[0].templateName === 'Inspector-OptionsImportEditor') {
        renderOptionsImportEditor(args[0], args[1]);
      }
      collapsePropertyGridIfLarge(args[0], args[1]);
    }
  );
}
