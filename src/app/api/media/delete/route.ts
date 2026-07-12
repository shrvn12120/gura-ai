
export async function POST(req: Request) {
   const body = await req.json();

    const { id } = body;

       const auth = Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY}:`).toString("base64")

const url = `https://api.imagekit.io/v1/files/${id}`;
const options = {
  method: 'DELETE',
  headers: {
    Accept: 'application/json',
    Authorization: `Basic ${auth}`
  }
};

try {
  const response = await fetch(url, options);
  const data = await response.json();

  
  return Response.json(data)

} catch (error) {
  return Response.json({message: "server error", status: 500})

}

   }