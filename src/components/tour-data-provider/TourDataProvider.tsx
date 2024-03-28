import React from 'react';
import { custromGridImg, sampleGrid } from './customGridMedia';
import { mtoImage } from './MTOMedia';
import { exportMedia } from './exportMedia';
import { analysisImage, displacementGaph1, loadSection } from './pipeLoadMedia';
import { strAnalysisImg, strLoadImg } from './structureMedia';
import { nozzleAngle, nozzleCreated, selectNozzleDirection, selectNozzleLength, selectNozzlePsoition, updateNozzleIfrequired } from './nozzleMedia';
import { pipeDataCorrection, pipeElementParams, pipeRestraint, pipeYellowBeam, selectNozzleForPipe, zigZagPipes } from './pipeCreationMedia';
import { angledBendImg1, angledBendImg2, angledBendImg3, angledBendImg4, angledBendImg5, angledBendImg6, angledBendImg7, bendAdded, elbowBendYellowImg, endConnectorsBend } from './BendMedia';
import { jiraImage } from './HelpMedia';
import { selectModel } from './MoveCloneMedia';
import { valveSelections } from './ValveMedia';
interface TourData {
    tour_id: string;
    name: string;
    description?: string;
    data: any[];
}
export function getTourData(tourId: string): Array<any> {
    const entry = tourDataSet.find(entry => entry.tour_id === tourId);
    return entry ? entry.data : [];
}

export function getTourListForDiscipline(discipline: string): Array<TourData> {
    switch (discipline) {
        case 'PROCESS':
            return [];
        //return getToursByIds(["process-share-work-with-process-designer", "adding-equipments-to-process"], tourDataSet);
        case 'PRODESIGNER':
            return getToursByIds(["process-designer-start-a-project",
                "process-designer-adding-equipments-to-process",
                "prodesigner-share-work-with-piping-designer",
                "prodesigner-import-File","edit-move-clone","help-report-issue"], tourDataSet);
        case 'PIPDESIGNER':
            return getToursByIds(["process-designer-start-a-project",
                "piping-designer-import-file", "piping-designer-add-pipes","edit-move-clone","help-report-issue","designer-valve-pipeline"], tourDataSet);
        case 'DESIGNER':
            return getToursByIds(["process-designer-start-a-project","grid-setup","process-designer-adding-equipments-to-process",
            "designer-nozle-creation","piping-designer-add-pipes","pipedesign-adding-support-to-Pipe","designer-creating-bends",
            "integrator-sample-project-e2e","edit-move-clone","designer-valve-pipeline","help-report-issue"], tourDataSet);
        case 'PIPING':
            return getToursByIds(["piping-overview-sample","edit-move-clone","piping-analysis-pre-requisites"], tourDataSet);
        case 'STRUCTURE':
            return getToursByIds(["structure-overview-sample","help-report-issue"], tourDataSet);
        default:
            return [];
    }
}

const getToursByIds = (requestedIds: string[], tourDataSet: TourData[]): TourData[] => {
    const tourMap = new Map();
    
    // Create a map of tourId to tourData for efficient lookup
    for (const tour of tourDataSet) {
        tourMap.set(tour.tour_id, tour);
    }
    
    // Create an array to store the tourData in the requested order
    const toursInOrder = [];
    
    // Iterate through requestedIds and add corresponding tourData to toursInOrder
    for (const tourId of requestedIds) {
        const tourData = tourMap.get(tourId);
        if (tourData) {
            toursInOrder.push(tourData);
        }
    }
    
    return toursInOrder;
};

export function getTourList(): string[] {
    return tourDataSet.map(entry => entry.name);
}

/**
 * READ THIS FIRST BEFORE MAKING CHANGES TO THIS FILE.
 * --------------------------------------------------------------
 * Tour data set is defined here.
 * Refer react tour documentation for details on how to write `data` object
 * Make sure that `tour_id` is unique.
 * Make sure to give a proper name to each tour.
 * 
 * AS a BEST PRACTICE Please Move this to Backend to reduce build size.
 * 
 */

const tourDataSet: TourData[] = [{
    tour_id: 'discipline-tour-all',
    name: 'Overview of disciplines',
    description: 'Sample Tour',
    data: [
        {
            selector: '#PROCESS',
            content: (
                <div>
                    Empower your process engineers with a dynamic canvas to effortlessly drag and drop equipment, draw process lines, and craft intricate P&IDs. Unleash creativity while ensuring precision.
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: '#DESIGNER',
            content: (
                <div>
                    Be the maestro of your projects! <br />The Integrator module provides a holistic view, allowing you to oversee and orchestrate every detail.<br /> Seamlessly connect the dots and ensure project harmony.
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        // {
        //     selector: '#PRODESIGNER',
        //     content: (
        //         <div>
        //             Step into the world of three-dimensional ingenuity. <br />
        //             <p>As a Process Designer, sculpt your visions in 3D, creating process designs that seamlessly integrate with the Piping Designer’s canvas.
        //                 <br />Your designs, the blueprint for engineering excellence.
        //             </p>
        //             <br /><br /><i>Please click on highlighted area to continue</i>
        //         </div>
        //     )
        // },
        // {
        //     selector: '#PIPDESIGNER',
        //     content: (
        //         <div>
        //             Precision meets creativity! Piping Designers, add elegance and functionality to your projects.
        //             <p>Design piping routes with finesse, collaborate effortlessly with Process Designers, and analyze with confidence </p>
        //             <br /><br /><i>Please click on highlighted area to continue</i>
        //         </div>
        //     )
        // },
        // {
        //     selector: '#STRDESIGNER',
        //     content: (
        //         <div>
        //             Architects of strength and stability, Structure Designers, bring your creations to life.<br />

        //             <p>Add open frames, pipe racks, sheds, roads, and drains with precision. Your designs, the backbone of engineering resilience</p>
        //             <br /><br /><i>Please click on highlighted area to continue</i>
        //         </div>
        //     )
        // },
        {
            selector: '#PIPING',
            content: (
                <div> Where designs meet scrutiny. Piping Analysis is the crucible where Piping Designs undergo meticulous testing and refinement.
                    <p>Achieve perfection through rigorous analysis, ensuring robustness in every pipe.</p>
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>
            )
        },
        {
            selector: '#STRUCTURE',
            content: (
                <div>
                    Where structure meets scrutiny. <br />
                    <p>Conduct structural analyses with confidence, ensuring your designs stand strong against the test of real-world forces.
                        Strength and stability, engineered to perfection.</p>
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>
            )
        },
        {
            selector: "#Viewer",
            content: (
                <div>
                    Enter the immersive realm of Viewer, where projects come to life in vivid 3D. Review and provide feedback seamlessly.
                    The go-to destination for end customers to witness the magic of your creations.
                </div>
            )
        },
        {
            selector: "#CONNECTION",
            content: (
                <div>
                    Precision in every link! The Connection module is your toolkit for crafting seamless bonds.
                    Engineers, ensure all connections to your structures are not just made, but made with perfection.
                </div>
            )
        },
        {
            selector: "#LEARNINGS",
            content: (
                <div>
                    Empower your team with knowledge.
                    <p>
                        The Training module is your gateway to mastering the IDS app.
                        Engineers and designers, delve deep into functionalities, ensuring you harness the full potential of your suite.
                    </p>
                </div>
            )
        },

    ]
},
{
    tour_id: "process-designer-start-a-project",
    name: "Starting a Project",
    description: "New, Open and save",
    data: [
        {
            selector: '#bp3-tab-title_TabsExample_project',
            content: (
                <div>
                    Get started with a project! <br />
                    <p>Create a new project, or open an existing one.</p>
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: '#new-project',
            content: (
                <div>
                    New project <br />
                    Create a new project by enteriong a new project name
                </div>),
        },
        {
            selector: '#open-project',
            content: (
                <div>
                    Have an existing project? <br />
                    Open them by selecting the file from your computer.
                </div>),
        },
        {
            selector: '#save-project',
            content: (
                <div>
                    Save your current progress of the project
                </div>),
        },
        // {
        //     selector: '#bp3-tab-title_TabsExample_3d_modeling',
        //     content: (
        //         <div>
        //             Be the maestro of your projects! <br />The Integrator module provides a holistic view, allowing you to oversee and orchestrate every detail.<br />
        //             Seamlessly connect the dots and ensure project harmony.
        //         </div>),
        // },

    ]
},
{
    tour_id: "process-designer-adding-equipments-to-process",
    name: "Adding Equipments to scene",
    description: "Adding Equipments to Process",
    data: [
        {
            selector: '#process-tools-dialog',
            content: (
                <div>
                    Tools at your finger tip! <br />
                    Drag and drop equipments and instruments at your convinience.
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: '#Process-0',
            content: (
                <div>
                    Process equipments are available here <br />

                </div>),
        },
        {
            selector: '.tools-body',
            content: (
                <div>
                   <h2> Process equipments </h2><br />
                    Drag and drop equipments at your convinience.
                </div>),
        },
    ]
},
{
    tour_id: "prodesigner-share-work-with-piping-designer",
    name: "Ready to share your work with piping with revision control?",
    data: [
        {
            selector: '#bp3-tab-title_TabsExample_exchange',
            content: (
                <div>
                    Exchange your design with other department seamlessly <br />
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),

        },
        {
            selector: '#export-model',
            content: (
                <div>
                    Export options <br />
                </div>),
            mutationObservables: [".menu-tab-button"],
            highlightedSelectors: [".menu-bar-subgroup"]
        },
        {
            selector: '#scene',
            content: (
                <div>
                    Select to piping desinger and issue the file with revision control <br />
                </div>),
        },
    ]
},
{
    tour_id: "prodesigner-import-File",
    name: "Import file to process designer",
    data: [
        {
            selector: '#bp3-tab-title_TabsExample_exchange',
            content: (
                <div>
                    Exchange your design with other department seamlessly <br />
                </div>),

        },
        {
            selector: '#import-model',
            highlightedSelectors: ["#import-model", ".menu-bar-subgroup"],
            content: (
                <div>
                    Import the file that you received from another module <br />
                </div>),
        },
        {
            selector: '#scene',
            content: (
                <div>
                    <li>
                        From Process designer - imports .dddpsm
                    </li>
                    <li>
                        Piping designer - imports .dddppm
                    </li>
                    <li>
                        Structure designer - imports .dddstr
                    </li>
                </div>),
        },
    ]
},
{
    tour_id: "piping-designer-import-file",
    name: "Import File to Piping Designer",
    data: [
        {
            selector: '#bp3-tab-title_TabsExample_exchange',
            content: (
                <div>
                    Exchange your design with other department seamlessly <br />
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: '#import-model',
            content: (
                <div>
                    Import File to piping designer discipline <br />
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: '#scene',
            content: (
                <div>
                    <li>
                        From Process Designer - Take .ddpsm File  and build pipes on it
                    </li>
                </div>),
        },
    ]
},
{
    tour_id: "piping-designer-add-pipes",
    name: "Add Pipes to the design - Manual routing",
    data: [
        {
            selector: "[id='Pipe Elements-2']",
            content: (
                <div>
                    <h2>Manual routing of pipe</h2>
                    All the piping elements for your design are available in tool box <br />

                    <p>Manual routing is useful when you have decided the pipe path, angle of deviation and direction</p>

                </div>),
        },
        {
            selector: '.tools-body',
            content: (
                <div>
                    Select the piping element and set the parameters.
                    IDS will help you with plotting the pipe elements <br />
                </div>),
        },
        {
            selector: '#pipe-tool',
            content: (
                <div>
                    <h2>Select piping element</h2>
                    First deselect or close if any equipments are selected.

                    Now, Select the piping element and set the parameters for the pipe.
                    
                    <img id='img-nozzle-angle' style={{ height: "300px" }} src={pipeElementParams} />
                    <br /><i>Please click on highlighted pipe element to continue</i>
                  <br />
                </div>),
        },
        {
            selector: '#pipe-tool',
            content: (
                <div>
                    <h2>Select nozzle of the equipment</h2>
                    After setting the pipe parameters
                    <ol>Select the equipment</ol>
                    <ol>Ctrl+ Click on the green point (endtype: Start)</ol>
                    <img id='img-nozzle-angle' style={{ height: "300px" }} src={selectNozzleForPipe} />
                    <br /><i>Please click on highlighted pipe element to continue</i>
                  <br />
                </div>),
        },
        {
            selector: '#pipe-tool',
            content: (
                <div>
                    <h2>Set pipe direction</h2>
                    Yellow beams appears as a directional helper.

                    <ol>Ctrl+ Click at the desidered direction</ol>
                    <ol>Set the legth and Enter</ol>
 
                    <img id='img-nozzle-angle' style={{ height: "300px" }} src={pipeYellowBeam} />
                    <br /><i>Please click on highlighted pipe element to continue</i>
                  <br />
                </div>),
        },
        {
            selector: '#pipe-tool',
            content: (
                <div>
                    <h2>Manual Pipe route</h2>
                    One can model pipe precisely in required direction.

                    <img id='img-nozzle-angle' style={{ height: "300px" }} src={zigZagPipes} />
                    <br /><i>Please click on highlighted pipe element to continue</i>
                  <br />
                </div>),
        },
        {
            selector: '#pipe-tool',
            content: (
                <div>
                    <h2>Check Start co-ordinates, End Co-ordinates, Plan angle, Elevation angle</h2>
                   
                    Some times its hard to precisely click on desired co-ordinates when performing manual routing.
                    It is a must to check the Pipe data before we add any bends. 
                    <br />
                    Go to <b>3D modeling &gt; Pipe</b>
                    <br />
                    <img id='img-nozzle-angle' style={{ height: "300px" }} src={pipeDataCorrection} />
                    <li>Observe that here end co-ordinate </li>
                    
                    <br /><i>Please click on highlighted pipe element to continue</i>
                  <br />
                </div>),
        },
        
    ]
},
{
    tour_id: "process-designer-sample-project",
    name: "Take a sample project",
    data: [
        {
            selector: "#bp3-tab-title_TabsExample_project",
            content: (
                <div>
                    Buckle up! <br></br> Lets go on a journey to take atour of sample project that we created for you! <br />
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: '#open-project',
            content: (
                <div>
                    Click here and lets load the project <br />

                    We will open a sample project here for this demo,
                </div>),
        }

    ]
},
{
    tour_id: "integrator-sample-project-overview",
    name: "Get Overview of my project",
    data: [
        {
            selector: '#scene',
            content: (
                <div>
                    Explore your ideas in the immersive 3D canvas, where creativity meets visualization.<br />
                    <br /><br /><i>Please click on highlighted canvas area to continue</i>
                </div>),
        },
        {
            selector: "[id='bp3-tab-title_TabsExample_3d_modeling']",
            content: (
                <div>
                    <h3>Review 3D Models</h3>
                    Dive into the details of your 3D models. Review and analyze each element seamlessly.<br />
                    <br /><br /><i>Please click on highlighted canvas area to continue</i>
                </div>),
        },
        {
            selector: '#piping-modeling-button',
            content: (
                <div>
                    <h3>Effortless Piping Data Access</h3>
                    Access all your piping data from a single, convenient location. Simplify your workflow with easy-to-reach information.<br />
                    <br /><br /><i>Please click on highlighted canvas area to continue</i>
                </div>),
        },
        {
            selector: '#pipe-modeling-dialog',
            content: (
                <div>
                    Find all your piping data in one central place for easy accessibility and efficient management. <br />
                    <br /><br /><i>Please click on highlighted canvas area to continue</i>
                </div>),
        },
        {
            selector: '#flare-modeling-button',
            highlightedSelectors: ['#flare-modeling-button', '#derrick-modeling-button', '#pipe-rack-modeling-button', '#factory-shed-modeling-button', '#open-frame-modeling-button'],
            content: (
                <div>
                    <h3>Structure Details at Your Fingertips</h3>
                    Gain control over your structure and its specific details effortlessly.<br />
                    <br /><br /><i>Please click on highlighted canvas area to continue</i>
                </div>),
        },
        {
            selector: '#clash-check-modeling-button',
            content: (
                <div>
                    Wondering about clashes? Perform a clash check and view detailed resolutions for a seamless design experience.
                    <br /><br /><i>Please click on highlighted canvas area to continue</i>
                </div>),
        },
        {
            selector: '#mto-modeling-main-button',
            content: (
                <div>
                    <h3>Detailed Material Take Off</h3>
                    Dive into the details of your material take off (MTO) for comprehensive insights.<br />
                    <br /><br /><i>Please click on highlighted canvas area to continue</i>
                </div>),
        },
        {
            selector: '#mto-modeling-pipe-button',
            highlightedSelectors: ['#mto-modeling-pipe-button', '#mto-modeling-flare-button', '#mto-modeling-derrick-button', '#mto-modeling-pipe-rack-button', '#mto-modeling-open-frame-button'],
            content: (
                <div>
                    Material take off in detail<br />
                    <br /><br /><i>Please click on highlighted canvas area to continue</i>
                </div>),
        }
    ]
},
{
    tour_id: "integrator-sample-project-e2e",
    name: "Sample project overview",
    description: "Giving a a video tutorial on how to use integraator for designing and then exporting files to Pipe and Structure Analysis modules",
    data: [
        {
            selector: '#scene',
            content: (
                <div>
                    This are is your canvas to perform the design <br />
                    Create your grid based on plot plan, Drag and drop equipments, create nozzles/ tie in points, connect lines, and pipes with the help of auto and manual routing.
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: '#project-settings',
            content: (
                <div>
                    Under settings setup your reference Grid
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: "#Grid-2",
            content: (
                <div>
                    Its convinient to use grid system to accurately place the equipments in exact positions as per layout plan
                </div>),
        },
        {
            selector: '#user-defined-grid-button',
            content: (
                <div>
                    User defined grids are easy to configure and help you with equipment positioning. <br />
                    <img id='img-test' style={{ height: "300px" }} src={custromGridImg} />
                    <br />
                    Define your Grid effortlesly
                </div>),
        },
        {
            selector: '#process-tools-dialog',
            content: (
                <div>
                    Tools at your finger tip! <br />
                    Drag and drop equipments and instruments at your convinience.
                    <br />

                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: '#Process-0',
            content: (
                <div>
                    Process equipments are available here <br />

                </div>),
        },
        {
            selector: '.tools-body',
            content: (
                <div>
                    Process equipments <br />
                    Drag and drop equipments at your convinience. <br />
                    {/* <img id='gif-dnd' style={{height: "600px"}} src={mtoImage}/> */}
                </div>),
        },
        {
            selector: '#scene',
            content: (
                <div>
                    Make conections and add pipes from tool box <br />

                </div>),
        },
        {
            selector: "[id='bp3-tab-title_TabsExample_3d_modeling']",
            content: (
                <div>
                    <h3>Review 3D Models</h3>
                    Dive into the details of your 3D models. Review and analyze each element seamlessly.<br />
                    <br /><br /><i>Please click on highlighted canvas area to continue</i>
                </div>),
        },
        {
            selector: '#piping-modeling-button',
            content: (
                <div>
                    <h3>Effortless Piping Data Access</h3>
                    Access all your piping data from a single, convenient location. Simplify your workflow with easy-to-reach information.<br />
                    <br /><br /><i>Please click on highlighted canvas area to continue</i>
                </div>),
        },
        {
            selector: '#pipe-modeling-dialog',
            content: (
                <div>
                    Find all your piping data in one central place for easy accessibility and efficient management. <br />
                    <br /><br /><i>Please click on highlighted canvas area to continue</i>
                </div>),
        },
        {
            selector: '#flare-modeling-button',
            highlightedSelectors: ['#flare-modeling-button', '#derrick-modeling-button', '#pipe-rack-modeling-button', '#factory-shed-modeling-button', '#open-frame-modeling-button'],
            content: (
                <div>
                    <h3>Structure Details at Your Fingertips</h3>
                    Gain control over your structure and its specific details effortlessly.<br />
                    <br /><br /><i>Please click on highlighted canvas area to continue</i>
                </div>),
        },
        {
            selector: '#clash-check-modeling-button',
            content: (
                <div>
                    Wondering about clashes? Perform a clash check and view detailed resolutions for a seamless design experience.
                    <br /><br /><i>Please click on highlighted canvas area to continue</i>
                </div>),
        },
        {
            selector: '#mto-modeling-main-button',
            content: (
                <div>
                    <h3>Detailed Material Take Off</h3>
                    Dive into the details of your material take off (MTO) for comprehensive insights.<br />
                    <br /><br /><i>Please click on highlighted canvas area to continue</i>
                </div>),
        },
        {
            selector: '#mto-modeling-main-button',
            content: (
                <div>
                    Material take off in detail<br />
                    <img id='mto-image' style={{ height: "350px" }} src={mtoImage} />
                    <br /><br /><i>Please click on highlighted canvas area to continue</i>
                </div>),
        },
        {
            selector: '#bp3-tab-title_TabsExample_exchange',
            content: (
                <div>
                    Exchange your design with other department seamlessly <br />
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: '#export-model',
            content: (
                <div>
                    <h3>All in one place for multi disciplinary data exchange</h3>
                    <img id='export-image' style={{ height: "270px" }} src={exportMedia} /><br />
                    <li>Export File to PPSM format, and a piping engineer would import it for analysis <br /></li>
                    <li>Export File to ODSM format, and a Structure engineer would import it for analysis <br /></li>
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },

    ]
},
{
    tour_id: "piping-overview-sample",
    name: "Overview of Piping",
    data: [
        {
            selector: '#bp3-tab-title_TabsExample_exchange',
            content: (
                <div>
                    Easily exchange your design data with other departments seamlessly. <br />
                </div>),

        },
        {
            selector: '#import-model',
            content: (
                <div>
                    Import the .ppsm file that you received from the designer module. <br />
                </div>),
        },
        {
            selector: '#scene',
            content: (
                <div>
                    <h3>Pipe Model Ready for Analysis</h3>
                </div>),
        },
        {
            selector: '#bp3-tab-title_TabsExample_loading',
            content: (
                <div>
                    <h3>Set Pre-analysis Conditions for Pipes</h3>
                </div>),
        },
        {
            selector: '#load-pipes-button',
            content: (
                <div>
                    <h3></h3>
                    Configure pre-analysis conditions for pipes.
                    <img id="load-image" style={{ width: "650px" }} src={loadSection} /><br />
                </div>),
        },
        {
            selector: '#bp3-tab-title_TabsExample_analysis',
            content: (
                <div>
                    <h3>Perform Analysis</h3>
                    Perform analysis with pre-set conditions and generate a report.
                </div>),
        },
        {
            selector: '#p-Piping',
            content: (
                <div>
                    <h3></h3>
                    View the analysis results and obtain a detailed report.
                    <img id="p-load-image" style={{ width: "280px" }} src={analysisImage} /><br />
                    <img id="p-load-image2" style={{ width: "280px" }} src={displacementGaph1} />
                </div>),
        }
    ]
},
{
    tour_id: "pipedesign-adding-support-to-Pipe",
    name: "Adding Support to Pipelines",
    data: [
        {
            selector: '#bp3-tab-title_TabsExample_3d_modeling',
            content: (
                <div>
                    <h2>Adding Restraint/ Support to the pipe</h2>
                        A pipe always needs a support.
                        One can direct select a support from Pipe elements and give support to the pipe.
                        <br /> 
                        Alternatively, user can go 3D Piping data and configure the 

                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: '#piping-modeling-button',
            content: (
                <div>
                    <h2>Adding Restraint</h2>
                        Go to 3D Piping data
                    </div>),
        },
        {
            selector: '#pipe-modeling-dialog',
            content: (
                <div>
                    <h2>Adding Restraint</h2>
                    Select the Pipe element and set the location and type of the restraint/support.

                    <img id="Pipe Restraint image" style={{ width: "650px" }} src={pipeRestraint} />

                    <br /><br />
                    Please refer User Manual for details <br/> <span style={{color:"red"}}>3D Modeling - Piping Designer</span> <b>-&gt;</b> <span style={{color:"red"}}>Pipe Supports</span>
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },

    ]
},
{
    tour_id: "piping-analysis-pre-requisites",
    name: "Getting ready for analysis",
    data: [
        {
            selector: '#bp3-tab-title_TabsExample_loading',
            content: (
                <div>
                    <h2>Pre requisites for Pipe analysis</h2>
                     Before we perform actual lines following things needs to be set.
                     <ol>
                        <li>Restraints for pipe (there should be atleast one Support to the line)</li>
                        <li>Setting Loads</li>
                        <ul>
                            <li>Dead load (if any)</li>
                            <li>Insulation Loads (if any)</li>
                            <li>Slug load (if any)</li>
                            <li>Seismic Load (if any)</li>
                            <li>Wind Load <b>(Important)</b></li>
                            <li>Load Combination as per design specification <b>(Important)</b></li>
                        </ul>
                     </ol>
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: '#pipe-modeling-dialog',
            content: (
                <div>
                    <h2>Pre requisites for Pipe analysis</h2>
                    Restraints of pipe can be edited from the <b>pipe data table</b>.<br />

                    <b> 3D modeling &gt; Piping</b>
                </div>),
        },
        {
            selector: '#Restraints-11',
            content: (
                <div>
                    <h2>Adding Restraint</h2>
                    Select the Pipe element and set the location and type of the restraint/support.

                    <img id="Pipe Restraint image" style={{ width: "650px" }} src={pipeRestraint} />

                    <br /><br />
                    Please refer User Manual for details<br /> <span style={{color:"red"}}>3D Modeling - Piping Designer</span> <b>-&gt;</b> <span style={{color:"red"}}>Pipe Supports</span>
                </div>),
        },
        {
            selector: '#load-pipes-button',
            content: (
                <div>
                    <h3></h3>
                    Similarly setting load condtions to pipe is important.

                    <img id="load-image" style={{ width: "650px" }} src={loadSection} /><br />
                </div>),
        }
    ]
}
,
{
    tour_id: "structure-overview-sample",
    name: "Overview of Structure",
    data: [
        {
            selector: '#bp3-tab-title_TabsExample_exchange',
            content: (
                <div>
                    Easily exchange your design data with other departments seamlessly. <br />
                </div>),

        },
        {
            selector: '#import-model',
            content: (
                <div>
                    Import the .odsm file that you received from the designer module. <br />
                </div>),
        },
        {
            selector: '#scene',
            content: (
                <div>
                    <h3>Structure Model is Ready for Analysis</h3>
                </div>),
        },
        {
            selector: '#pipe-rack-load',
            highlightedSelectors: ["#pipe-rack-load","#open-frame-load","#factory-shed-load"],
            content: (
                <div>
                    <h3></h3>
                    Configure pre-analysis conditions for the structures.
                    <img id="load-image" style={{ width: "650px" }} src={strLoadImg} /><br />
                </div>),
        },
        {
            selector: '#bp3-tab-title_TabsExample_analysis',
            content: (
                <div>
                    <h3>Perform Analysis</h3>
                    Perform analysis with pre-set conditions and generate a report.
                </div>),
        },
        {
            selector: '#structure-analysis-button',
            content: (
                <div>
                    <h3></h3>
                    View the analysis results and obtain a detailed report.
                    <img id="str-load-image" style={{ width: "280px" }} src={strAnalysisImg} /><br />
                </div>),
        }
    ]
},{
    tour_id: "grid-setup",
    name: "Setting up grid for the layout",
    data: [
        {
            selector: '#scene',
            content: (
                <div>
                    It is important to setup the grid in IDS before we start with a design <br />
                    Keep your layout design handy and lets define the grid.

                    With the help of the grid its convinient to place the equipments and structures.
                </div>),

        },
        {
            selector: '#project-settings',
            content: (
                <div>
                    Under settings setup your reference Grid
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: "#Grid-2",
            content: (
                <div>
                    Its convinient to use grid system to accurately place the equipments in exact positions as per layout plan
                </div>),
        },
        {
            selector: '#user-defined-grid-button',
            content: (
                <div>
                    <h3>Define your Grid effortlesly</h3>
                    Lets create below grid for the layout as a sample <br />

                    <img id='img-test' style={{ height: "400px" }} src={sampleGrid} />
                    
                    <br />
                   <li>Notice that the Grid C-3 is at 0,0 which we added for our convenience.</li> 
                    <br />
                   <li> Each grid lines are spaced with some distance. </li>

                   <b>Now lets implement this by clicking <span style={{color:"blue"}}> User defined Grids </span> button</b>
                    <br />
                    
                </div>),
        },
        {
            selector: "#input-grid-name",
            content: (
                <div>
                    Give a name to the defined grid
                </div>),
        },
        {
            selector: "#input-grid-positionX",
            content: (
                <div>
                    <li>Enter the grid positions of X cordinate. 
                    </li>
                    Now refer the below sample and notice how x cordinates are entered.<br />
                    <img id='img-test' style={{ height: "400px" }} src={sampleGrid} />
                </div>),
        },
        {
            selector: "#input-grid-NameX",
            content: (
                <div>
                    <li>
                    Now for each X- grid line give a name to the defined grid.
                    </li>
                    <br />
                    you are free to give a name/label according to your convinience.,<br />
                    <i>Here we are using A, B, C, ..</i>
                    <img id='img-test' style={{ height: "400px" }} src={sampleGrid} />
                </div>),
        },
        {
            selector: "#input-grid-NameZ",
            highlightedSelectors: ['#input-grid-positionZ','#input-grid-NameZ'],
            content: (
                <div>
                    Similary do naming and set the value of the grid values for Z
                    <img id='img-test' style={{ height: "400px" }} src={sampleGrid} />
                </div>),
        },
        {
            selector: "#generate-grid",
            content: (
                <div>
                    Click on generate to create the layout grid.
                </div>),
        },
    ]  
},
{
    tour_id: "designer-nozle-creation",
    name: "Create a nozzle for an equipment",
    data: [
        {
            selector: '#process-tools-dialog',
            content: (
                <div>
                   Process rools contain option to pop up a nozzle from an equimpment<br />
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: "[id='Tie-in points-3']",
            content: (
                <div>
                    Click on tie in points<br />
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>)
        },
        {
            selector: '#nozzle-tool-button',
            content: (
                <div>
                    <li>
                        Select nozzle button
                    </li>
                </div>),
        },
        {
            selector: '#nozzle-connection-parameter-dialog',
            content: (
                <div>
                    <li>
                        Fill in nozzle Connection Parameters
                    </li>
                </div>),
        },
        {
            selector: '#nozzle-connection-parameter-dialog',
            content: (
                <div>
                    <li>
                        Select the equipment to which nozzle to be added
                    </li>
                    <li>
                        Ctrl + Click on the equipment Surface to pop up the nozzle
                    </li>
                    <img id='img-test' style={{ height: "400px" }} src={selectNozzlePsoition} />
                        <br /><br /><i>Please click on highlighted area to continue</i>
                    <li>
                        This will pop yellow guiding lines using which you will pop nozzle lines.
                    </li>
                    <br /><br />
                </div>),
        },
        {
            selector: '#nozzle-connection-parameter-dialog',
            content: (
                <div>
                    <li>
                        Select nozzle direction
                        <img id='img-test' style={{ height: "400px" }} src={selectNozzleDirection} />
                        <br /><br /><i>Please click on highlighted area to continue</i>
                    </li>
                </div>),
        },
        {
            selector: '#nozzle-connection-parameter-dialog',
            content: (
                <div>
                    <li>
                        Select nozzle length
                        <img id='img-test' style={{ height: "400px" }} src={selectNozzleLength} />
                        
                        <br /><br /><i>Please click on highlighted area to continue</i>
                    </li>
                </div>),
        },
        {
            selector: '#nozzle-connection-parameter-dialog',
            content: (
                <div>
                    <li>
                        New nozzle is created

                        <img id='img-test' style={{ height: "400px" }} src={nozzleCreated} />
                        
                        <br /><br /><i>Please click on highlighted area to continue</i>
                    </li>
                </div>),
        },
        {
            selector: '#nozzle-connection-parameter-dialog',
            content: (
                <div>
                    <li>
                        Select nozzle, and update the parameters
                        <img id='img-test' style={{ height: "600px" }} src={updateNozzleIfrequired} />
                        <br /><br /><i>Please click on highlighted area to continue</i>
                    </li>
                </div>),
        },
        {
            selector: '#nozzle-connection-parameter-dialog',
            content: (
                <div>
                    <h3>Make sure to confirm the nozzle parameters</h3>
                    <li>Verify x,y,z co-ordinates of nozzle end and start position</li>
                    <li>
                        Select appropriate theta and inclination angle to set the alignment
                        <img id='img-nozzle-angle' style={{ height: "600px" }} src={nozzleAngle} />
                        <br /><br /><i>Please click on highlighted area to continue</i>
                    </li>
                </div>),
        }
    ],
},
{
    tour_id: "designer-creating-bends",
    name: "Bends / Elbows and orientations",
    data: [
        {
            selector: '#process-tools-dialog',
            content: (
                <div>
                   <h2>Philosophy of Bend/Elbow</h2>
                   <br />
                   In IDS, It s important for one to understand how to add end connectors like Bends (Also called as Elbows).<br />
                   In IDS Bends are dependent on the Pipe Elements.<br /><br />
                   Hence in order to make sure that Bends fit accurately in the directions of pipe, One should carefully review if Pipes are placed accurately in their co-ordinates.
                   <br /><br />
                   For this one should Review Start co-ordinates, End-Co-ordinates, Plan angle and Elevation angles from the Pipe Data table.

                   <br />
                   <img id='img-pipe-Data-Correction' style={{ height: "300px" }} src={pipeDataCorrection} />
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: "[id='Pipe Elements-2']",
            content: (
                <div>
                   <h2>Popping a Bend / Elbow</h2><br />
                   Once Pipe data is corrected, you can got to <b>Process tools -&gt; Pipe Elements</b> to select Elbow tool.
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>)
        },
        {
            selector: "[id='elbow-tool']",
            content: (
                <div>
                   <h2>Popping a Bend / Elbow</h2><br />
                   Select the Elbow tool, and IDS will highlight the area to create the Bend/Elbow. <br />
                   Then <b>Ctrl + Click on the Yellow bubble</b>
                   <img id='img-elbowBendYellowImg' style={{ height: "300px" }} src={elbowBendYellowImg} />
                <br /><br /><i>Please click on highlighted area to continue</i>
                </div>)
        },
        {
            selector: "[id='elbow-tool']",
            content: (
                <div>
                   <h2>Popping a Bend / Elbow</h2><br />
                   This will add the Bend in the direction that connects two pipes.
                   <img id='img-bend-added' style={{ height: "300px" }} src={bendAdded} />
                   <br />
                   Its important to understand that End connectors like Bend or Tee gets applied to the pipe baseed on the pipe co-ordinates and angle. 
                <br /><br /><i>Please click on highlighted area to continue</i>
                </div>)
        },
        {
            selector: "[id='elbow-tool']",
            content: (
                <div>
                   <h2>Understanding End connectors</h2><br />
                        Under <b>Pipe Modeling data -&gt; End Connectors </b>
                        <br />
                        You will observe how an end connector like Elbow is controlled.
                        <br />
                        Make a key observation of Pipe Number, Preceeding Pipe, and Angle to Preceeding Pipe.
                        <br />

                   <img id='img-bend-added' style={{ height: "600px" }} src={endConnectorsBend} />
                   <br />
                    
                <br /><br /><i>Please click on highlighted area to continue</i>
                </div>)
        },
        {
            selector: "[id='elbow-tool']",
            content: (
                <div>
                   <h2>Understanding End connectors</h2><br />
                    Some time user might come across a scenario where Bend is not fittng correctly.
                    Wondering why? <br />
                    This happens if your Plan angle and Elevation is not set right!<br /><br />
                    Lets See one Scenario:
                   <img id='img-bend-added' style={{ height: "600px" }} src={angledBendImg1} />
                   <br />
                    
                <br /><br /><i>Please click on highlighted area to continue</i>
                </div>)
        },
        {
            selector: "[id='elbow-tool']",
            content: (
                <div>
                   <h2>Understanding End connectors</h2><br />
                    Even though the co-ordinates got captured currectly, the Plan and elevation is not right!

                   <img id='img-bend-added' style={{ height: "600px" }} src={angledBendImg2} />
                   <br />
                    
                <br /><br /><i>Please click on highlighted area to continue</i>
                </div>)
        },
        {
            selector: "[id='elbow-tool']",
            content: (
                <div>
                   <h2>Understanding End connectors</h2><br />
                    Make that correction<br />

                   <img id='img-bend-added' style={{ height: "600px" }} src={angledBendImg3} />
                   <br />
                    
                <br /><br /><i>Please click on highlighted area to continue</i>
                </div>)
        },
        {
            selector: "[id='elbow-tool']",
            content: (
                <div>
                   <h2>Wondering how?</h2><br />
                    
                    The plan and elevation angles are flexible parameters that lets user to control the direction of the the pipes.
                    <br /><br />
                    Just play arround to see how it impacts the direction.
                    <br />Keep a close eye on Signs 

                   <img id='img-bend-added' style={{ height: "600px" }} src={angledBendImg4} />
                   <br />
                    
                <br /><br /><i>Please click on highlighted area to continue</i>
                </div>)
        },
        {
            selector: "[id='elbow-tool']",
            content: (
                <div>
                   <h2>Wondering how?</h2><br />
                    Notice how the direction changes as you play around with the plan and elevation angles.

                   <img id='img-bend-added' style={{ height: "600px" }} src={angledBendImg5} />
                   <br />
                    
                <br /><br /><i>Please click on highlighted area to continue</i>
                </div>)
        },
        {
            selector: "[id='elbow-tool']",
            content: (
                <div>
                   <h2>Wondering how?</h2><br />
                    Notice how the direction changes as you play around with the plan and elevation angles.

                   <img id='img-bend-added' style={{ height: "600px" }} src={angledBendImg6} />
                   <br />
                    
                <br /><br /><i>Please click on highlighted area to continue</i>
                </div>)
        },
        {
            selector: "[id='elbow-tool']",
            content: (
                <div>
                   <h2>Add the bend</h2><br />
                    Once You correct the direction Use Elbow tool to add the bend.

                   <img id='img-bend-added' style={{ height: "600px" }} src={angledBendImg7} />
                   <br />
                    
                <br /><br /><i>Please click on highlighted area to continue</i>
                </div>)
        }
    ],
},
{
    tour_id: "help-report-issue",
    name: "Need Help?",
    data: [
        {
            selector: '#bp3-tab-title_TabsExample_help',
            content: (
                <div>
                   <h2>Need to report an issue or query?</h2>
                   <br />
                   When dealing with large project, we understand that user would need quick support to resolve their query.
                   <br />For this, Inside IDS we integrated the issue tracking and helpdesk system to assist the user.

                   Click on Help tab.
                   
                   <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: '#help-report-issue-button',
            content: (
                <div>
                   <h2>Need to report an issue or query?</h2>

                   Click on <b>Help -&gt; Report issue</b>. <br /><br />

                   Create an account using your email address and raise your queries.<br />

                   <img id='img-jira' style={{ height: "500px" }} src={jiraImage} />
                   <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
    ],
},
{
    tour_id: "edit-move-clone",
    name: "Move or Make a Clone",
    data: [
        {
            selector: '#bp3-tab-title_TabsExample_edit',
            content: (
                <div>
                   <h2>Move or Make a Clone</h2>
                   <br />
                        Wondering how to move or clone (copy) a line or OpenFrame or an equipment?
                   <br/>
                       Under Edit you get a tool box to do this.
                   <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: '#edit-move-clone-button',
            content: (
                <div>
                    <h2>Move or Make a Clone</h2>
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: '#move-or-clone-dialog',
            content: (
                <div>
                    <h2>How to move?</h2>
                    To move, select the model you want to move from the drop down.
                    <br></br>
                    Then provide the value by which you want to move in X, Y and Fields.

                    <br /> For example if you want to move a line 1 by 1000mm in X direction, Fill x=1000 and click <b>Move</b>
                    <img id='img-jira' style={{ height: "500px" }} src={selectModel} />
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: '#move-or-clone-dialog',
            content: (
                <div>
                    <h2>How to Clone?</h2>
                        Just like move, select the model you want to move from the drop down.
                        <br></br>
                        Then Make sure to update the x,y,z values to represent where exactly you want the model to be cloned.
                        <br />  <br />
                        If you dont enter values, model will be just cloned at the same position, which would be overlapping with original model.
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
    ],
},
{
    tour_id: "designer-valve-pipeline",
    name: "Adding Valve",
    data: [
        {
            selector: '#bp3-tab-title_TabsExample_3d_modeling',
            content: (
                <div>
                   <h2>Valves</h2>
                   <br />
                    Go to 3D Modeling -&gt; Piping 
                   <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: '#piping-modeling-button',
            content: (
                <div>
                    <h2>Valves</h2>
                    Select Pipe and go to Pipe valve tab
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: "[id='Pipe Valves-3']",
            content: (
                <div>
                    <h2>Valves</h2>
                        <li>Select the Pipe element to which you want to add the valve.</li>
                        <li>Select the Valve type and set the position to either start or end of the element.</li>
                        <img id='valve-selection' style={{ height: "500px" }} src={valveSelections} />
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        }
    ],
},
{
    tour_id: "designer-pipe-",
    name: "Adding Openframe",
    data: [
        {
            selector: '#bp3-tab-title_TabsExample_3d_modeling',
            content: (
                <div>
                   <h2>Valves</h2>
                   <br />
                    Go to 3D Modeling -&gt; Piping 
                   <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: '#piping-modeling-button',
            content: (
                <div>
                    <h2>Valves</h2>
                    Select Pipe and go to Pipe valve tab
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        },
        {
            selector: "[id='Pipe Valves-3']",
            content: (
                <div>
                    <h2>Valves</h2>
                        <li>Select the Pipe element to which you want to add the valve.</li>
                        <li>Select the Valve type and set the position to either start or end of the element.</li>
                        <img id='valve-selection' style={{ height: "500px" }} src={valveSelections} />
                    <br /><br /><i>Please click on highlighted area to continue</i>
                </div>),
        }
    ],
}
]