// SMS/WhatsApp Notification Service for AutoCare Pro
// This simulates SMS sending - in production, integrate with real SMS APIs

// Admin phone numbers for notifications
export const ADMIN_PHONES = {
  'emmanuel.evian@autocare.com': '+254700000001',
  'ibrahim.mohamud@autocare.com': '+254700000002', 
  'joel.nganga@autocare.com': '+254700000003',
  'patience.karanja@autocare.com': '+254700000004',
  'joyrose.kinuthia@autocare.com': '+254700000005'
};

// Company details
export const COMPANY_INFO = {
  name: 'AutoCare Pro',
  phone: '+254700123456',
  email: 'info@autocare.com',
  website: 'https://autocare.com'
};

/**
 * Send registration notification to admins
 */
export const sendRegistrationNotification = async (user) => {
  try {
    const message = `
🚗 NEW USER REGISTRATION - AutoCare Pro

👤 Name: ${user.name}
📧 Email: ${user.email}
📱 Phone: ${user.phone || 'Not provided'}
📅 Registered: ${new Date(user.joinDate).toLocaleString()}

Please welcome our new customer! 🎉

AutoCare Pro Team
    `.trim();

    // In production, integrate with:
    // - Twilio SMS API
    // - Africa's Talking SMS API
    // - WhatsApp Business API
    // - Firebase Cloud Messaging
    // - etc.

    // Simulate sending to all admin phones
    const adminPhones = Object.values(ADMIN_PHONES);
    
    console.log('🔔 ADMIN NOTIFICATION SYSTEM ACTIVATED');
    console.log('📱 Sending SMS to admin phones:', adminPhones);
    console.log('📝 Message:', message);
    
    // Simulate API calls with promises
    const notifications = adminPhones.map(async (phone) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Log successful "send"
      console.log(`✅ SMS sent to ${phone}`);
      
      return {
        phone,
        status: 'sent',
        timestamp: new Date().toISOString()
      };
    });

    const results = await Promise.all(notifications);
    
    // Also add in-app notification for admins
    window.dispatchEvent(new CustomEvent('newUserRegistration', {
      detail: {
        user,
        message: `New user ${user.name} has registered!`,
        type: 'registration'
      }
    }));

    return {
      success: true,
      results,
      message: 'Registration notifications sent to all admins'
    };

  } catch (error) {
    console.error('❌ Failed to send registration notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send welcome SMS to new user
 */
export const sendWelcomeSMS = async (user) => {
  try {
    if (!user.phone) {
      console.log('⚠️ No phone number provided for user, skipping welcome SMS');
      return { success: false, error: 'No phone number' };
    }

    const message = `
Welcome to AutoCare Pro! 🚗

Hi ${user.name}, your registration is complete!

✅ You can now book vehicle services
✅ Track service requests
✅ Get real-time updates
✅ Chat with our support team

Download our app or visit our website anytime.

Thank you for choosing AutoCare Pro!

${COMPANY_INFO.phone}
${COMPANY_INFO.website}
    `.trim();

    // Simulate sending welcome SMS
    console.log('📱 WELCOME SMS SYSTEM ACTIVATED');
    console.log(`📞 Sending welcome SMS to: ${user.phone}`);
    console.log('📝 Message:', message);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log(`✅ Welcome SMS sent to ${user.name} at ${user.phone}`);

    return {
      success: true,
      phone: user.phone,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Failed to send welcome SMS:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send service update notification
 */
export const sendServiceUpdateSMS = async (user, requestData) => {
  try {
    if (!user.phone) return { success: false, error: 'No phone number' };

    const message = `
AutoCare Pro Update 🔧

Hi ${user.name},

Your service request #${requestData.id} status: ${requestData.status.toUpperCase()}

${requestData.adminNotes || 'We will keep you updated on progress.'}

Track your request online or contact us:
${COMPANY_INFO.phone}

AutoCare Pro Team
    `.trim();

    console.log(`📱 Service update SMS to ${user.phone}:`, message);
    
    return {
      success: true,
      phone: user.phone,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Failed to send service update SMS:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Real SMS API Integration Examples:
 * 
 * // Twilio Example:
 * import twilio from 'twilio';
 * const client = twilio(accountSid, authToken);
 * const message = await client.messages.create({
 *   body: messageText,
 *   from: '+1234567890',
 *   to: phoneNumber
 * });
 * 
 * // Africa's Talking Example:
 * import AfricasTalking from 'africastalking';
 * const africastalking = AfricasTalking({
 *   apiKey: 'your-api-key',
 *   username: 'your-username'
 * });
 * const sms = africastalking.SMS;
 * const result = await sms.send({
 *   to: [phoneNumber],
 *   message: messageText
 * });
 * 
 * // WhatsApp Business API Example:
 * const response = await fetch('https://graph.facebook.com/v18.0/{phone-number-id}/messages', {
 *   method: 'POST',
 *   headers: {
 *     'Authorization': `Bearer ${access_token}`,
 *     'Content-Type': 'application/json',
 *   },
 *   body: JSON.stringify({
 *     messaging_product: 'whatsapp',
 *     to: phoneNumber,
 *     text: { body: messageText }
 *   })
 * });
 */

export default {
  sendRegistrationNotification,
  sendWelcomeSMS,
  sendServiceUpdateSMS,
  ADMIN_PHONES,
  COMPANY_INFO
};