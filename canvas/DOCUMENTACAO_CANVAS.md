# 📖 Documentação do Canvas BPMN - xMap Modeler

Este documento descreve a arquitetura, funcionamento e como modificar o Canvas de modelagem BPMN baseado em **bpmn.io**.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Como Funciona o bpmn.io](#como-funciona-o-bpmnio)
- [Sistema de Metadados (Spell)](#sistema-de-metadados-spell)
- [Painel de Propriedades Customizado](#painel-de-propriedades-customizado)
- [Comunicação com a API](#comunicação-com-a-api)
- [Modos de Operação](#modos-de-operação)
- [Guia de Modificações](#guia-de-modificações)
- [Referências](#referências)

---

## 🎯 Visão Geral

O Canvas é uma aplicação web que permite criar e editar diagramas BPMN (Business Process Model and Notation). É construído sobre a biblioteca **bpmn.io** e estende suas funcionalidades com:

- ✅ **Painel de Metadados** customizado (Spell Props)
- ✅ **Classificação LGPD** para elementos
- ✅ **Upload de arquivos** anexados a atividades
- ✅ **Modo visualização** (somente leitura)
- ✅ **Modo edição** com salvamento na API
- ✅ **Exportação** para BPMN e SVG

### Fluxo de Funcionamento

```
URL: http://localhost:8080?mapa=123&mode=edit
                    │
                    ▼
            ┌───────────────┐
            │   app.js      │ ──► Carrega mapa da API
            │  (principal)  │
            └───────┬───────┘
                    │
       ┌────────────┼────────────┐
       ▼            ▼            ▼
  ┌─────────┐  ┌─────────┐  ┌─────────────┐
  │ bpmn.io │  │ Panel   │  │ Magic Props │
  │ Modeler │  │ BPMN    │  │ (Metadados) │
  └─────────┘  └─────────┘  └─────────────┘
       │            │              │
       └────────────┴──────────────┘
                    │
                    ▼
            ┌───────────────┐
            │   Salvamento  │ ──► PUT /canvas/save/{id}
            │   XML + Meta  │ ──► POST /metadados/
            └───────────────┘
```

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **bpmn-js** | 18.x | Modelador BPMN principal |
| **bpmn-js-properties-panel** | 5.x | Painel de propriedades |
| **@bpmn-io/properties-panel** | 3.x | Componentes do painel |
| **htm** | 3.x | Tagged templates para Preact |
| **jQuery** | 3.x | Manipulação DOM |
| **Webpack** | 5.x | Bundler |
| **Less** | 4.x | Pré-processador CSS |

---

## 📁 Estrutura de Pastas

```
canvas/
├── src/
│   ├── app.js                    # Aplicação principal
│   ├── index.html                # HTML base
│   ├── style.less                # Estilos customizados
│   │
│   ├── descriptors/              # Definições de extensões BPMN
│   │   ├── magic.json            # Schema dos metadados
│   │   └── data.json             # Dados auxiliares
│   │
│   └── provider/                 # Provedores de propriedades
│       └── magic/
│           ├── index.js          # Exportação do módulo
│           ├── MagicPropertiesProvider.js  # Registra o grupo de props
│           └── parts/
│               ├── SpellProps.js     # Componentes de metadados
│               └── FileUploadProps.js # Upload de arquivos
│
├── resources/
│   └── newDiagram.bpmn           # Template de diagrama vazio
│
├── package.json
├── webpack.config.js
└── Dockerfile
```

---

## 🔮 Como Funciona o bpmn.io

### Conceitos Básicos

O **bpmn.io** é composto por vários módulos:

```javascript
import BpmnModeler from 'bpmn-js/lib/Modeler';

// Criar instância do modelador
const bpmnModeler = new BpmnModeler({
  container: '#js-canvas',
  propertiesPanel: {
    parent: '#js-properties-panel'
  },
  additionalModules: [
    BpmnPropertiesPanelModule,      // Painel de propriedades padrão
    BpmnPropertiesProviderModule,   // Provedor de propriedades BPMN
    magicPropertiesProviderModule   // ⭐ Nosso provedor customizado
  ],
  moddleExtensions: {
    magic: magicModdleDescriptor    // ⭐ Nosso schema de extensão
  }
});
```

### Principais APIs

```javascript
// Importar diagrama XML
await bpmnModeler.importXML(xml);

// Exportar diagrama
const { xml } = await bpmnModeler.saveXML({ format: true });
const { svg } = await bpmnModeler.saveSVG();

// Obter serviços internos
const canvas = bpmnModeler.get('canvas');
const modeling = bpmnModeler.get('modeling');
const elementRegistry = bpmnModeler.get('elementRegistry');
const commandStack = bpmnModeler.get('commandStack');
const eventBus = bpmnModeler.get('eventBus');

// Zoom
canvas.zoom('fit-viewport');
canvas.zoom(1.5);

// Undo/Redo
commandStack.undo();
commandStack.redo();

// Obter todos elementos
const allElements = elementRegistry.getAll();

// Atualizar propriedades de um elemento
modeling.updateProperties(element, {
  name: 'Novo Nome',
  charm: 'confidential'
});
```

---

## 📊 Sistema de Metadados (Spell)

O sistema de metadados permite adicionar informações extras aos elementos BPMN, especificamente às **BusinessRuleTask** (tarefas de regra de negócio).

### Schema de Extensão (magic.json)

O arquivo `descriptors/magic.json` define as propriedades customizadas:

```json
{
  "name": "Magic",
  "prefix": "magic",
  "uri": "http://magic",
  "xml": {
    "tagAlias": "lowerCase"
  },
  "types": [
    {
      "name": "BewitchedStartEvent",
      "extends": ["bpmn:BusinessRuleTask"],  // ← Estende BusinessRuleTask
      "properties": [
        {
          "name": "incantation",         // Não usado atualmente
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "charm",               // ⭐ Classificação LGPD
          "isAttr": true,
          "type": "String"
        },
        {
          "name": "generatedDataJson",   // ⭐ Dados gerados (JSON array)
          "isAttr": true,
          "type": "String"
        }
      ]
    }
  ]
}
```

### Como os Metadados são Salvos no XML

Quando você salva um diagrama com metadados, o XML fica assim:

```xml
<bpmn:businessRuleTask 
  id="Activity_1" 
  name="Processar Dados"
  magic:charm="confidential"
  magic:generatedDataJson='["CPF","Nome","Email"]'>
  ...
</bpmn:businessRuleTask>
```

---

## 🎨 Painel de Propriedades Customizado

### Estrutura do Provedor

O painel customizado é registrado em `MagicPropertiesProvider.js`:

```javascript
export default function MagicPropertiesProvider(propertiesPanel, translate) {

  this.getGroups = function(element) {
    return function(groups) {
      
      // ⭐ Só adiciona metadados em BusinessRuleTask
      if (is(element, 'bpmn:BusinessRuleTask')) {
        groups.push(createMagicGroup(element, translate));
      }

      return groups;
    };
  };

  // Registrar com baixa prioridade (carrega depois do padrão)
  propertiesPanel.registerProvider(500, this);
}

function createMagicGroup(element, translate) {
  return {
    id: 'magic',
    label: translate('Metadados'),  // ← Nome do grupo no painel
    entries: spellProps(element)     // ← Componentes do grupo
  };
}
```

### Componentes de Propriedades (SpellProps.js)

O arquivo `SpellProps.js` contém três componentes principais:

#### 1. **GeneratedData** - Lista de Dados Gerados

```javascript
function GeneratedData(props) {
  const modeling = useService('modeling');
  const JSON_PROPERTY = 'generatedDataJson';

  // Lê array de strings do businessObject
  const getValues = () => {
    const jsonString = element.businessObject.get(JSON_PROPERTY);
    if (jsonString) {
      return JSON.parse(jsonString);  // ["CPF", "Nome", "Email"]
    }
    return [''];
  };

  // Salva array como JSON string
  const saveValues = (values) => {
    modeling.updateProperties(element, {
      [JSON_PROPERTY]: JSON.stringify(values)
    });
  };

  // Adiciona novo campo vazio
  const addEntry = () => {
    saveValues([...getValues(), '']);
  };

  // Remove campo por índice
  const removeEntry = (index) => {
    const newValues = getValues().filter((_, i) => i !== index);
    saveValues(newValues.length ? newValues : ['']);
  };

  // Renderiza lista de inputs
  return html`
    <div>
      <label>Dados gerados</label>
      ${items.map((item, index) => html`
        <div>
          <${TextFieldEntry}
            getValue=${() => item}
            setValue=${(value) => setValue(value, index)}
          />
          <button onClick=${() => removeEntry(index)}>X</button>
        </div>
      `)}
      <button onClick=${addEntry}>+ Adicionar Dado</button>
    </div>
  `;
}
```

#### 2. **Charm** - Classificação LGPD

```javascript
function Charm(props) {
  const modeling = useService('modeling');

  const getValue = () => {
    return element.businessObject.charm || 'public';
  };

  const setValue = (value) => {
    modeling.updateProperties(element, {
      charm: value
    });
  };

  const getLGPDOptions = () => [
    { value: 'public', label: 'Público' },
    { value: 'confidential', label: 'Confidencial' },
    { value: 'anonymized', label: 'Anonimizado' }
  ];

  return html`
    <${SelectEntry}
      label="LGPD"
      description="Classificação de acordo com a LGPD"
      getValue=${getValue}
      setValue=${setValue}
      getOptions=${getLGPDOptions}
    />
  `;
}
```

#### 3. **FileAttachment** - Anexar Documentos

```javascript
function FileAttachment(props) {
  const FILES_PROPERTY = 'attachedFilesJson';

  const getFiles = () => {
    const filesJson = element.businessObject.get(FILES_PROPERTY);
    return filesJson ? JSON.parse(filesJson) : [];
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    // Upload para API
    const response = await fetch('http://localhost:8000/canvas/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    // Salvar referência do arquivo
    const updatedFiles = [...getFiles(), {
      fileName: result.fileName,
      fileUrl: `http://localhost:8000${result.fileUrl}`,
      uploadDate: new Date().toISOString()
    }];

    modeling.updateProperties(element, {
      [FILES_PROPERTY]: JSON.stringify(updatedFiles)
    });
  };

  return html`
    <div>
      <label>Anexar Documentos</label>
      <input type="file" onChange=${handleFileChange} />
      ${files.map((file, i) => html`
        <a href=${file.fileUrl} target="_blank">${file.fileName}</a>
        <button onClick=${() => removeFile(i)}>×</button>
      `)}
    </div>
  `;
}
```

---

## 🌐 Comunicação com a API

### Endpoints Utilizados

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/canvas/view/{id}` | Carrega XML no modo visualização |
| `GET` | `/canvas/edit/{id}` | Carrega XML no modo edição |
| `PUT` | `/canvas/save/{id}?xml_content=...` | Salva XML do diagrama |
| `GET` | `/mapas/{id}` | Busca informações do mapa |
| `POST` | `/metadados/` | Salva metadados de uma atividade |
| `POST` | `/canvas/upload` | Upload de arquivo |

### Fluxo de Salvamento

```javascript
async function saveMapWithMetadata() {
  // 1. Coletar metadados do diagrama
  const elementRegistry = bpmnModeler.get('elementRegistry');
  const allElements = elementRegistry.getAll();
  const metadataPayloads = [];

  allElements.forEach(element => {
    const bizObj = element.businessObject;

    if (bizObj.generatedDataJson || bizObj.charm) {
      let dados = [];
      if (bizObj.generatedDataJson) {
        dados = JSON.parse(bizObj.generatedDataJson);
      }
      
      metadataPayloads.push({
        id_processo: parseInt(currentMapId, 10),  // ID do mapa
        id_atividade: element.id,                  // ID do elemento BPMN
        nome: bizObj.name || element.id,           // Nome da atividade
        lgpd: bizObj.charm || 'public',            // Classificação LGPD
        dados: dados                               // Array de dados
      });
    }
  });

  // 2. Enviar metadados para API
  for (const payload of metadataPayloads) {
    await fetch('http://localhost:8000/metadados/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  // 3. Salvar XML do diagrama
  const { xml } = await bpmnModeler.saveXML({ format: true });
  const encodedXml = encodeURIComponent(xml);
  
  await fetch(`http://localhost:8000/canvas/save/${currentMapId}?xml_content=${encodedXml}`, {
    method: 'PUT'
  });
}
```

---

## 🔄 Modos de Operação

### Modo Visualização (`?mode=view`)

- Diagrama é somente leitura
- Não é possível mover/criar/deletar elementos
- Painel de propriedades mostra metadados sem edição
- Paleta de ferramentas é ocultada
- Botão salvar é ocultado

```javascript
function disableEditing() {
  document.body.classList.add('viewer-mode');
  
  const eventBus = bpmnModeler.get('eventBus');
  
  // Bloquear todas as ações
  eventBus.on('create.start', 10000, (e) => e.preventDefault());
  eventBus.on('shape.move.start', 10000, (e) => e.preventDefault());
  eventBus.on('resize.start', 10000, (e) => e.preventDefault());
  eventBus.on('connect.start', 10000, (e) => e.preventDefault());
  eventBus.on('commandStack.preExecute', 10000, (e) => e.preventDefault());
}
```

### Modo Edição (`?mode=edit`)

- Edição completa do diagrama
- Painel de propriedades editável
- Paleta de ferramentas visível
- Botão salvar habilitado
- Atalhos de teclado (Ctrl+S, Ctrl+Z, Ctrl+Y)

---

## 🔧 Guia de Modificações

### 1. Adicionar Nova Propriedade aos Metadados

#### Passo 1: Atualizar o Schema (magic.json)

```json
{
  "properties": [
    // ... propriedades existentes
    {
      "name": "minhaNovaProp",
      "isAttr": true,
      "type": "String"
    }
  ]
}
```

#### Passo 2: Criar Componente em SpellProps.js

```javascript
function MinhaNovaProp(props) {
  const { element } = props;
  const modeling = useService('modeling');
  const translate = useService('translate');

  const getValue = () => {
    return element.businessObject.minhaNovaProp || '';
  };

  const setValue = (value) => {
    modeling.updateProperties(element, {
      minhaNovaProp: value
    });
  };

  return html`
    <${TextFieldEntry}
      id="minhaNovaProp"
      element=${element}
      label=${translate('Minha Nova Propriedade')}
      getValue=${getValue}
      setValue=${setValue}
    />
  `;
}
```

#### Passo 3: Registrar no Array de Entries

```javascript
export default function(element) {
  const entries = [
    { id: 'generatedData', element, component: GeneratedData },
    { id: 'charm', element, component: Charm },
    { id: 'file-attachment', element, component: FileAttachment },
    { id: 'minhaNovaProp', element, component: MinhaNovaProp }  // ⭐ Novo
  ];

  return entries;
}
```

---

### 2. Adicionar Metadados a Outro Tipo de Elemento

Por padrão, metadados só aparecem em `BusinessRuleTask`. Para adicionar a outros tipos:

#### Modificar MagicPropertiesProvider.js

```javascript
this.getGroups = function(element) {
  return function(groups) {
    
    // Adicionar a mais tipos de elementos
    if (is(element, 'bpmn:BusinessRuleTask') || 
        is(element, 'bpmn:UserTask') ||           // ⭐ Novo
        is(element, 'bpmn:ServiceTask')) {        // ⭐ Novo
      groups.push(createMagicGroup(element, translate));
    }

    return groups;
  };
};
```

#### Atualizar magic.json

```json
{
  "types": [
    {
      "name": "BewitchedStartEvent",
      "extends": [
        "bpmn:BusinessRuleTask",
        "bpmn:UserTask",       // ⭐ Novo
        "bpmn:ServiceTask"     // ⭐ Novo
      ],
      "properties": [...]
    }
  ]
}
```

---

### 3. Adicionar Nova Opção LGPD

#### Modificar função Charm em SpellProps.js

```javascript
const getLGPDOptions = () => [
  { value: 'public', label: 'Público' },
  { value: 'confidential', label: 'Confidencial' },
  { value: 'anonymized', label: 'Anonimizado' },
  { value: 'sensitive', label: 'Sensível' },          // ⭐ Novo
  { value: 'personal', label: 'Dado Pessoal' }        // ⭐ Novo
];
```

---

### 4. Modificar Estilos do Painel

Editar o CSS inline em `SpellProps.js`:

```javascript
const customCSS = `
  /* Labels */
  .bio-properties-panel-label {
    font-weight: 600 !important;
    font-size: 14px !important;
    color: #333 !important;
  }
  
  /* Inputs */
  .bio-properties-panel-input {
    font-size: 14px !important;
    border: 1px solid #ddd !important;
    border-radius: 4px !important;
  }
  
  /* Inputs em foco */
  .bio-properties-panel-input:focus {
    border-color: #0066cc !important;
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2) !important;
  }
`;
```

Ou editar `style.less` para estilos globais.

---

### 5. Mudar URL da API

Buscar e substituir em `app.js` e `SpellProps.js`:

```javascript
// De
const response = await fetch('http://localhost:8000/...');

// Para
const API_URL = 'http://minha-api.com';
const response = await fetch(`${API_URL}/...`);
```

**Recomendação**: Criar constante global no topo de `app.js`:

```javascript
const API_BASE_URL = 'http://localhost:8000';
```

---

### 6. Adicionar Novo Atalho de Teclado

```javascript
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+S - Salvar
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveMapWithMetadata();
    }
    
    // ⭐ Ctrl+E - Exportar BPMN
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      downloadBPMN();
    }
    
    // ⭐ Ctrl+D - Duplicar elemento selecionado
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      // Implementar lógica de duplicação
    }
  });
}
```

---

## 🚀 Executando o Projeto

### Desenvolvimento

```bash
cd canvas
npm install
npm run dev   # Inicia em http://localhost:9013 (webpack-dev-server)
```

### Build de Produção

```bash
npm run build   # Gera arquivos em /public
```

### Docker

```bash
docker build -t canvas .
docker run -p 8080:80 canvas
```

---

## 📚 Referências

- [bpmn.io Documentation](https://bpmn.io/toolkit/bpmn-js/)
- [bpmn-js Examples](https://github.com/bpmn-io/bpmn-js-examples)
- [Properties Panel Extension Example](https://github.com/bpmn-io/bpmn-js-examples/tree/main/properties-panel-extension)
- [bpmn-js-properties-panel API](https://github.com/bpmn-io/bpmn-js-properties-panel)
- [BPMN 2.0 Specification](https://www.omg.org/spec/BPMN/2.0/)

---

## 🔍 Troubleshooting

### Metadados não aparecem no painel

1. Verifique se o elemento é uma `BusinessRuleTask`
2. Confirme que `magic.json` está corretamente configurado
3. Verifique se o módulo está registrado no `BpmnModeler`

### Erro ao salvar metadados

1. Verifique se a API está rodando
2. Confirme o formato do payload em `/metadados/`
3. Verifique CORS se estiver em domínios diferentes

### Modo view ainda permite edição

1. Confirme que `?mode=view` está na URL
2. Verifique se `disableEditing()` está sendo chamado
3. Limpe o cache do navegador

---

**Versão:** 1.0.0  
**Última atualização:** Dezembro 2024
