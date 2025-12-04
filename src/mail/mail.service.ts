import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { VerificationType } from 'src/verification/entities/verification-code.entity';

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

 

async sendStoreActivatedEmail(email: string, storeName: string) {
  const subject = 'Votre boutique est maintenant active !';
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 30px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <h1 style="color: #2c7a7b; text-align: center;">Félicitations </h1>
        <p style="font-size: 16px; color: #333;">Bonjour ,</p>
        <p style="font-size: 16px; color: #333;">
          Votre boutique <strong>${storeName}</strong> est maintenant <span style="color: green; font-weight: bold;">activée</span> !
        </p>
        <p style="font-size: 16px; color: #333;">
          Vous pouvez dès maintenant :
        </p>
        <ul style="font-size: 16px; color: #333;">
          <li>Ajouter vos produits </li>
          <li>Configurer vos moyens de paiement </li>
          <li>Commencer à vendre vos articles </li>
        </ul>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://dashboard.jungle.com" 
             style="background-color: #2c7a7b; color: white; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-size: 16px;">
            Accéder à mon tableau de bord
          </a>
        </div>
        <p style="margin-top: 30px; color: #777; font-size: 14px; text-align: center;">
          Merci de faire partie de la communauté <strong>Jungle </strong>.<br>
          L'équipe Jungle.
        </p>
      </div>
    </div>
  `;

  await this.mailerService.sendMail({
    to: email,
    subject,
    html,
  });
}

 async sendMail(options: { to: string; subject: string; html: string }) {
    await this.mailerService.sendMail({
      to: options.to,
      subject: options.subject,
      html: options.html,
      from: `"Jungle" <no-reply@jungle.com>`, // tu peux utiliser MAIL_FROM
    });
  }


  async sendVerificationCodeEmail(email: string, code: string, type: VerificationType) {
  const subject =
    type === VerificationType.ACCOUNT
      ? 'Vérifiez votre compte Jungle'
      : 'Code de vérification de votre boutique';

  const html = `
    <h1>Votre code de vérification</h1>
    <p>Bonjour,</p>
    <p>Voici votre code pour ${type === VerificationType.ACCOUNT ? 'confirmer votre compte' : 'activer votre boutique'} :</p>
    <h2 style="font-size: 24px; color: #2d89ef;">${code}</h2>
    <p>Ce code expirera dans 15 minutes.</p>
  `;

  await this.mailerService.sendMail({
    to: email,
    subject,
    html,
  });
}


 async sendStoreCreatedMail(
    to: string,
    storeName: string,
    verificationCode: string,
  ) {
    try {
      // Essaye d'envoyer avec le template si existant
      await this.mailerService.sendMail({
        to,
        subject: `Votre boutique "${storeName}" a été créée avec succès !`,
        template: './store-created', // fichier handlebars : store-created.hbs
        context: { storeName, verificationCode },
      });
    } catch (error) {
      console.warn('Template non trouvé, envoi du mail en texte brut.', error);

      // Fallback texte simple si le template ne fonctionne pas
      await this.mailerService.sendMail({
        to,
        subject: `Votre boutique "${storeName}" a été créée avec succès !`,
        text: `Bonjour !

Votre boutique "${storeName}" a été créée avec succès.
Votre code d'accès temporaire est : ${verificationCode}

Ce code est valable 15 minutes.
Si vous n'avez pas créé cette boutique, ignorez ce message.`,
      });
    }
  }

}
