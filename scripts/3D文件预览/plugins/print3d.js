function ShowErrorDialog ()
{
    return OV.UI.ShowMessageDialog (
        '3D Print Failed',
        'Failed to send the model. Please try again later.',
        null
    );
}

function SendFileFor3DPrinting (file, callbacks)
{
    let fileObject = new File ([file.content], "model.stl", {
        type: "multipart/form-data",
    });

    let formData  = new FormData();
    formData.append ('cadfile', fileObject);

    let options = {
        method : 'POST',
        mode : 'cors',
        body : formData
    };

    fetch('https://www.pcbway.com/common/3DViewerUpFile', options)
        .then ((response) => {
            return response.json ();
        })
        .then ((data) => {
            if (data.state === 'SUCCESS') {
                callbacks.onSuccess (data);
            } else {
                callbacks.onError ();
            }
        });
}

function SendModelFor3DPrinting (model)
{
    let progressDialog = new OV.UI.ProgressDialog ();
    progressDialog.Init ('Uploading Model');
    progressDialog.Open ();

    let settings = new OV.Engine.ExporterSettings ();
    let exporter = new OV.Engine.Exporter ();
    exporter.Export (model, settings, OV.Engine.FileFormat.Binary, 'stl', {
        onError : () => {
            ShowErrorDialog ();
            OV.UI.HandleEvent ('3d_print', 'export_error');
        },
        onSuccess : (files) => {
            SendFileFor3DPrinting (files[0], {
                onError : () => {
                    ShowErrorDialog ();
                    OV.UI.HandleEvent ('3d_print', 'upload_error');
                },
                onSuccess : (data) => {
                    progressDialog.Close ();
                    OV.UI.HandleEvent ('3d_print', 'model_uploaded');
                    window.open (data.redirect, '_blank');
                }
            });
        }
    });
}

OV.RegisterToolbarPlugin ({
    registerButtons : (pluginInterface) => {
        pluginInterface.createButton ('print3d', '3D print', ['only_full_width', 'only_on_model'], () => {
            let dialog = new OV.UI.ButtonDialog ();
            let contentDiv = dialog.Init ('3D print', [
                {
                    name : 'Cancel',
                    subClass : 'outline',
                    onClick () {
                        dialog.Close ();
                    }
                },
                {
                    name : 'Print',
                    onClick : () => {
                        let model = pluginInterface.getModel ();
                        SendModelFor3DPrinting (model);
                        dialog.Close ();
                    }
                }
            ]);
            OV.Engine.AddDiv (contentDiv, 'ov_dialog_section', 'Your model will be converted to STL and uploaded to <a href="https://www.pcbway.com" target="_blank">PCBWay</a> to finish the 3D printing process.');
            OV.Engine.AddDiv (contentDiv, 'ov_dialog_section', '');
            dialog.Open ();
            OV.UI.HandleEvent ('3d_print', 'dialog_opened');
        })
    }
});
