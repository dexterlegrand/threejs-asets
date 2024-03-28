import { Button } from "@blueprintjs/core";
import React, { useMemo, useRef, useState } from "react";
import { getNextId, roundM } from "../../components/3d-models/utils";
import { InputCell } from "../../components/common/InputCell";
import { NumericInputDlg } from "../../components/common/NumericInputDlg";
import {
  TDashboardBudget,
  TDashboardBudgetCategory,
} from "../../store/main/types";
import { Doughnut } from "react-chartjs-2";
import { getCategorySubTotal } from "./dashboard-utils";
import "./dashboard_css/ProjectBudget.css"

type Props = {
  budget?: TDashboardBudget;
  onChange: (budget: TDashboardBudget) => any;
};

export default function ProjectBudget({ budget, onChange }: Props) {
  const [dlg, setDlg] = useState<JSX.Element>();

  const expenseTotal = useMemo(() => {
    return (
      budget?.categories?.reduce((acc, cat) => {
        return acc + getCategorySubTotal(cat);
      }, 0) ?? 0
    );
  }, [budget?.categories]);

  const handleChangeBudget = (field: string, val: any) => {
    onChange(budget ? { ...budget, [field]: val } : { [field]: val });
  };

  const handleAddCategory = () => {
    const id = getNextId(budget?.categories);
    const category: TDashboardBudgetCategory = {
      id,
      name: `New Budget Category ${id}`,
      activities: [],
    };
    handleChangeBudget(
      "categories",
      budget?.categories ? [...budget.categories, category] : [category]
    );
  };

  const handeChangeCategory = (
    category: TDashboardBudgetCategory,
    field: string,
    val: any
  ) => {
    handleChangeBudget(
      "categories",
      budget?.categories?.map((cat) =>
        cat.id === category.id ? { ...category, [field]: val } : cat
      )
    );
  };

  const handleDeleteCategory = (category: TDashboardBudgetCategory) => {
    handleChangeBudget(
      "categories",
      budget?.categories?.filter((cat) => cat.id !== category.id)
    );
  };

  const containerRef = useRef<HTMLDivElement>(null);

  const generateGradientColor = () => {
    const randomBrightColor = () => Math.round(Math.random() * 128 + 127); // This ensures colors are on the brighter side.
    const color = `rgb(${randomBrightColor()},${randomBrightColor()},${randomBrightColor()})`;
    
    return color;
}


  return (
    <div className={"budget-dashboard"}>
      {dlg}
      <div className={"budget-wrapper"}>
        <div ref={containerRef} className={"budget-content"}>
          <div className={"budget-content-inner"}>
            <table className={"budget-table"}>
              <thead>
                <tr>
                  <th className={"budget-table-header"}>Category</th>
                  <th className={"budget-table-header"}>% of budget</th>
                  <th className={"budget-table-header"}>Subtotals ($)</th>
                  <th className={"budget-table-header"}></th>
                </tr>
              </thead>
              <tbody>
                {budget?.categories?.map((cat) => {
                  const subTotal = getCategorySubTotal(cat);
                  return (
                    <tr key={cat.id}>
                      <InputCell
                        value={cat.name}
                        onChange={(val) =>
                          handeChangeCategory(cat, "name", val)
                        }
                      />
                      <td>
                        <div className={"d-flex f-center"}>
                          {budget.total
                            ? roundM((subTotal / budget.total) * 100, 100)
                            : 0}
                        </div>
                      </td>
                      <td>
                        <div className={"d-flex f-center"}>{subTotal}</div>
                      </td>
                      <td>
                        <Button
                          minimal
                          icon={"delete"}
                          intent={"danger"}
                          onClick={() => handleDeleteCategory(cat)}
                        />
                      </td>
                    </tr>
                  );
                }) ?? null}
              </tbody>
            </table>
            <Button
              minimal
              className="button-primary-b1l"
              icon={"plus"}
              onClick={handleAddCategory}
              style={{ backgroundColor: "#4b4b4b" }}
            />
          </div>
        </div>
        <div className={"budget-summary"}>
          <div className={"d-flex f-center info"}>BUDGET TOTAL</div>
          <div
            className={"d-flex f-center p-5"}
            onClick={() =>
              setDlg(
                <NumericInputDlg
                  title={"Budget Total"}
                  isDecimal={true}
                  min={0}
                  defaultValue={budget?.total ?? 0}
                  position={"center"}
                  onSubmit={(val) => {
                    handleChangeBudget("total", roundM(val, 100));
                    setDlg(undefined);
                  }}
                  onClose={() => setDlg(undefined)}
                />
              )
            }
          >
            ${roundM(budget?.total ?? 0, 100)}
          </div>
          <div className={"d-flex f-center info"}>EXPENSE TOTAL</div>
          <div className={"d-flex f-center p-5"}>
            ${roundM(expenseTotal, 100)}
          </div>
          <div className={"d-flex f-center info"}>DIFFERENCE</div>
          <div className={"d-flex f-center p-5"}>
            ${roundM((budget?.total ?? 0) - expenseTotal, 100)}
          </div>
        </div>
        <div
        className={"budget-piechart"}
        >
        <Doughnut
          data={{
            labels: budget?.categories?.map((cat) => cat.name) ?? [],
            datasets: [
              {
                data:
                  budget?.categories?.map((cat) => getCategorySubTotal(cat)) ?? [],
                backgroundColor:
                  budget?.categories?.map(
                    () => generateGradientColor()
                  ) ?? [],
                hoverBackgroundColor: 
                  budget?.categories?.map(
                    () => generateGradientColor()
                  ) ?? [],
                borderColor: "black",
                borderWidth: 1,
              },
            ],
          }}
          options={{
            legend: {
                position: "right",
                labels: {
                    boxWidth: 15,
                    padding: 10,
                    fontStyle: "bold"
                }
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            cutout: '50%',
        }}        
        />
      </div>
      </div>
      
    </div>
  );
}
