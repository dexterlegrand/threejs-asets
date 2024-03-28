import React, { useState, useEffect } from "react";
import { Button, InputGroup } from "@blueprintjs/core";
import { openFile } from "../../3d-models/utils";
import { CustomDlg } from "../../common/CustomDlg";
import { secondServerAPI } from "../../../pages/utils/agent";
import "./ManualDLG.css";

type TFileType = "PDF";

type TFile = {
    id: string;
    selected: boolean;
    file: File;
    mode: TFileType;
};

type EquipmentDatasheetDlgProps = {
    isVisible: boolean;
    onClose: () => void;
};

export function ManualDLG({ isVisible, onClose }: EquipmentDatasheetDlgProps) {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);


    function fetchIndividualFile() {
        const requestOptions = {
            method : 'GET',
        }
        fetch(`${secondServerAPI}/rest/api/v1/datasheets/getUserManual`,requestOptions) 
            .then(response => response.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                setPdfUrl(url); 
            })
            .catch(error => {
                console.error('Error fetching PDF file:', error);
            });
    }

    return (
        <CustomDlg
          title={"IDS(TM) User Manual"}
          isMinimize={true}
          zIndex={1}
          className="User-Manual"
          body={
            <div>
            <div>
                <Button intent="primary" onClick={fetchIndividualFile}>Fetch User Manual</Button>
            </div>
            <div> 
                {pdfUrl && (
                    <iframe
                        src={pdfUrl}
                        width="900px"
                        height="1000px"
                        frameBorder="0"
                        allowFullScreen
                    >
                        This browser does not support PDFs. Please download the PDF to view it: <a href={pdfUrl}>Download PDF</a>.
                    </iframe>
                )}
            </div>
            </div>
          }
          onClose={() => {
            setPdfUrl(null); 
            onClose();
          }}
        />

    );
}