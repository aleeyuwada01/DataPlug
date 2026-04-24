import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

// ─── Passport LocalStrategy (phone + password) ──────────────────────────────
passport.use(
  new LocalStrategy(
    { usernameField: "phone", passwordField: "password" },
    async (phone, password, done) => {
      try {
        const formattedPhone = phone.startsWith("+234") ? phone : `+234${phone.replace(/^0/, "")}`;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.phone, formattedPhone))
          .limit(1);

        if (!user) {
          return done(null, false, { message: "Invalid phone number or password" });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          return done(null, false, { message: "Invalid phone number or password" });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ─── Serialize / Deserialize ─────────────────────────────────────────────────
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) return done(null, false);

    // Strip sensitive fields before attaching to session
    const { passwordHash, pinHash, ...safeUser } = user;
    done(null, safeUser);
  } catch (err) {
    done(err);
  }
});

export default passport;
