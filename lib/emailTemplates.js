export const orderVerifiedTemplate = (orderId, amount, asset, userName) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #0B0815; border-radius: 12px; border: 1px solid #2D2444;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4E1F91; margin: 0;">KJ <span style="color: #FF7300;">Exchange</span></h1>
        <p style="color: #7A728F; margin: 0;">Trade Smart. Trade Secure.</p>
      </div>
      <div style="background: #171021; padding: 20px; border-radius: 8px; border-left: 4px solid #2ecc71;">
        <h2 style="color: #2ecc71; margin: 0;">✅ Order Verified</h2>
      </div>
      <p style="color: #F0EDF5; font-size: 16px; line-height: 1.6;">Hello ${userName || 'there'},</p>
      <p style="color: #B8B0C9; font-size: 16px; line-height: 1.6;">
        Your order <strong style="color: #F0EDF5;">#${orderId.slice(0,8)}</strong> for <strong style="color: #FF7300;">${asset}</strong> has been verified!
      </p>
      <div style="background: #0B0815; padding: 15px 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="color: #7A728F; font-size: 14px; margin: 0;">Amount Credited</p>
        <p style="color: #2ecc71; font-size: 32px; font-weight: bold; margin: 5px 0;">₦${amount.toLocaleString()}</p>
      </div>
      <p style="color: #B8B0C9; font-size: 14px; line-height: 1.6;">
        The funds have been added to your wallet. You can withdraw them anytime.
      </p>
      <hr style="border: 1px solid #2D2444; margin: 20px 0;" />
      <p style="color: #7A728F; font-size: 12px; text-align: center;">
        Need help? Contact us on WhatsApp: +234 816 067 8317
      </p>
    </div>
  `;
};

export const orderRejectedTemplate = (orderId, asset, userName) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #0B0815; border-radius: 12px; border: 1px solid #2D2444;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4E1F91; margin: 0;">KJ <span style="color: #FF7300;">Exchange</span></h1>
        <p style="color: #7A728F; margin: 0;">Trade Smart. Trade Secure.</p>
      </div>
      <div style="background: #171021; padding: 20px; border-radius: 8px; border-left: 4px solid #e74c3c;">
        <h2 style="color: #e74c3c; margin: 0;">❌ Order Rejected</h2>
      </div>
      <p style="color: #F0EDF5; font-size: 16px; line-height: 1.6;">Hello ${userName || 'there'},</p>
      <p style="color: #B8B0C9; font-size: 16px; line-height: 1.6;">
        Your order <strong style="color: #F0EDF5;">#${orderId.slice(0,8)}</strong> for <strong style="color: #FF7300;">${asset}</strong> has been rejected.
      </p>
      <div style="background: #0B0815; padding: 15px 20px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #B8B0C9; font-size: 14px; margin: 0;">
          If you believe this was a mistake, please contact our support team.
        </p>
      </div>
      <hr style="border: 1px solid #2D2444; margin: 20px 0;" />
      <p style="color: #7A728F; font-size: 12px; text-align: center;">
        Need help? Contact us on WhatsApp: +234 816 067 8317
      </p>
    </div>
  `;
};

export const topupVerifiedTemplate = (amount, userName) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #0B0815; border-radius: 12px; border: 1px solid #2D2444;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4E1F91; margin: 0;">KJ <span style="color: #FF7300;">Exchange</span></h1>
        <p style="color: #7A728F; margin: 0;">Trade Smart. Trade Secure.</p>
      </div>
      <div style="background: #171021; padding: 20px; border-radius: 8px; border-left: 4px solid #2ecc71;">
        <h2 style="color: #2ecc71; margin: 0;">💰 Top-Up Verified</h2>
      </div>
      <p style="color: #F0EDF5; font-size: 16px; line-height: 1.6;">Hello ${userName || 'there'},</p>
      <p style="color: #B8B0C9; font-size: 16px; line-height: 1.6;">
        Your top-up of <strong style="color: #2ecc71;">₦${amount.toLocaleString()}</strong> has been verified and credited to your wallet.
      </p>
      <div style="background: #0B0815; padding: 15px 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="color: #7A728F; font-size: 14px; margin: 0;">Available Balance</p>
        <p style="color: #F0EDF5; font-size: 32px; font-weight: bold; margin: 5px 0;">₦${amount.toLocaleString()}</p>
      </div>
      <hr style="border: 1px solid #2D2444; margin: 20px 0;" />
      <p style="color: #7A728F; font-size: 12px; text-align: center;">
        Need help? Contact us on WhatsApp: +234 816 067 8317
      </p>
    </div>
  `;
};

export const topupRejectedTemplate = (userName) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #0B0815; border-radius: 12px; border: 1px solid #2D2444;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #4E1F91; margin: 0;">KJ <span style="color: #FF7300;">Exchange</span></h1>
        <p style="color: #7A728F; margin: 0;">Trade Smart. Trade Secure.</p>
      </div>
      <div style="background: #171021; padding: 20px; border-radius: 8px; border-left: 4px solid #e74c3c;">
        <h2 style="color: #e74c3c; margin: 0;">❌ Top-Up Rejected</h2>
      </div>
      <p style="color: #F0EDF5; font-size: 16px; line-height: 1.6;">Hello ${userName || 'there'},</p>
      <p style="color: #B8B0C9; font-size: 16px; line-height: 1.6;">
        Your top-up request has been rejected.
      </p>
      <div style="background: #0B0815; padding: 15px 20px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #B8B0C9; font-size: 14px; margin: 0;">
          If you believe this was a mistake, please contact our support team.
        </p>
      </div>
      <hr style="border: 1px solid #2D2444; margin: 20px 0;" />
      <p style="color: #7A728F; font-size: 12px; text-align: center;">
        Need help? Contact us on WhatsApp: +234 816 067 8317
      </p>
    </div>
  `;
};
