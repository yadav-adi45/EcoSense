export const welcomeEmail = (name) => {
  return `
  <div style="font-family: Arial, sans-serif; background:#f4f7f6; padding:30px">
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden">
      
      <div style="background:linear-gradient(135deg,#1db954,#1fa8a1); padding:20px; text-align:center">
        <h1 style="color:#ffffff; margin:0">🌱 Welcome to EcoSense</h1>
      </div>

      <div style="padding:30px; color:#333333">
        <h2 style="margin-top:0">Hi ${name},</h2>

        <p>
          Welcome to <b>EcoSense</b> — your environment-friendly companion 🌍
        </p>

        <p>
          You’ve successfully joined a community that believes in:
        </p>

        <ul>
          <li>🌿 Sustainable living</li>
          <li>🌍 Cleaner environment</li>
          <li>♻️ Smarter eco-choices</li>
        </ul>

        <p>
          Start exploring EcoSense and take your first step toward a
          <b>greener, healthier future</b>.
        </p>

        <div style="text-align:center; margin:30px 0">
          <a href="https://ecosense-8.onrender.com"
             style="background:#1db954; color:white; padding:12px 24px;
                    border-radius:8px; text-decoration:none; font-weight:bold">
            Explore EcoSense 🌱
          </a>
        </div>

        <p style="font-size:14px; color:#666">
          Together, we can make a difference — one step at a time.
        </p>

        <p style="margin-bottom:0">
          💚 Team EcoSense
        </p>
      </div>
    </div>
  </div>
  `;
};