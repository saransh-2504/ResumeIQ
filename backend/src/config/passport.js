import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import { env } from "./env.js";

// ---- GOOGLE STRATEGY ----
passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${env.SERVER_URL}/api/v1/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        // Block recruiters from using OAuth
        const existing = await User.findOne({ email });
        if (existing && existing.role === "recruiter") {
          return done(null, false, { message: "recruiter_oauth_blocked" });
        }

        // Find or create user
        let user = existing;
        if (!user) {
          user = await User.create({
            name,
            email,
            oauthProvider: "google",
            oauthId: profile.id,
            role: "candidate",
            isVerified: true,
            isApproved: true,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;
