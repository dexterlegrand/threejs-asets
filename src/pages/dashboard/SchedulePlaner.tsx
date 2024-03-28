import { Button } from "@blueprintjs/core";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentProject } from "../../components/3d-models/utils";
import { DateTimeCell } from "../../components/common/DateTimeCell";
import { InputCell } from "../../components/common/InputCell";
import { NumericCell } from "../../components/common/NumericCell";
import { SimpleSelector } from "../../components/common/SimpleSelector";
import { ApplicationState } from "../../store";
import { changeDashboardAction } from "../../store/main/actions";
import {
  TDashboardBudgetCategory,
  TDashboardBudgetCategoryActivity,
} from "../../store/main/types";
import { getDate, getEndDate, getTimeDiff } from "./dashboard-utils";
import "./dashboard_css/SchedulePlanner.css";

export default function SchedulePlaner() {
  const [category, setCategory] = useState<TDashboardBudgetCategory>();

  const project = useSelector((state: ApplicationState) =>
    getCurrentProject(state)
  );

  const dispatch = useDispatch();

  const budget = useMemo(() => {
    return project?.dashboard?.budget;
  }, [project?.dashboard?.budget]);

  const { startDate, endDate } = useMemo(() => {
    let startDate;
    let endDate;
    if (category) {
      const range = getRangeDates(category);
      startDate = range.startDate;
      endDate = range.endDate;
    } else if (budget?.categories) {
      for (const cat of budget.categories) {
        const range = getRangeDates(cat);
        if (startDate) {
          if (range.startDate && startDate > range.startDate)
            startDate = range.startDate;
        } else startDate = range.startDate;
        if (endDate) {
          if (range.endDate && endDate < range.endDate) endDate = range.endDate;
        } else endDate = range.endDate;
      }
    }
    return { startDate, endDate };
  }, [budget?.categories, category]);

  const dates = useMemo(() => {
    const dates: Date[] = [];
    if (!startDate || !endDate) return dates;
    let current = new Date(startDate);
    current.setHours(0);
    current.setMinutes(0);
    current.setSeconds(0);
    while (current <= endDate) {
      dates.push(new Date(current));
      current = new Date(current);
      current.setDate(current.getDate() + 1);
      current.setHours(0);
      current.setMinutes(0);
      current.setSeconds(0);
    }
    return dates;
  }, [startDate, endDate]);

  useEffect(() => {
    if (!category) return;
    setCategory((prev) =>
      budget?.categories?.find((cat) => cat.id === prev!.id)
    );
  }, [category, budget?.categories]);

  const handleChangeDashboardInfo = (field: string, value: any) => {
    if (!project) return;
    dispatch(
      changeDashboardAction({ ...(project.dashboard ?? {}), [field]: value })
    );
  };

  const handleChangeBudget = (field: string, val: any) => {
    handleChangeDashboardInfo(
      "budget",
      budget ? { ...budget, [field]: val } : { [field]: val }
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

  const handleChangeActivity = (
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

  return (
    <>
      <div
        className="schedule-planner-header"
        style={{ gap: 10 }}
      >
        <h2 className="no-m">Category:</h2>
        <SimpleSelector<TDashboardBudgetCategory>
          items={budget?.categories ?? []}
          selected={category}
          itemLabel={(item) => item.name}
          onSelect={setCategory}
          className={"w-200"}
        />
        {category ? (
          <Button icon={"cross"} onClick={() => setCategory(undefined)} />
        ) : null}
        <h2 className="no-m">Plan:</h2>
        <div style={{ width: 20, height: 20, backgroundColor: "yellow",borderRadius:"50%"}} />
        <h2 className="no-m">Completed:</h2>
        <div style={{ width: 20, height: 20, backgroundColor: "green",borderRadius:"50%" }} />
        <h2 className="no-m">Overplanned:</h2>
        <div style={{ width: 20, height: 20, backgroundColor: "red",borderRadius:"50%" }} />
      </div>
      {category ? (
        <div style={{ overflowX: "auto", width: "100vw" }}>
          <table className={"schedule-planner-table"} style={{ width: "100%" }}>
            <thead>
              <tr>
                <th rowSpan={2}>Activity</th>
                <th rowSpan={2}>Plan Start</th>
                <th rowSpan={2}>Plan Duration (hours)</th>
                <th rowSpan={2}>Actual Start</th>
                <th rowSpan={2}>Actual Duration (hours)</th>
                <th rowSpan={2}>Complete</th>
                <th colSpan={dates.length}>Activities durations</th>
              </tr>
              <tr>
                {dates.map((date, i) => (
                  <th className={"w-80"} key={i}>
                    {getDate(date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {category?.activities.map((act) => {
                const duration = Math.max(
                  act.duration ?? 0,
                  act.actualDuration ?? 0
                );
                return (
                  <tr key={act.id}>
                    <InputCell
                      value={act.name}
                      onChange={(val) =>
                        handleChangeActivity(category, act, "name", val)
                      }
                    />
                    <DateTimeCell
                      value={act.start}
                      onChange={(val) =>
                        handleChangeActivity(category, act, "start", val)
                      }
                    />
                    <NumericCell
                      min={0}
                      isDecimal={true}
                      accuracy={2}
                      value={act.duration}
                      onChange={(val) =>
                        handleChangeActivity(category, act, "duration", val)
                      }
                    />
                    <DateTimeCell
                      value={act.actualStart}
                      onChange={(val) =>
                        handleChangeActivity(category, act, "actualStart", val)
                      }
                    />
                    <NumericCell
                      min={0}
                      value={act.actualDuration}
                      onChange={(val) =>
                        handleChangeActivity(
                          category,
                          act,
                          "actualDuration",
                          val
                        )
                      }
                    />
                    <td>
                      <div className={"d-flex f-center"}>
                        {act.actualDuration && act.duration
                          ? `${Math.round(
                              (act.actualDuration / act.duration) * 100
                            )}%`
                          : "0%"}
                      </div>
                    </td>
                    {dates.map((date, i) => (
                      <td key={i} style={{ overflow: "hidden" }}>
                        {getBar(date, duration, act)}
                      </td>
                    ))}
                  </tr>
                );
              }) ?? null}
            </tbody>
          </table>
        </div>
      ) : (
        budget?.categories?.map((category) => (
          <React.Fragment key={category.id}>
            <div className="d-flex label-light bg-dark f-ai-center">
              <h2 className="no-m">{category.name}</h2>
            </div>
            <div style={{ overflowX: "auto", width: "100vw" }}>
              <table className={"schedule-planner-table"} style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th rowSpan={2}>Activity</th>
                    <th rowSpan={2}>Plan Start</th>
                    <th rowSpan={2}>Plan Duration (hours)</th>
                    <th rowSpan={2}>Actual Start</th>
                    <th rowSpan={2}>Actual Duration (hours)</th>
                    <th rowSpan={2}>Effort</th>
                    <th colSpan={dates.length}>Activities durations</th>
                  </tr>
                  <tr>
                    {dates.map((date, i) => (
                      <th className={"w-80"} key={i}>
                        {getDate(date)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {category?.activities.map((act) => {
                    const duration = Math.max(
                      act.duration ?? 0,
                      act.actualDuration ?? 0
                    );
                    return (
                      <tr key={act.id}>
                        <InputCell
                          value={act.name}
                          onChange={(val) =>
                            handleChangeActivity(category, act, "name", val)
                          }
                        />
                        <DateTimeCell
                          value={act.start}
                          onChange={(val) =>
                            handleChangeActivity(category, act, "start", val)
                          }
                        />
                        <NumericCell
                          min={0}
                          value={act.duration}
                          onChange={(val) =>
                            handleChangeActivity(category, act, "duration", val)
                          }
                        />
                        <DateTimeCell
                          value={act.actualStart}
                          onChange={(val) =>
                            handleChangeActivity(
                              category,
                              act,
                              "actualStart",
                              val
                            )
                          }
                        />
                        <NumericCell
                          min={0}
                          isDecimal={true}
                          accuracy={2}
                          value={act.actualDuration}
                          onChange={(val) =>
                            handleChangeActivity(
                              category,
                              act,
                              "actualDuration",
                              val
                            )
                          }
                        />
                        <td>
                          <div className={"d-flex f-center"}>
                            {act.actualDuration && act.duration
                              ? `${Math.round(
                                  (act.actualDuration / act.duration) * 100
                                )}%`
                              : "0%"}
                          </div>
                        </td>
                        {dates.map((date, i) => (
                          <td key={i} style={{ overflow: "hidden" }}>
                            {getBar(date, duration, act)}
                          </td>
                        ))}
                      </tr>
                    );
                  }) ?? null}
                </tbody>
              </table>
            </div>
          </React.Fragment>
        ))
      )}
    </>
  );
}

function getRangeDates(category: TDashboardBudgetCategory) {
  let startDate;
  let endDate;
  for (const act of category.activities) {
    if (act.start) {
      if (!startDate || startDate > act.start) startDate = act.start;
      const end = getEndDate(act.start, act.duration ?? 0);
      if (!endDate || endDate < end) endDate = end;
    }
    if (act.actualStart) {
      if (!startDate || startDate > act.actualStart)
        startDate = act.actualStart;
      const end = getEndDate(act.actualStart, act.actualDuration ?? 0);
      if (!endDate || endDate < end) endDate = end;
    }
  }
  return { startDate, endDate };
}

const workDayHours = 8;
const workDayStartHour = 8;

const addWorkDayHour = (date: Date, hoursToAdd: number) =>{
  const result = new Date(date);
  while (hoursToAdd > 0) {
    const hoursLeftInDay = workDayStartHour + workDayHours - result.getHours();
    if(hoursToAdd <= hoursLeftInDay) {
      result.setHours(result.getHours()+hoursToAdd);
      hoursToAdd=0;
    } else{
      result.setDate(result.getDate() + 1);
      result.setHours(workDayHours);
      hoursToAdd -= hoursLeftInDay;
    }
  }
  return result;
};

function getBar(
  date: Date,
  duration: number,
  act: TDashboardBudgetCategoryActivity
) {
  if (!duration) return <div className={"w-80"} />;
  let planBar = <div style={{ marginTop: 5, height: 5 }} />;
  let actualBar = <div style={{ marginTop: 5, height: 5 }} />;
  let overBar = <div style={{ marginTop: 5, height: 5 }} />;
  let start: Date | undefined, actualStart: Date | undefined;
  if (act.start) {
    start = new Date(act.start);
    start.setHours(0);
    start.setMinutes(0);
  }
  if (act.actualStart) {
    actualStart = new Date(act.actualStart);
    actualStart.setHours(0);
    actualStart.setMinutes(0);
  }
  const startedEarly = actualStart && start && actualStart < start;
  let finishedInTime = false;
  if (actualStart && start && act.actualDuration !== undefined) {
    const plannedEndTime = addWorkDayHour(start,act.duration);
    const actualEndTime = addWorkDayHour(actualStart,act.actualDuration);
    finishedInTime = actualEndTime <= plannedEndTime;
  }
  
  let notFinishedInTime = false;
  if (actualStart && start && act.actualDuration !== undefined) {
    const plannedEndTime = addWorkDayHour(start,act.duration);
    const actualEndTime = addWorkDayHour(start,act.duration);
    notFinishedInTime = actualEndTime >= plannedEndTime;
  }

  if (startedEarly && finishedInTime) {
    if (start && act.duration && start <= date && date <= getEndDate(start, act.duration)) {
      const diff = getTimeDiff(date, start);
      const dayDuration = Math.min(act.duration - diff * 8, 8);
      planBar = <div style={getStyle("yellow", dayDuration)} />;
    }

    if (actualStart && act.actualDuration && actualStart <= date && date <= getEndDate(actualStart, act.actualDuration)) {
      const actualDiff = getTimeDiff(date, actualStart);
      const actualDayDuration = Math.min(act.actualDuration - actualDiff * 8, 8);
      actualBar = <div style={getStyle("green", actualDayDuration)} />;
    }
  } else if(startedEarly && notFinishedInTime){
    if (start && act.duration && start <= date && date <= getEndDate(start, act.duration)) { 
      const diff = getTimeDiff(date, start);     
      const dayDuration = Math.min(act.duration - diff * 8, 8);    
      planBar = <div style={getStyle("yellow", dayDuration)} />;      
    } 
    if (actualStart && act.actualDuration && actualStart <= date && date <= getEndDate(actualStart, act.actualDuration)) { 
      const actualDiff = getTimeDiff(date, actualStart);     
      const actualDayDuration = Math.min(act.actualDuration - actualDiff * 8, 8); 
      if (start && act.duration) {     
        if (start <= date && date <= getEndDate(start, act.duration)) { 
        const diff = getTimeDiff(date, start);      
        const plannedDayDuration = Math.min(act.duration - diff * 8, 8); 
        if (actualDayDuration <= plannedDayDuration) {      
          actualBar = <div style={getStyle("green", actualDayDuration)} />;      
        } else {       
          actualBar = <div style={getStyle("green", plannedDayDuration)} />;      
          overBar = <div style={getStyle("red", actualDayDuration - plannedDayDuration, plannedDayDuration)} />;     
        }      
        } else {      
          overBar = <div style={getStyle("red", actualDayDuration)} />;     
        }       
        } else {     
          overBar = <div style={getStyle("red", actualDayDuration)} />;       
      }      
      }    
  } else {
    if (
      start &&
      act.duration &&
      start <= date &&
      date <= getEndDate(start, act.duration)
    ) {
      const diff = getTimeDiff(date, start);
      const duration = Math.min(act.duration - diff * 8, 8);
      planBar = <div style={getStyle("yellow", duration)} />;
    }
    if (
      actualStart &&
      act.actualDuration &&
      actualStart <= date &&
      date <= getEndDate(actualStart, act.actualDuration)
    ) {
      const actualDiff = getTimeDiff(date, actualStart);
      const actualDuration = Math.min(act.actualDuration - actualDiff * 8, 8);
      if (start && act.duration) {
        if (start <= date && date <= getEndDate(start, act.duration)) {
          const diff = getTimeDiff(date, start);
          const duration = Math.min(act.duration - diff * 8, 8);
          if (actualDuration <= duration) {
            actualBar = <div style={getStyle("green", actualDuration)} />;
          } else {
            actualBar = <div style={getStyle("green", duration)} />;
            overBar = (
              <div style={getStyle("red", actualDuration - duration, duration)} />
            );
          }
        } else overBar = <div style={getStyle("red", actualDuration)} />;
      } else overBar = <div style={getStyle("red", actualDuration)} />;
    }
  }

  return (
    <div className={"d-flex f-column w-80 h-100p"}>
      {planBar}
      {actualBar}
      {overBar}
    </div>
  );
}



function getStyle(
  color: "yellow" | "green" | "red",
  duration: number,
  offsetDuration: number = 0
): React.CSSProperties {
  return {
    backgroundColor: color,
    height: 15,
    borderRadius: 10,
    width: duration * 10,
    marginTop: 5,
    marginLeft: offsetDuration * 10,
  };
}


