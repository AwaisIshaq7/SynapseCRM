const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../services/emailService');

const generateToken = (id, expiresIn = '1h') => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'sales_manager' } = req.body;

    // Allow registration for any role (including admin).

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, role });
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // If remember me is checked, token expires in 7 days; otherwise 1 hour
    const expiresIn = rememberMe ? '7d' : '1h';
    const token = generateToken(user._id, expiresIn);

    res.status(200).json({
      success: true,
      data: {
        token,
        user: { _id: user._id, name: user.name, role: user.role },
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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, data: null, error: 'Email is required' });
    }

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

    // Send asynchronously so the frontend doesn't timeout!
    sendPasswordResetEmail(user.email, user.name, resetLink)
      .then(() => console.log('✅ Password reset email sent securely.'))
      .catch((err) => console.error('❌ Failed to send password reset email:', err.message));

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
    res.status(500).json({ success: false, data: null, error: err.message });
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
