export const acctivateSuccess=()=>{
   return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verified</title>
        <style>
            * {
                box-sizing: border-box;
            }

            body {
                margin: 0;
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: Arial, sans-serif;
                background: #f1f5f9;
            }

            .card {
                width: min(90%, 420px);
                padding: 40px 25px;
                text-align: center;
                background: white;
                border-radius: 16px;
                box-shadow: 0 10px 35px rgba(0, 0, 0, 0.08);
            }

            .icon {
                width: 70px;
                height: 70px;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background: #dcfce7;
                color: #16a34a;
                font-size: 36px;
            }

            h1 {
                color: #0f172a;
                font-size: 25px;
            }

            p {
                color: #64748b;
                line-height: 1.7;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="icon">&#10003;</div>
            <h1>Email Verified!</h1>
            <p>Your email has been verified successfully.</p>
            <p>Your account is now active. You can return to the application and log in.</p>
        </div>
    </body>
    </html>
`;
}