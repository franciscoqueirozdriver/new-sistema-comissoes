import nodemailer from 'nodemailer';

export async function sendInvitationEmail({ to, name }) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const fromName = process.env.EMAIL_SENDER_NAME || 'Sistema de Comissões';
  const fromAddress = process.env.EMAIL_SENDER_ADDRESS || process.env.GMAIL_USER;

  const mailOptions = {
    from: `"${fromName}" <${fromAddress}>`,
    to,
    subject: 'Convite para acesso ao Sistema de Gestão de Comissões',
    text: `Olá, ${name}.
\nEspero que esteja tudo bem.
\nEstou entrando em contato para lhe dar acesso ao nosso novo Sistema de Gestão de Comissões. Através dele, você poderá cadastrar e acompanhar suas oportunidades e pagamentos de forma simples e organizada.
\nPara ativar seu acesso, por favor, siga os passos abaixo:
\nAcesse o link do sistema: https://minhascomissoesweb.vercel.app
\nFaça o login: Na tela inicial, clique no botão "Login com Google" e utilize a sua conta de e-mail: ${to}. (É muito importante que você use este e-mail específico, pois é o que foi liberado no sistema).
\nApós o primeiro login, seu acesso estará ativo e você já poderá começar a cadastrar suas oportunidades.
\nQualquer dúvida, estou à sua disposição.
\nAbraço,`,
  };

  await transporter.sendMail(mailOptions);
}
