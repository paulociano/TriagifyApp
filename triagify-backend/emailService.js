// Ficheiro: backend/emailService.js

const nodemailer = require('nodemailer');

let transporter;

async function setupEmailService() {
  try {
    let testAccount = await nodemailer.createTestAccount();
    console.log('Conta de email de teste criada no Ethereal!');
    console.log('------------------------------------------');
    console.log(`Username: ${testAccount.user}`);
    console.log(`Password: ${testAccount.pass}`);
    console.log('Para ver os emails, aceda a https://ethereal.email/ e faça login com as credenciais acima.');
    console.log('------------------------------------------');

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (error) {
    console.error("Falha ao configurar o serviço de email de teste:", error);
  }
}

async function sendNewScreeningAvailableNotification(patientEmail, patientName, doctorName) {
  if (!transporter) return;
  const patientDashboardUrl = `http://localhost:3000/patient-dashboard`;
  const mailOptions = {
    from: '"Triagify" <noreply@triagify.com>',
    to: patientEmail,
    subject: `Nova Triagem Pré-Consulta Disponível`,
    html: `<p>Olá ${patientName},</p><p>O Dr(a). <strong>${doctorName}</strong> solicitou o preenchimento de um formulário de pré-consulta.</p><p>Pode aceder ao seu portal clicando no botão abaixo:</p><a href="${patientDashboardUrl}" style="background-color: #02bca5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Aceder ao Portal</a>`,
  };
  try {
    let info = await transporter.sendMail(mailOptions);
    console.log(`Email de notificação de nova triagem enviado para ${patientEmail}. URL: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (error) {
    console.error(`Falha ao enviar email para ${patientEmail}:`, error);
  }
}

// --- NOVA FUNÇÃO PARA ENVIAR O EMAIL DE REDEFINIÇÃO DE SENHA ---
async function sendPasswordResetEmail(userEmail, token) {
  if (!transporter) {
    console.error('O serviço de email não está configurado.');
    return;
  }

  const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

  const mailOptions = {
    from: '"Triagify" <noreply@triagify.com>',
    to: userEmail,
    subject: 'Redefinição de Senha - Triagify',
    text: `Você está a receber este email porque solicitou a redefinição da sua senha.\n\nPor favor, clique no seguinte link, ou cole-o no seu navegador para completar o processo:\n\n${resetUrl}\n\nSe não solicitou isto, por favor, ignore este email e a sua senha permanecerá inalterada.\n`,
    html: `
      <p>Você está a receber este email porque solicitou a redefinição da sua senha.</p>
      <p>Por favor, clique no botão abaixo para criar uma nova senha:</p>
      <a href="${resetUrl}" style="background-color: #02bca5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
      <p>Se não solicitou isto, por favor, ignore este email e a sua senha permanecerá inalterada.</p>
    `,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log(`Email de redefinição de senha enviado para ${userEmail}.`);
    console.log(`URL de pré-visualização do email: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (error) {
    console.error(`Falha ao enviar email de redefinição para ${userEmail}:`, error);
  }
}

module.exports = {
  setupEmailService,
  sendNewScreeningAvailableNotification,
  sendPasswordResetEmail, // Exporta a nova função
};
