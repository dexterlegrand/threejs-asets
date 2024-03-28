import React, { useState, useEffect } from "react";
import { Button, InputGroup } from "@blueprintjs/core";
import { openFile } from "../../3d-models/utils";
import { CustomDlg } from "../../common/CustomDlg";
import { secondServerAPI } from "../../../pages/utils/agent";
import { useSelector } from "react-redux";
import { ApplicationState } from "../../../store";

type TFileType = "PDF";

type TFile = {
    id: string;
    selected: boolean;
    file: File;
    mode: TFileType;
};

type APIFile = {
    id: string;
    name: string;
};

type EquipmentDatasheetDlgProps = {
    isVisible: boolean;
    onClose: () => void;
};

export function EquipmentDatasheetDlg({ isVisible, onClose }: EquipmentDatasheetDlgProps) {
    const auth = useSelector((state: ApplicationState) => state.auth);
    const [file, setFile] = useState<TFile | null>(null); 
    const [fileNames, setFileNames] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [projectName, setProjectName] = useState<string>("");
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    function fetchAllFiles() {
        setLoading(true);
        const requestOptions = {
            method: 'GET',
            headers: { 
                'user-id' : auth.User_id ? String(auth.User_id) : '',
                'project' : projectName
            },
        };
        fetch(`${secondServerAPI}/rest/api/v1/datasheets/getAllFiles`, requestOptions)
            .then(response => response.json()) 
            .then(data => {
                setLoading(false);
                setFileNames(data);
            })
            .catch(error => {
                console.error('Error fetching files:', error);
                setLoading(false);
            });
    }

    function handleProjectNameChange(event: React.ChangeEvent<HTMLInputElement>) {
        setProjectName(event.target.value);
    }

    function fetchIndividualFile(filename: string) {
        setLoading(true);
        const requestOptions = {
            method: 'GET',
            headers: { 
                'user-id' : auth.User_id? String(auth.User_id) : '',
                'project' : projectName,
                'filename': filename, 
            },
        };
        fetch(`${secondServerAPI}/rest/api/v1/datasheets/getFile`, requestOptions) 
            .then(response => response.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                setPdfUrl(url); 
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching PDF file:', error);
                setLoading(false);
            });
    }

    async function uploadPDF() {
        openFile([".pdf"], async (selectedFiles) => {
            if (selectedFiles.length > 0) {
                setLoading(true);
                const formData = new FormData();
                formData.append("file", selectedFiles[0]);
                formData.append("projectName", projectName);
                await fetch(`${secondServerAPI}/rest/api/v1/datasheets/upload`, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'user-id' : auth.User_id ? String(auth.User_id) : '',
                        'project' : projectName
                    }
                });
                fetchAllFiles();
                setLoading(false);
            }
        }, true);
    }

    

    function deleteFile(fileId: string) {
        setLoading(true);
        const requestOptions = {
            method : 'DELETE',
            headers : {
                'user-id' : auth.User_id ? String(auth.User_id) : '',
                'project' : projectName
            }
        }
        fetch(`${secondServerAPI}/rest/api/v1/datasheets/delete`, requestOptions)
            .then(response => response.json());
        setLoading(false);
    }

    if (!isVisible) {
        return null;
    }

    return (
        <CustomDlg
          title={"Equipment Data Sheet"}
          isMinimize={true}
          zIndex={1}
          
          body={
            <div>
                <InputGroup 
                    large 
                    type="text" 
                    placeholder="Project Name" 
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    autoFocus={true}
                    style={{ marginBottom: "10px" }}
                />
                <div>
                    <Button 
                        onClick={uploadPDF} 
                        disabled={!projectName}
                        icon="export"
                        intent="primary"
                        >Upload</Button>
                    <Button 
                    onClick={fetchAllFiles} 
                    disabled={!projectName} 
                    icon="import"
                    intent="success"
                    >Fetch Files</Button>
                    {loading ? <p>Loading...</p> : fileNames.map((fileName, index) => (
                        <Button key={index} onClick={() => fetchIndividualFile(fileName)}>
                            {fileName}
                        </Button>
                    ))}
                </div>
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
          }
          onClose={() => {
            setPdfUrl(null); 
            onClose();
          }}
        />

    );
}