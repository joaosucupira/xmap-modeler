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
  }
`;

// Adiciona o CSS ao cabeçalho do documento uma única vez
if (!document.getElementById('custom-properties-style')) {
  const style = document.createElement('style');
  style.id = 'custom-properties-style';
  style.innerHTML = customCSS;
  document.head.appendChild(style);
}


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
 * Componente para gerenciar uma lista de "Dados Gerados".
 *//**
 * Componente para gerenciar uma lista de "Dados Gerados".
 */
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
    modeling.updateProperties(element, {
      [JSON_PROPERTY]: JSON.stringify(values)
    });
  };

  // Atualiza um valor específico no array
  const setValue = (value, index) => {
    // É importante pegar os valores atuais para não perder dados de outros campos
    const currentValues = [...getValues()];
    currentValues[index] = value;
    saveValues(currentValues);
  };

  // Adiciona uma nova entrada vazia ao array
  const addEntry = () => {
    const oldValues = getValues();
    const newValues = [...oldValues, ''];
    saveValues(newValues);
  };

  // Remove uma entrada do array pelo seu índice
  const removeEntry = (index) => {
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
                setValue=${(value) => setValue(value, index)}
                debounce=${debounce}
              />
              ${
                // Só mostra o botão de remover se houver mais de um item
                items.length > 1 && html`
                  <button type="button" class="bio-properties-panel-remove-btn" onClick=${() => removeEntry(index)}>X</button>
                `
              }
            </div>
          `;
        })}
        <button type="button" class="bio-properties-panel-add-btn" onClick=${addEntry}>
          + Adicionar Dado
        </button>
      </div>
    </div>
  `;
}

function Charm(props) {
  // ...código existente da função Charm...
  const {
    element,
    id
  } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');

  const getValue = () => {
    return element.businessObject.charm || 'public';
  };

  const setValue = value => {
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
    setValue=${setValue}
    getOptions=${getLGPDOptions}
  />`;
}

// ...existing code...
// Componente de Anexo de Arquivo modificado para usar API
function FileAttachment(props) {
  const {
    element,
    id
  } = props;
  const modeling = useService('modeling');
  const translate = useService('translate');

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file); // 'file' é a chave que a API espera

    try {
      // Mostra um feedback de upload (opcional)
      modeling.updateProperties(element, {
        fileName: 'Enviando...'
      });

      // **URL atualizada para o novo endpoint no router 'canvas'**
      const response = await fetch('http://localhost:8000/canvas/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha no upload do arquivo.');
      }

      const result = await response.json();

      // Constrói a URL completa para o link
      const fullFileUrl = `http://localhost:8000${result.fileUrl}`;

      // Salva o nome e a URL completa do arquivo retornados pela API
      modeling.updateProperties(element, {
        fileName: result.fileName,
        fileUrl: fullFileUrl
      });

    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Não foi possível anexar o arquivo.');
      // Limpa o feedback de erro
      modeling.updateProperties(element, {
        fileName: undefined,
        fileUrl: undefined
      });
    }
  };

  const fileName = element.businessObject.get('fileName');
  const fileUrl = element.businessObject.get('fileUrl');

  return html `
    <div class="bio-properties-panel-entry">
      <label for=${'cam-input-' + id} class="bio-properties-panel-label">
        ${translate('Anexar Documento')}
      </label>
      <div class="bio-properties-panel-field-wrapper">
        <input
          id=${'cam-input-' + id}
          type="file"
          class="bio-properties-panel-input"
          onChange=${handleFileChange}
        />
        ${fileUrl && html`
          <p class="bio-properties-panel-file-name">
            Arquivo atual: <a href=${fileUrl} target="_blank" rel="noopener noreferrer">${fileName}</a>
          </p>
        `}
      </div>
    </div>
  `;
}