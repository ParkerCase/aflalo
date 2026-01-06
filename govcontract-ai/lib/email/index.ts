import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailTemplate {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

export class EmailService {
  private defaultFrom = 'GovContractAI <noreply@govcontractai.com>'

  async sendEmail(template: EmailTemplate): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const { data, error } = await resend.emails.send({
        from: template.from || this.defaultFrom,
        to: template.to,
        subject: template.subject,
        html: template.html,
        text: template.text
      })

      if (error) {
        console.error('Email send error:', error)
        return { success: false, error: error.message }
      }

      return { success: true, messageId: data?.id }
    } catch (error) {
      console.error('Email service error:', error)
      return { success: false, error: 'Failed to send email' }
    }
  }

  async sendWelcomeEmail(
    email: string,
    firstName: string,
    companyName: string
  ): Promise<{ success: boolean; error?: string }> {
    const template: EmailTemplate = {
      to: email,
      subject: 'Welcome to GovContractAI!',
      html: this.getWelcomeEmailHtml(firstName, companyName),
      text: this.getWelcomeEmailText(firstName, companyName)
    }

    const result = await this.sendEmail(template)
    return { success: result.success, error: result.error }
  }

  async sendOpportunityAlert(
    email: string,
    firstName: string,
    opportunities: Array<{
      title: string
      agency: string
      deadline: string
      matchScore: number
      url: string
    }>
  ): Promise<{ success: boolean; error?: string }> {
    const template: EmailTemplate = {
      to: email,
      subject: `🎯 ${opportunities.length} New Contract Opportunities Found`,
      html: this.getOpportunityAlertHtml(firstName, opportunities),
      text: this.getOpportunityAlertText(firstName, opportunities)
    }

    const result = await this.sendEmail(template)
    return { success: result.success, error: result.error }
  }

  async sendApplicationStatusUpdate(
    email: string,
    firstName: string,
    applicationTitle: string,
    status: string,
    details?: string
  ): Promise<{ success: boolean; error?: string }> {
    const template: EmailTemplate = {
      to: email,
      subject: `Application Update: ${applicationTitle}`,
      html: this.getApplicationStatusHtml(firstName, applicationTitle, status, details),
      text: this.getApplicationStatusText(firstName, applicationTitle, status, details)
    }

    const result = await this.sendEmail(template)
    return { success: result.success, error: result.error }
  }

  async sendPaymentReminder(
    email: string,
    firstName: string,
    amount: number,
    dueDate: string,
    contractTitle: string
  ): Promise<{ success: boolean; error?: string }> {
    const template: EmailTemplate = {
      to: email,
      subject: `Payment Due: Commission for ${contractTitle}`,
      html: this.getPaymentReminderHtml(firstName, amount, dueDate, contractTitle),
      text: this.getPaymentReminderText(firstName, amount, dueDate, contractTitle)
    }

    const result = await this.sendEmail(template)
    return { success: result.success, error: result.error }
  }

  async sendTeamInvitation(
    email: string,
    inviterName: string,
    companyName: string,
    role: string,
    inviteUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    const template: EmailTemplate = {
      to: email,
      subject: `You're invited to join ${companyName} on GovContractAI`,
      html: this.getTeamInvitationHtml(inviterName, companyName, role, inviteUrl),
      text: this.getTeamInvitationText(inviterName, companyName, role, inviteUrl)
    }

    const result = await this.sendEmail(template)
    return { success: result.success, error: result.error }
  }

  async sendPasswordReset(
    email: string,
    resetUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    const template: EmailTemplate = {
      to: email,
      subject: 'Reset Your GovContractAI Password',
      html: this.getPasswordResetHtml(resetUrl),
      text: this.getPasswordResetText(resetUrl)
    }

    const result = await this.sendEmail(template)
    return { success: result.success, error: result.error }
  }

  async sendSubscriptionUpdate(
    email: string,
    firstName: string,
    planName: string,
    action: 'upgraded' | 'downgraded' | 'canceled' | 'renewed'
  ): Promise<{ success: boolean; error?: string }> {
    const template: EmailTemplate = {
      to: email,
      subject: `Subscription ${action}: ${planName}`,
      html: this.getSubscriptionUpdateHtml(firstName, planName, action),
      text: this.getSubscriptionUpdateText(firstName, planName, action)
    }

    const result = await this.sendEmail(template)
    return { success: result.success, error: result.error }
  }

  // HTML Templates
  private getWelcomeEmailHtml(firstName: string, companyName: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to GovContractAI</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to GovContractAI!</h1>
    </div>
    <div class="content">
      <h2>Hi ${firstName},</h2>
      <p>Welcome to GovContractAI! We're excited to help ${companyName} discover and win more government contracts.</p>
      
      <p>Here's what you can do next:</p>
      <ul>
        <li>Complete your company profile</li>
        <li>Browse available opportunities</li>
        <li>Set up opportunity alerts</li>
        <li>Start your first application</li>
      </ul>
      
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Get Started</a>
      </p>
      
      <p>If you have any questions, our support team is here to help!</p>
      
      <p>Best regards,<br>The GovContractAI Team</p>
    </div>
    <div class="footer">
      <p>GovContractAI - Your AI-Powered Government Contracting Platform</p>
    </div>
  </div>
</body>
</html>
    `
  }

  private getOpportunityAlertHtml(firstName: string, opportunities: any[]): string {
    const opportunityList = opportunities.map(opp => `
      <div style="border: 1px solid #e5e7eb; padding: 15px; margin: 10px 0; border-radius: 5px;">
        <h3 style="margin: 0 0 10px 0; color: #2563eb;">${opp.title}</h3>
        <p style="margin: 5px 0;"><strong>Agency:</strong> ${opp.agency}</p>
        <p style="margin: 5px 0;"><strong>Deadline:</strong> ${opp.deadline}</p>
        <p style="margin: 5px 0;"><strong>Match Score:</strong> ${opp.matchScore}%</p>
        <a href="${opp.url}" style="color: #2563eb; text-decoration: none;">View Opportunity →</a>
      </div>
    `).join('')

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Opportunities Found</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #059669; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .button { background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 New Opportunities Found!</h1>
    </div>
    <div class="content">
      <h2>Hi ${firstName},</h2>
      <p>We found ${opportunities.length} new contract opportunities that match your company profile:</p>
      
      ${opportunityList}
      
      <p style="margin-top: 30px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/opportunities" class="button">View All Opportunities</a>
      </p>
    </div>
  </div>
</body>
</html>
    `
  }

  private getApplicationStatusHtml(firstName: string, title: string, status: string, details?: string): string {
    const statusColors: { [key: string]: string } = {
      'submitted': '#059669',
      'under_review': '#d97706',
      'awarded': '#059669',
      'rejected': '#dc2626'
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Application Status Update</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${statusColors[status] || '#6b7280'}; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .status-badge { background: ${statusColors[status] || '#6b7280'}; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Application Status Update</h1>
    </div>
    <div class="content">
      <h2>Hi ${firstName},</h2>
      <p>Your application status has been updated:</p>
      
      <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0;">${title}</h3>
        <p>Status: <span class="status-badge">${status.toUpperCase()}</span></p>
        ${details ? `<p><strong>Details:</strong> ${details}</p>` : ''}
      </div>
      
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/applications" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Application</a>
      </p>
    </div>
  </div>
</body>
</html>
    `
  }

  private getPaymentReminderHtml(firstName: string, amount: number, dueDate: string, contractTitle: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Reminder</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Reminder</h1>
    </div>
    <div class="content">
      <h2>Hi ${firstName},</h2>
      <p>This is a reminder that your commission payment is due:</p>
      
      <div style="border: 1px solid #fca5a5; background: #fef2f2; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0;">Payment Details</h3>
        <p><strong>Contract:</strong> ${contractTitle}</p>
        <p><strong>Amount Due:</strong> <span class="amount">$${amount.toLocaleString()}</span></p>
        <p><strong>Due Date:</strong> ${dueDate}</p>
      </div>
      
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/payments" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Make Payment</a>
      </p>
    </div>
  </div>
</body>
</html>
    `
  }

  private getTeamInvitationHtml(inviterName: string, companyName: string, role: string, inviteUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Team Invitation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #7c3aed; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .button { background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>You're Invited!</h1>
    </div>
    <div class="content">
      <h2>Join ${companyName} on GovContractAI</h2>
      <p>${inviterName} has invited you to join ${companyName} as a ${role} on GovContractAI.</p>
      
      <p>GovContractAI is an AI-powered platform that helps government contractors discover and win more contracts.</p>
      
      <p>
        <a href="${inviteUrl}" class="button">Accept Invitation</a>
      </p>
      
      <p>This invitation will expire in 7 days.</p>
    </div>
  </div>
</body>
</html>
    `
  }

  private getPasswordResetHtml(resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6b7280; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reset Your Password</h1>
    </div>
    <div class="content">
      <p>You requested to reset your password for your GovContractAI account.</p>
      
      <p>Click the button below to reset your password:</p>
      
      <p>
        <a href="${resetUrl}" class="button">Reset Password</a>
      </p>
      
      <p>If you didn't request this, please ignore this email. The link will expire in 1 hour.</p>
    </div>
  </div>
</body>
</html>
    `
  }

  private getSubscriptionUpdateHtml(firstName: string, planName: string, action: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Subscription ${action}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Subscription ${action}</h1>
    </div>
    <div class="content">
      <h2>Hi ${firstName},</h2>
      <p>Your subscription has been ${action} to the ${planName} plan.</p>
      
      ${action === 'canceled' ? 
        '<p>Your account will remain active until the end of your current billing period. You can reactivate your subscription at any time.</p>' :
        '<p>You now have access to all the features included in your new plan.</p>'
      }
      
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscription" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Manage Subscription</a>
      </p>
    </div>
  </div>
</body>
</html>
    `
  }

  // Text Templates (simpler versions for text-only email clients)
  private getWelcomeEmailText(firstName: string, companyName: string): string {
    return `
Hi ${firstName},

Welcome to GovContractAI! We're excited to help ${companyName} discover and win more government contracts.

Here's what you can do next:
- Complete your company profile
- Browse available opportunities  
- Set up opportunity alerts
- Start your first application

Get started: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

If you have any questions, our support team is here to help!

Best regards,
The GovContractAI Team
    `
  }

  private getOpportunityAlertText(firstName: string, opportunities: any[]): string {
    const opportunityList = opportunities.map(opp => 
      `${opp.title} - ${opp.agency} (Deadline: ${opp.deadline}, Match: ${opp.matchScore}%)`
    ).join('\n')

    return `
Hi ${firstName},

We found ${opportunities.length} new contract opportunities that match your company profile:

${opportunityList}

View all opportunities: ${process.env.NEXT_PUBLIC_APP_URL}/opportunities
    `
  }

  private getApplicationStatusText(firstName: string, title: string, status: string, details?: string): string {
    return `
Hi ${firstName},

Your application status has been updated:

${title}
Status: ${status.toUpperCase()}
${details ? `Details: ${details}` : ''}

View application: ${process.env.NEXT_PUBLIC_APP_URL}/applications
    `
  }

  private getPaymentReminderText(firstName: string, amount: number, dueDate: string, contractTitle: string): string {
    return `
Hi ${firstName},

This is a reminder that your commission payment is due:

Contract: ${contractTitle}
Amount Due: $${amount.toLocaleString()}
Due Date: ${dueDate}

Make payment: ${process.env.NEXT_PUBLIC_APP_URL}/payments
    `
  }

  private getTeamInvitationText(inviterName: string, companyName: string, role: string, inviteUrl: string): string {
    return `
You're invited to join ${companyName} on GovContractAI!

${inviterName} has invited you to join ${companyName} as a ${role} on GovContractAI.

GovContractAI is an AI-powered platform that helps government contractors discover and win more contracts.

Accept invitation: ${inviteUrl}

This invitation will expire in 7 days.
    `
  }

  private getPasswordResetText(resetUrl: string): string {
    return `
You requested to reset your password for your GovContractAI account.

Reset your password: ${resetUrl}

If you didn't request this, please ignore this email. The link will expire in 1 hour.
    `
  }

  private getSubscriptionUpdateText(firstName: string, planName: string, action: string): string {
    return `
Hi ${firstName},

Your subscription has been ${action} to the ${planName} plan.

${action === 'canceled' ? 
  'Your account will remain active until the end of your current billing period. You can reactivate your subscription at any time.' :
  'You now have access to all the features included in your new plan.'
}

Manage subscription: ${process.env.NEXT_PUBLIC_APP_URL}/subscription
    `
  }
}

export const emailService = new EmailService()
