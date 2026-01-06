import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailTemplate {
  to: string
  subject: string
  html: string
  text?: string
}

export class EmailService {
  static async sendWelcomeEmail(userEmail: string, userName: string) {
    const template: EmailTemplate = {
      to: userEmail,
      subject: 'Welcome to GovContractAI - Your AI-Powered Government Contracting Assistant',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to GovContractAI!</h1>
          </div>
          
          <div style="padding: 40px 20px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName},</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Thank you for joining GovContractAI! We're excited to help you streamline your government contracting process with the power of AI.
            </p>
            
            <div style="background: white; padding: 30px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">What's Next?</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li><strong>Complete your organization profile</strong> - This helps our AI better match you with opportunities</li>
                <li><strong>Upload key documents</strong> - Company capabilities, past performance, certifications</li>  
                <li><strong>Search for opportunities</strong> - Browse thousands of grants and contracts</li>
                <li><strong>Let AI help you apply</strong> - Auto-fill applications and track status</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                 style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Get Started Now
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Need help? Reply to this email or visit our <a href="${process.env.NEXT_PUBLIC_APP_URL}/help">Help Center</a>.
            </p>
          </div>
          
          <div style="padding: 20px; text-align: center; background: #333; color: #999; font-size: 12px;">
            <p>© 2025 GovContractAI. All rights reserved.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe" style="color: #999;">Unsubscribe</a> |
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color: #999;">Privacy Policy</a>
            </p>
          </div>
        </div>
      `,
      text: `Welcome to GovContractAI!\n\nHi ${userName},\n\nThank you for joining GovContractAI! We're excited to help you streamline your government contracting process with AI.\n\nGet started: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    }

    return await this.sendEmail(template)
  }

  static async sendStatusUpdateEmail(userEmail: string, applicationTitle: string, oldStatus: string, newStatus: string, trackingNumber?: string) {
    const statusMessages = {
      submitted: '✅ Successfully submitted to the agency',
      under_review: '👀 Currently under review by the agency',
      approved: '🎉 Congratulations! Your application has been approved',
      rejected: '❌ Unfortunately, your application was not selected',
      awarded: '🏆 Award notification received!'
    }

    const template: EmailTemplate = {
      to: userEmail,
      subject: `Application Status Update: ${applicationTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 40px 20px; background: #f8f9fa;">
            <h2 style="color: #333;">Application Status Update</h2>
            
            <div style="background: white; padding: 30px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">${applicationTitle}</h3>
              
              <div style="margin: 20px 0;">
                <p style="color: #666; margin: 5px 0;"><strong>Previous Status:</strong> ${oldStatus.replace('_', ' ')}</p>
                <p style="color: #666; margin: 5px 0;"><strong>New Status:</strong> ${newStatus.replace('_', ' ')}</p>
                ${trackingNumber ? `<p style="color: #666; margin: 5px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
              </div>
              
              <div style="background: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p style="color: #1565c0; margin: 0; font-size: 16px;">
                  ${statusMessages[newStatus as keyof typeof statusMessages] || 'Status has been updated'}
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/applications" 
                   style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
                  View Application Details
                </a>
              </div>
            </div>
          </div>
        </div>
      `
    }

    return await this.sendEmail(template)
  }

  static async sendOpportunityDigest(userEmail: string, opportunities: any[]) {
    const template: EmailTemplate = {
      to: userEmail,
      subject: `New Government Opportunities - ${opportunities.length} matches found`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 20px; background: #f8f9fa;">
            <h2 style="color: #333;">New Opportunities for You</h2>
            <p style="color: #666;">We found ${opportunities.length} new opportunities that match your profile:</p>
            
            ${opportunities.map(opp => `
              <div style="background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea;">
                <h4 style="color: #333; margin: 0 0 10px 0;">${opp.title}</h4>
                <p style="color: #666; margin: 5px 0;"><strong>Agency:</strong> ${opp.agency}</p>
                <p style="color: #666; margin: 5px 0;"><strong>Deadline:</strong> ${new Date(opp.application_deadline).toLocaleDateString()}</p>
                <p style="color: #666; margin: 5px 0;"><strong>Amount:</strong> $${(opp.amount_max || 0).toLocaleString()}</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/opportunities/${opp.id}" 
                   style="color: #667eea; text-decoration: none; font-weight: bold;">View Details →</a>
              </div>
            `).join('')}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/opportunities" 
                 style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
                Browse All Opportunities
              </a>
            </div>
          </div>
        </div>
      `
    }

    return await this.sendEmail(template)
  }

  static async sendPaymentConfirmation(userEmail: string, planName: string, amount: number) {
    const template: EmailTemplate = {
      to: userEmail,
      subject: `Payment Confirmation - ${planName} Plan`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 40px 20px; background: #f8f9fa;">
            <h2 style="color: #333;">Payment Confirmation</h2>
            
            <div style="background: white; padding: 30px; border-radius: 8px; margin: 20px 0;">
              <div style="background: #d4edda; padding: 20px; border-radius: 5px; text-align: center; margin-bottom: 20px;">
                <h3 style="color: #155724; margin: 0;">✅ Payment Successful!</h3>
              </div>
              
              <p style="color: #666;"><strong>Plan:</strong> ${planName}</p>
              <p style="color: #666;"><strong>Amount:</strong> $${amount.toLocaleString()}/month</p>
              <p style="color: #666;"><strong>Next Billing:</strong> ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">
                  Access Your Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      `
    }

    return await this.sendEmail(template)
  }

  static async sendPaymentFailed(userEmail: string) {
    const template: EmailTemplate = {
      to: userEmail,
      subject: 'Payment Failed - Action Required',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ff4d4f; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Payment Failed</h1>
          </div>
          <div style="padding: 30px 20px; background: #f8f9fa;">
            <p style="color: #333;">We were unable to process your recent payment. Please update your payment information to avoid interruption of your subscription.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href='${process.env.NEXT_PUBLIC_APP_URL}/billing' style="background: #ff4d4f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Update Payment Info</a>
            </div>
            <p style="color: #666; font-size: 14px;">If you have any questions, please contact support.</p>
          </div>
        </div>
      `
    }
    return await this.sendEmail(template)
  }

  private static async sendEmail(template: EmailTemplate) {
    try {
      const result = await resend.emails.send({
        from: 'GovContractAI <noreply@govcontractai.com>',
        to: template.to,
        subject: template.subject,
        html: template.html,
        text: template.text || template.subject
      })
      
      console.log('Email sent successfully:', result)
      return result
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Email send error:', error.message)
        throw error
      }
      console.error('Email send error:', error)
      throw error
    }
  }
}