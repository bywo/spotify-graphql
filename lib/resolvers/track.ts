import { safeApiCall, syncedPoll } from "../utils";
import * as _ from "lodash";

export function trackResolvers(spotifyApiClient) {
  return {
    artists(track: any, variables: any) {
      if (!!variables.full) {
        return syncedPoll(
          "Track.artists",
          async () => {
            // This part is hacky.
            //  Since Spotify Web API do not provide album
            //  /track/:id/artists, we need to call
            //  /artists?ids=... by chunk of 50 ids.
            let queries: any = _(track.artists)
              .map("id")
              .compact()
              .chunk(50)
              .map((idsToQuery: any[]) => {
                return (): Promise<any> => {
                  return safeApiCall(
                    spotifyApiClient,
                    "getArtists",
                    response => response.body.artists,
                    idsToQuery
                  );
                };
              });

            const results = [];
            for (const q of queries) {
              results.push(...(await q()));
            }
          },
          variables.throttle || 5
        );
      } else {
        return track.artists;
      }
    },
    // an artist can have a large amount of albums,
    //   so we use `limitConcurency()` helper to avoid
    //   massive API calls at once
    album(track, variables) {
      if (!!variables.full) {
        return syncedPoll(
          "Track.album",
          () => {
            return safeApiCall(
              spotifyApiClient,
              "getAlbum",
              null,
              track.album.id
            ).then(album => {
              return album;
            });
          },
          variables.throttle || 5
        );
      } else {
        return Promise.resolve(track.album);
      }
    },

    audio_features(track) {
      return safeApiCall(
        spotifyApiClient,
        "getAudioFeaturesForTrack",
        null,
        track.id
      );
    }
  };
}
