// lib/emailTemplate.js

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://kjexchange.com';
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP || '2348160678317';

// ===== BASE STYLES (Reusable) =====
const baseStyles = {
  container: 'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #0B0815; border-radius: 12px; border: 1px solid #2D2444;',
  header: 'text-align: center; margin-bottom: 30px;',
  logo: 'color: #4E1F91; margin: 0;',
  logoOrange: 'color: #FF7300;',
  subtext: 'color: #7A728F; margin: 0;',
  card: 'background: #171021; padding: 20px; border-radius: 8px;',
  successBadge: 'border-left: 4px solid #2ecc71;',
  errorBadge: 'border-left: 4px solid #e74c3c;',
  warningBadge: 'border-left: 4px solid #f39c12;',
  titleSuccess: 'color: #2ecc71; margin: 0;',
  titleError: 'color: #e74c3c; margin: 0;',
  titleWarning: 'color: #f39c12; margin: 0;',
  bodyText: 'color: #F0EDF5; font-size: 16px; line-height: 1.6;',
  mutedText: 'color: #B8B0C9; font-size: 16px; line-height: 1.6;',
  highlight: 'color: #FF7300;',
  amountBox: 'background: #0B0815; padding: 15px 20px; border-radius: 8px; text-align: center; margin: 20px 0;',
  amountLabel: 'color: #7A728F; font-size: 14px; margin: 0;',
  amountValue: 'color: #2ecc71; font-size: 32px; font-weight: bold; margin: 5px 0;',
  divider: 'border: 1px solid #2D2444; margin: 20px 0;',
  footer: 'color: #7A728F; font-size: 12px; text-align: center;',
  button: `display: inline-block; background: linear-gradient(135deg, #FF7300, #FF9A44); color: #FFFFFF; text-decoration: none; padding: 14px 40px; border-radius: 12px; font-weight: 600;`,
  buttonContainer: 'text-align: center; margin: 24px 0;',
};

// ===== TEMPLATES =====
export const emailTemplates = {

  // ===== ORDER VERIFIED =====
  orderCompleted: (data) => ({
    subject: `✅ Order Completed — ${data.asset}`,
    html: `
      <div style="${baseStyles.container}">
        <div style="${baseStyles.header}">
          <h1 style="${baseStyles.logo}">KJ <span style="${baseStyles.logoOrange}">Exchange</span></h1>
          <p style="${baseStyles.subtext}">Trade Smart. Trade Secure.</p>
        </div>
        <div style="${baseStyles.card} ${baseStyles.successBadge}">
          <h2 style="${baseStyles.titleSuccess}">✅ Order Completed</h2>
        </div>
        <p style="${baseStyles.bodyText}">Hello ${data.userName || 'there'},</p>
        <p style="${baseStyles.mutedText}">
          Your order <strong style="color: #F0EDF5;">#${data.orderId?.slice(0,8) || 'N/A'}</strong> for 
          <strong style="${baseStyles.highlight}">${data.asset || 'gift card'}</strong> has been completed!
        </p>
        <div style="${baseStyles.amountBox}">
          <p style="${baseStyles.amountLabel}">Amount Credited</p>
          <p style="${baseStyles.amountValue}">₦${(data.payout || 0).toLocaleString()}</p>
        </div>
        <p style="${baseStyles.mutedText}">
          The funds have been added to your wallet. You can view your balance in the Wallet section.
        </p>
        <hr style="${baseStyles.divider}" />
        <p style="${baseStyles.footer}">
          Need help? Contact us on WhatsApp: +${WHATSAPP_NUMBER}
        </p>
      </div>
    `,
  }),

  // ===== ORDER REJECTED =====
  orderRejected: (data) => ({
    subject: `❌ Order Rejected — ${data.asset}`,
    html: `
      <div style="${baseStyles.container}">
        <div style="${baseStyles.header}">
          <h1 style="${baseStyles.logo}">KJ <span style="${baseStyles.logoOrange}">Exchange</span></h1>
          <p style="${baseStyles.subtext}">Trade Smart. Trade Secure.</p>
        </div>
        <div style="${baseStyles.card} ${baseStyles.errorBadge}">
          <h2 style="${baseStyles.titleError}">❌ Order Rejected</h2>
        </div>
        <p style="${baseStyles.bodyText}">Hello ${data.userName || 'there'},</p>
        <p style="${baseStyles.mutedText}">
          Your order <strong style="color: #F0EDF5;">#${data.orderId?.slice(0,8) || 'N/A'}</strong> for 
          <strong style="${baseStyles.highlight}">${data.asset || 'gift card'}</strong> has been rejected.
        </p>
        <div style="${baseStyles.amountBox}">
          <p style="${baseStyles.amountLabel}">Funds Refunded</p>
          <p style="${baseStyles.amountValue}">₦${(data.amount || 0).toLocaleString()}</p>
        </div>
        <p style="${baseStyles.mutedText}">
          If you believe this was a mistake, please contact our support team.
        </p>
        <hr style="${baseStyles.divider}" />
        <p style="${baseStyles.footer}">
          Need help? Contact us on WhatsApp: +${WHATSAPP_NUMBER}
        </p>
      </div>
    `,
  }),

  // ===== TOP-UP VERIFIED =====
  topupVerified: (data) => ({
    subject: `💰 Top-Up Verified — ₦${(data.amount || 0).toLocaleString()}`,
    html: `
      <div style="${baseStyles.container}">
        <div style="${baseStyles.header}">
          <h1 style="${baseStyles.logo}">KJ <span style="${baseStyles.logoOrange}">Exchange</span></h1>
          <p style="${baseStyles.subtext}">Trade Smart. Trade Secure.</p>
        </div>
        <div style="${baseStyles.card} ${baseStyles.successBadge}">
          <h2 style="${baseStyles.titleSuccess}">💰 Top-Up Verified</h2>
        </div>
        <p style="${baseStyles.bodyText}">Hello ${data.userName || 'there'},</p>
        <p style="${baseStyles.mutedText}">
          Your top-up of <strong style="color: #2ecc71;">₦${(data.amount || 0).toLocaleString()}</strong> has been verified and credited to your wallet.
        </p>
        <div style="${baseStyles.amountBox}">
          <p style="${baseStyles.amountLabel}">New Balance</p>
          <p style="${baseStyles.amountValue}">₦${(data.newBalance || data.amount || 0).toLocaleString()}</p>
        </div>
        <hr style="${baseStyles.divider}" />
        <p style="${baseStyles.footer}">
          Need help? Contact us on WhatsApp: +${WHATSAPP_NUMBER}
        </p>
      </div>
    `,
  }),

  // ===== TOP-UP REJECTED =====
  topupRejected: (data) => ({
    subject: `❌ Top-Up Rejected`,
    html: `
      <div style="${baseStyles.container}">
        <div style="${baseStyles.header}">
          <h1 style="${baseStyles.logo}">KJ <span style="${baseStyles.logoOrange}">Exchange</span></h1>
          <p style="${baseStyles.subtext}">Trade Smart. Trade Secure.</p>
        </div>
        <div style="${baseStyles.card} ${baseStyles.errorBadge}">
          <h2 style="${baseStyles.titleError}">❌ Top-Up Rejected</h2>
        </div>
        <p style="${baseStyles.bodyText}">Hello ${data.userName || 'there'},</p>
        <p style="${baseStyles.mutedText}">
          Your top-up request has been rejected.
        </p>
        <p style="${baseStyles.mutedText}">
          If you believe this was a mistake, please contact our support team.
        </p>
        <hr style="${baseStyles.divider}" />
        <p style="${baseStyles.footer}">
          Need help? Contact us on WhatsApp: +${WHATSAPP_NUMBER}
        </p>
      </div>
    `,
  }),

  // ===== WITHDRAWAL COMPLETED =====
  withdrawalCompleted: (data) => ({
    subject: `💸 Withdrawal Completed — ₦${(data.amount || 0).toLocaleString()}`,
    html: `
      <div style="${baseStyles.container}">
        <div style="${baseStyles.header}">
          <h1 style="${baseStyles.logo}">KJ <span style="${baseStyles.logoOrange}">Exchange</span></h1>
          <p style="${baseStyles.subtext}">Trade Smart. Trade Secure.</p>
        </div>
        <div style="${baseStyles.card} ${baseStyles.successBadge}">
          <h2 style="${baseStyles.titleSuccess}">💸 Withdrawal Completed</h2>
        </div>
        <p style="${baseStyles.bodyText}">Hello ${data.userName || 'there'},</p>
        <p style="${baseStyles.mutedText}">
          Your withdrawal of <strong style="color: #2ecc71;">₦${(data.amount || 0).toLocaleString()}</strong> has been processed.
        </p>
        <div style="${baseStyles.amountBox}">
          <p style="${baseStyles.amountLabel}">Amount Sent</p>
          <p style="${baseStyles.amountValue}">₦${(data.amount || 0).toLocaleString()}</p>
        </div>
        <p style="${baseStyles.mutedText}">
          Funds have been sent to your bank account (${data.bankName || 'Your bank'}). Check your bank statement.
        </p>
        <hr style="${baseStyles.divider}" />
        <p style="${baseStyles.footer}">
          Need help? Contact us on WhatsApp: +${WHATSAPP_NUMBER}
        </p>
      </div>
    `,
  }),

  // ===== WITHDRAWAL REJECTED =====
  withdrawalRejected: (data) => ({
    subject: `❌ Withdrawal Rejected — ₦${(data.amount || 0).toLocaleString()}`,
    html: `
      <div style="${baseStyles.container}">
        <div style="${baseStyles.header}">
          <h1 style="${baseStyles.logo}">KJ <span style="${baseStyles.logoOrange}">Exchange</span></h1>
          <p style="${baseStyles.subtext}">Trade Smart. Trade Secure.</p>
        </div>
        <div style="${baseStyles.card} ${baseStyles.errorBadge}">
          <h2 style="${baseStyles.titleError}">❌ Withdrawal Rejected</h2>
        </div>
        <p style="${baseStyles.bodyText}">Hello ${data.userName || 'there'},</p>
        <p style="${baseStyles.mutedText}">
          Your withdrawal of <strong style="color: #e74c3c;">₦${(data.amount || 0).toLocaleString()}</strong> has been rejected.
        </p>
        <div style="${baseStyles.amountBox}">
          <p style="${baseStyles.amountLabel}">Funds Refunded</p>
          <p style="${baseStyles.amountValue}">₦${(data.amount || 0).toLocaleString()}</p>
        </div>
        <p style="${baseStyles.mutedText}">
          If you believe this was a mistake, please contact our support team.
        </p>
        <hr style="${baseStyles.divider}" />
        <p style="${baseStyles.footer}">
          Need help? Contact us on WhatsApp: +${WHATSAPP_NUMBER}
        </p>
      </div>
    `,
  }),

  // ===== DEPOSIT CONFIRMED =====
  depositConfirmed: (data) => ({
    subject: `💰 Deposit Confirmed — ${data.amount} ${data.coin || 'crypto'}`,
    html: `
      <div style="${baseStyles.container}">
        <div style="${baseStyles.header}">
          <h1 style="${baseStyles.logo}">KJ <span style="${baseStyles.logoOrange}">Exchange</span></h1>
          <p style="${baseStyles.subtext}">Trade Smart. Trade Secure.</p>
        </div>
        <div style="${baseStyles.card} ${baseStyles.successBadge}">
          <h2 style="${baseStyles.titleSuccess}">💰 Deposit Confirmed</h2>
        </div>
        <p style="${baseStyles.bodyText}">Hello ${data.userName || 'there'},</p>
        <p style="${baseStyles.mutedText}">
          Your deposit of <strong style="color: #FF7300;">${data.amount || 0} ${data.coin || 'crypto'}</strong> has been confirmed.
        </p>
        <div style="${baseStyles.amountBox}">
          <p style="${baseStyles.amountLabel}">Asset</p>
          <p style="color: #F0EDF5; font-size: 24px; font-weight: bold; margin: 5px 0;">${data.amount || 0} ${data.coin || 'crypto'}</p>
        </div>
        <p style="${baseStyles.mutedText}">
          Funds are now available in your wallet. You can trade or withdraw anytime.
        </p>
        <hr style="${baseStyles.divider}" />
        <p style="${baseStyles.footer}">
          Need help? Contact us on WhatsApp: +${WHATSAPP_NUMBER}
        </p>
      </div>
    `,
  }),

  // ===== WELCOME EMAIL =====
  welcome: (data) => ({
    subject: `🎉 Welcome to KJ Exchange!`,
    html: `
      <div style="${baseStyles.container}">
        <div style="${baseStyles.header}">
          <h1 style="${baseStyles.logo}">KJ <span style="${baseStyles.logoOrange}">Exchange</span></h1>
          <p style="${baseStyles.subtext}">Trade Smart. Trade Secure.</p>
        </div>
        <div style="${baseStyles.card} ${baseStyles.successBadge}">
          <h2 style="${baseStyles.titleSuccess}">🎉 Welcome to KJ Exchange</h2>
        </div>
        <p style="${baseStyles.bodyText}">Hello ${data.userName || 'there'},</p>
        <p style="${baseStyles.mutedText}">
          Welcome to KJ Exchange — your trusted digital finance platform!
        </p>
        <p style="${baseStyles.mutedText}">
          Here's what you can do on KJ Exchange:
        </p>
        <ul style="color: #B8B0C9; font-size: 14px; line-height: 1.8; padding-left: 20px;">
          <li>💰 <strong style="color: #F0EDF5;">Sell Crypto</strong> — BTC, USDT, ETH, and more</li>
          <li>🎁 <strong style="color: #F0EDF5;">Sell Gift Cards</strong> — Apple, Amazon, Google Play, and more</li>
          <li>💳 <strong style="color: #F0EDF5;">Pay Bills</strong> — Electricity, TV, Internet</li>
          <li>📱 <strong style="color: #F0EDF5;">Buy Airtime & Data</strong> — All networks</li>
          <li>💵 <strong style="color: #F0EDF5;">Convert & Save in USD</strong> — Protect your savings</li>
        </ul>
        <div style="background: rgba(255, 115, 0, 0.1); border: 1px solid rgba(255, 115, 0, 0.2); border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
          <p style="color: #FF7300; font-size: 14px; font-weight: 600;">🎁 You've received 1,000 Gift Points!</p>
          <p style="color: #B8B0C9; font-size: 12px;">Redeem them after your first trade.</p>
        </div>
        <div style="${baseStyles.buttonContainer}">
          <a href="${APP_URL}/dashboard" style="${baseStyles.button}">
            Go to Dashboard →
          </a>
        </div>
        <hr style="${baseStyles.divider}" />
        <p style="${baseStyles.footer}">
          Need help? Contact us on WhatsApp: +${WHATSAPP_NUMBER}
        </p>
      </div>
    `,
  }),

  // ===== PASSWORD RESET =====
  passwordReset: (data) => ({
    subject: `🔑 Reset Your Password — KJ Exchange`,
    html: `
      <div style="${baseStyles.container}">
        <div style="${baseStyles.header}">
          <h1 style="${baseStyles.logo}">KJ <span style="${baseStyles.logoOrange}">Exchange</span></h1>
          <p style="${baseStyles.subtext}">Trade Smart. Trade Secure.</p>
        </div>
        <div style="${baseStyles.card} ${baseStyles.warningBadge}">
          <h2 style="${baseStyles.titleWarning}">🔑 Reset Your Password</h2>
        </div>
        <p style="${baseStyles.bodyText}">Hello ${data.userName || 'there'},</p>
        <p style="${baseStyles.mutedText}">
          We received a request to reset your password. Click the button below to create a new password.
        </p>
        <div style="${baseStyles.buttonContainer}">
          <a href="${data.resetLink || APP_URL + '/auth/update-password'}" style="${baseStyles.button}">
            Reset Password
          </a>
        </div>
        <p style="color: #7A728F; font-size: 12px; text-align: center;">
          This link will expire in 24 hours.<br>
          If you didn't request this, please ignore this email.
        </p>
        <hr style="${baseStyles.divider}" />
        <p style="${baseStyles.footer}">
          Need help? Contact us on WhatsApp: +${WHATSAPP_NUMBER}
        </p>
      </div>
    `,
  }),
};

// ===== SEND EMAIL FUNCTION =====
export async function sendEmail(to, templateKey, data) {
  try {
    const template = emailTemplates[templateKey];
    if (!template) {
      console.error(`❌ Template "${templateKey}" not found`);
      return false;
    }

    const { subject, html } = template(data);

    // You'll need to integrate this with your email service
    // For now, this is a placeholder
    console.log(`📧 Would send email to: ${to}`);
    console.log(`📧 Subject: ${subject}`);
    console.log(`📧 Template: ${templateKey}`);

    return true;
  } catch (error) {
    console.error('❌ Email send error:', error);
    return false;
  }
}

// ===== EXPORT ALL TEMPLATES =====
export default emailTemplates;
