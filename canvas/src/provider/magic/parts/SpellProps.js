import { html } from 'htm/preact';
import {
  TextFieldEntry,
  SelectEntry,
  isTextFieldEntryEdited
} from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

// Importe o `createElement` para usar com JSX/HTM e CSS
import {
  createElement
} from 'preact';

// CSS para alinhar o botão de remover
const customCSS = `
  .bio-properties-panel-group-entry {
    display: flex;
    align-items: center;
  }
  .bio-properties-panel-group-entry .bio-properties-panel-field-wrapper {
    flex-grow: 1;
  }
  .bio-properties-panel-remove-btn {
    cursor: pointer;
    background: none;
    border: none;
    color: #cc0000;
    font-weight: bold;
    margin-left: 5px;
  }
  .bio-properties-panel-add-btn {
    cursor: pointer;
    background: #f7f7f7;
    border: 1px solid #ccc;
    border-radius: 2px;
    padding: 4px 8px;
    margin-top: 5px;
    font-weight: 500;
  }
  .viewer-upload-disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
  .viewer-message {
    color: #666;
    font-size: 12px;
    font-style: italic;
    margin-top: 5px;
  }
  
  /* Melhorar aparência das fontes dos metadados e LGPD */
  .bio-properties-panel-label {
    font-weight: 600 !important;
    font-size: 14px !important;
    color: #333 !important;
    margin-bottom: 6px !important;
  }
  
  .bio-properties-panel-input,
  .bio-properties-panel-textfield,
  .bio-properties-panel-select {
    font-size: 14px !important;
    font-weight: 500 !important;
    color: #444 !important;
    border: 1px solid #ddd !important;
    padding: 8px 12px !important;
    border-radius: 4px !important;
  }
  
  .bio-properties-panel-input:focus,
  .bio-properties-panel-textfield:focus,
  .bio-properties-panel-select:focus {
    border-color: #0066cc !important;
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2) !important;
    outline: none !important;
  }
  
  .bio-properties-panel-input:disabled,
  .bio-properties-panel-textfield:disabled,
  .bio-properties-panel-select:disabled {
    background-color: #f5f5f5 !important;
    color: #666 !important;
    font-weight: 500 !important;
  }
  
  .bio-properties-panel-description {
    font-size: 12px !important;
    color: #666 !important;
    font-weight: 400 !important;
    margin-top: 4px !important;
  }
  
  .bio-properties-panel-file-name {
    font-size: 13px !important;
    font-weight: 500 !important;
    color: #444 !important;
    margin-top: 8px !important;
  }
  
  .bio-properties-panel-file-name a {
    color: #0066cc !important;
    font-weight: 600 !important;
    text-decoration: none !important;
  }
  
  .bio-properties-panel-file-name a:hover {
    text-decoration: underline !important;
  }
  
  /* Melhorar texto dos dados gerados */
  .bio-properties-panel-entry .bio-properties-panel-field-wrapper input {
    font-size: 14px !important;
    font-weight: 500 !important;
    line-height: 1.4 !important;
  }
`;
// Adiciona o CSS ao cabeçalho do documento uma única vez
if (!document.getElementById('custom-properties-style')) {
  const style = document.createElement('style');
  style.id = 'custom-properties-style';
  style.innerHTML = customCSS;
  document.head.appendChild(style);
}

// Função para verificar se está no modo viewer
const isViewerMode = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode') || 'view';
  return mode === 'view';
};

export default function(element) {

  const entries = [{
    id: 'generatedData', // ID atualizado
    element,
    component: GeneratedData, // Componente atualizado
    isEdited: isTextFieldEntryEdited
  }, {
    id: 'charm',
    element,
    component: Charm,
    isEdited: isTextFieldEntryEdited
  }, {
    id: 'file-attachment',
    element,
    component: FileAttachment,
  }];

  return entries;
}

/**
 * Componente para gerenciar uma lista de "Dados Gerados" usando serialização JSON.
 */
function GeneratedData(props) {
  const {
    element,
    id
  } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');
  const viewerMode = isViewerMode();

  // Usaremos uma propriedade com nome diferente para armazenar a string JSON.
  const JSON_PROPERTY = 'generatedDataJson';

  /**
   * Lê a string JSON do businessObject, faz o parse e garante que sempre
   * retorne um array, tratando os dados salvos no XML.
   */
  const getValues = () => {
    const jsonString = element.businessObject.get(JSON_PROPERTY);
    if (jsonString) {
      try {
        // Tenta fazer o parse da string JSON
        const data = JSON.parse(jsonString);
        // Garante que o resultado seja um array e que não esteja vazio
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      } catch (e) {
        console.error('Erro ao fazer parse dos dados gerados:', e);
        // Se houver erro no parse, retorna o padrão para evitar quebrar a UI
        return [''];
      }
    }
    // Retorno padrão: um array com uma string vazia para renderizar o primeiro campo.
    return [''];
  };

  /**
   * Converte o array de valores para uma string JSON e salva no businessObject.
   */
  const saveValues = (values) => {
    if (viewerMode) return; // Não salva no modo viewer
    modeling.updateProperties(element, {
      [JSON_PROPERTY]: JSON.stringify(values)
    });
  };

  // Atualiza um valor específico no array
  const setValue = (value, index) => {
    if (viewerMode) return; // Não permite edição no modo viewer
    // É importante pegar os valores atuais para não perder dados de outros campos
    const currentValues = [...getValues()];
    currentValues[index] = value;
    saveValues(currentValues);
  };

  // Adiciona uma nova entrada vazia ao array
  const addEntry = () => {
    if (viewerMode) return; // Não permite adicionar no modo viewer
    const oldValues = getValues();
    const newValues = [...oldValues, ''];
    saveValues(newValues);
  };

  // Remove uma entrada do array pelo seu índice
  const removeEntry = (index) => {
    if (viewerMode) return; // Não permite remover no modo viewer
    const oldValues = [...getValues()];
    let newValues = oldValues.filter((_, i) => i !== index);

    // Se o array ficar totalmente vazio, adiciona um item vazio de volta
    // para garantir que sempre haja um campo de input visível.
    if (newValues.length === 0) {
      newValues = [''];
    }
    saveValues(newValues);
  };

  const items = getValues();
  
  // No modo viewer, só mostra se há dados salvos
  if (viewerMode && items.length === 1 && items[0] === '') {
    return null;
  }

  return html `
    <div class="bio-properties-panel-entry">
      <label class="bio-properties-panel-label">${translate('Dados gerados')}</label>
      <div class="bio-properties-panel-field-wrapper">
        ${items.map((item, index) => {
          const entryId = `${id}-${index}`;
          return html`
            <div class="bio-properties-panel-group-entry" key=${entryId}>
              <${TextFieldEntry}
                id=${entryId}
                element=${element}
                label=${''}
                getValue=${() => item}
                setValue=${viewerMode ? () => {} : (value) => setValue(value, index)}
                debounce=${debounce}
                disabled=${viewerMode}
              />
              ${
                // Só mostra o botão de remover se houver mais de um item e não estiver no modo viewer
                items.length > 1 && !viewerMode && html`
                  <button type="button" class="bio-properties-panel-remove-btn" onClick=${() => removeEntry(index)}>X</button>
                `
              }
            </div>
          `;
        })}
        ${!viewerMode && html`
          <button type="button" class="bio-properties-panel-add-btn" onClick=${addEntry}>
            + Adicionar Dado
          </button>
        `}
      </div>
    </div>
  `;
}

function Charm(props) {
  const {
    element,
    id
  } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const viewerMode = isViewerMode();

  const getValue = () => {
    return element.businessObject.charm || 'public';
  };

  const setValue = value => {
    if (viewerMode) return; // Não permite edição no modo viewer
    return modeling.updateProperties(element, {
      charm: value
    });
  };

  const getLGPDOptions = () => {
    return [{
      value: 'public',
      label: 'Público'
    }, {
      value: 'confidential',
      label: 'Confidencial'
    }, {
      value: 'anonymized',
      label: 'Anonimizado'
    }];
  };

  return html `<${SelectEntry}
    id=${id}
    element=${element}
    description=${translate('Classificação de acordo com a Lei Geral de Proteção de Dados (LGPD)')}
    label=${translate('LGPD')}
    getValue=${getValue}
    setValue=${viewerMode ? () => {} : setValue}
    getOptions=${getLGPDOptions}
    disabled=${viewerMode}
  />`;
}

// Componente de Anexo de Arquivo modificado para usar API
function FileAttachment(props) {
  const {
    element,
    id
  } = props;
  const modeling = useService('modeling');
  const translate = useService('translate');
  const viewerMode = isViewerMode();

  // Propriedade para armazenar array de arquivos como JSON
  const FILES_PROPERTY = 'attachedFilesJson';

  /**
   * Lê os arquivos salvos do businessObject
   */
  const getFiles = () => {
    const filesJson = element.businessObject.get(FILES_PROPERTY);
    if (filesJson) {
      try {
        const files = JSON.parse(filesJson);
        return Array.isArray(files) ? files : [];
      } catch (e) {
        console.error('Erro ao fazer parse dos arquivos:', e);
        return [];
      }
    }
    return [];
  };

  /**
   * Salva a lista de arquivos no businessObject
   */
  const saveFiles = (files) => {
    if (viewerMode) return;
    modeling.updateProperties(element, {
      [FILES_PROPERTY]: JSON.stringify(files)
    });
  };

  const handleFileChange = async (event) => {
    if (viewerMode) return;
    
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Mostra feedback de upload
      const currentFiles = getFiles();
      const tempFiles = [...currentFiles, { fileName: 'Enviando...', fileUrl: '', uploading: true }];
      saveFiles(tempFiles);

      const response = await fetch('http://localhost:8000/canvas/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha no upload do arquivo.');
      }

      const result = await response.json();
      const fullFileUrl = `http://localhost:8000${result.fileUrl}`;

      // Remove o arquivo temporário e adiciona o arquivo real
      const updatedFiles = currentFiles.filter(f => !f.uploading);
      updatedFiles.push({
        fileName: result.fileName,
        fileUrl: fullFileUrl,
        uploadDate: new Date().toISOString()
      });

      saveFiles(updatedFiles);

      // Limpa o input para permitir upload do mesmo arquivo novamente
      event.target.value = '';

    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Não foi possível anexar o arquivo.');
      
      // Remove arquivo temporário em caso de erro
      const filesWithoutTemp = getFiles().filter(f => !f.uploading);
      saveFiles(filesWithoutTemp);
    }
  };

  const removeFile = (index) => {
    if (viewerMode) return;
    const currentFiles = getFiles();
    const updatedFiles = currentFiles.filter((_, i) => i !== index);
    saveFiles(updatedFiles);
  };

  const files = getFiles();

  return html `
    <div class="bio-properties-panel-entry">
      <label for=${'cam-input-' + id} class="bio-properties-panel-label">
        ${translate('Anexar Documentos')}
      </label>
      <div class="bio-properties-panel-field-wrapper">
        ${!viewerMode && html`
          <input
            id=${'cam-input-' + id}
            type="file"
            class="bio-properties-panel-input"
            onChange=${handleFileChange}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
          />
        `}
        
        ${files.length > 0 && html`
          <div class="attached-files-list">
            ${files.map((file, index) => html`
              <div key=${index} class="attached-file-item">
                <div class="file-info">
                  ${file.uploading ? html`
                    <span class="file-name uploading">${file.fileName}</span>
                  ` : html`
                    <a href=${file.fileUrl} target="_blank" rel="noopener noreferrer" class="file-link">
                      ${file.fileName}
                    </a>
                  `}
                  ${file.uploadDate && html`
                    <small class="upload-date">
                      ${new Date(file.uploadDate).toLocaleDateString('pt-BR')}
                    </small>
                  `}
                </div>
                ${!viewerMode && !file.uploading && html`
                  <button 
                    type="button" 
                    class="remove-file-btn" 
                    onClick=${() => removeFile(index)}
                    title="Remover arquivo"
                  >
                    ×
                  </button>
                `}
              </div>
            `)}
          </div>
        `}
        
        ${viewerMode && files.length === 0 && html`
          <p class="viewer-message">
            Nenhum arquivo anexado
          </p>
        `}
      </div>
    </div>
  `;
}