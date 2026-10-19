// Envoi d'email via un serveur SMTP générique (n'importe quel hébergeur -
// OVH, Gmail, un serveur mutualisé, etc.), pour les admins qui préfèrent
// ne pas dépendre de Resend. Utilise nodemailer (via npm: sur Deno), le
// même package que l'exemple officiel Supabase pour l'envoi SMTP en Edge
// Function : https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions/send-email-smtp
import nodemailer from "npm:nodemailer@^7";

export interface SmtpCredentials {
  host: string;
  port: string;
  username: string;
  password: string;
  from: string;
}

export async function sendEmailViaSmtp(
  credentials: SmtpCredentials,
  params: {
    to: string[];
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    attachments?: Array<{ filename: string; content: string }>;
  }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const port = Number(credentials.port) || 587;

    const transport = nodemailer.createTransport({
      host: credentials.host,
      port,
      // Port 465 = TLS implicite dès la connexion. Tout autre port (587,
      // 25, 2525...) utilise STARTTLS, géré automatiquement par nodemailer
      // quand secure=false et que le serveur l'annonce.
      secure: port === 465,
      auth: {
        user: credentials.username,
        pass: credentials.password,
      },
    });

    await new Promise<void>((resolve, reject) => {
      transport.sendMail(
        {
          from: credentials.from,
          to: params.to.join(", "),
          subject: params.subject,
          html: params.html,
          text: params.text,
          replyTo: params.replyTo,
          attachments: params.attachments?.map((a) => ({
            filename: a.filename,
            content: a.content,
            encoding: "base64",
          })),
        },
        (error: Error | null) => {
          if (error) reject(error);
          else resolve();
        }
      );
    });

    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Erreur SMTP inconnue" };
  }
}
