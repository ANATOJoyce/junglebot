import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationCode(email: string, code: string) {
    try {
      const info = await this.mailerService.sendMail({
        to: email,
        subject: 'Votre code de vérification',
        text: `Voici votre code de vérification : ${code}`,
        html: `
          <html>
            <body>
              <h1>Bonjour !</h1>
              <p>Voici votre code de vérification :</p>
              <p style="font-size: 24px; font-weight: bold;">${code}</p>
              <p>Merci de votre inscription sur notre site. Si vous n'avez pas demandé ce code, veuillez ignorer cet email.</p>
            </body>
          </html>
        `,
      });

      console.log('Email envoyé :', info.messageId);
    } catch (error) {
      console.error('Erreur lors de l’envoi de l’email :', error);
    }
  }
}
