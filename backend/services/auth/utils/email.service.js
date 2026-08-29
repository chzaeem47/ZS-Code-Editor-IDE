import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },
});

export const sendWelcomeEmail = async ({ email, username }) => {

    console.log("=================================");
    console.log("📧 Sending welcome email...");
    console.log("To:", email);
    console.log("Username:", username);
    console.log("From:", process.env.EMAIL_USER);
    console.log("=================================");

    try {

        const info = await transporter.sendMail({

            from: `"Zs Code" <${process.env.EMAIL_USER}>`,

            to: email,

            subject: "Welcome to Zs Code 🚀",

            html: `
<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>

<body style="
    margin:0;
    padding:0;
    background:#f4f7fb;
    font-family:Arial,Helvetica,sans-serif;
">

<div style="
    max-width:600px;
    margin:40px auto;
    background:#ffffff;
    border-radius:16px;
    overflow:hidden;
    box-shadow:0 10px 30px rgba(0,0,0,0.08);
">

    <div style="
        background:#111827;
        padding:32px;
        text-align:center;
    ">

        <h1 style="
            margin:0;
            color:#ffffff;
            font-size:30px;
        ">
            Zs Code
        </h1>

        <p style="
            margin:10px 0 0;
            color:#9ca3af;
            font-size:14px;
        ">
            Build. Learn. Create.
        </p>

    </div>

    <div style="padding:40px 32px;">

        <h2 style="
            margin-top:0;
            color:#111827;
        ">
            Welcome to Zs Code, ${username}! 🎉
        </h2>

        <p style="
            color:#4b5563;
            font-size:16px;
            line-height:1.7;
        ">
            We're excited to have you with us.
            Your account has been successfully created.
        </p>

        <div style="
            background:#f9fafb;
            border:1px solid #e5e7eb;
            border-radius:10px;
            padding:20px;
            margin:25px 0;
        ">

            <p style="
                margin:0 0 8px;
                color:#6b7280;
            ">
                Username
            </p>

            <strong style="
                color:#111827;
                font-size:18px;
            ">
                ${username}
            </strong>

        </div>

        <p style="
            color:#4b5563;
            font-size:15px;
            line-height:1.7;
        ">
            Thank you for choosing Zs Code.
            We look forward to building great things together.
        </p>

        <p style="
            color:#111827;
            margin-top:35px;
            font-weight:bold;
        ">
            Best regards,<br>
            Zaeem Ahmad<br>

            <span style="
                color:#6b7280;
                font-weight:normal;
            ">
                CEO, Zs Code
            </span>
        </p>

    </div>

</div>

</body>
</html>
            `,
        });

        console.log("✅ Email sent successfully!");
        console.log("Message ID:", info.messageId);

        return info;

    } catch (error) {

        console.error("❌ Email sending failed!");
        console.error("Error:", error);

        throw error;
    }
};