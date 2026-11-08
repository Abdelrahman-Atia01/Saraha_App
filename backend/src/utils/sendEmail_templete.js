export const sendEmail_templete=(link)=>`<!DOCTYPE html>

<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f7fb; font-family:Arial,Helvetica,sans-serif;">

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
    style="background-color:#f4f7fb; padding:40px 12px;">
    <tr>
      <td align="center">

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
      style="max-width:560px; background-color:#ffffff; border-radius:12px; overflow:hidden;">

      <tr>
        <td align="center" style="background-color:#0f172a; padding:30px 20px;">
          <h1 style="margin:0; color:#ffffff; font-size:26px;">
            Saraha<span style="color:#38bdf8;">.</span>
          </h1>
          <p style="margin:10px 0 0; color:#cbd5e1; font-size:14px;">
            Welcome to our community
          </p>
        </td>
      </tr>

      <tr>
        <td style="padding:35px 30px; color:#334155;">

          <h2 style="margin:0 0 18px; color:#0f172a; font-size:22px;">
            Verify Your Email Address
          </h2>

          <p style="font-size:15px; line-height:1.8;">
            Hello,
          </p>

          <p style="font-size:15px; line-height:1.8;">
            Thank you for creating an account with Saraha!
            Please verify your email address by clicking the button below
            to activate your account.
          </p>

          <table role="presentation" cellspacing="0" cellpadding="0"
            style="margin:28px auto;">
            <tr>
              <td align="center" bgcolor="#0284c7" style="border-radius:8px;">
                <a href="${link}"
                  style="display:inline-block; padding:15px 30px; color:#ffffff;
                  text-decoration:none; font-size:15px; font-weight:bold;">
                  Verify Email Address
                </a>
              </td>
            </tr>
          </table>

          <p style="font-size:14px; line-height:1.8; color:#64748b;">
            If the button doesn't work, copy and paste the following link
            into your browser:
          </p>

          <p style="font-size:13px; line-height:1.7; word-break:break-all;">
            <a href="${link}" style="color:#0284c7;">
              ${link}
            </a>
          </p>

          <p style="font-size:14px; line-height:1.8; color:#64748b;">
            If you didn't create this account, you can safely ignore this email.
          </p>

        </td>
      </tr>

      <tr>
        <td align="center"
          style="padding:20px; background-color:#f8fafc; color:#94a3b8; font-size:12px;">
          &copy; ${new Date().getFullYear()} Saraha. All rights reserved.
        </td>
      </tr>

    </table>

  </td>
</tr>

  </table>

</body>
</html>`