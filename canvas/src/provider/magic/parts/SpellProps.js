import { html } from 'htm/preact';

import { TextFieldEntry, SelectEntry, isTextFieldEntryEdited } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';

export default function(element) {

  const entries = [
    {
      id: 'incantation',
      element,
      component: Incantation,
      isEdited: isTextFieldEntryEdited
    },
    {
      id: 'charm',
      element,
      component: Charm,
      isEdited: isTextFieldEntryEdited
    },
    // Entrada para upload de arquivo
    {
      id: 'file-attachment',
      element,
      component: FileAttachment,
    }
  ];

  return entries;
}


function Incantation(props) {
  // ...código existente da função Incantation...
  const { element, id } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = () => {
    return element.businessObject.incantation || '';
  };

  const setValue = value => {
    return modeling.updateProperties(element, {
      incantation: value
    });
  };

  return html`<${TextFieldEntry}
    id=${ id }
    element=${ element }
    description=${ translate('Informações e documentos obtidos a partir dessa atividade') }
    label=${ translate('Dados gerados') }
    getValue=${ getValue }
    setValue=${ setValue }
    debounce=${ debounce }
  />`;
}

function Charm(props) {
  // ...código existente da função Charm...
  const { element, id } = props;

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
    return [
      { value: 'public', label: 'Público' },
      { value: 'confidential', label: 'Confidencial' },
      { value: 'anonymized', label: 'Anonimizado' }
    ];
  };

  return html`<${SelectEntry}
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
  const { element, id } = props;
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
      modeling.updateProperties(element, { fileName: 'Enviando...' });

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
      modeling.updateProperties(element, { fileName: undefined, fileUrl: undefined });
    }
  };

  const fileName = element.businessObject.get('fileName');
  const fileUrl = element.businessObject.get('fileUrl');

  return html`
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