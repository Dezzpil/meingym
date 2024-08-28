"use client";
import { ActionHistoryData } from "@/app/actions/[id]/history/page";
import { DateFormat } from "@/tools/dates";
import moment from "moment";

type Props = {
  items: ActionHistoryData[];
};
export function ActionHistoryDataTable({ items }: Props) {
  return (
    <table className="table table-sm table">
      <colgroup>
        <col width="25%" />
        <col width="25%" />
        <col width="25%" />
        <col width="25%" />
      </colgroup>
      <thead>
        <tr>
          <th>Выполнено</th>
          <th>liftedCountTotal</th>
          <th>liftedMean</th>
          <th>liftedSum</th>
        </tr>
      </thead>
      <tbody>
        {items.map((i) => (
          <tr key={i.completedAt.toString()}>
            <td>{moment(i.completedAt).format(`${DateFormat}`)}</td>
            <td>{i.liftedCountTotal}</td>
            <td>{i.liftedMean}</td>
            <td>{i.liftedSum}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
