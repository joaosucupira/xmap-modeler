import { useService } from 'bpmn-js-properties-panel';

export default function FileUploadProps(props) {
  const { element } = props;
  const modeling = useService('modeling');
  const translate = useService('translate');

  const handleFileUpload = (event) => {
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
            />
            {element.businessObject.fileName && (
              <div>Current file: {element.businessObject.fileName}</div>
            )}
          </div>
        );
      }
    }
  ];
}