const coldStartErrorCodes = new Set(['ECONNABORTED', 'ETIMEDOUT']);
const coldStartMessageFragments = ['timeout', 'Network Error', 'fetch failed'];

/**
 * Determine if an error was most likely triggered by a server cold start or network timeout.
 * This helps the UI decide whether to retry the request automatically or show a tailored message.
 */
export const isColdStartError = (error) => {
  const message = error?.message?.toLowerCase() ?? '';

  if (coldStartErrorCodes.has(error?.code)) {
    return true;
  }

  return coldStartMessageFragments.some((fragment) =>
    fragment && message.includes(fragment.toLowerCase())
  );
};
