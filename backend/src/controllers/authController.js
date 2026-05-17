const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail, sendVerificationEmail, isMailConfigured } = require('../services/emailService');
const { DEMO_EMAIL } = require('../utils/seedDemoUser');

const frontendBase = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const generateToken = (id, expiresIn = '1h') => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

// POST /api/auth/register — account inactive until email verified
exports.register = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const { password, role = 'sales_manager' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Enter a valid email address' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.emailVerified === false) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered but not verified. Check your inbox or resend verification.',
          code: 'EMAIL_NOT_VERIFIED',
        });
      }
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    if (!isMailConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Email verification is not available. Configure SMTP in backend/.env',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      emailVerified: false,
    });

    const rawToken = user.generateVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verifyLink = `${frontendBase()}/verify-email/${rawToken}`;
    const mailResult = await sendVerificationEmail(user.email, user.name, verifyLink);
    if (mailResult?.skipped) {
      await User.deleteOne({ _id: user._id });
      return res.status(503).json({ success: false, error: 'Could not send verification email' });
    }

    res.status(201).json({
      success: true,
      data: {
        message: 'Verification email sent. Please confirm your email before signing in.',
        email: user.email,
        requiresVerification: true,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/auth/verify-email/:token
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Verification token is required' });
    }

    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      verificationToken: hashed,
    }).select('+verificationToken +verificationTokenExpiry');

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired verification link' });
    }

    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        data: { message: 'Email already verified. You can sign in now.', email: user.email },
      });
    }

    if (!user.verificationTokenExpiry || user.verificationTokenExpiry <= Date.now()) {
      return res.status(400).json({ success: false, error: 'Invalid or expired verification link' });
    }

    user.emailVerified = true;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      data: { message: 'Email verified. You can sign in now.', email: user.email },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/auth/resend-verification
exports.resendVerification = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const user = await User.findOne({ email }).select('+verificationToken +verificationTokenExpiry');
    if (!user || user.emailVerified) {
      return res.status(200).json({
        success: true,
        data: { message: 'If an unverified account exists, a new email has been sent.' },
      });
    }

    if (!isMailConfigured()) {
      return res.status(503).json({ success: false, error: 'Email is not configured' });
    }

    const rawToken = user.generateVerificationToken();
    await user.save({ validateBeforeSave: false });
    const verifyLink = `${frontendBase()}/verify-email/${rawToken}`;
    await sendVerificationEmail(user.email, user.name, verifyLink);

    res.status(200).json({
      success: true,
      data: { message: 'If an unverified account exists, a new email has been sent.' },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isDemo = email === DEMO_EMAIL;
    if (user.emailVerified === false && !isDemo) {
      return res.status(403).json({
        success: false,
        error: 'Please verify your email before signing in. Check your inbox or resend verification.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    const expiresIn = rememberMe ? '30d' : '8h';
    const token = generateToken(user._id, expiresIn);

    res.status(200).json({
      success: true,
      data: {
        token,
        rememberMe: Boolean(rememberMe),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified !== false,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ success: false, data: null, error: 'Email is required' });
    }

    // Any address registered in SynapseCRM (Gmail, Outlook, work email, etc.)
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists (security best practice)
      return res.status(200).json({ 
        success: true, 
        data: { message: 'If an account with that email exists, a password reset link has been sent.' },
        error: null,
      });
    }

    // Generate reset token
    const resetToken = user.generateResetToken();
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const resetLink = `${frontendUrl.replace(/\/$/, '')}/reset-password/${resetToken}`;

    const mailResult = await sendPasswordResetEmail(user.email, user.name, resetLink);
    if (mailResult?.skipped) {
      return res.status(503).json({
        success: false,
        data: null,
        error: 'Email is not configured. Set SMTP_USER and SMTP_PASS in backend/.env',
      });
    }

    const data = process.env.NODE_ENV === 'test'
      ? { resetToken, resetLink, mailMode: 'smtp_or_skipped' }
      : null;

    res.status(200).json({
      success: true,
      data: {
        message: 'If an account with that email exists, a password reset link has been sent.',
        ...(data || {}),
      },
      error: null,
    });
  } catch (err) {
    const msg = err.code === 'EAUTH'
      ? 'Gmail rejected SMTP login. Use a 16-character App Password (no spaces), not your normal Gmail password.'
      : err.message;
    console.error('forgot-password email error:', err.message);
    res.status(500).json({ success: false, data: null, error: msg });
  }
};

// POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({ success: false, data: null, error: 'Password fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, data: null, error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, data: null, error: 'Password must be at least 6 characters' });
    }

    // Hash the token to find the user
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, data: null, error: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = password;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    console.log(`✅ Password reset successfully for user ${user.email}`);

    res.status(200).json({
      success: true,
      data: { message: 'Password has been reset successfully' },
      error: null,
    });
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message });
  }
};

// GET /api/auth/validate-reset/:token
exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.params
    if (!token) return res.status(400).json({ success: false, data: null, error: 'Token required' })

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({ resetToken: hashedToken, resetTokenExpiry: { $gt: Date.now() } })

    if (!user) {
      return res.status(400).json({ success: false, data: null, error: 'Invalid or expired reset token' })
    }

    res.status(200).json({ success: true, data: { email: user.email }, error: null })
  } catch (err) {
    res.status(500).json({ success: false, data: null, error: err.message })
  }
}

// PUT /api/auth/change-password (for logged-in users)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, error: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id).select('+password');
    
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    console.log(`✅ Password changed for user ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password has been changed successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
