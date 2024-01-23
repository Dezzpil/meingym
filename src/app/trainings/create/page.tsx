import TrainingForm from "@/app/trainings/create/form";

export default async function TrainingCreatePage() {
  return (
    <>
      <header className="mb-3">Добавление занятия</header>
      <TrainingForm />
    </>
  );
}
