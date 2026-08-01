/* Social handles in one place. These were hardcoded in three separate files, so the
   Instagram URL was already wrong in all of them and would have gone stale one file
   at a time. The admin Settings page also stores an `instagram` field, but nothing on
   the storefront reads it — these constants are what actually render. */

export const INSTAGRAM_HANDLE = "madhuranaturals_";
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;
export const FACEBOOK_URL = "https://facebook.com/madhuranaturals";
export const YOUTUBE_URL = "https://youtube.com/@madhuranaturals";
