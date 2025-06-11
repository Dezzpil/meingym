select te."trainingId", tee.*
from "TrainingExerciseExecution" tee
         left join "TrainingExercise" te on tee."exerciseId" = te.id
         left join "Training" t on te."trainingId" = t.id
where tee."isPassed"=false and tee."executedAt" is not null and t."isCircuit"=true
order by tee."executedAt" desc;