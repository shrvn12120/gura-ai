
export async function POST(req: Request) {

    const file = (await req.formData()).get("file") as File;

    if (!file) {
        console.error("No file found in the request.");
        return;
    }


     const response = await fetch("http://localhost:3000/api/media/upload-auth");

    if (!response.ok) {
        console.error("Failed to get upload auth params.");
        return;
    }

    const { token, expire, signature, publicKey } = await response.json();

    if (!token || !expire || !signature || !publicKey) {
        console.error("Invalid upload auth params received.");
        return;
    }





    const form = new FormData();
        form.append('file', file);
        form.append('fileName', file.name);
        form.append('publicKey', publicKey);
        form.append('signature', signature);
        form.append('expire', expire);
        form.append('token', token);
        form.append('useUniqueFileName', 'true');
        form.append('folder', '/silverbay/blog');

        const options = {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            Authorization: 'Basic cHJpdmF0ZV9jUDNHOVRLVjF6V0U1MnNVQUVnZC9adVZOZm89Og=='
        },
        body: form
        };



        try {
        const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', options);
        const data = await response.json();
        return Response.json(data)

        } catch (error) {
        console.error(error);
        }

}