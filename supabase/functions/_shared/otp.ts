// Utilitaires partagés pour le système OTP (send-otp / verify-otp).

export function generateOtpCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const code = (array[0] % 1000000).toString().padStart(6, "0");
  return code;
}

export async function hashOtpCode(code: string, destination: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${destination}:${code}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function otpEmailHtml(code: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 480px; margin: 0 auto; padding: 20px; text-align: center; }
        .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .footer { color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Votre code de connexion</h2>
        <p>Utilisez ce code pour vous connecter à votre compte B-Reserve :</p>
        <div class="code">${code}</div>
        <p>Ce code expire dans 10 minutes. Ne le partagez avec personne.</p>
        <p class="footer">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      </div>
    </body>
    </html>
  `;
}
