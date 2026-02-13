import { Resend } from 'resend';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const POST = async ({ request }) => {
  const data = await request.formData();
  const email = data.get("email");
  if (!email || !email.toString().includes("@")) {
    return new Response(
      JSON.stringify({
        message: "Email is required"
      }),
      { status: 400 }
    );
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { data: contactData, error } = await resend.contacts.create({
      email: email.toString(),
      firstName: "",
      lastName: "",
      unsubscribed: false,
      audienceId: "b31476cf-95de-437d-bce5-9b9f3c7e7705"
    });
    if (error) {
      console.error(error);
      return new Response(JSON.stringify({ message: error.message }), { status: 500 });
    }
    return new Response(
      JSON.stringify({
        message: "Success! You are subscribed."
      }),
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ message: e.message }), { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
