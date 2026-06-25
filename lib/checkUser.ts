import { currentUser,auth } from "@clerk/nextjs/server"
import { Plan } from "@/types/plans";
import { db } from "./prisma";
import { PLANS } from "./constant";

const getCurrentPlan = async (): Promise<Plan> => {
  const { has } = await auth();

  // console.log("PRO:", has({ plan: "pro" }));
  // console.log("STARTER:", has({ plan: "starter" }));

  if (has({ plan: "pro" })) return "pro";
  if (has({ plan: "starter" })) return "starter";

  return "free";
};


export const checkUser=async()=>{
  const user=await currentUser();
  // console.log(user);
  if(!user) return null;
  try{
   const currentPlan=await getCurrentPlan();
   const existing=await db.user.findUnique({
    where:{clerkId:user.id},
   });
  //  console.log(existing);
   if(existing){
    if(existing.plan!==currentPlan){
      return await db.user.update({
        where:{clerkId:user.id},
        data:{
          plan:currentPlan,
          credits: existing.credits+PLANS[currentPlan].credits,
        }
      })
    }
    return existing;
   }
// console.log(user.id);
// console.log(user.emailAddresses[0].emailAddress);
   return await db.user.create({
    data:{
      clerkId:user.id,
      name:`${user.firstName?? ""} ${user.lastName ?? ""}`.trim(),
      email:user.emailAddresses[0].emailAddress,
      imageUrl:user.imageUrl??"",
      credits:PLANS.free.credits,
      plan:"free",
    },
   });

  }catch (error) {
  console.error("FULL ERROR:", error);

  if (error instanceof Error) {
    console.error(error.message);
  }

  return null;

}
}