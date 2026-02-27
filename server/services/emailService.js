const nodemailer = require('nodemailer');

// Create reusable transporter using Gmail SMTP + App Password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send a temporary password email to a newly created user.
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient's name
 * @param {string} tempPassword - The plain-text temporary password to include in the email
 */
const sendTemporaryPasswordEmail = async (to, name, tempPassword) => {
    const mailOptions = {
        from: `"DOKA Admin" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Your DOKA Admin Account Has Been Created',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <style>
                body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Arial, sans-serif; }
                .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
                .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 36px 40px; text-align: center; }
                .header h1 { margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
                .header p { margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 14px; }
                .body { padding: 36px 40px; }
                .greeting { font-size: 16px; color: #111827; font-weight: 600; margin: 0 0 12px; }
                .intro { font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0 0 28px; }
                .password-box { background: #f8f5ff; border: 1.5px dashed #a855f7; border-radius: 12px; padding: 20px 24px; text-align: center; margin: 0 0 28px; }
                .password-label { font-size: 11px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px; }
                .password-value { font-size: 26px; font-weight: 700; color: #111827; letter-spacing: 3px; font-family: 'Courier New', monospace; margin: 0; }
                .warning { background: #fff7ed; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 0 0 28px; }
                .warning p { margin: 0; font-size: 13px; color: #92400e; line-height: 1.5; }
                .warning strong { color: #78350f; }
                .steps { margin: 0 0 28px; }
                .steps p { font-size: 13px; color: #374151; font-weight: 600; margin: 0 0 10px; }
                .steps ol { margin: 0; padding: 0 0 0 20px; }
                .steps ol li { font-size: 13px; color: #6b7280; line-height: 1.8; }
                .footer { background: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #f3f4f6; }
                .footer p { margin: 0; font-size: 12px; color: #9ca3af; }
            </style>
        </head>
        <body>
            <div class="wrapper">
                <div class="header">
                    <h1>🎂 DOKA Admin</h1>
                    <p>Your account is ready</p>
                </div>
                <div class="body">
                    <p class="greeting">Hello, ${name}!</p>
                    <p class="intro">
                        Your admin account has been created on the DOKA platform. Below is your temporary password — please use it to log in for the first time.
                    </p>
                    <div class="password-box">
                        <p class="password-label">Temporary Password</p>
                        <p class="password-value">${tempPassword}</p>
                    </div>
                    <div class="warning">
                        <p><strong>⚠ Important:</strong> This is a one-time temporary password. Please change it immediately after your first login to keep your account secure.</p>
                    </div>
                    <div class="steps">
                        <p>Getting started:</p>
                        <ol>
                            <li>Go to the DOKA Admin login page</li>
                            <li>Enter your email: <strong>${to}</strong></li>
                            <li>Enter the temporary password above</li>
                            <li>Change your password from your profile settings</li>
                        </ol>
                    </div>
                </div>
                <div class="footer">
                    <p>This email was sent by DOKA Admin System. Do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Temporary password email sent to ${to} | Message ID: ${info.messageId}`);
        return { success: true };
    } catch (error) {
        console.error(`❌ Failed to send email to ${to}:`, error.message);
        throw new Error(`Email delivery failed: ${error.message}`);
    }
};

module.exports = { sendTemporaryPasswordEmail };
