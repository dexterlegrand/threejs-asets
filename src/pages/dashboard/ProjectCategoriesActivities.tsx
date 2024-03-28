import React from "react";
import { Button } from "@blueprintjs/core";
import { getNextId, roundM } from "../../components/3d-models/utils";
import { InputCell } from "../../components/common/InputCell";
import { NumericCell } from "../../components/common/NumericCell";
import {
  TDashboardBudget,
  TDashboardBudgetCategory,
  TDashboardBudgetCategoryActivity,
} from "../../store/main/types";
import { getCategorySubTotal, getCategorySubTotalHours } from "./dashboard-utils";
import "./dashboard_css/ProjectCategoriesActivities.css"

type Props = {
  budget?: TDashboardBudget;
  onChange: (budget: TDashboardBudget) => any;
};

export default function ProjectCategoriesActivities({
  budget,
  onChange,
}: Props) {
  const handleChangeBudget = (field: string, val: any) => {
    onChange(budget ? { ...budget, [field]: val } : { [field]: val });
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

  const handleAdd = (category: TDashboardBudgetCategory) => {
    const id = getNextId(category.activities);
    const activity: TDashboardBudgetCategoryActivity = {
      id,
      name: `New Activity ${id}`,
      amount: 0,
      duration: 0,
      comment: "---",
    };
    handeChangeCategory(category, "activities", [
      ...category.activities,
      activity,
    ]);
  };

  const handleChange = (
    category: TDashboardBudgetCategory,
    act: TDashboardBudgetCategoryActivity,
    field: string,
    val: any
  ) => {
    handeChangeCategory(
      category,
      "activities",
      category.activities.map((activity) =>
        activity.id === act.id ? { ...act, [field]: val } : activity
      )
    );
  };

  const handleDelete = (
    category: TDashboardBudgetCategory,
    act: TDashboardBudgetCategoryActivity
  ) => {
    handeChangeCategory(
      category,
      "activities",
      category.activities.filter((activity) => activity.id !== act.id)
    );
  };

  return (
    <div className={"budget-container"}>
        <table className={"MTO-table"}>
          <thead>
              <th>Category</th>
              <th>Man Hours</th>
              <th>Amount ($)</th>
              <th>Comments</th>
          </thead>
          <tbody>
            {budget?.categories?.map((cat) => (
              <React.Fragment key={cat.id}>
                <tr>
                  <td className={"category-name"}>{cat.name}</td>
                  <td className={"category-value"}>
                    {roundM(getCategorySubTotalHours(cat), 2)} Hours
                  </td>
                  <td className={"category-value"}>
                    ${roundM(getCategorySubTotal(cat), 2)}
                  </td>
                  <td className={"category-comment"} colSpan={2} />
                </tr>
                {cat.activities.map((act) => (
                  <tr key={act.id}>
                    <InputCell
                      value={act.name}
                      onChange={(val) => handleChange(cat, act, "name", val)}
                    />
                    <NumericCell
                      min= {0}
                      isDecimal={true}
                      value={act.duration}
                      onChange={(val)=>
                        handleChange(cat,act,"duration", roundM(val,2))
                      }
                    />
                    <NumericCell
                      min={0}
                      isDecimal={true}
                      value={act.amount}
                      onChange={(val) =>
                        handleChange(cat, act, "amount", roundM(val, 2))
                      }
                    />
                    <InputCell
                      value={act.comment}
                      onChange={(val) => handleChange(cat, act, "comment", val)}
                    />
                    <td style={{ width: "0%" }}>
                      <Button
                        minimal
                        icon={"delete"}
                        intent={"danger"}
                        onClick={() => handleDelete(cat, act)}
                      />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={4}>
                    <Button
                      outlined
                      className={"button-primary-b1l"}
                      icon={"plus"}
                      onClick={() => handleAdd(cat)}
                    />
                  </td>
                </tr>
              </React.Fragment>
            )) ?? null}
          </tbody>
        </table>
    </div>
  );
}
