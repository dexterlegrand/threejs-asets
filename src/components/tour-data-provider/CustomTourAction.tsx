import React from 'react';

export const checkAndPerformCustomActions = (tourId: string | undefined, currentStep: number) => {

    switch (tourId) {
        case 'adding-equipments-to-process':
            document.getElementById('bp3-tab-title_TabsExample_3d_modeling')?.click();
            document.getElementById('equipment')?.click();
            break;
        case 'process-designer-start-a-project':
            if (currentStep === 0) {
                document.getElementById('bp3-tab-title_TabsExample_project')?.click();
            }
            break;
        case 'process-designer-adding-equipments-to-process':
            if (currentStep === 0) {
                document.getElementById('Process-0')?.click();
            }
            if (currentStep === 2) {
                document.getElementById('Instrumentation-1')?.click();
            }
            break;
        case 'prodesigner-share-work-with-piping-designer':
            if (currentStep === 0) {
                document.getElementById('bp3-tab-title_TabsExample_exchange')?.click();
                document.getElementById('export-model')?.click();
                console.log(document.getElementById('to-piping-designer'));
                document.getElementById('to-piping-designer')?.click();
            }
            if (currentStep === 1) {
                document.getElementById('export-model')?.click();
            }
            break;
        case 'prodesigner-import-File':
            if (currentStep === 0) {
                document.getElementById('bp3-tab-title_TabsExample_exchange')?.click();
                document.getElementById('import-model')?.click();
            }
            if (currentStep === 1) {
                document.getElementById('import-model')?.click();
            }
            break;
        case 'piping-designer-import-file':
            if (currentStep === 0) {
                document.getElementById('bp3-tab-title_TabsExample_exchange')?.click();
                document.getElementById('import-model')?.click();
            }
            if (currentStep === 1 || currentStep === 2) {
                document.getElementById('import-model')?.click();
            }
            break;
        case 'piping-designer-add-pipes':
            if (currentStep === 0) {
                document.getElementById('Pipe Elements-2')?.click();
            }
            break;
        case 'integrator-sample-project-e2e':
            if (currentStep === 0) {
                document.getElementById('bp3-tab-title_TabsExample_project')?.click();
                document.getElementById('project-settings')?.click();
            }
            if (currentStep === 1) {
                const settingsDialog: HTMLElement | null = document.getElementById('settings-dialog');
                if (settingsDialog) {
                    settingsDialog.style.top = "400px";
                    settingsDialog.style.left = "600px";
                }
                document.getElementById('Grid-2')?.click();
            }
            if (currentStep === 7) {
                document.getElementById('bp3-tab-title_TabsExample_3d_modeling')?.click();
            }
            if (currentStep === 8) {
                document.getElementById('piping-modeling-button')?.click();
            }
            if (currentStep === 12 || currentStep === 13) {
                document.getElementById('mto-modeling-main-button')?.click();
            }
            if (currentStep === 14) {
                document.getElementById('bp3-tab-title_TabsExample_exchange')?.click();
                document.getElementById('export-model')?.click();
            }
            if (currentStep === 15 || currentStep === 16) {
                document.getElementById('export-model')?.click();
            }
            break;
        case 'integrator-sample-project-overview':
            if (currentStep === 0) {
                document.getElementById('bp3-tab-title_TabsExample_3d_modeling')?.click();
            }
            if (currentStep === 1) {
                document.getElementById('piping-modeling-button')?.click();
            }
            if (currentStep === 5 || currentStep === 6) {
                document.getElementById('mto-modeling-main-button')?.click();
            }
            break;
        case 'piping-overview-sample':
            if (currentStep === 0) {
                document.getElementById('bp3-tab-title_TabsExample_exchange')?.click();
                document.getElementById('import-model')?.click();
            }
            if (currentStep === 2) {
                document.getElementById('bp3-tab-title_TabsExample_loading')?.click();
                document.getElementById('load-pipes-button')?.click();
            }
            if (currentStep === 5) {
                document.getElementById('p-Piping')?.click();
                document.getElementById('bp3-tab-title_TabsExample_analysis')?.click();
            }
            if (currentStep === 6) {
                document.getElementById('p-Piping')?.click();
                document.getElementById('r-Reports')?.click();
            }
            break;

        case 'structure-overview-sample':
            if (currentStep === 0) {
                document.getElementById('bp3-tab-title_TabsExample_exchange')?.click();
                document.getElementById('import-model')?.click();
            }
            if (currentStep === 2) {
                document.getElementById('bp3-tab-title_TabsExample_loading')?.click();
            }
            if (currentStep === 3) {
                document.getElementById('bp3-tab-title_TabsExample_analysis')?.click();
                document.getElementById('structure-analysis-button')?.click();
            }
            break;
        case 'grid-setup':
            if (currentStep === 0) {
                document.getElementById('bp3-tab-title_TabsExample_project')?.click();
                document.getElementById('project-settings')?.click();

            }
            if (currentStep === 1) {
                const settingsDialog: HTMLElement | null = document.getElementById('settings-dialog');
                if (settingsDialog) {
                    settingsDialog.style.top = "400px";
                    settingsDialog.style.left = "600px";
                }
                document.getElementById('Grid-2')?.click();

            }
            if (currentStep === 2) {
                document.getElementById('user-defined-grid-button')?.click();
            }
            if (currentStep === 3) {
                const gridSettingsDialog: HTMLElement | null = document.getElementById('user-defined-grids-setting-dialog');
                if (gridSettingsDialog) {
                    console.log('Grid Settings Dialog');
                    gridSettingsDialog.style.top = "450px";
                    gridSettingsDialog.style.left = "850px";
                }
                const xValue: HTMLElement | null = document.getElementById('input-grid-positionX')
                const xName: HTMLElement | null = document.getElementById('input-grid-NameX')
                const zValue: HTMLElement | null = document.getElementById('input-grid-positionZ')
                const zName: HTMLElement | null = document.getElementById('input-grid-NameZ')
                const gridName: HTMLElement | null = document.getElementById('input-grid-name')
                if (xValue && xName && zValue && zName) {
                    (xValue as HTMLInputElement).value = "-6000 -2000 0 4000";
                    (xName as HTMLInputElement).value = "A B C D E";
                    (zName as HTMLInputElement).value = "1 2 3 4";
                    (zValue as HTMLInputElement).value = "-6000 -2000 0 4000";
                    (gridName as HTMLInputElement).value = "Zone A Grid";
                }
            }
            break;
        case 'designer-nozle-creation':
            if (currentStep === 0) {
                document.getElementById('Tie-in points-3')?.click();
            }
            if (currentStep === 2) {
                document.getElementById('nozzle-tool-button')?.click();
            }
            break;
        case 'piping-analysis-pre-requisites':
            if (currentStep === 0) {
                document.getElementById('bp3-tab-title_TabsExample_3d_modeling')?.click();
                document.getElementById('piping-modeling-button')?.click();
                document.getElementById('Pipe Data-0')?.click();
            }
            if (currentStep === 1) {
                document.getElementById('Pipe Data-0')?.click();
            }
            if (currentStep === 3) {
                document.getElementById('bp3-tab-title_TabsExample_loading')?.click();
            }
            break;
        case 'pipedesign-adding-support-to-Pipe':
            if (currentStep === 0) {
                document.getElementById('bp3-tab-title_TabsExample_3d_modeling')?.click();
                document.getElementById('piping-modeling-button')?.click();

            }
            if (currentStep === 1) {
                const pipeDialog: HTMLElement | null = document.getElementById('pipe-modeling-dialog');
                if (pipeDialog) {
                    pipeDialog.style.left = "600px";
                }
                document.getElementById('Pipe Data-0')?.click();
            }
            break;
        case 'designer-creating-bends':
            if (currentStep === 0) {
                document.getElementById('Pipe Elements-2')?.click();
            }
            break;
        case 'edit-move-clone':
            if (currentStep === 0) {
                document.getElementById('bp3-tab-title_TabsExample_edit')?.click();
                document.getElementById('edit-move-clone-button')?.click();
            }
            if (currentStep === 1) {
                const moveDialog: HTMLElement | null = document.getElementById('move-or-clone-dialog');
                if (moveDialog) {
                    moveDialog.style.left = "680px";
                }
            }
            break;
        case 'designer-valve-pipeline':
            if (currentStep === 0) {
                document.getElementById('bp3-tab-title_TabsExample_3d_modeling')?.click();
                document.getElementById('piping-modeling-button')?.click();
            }
            if (currentStep === 1) {
                const pipeDialog: HTMLElement | null = document.getElementById('pipe-modeling-dialog');
                if (pipeDialog) {
                    pipeDialog.style.left = "200px";
                }
                document.getElementById('Pipe Valves-3')?.click();
            }
            break;
        default: return;
    }

}