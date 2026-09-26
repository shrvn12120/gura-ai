import { routeWithJev } from "@/lib/jevUtils";
import { NextRequest } from "next/server";



function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}



export async function POST(req: NextRequest) {
     const {message} = await req.json()


const response = await routeWithJev(message)


  return jsonResponse(response)

     
}