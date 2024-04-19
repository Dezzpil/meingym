"use client";
type Props = {
  submit: any;
  handling: boolean;
  error: string | null;
  register: CallableFunction;
  btnTitle?: string;
};
export function TrainingPlannedDateForm({
  submit,
  handling,
  error,
  register,
  btnTitle,
}: Props) {
  return (
    <form className="row g-2" onSubmit={submit}>
      <div className="col-auto">
        <label className="visually-hidden">Дата занятия</label>
        <input
          type="date"
          className="form-control"
          {...register("plannedTo", { required: true, valueAsDate: true })}
        />
      </div>
      <div className="col-auto">
        <button className="btn btn-primary" disabled={handling}>
          {btnTitle ? btnTitle : "Назначить"}
        </button>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
    </form>
  );
}
