import { html } from 'htm/preact';

import { TextFieldEntry,SelectEntry, isTextFieldEntryEdited } from '@bpmn-io/properties-panel';
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
    }
  ];

  return entries;
}


function Incantation(props) {
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