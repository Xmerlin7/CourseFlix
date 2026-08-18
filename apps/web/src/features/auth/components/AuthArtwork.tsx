import loginHero from '../assets/login-hero.webp'

/**
 * Decorative showcase image for the auth split-screen.
 *
 * The colour adaptation lives in auth.css overlays so the photograph remains
 * natural while the surrounding light follows the user's selected accent.
 */
export function AuthArtwork() {
  return (
    <img
      className="cfa-art"
      src={loginHero}
      alt=""
      aria-hidden="true"
      loading="eager"
      decoding="async"
    />
  )
}
