import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWorkout } from "@/lib/workouts/engine";
import type { Exercise, WorkoutInput } from "@/lib/workouts/types";

export async function POST() {
  const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const [{data:profile},{data:preferences},{data:contra},{data:exercises}]=await Promise.all([
    supabase.from("profiles").select("experience_level").eq("id",user.id).maybeSingle(),supabase.from("training_preferences").select("goal,equipment,workout_location,days_per_week,session_duration_minutes").eq("user_id",user.id).maybeSingle(),supabase.from("contraindications").select("body_part,severity").eq("user_id",user.id),supabase.from("exercises").select("id,name,primary_muscle,equipment,body_parts_loaded,difficulty,movement_pattern,is_compound,estimated_minutes,instructions")]);
  if(!profile?.experience_level||!preferences)return NextResponse.json({error:"Complete onboarding first"},{status:400});
  const input:WorkoutInput={goal:preferences.goal as WorkoutInput["goal"],experience:profile.experience_level as WorkoutInput["experience"],equipment:preferences.equipment,workout_location:preferences.workout_location as WorkoutInput["workout_location"],days_per_week:preferences.days_per_week,session_duration_minutes:preferences.session_duration_minutes,contraindications:contra??[]};
  let plan;try{plan=generateWorkout(input,(exercises??[]) as Exercise[]);}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Could not generate plan"},{status:422});}
  const payload=plan.days.map(d=>({...d,exercises:d.exercises.map(x=>({exercise_id:x.exercise.id,name:x.exercise.name,instructions:x.exercise.instructions,sets:x.sets,rep_min:x.rep_min,rep_max:x.rep_max,rest_seconds:x.rest_seconds,order_index:x.order_index}))}));
  const {data:planId,error}=await supabase.rpc("persist_generated_workout_plan",{p_generator_version:plan.generator_version,p_days:payload});if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({planId,plan},{status:201});
}
