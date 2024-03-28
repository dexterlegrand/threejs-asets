import { CellConfig, jsPDF } from "jspdf";
import { roundM } from "../../components/3d-models/utils";
import { getFlaresMTO } from "../../components/menu-bar/3d-modeling/MTO/flare/FlareSyncMTO";
import { getOpenFramesMTO } from "../../components/menu-bar/3d-modeling/MTO/open-frame/OFSectionsSyncMTO";
import { getPipeRacksMTO } from "../../components/menu-bar/3d-modeling/MTO/pipe-rack/PRSectionsSyncMTO";
import { getPipeAccessoriesSyncMTO } from "../../components/menu-bar/3d-modeling/MTO/pipe/AccessoriesSyncMTO";
import { getPipesSyncMTO } from "../../components/menu-bar/3d-modeling/MTO/pipe/LinesSyncMTO";
import { TOpenFrame } from "../../store/main/openFrameTypes";
import {
  EDashboardCheckType,
  PipeRack,
  Project,
  TDashboardBudget,
  TDashboardBudgetCategory,
} from "../../store/main/types";

const yMM = 10;

export function saveToPDF(project?: Project) {
  if (!project || !project.dashboard) return;
  const doc = new jsPDF({
    orientation: "p",
    unit: "mm",
    format: "a4",
    putOnlyUsedFonts: true,
  });

  const { dashboard } = project;

  let currentY = incriceY(doc, 0);

  doc.text(`Project NAME / EVENT TITLE: ${project.name}`, 10, currentY);
  currentY = incriceY(doc, currentY);
  doc.text(`VENUE / LOCATION: ${dashboard.location}`, 10, currentY);
  currentY = incriceY(doc, currentY);
  doc.text(`PROJECT DATE & TIME: ${dashboard.date}`, 10, currentY);
  currentY = incriceY(doc, currentY);
  doc.text(`ADDITIONAL INFO: ${dashboard.description}`, 10, currentY);

  currentY = incriceY(doc, currentY);

  if (dashboard.checklist) {
    currentY = incriceY(doc, currentY);
    doc.text(`Project Planning Checklist`, 10, currentY);
    for (const item of dashboard.checklist) {
      currentY = incriceY(doc, currentY);
      doc.text(`${item.header}:`, 20, currentY);
      for (let i = 0; i < item.tasks.length; i++) {
        const task = item.tasks[i];
        currentY = incriceY(doc, currentY);
        doc.text(
          `${i + 1}) ${task.title}${getCheckListItemTypeStr(task.type)}`,
          30,
          currentY
        );
      }
      currentY = incriceY(doc, currentY);
    }
  }

  if (dashboard.engineerGroups) {
    currentY = incriceY(doc, currentY);
    doc.text(`Engineering List:`, 10, currentY);
    for (const group of dashboard.engineerGroups) {
      currentY = incriceY(doc, currentY);
      doc.text(`${group.header}:`, 20, currentY);
      for (let i = 0; i < group.engineers.length; i++) {
        const e = group.engineers[i];
        const flags: string[] = [];
        if (e.invitation === EDashboardCheckType.FINISHED)
          flags.push("engineer");
        if (e.attending === EDashboardCheckType.FINISHED)
          flags.push("reviewer");
        if (e.thanks === EDashboardCheckType.FINISHED) flags.push("tanks");
        currentY = incriceY(doc, currentY);
        doc.text(
          `${i + 1}) ${e.name}${flags ? ` (${flags.join("/")})` : ""}`,
          30,
          currentY
        );
      }
      currentY = incriceY(doc, currentY);
    }
  }

  if (dashboard.budget) drawDashBoardBudget(doc, dashboard.budget);

  drawPipeLinesMTO(doc, project);
  drawPipesAccessoriesMTO(doc, project);
  drawFlaresMTO(doc, project);
  drawPipeRacksMTO(doc, project);
  drawOpenFramesMTO(doc, project);

  doc.addPage();

  doc.save(project.name);
}

function drawDashBoardBudget(doc: jsPDF, budget: TDashboardBudget) {
  const current = doc.getCurrentPageInfo();
  doc.addPage();
  doc.setPage(current.pageNumber + 1);
  let currentY = incriceY(doc, 0);
  const expence =
    budget.categories?.reduce((acc, cat) => {
      return acc + getCategorySubTotal(cat);
    }, 0) ?? 0;
  currentY = incriceY(doc, currentY);
  doc.text(`Project Budget:`, 10, currentY);
  currentY = incriceY(doc, currentY);
  doc.text(`Total: $${budget.total ?? 0}`, 20, currentY);
  currentY = incriceY(doc, currentY);
  doc.text(`Expence Total: $${expence}`, 20, currentY);
  currentY = incriceY(doc, currentY);
  doc.text(`Difference: $${(budget.total ?? 0) - expence}`, 20, currentY);
  currentY = incriceY(doc, currentY);
  if (!budget.categories) return;
  for (let i = 0; i < budget.categories.length; i++) {
    const cat = budget.categories[i];
    const subTotal = getCategorySubTotal(cat);
    const subTotalPercent = budget.total
      ? roundM((subTotal / budget.total) * 100, 100)
      : 0;
    currentY = incriceY(doc, currentY);
    doc.text(
      `${i + 1}) ${cat.name} - $${subTotal} (${subTotalPercent}%)`,
      20,
      currentY
    );
    for (let j = 0; j < cat.activities.length; j++) {
      const act = cat.activities[j];

      currentY = incriceY(doc, currentY);
      doc.text(`${i + 1}.${j + 1}) ${act.name} ($${act.amount})`, 30, currentY);

      if (act.start) {
        currentY = incriceY(doc, currentY);
        doc.text(`Start Date: ${getFullDate(act.start)}`, 40, currentY);
      }

      if (act.duration) {
        currentY = incriceY(doc, currentY);
        doc.text(`Duration: ${act.duration} hours`, 40, currentY);
      }

      if (act.actualStart) {
        currentY = incriceY(doc, currentY);
        doc.text(
          `Actual Start Date: ${getFullDate(act.actualStart)}`,
          40,
          currentY
        );
      }

      if (act.actualDuration) {
        currentY = incriceY(doc, currentY);
        doc.text(`Actual Duration: ${act.actualDuration} hours`, 40, currentY);
      }

      if (act.duration) {
        currentY = incriceY(doc, currentY);
        doc.text(
          `Completed on: ${(act.actualDuration ?? 0) / act.duration}%`,
          40,
          currentY
        );
      }

      if (act.comment) {
        currentY = incriceY(doc, currentY);
        doc.text(`Comment: ${act.comment}`, 40, currentY);
      }
    }
    if (cat.activities.length) currentY = incriceY(doc, currentY);
  }
  currentY = incriceY(doc, currentY);
}

function drawPipeLinesMTO(doc: jsPDF, project: Project) {
  const pipeLinesMTO = getPipesSyncMTO(project.freePipes ?? []);

  if (!pipeLinesMTO.length) return;

  const current = doc.getCurrentPageInfo();
  doc.addPage();
  doc.setPage(current.pageNumber + 1);

  const y = incriceY(doc, 0);
  doc.setFontSize(14);
  doc.text(`Pipe Linese MTO: `, 10, y);

  const width = (doc.internal.pageSize.width - 20) / 6;

  const columns: CellConfig[] = [
    { align: "center", prompt: "Tag", padding: 10, width, name: "tag" },
    { align: "center", prompt: "Line No.", padding: 10, width, name: "line" },
    {
      align: "center",
      prompt: "Structures",
      padding: 10,
      width,
      name: "structure",
    },
    { align: "center", prompt: "Size", padding: 10, width, name: "size" },
    {
      align: "center",
      prompt: "Material",
      padding: 10,
      width,
      name: "material",
    },
    {
      align: "center",
      prompt: "Length (m)",
      padding: 10,
      width,
      name: "length",
    },
    {
      align: "center",
      prompt: "Weight (kg)",
      padding: 10,
      width,
      name: "weight",
    },
  ];

  const rows: any[] = [
    ...pipeLinesMTO.map((el) => ({
      ...el,
      tag: el.tag ? el.tag : " ",
      structure: el.structure ? el.structure : " ",
      length: el.length + "",
      weight: el.weight + "",
    })),
    {
      line: "Total",
      tag: "-",
      structure: "-",
      size: "-",
      material: "-",
      length:
        roundM(pipeLinesMTO.reduce((acc, row) => acc + row.length, 0)) + "",
      weight:
        roundM(pipeLinesMTO.reduce((acc, row) => acc + row.weight, 0)) + "",
    },
  ];

  doc.table(10, incriceY(doc, y), rows, columns, {});
}

function drawPipesAccessoriesMTO(doc: jsPDF, project: Project) {
  const mto = getPipeAccessoriesSyncMTO(project.freePipes ?? []);

  if (!mto.length) return;

  const current = doc.getCurrentPageInfo();
  doc.addPage();
  doc.setPage(current.pageNumber + 1);

  const y = incriceY(doc, 0);
  doc.setFontSize(14);
  doc.text(`Pipes Accessories MTO: `, 10, y);

  const width = (doc.internal.pageSize.width - 20) / 7;

  const columns: CellConfig[] = [
    { align: "center", prompt: "Tag", padding: 10, width, name: "tag" },
    { align: "center", prompt: "Line No.", padding: 10, width, name: "line" },
    {
      align: "center",
      prompt: "Structures",
      padding: 10,
      width,
      name: "structure",
    },
    { align: "center", prompt: "Size", padding: 10, width, name: "size" },
    {
      align: "center",
      prompt: "Type",
      padding: 10,
      width,
      name: "type",
    },
    {
      align: "center",
      prompt: "Schedule/Class",
      padding: 10,
      width,
      name: "schedule",
    },
    {
      align: "center",
      prompt: "Nos",
      padding: 10,
      width,
      name: "nos",
    },
    {
      align: "center",
      prompt: "Weight (kg)",
      padding: 10,
      width,
      name: "weight",
    },
  ];

  doc.table(
    10,
    incriceY(doc, y),
    mto.map((el) => ({
      nos: el.nos ? el.nos + "" : " ",
      line: el.line,
      size: el.size,
      type: el.type,
      schedule: el.schedule ? el.schedule : el.class ? el.class + "" : " ",
      tag: el.tag ? el.tag : " ",
      structure: el.structure ? el.structure : " ",
      weight: el.weight + "",
    })),
    columns,
    {}
  );
}

function drawFlaresMTO(doc: jsPDF, project: Project) {
  const mto = getFlaresMTO(project.flares ?? []);

  if (!mto.length) return;

  const current = doc.getCurrentPageInfo();
  doc.addPage();
  doc.setPage(current.pageNumber + 1);

  const y = incriceY(doc, 0);
  doc.setFontSize(14);
  doc.text(`Flares MTO: `, 10, y);

  const width = (doc.internal.pageSize.width - 20) / 2;

  const columns: CellConfig[] = [
    { align: "center", prompt: "Model", padding: 10, width, name: "flare" },
    {
      align: "center",
      prompt: "Material",
      padding: 10,
      width,
      name: "material",
    },
    {
      align: "center",
      prompt: "Weight (kg)",
      padding: 10,
      width,
      name: "weight",
    },
  ];

  doc.table(
    10,
    incriceY(doc, y),
    [
      ...mto.map((el) => ({
        flare: el.flare,
        material: el.material ? el.material : " ",
        weight: el.weight + "",
      })),
      {
        flare: "Total",
        material: "-",
        weight: roundM(mto.reduce((acc, row) => acc + row.weight, 0)) + "",
      },
    ],
    columns,
    {}
  );
}

function drawPipeRacksMTO(doc: jsPDF, project: Project) {
  const mto = getPipeRacksMTO(
    project.models.filter((m) => m.type === "Pipe Rack") as PipeRack[]
  );

  if (!mto.length) return;

  const current = doc.getCurrentPageInfo();
  doc.addPage();
  doc.setPage(current.pageNumber + 1);

  const y = incriceY(doc, 0);
  doc.setFontSize(14);
  doc.text(`Pipe Racks MTO: `, 10, y);

  const width = (doc.internal.pageSize.width - 20) / 4;

  const columns: CellConfig[] = [
    { align: "center", prompt: "Model", padding: 10, width, name: "model" },
    {
      align: "center",
      prompt: "Designtion",
      padding: 10,
      width,
      name: "designation",
    },
    {
      align: "center",
      prompt: "Material",
      padding: 10,
      width,
      name: "material",
    },
    {
      align: "center",
      prompt: "Length (m)",
      padding: 10,
      width,
      name: "length",
    },
    {
      align: "center",
      prompt: "Weight (kg)",
      padding: 10,
      width,
      name: "weight",
    },
  ];

  doc.table(
    10,
    incriceY(doc, y),
    [
      ...mto.map((el) => ({
        model: el.model,
        designation: el.designation ? el.designation : " ",
        material: el.material ? el.material : " ",
        length: el.length + "",
        weight: el.weight + "",
      })),
      {
        model: "Total",
        designation: "-",
        material: "-",
        length: roundM(mto.reduce((acc, row) => acc + row.length, 0)) + "",
        weight: roundM(mto.reduce((acc, row) => acc + row.weight, 0)) + "",
      },
    ],
    columns,
    {}
  );
}

function drawOpenFramesMTO(doc: jsPDF, project: Project) {
  const mto = getOpenFramesMTO(
    project.models.filter((m) => m.type === "Open Frame") as TOpenFrame[]
  );

  if (!mto.length) return;

  const current = doc.getCurrentPageInfo();
  doc.addPage();
  doc.setPage(current.pageNumber + 1);

  const y = incriceY(doc, 0);
  doc.setFontSize(14);
  doc.text(`Open Frames MTO: `, 10, y);

  const width = (doc.internal.pageSize.width - 20) / 4;

  const columns: CellConfig[] = [
    { align: "center", prompt: "Model", padding: 10, width, name: "model" },
    {
      align: "center",
      prompt: "Designtion",
      padding: 10,
      width,
      name: "designation",
    },
    {
      align: "center",
      prompt: "Material",
      padding: 10,
      width,
      name: "material",
    },
    {
      align: "center",
      prompt: "Length (m)",
      padding: 10,
      width,
      name: "length",
    },
    {
      align: "center",
      prompt: "Weight (kg)",
      padding: 10,
      width,
      name: "weight",
    },
  ];

  doc.table(
    10,
    incriceY(doc, y),
    [
      ...mto.map((el) => ({
        model: el.model,
        designation: el.designation ? el.designation : " ",
        material: el.material ? el.material : " ",
        length: el.length + "",
        weight: el.weight + "",
      })),
      {
        model: "Total",
        designation: "-",
        material: "-",
        length: roundM(mto.reduce((acc, row) => acc + row.length, 0)) + "",
        weight: roundM(mto.reduce((acc, row) => acc + row.weight, 0)) + "",
      },
    ],
    columns,
    {}
  );
}

export function getCategorySubTotal(category: TDashboardBudgetCategory) {
  return category.activities.reduce((acc, act) => {
    return acc + act.amount;
  }, 0);
}

export function getCategorySubTotalHours(category:TDashboardBudgetCategory) {
  return category.activities.reduce((acc, act)=>{
    return acc + act.duration;
  }, 0)
}

function getCheckListItemTypeStr(type: EDashboardCheckType) {
  switch (type) {
    case EDashboardCheckType.FINISHED:
      return ` (finished)`;
    case EDashboardCheckType.UNFINISHED:
      return ` (not finished)`;
    default:
      return "";
  }
}

function incriceY(doc: jsPDF, currentY: number) {
  currentY += yMM;
  if (doc.internal.pageSize.height < currentY) {
    const current = doc.getCurrentPageInfo();
    doc.addPage();
    doc.setPage(current.pageNumber + 1);
    currentY = yMM;
  }
  return currentY;
}

export function getDate(date?: Date) {
  console.log("111");
  return date ? `${date.getDate()}/${date.getMonth() + 1}` : "";
}

export function getFullDate(date?: Date) {
  return date
    ? `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
    : "";
}

export function convertStrToDate(str?: string) {
  if (!str) return undefined;
  const els = str.includes("/")
    ? str.split("/")
    : str.includes(".")
    ? str.split(".")
    : str.includes("-")
    ? str.split("-")
    : str.split("_");
  const now = new Date();
  const date = new Date(
    els[2]
      ? els[2].length === 2
        ? +`20${els[2]}`
        : +els[2]
      : now.getFullYear(),
    els[1] ? +els[1] - 1 : now.getMonth(),
    els[0] ? +els[0] : now.getDate()
  );
  date.setHours(0);
  date.setMinutes(0);
  return date;
}

export function getTimeDiff(a: Date, b: Date) {
  const timeDiff = Math.abs(a.getTime() - b.getTime());
  const diff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return diff;
}

export function getEndDate(date: Date | undefined, duration: number) {
  const endDate = new Date(date ?? new Date());
  endDate.setHours(0);
  endDate.setMinutes(0);
  const diff = Math.max(Math.ceil(duration / 8) - 1, 0);
  endDate.setDate(endDate.getDate() + diff);
  return endDate;
}
