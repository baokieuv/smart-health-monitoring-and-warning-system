const nodemailer = require('nodemailer');

/**
 * Send alarm email notification to doctor
 */
async function sendAlarmEmail(doctor, patient, alarmData) {
    try {
        // Create transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Determine severity color
        const severityColors = {
            CRITICAL: '#dc3545',
            WARNING: '#ffc107',
            INFO: '#17a2b8'
        };
        const severityColor = severityColors[alarmData.severity] || '#6c757d';

        // Format data for email
        const heartRate = alarmData.data?.heart_rate || 'N/A';
        const spo2 = alarmData.data?.SpO2 || 'N/A';
        const temperature = alarmData.data?.temperature || 'N/A';

        // HTML email template
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: ${severityColor}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
                    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
                    .metric { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid ${severityColor}; }
                    .metric-label { font-weight: bold; color: #555; }
                    .metric-value { font-size: 24px; color: ${severityColor}; }
                    .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🚨 ${alarmData.severity} ALARM: ${alarmData.alarmType}</h2>
                    </div>
                    <div class="content">
                        <h3>Patient Information</h3>
                        <p><strong>Name:</strong> ${patient.full_name}</p>
                        <p><strong>CCCD:</strong> ${patient.cccd}</p>
                        <p><strong>Room:</strong> ${patient.room || 'N/A'}</p>
                        
                        <h3>Vital Signs</h3>
                        <div class="metric">
                            <div class="metric-label">Heart Rate</div>
                            <div class="metric-value">${heartRate} bpm</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">SpO2</div>
                            <div class="metric-value">${spo2}%</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Temperature</div>
                            <div class="metric-value">${temperature}°C</div>
                        </div>
                        
                        <p style="margin-top: 20px;"><strong>Time:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                        <p><strong>Device ID:</strong> ${alarmData.deviceId}</p>
                    </div>
                    <div class="footer">
                        <p>Health Monitoring System - IoT Platform</p>
                        <p>This is an automated notification from system (caovanbao21304@gmail.com). Please check the patient immediately.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Plain text version
        const textContent = `
            ALARM NOTIFICATION - ${alarmData.severity}
            
            Alarm Type: ${alarmData.alarmType}
            
            Patient: ${patient.full_name}
            CCCD: ${patient.cccd}
            Room: ${patient.room || 'N/A'}
            
            Vital Signs:
            - Heart Rate: ${heartRate} bpm
            - SpO2: ${spo2}%
            - Temperature: ${temperature}°C
            
            Time: ${new Date().toLocaleString('vi-VN')}
            Device ID: ${alarmData.deviceId}
            
            Please check the patient immediately.
        `;

        // Send email
        const mailOptions = {
            from: `"Health Monitor System" <${process.env.SMTP_USER}>`,
            to: doctor.email,
            subject: `🚨 ${alarmData.severity} ALARM - ${patient.full_name}`,
            text: textContent,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${doctor.email}:`, info.messageId);
        
        return {
            success: true,
            messageId: info.messageId,
            recipient: doctor.email
        };
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
}

module.exports = {
    sendAlarmEmail
};
