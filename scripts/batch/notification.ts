import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.NOTIFICATION_EMAIL,
    pass: process.env.NOTIFICATION_PASSWORD
  }
});

export async function sendErrorNotification(title: string, error: any) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  await transporter.sendMail({
    from: process.env.NOTIFICATION_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: `[XRANKING] Error: ${title}`,
    text: `
Error occurred in XRANKING:

Title: ${title}
Time: ${new Date().toISOString()}
Error: ${errorMessage}
Stack: ${error instanceof Error ? error.stack : 'No stack trace'}
    `.trim()
  });
}
