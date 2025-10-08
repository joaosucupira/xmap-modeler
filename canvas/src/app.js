import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';

import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import '@bpmn-io/properties-panel/assets/properties-panel.css';

import './style.less';

import $ from 'jquery';
import BpmnModeler from 'bpmn-js/lib/Modeler';

import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule
} from 'bpmn-js-properties-panel';
import magicPropertiesProviderModule from './provider/magic';
import magicModdleDescriptor from './descriptors/magic';

import {
  debounce
} from 'min-dash';

import diagramXML from '../resources/newDiagram.bpmn';


var container = $('#js-drop-zone');

var bpmnModeler = new BpmnModeler({
  container: '#js-canvas',
  propertiesPanel: {
    parent: '#js-properties-panel'
  },
  additionalModules: [
    BpmnPropertiesPanelModule,
    BpmnPropertiesProviderModule,
    magicPropertiesProviderModule
  ],
  moddleExtensions: {
    magic: magicModdleDescriptor
  }
});

function createNewDiagram() {
  openDiagram(diagramXML);
}
function getUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    processo: urlParams.get('processo'),
    mode: urlParams.get('mode') || 'view'
  };
}
function addSaveButton(processoId) {
  const saveButton = document.createElement('button');
  saveButton.textContent = 'Salvar Processo';
  saveButton.className = 'save-button';
  document.querySelector('.buttons').appendChild(saveButton);

  saveButton.addEventListener('click', async () => {
    try {
      const { xml } = await bpmnModeler.saveXML({ format: true });

      const response = await fetch(`http://localhost:8000/canvas/save/${processoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: xml
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao salvar o processo: ${errorData.detail || response.status}`);
      }

      const result = await response.json();
      alert(result.message || 'Processo salvo com sucesso!');

    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert(`Erro ao salvar o processo: ${err.message}`);
    }
  });
}
function addCadastrarButton() {
  const cadastrarButton = document.createElement('button');
  cadastrarButton.textContent = 'Cadastrar BPMN';
  cadastrarButton.className = 'cadastrar-button';
  document.querySelector('.buttons').appendChild(cadastrarButton);

  cadastrarButton.addEventListener('click', async () => {
    const titulo = prompt('Digite o título do processo:');
    if (!titulo) {
      alert('Título é obrigatório!');
      return;
    }

    try {
      const { xml } = await bpmnModeler.saveXML({ format: true });

      const response = await fetch('http://localhost:8000/canvas/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          titulo: titulo,
          xml_content: xml
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao cadastrar: ${errorData.detail || response.status}`);
      }

      const result = await response.json();
      alert(`${result.message} ID: ${result.processo_id}`);
      // Opcional: Redirecionar ou atualizar a URL com o novo ID para modo edit
      window.location.search = `?processo=${result.processo_id}&mode=edit`;

    } catch (err) {
      console.error('Erro ao cadastrar:', err);
      alert(`Erro ao cadastrar o BPMN: ${err.message}`);
    }
  });
}
async function loadProcesso(processoId, mode = 'view') {
  try {
    const response = await fetch(`http://localhost:8000/canvas/${mode}/${processoId}`);
    if (!response.ok) throw new Error('Processo não encontrado');
    
    const xml = await response.text();
    await openDiagram(xml);
    
    // Sempre adicionar o botão de salvar, independentemente do modo
    addSaveButton(processoId);
  } catch (err) {
    console.error('Erro ao carregar processo:', err);
  }
}

// No $(function() { ... })

async function openDiagram(xml) {

  try {

    await bpmnModeler.importXML(xml);

    container
      .removeClass('with-error')
      .addClass('with-diagram');
  } catch (err) {

    container
      .removeClass('with-diagram')
      .addClass('with-error');

    container.find('.error pre').text(err.message);

    console.error(err);
  }
}

function registerFileDrop(container, callback) {

  function handleFileSelect(e) {
    e.stopPropagation();
    e.preventDefault();

    var files = e.dataTransfer.files;

    var file = files[0];

    var reader = new FileReader();

    reader.onload = function(e) {

      var xml = e.target.result;

      callback(xml);
    };

    reader.readAsText(file);
  }

  function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();

    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  container.get(0).addEventListener('dragover', handleDragOver, false);
  container.get(0).addEventListener('drop', handleFileSelect, false);
}

async function downloadSVG() {
  try {
    // 1. Salva o diagrama como SVG
    const { svg } = await bpmnModeler.saveSVG();

    // 2. Cria um objeto Blob com o conteúdo SVG
    const blob = new Blob([svg], { type: 'image/svg+xml' });

    // 3. Cria um link temporário para o download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'diagrama.svg'; // Nome do arquivo a ser baixado

    // 4. Adiciona o link ao corpo, clica nele e depois remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 5. Libera o objeto URL da memória
    URL.revokeObjectURL(link.href);

  } catch (err) {
    console.error('Erro ao fazer download do SVG:', err);
    alert('Não foi possível fazer o download do SVG.');
  }
}
// file drag / drop ///////////////////////

// check file api availability
if (!window.FileList || !window.FileReader) {
  window.alert(
    'Looks like you use an older browser that does not support drag and drop. ' +
    'Try using Chrome, Firefox or the Internet Explorer > 10.');
} else {
  registerFileDrop(container, openDiagram);
}
async function downloadBPMN() {
  try {
    // 1. Salva o diagrama como XML (BPMN)
    const { xml } = await bpmnModeler.saveXML({ format: true });

    // 2. Cria um objeto Blob com o conteúdo XML
    const blob = new Blob([xml], { type: 'application/bpmn+xml' });

    // 3. Cria um link temporário para o download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'diagrama.bpmn'; // Nome do arquivo a ser baixado

    // 4. Adiciona o link, clica e remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 5. Libera o objeto URL da memória
    URL.revokeObjectURL(link.href);

  } catch (err) {
    console.error('Erro ao fazer download do BPMN:', err);
    alert('Não foi possível fazer o download do arquivo BPMN.');
  }
}
// bootstrap diagram functions

$(function() {
  $('#js-download-svg').on('click', downloadSVG);
    $('#js-download-diagram').on('click', downloadBPMN); // Adiciona o listener para o novo botão

  const { processo, mode } = getUrlParams();
if (processo) {
  loadProcesso(processo, mode);
} else {
  // Comportamento padrão (criar novo)
  addCadastrarButton(); // Adiciona o botão de cadastrar quando não há processo_id


  $('#js-create-diagram').click(function(e) {
    e.stopPropagation();
    e.preventDefault();
    createNewDiagram();
  });

  var downloadLink = $('#js-download-diagram');
  var downloadSvgLink = $('#js-download-svg');
  var returnToStartLink = $('#return-to-start');

  // Adiciona o handler para redirecionar ao clicar no botão
  returnToStartLink.click(function(e) {
    e.preventDefault();
    window.location.href = 'http://localhost:4500/';
  });

  $('.buttons a').click(function(e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function setEncoded(link, name, data) {
    var encodedData = encodeURIComponent(data);

    if (data) {
      link.addClass('active').attr({
        'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
        'download': name
      });
    } else {
      link.removeClass('active');
    }
  }

  var exportArtifacts = debounce(async function() {

    try {

      const { svg } = await bpmnModeler.saveSVG();

      setEncoded(downloadSvgLink, 'diagram.svg', svg);
    } catch (err) {

      console.error('Error happened saving SVG: ', err);

      setEncoded(downloadSvgLink, 'diagram.svg', null);
    }

    try {

      const { xml } = await bpmnModeler.saveXML({ format: true });

      setEncoded(downloadLink, 'diagram.bpmn', xml);
    } catch (err) {

      console.error('Error happened saving diagram: ', err);

      setEncoded(downloadLink, 'diagram.bpmn', null);
    }
  }, 500);

  bpmnModeler.on('commandStack.changed', exportArtifacts);}
});