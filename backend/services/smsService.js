import AfricasTalking from 'africastalking';
import { dbAsync } from '../config/database.js';

// Initialize Africa's Talking (optional - only if credentials provided)
let sms = null;
if (process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_USERNAME) {
  try {
    const africastalking = AfricasTalking({
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME
    });
    sms = africastalking.SMS;
    console.log('✅ Africa\'s Talking SMS initialized');
  } catch (error) {
    console.warn('⚠️ Failed to initialize SMS service:', error.message);
  }
} else {
  console.log('⚠️ SMS credentials not provided - SMS functionality disabled');
}

// Admin phone numbers
export const ADMIN_PHONES = {
  'emmanuel.evian@autocare.com': '+254746720669',
  'ibrahim.mohamud@autocare.com': '+254729549671', 
  'joel.nganga@autocare.com': '+254757735896',
  'patience.karanja@autocare.com': '+254718168860',
  'joyrose.kinuthia@autocare.com': '+254718528547'
};

// Company details
export const COMPANY_INFO = {
  name: 'AutoCare Pro',
  phone: '+254700123456',
  email: 'info@autocare.com',
  website: 'https://autocare.com'
};

/**
 * Send SMS using Africa's Talking
 */
export const sendSMS = async (phoneNumber, message, options = {}) => {
  try {
    // Check if SMS service is available
    if (!sms) {
      console.log(`📱 SMS simulation to ${phoneNumber}: ${message.substring(0, 50)}...`);
      await logSMS(phoneNumber, message, 'simulated', { simulation: true });
      return {
        success: true,
        simulated: true,
        phoneNumber
      };
    }

    console.log(`📱 Sending SMS to ${phoneNumber}`);
    
    // Format phone number (ensure it starts with +254)
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith('07') || phoneNumber.startsWith('01')) {
      formattedPhone = '+254' + phoneNumber.substring(1);
    } else if (phoneNumber.startsWith('254')) {
      formattedPhone = '+' + phoneNumber;
    } else if (!phoneNumber.startsWith('+')) {
      formattedPhone = '+254' + phoneNumber;
    }

    const smsOptions = {
      to: [formattedPhone],
      message: message,
      from: options.from || 'AutoCare',
      ...options
    };

    // Send SMS
    const result = await sms.send(smsOptions);
    
    // Log SMS to database
    await logSMS(formattedPhone, message, 'sent', result);
    
    console.log(`✅ SMS sent successfully to ${formattedPhone}`);
    return {
      success: true,
      result,
      phoneNumber: formattedPhone
    };

  } catch (error) {
    console.error(`❌ SMS failed to ${phoneNumber}:`, error);
    
    // Log failed SMS
    await logSMS(phoneNumber, message, 'failed', { error: error.message });
    
    return {
      success: false,
      error: error.message,
      phoneNumber
    };
  }
};

/**
 * Send registration notification to all admins
 */
export const sendRegistrationNotification = async (user) => {
  try {
    const message = `
🚗 NEW USER REGISTRATION - AutoCare Pro

👤 Name: ${user.name}
📧 Email: ${user.email}
📱 Phone: ${user.phone || 'Not provided'}
📅 Registered: ${new Date(user.join_date || Date.now()).toLocaleString()}

Please welcome our new customer! 🎉

AutoCare Pro Team
    `.trim();

    const adminPhones = Object.values(ADMIN_PHONES);
    const results = [];

    // Send to all admin phones
    for (const phone of adminPhones) {
      const result = await sendSMS(phone, message);
      results.push(result);
    }

    console.log(`📱 Registration notifications sent to ${results.length} admins`);
    return {
      success: true,
      results,
      message: 'Registration notifications sent to all admins'
    };

  } catch (error) {
    console.error('❌ Failed to send registration notifications:', error);
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

Thank you for choosing AutoCare Pro!

${COMPANY_INFO.phone}
${COMPANY_INFO.website}
    `.trim();

    const result = await sendSMS(user.phone, message);
    
    console.log(`✅ Welcome SMS sent to ${user.name} at ${user.phone}`);
    return result;

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
export const sendServiceUpdateSMS = async (user, serviceRequest) => {
  try {
    if (!user.phone) {
      return { success: false, error: 'No phone number' };
    }

    const message = `
AutoCare Pro Update 🔧

Hi ${user.name},

Your service request #${serviceRequest.id} status: ${serviceRequest.status.toUpperCase()}

${serviceRequest.admin_notes || 'We will keep you updated on progress.'}

Track your request online or contact us:
${COMPANY_INFO.phone}

AutoCare Pro Team
    `.trim();

    const result = await sendSMS(user.phone, message);
    
    console.log(`📱 Service update SMS sent to ${user.phone}`);
    return result;

  } catch (error) {
    console.error('❌ Failed to send service update SMS:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send truck dispatch notification
 */
export const sendTruckDispatchSMS = async (user, truck, serviceRequest) => {
  try {
    if (!user.phone) {
      return { success: false, error: 'No phone number' };
    }

    const message = `
🚛 Truck Dispatched - AutoCare Pro

Hi ${user.name},

Truck "${truck.name}" (${truck.license_plate}) has been dispatched for your service request #${serviceRequest.id}.

Driver: ${truck.driver_name || 'N/A'}
Driver Phone: ${truck.driver_phone || 'N/A'}

Track your service in the app or call us:
${COMPANY_INFO.phone}

AutoCare Pro Team
    `.trim();

    const result = await sendSMS(user.phone, message);
    
    console.log(`🚛 Truck dispatch SMS sent to ${user.phone}`);
    return result;

  } catch (error) {
    console.error('❌ Failed to send truck dispatch SMS:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Log SMS to database
 */
const logSMS = async (phoneNumber, message, status, responseData = {}) => {
  try {
    await dbAsync.run(`
      INSERT INTO sms_logs (phone_number, message, status, response_data)
      VALUES (?, ?, ?, ?)
    `, [
      phoneNumber,
      message,
      status,
      JSON.stringify(responseData)
    ]);
  } catch (error) {
    console.error('Failed to log SMS:', error);
  }
};

/**
 * Get SMS logs (for admin)
 */
export const getSMSLogs = async (limit = 100) => {
  try {
    const logs = await dbAsync.all(`
      SELECT * FROM sms_logs 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [limit]);
    
    return logs.map(log => ({
      ...log,
      response_data: JSON.parse(log.response_data || '{}')
    }));
  } catch (error) {
    console.error('Failed to get SMS logs:', error);
    return [];
  }
};

export default {
  sendSMS,
  sendRegistrationNotification,
  sendWelcomeSMS,
  sendServiceUpdateSMS,
  sendTruckDispatchSMS,
  getSMSLogs,
  ADMIN_PHONES,
  COMPANY_INFO
};