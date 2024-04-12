import TrainingForm from "@/app/trainings/create/form";

export default async function TrainingCreatePage() {
  return (
    <>
      <header className="mb-3">
        <h3>Укажите предстоящую дату тренировки</h3>
      </header>
      <TrainingForm />
    </>
  );
}
