import nodemailer from 'nodemailer';

// Create transporter with Gmail (use app-specific password)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

// Generate invoice HTML template
const generateInvoiceHTML = (userData) => {
    const { name, email, planType, amount, transactionId, date } = userData;
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }
                .content {
                    background: #f9f9f9;
                    padding: 30px;
                    border-radius: 0 0 10px 10px;
                }
                .invoice-details {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #eee;
                }
                .detail-row:last-child {
                    border-bottom: none;
                    font-weight: bold;
                    font-size: 18px;
                }
                .plan-badge {
                    display: inline-block;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-weight: bold;
                }
                .bronze { background: #CD7F32; color: white; }
                .silver { background: #C0C0C0; color: #333; }
                .gold { background: #FFD700; color: #333; }
                .benefits {
                    background: #e8f5e9;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .benefits ul {
                    margin: 10px 0;
                    padding-left: 20px;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    color: #666;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎉 Welcome to ${planType} Plan!</h1>
                <p>Thank you for upgrading your account</p>
            </div>
            <div class="content">
                <h2>Invoice Details</h2>
                <div class="invoice-details">
                    <div class="detail-row">
                        <span>Customer Name:</span>
                        <span><strong>${name}</strong></span>
                    </div>
                    <div class="detail-row">
                        <span>Email:</span>
                        <span>${email}</span>
                    </div>
                    <div class="detail-row">
                        <span>Plan:</span>
                        <span class="plan-badge ${planType.toLowerCase()}">${planType}</span>
                    </div>
                    <div class="detail-row">
                        <span>Transaction ID:</span>
                        <span>${transactionId}</span>
                    </div>
                    <div class="detail-row">
                        <span>Date:</span>
                        <span>${new Date(date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</span>
                    </div>
                    <div class="detail-row">
                        <span>Amount Paid:</span>
                        <span><strong>₹${amount}</strong></span>
                    </div>
                </div>

                <div class="benefits">
                    <h3>🎁 Your ${planType} Plan Benefits:</h3>
                    <ul>
                        ${getBenefits(planType)}
                    </ul>
                </div>

                <p style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              color: white; 
                              padding: 12px 30px; 
                              text-decoration: none; 
                              border-radius: 5px;
                              display: inline-block;">
                        Start Watching Now
                    </a>
                </p>

                <div class="footer">
                    <p>This is an automated email. Please do not reply.</p>
                    <p>© 2026 YouTube Clone. All rights reserved.</p>
                    <p>If you have any questions, contact us at support@youtubeclone.com</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

const getBenefits = (planType) => {
    const benefits = {
        'Bronze': [
            '7 minutes of video watching per day',
            '1 video download per day',
            'HD video quality',
            'Ad-supported experience'
        ],
        'Silver': [
            '10 minutes of video watching per day',
            '5 video downloads per day',
            'Full HD video quality',
            'Ad-free experience',
            'Priority support'
        ],
        'Gold': [
            '⭐ Unlimited video watching',
            '⭐ Unlimited downloads',
            '⭐ 4K video quality',
            '⭐ Ad-free experience',
            '⭐ Priority support',
            '⭐ Exclusive content access'
        ]
    };

    return (benefits[planType] || [])
        .map(benefit => `<li>${benefit}</li>`)
        .join('');
};

// Send invoice email
const sendInvoiceEmail = async (userData) => {
    try {
        const mailOptions = {
            from: `"YouTube Premium" <${process.env.EMAIL_USER || 'noreply@youtubeclone.com'}>`,
            to: userData.email,
            subject: `🎉 Welcome to ${userData.planType} Plan - Invoice #${userData.transactionId}`,
            html: generateInvoiceHTML(userData)
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// Send plan upgrade confirmation
const sendUpgradeConfirmation = async (userData) => {
    try {
        const mailOptions = {
            from: `"YouTube Premium" <${process.env.EMAIL_USER || 'noreply@youtubeclone.com'}>`,
            to: userData.email,
            subject: `Plan Upgraded to ${userData.planType}! 🎊`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #667eea;">Plan Upgrade Successful!</h2>
                    <p>Hi ${userData.name},</p>
                    <p>Congratulations! Your account has been upgraded to <strong>${userData.planType}</strong> plan.</p>
                    <p>You can now enjoy enhanced features and extended watch time.</p>
                    <p>Happy watching!</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">YouTube Clone Team</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export {
    sendInvoiceEmail,
    sendUpgradeConfirmation
};
