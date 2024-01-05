import MusclesGroupsCreateForm from "@/app/musclesgroups/create/form";

export default async function MusclesGroupsCreatePage() {
  return (
    <>
      <header className="mb-3">Добавление мышечной группы</header>
      <MusclesGroupsCreateForm />
    </>
  );
}
