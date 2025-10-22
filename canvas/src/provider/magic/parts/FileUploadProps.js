import { useService } from 'bpmn-js-properties-panel';

export default function FileUploadProps(props) {
  const { element } = props;
  const modeling = useService('modeling');
  const translate = useService('translate');

  // Verifica se está no modo viewer
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode') || 'view';
  const isViewerMode = mode === 'view';

  const handleFileUpload = (event) => {
    // Não processa upload no modo viewer
    if (isViewerMode) return;
    
    const file = event.target.files[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      
      modeling.updateProperties(element, {
        fileUrl: fileUrl,
        fileName: file.name
      });
    }
  };

  return [
    {
      id: 'fileUpload',
      element,
      component: () => {
        return (
          <div>
            <label>{translate('Upload File')}</label>
            <input 
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              disabled={isViewerMode}
              style={isViewerMode ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            />
            {element.businessObject.fileName && (
              <div>
                {isViewerMode ? 'Arquivo anexado: ' : 'Current file: '}
                {element.businessObject.fileName}
              </div>
            )}
            {isViewerMode && (
              <small style={{ color: '#666', fontSize: '12px' }}>
                Modo somente leitura - upload desabilitado
              </small>
            )}
          </div>
        );
      }
    }
  ];
}