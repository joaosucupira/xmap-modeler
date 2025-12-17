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

import { debounce } from 'min-dash';

import diagramXML from '../resources/newDiagram.bpmn';

// =====================================================
// VARIÁVEIS GLOBAIS
// =====================================================
var container = $('#js-drop-zone');
var currentMapId = null;
var currentMode = 'view';
var currentZoom = 1;
var hasUnsavedChanges = false;
var isModelerReady = false;

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

// =====================================================
// SISTEMA DE TOAST NOTIFICATIONS
// =====================================================
function showToast(type, title, message, duration = 4000) {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;
  
  const icons = {
    success: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    warning: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>'
  };
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
  `;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// =====================================================
// ATUALIZAR STATUS DO MAPA
// =====================================================
function updateMapStatus(status) {
  const statusEl = document.getElementById('map-status');
  if (!statusEl) return;
  
  statusEl.className = 'map-status ' + status;
  
  const statusTexts = {
    'saved': 'Salvo',
    'unsaved': 'Não salvo',
    'saving': 'Salvando...',
    'ready': 'Pronto',
    'viewing': 'Visualizando'
  };
  
  statusEl.innerHTML = `<span class="status-dot"></span>${statusTexts[status] || 'Pronto'}`;
}

// =====================================================
// ATUALIZAR TÍTULO DO MAPA
// =====================================================
async function updateMapTitle(mapId) {
  try {
    const response = await fetch(`http://localhost:8000/mapas/${mapId}`);
    if (response.ok) {
      const data = await response.json();
      const titleEl = document.getElementById('map-title');
      if (titleEl && data.mapa) {
        titleEl.textContent = data.mapa.titulo || 'Diagrama BPMN';
      }
    }
  } catch (err) {
    console.error('Erro ao buscar título do mapa:', err);
  }
}

// =====================================================
// FUNÇÕES DE URL
// =====================================================
function getUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    mapa: urlParams.get('mapa'),
    mode: urlParams.get('mode') || 'view'
  };
}

// =====================================================
// DESABILITAR EDIÇÃO NO MODO VIEW
// =====================================================
function disableEditing() {
  // Adicionar classe ao body para CSS
  document.body.classList.add('viewer-mode');
  document.body.classList.remove('editor-mode');
  
  // Desabilitar interações via JavaScript
  try {
    // Desabilitar o dragging de elementos
    const dragging = bpmnModeler.get('dragging');
    if (dragging) {
      dragging.setOptions({ manual: true });
    }
  } catch (e) {
    console.log('Dragging module não disponível');
  }
  
  // Interceptar eventos para bloquear edição
  const eventBus = bpmnModeler.get('eventBus');
  
  // Bloquear criação de elementos
  eventBus.on('create.start', 10000, function(event) {
    if (currentMode === 'view') {
      event.preventDefault();
      return false;
    }
  });
  
  // Bloquear movimentação
  eventBus.on('shape.move.start', 10000, function(event) {
    if (currentMode === 'view') {
      event.preventDefault();
      return false;
    }
  });
  
  // Bloquear resize
  eventBus.on('resize.start', 10000, function(event) {
    if (currentMode === 'view') {
      event.preventDefault();
      return false;
    }
  });
  
  // Bloquear conexões
  eventBus.on('connect.start', 10000, function(event) {
    if (currentMode === 'view') {
      event.preventDefault();
      return false;
    }
  });
  
  // Bloquear deleção
  eventBus.on('commandStack.shape.delete.preExecute', 10000, function(event) {
    if (currentMode === 'view') {
      event.preventDefault();
      return false;
    }
  });
  
  // Bloquear qualquer comando no modo view
  eventBus.on('commandStack.preExecute', 10000, function(event) {
    if (currentMode === 'view') {
      event.preventDefault();
      return false;
    }
  });
}

function enableEditing() {
  document.body.classList.remove('viewer-mode');
  document.body.classList.add('editor-mode');
}

// =====================================================
// ATUALIZAR UI BASEADO NO MODO
// =====================================================
function updateUIForMode(mode) {
  currentMode = mode;
  
  const modeIndicator = document.getElementById('mode-indicator');
  const modeText = document.getElementById('mode-text');
  const saveBtn = document.getElementById('btn-save');
  const editTools = document.getElementById('edit-tools');
  const panelToggleGroup = document.getElementById('panel-toggle-group');
  const panelDivider = document.getElementById('panel-divider');
  const panel = document.getElementById('js-properties-panel');
  
  if (mode === 'view') {
    // Modo visualização
    modeIndicator?.classList.remove('edit-mode');
    modeIndicator?.classList.add('view-mode');
    if (modeText) modeText.textContent = 'Visualização';
    saveBtn?.classList.add('hidden');
    editTools?.classList.add('hidden');
    
    // Mostrar toggle do painel para ver metadados
    panelToggleGroup?.classList.remove('hidden');
    panelDivider?.classList.remove('hidden');
    
    // Mostrar painel de propriedades (para ver metadados)
    panel?.classList.remove('collapsed');
    panel?.classList.add('view-mode');
    
    // Desabilitar edição
    disableEditing();
    
    // Ocultar palette após o diagrama carregar
    setTimeout(() => {
      const palette = document.querySelector('.djs-palette');
      if (palette) palette.style.display = 'none';
    }, 100);
  } else {
    // Modo edição
    modeIndicator?.classList.add('edit-mode');
    modeIndicator?.classList.remove('view-mode');
    if (modeText) modeText.textContent = 'Edição';
    saveBtn?.classList.remove('hidden');
    editTools?.classList.remove('hidden');
    panelToggleGroup?.classList.remove('hidden');
    panelDivider?.classList.remove('hidden');
    
    panel?.classList.remove('view-mode');
    
    enableEditing();
    
    // Mostrar palette
    setTimeout(() => {
      const palette = document.querySelector('.djs-palette');
      if (palette) palette.style.display = '';
    }, 100);
  }
}

// =====================================================
// SALVAR MAPA COM METADADOS
// =====================================================
async function saveMapWithMetadata() {
  if (!currentMapId) {
    showToast('error', 'Erro', 'Nenhum mapa carregado para salvar.');
    return;
  }
  
  if (currentMode !== 'edit') {
    showToast('warning', 'Modo Visualização', 'Não é possível salvar no modo visualização.');
    return;
  }
  
  const saveBtn = document.getElementById('btn-save');
  const originalContent = saveBtn?.innerHTML;
  
  try {
    // Atualizar UI para estado de salvamento
    updateMapStatus('saving');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = `
        <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        <span>Salvando...</span>
      `;
    }
    
    // ETAPA 1: Coletar metadados do diagrama
    console.log('Iniciando coleta de metadados...');
    const elementRegistry = bpmnModeler.get('elementRegistry');
    const allElements = elementRegistry.getAll();
    const metadataPayloads = [];

    allElements.forEach(element => {
      const bizObj = element.businessObject;

      if (bizObj.generatedDataJson || bizObj.charm) {
        let dados = [];
        
        if (bizObj.generatedDataJson) {
          try {
            dados = JSON.parse(bizObj.generatedDataJson);
          } catch (e) {
            console.error(`Erro ao fazer parse do JSON para o elemento ${element.id}:`, e);
          }
        }
        
        const taskName = bizObj.name || element.id || 'Sem nome';
        
        metadataPayloads.push({
          id_processo: parseInt(currentMapId, 10),
          id_atividade: element.id,
          nome: taskName,
          lgpd: bizObj.charm || 'public',
          dados: dados
        });
      }
    });
    
    console.log(`${metadataPayloads.length} elementos com metadados encontrados.`);

    // ETAPA 2: Enviar metadados para a API
    if (metadataPayloads.length > 0) {
      console.log('Enviando metadados para a API...');
      
      const savePromises = metadataPayloads.map(payload => {
        return fetch('http://localhost:8000/metadados/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify(payload)
        }).then(response => {
          if (!response.ok) {
            throw new Error(`Falha ao salvar metadado para a atividade ${payload.id_atividade}`);
          }
          return response.json();
        });
      });

      await Promise.all(savePromises);
      console.log('Metadados salvos com sucesso!');
    }

    // ETAPA 3: Salvar o XML do diagrama
    console.log('Salvando o XML do mapa...');
    const { xml } = await bpmnModeler.saveXML({ format: true });
    const encodedXml = encodeURIComponent(xml);
    const url = `http://localhost:8000/canvas/save/${currentMapId}?xml_content=${encodedXml}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'accept': 'application/json' }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Erro ao salvar o mapa');
    }

    // Sucesso!
    hasUnsavedChanges = false;
    updateMapStatus('saved');
    showToast('success', 'Salvo!', 'Mapa e metadados salvos com sucesso.');

  } catch (err) {
    console.error('Erro durante o processo de salvar:', err);
    updateMapStatus('unsaved');
    showToast('error', 'Erro ao salvar', err.message);
  } finally {
    // Restaurar botão
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalContent;
    }
  }
}

// =====================================================
// FUNÇÕES DE EXPORTAÇÃO
// =====================================================
async function downloadBPMN() {
  try {
    const { xml } = await bpmnModeler.saveXML({ format: true });
    const blob = new Blob([xml], { type: 'application/bpmn+xml' });
    const link = document.createElement('a');
    const mapTitle = document.getElementById('map-title')?.textContent || 'diagrama';
    
    link.href = URL.createObjectURL(blob);
    link.download = `${mapTitle}.bpmn`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    showToast('success', 'Download iniciado', 'Arquivo BPMN exportado com sucesso.');
  } catch (err) {
    console.error('Erro ao fazer download do BPMN:', err);
    showToast('error', 'Erro no download', 'Não foi possível exportar o arquivo BPMN.');
  }
}

async function downloadSVG() {
  try {
    const { svg } = await bpmnModeler.saveSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    const mapTitle = document.getElementById('map-title')?.textContent || 'diagrama';
    
    link.href = URL.createObjectURL(blob);
    link.download = `${mapTitle}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    showToast('success', 'Download iniciado', 'Imagem SVG exportada com sucesso.');
  } catch (err) {
    console.error('Erro ao fazer download do SVG:', err);
    showToast('error', 'Erro no download', 'Não foi possível exportar a imagem SVG.');
  }
}

// =====================================================
// CONTROLES DE ZOOM
// =====================================================
function setupZoomControls() {
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
    if (!isModelerReady) return;
    const canvas = bpmnModeler.get('canvas');
    currentZoom = Math.min(currentZoom + 0.1, 2);
    canvas.zoom(currentZoom);
    updateZoomDisplay();
  });
  
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
    if (!isModelerReady) return;
    const canvas = bpmnModeler.get('canvas');
    currentZoom = Math.max(currentZoom - 0.1, 0.3);
    canvas.zoom(currentZoom);
    updateZoomDisplay();
  });
  
  document.getElementById('btn-zoom-fit')?.addEventListener('click', () => {
    if (!isModelerReady) return;
    const canvas = bpmnModeler.get('canvas');
    canvas.zoom('fit-viewport');
    currentZoom = canvas.zoom();
    updateZoomDisplay();
  });
}

function updateZoomDisplay() {
  const display = document.getElementById('zoom-level');
  if (display) {
    display.textContent = `${Math.round(currentZoom * 100)}%`;
  }
}

// =====================================================
// CONTROLES DE UNDO/REDO
// =====================================================
function setupUndoRedo() {
  document.getElementById('btn-undo')?.addEventListener('click', () => {
    if (!isModelerReady || currentMode !== 'edit') return;
    try {
      const commandStack = bpmnModeler.get('commandStack');
      commandStack.undo();
    } catch (e) {
      console.error('Erro no undo:', e);
    }
  });
  
  document.getElementById('btn-redo')?.addEventListener('click', () => {
    if (!isModelerReady || currentMode !== 'edit') return;
    try {
      const commandStack = bpmnModeler.get('commandStack');
      commandStack.redo();
    } catch (e) {
      console.error('Erro no redo:', e);
    }
  });
}

// Configurar listener de mudanças após diagrama carregar
function setupCommandStackListener() {
  try {
    const commandStack = bpmnModeler.get('commandStack');
    const eventBus = bpmnModeler.get('eventBus');
    
    // Usar eventBus ao invés de commandStack.on
    eventBus.on('commandStack.changed', () => {
      // Ignorar no modo view
      if (currentMode !== 'edit') return;
      
      const undoBtn = document.getElementById('btn-undo');
      const redoBtn = document.getElementById('btn-redo');
      
      if (undoBtn) undoBtn.disabled = !commandStack.canUndo();
      if (redoBtn) redoBtn.disabled = !commandStack.canRedo();
      
      // Detectar mudanças não salvas
      if (!hasUnsavedChanges) {
        hasUnsavedChanges = true;
        updateMapStatus('unsaved');
      }
    });
  } catch (e) {
    console.error('Erro ao configurar commandStack listener:', e);
  }
}

// =====================================================
// TOGGLE PAINEL DE PROPRIEDADES
// =====================================================
function setupPanelToggle() {
  const panel = document.getElementById('js-properties-panel');
  const btn = document.getElementById('btn-toggle-panel');
  
  btn?.addEventListener('click', () => {
    panel?.classList.toggle('collapsed');
    btn.classList.toggle('active');
  });
}

// =====================================================
// DROPDOWN DE EXPORTAÇÃO
// =====================================================
function setupExportDropdown() {
  const dropdown = document.getElementById('export-dropdown');
  const btn = document.getElementById('btn-export');
  
  btn?.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown?.classList.toggle('open');
  });
  
  // Fechar ao clicar fora
  document.addEventListener('click', () => {
    dropdown?.classList.remove('open');
  });
  
  // Conectar botões de download
  document.getElementById('js-download-diagram')?.addEventListener('click', (e) => {
    e.preventDefault();
    downloadBPMN();
    dropdown?.classList.remove('open');
  });
  
  document.getElementById('js-download-svg')?.addEventListener('click', (e) => {
    e.preventDefault();
    downloadSVG();
    dropdown?.classList.remove('open');
  });
}

// =====================================================
// CARREGAR DIAGRAMA
// =====================================================
function createNewDiagram() {
  openDiagram(diagramXML);
}

async function loadMap(mapaId, mode = 'view') {
  currentMapId = mapaId;
  currentMode = mode;
  
  try {
    const response = await fetch(`http://localhost:8000/canvas/${mode}/${mapaId}`);
    if (!response.ok) throw new Error('Mapa não encontrado');
    
    const xml = await response.text();
    await openDiagram(xml);
    
    // Atualizar título
    updateMapTitle(mapaId);
    
    // Atualizar UI para o modo
    updateUIForMode(mode);
    
    if (mode === 'view') {
      updateMapStatus('viewing');
    } else {
      updateMapStatus('saved');
    }
    
  } catch (err) {
    console.error('Erro ao carregar mapa:', err);
    showToast('error', 'Erro ao carregar', 'Não foi possível carregar o mapa.');
  }
}

async function openDiagram(xml) {
  try {
    await bpmnModeler.importXML(xml);
    
    container
      .removeClass('with-error')
      .addClass('with-diagram');
    
    // Marcar modeler como pronto
    isModelerReady = true;
    
    // Configurar listener após carregar o diagrama
    setupCommandStackListener();
    
    // Ajustar zoom inicial
    setTimeout(() => {
      const canvas = bpmnModeler.get('canvas');
      canvas.zoom('fit-viewport');
      currentZoom = canvas.zoom();
      updateZoomDisplay();
    }, 100);
      
  } catch (err) {
    container
      .removeClass('with-diagram')
      .addClass('with-error');

    container.find('.error pre').text(err.message);
    console.error(err);
    isModelerReady = false;
  }
}

// =====================================================
// DRAG AND DROP
// =====================================================
function registerFileDrop(containerEl, callback) {
  function handleFileSelect(e) {
    e.stopPropagation();
    e.preventDefault();

    // Não permite drop no modo view
    if (currentMode === 'view') {
      showToast('warning', 'Modo Visualização', 'Não é possível importar arquivos no modo visualização.');
      return;
    }

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
    e.dataTransfer.dropEffect = currentMode === 'view' ? 'none' : 'copy';
  }

  containerEl.get(0).addEventListener('dragover', handleDragOver, false);
  containerEl.get(0).addEventListener('drop', handleFileSelect, false);
}

// Check file API availability
if (!window.FileList || !window.FileReader) {
  window.alert('Seu navegador não suporta drag and drop. Use Chrome, Firefox ou Edge.');
} else {
  registerFileDrop(container, openDiagram);
}

// =====================================================
// ATALHOS DE TECLADO
// =====================================================
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+S - Salvar (apenas modo edição)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (currentMode === 'edit' && currentMapId) {
        saveMapWithMetadata();
      }
    }
    
    // Ctrl+Z - Undo (apenas modo edição)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      if (currentMode === 'edit' && isModelerReady) {
        try {
          bpmnModeler.get('commandStack').undo();
        } catch (e) {}
      }
    }
    
    // Ctrl+Y ou Ctrl+Shift+Z - Redo (apenas modo edição)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      if (currentMode === 'edit' && isModelerReady) {
        try {
          bpmnModeler.get('commandStack').redo();
        } catch (e) {}
      }
    }
  });
}

// =====================================================
// AVISO AO SAIR
// =====================================================
function setupBeforeUnload() {
  window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges && currentMode === 'edit') {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

// =====================================================
// INICIALIZAÇÃO
// =====================================================
$(function() {
  // Setup dos controles (não dependem do modeler)
  setupZoomControls();
  setupUndoRedo();
  setupPanelToggle();
  setupExportDropdown();
  setupKeyboardShortcuts();
  setupBeforeUnload();
  
  // Botão voltar
  document.getElementById('btn-back')?.addEventListener('click', () => {
    if (hasUnsavedChanges && currentMode === 'edit') {
      if (confirm('Você tem alterações não salvas. Deseja sair mesmo assim?')) {
        window.location.href = 'http://localhost:4500/';
      }
    } else {
      window.location.href = 'http://localhost:4500/';
    }
  });
  
  // Botão salvar
  document.getElementById('btn-save')?.addEventListener('click', saveMapWithMetadata);
  
  // Verificar parâmetros da URL
  const { mapa, mode } = getUrlParams();
  
  if (mapa) {
    loadMap(mapa, mode);
  } else {
    // Comportamento padrão - criar novo diagrama (modo edição)
    currentMode = 'edit';
    updateUIForMode('edit');
    updateMapStatus('ready');
    
    $('#js-create-diagram').click(function(e) {
      e.stopPropagation();
      e.preventDefault();
      createNewDiagram();
    });
  }
});