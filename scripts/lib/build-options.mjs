// What `slide-ng build` tells the generator, through environment variables (the generator is a separate process).
//   SLIDE_NG_BUILD=1          this is a production build (remote assets are downloaded)
//   SLIDE_NG_BASE=/talk/      the path the deck is served under
//   SLIDE_NG_DOWNLOAD=1       --download: the nav bar offers the PDF even if the headmatter does not say so
//   SLIDE_NG_WITHOUT_NOTES=1  --without-notes: speaker notes are left out of the build
export function buildOptions(env = process.env) {
  return {
    building: env.SLIDE_NG_BUILD === '1',
    base: env.SLIDE_NG_BASE || '/',
    download: env.SLIDE_NG_DOWNLOAD === '1',
    withoutNotes: env.SLIDE_NG_WITHOUT_NOTES === '1',
  };
}

/** `remoteAssets` in the headmatter: true (always), `build` or `dev`. Downloading happens only in a build. */
export function wantsRemoteAssets(headmatter, building) {
  const v = headmatter.remoteAssets;
  return building && (v === true || v === 'build');
}
