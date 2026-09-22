<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Password Reset Code</title>
  <style>
    body { margin:0; padding:0; background:#f4f6f9; font-family: Arial, sans-serif; }
    .wrapper { max-width:520px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08); }
    .header { background:#0f2744; padding:32px 40px; text-align:center; }
    .header h1 { color:#ffffff; margin:0; font-size:22px; letter-spacing:0.5px; }
    .header p  { color:#a8c4e0; margin:6px 0 0; font-size:13px; }
    .body { padding:36px 40px; }
    .body p { color:#444; font-size:15px; line-height:1.6; margin:0 0 16px; }
    .otp-box { text-align:center; margin:28px 0; }
    .otp-code { display:inline-block; background:#f0f4ff; border:2px dashed #0f2744; border-radius:10px; padding:18px 40px; font-size:38px; font-weight:bold; letter-spacing:10px; color:#0f2744; }
    .expiry { text-align:center; color:#888; font-size:13px; margin-top:8px; }
    .warning { background:#fff8e1; border-left:4px solid #f59e0b; padding:12px 16px; border-radius:6px; color:#92400e; font-size:13px; margin-top:24px; }
    .footer { background:#f8fafc; padding:20px 40px; text-align:center; color:#aaa; font-size:12px; border-top:1px solid #eee; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Resort Management System</h1>
      <p>Password Reset Verification</p>
    </div>
    <div class="body">
      <p>Hello <strong>{{ $userName }}</strong>,</p>
      <p>We received a request to reset your RMS account password. Use the verification code below to proceed.</p>

      <div class="otp-box">
        <div class="otp-code">{{ $otp }}</div>
      </div>
      <p class="expiry">This code expires in <strong>{{ $expiresInMinutes }} minutes</strong>.</p>

      <p>If you did not request a password reset, you can safely ignore this email. Your password will not be changed.</p>

      <div class="warning">
        🔒 <strong>Do not share this code with anyone.</strong> RMS staff will never ask for your verification code.
      </div>
    </div>
    <div class="footer">
      &copy; {{ date('Y') }} Resort Management System. All rights reserved.
    </div>
  </div>
</body>
</html>
