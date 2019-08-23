import fetch from "isomorphic-unfetch";
const queryString = require("query-string");

export function apiRequest(spotifyApiClient: any): Function {
  return async (
    url: string,
    params?: { [k: string]: any },
    formatter?: Function
  ): Promise<any> => {
    const qs = queryString.stringify(params || {});
    const res = await fetch(url + (qs ? `?${qs}` : ""), {
      headers: {
        Authorization: `Bearer ${spotifyApiClient._credentials.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      }
    });

    if (res.status === 200) {
      const json = await res.json();
      return !!formatter ? formatter(json) : json;
    }

    try {
      const json = await res.json();
      if (json.error) {
        throw json.error;
      }
    } catch (e) {}

    throw new Error("Unexpected error in apiRequest");
  };
}
