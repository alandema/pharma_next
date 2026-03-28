import { Resend } from 'resend';
import * as dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

(async function () {
  const { data, error } = await resend.emails.send({
    from: 'Amma Fármacia <prescricaoamma@resend.dev>',
    to: ['alann.maman@gmail.com'],
    subject: 'Hello World',
    html: '<strong>It works!</strong>',
  });

  if (error) {
    return console.error({ error });
  }

  console.log({ data });
})();